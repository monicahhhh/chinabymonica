# DeepSeek-V4 技术报告深度解析

> 原文：《DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence》
> 来源：DeepSeek-AI 官方预览版技术报告（共 58 页）
> 作者：DeepSeek-AI 团队（research@deepseek.com）
> 模型权重：https://huggingface.co/collections/deepseek-ai/deepseek-v4

---

## 一、核心定位：用"效率革命"打开百万 token 上下文的大门

DeepSeek-V4 的主题只有一个字——"**效**"。过去两年开源社区与闭源前沿模型的竞赛，主要集中在"更强推理"和"更大规模"，而 V4 把 **"把百万级上下文做到能用、能训、能部署"** 作为第一目标，直接挑战 Transformer 最本质的二次复杂度瓶颈。

报告一开始就给出三个让人印象深刻的数字：

| 指标 | DeepSeek-V3.2 对比 | DeepSeek-V4-Pro | DeepSeek-V4-Flash |
|---|---|---|---|
| 1M 上下文下单 token 推理 FLOPs | 100% | **27%** | **10%** |
| 1M 上下文下累计 KV Cache 大小 | 100% | **10%** | **7%** |
| 对比 BF16 GQA8 baseline 的 KV cache | 100% | ~2% | ~2% |

换言之，V4-Pro 即使激活参数更多，在一百万 token 场景下仍比 V3.2 **省 3.7 倍算力、9.5 倍 KV cache**；V4-Flash 则把 KV cache 压到了约 **1/14**。这不是常规意义上的优化，而是一次架构层面的重构。

---

## 二、两款旗舰模型：同一架构的不同体量

| 模型 | 总参数 | 激活参数 | 层数 | hidden dim | Routed Experts | 激活 Experts | 训练 tokens |
|---|---|---|---|---|---|---|---|
| **DeepSeek-V4-Pro** | 1.6T | 49B | 61 | 7168 | 384 | 6 | 33T |
| **DeepSeek-V4-Flash** | 284B | 13B | 43 | 4096 | 256 | 6 | 32T |

两者都原生支持 **1M token 上下文**，都采用 MoE，都配套三档"思考强度"（Non-think / Think High / Think Max）。V4-Pro-Max 定位为"开源旗舰"，V4-Flash-Max 定位为"高性价比推理引擎"。

---

## 三、四大核心技术创新

### 3.1 Hybrid Attention：CSA + HCA 交错堆叠

这是整篇论文最重要的一章，也是效率革命的底层发动机。V4 设计了两种互补的注意力机制，然后**交错使用**（interleaved），而不是简单选其一。

#### (1) CSA（Compressed Sparse Attention）——"先压缩、再稀疏"

CSA 把两种主流的长文本加速思路合二为一：

- **压缩阶段**：每 m 个 token 的 KV 被压缩成 1 个 entry（V4 中 m = 4）。采用了一种带"前后重叠"的对偶键值流（Cₐ、Cᵦ），通过可学习的位置偏置 + softmax 权重，把 2m 个 KV 合成 1 个代表 entry。这不是平均池化，而是一种可学习、带位置感知的"KV 摘要"。
- **稀疏阶段**：在压缩后的 KV 序列上再套一层 DeepSeek Sparse Attention (DSA)，通过 **Lightning Indexer**（独立的低秩查询 + ReLU 相似度 + top-k 选择器）挑选出最相关的压缩块，只让查询 token 对这些块做稠密注意力。
- **滑动窗口补丁**：因为压缩必然丢失细节、再稀疏又可能忽略近邻，V4 单独加了一条小规模 sliding window 分支（窗口大小 n_win=128），保证局部依赖不被破坏。
- **Attention Sink**：给每个 attention head 加一个可学习的 sink logit，让 head 可以"主动放弃注意"（总注意力和 < 1），从 LLaMA/MistralStreaming 里借来的老招式，依旧好用。

这就是为什么 CSA 能把 KV cache 长度压到 1/m，同时每个 query 只看 top-k 个压缩块，算力消耗线性可控。

#### (2) HCA（Heavily Compressed Attention）——"极端压缩 + 稠密注意力"

CSA 的 m=4 属于温和压缩；HCA 用的是 **m′ = 128**——把 128 个 token 的 KV 压成 1 条。既然压得这么狠，就**不再做稀疏**，而是对压缩后的极短序列做完整的稠密注意力。HCA 的结构相对简单（无 indexer、无 top-k），但压缩比惊人。

