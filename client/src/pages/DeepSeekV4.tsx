import { Streamdown } from "streamdown";
import analysisMarkdown from "@/content/deepseek-v4-analysis-en.md?raw";
import analysisMarkdownZH from "@/content/deepseek-v4-analysis-zh.md?raw";
import { useLanguage } from "@/contexts/LanguageContext";

const DOC_URL =
  "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf";
const APPENDIX_HEADINGS = [
  "## Appendix: Key Numbers at a Glance",
  "## 附：关键数字速查表",
];

function moveAppendixToTop(markdown: string): string {
  const appendixHeading = APPENDIX_HEADINGS.find((heading) =>
    markdown.includes(heading),
  );
  if (!appendixHeading) return markdown;

  const appendixStart = markdown.indexOf(appendixHeading);
  if (appendixStart === -1) return markdown;

  const afterAppendixStart = markdown.slice(appendixStart + appendixHeading.length);
  const nextTopHeadingOffset = afterAppendixStart.search(/\n##\s+/);
  const appendixEnd =
    nextTopHeadingOffset === -1
      ? markdown.length
      : appendixStart + appendixHeading.length + nextTopHeadingOffset + 1;

  const appendixSection = markdown.slice(appendixStart, appendixEnd).trim();
  const withoutAppendix = `${markdown.slice(0, appendixStart)}${markdown.slice(appendixEnd)}`.trim();

  const firstTopHeadingOffset = withoutAppendix.search(/\n##\s+/);
  if (firstTopHeadingOffset === -1) {
    return `${appendixSection}\n\n---\n\n${withoutAppendix}`.trim();
  }

  const introPart = withoutAppendix.slice(0, firstTopHeadingOffset).trim();
  const remainingPart = withoutAppendix.slice(firstTopHeadingOffset + 1).trim();

  return `${introPart}\n\n${appendixSection}\n\n---\n\n${remainingPart}`.trim();
}

export default function DeepSeekV4() {
  const { lang } = useLanguage();
  const isEN = lang === "en";
  const sourceMarkdown = isEN ? analysisMarkdown : analysisMarkdownZH;
  const displayMarkdown = moveAppendixToTop(sourceMarkdown);

  return (
    <div className="pt-24 pb-16 lg:pt-32 lg:pb-20">
      <div className="container">
        <div className="wide-column">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mb-3">
            {isEN ? "Document" : "文档"}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
          >
            DeepSeek V4
          </h1>
          <p className="text-[var(--color-ink-muted)] mb-6">
            {isEN
              ? "This page publishes the full analysis file. The appendix is moved to the top for quick reference."
              : "本页已发布完整解析文件，并将 Appendix（关键数据总览）置顶展示，方便快速查阅。"}
          </p>

          <a
            href={DOC_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium bg-[var(--color-ink)] text-white hover:opacity-90 transition-opacity mb-8"
          >
            {isEN ? "Open Source Document" : "打开原始文档"}
          </a>

          <div className="prose prose-neutral max-w-none border border-[var(--color-ink)]/10 bg-white p-6 lg:p-8">
            <Streamdown>{displayMarkdown}</Streamdown>
          </div>
        </div>
      </div>
    </div>
  );
}
