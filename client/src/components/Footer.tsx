/*
 * Design: Editorial Longform
 * Footer: Minimal, editorial-style with social links and copyright.
 * Links are language-aware: /cn prefix for Chinese.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { Instagram, Youtube } from "lucide-react";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.79a4.84 4.84 0 01-1-.1z"/>
    </svg>
  );
}

export default function Footer() {
  const { lang, localePath } = useLanguage();
  const isEN = lang === "en";

  const navLinks = [
    { path: "/", labelEN: "Home", labelZH: "首页" },
    { path: "/about", labelEN: "About", labelZH: "关于Monica" },
    { path: "/insights", labelEN: "Insights", labelZH: "洞察" },
    { path: "/connect", labelEN: "Connect", labelZH: "联系" },
  ];

  return (
    <footer className="border-t border-[var(--color-ink)]/10 mt-24">
      <div className="container py-12 lg:py-16">
        <div className="wide-column">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Brand */}
            <div>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
              >
                {isEN ? "ChinabyMonica" : "Monica出海说"}
              </h3>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {isEN
                  ? "Breaking information barriers between China and the world. Stories, insights, and connections."
                  : "打破信息差，连接中国与世界。出海洞察、地缘分析、独角兽拆解。"}
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                {isEN ? "Navigate" : "导航"}
              </h4>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.path}
                    href={localePath(link.path)}
                    className="text-sm text-[var(--color-ink-light)] hover:text-[var(--color-terracotta)] transition-colors"
                  >
                    {isEN ? link.labelEN : link.labelZH}
                  </a>
                ))}
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)] mb-4" style={{ fontFamily: "var(--font-body)" }}>
                {isEN ? "Follow" : "关注"}
              </h4>
              <div className="flex gap-4 mb-4">
                <a
                  href="https://www.instagram.com/chinabymonica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-ink-light)] hover:text-[var(--color-terracotta)] transition-colors"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://www.tiktok.com/@chinabymonica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-ink-light)] hover:text-[var(--color-terracotta)] transition-colors"
                >
                  <TikTokIcon size={18} />
                </a>
                <a
                  href="https://www.youtube.com/@chinabymonica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-ink-light)] hover:text-[var(--color-terracotta)] transition-colors"
                >
                  <Youtube size={18} />
                </a>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {isEN
                  ? "Weekly Wednesday Live Stream"
                  : "每周三直播「出海×AI×创业」"}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {isEN
                  ? "WeChat Video Channel: Monica出海说"
                  : "视频号：Monica出海说"}
              </p>
            </div>
          </div>

          <hr className="editorial-rule my-8" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--color-ink-muted)]">
              © {new Date().getFullYear()} ChinabyMonica. All rights reserved.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              www.chinabymonica.com
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