#### (3) 为什么要"混合"？

两者能力互补：
- **CSA** = "细看近处"：压缩适中，但通过稀疏选择+滑窗抓住关键细节，更适合需要精确检索的任务（例如 MRCR 大海捞针）。
- **HCA** = "远看全局"：极端压缩后形成非常短的全局摘要，每层都能"扫一眼"整个上下文，弥补 CSA 稀疏选择可能的漏选。

V4 把它们**按层交错**：V4-Flash 开头两层是纯 SWA，之后 CSA / HCA 交替；V4-Pro 开头两层是 HCA，之后交替。这种分层混合让每个 token 在整个网络里既被"细看过"又被"全局看过"。

#### (4) 精度策略：混合 BF16 + FP8 + FP4

V4 对注意力模块采用了**三级精度**存储/计算：
- RoPE 维度保留 BF16（位置信息敏感，不敢动精度）
- KV 其他维度用 FP8（KV cache 体积直接减半）
- Lightning Indexer 的 QK 路径用 FP4（稀疏选择是 top-k，不需要很精确）

再配合 CSA/HCA 自身的长度压缩，KV cache 总大小被压到 GQA8 BF16 baseline 的约 **2%**。这才是"百万上下文能常态化支持"的真正原因。

---

### 3.2 mHC：Manifold-Constrained Hyper-Connections（流形约束的超连接）

Hyper-Connection（HC）是近一两年逐渐兴起的技术——把 residual stream 从 R^d 扩展到 R^(n_hc × d)，通过三个线性映射 A_l、B_l、C_l 动态控制层间残差。问题在于堆深就容易数值爆炸。

V4 的创新是把 residual mapping 矩阵 **B_l 限制到双随机矩阵（Birkhoff 多胞形）流形** 上：

```
B_l ∈ M := { M ∈ R^{n×n} | M·1_n = 1_n, 1_n^T·M = 1_n^T, M ≥ 0 }
```

这样做的直接好处：
1. ‖B_l‖₂ ≤ 1，映射是**非扩张的**（non-expansive），前向和反向都不会把信号放大 → 数值稳定。
2. 集合 M 在乘法下闭合 → 深堆叠时稳定性可复合，适合深模型。
3. A_l、C_l 用 Sigmoid 限幅 + 非负约束，避免信号抵消。

B_l 通过 **Sinkhorn-Knopp 迭代**（20 次）投影到流形上（先 exp，再交替行/列归一化）。整体参数是"动态（输入相关）+ 静态"分解：α·(X·W) + S。

**工程代价**：mHC 增加了激活内存和流水线通信量。团队用"融合 kernel + 细粒度 tensor-level 重算 + DualPipe 1F1B overlap"组合拳把时钟开销压到 1F1B stage 的 **6.7%**。

> 读者价值：mHC 给想训 100+ 层超深模型的人提供了一个"理论上有保障、实操上可用"的 residual 升级方案。

---

### 3.3 Muon 优化器：大规模替换 AdamW

V4 把**绝大多数参数**从 AdamW 换成 Muon，仅保留 AdamW 用于 embedding、LM head、RMSNorm、mHC 静态偏置与门控因子。

Muon 的核心逻辑：
1. 累积动量 M_t
2. 用 **Nesterov 修正** + **混合 Newton–Schulz 迭代** 对 (μM_t + G_t) 做近似正交化（把所有奇异值拉到 1 附近）
3. 按 √max(n,m)·γ 重标定更新 RMS，让 Muon 的学习率和 AdamW 共用超参
4. 权重衰减 + 更新

V4 的两点工程创新：
- **混合 Newton-Schulz**：前 8 步用激进系数 (3.4445, -4.7750, 2.0315) 快速收敛；后 2 步切到温和系数 (2, -1.5, 0.5) 把奇异值稳准地钉在 1。既快又稳。
- **ZeRO × Muon 的妥协**：Muon 必须用完整梯度矩阵，和 ZeRO 原生冲突。团队用**背包算法分配桶 + 对 MoE 参数扁平化 + BF16 随机舍入梯度同步 + all-to-all + 本地 FP32 累加**的组合，额外开销 <10% 显存，通信量减半。

