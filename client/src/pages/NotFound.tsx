/*
 * Design: Editorial Longform
 * 404 page: Minimal, editorial-style.
 */
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const { lang } = useLanguage();
  const isEN = lang === "en";

  // Determine the correct home path based on whether the URL starts with /cn
  const homePath = location.startsWith("/cn") ? "/cn" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="text-center px-4">
        <p
          className="text-8xl lg:text-9xl font-bold text-[var(--color-ink)]/10 mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </p>
        <h1
          className="text-2xl lg:text-3xl font-bold mb-4"
          style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
        >
          {isEN ? "Page Not Found" : "页面未找到"}
        </h1>
        <p className="text-[var(--color-ink-muted)] mb-8 max-w-md mx-auto">
          {isEN
            ? "The page you're looking for doesn't exist or has been moved."
            : "您寻找的页面不存在或已被移动。"}
        </p>
        <button
          onClick={() => setLocation(homePath)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-terracotta)] text-white text-sm tracking-wide hover:bg-[var(--color-terracotta-light)] transition-colors duration-300"
        >
          <ArrowLeft size={16} />
          {isEN ? "Back to Home" : "返回首页"}
        </button>
      </div>
    </div>
  );
}
