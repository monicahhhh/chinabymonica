import { useLanguage } from "@/contexts/LanguageContext";

const PAGE_URL = "/deepseek-v4-web-en.html";

export default function DeepSeekV4() {
  const { lang } = useLanguage();
  const isEN = lang === "en";

  return (
    <div className="pt-24 lg:pt-28 bg-[var(--color-warm-gray)]">
      <div className="container pb-8 lg:pb-10">
        <div className="wide-column">
          <p
            className="text-xs uppercase tracking-[0.3em] text-[var(--color-ink-muted)] mb-3"
            style={{ fontFamily: "var(--font-body)" }}
          >
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
        </div>
      </div>

      <div className="border-y border-[var(--color-ink)]/10 bg-white">
        <iframe
          src={PAGE_URL}
          title="DeepSeek V4 Web EN"
          className="w-full h-[calc(100vh-7.5rem)] min-h-[900px]"
        />
      </div>
    </div>
  );
}