Muon 的收益：**更快的收敛 + 更稳的训练 + QK-Clip 可以被省掉**（因为 V4 的注意力结构允许直接对 Q/K 做 RMSNorm 防爆）。

---

### 3.4 DeepSeekMoE 延续 + Hash 路由开头几层

V4 保留了 V3 的 MoE 范式（fine-grained routed + shared expert + auxiliary-loss-free balance），但做了几处**关键修改**：

1. Affinity 打分函数从 **Sigmoid** 换成 **Sqrt(Softplus(·))**——实践证明更稳。
2. **取消 routing target nodes 数量约束**（V3 会限制跨节点数），重新设计并行策略补偿。
3. **开头 3 层 MoE 用 Hash Routing**——根据 token ID 的 hash 直接决定专家，避免早期浅层路由未学好时的不稳定。
4. MTP 深度 1，沿用 V3 的多 token 预测策略。

---

## 四、基础设施：让"百万上下文训练"成为可能

这一章报告写得非常详细，可以说是 DeepSeek 把自己沉淀的"模型 × 工程"能力向外展示的总汇。

### 4.1 MoE 通信-计算细粒度重叠

在 Expert Parallelism 里，Dispatch / Combine 是通信，Linear-1 / Linear-2 是计算。V4 不像 Comet 只做粗粒度重叠，而是把一次 MoE 层拆成 **3 个 expert wave** 流水，每个 wave 里通信藏在前一 wave 的计算后面。**理论加速 1.92×**（Comet 是 1.42×），并且允许 **互联带宽更低**——这直接降低硬件门槛。

### 4.2 TileLang DSL

自研领域专用语言，平衡开发效率与运行效率，替代手写 CUDA。

### 4.3 Batch-Invariant 确定性 kernel 库

保证训练 / 推理 / RL rollout **bitwise 可复现**。对 RL 和 on-policy distillation 这种依赖"当前策略"的算法，这一点是关键——否则 rollout 和训练数值不一致会毁掉整个优化方向。

### 4.4 FP4 量化感知训练 (QAT)

MoE 专家权重和 indexer QK 路径都用 FP4。前向 simulated quantization，反向梯度通过 STE 传到 FP32 master weights。RL rollout 时直接用真实 FP4 权重，确保训练/部署行为完全一致。虽然当前硬件 FP4×FP8 的峰值 FLOPs 和 FP8×FP8 一样，但未来硬件理论上可做到 **1/3 更高效**，V4 已经准备好了。

### 4.5 Tensor-Level Activation Checkpointing

V4 扩展了 autograd 框架，让开发者只需在 forward 里"标注几个张量"就能自动重算。底层用 TorchFX 追踪完整计算图，对每个标注张量做反向遍历找到最小重算子图。做到"零多余开销 + 自动去重共享存储"。

### 4.6 Contextual Parallelism（两阶段通信）

长上下文下传统 CP 无法处理"跨 rank 边界的 m 个 token 压缩"。V4 的两阶段方案：
1. 每个 rank 把最后 m 个未压缩 KV 发给下一个 rank
2. 下一个 rank 合并压缩 → all-gather → 融合的 select-and-pad kernel 重组

### 4.7 异构 KV Cache + 磁盘存储

三种 on-disk SWA 策略（Full Caching / Periodic Checkpointing / Zero Caching）让用户在"存储成本 vs 重算成本"之间任意切换，尤其适合 shared-prefix reuse 场景（多轮对话、多 agent 共享系统 prompt）。这是 V4 能把 1M 上下文做成 **可商用** 的关键一环。

### 4.8 DSec：生产级 Agentic AI 沙箱平台

基于 3FS 分布式文件系统的 Rust 实现，四种执行基质（Function Call / Container / microVM / fullVM）共用一套 Python SDK，**单集群可管数十万并发沙箱**，分层 EROFS / overlaybd 镜像按需加载，支持抢占后从 trajectory log 断点续跑。这是"RL × 真实工具环境"训练的基础设施。

---

## 五、预训练与训练稳定性

### 5.1 数据

- **32T+ tokens 多元高质量语料**，在 V3 的基础上强化：
  - Web 数据过滤批量自动生成/模板化内容（防 model collapse）
  - 长文档（科学论文、技术报告）被显式加权
  - 更大的多语言语料，提升长尾文化知识
  - 中期训练加入 **agentic data** 提升编码能力

