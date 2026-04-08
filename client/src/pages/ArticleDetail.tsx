/*
 * Design: Editorial Longform — article detail page
 * Reads article from database via tRPC. Content is stored as HTML.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  "global-growth": { en: "Global Growth Insights", zh: "出海洞察" },
  "geopolitical-trends": { en: "Geopolitical Trends", zh: "地缘趋势" },
  "unicorn-analysis": { en: "Unicorn Analysis", zh: "独角兽拆解" },
};

export default function ArticleDetail() {
  const { lang, localePath } = useLanguage();
  const isEN = lang === "en";
  const revealRef = useScrollReveal();
  const params = useParams<{ id: string }>();

  const { data: article, isLoading } = trpc.article.getBySlug.useQuery(
    { slug: params.id || "" },
    { enabled: !!params.id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-ink-muted)]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div ref={revealRef} className="pt-32 pb-20">
        <div className="container">
          <div className="reading-column text-center">
            <h1 className="text-2xl font-bold mb-4">
              {isEN ? "Article Not Found" : "文章未找到"}
            </h1>
            <Link
              href={localePath("/insights")}
              className="text-[var(--color-terracotta)] hover:underline"
            >
              {isEN ? "← Back to Insights" : "← 返回洞察"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const title = isEN ? article.titleEN : article.titleZH;
  const subtitle = isEN ? (article.subtitleEN ?? "") : (article.subtitleZH ?? "");
  const tag = CATEGORY_LABELS[article.category]?.[isEN ? "en" : "zh"] ?? article.category;
  const content = isEN ? article.contentEN : article.contentZH;
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(isEN ? "en-US" : "zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div ref={revealRef}>
      {/* Header */}
      <section className="pt-24 pb-8 lg:pt-32 lg:pb-12">
        <div className="container">
          <div className="reading-column">
            <Link
              href={localePath("/insights")}
              className="fade-up inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-terracotta)] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              {isEN ? "Back to Insights" : "返回洞察"}
            </Link>

            <div className="fade-up stagger-1 flex items-center gap-3 mb-4">
              <span
                className="text-xs uppercase tracking-[0.2em] text-[var(--color-terracotta)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {tag}
              </span>
              {dateStr && (
                <>
                  <span className="text-xs text-[var(--color-ink-muted)]">·</span>
                  <span className="text-xs text-[var(--color-ink-muted)]">{dateStr}</span>
                </>
              )}
            </div>

            <h1
              className="fade-up stagger-2 text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
            >
              {title}
            </h1>

            {subtitle && (
              <p className="fade-up stagger-3 text-lg text-[var(--color-ink-muted)] mb-4 leading-relaxed">
                {subtitle}
              </p>
            )}

            {article.author && (
              <p className="fade-up stagger-3 text-sm text-[var(--color-ink-muted)]">
                {isEN ? "By" : "作者："} {article.author}
              </p>
            )}
          </div>
        </div>
      </section>

      <hr className="editorial-rule container reading-column" />

      {/* Article Body — HTML content */}
      <section className="py-8 lg:py-12">
        <div className="container">
          <div className="reading-column">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </section>

      {/* Back to Insights */}
      <section className="py-12 lg:py-16 bg-[var(--color-warm-gray)]">
        <div className="container">
          <div className="reading-column text-center">
            <Link
              href={localePath("/insights")}
              className="inline-flex items-center gap-2 text-[var(--color-terracotta)] hover:underline font-medium"
            >
              <ArrowLeft size={16} />
              {isEN ? "Back to All Insights" : "返回所有洞察"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
