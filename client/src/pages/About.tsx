/*
 * Design: Editorial Longform — "The New Yorker meets Bloomberg"
 * About page: Detailed profile of Monica with editorial layout.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Video, Radio, Instagram } from "lucide-react";
import { Link } from "wouter";

const MONICA_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/monica-photo_cc742672.jpg";

export default function About() {
  const { lang, localePath } = useLanguage();
  const isEN = lang === "en";
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef}>
      {/* Hero */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-20">
        <div className="container">
          <div className="wide-column">
            <p
              className="fade-up text-xs uppercase tracking-[0.3em] text-[var(--color-ink-muted)] mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {isEN ? "About" : "关于"}
            </p>
            <h1
              className="fade-up stagger-1 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              Monica
            </h1>
            <p
              className="fade-up stagger-2 text-lg lg:text-xl text-[var(--color-ink-light)] max-w-2xl leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {isEN
                ? "Founder of Pitchless AI · Serial Entrepreneur · Mother of Three · Marathon Runner · AGI Villa Initiator (3,000+ AI Entrepreneur Community)"
                : "Pitchless AI创始人 · 连续创业者 · 三宝妈 · 马拉松跑者 · AGI Villa 发起人（3,000+ AI 创业者社区）"}
            </p>
          </div>
        </div>
      </section>

      <hr className="editorial-rule container wide-column" />

      {/* Photo + Intro */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="wide-column">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              {/* Photo column */}
              <div className="lg:col-span-5 fade-up">
                <div className="relative sticky top-24">
                  <img
                    src={MONICA_PHOTO}
                    alt="Monica"
                    className="w-full object-contain"
                    style={{ filter: "contrast(1.05) saturate(0.9)" }}
                  />
                  <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-[var(--color-terracotta)]/15 -z-10" />
                </div>
              </div>

              {/* Content column */}
              <div className="lg:col-span-7">
                {/* Deep Observer */}
                <div className="mb-12">
                  <h2
                    className="fade-up text-2xl lg:text-3xl font-bold mb-6"
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {isEN ? "Deep Observer & Connector in Tech Going Global" : "科技出海的深度观察者与连接者"}
                  </h2>
                  <div className="space-y-4">
                    <p className="fade-up text-[var(--color-ink-light)] leading-relaxed">
                      {isEN
                        ? "Monica began her career as a journalist at Xinhua News Agency, where she developed profound business insights and sharp industry acumen. Over the past 15 years, she has visited more than 50 countries, accumulating rich cross-cultural communication experience and a broad international perspective. She has organized and hosted dozens of influential international forums, including the Asia-Pacific New Energy Industry Summit, the Trans-Pacific Shipping Summit, the Singapore Biopharmaceutical Development Forum, and the Davos Financial Forum. These experiences have made her a true deep observer and connector in tech going global."
                        : "记者出身的 Monica 曾在新华通讯社从事新闻工作，这段经历赋予了她深刻的商业见解和敏锐的行业洞察力。在过去的 15 年间，她走访了全球 50 个国家，积累了丰富的跨文化交流经验和广阔的国际视野。她曾作为主理人策划并主持了亚太新能源行业峰会、跨太平洋海运峰会、新加坡生物医药发展论坛、达沃斯财经论坛等数十个具有行业影响力的国际论坛。这些经历使她成为了名副其实的科技出海深度观察者与连接者。"}
                    </p>
                    <p className="fade-up stagger-1 text-[var(--color-ink-light)] leading-relaxed">
                      {isEN
                        ? "Today, as the initiator of AGI Villa, she is dedicated to building bridges for Chinese enterprises going global — helping Chinese entrepreneurs navigate international expansion while helping the world understand China's tech landscape."
                        : "如今，作为 AGI Villa 的发起人，她致力于为中国企业走向世界搭建桥梁——帮助中国创业者驾驭国际扩张，同时帮助世界理解中国的科技版图。"}
                    </p>
                  </div>
                </div>

                <hr className="editorial-rule mb-12 fade-up" />

                {/* Serial Entrepreneur */}
                <div className="mb-12">
                  <h2
                    className="fade-up text-2xl lg:text-3xl font-bold mb-6"
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {isEN ? "Serial Entrepreneur" : "连续创业者"}
                  </h2>
                  <p className="fade-up text-[var(--color-ink-light)] leading-relaxed mb-6">
                    {isEN
                      ? "As a serial entrepreneur, Monica has accompanied the growth of multiple startups as Partner, CEO, or CMO, spanning cutting-edge fields including AI programming, youth education, B2B e-commerce, social e-commerce, local lifestyle services, Web3 and blockchain — successfully building unicorn enterprises. Her ventures have collectively raised over 1.5 billion RMB from top-tier investors including Sequoia Capital, Linear Venture, Legend Capital, Sinovation Ventures, Zhongding Capital, Black Ant Capital, and GGV Capital."
                      : "作为一位连续创业者，Monica 曾以合伙人、CEO 或 CMO 的身份陪伴数家初创企业成长，足迹遍布 AI 编程、青少年教育、B2B 电商、社交电商、本地生活、Web3 与区块链等多个前沿领域，并成功打造出独角兽企业。她的创业项目累计获得了超过 15 亿元人民币的融资，投资方包括红杉资本、线性资本、君联资本、创新工场、钟鼎资本、黑蚁资本、纪源资本等顶级投资机构。"}
                  </p>

                  <div className="space-y-6">
                    {[
                      {
                        titleEN: "AI Programming",
                        titleZH: "AI 编程",
                        descEN: "Dedicated to empowering non-technical entrepreneurs through AI-automated programming. Backed by Sequoia Capital and Linear Venture.",
                        descZH: "致力于通过 AI 自动化编程为非技术背景的创业者赋能，获得红杉资本、线性资本投资。",
                      },
                      {
                        titleEN: "Youth Education",
                        titleZH: "青少年教育",
                        descEN: "Committed to providing independent, free, and joyful innovative education for youth aged 6-14, leading over 10,000 children across 12 countries and 46 cities.",
                        descZH: "致力于为 6-14 岁青少年提供独立、自由、快乐的创新教育，带领上万个孩子走遍 12 个国家、46 个城市。",
                      },
                      {
                        titleEN: "B2B E-commerce",
                        titleZH: "B2B 电商",
                        descEN: "Aggregated 200,000 Chinese pharmaceutical raw material and production equipment suppliers with 5,000 overseas buyers, building an efficient global platform for Chinese SMEs.",
                        descZH: "汇聚 20 万家中国医药原材料和生产设备供应商、5,000 家海外采购商，为中国中小企业搭建高效的出海平台。",
                      },
                      {
                        titleEN: "Social E-commerce & Local Lifestyle",
                        titleZH: "社交电商与本地生活",
                        descEN: "Connected 1 million individual operators in China's lower-tier markets with 5,000 brand enterprises, pioneering community-driven business models in China's consumer market through inventory supply platforms that achieve a triple win of individual, brand, and social value.",
                        descZH: "链接 100 万中国下沉市场个体经营者和 5,000 家品牌企业，通过为品牌搭建库存商品供给平台实现个体价值、品牌价值与社会价值的三方共赢，在中国消费市场开创社区驱动的商业模式。",
                      },
                      {
                        titleEN: "Web3 & Blockchain",
                        titleZH: "Web3 与区块链",
                        descEN: "Explored the frontier of decentralized technology, applying blockchain innovation to real-world business scenarios.",
                        descZH: "探索去中心化技术前沿，将区块链创新应用于真实商业场景。",
                      },
                    ].map((item, i) => (
                      <div key={i} className={`fade-up stagger-${i + 1} pl-6 border-l-2 border-[var(--color-terracotta)]/30`}>
                        <h3
                          className="text-base font-semibold mb-1"
                          style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                        >
                          {isEN ? item.titleEN : item.titleZH}
                        </h3>
                        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                          {isEN ? item.descEN : item.descZH}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="editorial-rule mb-12 fade-up" />

                {/* Investors */}
                <div className="mb-12">
                  <h2
                    className="fade-up text-2xl lg:text-3xl font-bold mb-6"
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {isEN ? "Backed by the Best" : "顶级投资方背书"}
                  </h2>
                  <div className="fade-up grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { en: "Sequoia Capital", zh: "红杉资本" },
                      { en: "Linear Venture", zh: "线性资本" },
                      { en: "Legend Capital", zh: "君联资本" },
                      { en: "Sinovation Ventures", zh: "创新工场" },
                      { en: "Zhongding Capital", zh: "钟鼎资本" },
                      { en: "Black Ant Capital", zh: "黑蚁资本" },
                      { en: "GGV Capital", zh: "纪源资本" },
                    ].map((investor, i) => (
                      <div
                        key={i}
                        className="py-4 px-3 text-center border border-[var(--color-ink)]/8 bg-[var(--color-warm-gray)]"
                      >
                        <p className="text-sm font-medium text-[var(--color-ink)]">
                          {isEN ? investor.en : investor.zh}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="fade-up mt-4 text-sm text-[var(--color-ink-muted)] italic">
                    {isEN
                      ? "Total funding raised across ventures: over 1.5 billion RMB (~$200M+)"
                      : "创业项目累计融资超 15 亿元人民币"}
                  </p>
                </div>

                <hr className="editorial-rule mb-12 fade-up" />

                {/* Incubation & Education */}
                <div className="mb-12">
                  <h2
                    className="fade-up text-2xl lg:text-3xl font-bold mb-6"
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {isEN ? "Incubation & Education" : "孵化与教育"}
                  </h2>
                  <div className="space-y-4">
                    <p className="fade-up text-[var(--color-ink-light)] leading-relaxed">
                      {isEN
                        ? "Monica has supported the development of two incubation programs for AI-era youth and AI entrepreneurs. The Super Brain AI Incubator is a non-profit organization focused on youth AI education, dedicated to building a decentralized global education ecosystem that integrates real entrepreneurial practice with AI-empowered education, nurturing the next generation of passion-driven Unique Creators who will change the world."
                        : "Monica 支持了两个面向 AI 时代青少年和 AI 创业者的孵化项目建设。超脑 AI 孵化器是专注于青少年 AI 教育的非盈利性组织，致力于打造一个融合真实创业实践与 AI 赋能教育的去中心化全球教育生态系统，培养热爱驱动、改变世界的下一代 Unique Creator。"}
                    </p>
                    <p className="fade-up stagger-1 text-[var(--color-ink-light)] leading-relaxed">
                      {isEN
                        ? "The SJTU Institute of Industrial Research is an AI incubator and accelerator jointly established by Shanghai Jiao Tong University and the Xuhui District Government of Shanghai, focusing on embodied intelligence, AI for Science/Engineering, and other fields. Through empowerment centers including the AI Going Global Accelerator, AI Community, AI Platform, and AI Talent Pool, it achieves value co-creation among universities, local governments, and industry."
                        : "上海交大工研院是由上海交通大学和上海市徐汇区政府联合共建的人工智能孵化器和加速器，聚焦具身智能、AI for Science/Engineering 等领域，通过 AI 出海加速器、AI 社区、AI 中台以及 AI 人才库等赋能中心，实现高校、地方政府和产业的价值共创。"}
                    </p>
                  </div>
                </div>

                <hr className="editorial-rule mb-12 fade-up" />

                {/* Life Beyond Work */}
                <div>
                  <h2
                    className="fade-up text-2xl lg:text-3xl font-bold mb-6"
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {isEN ? "Beyond the Boardroom" : "跨界探索者与生活家"}
                  </h2>
                  <p className="fade-up text-[var(--color-ink-light)] leading-relaxed mb-4">
                    {isEN
                      ? "Monica is a mother of three and a marathon runner. She once completed a solo journey of 60,000 kilometers across 12 countries in 60 days with her three children. As a Team A member, she represented the Shanghai Advanced Institute of Finance at Shanghai Jiao Tong University in the 19th Xuanzang Road 121-kilometer Gobi Desert Cross-Country Challenge (Ge 19). She is an alumna of SAIF EMBA at Shanghai Jiao Tong University, the School of Economics at Fudan University, and the School of Journalism at Shanghai International Studies University."
                      : "Monica 是三个孩子的母亲，也是一名马拉松跑者。她曾独自带着三个孩子完成 6 万公里、12 国、60 天的旅行，作为 A 队队员代表上海交大高级金融学院参加第 19 届玄奘之路 121 公里戈壁越野挑战赛（戈 19）。她是上海交通大学上海高级金融学院 EMBA、复旦大学经济学院、上海外国语大学新闻传播学院校友。"}
                  </p>
                  <p className="fade-up stagger-1 text-[var(--color-ink-light)] leading-relaxed">
                    {isEN
                      ? "As an entrepreneurship mentor at the National Innovation and Entrepreneurship Demonstration Base under the Ministry of Industry and Information Technology, Monica has been frequently invited to share her practical experience and insights at events both domestically and internationally, covering cutting-edge topics such as going-global trend insights and geopolitical landscape, AI startup vertical track opportunities, and founder global IP building. In 2025, she was invited to speak at Harvard University on innovation incubation and education in China in the AI era."
                      : "作为工信部国家创业创新示范基地创业导师，Monica 多次受邀出席国内外活动分享实践经验与见解，涵盖出海趋势洞察和地缘格局、AI 创业垂直赛道机会拆解、创始人全球 IP 建设等前沿话题。2025年受邀在哈佛大学分享 AI 时代中国的创新孵化和教育。"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="editorial-rule container wide-column" />

      {/* Weekly Live Stream */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="wide-column">
            <div className="fade-up bg-[var(--color-ink)] text-white p-8 lg:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-terracotta)]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <Radio size={20} className="text-[var(--color-terracotta-light)]" />
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60" style={{ fontFamily: "var(--font-body)" }}>
                    {isEN ? "Weekly Live Stream" : "每周直播"}
                  </p>
                </div>
                <h2
                  className="text-2xl lg:text-3xl font-bold mb-4"
                  style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)", color: "white" }}
                >
                  {isEN ? "Every Wednesday" : "每周三直播"}
                </h2>
                <p className="text-white/70 leading-relaxed mb-6 max-w-xl">
                  {isEN
                    ? "Every Wednesday, Monica goes live to discuss the latest in globalization, AI, and entrepreneurship. Real stories, real insights, real conversations."
                    : "每周三，Monica在视频号「Monica出海说」直播，深度分享出海×AI×创业话题。真实故事、真实洞察、真实对话。"}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white/90 text-sm">
                    <Video size={16} />
                    {isEN ? "WeChat Video: Monica出海说" : "视频号：Monica出海说"}
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-terracotta)] text-white text-sm">
                    {isEN ? "Globalization × AI × Entrepreneurship" : "出海 × AI × 创业"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Codes */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="wide-column">
            <h2
              className="fade-up text-2xl lg:text-3xl font-bold mb-8"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              {isEN ? "Scan to Connect" : "扫码关注"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
              {(isEN
                ? [
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-003_885dc0e3.png", label: "Instagram", link: "https://www.instagram.com/chinabymonica" },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-002_b1d00778.png", label: "TikTok", link: "https://www.tiktok.com/@chinabymonica" },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-004_df7acb16.png", label: "LinkedIn", link: "https://www.linkedin.com/in/chinabymonica" },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-wechat-new2_be983b3c.png", label: "WeChat", link: undefined as string | undefined },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-001_d78255b8.png", label: "视频号 (Video Channel)", link: undefined as string | undefined },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-gongzhonghao_b608c1f3.jpg", label: "公众号 (Official Account)", link: undefined as string | undefined },
                  ]
                : [
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-wechat-new2_be983b3c.png", label: "微信", link: undefined as string | undefined },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-001_d78255b8.png", label: "视频号：Monica出海说", link: undefined as string | undefined },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-gongzhonghao_b608c1f3.jpg", label: "公众号", link: undefined as string | undefined },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-003_885dc0e3.png", label: "Instagram", link: "https://www.instagram.com/chinabymonica" },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-002_b1d00778.png", label: "TikTok", link: "https://www.tiktok.com/@chinabymonica" },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-004_df7acb16.png", label: "LinkedIn", link: "https://www.linkedin.com/in/chinabymonica" },
                  ]
              ).map((item, i) => (
                <div key={i} className={`fade-up stagger-${i + 1} text-center`}>
                  <div className="bg-white p-3 border border-[var(--color-ink)]/8 hover:border-[var(--color-terracotta)]/30 transition-all duration-300 hover:shadow-md mb-3">
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        <img src={item.src} alt={item.label} className="w-full aspect-square object-contain" />
                      </a>
                    ) : (
                      <img src={item.src} alt={item.label} className="w-full aspect-square object-contain" />
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)]" style={{ fontFamily: "var(--font-body)" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Speaking & Collaboration */}
      <section className="py-16 lg:py-20 bg-[var(--color-warm-gray)]">
        <div className="container">
          <div className="wide-column">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div className="fade-up">
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                >
                  {isEN ? "Speaking Engagements" : "演讲邀约"}
                </h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-4">
                  {isEN
                    ? "Monica is available for keynote speeches on the following topics:"
                    : "Monica可接受以下主题的主题演讲邀约："}
                </p>
                <ul className="space-y-2">
                  {(isEN
                    ? [
                        "Going-Global Trend Insights & Geopolitical Landscape",
                        "Market Opportunities in Middle East / Southeast Asia / South America / North America",
                        "AI Startup Vertical Track Opportunities",
                        "Founder Global IP Building",
                        "Opportunities for Women Entrepreneurs in the AI Era",
                        "Next-Generation Education in the AI Era",
                      ]
                    : [
                        "出海趋势洞察和地缘格局",
                        "中东/东南亚/南美/北美出海机会拆解",
                        "AI 创业垂直赛道机会拆解",
                        "创始人全球 IP 建设",
                        "AI 时代女性创业者机会洞察",
                        "AI 时代的未来一代教育",
                      ]
                  ).map((topic, i) => (
                    <li key={i} className="text-sm text-[var(--color-ink-light)] flex items-start gap-2">
                      <span className="text-[var(--color-terracotta)] font-bold mt-0.5 shrink-0">—</span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="fade-up stagger-1">
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                >
                  {isEN ? "Collaboration" : "合作机会"}
                </h3>
                <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-4">
                  {isEN
                    ? "Monica welcomes collaboration opportunities in:"
                    : "Monica欢迎以下领域的合作机会："}
                </p>
                <ul className="space-y-2">
                  {(isEN
                    ? [
                        "Founder Global IP Building",
                        "Startup Mentorship & Advisory",
                        "Going-Global Growth & Market Expansion",
                        "Community-Driven Product Incubation",
                        "OPC (One-Person Company) Capability Foundation",
                        "Events & Livestreams on Going-Global / Entrepreneurship / AI",
                      ]
                    : [
                        "创始人全球 IP 建设",
                        "创业指导与顾问",
                        "出海增长与市场拓展",
                        "社区驱动的产品孵化",
                        "OPC（一人公司）能力底座",
                        "「出海/创业/AI」主题活动&直播",
                      ]
                  ).map((item, i) => (
                    <li key={i} className="text-sm text-[var(--color-ink-light)] flex items-start gap-2">
                      <span className="text-[var(--color-terracotta)] font-bold mt-0.5 shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="reading-column text-center">
            <h2
              className="fade-up text-2xl lg:text-3xl font-bold mb-4"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              {isEN ? "Reach Out Directly" : "直接联系"}
            </h2>
            <p className="fade-up stagger-1 text-[var(--color-ink-muted)] leading-relaxed mb-6">
              {isEN
                ? "For business inquiries, media requests, or collaboration proposals, connect with Monica through her social channels or send a direct message on Instagram."
                : "商务咨询、媒体邀约或合作提案，请通过社交媒体渠道联系Monica，或在Instagram上发送私信。"}
            </p>
            <a
              href="https://www.instagram.com/chinabymonica"
              target="_blank"
              rel="noopener noreferrer"
              className="fade-up stagger-2 inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-terracotta)] text-white text-sm tracking-wide hover:bg-[var(--color-terracotta-light)] transition-colors duration-300"
            >
              <Instagram size={16} />
              {isEN ? "Message on Instagram" : "Instagram 私信联系"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