### 5.2 训练配置（高度工程化）

- 从 4K 序列逐步扩到 16K → 64K → 1M
- 前 1T tokens 用 dense attention 做 warmup，之后在 64K 长度处引入稀疏注意力
- Batch size 调度：V4-Flash 最大 75.5M / V4-Pro 最大 94.4M tokens
- 学习率：V4-Flash 峰值 2.7e-4，V4-Pro 2.0e-4，余弦衰减到 1/10
- Auxiliary-loss-free 平衡 + 小权重 sequence balance loss
- MTP 权重 0.3，衰减期降到 0.1

### 5.3 两个极其实用的"稳定性秘方"

团队坦承在训练万亿参数 MoE 时频繁遇到 loss spike（尖峰）。根因是 **MoE 层的 outlier + 路由机制互相加剧**。他们发现两个方法非常有效，值得整个社区关注：

#### (a) Anticipatory Routing（前瞻路由）

把**特征计算**和**路由决策**解耦：step t 用当前参数 θ_t 做特征，但路由索引用 θ_{t-Δt}（提前一步预计算并缓存）。异步化打破了"特征→outlier→路由→更多 outlier"的恶性循环。
- 工程层面的关键：提前一步预读数据，重叠 EP 通信，额外开销约 20% 时钟时间
- 自动检测机制：只在发生 loss spike 时临时启用，稳定后自动关闭 → 整体额外开销可以忽略不计

#### (b) SwiGLU Clamping

对 SwiGLU 的 linear 分量限制到 [-10, 10]，gate 分量上限 10。简单但有效，直接消除 outlier。

> 🧠 **值得记录**：V4 对这两招的机理坦诚写道"理论上仍不完全理解"，并鼓励社区研究。这种坦率态度在当前"包装过度"的技术报告里尤其可贵。

---

## 六、后训练：Specialist × On-Policy Distillation 的新范式

V4 最大的方法论转变：**用 On-Policy Distillation (OPD) 代替混合 RL**。

### 6.1 流程

```
    [Base Model]
         │
    SFT (领域高质量数据)
         │
    GRPO RL (数学 / 编程 / agent / 指令跟随，各一个 expert)
         │
    ┌────────────┐
    │ N 个 expert │
    └────────────┘
         │
    On-Policy Distillation (多教师)
         │
    [Unified Final Model]
```

Student 在自己生成的 trajectory 上学习"reverse KL"，由多个 teacher 提供分布目标。这种方式的好处：
- 真·on-policy，不会蒸馏偏移
- 避免传统 RL 合并多任务时的相互干扰
- 训练过程可以**共享 KV cache、批量推理**，大幅节省算力

### 6.2 Generative Reward Model (GRM)

V4 彻底抛弃**标量 reward model**，转而让 actor 网络自己充当 GRM：
- 用 rubric-guided（评分准则导向）的 RL 数据
- 直接对 GRM 做 RL 优化
- 评估能力和生成能力**联合训练**——模型的推理能力被自然融入到评分过程里
- 人标数据用量大幅下降（"minimal set of diverse human annotations"）

### 6.3 三档思考强度（Reasoning Effort）

| 模式 | 典型场景 | 格式 |
|---|---|---|
| **Non-think** | 日常问答、低风险决策 | `</think>` summary（空 think） |
| **Think High** | 复杂问题、规划 | `<think>...</think>` summary |
| **Think Max** | 推理边界探索 | 系统 prompt 前置专门指令 + `<think>...</think>` |

"Think Max" 的系统提示词很有意思，几乎是直接在提示词里"逼"模型输出穷举式推理：
> "Reasoning Effort: Absolute maximum with no shortcuts permitted. You MUST be very thorough in your thinking and comprehensively decompose the problem to resolve the root cause, rigorously stress-testing your logic against all potential paths, edge cases, and adversarial scenarios..."

### 6.4 Tool-Call：XML 格式 + 特殊 token

V4 换掉了 JSON 工具调用，改用带 **`|DSML|`** 特殊 token 的 XML 风格格式。
- 解决 JSON 转义失败问题
- 降低 tool-call 错误率
- 与 `<think>` 配合，支持思考过程里穿插工具调用

