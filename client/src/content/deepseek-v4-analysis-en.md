# DeepSeek-V4 Technical Report — In-Depth Analysis

> **Source paper:** *DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence*
> **Publisher:** DeepSeek-AI (preview version, 58 pages)
> **Contact:** research@deepseek.com
> **Weights:** https://huggingface.co/collections/deepseek-ai/deepseek-v4

---

## 1. Core Positioning: Breaking the Efficiency Barrier to Unlock Million-Token Context

If DeepSeek-V4 had to be summarized in a single word, it would be **"efficiency."** While the past two years of open-source vs. frontier competition focused on *"stronger reasoning"* and *"bigger scale,"* V4 takes an orthogonal stance: **make million-token contexts genuinely usable, trainable, and deployable.** It confronts the most fundamental bottleneck of Transformers — quadratic attention complexity — head-on.

The report opens with three numbers that frame the whole paper:

| Metric (relative to DeepSeek-V3.2) | V4-Pro | V4-Flash |
|---|---|---|
| Single-token inference FLOPs @ 1M context | **27%** | **10%** |
| Accumulated KV cache size @ 1M context | **10%** | **7%** |
| KV cache vs. BF16 GQA8 baseline | ~2% | ~2% |

In other words: V4-Pro, despite having *more activated parameters*, uses **3.7× less compute and 9.5× less KV cache** than V3.2 at 1M tokens. V4-Flash pushes KV cache down to roughly **1/14**. These are not incremental optimizations; they are an architectural rewrite.

---

## 2. Two Flagship Models: Same Architecture, Different Scales

| Model | Total Params | Activated | Layers | Hidden | Routed Experts | Active Experts | Training Tokens |
|---|---|---|---|---|---|---|---|
| **DeepSeek-V4-Pro** | 1.6T | 49B | 61 | 7168 | 384 | 6 | 33T |
| **DeepSeek-V4-Flash** | 284B | 13B | 43 | 4096 | 256 | 6 | 32T |

Both models natively support **1M-token contexts** and both ship with three "reasoning effort" modes (Non-think / Think High / Think Max). **V4-Pro-Max** is the flagship for open-source; **V4-Flash-Max** targets cost-efficient reasoning at scale.

---

## 3. Four Core Architectural Innovations

### 3.1 Hybrid Attention: Interleaved CSA + HCA

This is the heart of the paper and the engine of the efficiency revolution. V4 designs **two complementary attention mechanisms** and then **interleaves them across layers** rather than picking one.

#### (a) CSA — Compressed Sparse Attention: "Compress first, then sparsify"

CSA fuses two mainstream long-context acceleration paradigms:

- **Compression stage.** Every *m* tokens (m = 4) are compressed into a single KV entry. V4 uses a dual-stream formulation (*Cₐ, Cᵦ*) with overlapped windows, learnable positional biases, and a row-wise softmax over 2m weights. This isn't mean pooling — it's a **learnable, position-aware "KV summary."**
- **Sparse stage.** On the compressed sequence, V4 applies DeepSeek Sparse Attention (DSA) via a **Lightning Indexer**: low-rank indexer queries + ReLU-based scoring + top-k selection. Each query token only attends to its top-k compressed blocks.
- **Sliding-window patch.** Since compression loses fine detail and sparsity may skip nearby tokens, CSA adds a parallel sliding-window branch (window size n_win = 128) preserving strict local dependencies.
- **Attention Sink.** Each head gets a learnable sink logit added to the attention denominator, letting heads *abstain* (total attention < 1) — an old StreamingLLM trick that still pays off.

Net effect: KV cache length compressed to 1/m, and each query only sees top-k compressed blocks — linear-scalable long-context attention.

#### (b) HCA — Heavily Compressed Attention: "Aggressive compression + dense attention"

If CSA is moderate compression (m = 4), HCA is extreme: **m′ = 128** — collapsing 128 tokens of KV into a single entry. Because the resulting sequence is already tiny, HCA skips sparsification and runs **full dense attention** on the compressed stream. Structurally simpler (no indexer, no top-k), but dramatic in compression ratio.

