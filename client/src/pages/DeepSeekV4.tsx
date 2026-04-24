import { useLanguage } from "@/contexts/LanguageContext";

const PAGE_URL = "/deepseek-v4-web-en.html";

export default function DeepSeekV4() {
  const { lang } = useLanguage();
  const isEN = lang === "en";

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
              ? "This page directly publishes your provided DeepSeek V4 HTML page."
              : "本页直接发布你提供的 DeepSeek V4 网页内容。"}
          </p>

          <a
            href={PAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium bg-[var(--color-ink)] text-white hover:opacity-90 transition-opacity mb-8"
          >
            {isEN ? "Open Full Page" : "打开完整页面"}
          </a>

          <div className="border border-[var(--color-ink)]/10 bg-white overflow-hidden">
            <iframe
              src={PAGE_URL}
              title="DeepSeek V4 Web EN"
              className="w-full h-[82vh] min-h-[760px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