### 6.5 Interleaved Thinking（跨轮次保留思考轨迹）

V3.2 里每次用户新消息都清空 `<think>` 内容；V4 在**工具调用场景**下**完整保留所有思考历史**（跨用户消息边界也保留），让模型在长 agent 任务中保持累积推理链。而纯聊天场景仍维持"每轮清空"。这是 1M 上下文窗口真正能被 agent 利用起来的关键。

### 6.6 Quick Instruction

把"是否触发搜索、意图识别"这类辅助任务用特殊 token 拼到输入末端，直接**复用现有 KV cache** 并行执行 → 省掉独立小模型 prefill，显著降低 TTFT（首 token 时延）。

### 6.7 百万 token RL 基础设施的工程亮点

- **WAL（Write-Ahead Log） + 持久化 KV cache**：rollout 被抢占后可从断点恢复，不用重跑 prefill。报告强调 **"从头再生成会引入长度偏差"**（短回复更容易被保留，模型会被偏向输出短回复），所以必须断点恢复。这一分析很有洞察力。
- **Metadata / 重字段解耦 + shared-memory dataloader**：把 rollout 数据按 per-token vs metadata 分层存取，mini-batch 粒度释放显存。

---

## 七、评测结果：一张表看清位置

### 7.1 Base Model 对比（纯预训练）

| Benchmark | V3.2-Base (37B act) | V4-Flash-Base (13B act) | V4-Pro-Base (49B act) |
|---|---|---|---|
| MMLU-Pro | 65.5 | 68.3 | **73.5** |
| Simple-QA verified | 28.3 | 30.1 | **55.2** |
| FACTS Parametric | 27.1 | 33.9 | **62.6** |
| HumanEval | 62.8 | 69.5 | **76.8** |
| MATH | 60.5 | 57.4 | **64.5** |
| LongBench-V2 | 40.2 | 44.7 | **51.5** |

**关键观察**：V4-Flash-Base（13B 激活）在大多数指标上已超越 V3.2-Base（37B 激活）——相同能力用 1/3 激活参数就能做到。V4-Pro-Base 则几乎全面碾压。

### 7.2 Instruction-Tuned 旗舰对比（V4-Pro-Max vs 国际前沿）

| Benchmark | Opus-4.6 | GPT-5.4 | Gemini-3.1-Pro | K2.6 | GLM-5.1 | **V4-Pro-Max** |
|---|---|---|---|---|---|---|
| SimpleQA-Verified | 46.2 | 45.3 | **75.6** | 36.9 | 38.1 | **57.9** |
| Chinese-SimpleQA | 76.4 | 76.8 | **85.9** | 75.9 | 75.0 | **84.4** |
| LiveCodeBench | 88.8 | - | 91.7 | 89.6 | - | **93.5** |
| Codeforces Rating | - | 3168 | 3052 | - | - | **3206** |
| HMMT 2026 Feb | **96.2** | 97.7 | 94.7 | 92.7 | 89.4 | 95.2 |
| IMOAnswerBench | 75.3 | 91.4 | 81.0 | 86.0 | 83.8 | 89.8 |
| Apex Shortlist | 85.9 | 78.1 | 89.1 | 75.5 | 72.4 | **90.2** |
| MRCR 1M | **92.9** | - | 76.3 | - | - | 83.5 |
| CorpusQA 1M | **71.7** | - | 53.8 | - | - | 62.0 |
| SWE Verified | 80.8 | - | 80.6 | 80.2 | - | 80.6 |
| Terminal Bench 2.0 | 65.4 | **75.1** | 68.5 | 66.7 | 63.5 | 67.9 |

**关键结论**：
- **开源之王**：V4-Pro-Max 在 SimpleQA-Verified、LiveCodeBench、Codeforces、Apex Shortlist 上都是目前最强开源模型，Codeforces 评分 3206 在人类选手中排名约第 23 位。
- **追赶前沿**：在 SimpleQA-Verified 上对 Gemini-3.1-Pro 还落后 ~18 pts，说明纯知识储备仍是差距所在。
- **长文本**：在 MRCR 和 CorpusQA 上胜过 Gemini-3.1-Pro，但败给 Claude Opus 4.6。
- **Agent**：SWE Verified 和 Claude Opus 4.6 / Gemini-3.1-Pro 基本打平；Terminal Bench 落后 GPT-5.4 但持平其他开源。
- **数学**：Putnam-2025 formal reasoning 拿到 **120/120 满分**，和 Axiom 并列第一。

