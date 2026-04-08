/**
 * ArticlePreview — Modal dialog showing the article as it would appear on the site.
 * Uses the same .article-content CSS styles as ArticleDetail.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ArticlePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleZH: string;
  titleEN: string;
  subtitleZH?: string;
  subtitleEN?: string;
  contentZH: string;
  contentEN: string;
  author: string;
  category: string;
  coverImage?: string;
}

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  "global-growth": { zh: "出海洞察", en: "Global Growth Insights" },
  "geopolitical-trends": { zh: "地缘趋势", en: "Geopolitical Trends" },
  "unicorn-analysis": { zh: "独角兽拆解", en: "Unicorn Analysis" },
};

export default function ArticlePreview({
  open,
  onOpenChange,
  titleZH,
  titleEN,
  subtitleZH,
  subtitleEN,
  contentZH,
  contentEN,
  author,
  category,
  coverImage,
}: ArticlePreviewProps) {
  const tag = CATEGORY_LABELS[category] ?? { zh: category, en: category };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--color-paper,#faf8f5)]">
        <DialogHeader>
          <DialogTitle className="text-lg">文章预览</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="zh" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="zh">中文版</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          {/* Chinese preview */}
          <TabsContent value="zh">
            <div className="cn">
              <PreviewBody
                tag={tag.zh}
                title={titleZH}
                subtitle={subtitleZH}
                content={contentZH}
                author={author}
                coverImage={coverImage}
                isEN={false}
              />
            </div>
          </TabsContent>

          {/* English preview */}
          <TabsContent value="en">
            <PreviewBody
              tag={tag.en}
              title={titleEN}
              subtitle={subtitleEN}
              content={contentEN}
              author={author}
              coverImage={coverImage}
              isEN={true}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  tag,
  title,
  subtitle,
  content,
  author,
  coverImage,
  isEN,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  content: string;
  author: string;
  coverImage?: string;
  isEN: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Category tag */}
      <p
        className="text-xs uppercase tracking-[0.2em] mb-3"
        style={{
          color: "var(--color-terracotta, #c4613c)",
          fontFamily: "var(--font-body)",
        }}
      >
        {tag}
      </p>

      {/* Title */}
      <h1
        className="text-2xl sm:text-3xl font-bold mb-4 leading-tight"
        style={{
          fontFamily: isEN
            ? "var(--font-display)"
            : "var(--font-serif-cn)",
          color: "var(--color-ink)",
        }}
      >
        {title || (isEN ? "(No title)" : "(无标题)")}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p
          className="text-base mb-3 leading-relaxed"
          style={{ color: "var(--color-ink-muted)" }}
        >
          {subtitle}
        </p>
      )}

      {/* Author */}
      {author && (
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
          {isEN ? "By" : "作者："} {author}
        </p>
      )}

      {/* Cover image */}
      {coverImage && (
        <img
          src={coverImage}
          alt=""
          className="w-full rounded-md mb-6 object-cover max-h-80"
        />
      )}

      {/* Divider */}
      <hr
        className="mb-8"
        style={{
          border: "none",
          height: "1px",
          background: "var(--color-ink)",
          opacity: 0.15,
        }}
      />

      {/* Article content with editorial styles */}
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: content || (isEN ? "<p><em>No content yet.</em></p>" : "<p><em>暂无内容。</em></p>") }}
      />
    </div>
  );
}
