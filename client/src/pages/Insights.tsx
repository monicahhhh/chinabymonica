/*
 * Design: Editorial Longform — "The New Yorker meets Bloomberg"
 * Insights page: Blog/article listing — reads from database via tRPC.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const BLOG_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663505942366/duFsqgJ3sLuqSVf7ShnPai/blog-placeholder-gvyXKEAnHN7R9Pye7ZSrTM.webp";

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  "global-growth": { en: "Global Growth Insights", zh: "出海洞察" },
  "geopolitical-trends": { en: "Geopolitical Trends", zh: "地缘趋势" },
  "unicorn-analysis": { en: "Unicorn Analysis", zh: "独角兽拆解" },
};

export default function Insights() {
  const { lang, localePath } = useLanguage();
  const isEN = lang === "en";
  const revealRef = useScrollReveal();

  const { data: articles, isLoading } = trpc.article.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-ink-muted)]" />
      </div>
    );
  }

  const allArticles = articles ?? [];
  const featured = allArticles.find(a => a.featured) ?? allArticles[0];
  const rest = allArticles.filter(a => a !== featured);

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
              {isEN ? "Insights & Analysis" : "洞察与分析"}
            </p>
            <h1
              className="fade-up stagger-1 text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              {isEN ? (
                <>
                  Stories That <span className="italic">Matter</span>
                </>
              ) : (
                "真正重要的故事"
              )}
            </h1>
            <p className="fade-up stagger-2 text-lg text-[var(--color-ink-light)] max-w-2xl leading-relaxed">
              {isEN
                ? "Deep dives into Chinese founders, market dynamics, and the forces reshaping global technology and commerce."
                : "深度探索中国创始人、市场动态，以及重塑全球科技与商业的力量。"}
            </p>
          </div>
        </div>
      </section>

      <hr className="editorial-rule container wide-column" />

      {/* Featured Article */}
      {featured && (
        <section className="py-12 lg:py-16">
          <div className="container">
            <div className="wide-column">
              <Link href={localePath(`/insights/${featured.slug}`)}>
                <div className="group cursor-pointer grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 fade-up">
                  <div className="aspect-[16/10] overflow-hidden bg-[var(--color-ink)]/5">
                    <img
                      src={featured.coverImage || BLOG_IMG}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-terracotta)] mb-3" style={{ fontFamily: "var(--font-body)" }}>
                      {isEN ? "Featured" : "精选"} · {CATEGORY_LABELS[featured.category]?.[isEN ? "en" : "zh"] ?? featured.category}
                    </p>
                    <h2
                      className="text-2xl lg:text-3xl font-bold mb-4 group-hover:text-[var(--color-terracotta)] transition-colors duration-300"
                      style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                    >
                      {isEN ? featured.titleEN : featured.titleZH}
                    </h2>
                    <p className="text-[var(--color-ink-muted)] leading-relaxed mb-4">
                      {isEN ? (featured.subtitleEN ?? "") : (featured.subtitleZH ?? "")}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {featured.publishedAt
                        ? new Date(featured.publishedAt).toLocaleDateString(isEN ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" })
                        : ""}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-terracotta)] group-hover:gap-2 transition-all duration-300">
                      {isEN ? "Read Full Article" : "阅读全文"} →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {rest.length > 0 && <hr className="editorial-rule container wide-column" />}

      {/* Article Grid */}
      {rest.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="container">
            <div className="wide-column">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {rest.map((article, i) => (
                  <Link
                    key={article.id}
                    href={localePath(`/insights/${article.slug}`)}
                    className={`fade-up stagger-${Math.min(i + 1, 5)} group cursor-pointer block`}
                  >
                    <div className="aspect-[16/10] overflow-hidden mb-4 bg-[var(--color-ink)]/5">
                      <img
                        src={article.coverImage || BLOG_IMG}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={!article.coverImage ? { filter: `hue-rotate(${(i * 30) % 360}deg) saturate(0.8)` } : undefined}
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
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-2">
                      {isEN ? (article.subtitleEN ?? "") : (article.subtitleZH ?? "")}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString(isEN ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" })
                        : ""}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-terracotta)] group-hover:gap-2 transition-all duration-300">
                      {isEN ? "Read More" : "阅读全文"} →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {allArticles.length === 0 && (
        <section className="py-16 lg:py-20 bg-[var(--color-warm-gray)]">
          <div className="container">
            <div className="reading-column text-center">
              <h2
                className="fade-up text-2xl lg:text-3xl font-bold mb-4"
                style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
              >
                {isEN ? "More Stories Coming" : "更多故事即将到来"}
              </h2>
              <p className="fade-up stagger-1 text-[var(--color-ink-muted)] leading-relaxed">
                {isEN
                  ? "Monica is currently working on in-depth articles and analysis. Follow her on social media for the latest updates and weekly live streams every Wednesday."
                  : "Monica正在撰写深度文章和分析。关注她的社交媒体获取最新动态，每周三在视频号「Monica出海说」直播。"}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