### 7.3 落地型评测

- **中文写作**：V4-Pro vs Gemini-3.1-Pro 在常规写作上 **胜率 62.7%**，创意写作质量 **胜率 77.5%**，最难场景仍稍逊 Claude Opus 4.5。
- **白领任务**：30 个跨 13 行业（金融/法律/教育/科技等）的中文专业任务，人类盲评，V4-Pro-Max **对 Opus-4.6-Max 非败率 63%**。
- **R&D 编码**（内部真实工程任务 30 条）：V4-Pro-Max 67%、Opus 4.5 Thinking 73%、Opus 4.6 Thinking **80%**。内部 85 人调研，**52% 工程师愿意把 V4-Pro 作为日常主力编程模型**，另有 39% 倾向是，仅 <9% 明确反对。

---

## 八、整篇报告的 4 个深层判断

### 判断 1：DeepSeek 正在从"参数效率"进入"系统效率"时代

V3 时代的核心关键词是 **"参数激活量"**（MoE + 稀疏激活 + MLA）。V4 的核心关键词是 **"上下文能效"**——即"每个 token 的 KV 体积 / 每个 token 的 FLOPs"。在推理模型时代，**长 CoT、长工具轨迹、长文档分析** 都把计算从"参数侧"推向了"序列侧"，V4 是对这个转变的正面回应。

V3.2 的 DSA 只是在稀疏选择层面下功夫；V4 真正把**压缩 × 稀疏 × 滑窗 × 低精度 × 磁盘持久化**五位一体地整合，形成一个**端到端可部署的 1M 上下文系统**。

### 判断 2：与前沿闭源的差距仍在 3-6 个月，但差距性质变了

报告直言："developmental trajectory that trails state-of-the-art frontier models by approximately 3 to 6 months"。但有意思的是：
- 在**硬推理任务（HMMT、IMO、Codeforces、LiveCodeBench）**，V4-Pro-Max 与 Gemini-3.1-Pro、GPT-5.4 **基本持平甚至领先**。
- 在**知识类基准（SimpleQA、MMLU-Pro）**，V4 对 Gemini-3.1-Pro 仍有较大差距。

这说明：**差距不再是"推理能力"问题，而是"数据规模 × 知识广度"问题**。对于应用开发者，这意味着在"推理密集型任务"上选 DeepSeek-V4 已经没有性能顾虑；但在"长尾事实召回"上，Gemini-3.1 仍是首选。

### 判断 3：On-Policy Distillation 可能成为后训练新主流

V4 用 OPD 替代传统 RL merge 的做法非常值得关注。传统多任务 RL 必须同时调奖励、处理任务间互相干扰、担心 catastrophic forgetting；OPD 只要你分别训好几个 specialist，merge 阶段只是让 student 在自己 trajectory 上学 teacher 分布的 reverse KL。配合 GRM 做 reward-less 评估、Batch-invariant kernel 保证 rollout = 训练一致、异步 teacher scheduling 摊平显存——这是一套**标准化、可规模化**的后训练流水线。

### 判断 4：DeepSeek 的"基建叙事"同样重要

很多读者会盯着架构创新看，但报告的第 3 章（General Infrastructures）加第 5.2 节（RL Infra）占了将近 20 页。里面对 **TileLang DSL、FP4 QAT、3FS 文件系统、DSec 沙箱、Tensor-level checkpointing** 的描述，几乎就是"如果你是头部基础模型公司，这套 stack 你都要有"的全景示范。这些工程能力才是让架构创新真正能"跑在 10 万卡集群上 × 跑在万亿参数 × 跑在百万 token 上"的关键。

---

## 九、局限与未来方向（作者自陈）

报告第 6 章少见地坦诚：

1. **架构复杂度偏高**：为了降低风险保留了大量"已验证但非最小必要"的组件，未来会做 "principled distillation" 把架构简化。
2. **Anticipatory Routing 和 SwiGLU Clamping 的理论机理待解**——承认"it works but we don't fully understand why"。
3. **Agent 能力短板**：Terminal Bench 2.0 输给 GPT-5.4，R&D 编码整体仍落后 Claude Opus 4.6 Thinking（80% vs 67%）；指令细节遵循有时不如 Opus。
4. **多模态缺席**：V4 仍是纯文本模型，明确列为"正在做"。
5. **更稀疏的 embedding**（"conditional memory via scalable lookup"）、**更低延迟架构** 是下一步探索方向。

