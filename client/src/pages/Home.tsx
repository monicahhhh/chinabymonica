/*
 * Design: Editorial Longform — "The New Yorker meets Bloomberg"
 * Home page: English version has hero + editorial intro + what we cover + about + insights + CTA.
 * Chinese version: Monica intro → What We Cover → Stay Connected (no hero/editorial intro).
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Globe, Lightbulb, Users } from "lucide-react";
import { Link } from "wouter";

const HERO_EN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/hero-en-C27JECFmTmMMGYA9GuYP8y.webp";
const MONICA_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/monica-photo_cc742672.jpg";
const BLOG_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/blog-placeholder-gvyXKEAnHN7R9Pye7ZSrTM.webp";

/* ===== Shared section components ===== */

function WhatWeCoverSection({ isEN, localePath }: { isEN: boolean; localePath: (p: string) => string }) {
  return (
    <section className="py-16 lg:py-24 bg-[var(--color-warm-gray)]">
      <div className="container">
        <div className="wide-column">
          <p
            className="fade-up text-xs uppercase tracking-[0.3em] text-[var(--color-ink-muted)] mb-3"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {isEN ? "What We Cover" : "我们在关注什么"}
          </p>
          <h2
            className="fade-up stagger-1 text-3xl lg:text-4xl font-bold mb-12"
            style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
          >
            {isEN ? "Deep Dives Into What Matters" : "深入探索真正重要的事"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: <Globe size={24} />,
                titleEN: "Global Growth Insights",
                titleZH: "出海洞察",
                descEN: "Focused on the 0-to-1 globalization growth path for enterprises. In-depth analysis of GTM strategies, omni-channel growth models, and localization operations for products going global — helping Chinese companies land precisely and acquire customers efficiently in overseas markets.",
                descZH: "聚焦企业从 0 到 1 的全球化增长路径。深度解析产品出海的 GTM 策略、全渠道增长模型及本土化运营实战，助力中国企业在海外市场精准落地、高效获客。",
                tagsEN: ["Growth", "GTM", "Localization", "Hands-on"],
                tagsZH: ["增长", "GTM", "本土化", "实战"],
              },
              {
                icon: <Lightbulb size={24} />,
                titleEN: "Geopolitical Trends",
                titleZH: "地缘趋势",
                descEN: "Insights into the deep impact of global political and economic landscapes on business. Analyzing market entry opportunities, policy shifts, and geopolitical dynamics in emerging markets (Middle East, Southeast Asia, South America) — providing strategic risk navigation and opportunity mapping for going-global decisions.",
                descZH: "洞察全球政治经济格局对商业的深层影响。分析新兴市场（如中东、东南亚、南美）的准入机会、政策波动与地缘动向，为出海决策提供宏观视角的战略避雷与机遇导航。",
                tagsEN: ["Macro Dynamics", "Regional Opportunities", "Risk Mitigation", "Market Windows"],
                tagsZH: ["宏观动态", "区域机遇", "风险规避", "市场窗口"],
              },
              {
                icon: <Users size={24} />,
                titleEN: "Unicorn Analysis",
                titleZH: "独角兽拆解",
                descEN: "Deconstructing the underlying logic of top global tech unicorns and high-potential startups. Analyzing their product innovation paths, business model evolution, and core technology moats — uncovering replicable success paradigms and future technology trends.",
                descZH: "拆解全球顶级科技独角兽及高潜力初创企业的底层逻辑。剖析其产品创新路径、商业模式演进与核心技术壁垒，挖掘值得复刻的成功范式与未来技术风向。",
                tagsEN: ["Tech Products", "Business Models", "Core Logic", "Benchmarking"],
                tagsZH: ["科技产品", "商业模式", "底层逻辑", "对标参考"],
              },
            ].map((item, i) => (
              <div key={i} className={`fade-up stagger-${i + 1} group`}>
                <div className="flex items-start gap-4">
                  <div className="text-[var(--color-terracotta)] mt-1 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2 group-hover:text-[var(--color-terracotta)] transition-colors"
                      style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                    >
                      {isEN ? item.titleEN : item.titleZH}
                    </h3>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-3">
                      {isEN ? item.descEN : item.descZH}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(isEN ? item.tagsEN : item.tagsZH).map((tag: string, j: number) => (
                        <span
                          key={j}
                          className="text-xs px-2 py-1 bg-[var(--color-terracotta)]/8 text-[var(--color-terracotta)] border border-[var(--color-terracotta)]/15"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button to Insights */}
          <div className="fade-up stagger-4 mt-12 text-center">
            <Link
              href={localePath("/insights")}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-terracotta)] text-white font-medium hover:bg-[var(--color-terracotta-dark,#b5543a)] transition-colors duration-300"
            >
              {isEN ? "Explore All Insights" : "查看全部洞察"}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const QR_WECHAT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-wechat-new2_be983b3c.png";
const QR_VIDEO_CHANNEL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-001_d78255b8.png";
const QR_TIKTOK = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-002_b1d00778.png";
const QR_INSTAGRAM = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-003_885dc0e3.png";
const QR_LINKEDIN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-004_df7acb16.png";
const QR_GONGZHONGHAO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/qr-gongzhonghao_b608c1f3.jpg";

function StayConnectedSection({ isEN }: { isEN: boolean }) {
  const qrItems = isEN
    ? [
        { src: QR_INSTAGRAM, label: "Instagram", link: "https://www.instagram.com/chinabymonica" },
        { src: QR_TIKTOK, label: "TikTok", link: "https://www.tiktok.com/@chinabymonica" },
        { src: QR_LINKEDIN, label: "LinkedIn", link: "https://www.linkedin.com/in/chinabymonica" },
        { src: QR_WECHAT, label: "WeChat", link: undefined },
        { src: QR_VIDEO_CHANNEL, label: "Wechat Video Channel", link: undefined },
        { src: QR_GONGZHONGHAO, label: "Wechat Official Account", link: undefined },
      ]
    : [
        { src: QR_WECHAT, label: "微信", link: undefined },
        { src: QR_VIDEO_CHANNEL, label: "视频号：Monica出海说", link: undefined },
        { src: QR_GONGZHONGHAO, label: "公众号", link: undefined },
        { src: QR_INSTAGRAM, label: "Instagram", link: "https://www.instagram.com/chinabymonica" },
        { src: QR_TIKTOK, label: "TikTok", link: "https://www.tiktok.com/@chinabymonica" },
        { src: QR_LINKEDIN, label: "LinkedIn", link: "https://www.linkedin.com/in/chinabymonica" },
      ];

  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="wide-column">
          <div className="text-center mb-12">
            <h2
              className="fade-up text-3xl lg:text-4xl font-bold mb-4"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              {isEN ? "Stay Connected" : "保持连接"}
            </h2>
            <p className="fade-up stagger-1 text-[var(--color-ink-muted)] leading-relaxed max-w-xl mx-auto">
              {isEN
                ? "Follow Monica across platforms for weekly insights on globalization, AI, and entrepreneurship."
                : "关注Monica的各个平台，获取每周关于出海、AI和创业的深度洞察。"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
            {qrItems.map((item, i) => (
              <div key={i} className={`fade-up stagger-${i + 1} text-center group`}>
                <div className="bg-white p-3 border border-[var(--color-ink)]/8 hover:border-[var(--color-terracotta)]/30 transition-all duration-300 hover:shadow-md mb-3">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      <img
                        src={item.src}
                        alt={item.label}
                        className="w-full aspect-square object-contain"
                      />
                    </a>
                  ) : (
                    <img
                      src={item.src}
                      alt={item.label}
                      className="w-full aspect-square object-contain"
                    />
                  )}
                </div>
                <p
                  className="text-xs text-[var(--color-ink-muted)] group-hover:text-[var(--color-terracotta)] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPreviewSection({ isEN, localePath }: { isEN: boolean; localePath: (p: string) => string }) {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="wide-column">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Photo */}
            <div className="lg:col-span-2 fade-up">
              <div className="relative">
                <img
                  src={MONICA_PHOTO}
                  alt="Monica"
                  className="w-full max-w-sm mx-auto lg:mx-0 object-contain"
                  style={{ filter: "contrast(1.05) saturate(0.9)" }}
                />
                <div className="absolute -bottom-3 -right-3 w-full h-full border-2 border-[var(--color-terracotta)]/20 -z-10" />
              </div>
            </div>

            {/* Bio */}
            <div className="lg:col-span-3">
              <p
                className="fade-up text-xs uppercase tracking-[0.3em] text-[var(--color-ink-muted)] mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {isEN ? "About the Author" : "关于"}
              </p>
              <h2
                className="fade-up stagger-1 text-3xl lg:text-4xl font-bold mb-4"
                style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
              >
                {isEN ? "Monica Wang" : "Monica"}
              </h2>
              <p
                className="fade-up stagger-1 text-sm text-[var(--color-ink-muted)] mb-6"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {isEN
                  ? (
                    <>
                      Founder of Pitchless AI · Serial Entrepreneur · Mother of Three · Marathon Runner
                      <br />
                      GO SUMMIT Initiator · AGI Villa Initiator (3,000+ AI Entrepreneurs)
                    </>
                  )
                  : (
                    <>
                      Pitchless AI创始人 · 连续创业者 · 三宝妈 · 马拉松跑者
                      <br />
                      GO SUMMIT发起人 · AGI Villa 发起人（3,000+ AI 创业者）
                    </>
                  )}
              </p>
              <p className="fade-up stagger-2 text-[var(--color-ink-light)] leading-relaxed mb-4">
                {isEN
                  ? "Serial entrepreneur, former journalist at Xinhua News Agency, and initiator of AGI Villa. Over 15 years, Monica has visited 50 countries, served as CEO and CMO of unicorn companies in AI programming, youth education, Web3, local lifestyle, and social e-commerce — raising over 1.5 billion RMB from Sequoia Capital, Linear Venture, Legend Capital, and Sinovation Ventures."
                  : "记者出身，15年间走访50国，是科技出海的深度观察者和连接者。曾任AI编程、青少年教育、Web3、本地生活、社交电商独角兽CEO/CMO，创业项目累计融资超15亿元（红杉/线性/君联/创新工场等）。"}
              </p>
              <p className="fade-up stagger-3 text-[var(--color-ink-light)] leading-relaxed mb-6">
                {isEN
                  ? "A mother of three, marathon runner, and deep observer of tech globalization — Monica bridges the gap between China's innovation ecosystem and the rest of the world."
                  : "每周三「出海×AI×创业」直播（视频号：Monica出海说），致力于连接中国创新生态与世界。"}
              </p>
              <Link href={localePath("/about")}>
                <span className="fade-up stagger-4 inline-flex items-center gap-2 text-[var(--color-terracotta)] text-sm font-medium hover:gap-3 transition-all duration-300">
                  {isEN ? "Read Full Profile" : "查看完整介绍"}
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  "global-growth": { en: "Global Growth Insights", zh: "出海洞察" },
  "geopolitical-trends": { en: "Geopolitical Trends", zh: "地缘趋势" },
  "unicorn-analysis": { en: "Unicorn Analysis", zh: "独角兽拆解" },
};

function InsightsPreviewSection({ isEN, localePath }: { isEN: boolean; localePath: (p: string) => string }) {
  const { data: articles, isLoading } = trpc.article.list.useQuery();
  const latestArticles = (articles ?? []).slice(0, 3);

  return (
    <section className="py-16 lg:py-24 bg-[var(--color-warm-gray)]">
      <div className="container">
        <div className="wide-column">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="fade-up text-xs uppercase tracking-[0.3em] text-[var(--color-ink-muted)] mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {isEN ? "Latest" : "最新"}
              </p>
              <h2
                className="fade-up stagger-1 text-3xl lg:text-4xl font-bold"
                style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
              >
                {isEN ? "Insights & Analysis" : "洞察与分析"}
              </h2>
            </div>
            <Link href={localePath("/insights")}>
              <span className="fade-up hidden sm:inline-flex items-center gap-2 text-[var(--color-terracotta)] text-sm font-medium hover:gap-3 transition-all duration-300">
                {isEN ? "View All" : "查看全部"}
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[16/10] bg-[var(--color-ink)]/10 mb-4" />
                  <div className="h-3 w-24 bg-[var(--color-ink)]/10 mb-3" />
                  <div className="h-5 w-full bg-[var(--color-ink)]/10 mb-2" />
                  <div className="h-5 w-3/4 bg-[var(--color-ink)]/10 mb-2" />
                  <div className="h-3 w-20 bg-[var(--color-ink)]/10" />
                </div>
              ))}
            </div>
          ) : latestArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestArticles.map((article, i) => (
                <Link
                  key={article.id}
                  href={localePath(`/insights/${article.slug}`)}
                  className={`fade-up stagger-${i + 1} group cursor-pointer block`}
                >
                  <div className="aspect-[16/10] overflow-hidden mb-4 bg-[var(--color-ink)]/5">
                    <img
                      src={article.coverImage || BLOG_IMG}
                      alt={isEN ? article.titleEN : article.titleZH}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={!article.coverImage ? { filter: `hue-rotate(${i * 30}deg) saturate(0.8)` } : undefined}
                    />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-terracotta)] mb-2" style={{ fontFamily: "var(--font-body)" }}>
                    {CATEGORY_LABELS[article.category]?.[isEN ? "en" : "zh"] ?? article.category}
                  </p>
                  <h3
                    className="text-lg font-semibold leading-snug mb-2 group-hover:text-[var(--color-terracotta)] transition-colors duration-300"
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {isEN ? article.titleEN : article.titleZH}
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString(isEN ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" })
                      : isEN ? "Coming Soon" : "即将发布"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--color-ink-muted)] py-12">
              {isEN ? "Articles coming soon. Stay tuned!" : "文章即将发布，敬请期待！"}
            </p>
          )}

          <div className="sm:hidden mt-8 text-center">
            <Link href={localePath("/insights")}>
              <span className="inline-flex items-center gap-2 text-[var(--color-terracotta)] text-sm font-medium">
                {isEN ? "View All Insights" : "查看全部洞察"}
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== Main Home Component ===== */

export default function Home() {
  const { lang, localePath } = useLanguage();
  const isEN = lang === "en";
  const revealRef = useScrollReveal();

  if (!isEN) {
    // Chinese layout: Monica intro → What We Cover → Insights → Stay Connected
    return (
      <div ref={revealRef}>
        <AboutPreviewSection isEN={false} localePath={localePath} />
        <WhatWeCoverSection isEN={false} localePath={localePath} />
        <InsightsPreviewSection isEN={false} localePath={localePath} />
        <StayConnectedSection isEN={false} />
      </div>
    );
  }

  // English layout: Hero → Editorial Intro → What We Cover → About Preview → Insights → Stay Connected
  return (
    <div ref={revealRef}>
      {/* ===== HERO SECTION ===== */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_EN})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>

        <div className="relative h-full container flex flex-col justify-end pb-16 lg:pb-24">
          <div className="max-w-3xl">
            <p
              className="fade-up text-white/70 text-xs uppercase tracking-[0.3em] mb-4"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Stories from China to the World
            </p>
            <h1
              className="fade-up stagger-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white font-bold leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Breaking the <br className="hidden sm:block" />
              <span className="italic">Information Barrier</span>
            </h1>
            <p
              className="fade-up stagger-2 text-white/80 text-lg lg:text-xl max-w-xl leading-relaxed mb-8"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Deep insights into Chinese founders, companies, and the forces shaping the world's second-largest economy.
            </p>
            <div className="fade-up stagger-3 flex flex-wrap gap-4">
              <Link href={localePath("/insights")}>
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-terracotta)] text-white text-sm tracking-wide hover:bg-[var(--color-terracotta-light)] transition-colors duration-300">
                  Read Insights
                  <ArrowRight size={16} />
                </span>
              </Link>
              <Link href={localePath("/about")}>
                <span className="inline-flex items-center gap-2 px-6 py-3 border border-white/40 text-white text-sm tracking-wide hover:bg-white/10 transition-colors duration-300">
                  About Monica
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EDITORIAL INTRO ===== */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="reading-column">
            <hr className="editorial-rule-bold mb-8 fade-up" />
            <p
              className="fade-up text-xl lg:text-2xl leading-relaxed text-[var(--color-ink)] drop-cap"
              style={{ fontFamily: "var(--font-body)" }}
            >
              For too long, the stories of Chinese entrepreneurs have been filtered through secondhand narratives. ChinabyMonica exists to change that — offering firsthand perspectives from someone who has spent 15 years traversing 50 countries, building companies, and connecting ecosystems across borders.
            </p>
            <hr className="editorial-rule mt-8 fade-up" />
          </div>
        </div>
      </section>

      <WhatWeCoverSection isEN={true} localePath={localePath} />
      <AboutPreviewSection isEN={true} localePath={localePath} />
      <InsightsPreviewSection isEN={true} localePath={localePath} />
      <StayConnectedSection isEN={true} />
    </div>
  );
}
