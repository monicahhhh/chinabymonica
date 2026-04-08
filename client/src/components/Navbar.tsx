/*
 * Design: Editorial Longform — "The New Yorker meets Bloomberg"
 * Navbar: Thin top bar, minimal, disappears on scroll down, reappears on scroll up.
 * When transparent (over hero), uses white text. When scrolled, uses dark text on paper bg.
 * Language switch navigates between / and /cn paths.
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { lang, localePath } = useLanguage();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isEN = lang === "en";

  // Only show transparent nav on home page (/ or /cn)
  const isHomePage = location === "/" || location === "/cn";

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 60);
      setHidden(currentY > lastScrollY && currentY > 200);
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const siteName = isEN ? "ChinabyMonica" : "Monica出海说";

  // Transparent mode: on home page when not scrolled
  const isTransparent = isHomePage && !scrolled;

  const navLinks = isEN
    ? [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/insights", label: "Insights" },
        { href: "/connect", label: "Connect" },
      ]
    : [
        { href: "/cn", label: "首页" },
        { href: "/cn/about", label: "关于Monica" },
        { href: "/cn/insights", label: "洞察" },
        { href: "/cn/connect", label: "联系" },
      ];

  // Language toggle: navigate to the equivalent page in the other language
  const getLangSwitchHref = () => {
    if (isEN) {
      // Switch to Chinese: prepend /cn
      return location === "/" ? "/cn" : `/cn${location}`;
    } else {
      // Switch to English: remove /cn prefix
      return location === "/cn" ? "/" : location.replace(/^\/cn/, "");
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${
          isTransparent
            ? "bg-transparent"
            : "bg-[var(--color-paper)]/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Site name */}
            <Link href={isEN ? "/" : "/cn"}>
              <span
                className={`text-lg lg:text-xl tracking-tight font-semibold transition-colors duration-300 ${
                  isTransparent ? "text-white" : "text-[var(--color-ink)]"
                }`}
                style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
              >
                {siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-sm tracking-wide transition-colors duration-200 hover:text-[var(--color-terracotta)] ${
                      location === link.href
                        ? "text-[var(--color-terracotta)]"
                        : isTransparent
                        ? "text-white/80"
                        : "text-[var(--color-ink-light)]"
                    }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}

              {/* Language toggle — navigates to the other language version */}
              <Link href={getLangSwitchHref()}>
                <span
                  className={`text-sm tracking-wide px-3 py-1 border rounded-sm transition-all duration-200 ${
                    isTransparent
                      ? "border-white/30 text-white/80 hover:bg-white/10"
                      : "border-[var(--color-ink)]/15 text-[var(--color-ink-light)] hover:bg-[var(--color-ink)]/5"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {isEN ? "中文" : "EN"}
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 transition-colors duration-300 ${
                isTransparent ? "text-white" : "text-[var(--color-ink)]"
              }`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--color-paper)] pt-20 md:hidden">
          <div className="container">
            <div className="flex flex-col gap-6 py-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-2xl transition-colors duration-200 ${
                      location === link.href
                        ? "text-[var(--color-terracotta)]"
                        : "text-[var(--color-ink)]"
                    }`}
                    style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <hr className="editorial-rule my-2" />
              <Link href={getLangSwitchHref()}>
                <span
                  className="text-lg text-[var(--color-ink-light)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {isEN ? "切换到中文" : "Switch to English"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