---

## 十、对从业者的启示（实用视角）

1. **架构研究者**：mHC（流形约束 + Sinkhorn-Knopp）是一个非常优雅的 residual 升级，值得在自己模型上实验。CSA + HCA 的混合思路比单纯 MoBA/NSA 更系统，可借鉴分层混合策略。
2. **做长上下文产品的团队**：关注报告 3.6 节的 **"异构 KV cache + on-disk storage"** 方案。多轮对话、agent 共享 system prompt、IDE 类工具在这套方案下的成本可能降一个数量级。
3. **后训练工程师**：**Specialist → OPD** 的流水线能有效解决"多能力合并变弱"问题，且对 RL 超参不敏感，值得尝试。GRM（actor 自己当 reward model）进一步降低了 reward engineering 成本。
4. **训练稳定性**：如果你在训 MoE 且遇到 loss spike，**Anticipatory Routing 是个可插拔的急救包**（只在 spike 时激活），SwiGLU Clamping 近乎零成本。
5. **开源生态**：V4-Flash（284B 总参 / 13B 激活）是"可落地推理"的一个甜点，配合 FP8 存储和 V4 的磁盘 KV cache，部署成本将明显低于 V3。

---

## 附：关键数字速查表

| 维度 | 数值 |
|---|---|
| V4-Pro 参数 | 1.6T total / 49B activated / 61 layers / 7168 hidden |
| V4-Flash 参数 | 284B total / 13B activated / 43 layers / 4096 hidden |
| 预训练数据 | 32T+ tokens |
| 原生上下文 | 1,000,000 tokens |
| 词表大小 | 128K |
| CSA 压缩率 m | 4 |
| HCA 压缩率 m′ | 128 |
| CSA top-k | 512 (Flash) / 1024 (Pro) |
| Sliding window 大小 | 128 |
| Sinkhorn-Knopp 迭代次数 | 20 |
| Newton-Schulz 迭代 | 10（8+2 两段） |
| mHC 扩展因子 | 4 |
| Expert 总数 | 256 (Flash) / 384 (Pro) |
| 激活 experts / token | 6 |
| Hash routing 层数 | 前 3 层 |
| 训练 batch size 峰值 | 75.5M / 94.4M tokens |
| 峰值学习率 | 2.7e-4 / 2.0e-4 |
| Muon momentum | 0.95 |
| Weight decay | 0.1 |
| 1M 单 token FLOPs vs V3.2 | 27% (Pro) / 10% (Flash) |
| 1M KV cache vs V3.2 | 10% (Pro) / 7% (Flash) |
| KV cache vs BF16 GQA8 baseline | ~2% |
| EP 理论加速 | 1.92× |
| Codeforces rating | 3206（人类排名 ~23） |
| Putnam-2025 formal | 120/120 满分 |
| 内部工程师选它做主力编程模型 | 52% yes / 39% 倾向 yes |

---

## 结语

DeepSeek-V4 与其说是"一次模型升级"，不如说是开源社区第一次拿出了一套**"可原生训练 × 可生产部署 × 可 agent 化"的百万级上下文完整方案**。它对前沿闭源模型的追赶是局部性的（知识广度仍有差距），但在"推理能力密度 × 长上下文效能 × 工程完整度"这三个维度上，它已经站到了与 Claude Opus 4.6 / Gemini-3.1-Pro / GPT-5.4 同一张桌子上。

更重要的是，这份报告把**从 attention 架构到 kernel、到 Muon ZeRO、到 DSec 沙箱、到 OPD 后训练、到 KV cache on-disk**的"全栈秘方"几乎毫无保留地写了出来。对整个开源生态而言，这是过去一年最有分量的技术文献之一——也是"开源不只是放权重，而是放出整条可复制路径"的一个样板。

> 如果你在做基础模型：这是一份方法论速查手册。
> 如果你在做应用：在"推理密集型 + 长上下文"场景，你现在有了一个开源替代。
> 如果你在做投资或分析：这是一封"中国开源 AI 能力到达什么位置"的最新声明。
