import { useLanguage } from "@/contexts/LanguageContext";

const PAGE_URL = "/deepseek-v4-web-en.html";
const PAGE_URL_ZH = "/deepseek-v4-web-zh.html";

export default function DeepSeekV4() {
  const { lang } = useLanguage();
  const isEN = lang === "en";

  return (
    <div className="pt-24 lg:pt-28 bg-[var(--color-warm-gray)]">
      <div className="border-y border-[var(--color-ink)]/10 bg-white">
        <iframe
          src={isEN ? PAGE_URL : PAGE_URL_ZH}
          title={isEN ? "DeepSeek V4 Web EN" : "DeepSeek V4 Web ZH"}
          className="w-full h-[calc(100vh-7.5rem)] min-h-[900px]"
        />
      </div>
    </div>
  );
}
