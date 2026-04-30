/*
 * Design: Editorial Longform — "The New Yorker meets Bloomberg"
 * Connect page: Social media links, live stream info, and contact info.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Video, Radio, Instagram } from "lucide-react";

export default function Connect() {
  const { lang } = useLanguage();
  const isEN = lang === "en";
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef}>
      {/* Header */}
      <section className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="container">
          <div className="wide-column">
            <p
              className="fade-up text-xs uppercase tracking-[0.3em] text-[var(--color-ink-muted)] mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {isEN ? "Connect" : "联系"}
            </p>
            <h1
              className="fade-up stagger-1 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              {isEN ? (
                <>
                  Join the <span className="italic">Conversation</span>
                </>
              ) : (
                "加入对话"
              )}
            </h1>
            <p className="fade-up stagger-2 text-lg text-[var(--color-ink-light)] max-w-2xl leading-relaxed">
              {isEN
                ? "Follow Monica across platforms, tune into the weekly live stream, or reach out for collaboration and speaking opportunities."
                : "关注Monica的各个平台，收看每周直播，或联系合作与演讲机会。"}
            </p>
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
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-001_d78255b8.png", label: "Wechat Video Channel", link: undefined as string | undefined },
                    { src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-gongzhonghao_b608c1f3.jpg", label: "Wechat Official Account", link: undefined as string | undefined },
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