#### (c) Why hybrid?

CSA and HCA are complementary:
- **CSA — "fine-grained near-field view":** moderate compression + sparse selection + sliding window → good at precise retrieval (e.g., needle-in-haystack).
- **HCA — "coarse-grained global view":** extreme compression → every layer can "glance at" the entire context, covering blind spots in CSA's top-k selection.

V4 interleaves them per layer: V4-Flash starts with two pure SWA layers, then alternates CSA/HCA; V4-Pro starts with two HCA layers, then alternates. This ensures every token is both *"viewed closely"* and *"viewed globally"* as it traverses the network.

#### (d) Three-tier precision strategy

For attention, V4 uses **three precision levels simultaneously**:
- **BF16** for RoPE dimensions (position info is precision-sensitive)
- **FP8** for the rest of the KV (halves cache size vs. pure BF16)
- **FP4** for Lightning Indexer QK path (top-k selection doesn't need high precision)

Combined with CSA/HCA length compression, total KV cache shrinks to ~**2%** of a standard BF16 GQA8 baseline. *This* is why million-token context becomes routine rather than aspirational.

---

### 3.2 mHC — Manifold-Constrained Hyper-Connections

Hyper-Connections (HC) expand the residual stream from ℝᵈ to ℝ^(n_hc × d) via three linear maps A_l, B_l, C_l. They improve expressivity but suffer numerical instability when stacked deep. V4's fix is elegant:

**Constrain B_l to the Birkhoff polytope of doubly stochastic matrices:**

```
B_l ∈ M := { M ∈ ℝ^{n×n} | M·1ₙ = 1ₙ, 1ₙᵀ·M = 1ₙᵀ, M ≥ 0 }
```

Why this works:
1. **‖B_l‖₂ ≤ 1** → the residual map is *non-expansive*; signals cannot amplify in either forward or backward pass → numerical stability.
2. **M is closed under multiplication** → stability composes across deep stacks — ideal for very deep models.
3. **A_l, C_l** are clamped via sigmoid to non-negative, bounded values → no signal cancellation.

B_l is projected onto the manifold via **20 Sinkhorn-Knopp iterations** (exp → alternating row/column normalization). The full parameterization decomposes into a dynamic (input-dependent) component α·(X·W) plus a static learned bias S.

**Engineering cost.** mHC adds activation memory and pipeline communication. A combination of **fused kernels + fine-grained tensor-level recomputation + adjusted DualPipe 1F1B overlap** keeps wall-clock overhead to just **6.7% of the 1F1B stage.**

> **Takeaway:** mHC provides a theoretically grounded, operationally usable upgrade to residual connections for anyone training 100+ layer models.

---

### 3.3 Muon Optimizer: Widespread Replacement of AdamW

V4 replaces AdamW with **Muon** for the vast majority of parameters, keeping AdamW only for embeddings, the LM head, RMSNorm weights, and mHC's static biases and gating factors.

Muon's core logic:
1. Accumulate momentum M_t
2. **Nesterov correction + hybrid Newton–Schulz iterations** on (μM_t + G_t) for approximate orthogonalization (pushing all singular values toward 1)
3. Rescale update RMS by √max(n,m)·γ → reuse AdamW hyperparameters
4. Weight decay + parameter update

Two engineering contributions:
- **Hybrid Newton-Schulz.** First 8 steps use aggressive coefficients (3.4445, -4.7750, 2.0315) for fast convergence toward singular values ≈ 1; final 2 steps use conservative (2, -1.5, 0.5) to pin them precisely at 1. Fast *and* stable.
- **ZeRO × Muon reconciliation.** Muon needs the full gradient matrix, conflicting with ZeRO. V4 solves this with a **knapsack-based bucket assignment + flattened MoE-parameter distribution + BF16 stochastic-rounded gradient sync + all-to-all + FP32 local reduction**. Overhead <10% memory, and communication volume is halved.

Payoff: **faster convergence + greater stability**, and V4 no longer needs QK-Clip (the attention architecture lets RMSNorm directly control Q/K scales).

---

### 3.4 DeepSeekMoE Continuation + Hash Routing in Early Layers

V4 keeps V3's MoE paradigm (fine-grained routed + shared experts + auxiliary-loss-free balance) but makes several meaningful tweaks:

1. Affinity function changed from **Sigmoid → Sqrt(Softplus(·))** — empirically more stable.
2. **Removed the cap on routing target nodes** (V3 limited cross-node counts); parallelism strategy was redesigned to compensate.
3. **First 3 MoE layers use Hash Routing** — experts are deterministically assigned by hashing the token ID, avoiding instability when shallow-layer routing hasn't yet learned meaningful representations.
4. MTP depth = 1, unchanged from V3.

---

## 4. Infrastructure: Making Million-Token Training Actually Possible

This chapter is unusually detailed and arguably the most impressive part of the paper — DeepSeek is showcasing its full-stack model-engineering capability.

### 4.1 Fine-grained MoE Communication-Computation Overlap

In Expert Parallelism, Dispatch/Combine are communication-bound and Linear-1/Linear-2 are compute-bound. Rather than the coarse overlap of Comet (which pairs Dispatch↔Linear-1 and Combine↔Linear-2), V4 splits MoE into **3 expert waves**, hiding each wave's communication behind the previous wave's computation. **Theoretical speedup: 1.92×** (vs. Comet's 1.42×), and the scheme tolerates *lower interconnect bandwidth* — directly easing hardware requirements.

### 4.2 TileLang DSL

A custom domain-specific language balancing developer productivity with runtime efficiency — replacing hand-written CUDA.

### 4.3 Batch-Invariant Deterministic Kernel Libraries

Guarantees **bitwise reproducibility** across training, inference, and RL rollout. This is critical for on-policy distillation and RL: without it, mismatched numerics between rollout and training corrupt the optimization signal.

### 4.4 FP4 Quantization-Aware Training (QAT)

MoE expert weights and the indexer QK path use FP4. Forward uses simulated quantization; backward passes gradients via STE to FP32 master weights. RL rollouts use real FP4 weights, ensuring sampling-time behavior exactly matches deployment. On current hardware, FP4×FP8 has the same peak FLOPs as FP8×FP8 — but future hardware could make it **1/3 more efficient**. V4 is pre-positioned for that.

### 4.5 Tensor-Level Activation Checkpointing

V4 extends autograd so developers can "annotate a few tensors" and have recomputation handled automatically. TorchFX traces the full graph; for each annotated tensor, the framework does a backward traversal to find the minimal subgraph needed for recomputation. It also deduplicates recomputation across tensors that share storage (e.g., reshape in/out). Zero extra overhead, full programming convenience.

### 4.6 Contextual Parallelism (Two-Stage Communication)

Conventional CP can't handle "m consecutive KV entries straddling rank boundaries" under CSA/HCA. V4's two-stage solution:
1. Each rank sends its last m uncompressed KV entries to rank *i+1*.
2. Rank *i+1* compresses with its local data → all-gather → a fused select-and-pad kernel reassembles the global compressed KV.

### 4.7 Heterogeneous KV Cache + On-Disk Storage

Three on-disk SWA strategies — **Full Caching / Periodic Checkpointing / Zero Caching** — let operators trade storage for compute. This matters most for **shared-prefix reuse** (multi-turn conversations, agent frameworks with shared system prompts). It's a key enabler of *commercial* 1M-context deployment.

### 4.8 DSec — Production-Grade Agentic AI Sandbox

A Rust-based platform built on the 3FS distributed filesystem. Four execution substrates (**Function Call / Container / microVM / fullVM**) expose a unified Python SDK. A single cluster runs **hundreds of thousands of concurrent sandboxes**, with layered EROFS / overlaybd image loading, preemption-safe resume via trajectory logs. This is the infrastructure that makes RL with real tool environments feasible.

---

## 5. Pre-Training & Stability

### 5.1 Data

- **32T+ tokens** of curated high-quality multilingual corpus, built on V3's pipeline with several upgrades:
  - Web data filtered for batch-generated and templated content (preventing model collapse)
  - Scientific papers, technical reports, and long documents explicitly upweighted
  - Expanded multilingual coverage for long-tail cultural knowledge
  - **Agentic data** added during mid-training to boost coding capability

### 5.2 Training Setup (Highly Engineered)

- Sequence length progression: 4K → 16K → 64K → 1M
- First 1T tokens: dense attention warmup; sparse attention introduced at 64K
- Batch size schedule: up to 75.5M tokens (Flash) / 94.4M (Pro)
- Peak LR: 2.7e-4 (Flash) / 2.0e-4 (Pro), cosine decay to 1/10
- Auxiliary-loss-free balancing + small sequence-wise balance loss
- MTP loss weight: 0.3 during main training, 0.1 during decay

### 5.3 Two Practical Stability Recipes

The authors candidly report frequent loss spikes during trillion-parameter MoE training. Root cause: **MoE-layer outliers amplified by the routing mechanism.** They share two techniques that community should take seriously:

#### (a) Anticipatory Routing

**Decouple feature computation from routing decisions.** At step *t*, use current parameters θ_t for features but use **historical parameters θ_{t−Δt}** for routing indices (precomputed one step ahead and cached). This breaks the "feature → outlier → routing → more outliers" vicious cycle.

Engineering details:
- Pre-fetch data one step ahead; precompute routing indices with overlap against EP communication → ~20% wall-time overhead.
- Auto-detect loss spikes, activate Anticipatory Routing temporarily, deactivate after recovery → negligible overall overhead.

#### (b) SwiGLU Clamping

Clamp SwiGLU's linear component to **[-10, 10]** and cap its gate at 10. Simple, nearly free, and empirically eliminates outliers.

> 🧠 **Worth noting:** The paper openly states that *the theoretical mechanism of both techniques remains insufficiently understood* and invites community research. That candor is refreshing in today's overpolished technical reports.

---

## 6. Post-Training: Specialist × On-Policy Distillation

The biggest methodological shift in V4: **On-Policy Distillation (OPD) replaces mixed RL entirely** in the merging phase.

### 6.1 Pipeline

```
    [Base Model]
         │
     SFT on high-quality, domain-specific data
         │
     GRPO RL per domain (math / code / agent / instruction-following)
         │
     ┌──────────────┐
     │ N specialists │
     └──────────────┘
         │
     Multi-Teacher On-Policy Distillation
         │
    [Unified Final Model]
```

The student learns to minimize reverse KL against teacher distributions *on its own generated trajectories*. Advantages:
- Truly on-policy — no distribution shift in distillation
- Avoids the cross-task interference endemic to multi-task RL merging
- Training loop can batch teacher inference and share KV cache → huge compute savings

### 6.2 Generative Reward Model (GRM)

V4 abandons scalar reward models entirely. Instead:
- Curate **rubric-guided** RL data
- The **actor network itself serves as the reward model**
- RL is applied directly to the GRM → judging skill and generation skill are optimized *jointly*
- Human annotation budget drops dramatically ("minimal set of diverse human annotations")

### 6.3 Three Reasoning Effort Modes

| Mode | Typical Use | Format |
|---|---|---|
| **Non-think** | Routine Q&A, low-risk decisions | `</think>` *summary* (empty think) |
| **Think High** | Complex problem solving, planning | `<think>...</think>` *summary* |
| **Think Max** | Pushing the reasoning frontier | Special system prompt prepended + `<think>...</think>` *summary* |

The Think Max system prompt essentially *forces* exhaustive reasoning:
> *"Reasoning Effort: Absolute maximum with no shortcuts permitted. You MUST be very thorough in your thinking and comprehensively decompose the problem to resolve the root cause, rigorously stress-testing your logic against all potential paths, edge cases, and adversarial scenarios..."*

### 6.4 Tool-Call: XML Format with `|DSML|` Special Tokens

V4 replaces JSON tool-calling with XML-style invocations wrapped in `|DSML|` special tokens:
- Eliminates escaping failures
- Reduces tool-call error rates
- Integrates cleanly with `<think>` for interleaved reasoning + tool use

### 6.5 Interleaved Thinking (Persistent Reasoning Across Turns)

V3.2 flushed `<think>` traces at every new user message. V4 **preserves the entire reasoning history across turns in tool-calling scenarios**, including across user-message boundaries. General chat still flushes per turn. This is what makes 1M context *useful* for long-horizon agents — they no longer have to reconstruct state from scratch every turn.

### 6.6 Quick Instruction

Auxiliary tasks (trigger web search, intent recognition, etc.) are handled by appending **dedicated special tokens** to the input. These reuse the existing KV cache, eliminating redundant prefill and removing the need for a separate small model. Significantly lowers **time-to-first-token (TTFT).**

### 6.7 RL Infrastructure for Million-Token Rollouts

- **WAL + persistent KV cache:** preempted rollouts can be resumed at the token level — no re-prefill needed. The paper carefully notes that **regenerating from scratch introduces length bias** (shorter outputs survive interruption more often, biasing the model toward shorter responses). Hence the insistence on true resumption.
- **Metadata / heavy-field decoupling + shared-memory dataloader:** rollout data is split so heavy per-token fields load via shared memory and release at mini-batch granularity — reducing both CPU and GPU memory pressure.

---

## 7. Evaluation Results: Where V4 Stands

### 7.1 Base Models

| Benchmark | V3.2-Base (37B act) | V4-Flash-Base (13B act) | V4-Pro-Base (49B act) |
|---|---|---|---|
| MMLU-Pro | 65.5 | 68.3 | **73.5** |
| Simple-QA verified | 28.3 | 30.1 | **55.2** |
| FACTS Parametric | 27.1 | 33.9 | **62.6** |
| HumanEval | 62.8 | 69.5 | **76.8** |
| MATH | 60.5 | 57.4 | **64.5** |
| LongBench-V2 | 40.2 | 44.7 | **51.5** |

**Key observation:** V4-Flash-Base (13B activated) matches or beats V3.2-Base (37B activated) on most metrics — the same capability for 1/3 the activation cost. V4-Pro-Base dominates almost everywhere.

### 7.2 Instruction-Tuned Flagship vs. Global Frontier

| Benchmark | Opus-4.6 | GPT-5.4 | Gemini-3.1-Pro | K2.6 | GLM-5.1 | **V4-Pro-Max** |
|---|---|---|---|---|---|---|
| SimpleQA-Verified | 46.2 | 45.3 | **75.6** | 36.9 | 38.1 | **57.9** |
| Chinese-SimpleQA | 76.4 | 76.8 | **85.9** | 75.9 | 75.0 | **84.4** |
| LiveCodeBench | 88.8 | — | 91.7 | 89.6 | — | **93.5** |
| Codeforces (Rating) | — | 3168 | 3052 | — | — | **3206** |
| HMMT 2026 Feb | **96.2** | 97.7 | 94.7 | 92.7 | 89.4 | 95.2 |
| IMOAnswerBench | 75.3 | 91.4 | 81.0 | 86.0 | 83.8 | 89.8 |
| Apex Shortlist | 85.9 | 78.1 | 89.1 | 75.5 | 72.4 | **90.2** |
| MRCR 1M | **92.9** | — | 76.3 | — | — | 83.5 |
| CorpusQA 1M | **71.7** | — | 53.8 | — | — | 62.0 |
| SWE Verified | 80.8 | — | 80.6 | 80.2 | — | 80.6 |
| Terminal Bench 2.0 | 65.4 | **75.1** | 68.5 | 66.7 | 63.5 | 67.9 |

**Key takeaways:**
- **Open-source leader:** V4-Pro-Max tops SimpleQA-Verified, LiveCodeBench, Codeforces, and Apex Shortlist among open models. Its Codeforces rating of **3206** corresponds to roughly rank **~23 among human competitors.**
- **Frontier gap:** Trails Gemini-3.1-Pro on SimpleQA-Verified by ~18 points — a pure knowledge-breadth gap.
- **Long context:** Beats Gemini-3.1-Pro on MRCR and CorpusQA; loses to Claude Opus 4.6.
- **Agents:** Parity with Opus 4.6 / Gemini-3.1-Pro on SWE-Verified; trails GPT-5.4 on Terminal Bench.
- **Formal math:** Achieves a perfect **120/120 on Putnam-2025** under the hybrid formal-informal regime, tying Axiom for first place.

### 7.3 Real-World Evaluations

- **Chinese writing:** V4-Pro vs. Gemini-3.1-Pro — **62.7% win rate** on functional writing, **77.5% win rate** on creative-writing quality. Still slightly behind Claude Opus 4.5 on the hardest prompts.
- **White-collar tasks (30 expert-curated Chinese professional tasks across 13 industries):** V4-Pro-Max achieves a **63% non-loss rate** vs. Opus-4.6-Max under blind human evaluation.
- **Internal R&D coding (30 real engineering tasks):** V4-Pro-Max 67%, Opus 4.5 Thinking 73%, Opus 4.6 Thinking **80%.** In a survey of 85 DeepSeek engineers, **52% would make V4-Pro their daily default coding model**, 39% lean yes, <9% no.

---

## 8. Four Deep Takeaways

### Takeaway 1: DeepSeek is moving from "parameter efficiency" to "system efficiency"

V3's banner was **"activated parameters"** (MoE + sparse activation + MLA). V4's banner is **"context energy efficiency"** — FLOPs per token and KV cache per token. In the reasoning-model era, long CoTs, long tool traces, and long document analyses shift compute from the *parameter axis* to the *sequence axis.* V4 is a direct response to that shift.

Where V3.2's DSA only addressed the sparse-selection side, V4 integrates **compression × sparsity × sliding window × low precision × on-disk persistence** into a single **end-to-end deployable million-token system.**

### Takeaway 2: The frontier gap is now 3–6 months — but its nature has changed

The paper candidly admits a "developmental trajectory trailing frontier models by approximately 3 to 6 months." But that label hides a nuance:
- On **hard reasoning tasks** (HMMT, IMO, Codeforces, LiveCodeBench), V4-Pro-Max is effectively on par with or ahead of Gemini-3.1-Pro and GPT-5.4.
- On **knowledge-intensive benchmarks** (SimpleQA, MMLU-Pro), V4 is still well behind Gemini-3.1-Pro.

So the remaining gap is **not primarily "reasoning ability" but "data scale × knowledge breadth."** For application developers: reasoning-intensive tasks no longer require a closed model. Long-tail factual recall is still Gemini's territory.

### Takeaway 3: On-Policy Distillation may become the dominant post-training paradigm

V4's decision to replace mixed-task RL with OPD is significant. Traditional multi-task RL requires simultaneously tuning rewards, handling cross-task interference, and managing catastrophic forgetting. OPD says: train N specialists separately, then have the student learn the teachers' distributions on its own trajectories via reverse KL. Combined with **GRM (actor-as-reward-model)**, batch-invariant deterministic kernels (training/rollout numerical equivalence), and asynchronous teacher scheduling, this becomes a **standardized, scalable post-training pipeline.**

### Takeaway 4: The infrastructure story matters as much as the architecture story

Readers drawn to architecture innovations should not skip Chapter 3 (General Infrastructures) and §5.2 (RL Infrastructure) — together nearly 20 pages. TileLang DSL, FP4 QAT, 3FS, DSec sandbox, tensor-level checkpointing: these are the capabilities that make "architectural creativity actually run on 100K-GPU clusters × trillion-parameter models × million-token contexts." The infrastructure *is* the moat.

---

## 9. Limitations & Future Work (Self-Stated)

The authors are unusually candid in Chapter 6:

1. **Architectural complexity is high.** Many "validated but not minimally necessary" components were retained to reduce risk. Future work will distill the architecture to its most essential designs.
2. **Anticipatory Routing and SwiGLU Clamping lack theoretical grounding** — "they work, but we don't fully understand why."
3. **Agent gap remains.** Terminal Bench 2.0 loses to GPT-5.4; R&D coding trails Claude Opus 4.6 Thinking (80% vs. 67%). Instruction-following on specific formatting constraints is weaker than Opus.
4. **Text-only.** Multimodal is explicitly listed as in-progress.
5. Future directions include **sparser embeddings** ("conditional memory via scalable lookup"), **lower-latency architectures**, and deeper long-horizon agent iteration.

---

## 10. Practitioner Implications

1. **Architecture researchers:** mHC (manifold constraint + Sinkhorn-Knopp) is an elegant residual upgrade worth trying. The CSA + HCA hybrid is more systematic than MoBA/NSA alone — the layer-interleaved strategy is especially transferable.
2. **Teams building long-context products:** Study §3.6 — heterogeneous KV cache + on-disk storage. For multi-turn chat, shared-prefix agents, or IDE-style tools, this strategy can cut cost by an order of magnitude.
3. **Post-training engineers:** The **Specialist → OPD** pipeline solves "merged model = weakest link" without fragile RL hyperparameter tuning. **GRM (actor-as-reward)** further reduces reward engineering cost.
4. **Training stability:** If you're training large MoE and seeing loss spikes — **Anticipatory Routing is a pluggable rescue kit** (activate only when a spike occurs). SwiGLU Clamping is near-zero cost.
5. **Open-source ecosystem:** V4-Flash (284B total / 13B activated) is a "practical deployment sweet spot" — combined with FP8 KV cache and on-disk storage, inference costs should be meaningfully lower than V3.

---

## Appendix: Key Numbers at a Glance

| Dimension | Value |
|---|---|
| V4-Pro parameters | 1.6T total / 49B activated / 61 layers / hidden 7168 |
| V4-Flash parameters | 284B total / 13B activated / 43 layers / hidden 4096 |
| Pre-training data | 32T+ tokens |
| Native context length | 1,000,000 tokens |
| Vocabulary size | 128K |
| CSA compression ratio (m) | 4 |
| HCA compression ratio (m′) | 128 |
| CSA top-k | 512 (Flash) / 1024 (Pro) |
| Sliding window size | 128 |
| Sinkhorn-Knopp iterations | 20 |
| Newton-Schulz iterations | 10 (8 + 2 stages) |
| mHC expansion factor | 4 |
| Experts per MoE layer | 256 (Flash) / 384 (Pro) |
| Active experts per token | 6 |
| Hash-routed layers | first 3 |
| Peak batch size | 75.5M / 94.4M tokens |
| Peak learning rate | 2.7e-4 / 2.0e-4 |
| Muon momentum | 0.95 |
| Weight decay | 0.1 |
| 1M single-token FLOPs vs. V3.2 | 27% (Pro) / 10% (Flash) |
| 1M KV cache vs. V3.2 | 10% (Pro) / 7% (Flash) |
| KV cache vs. BF16 GQA8 baseline | ~2% |
| EP theoretical speedup | 1.92× |
| Codeforces rating | 3206 (human rank ~23) |
| Putnam-2025 formal | 120/120 perfect score |
| Internal engineers preferring V4 as primary coding model | 52% yes / 39% leaning yes |

---

## Conclusion

DeepSeek-V4 is less a "model upgrade" and more the **first end-to-end, natively-trainable, production-deployable, agent-ready million-token open-source system.** Its pursuit of frontier closed models is partial — knowledge breadth still trails — but along the three axes of **reasoning-ability density × long-context efficiency × engineering completeness**, it now sits at the same table as Claude Opus 4.6, Gemini-3.1-Pro, and GPT-5.4.

More importantly, the report publishes the entire stack — from attention architecture to kernels, from Muon-ZeRO to DSec sandboxing, from on-disk KV cache to OPD post-training — with remarkably little held back. For the open-source ecosystem, this is one of the most consequential technical documents of the past year, and a clear statement that **"open-source isn't just about releasing weights — it's about publishing a reproducible full-stack path."**

> If you build foundation models: this is a methodology reference manual.
> If you build applications: for reasoning-heavy + long-context workloads, you now have a viable open alternative.
> If you invest or analyze: this is the latest declaration of where Chinese open-source AI actually stands.
