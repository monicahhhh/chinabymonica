import { createContext, useContext, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useLocation } from "wouter";

type Language = "en" | "zh";

interface LanguageContextType {
  lang: Language;
  /** Returns the correct path prefix for the current language */
  prefix: string;
  /** Build a language-aware link: localePath("/about") → "/about" or "/cn/about" */
  localePath: (path: string) => string;
  /** Bilingual text helper */
  t: (en: string, zh: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  // Derive language from URL path
  const lang: Language = location.startsWith("/cn") ? "zh" : "en";
  const prefix = lang === "zh" ? "/cn" : "";

  const localePath = useCallback(
    (path: string) => {
      if (lang === "zh") {
        return path === "/" ? "/cn" : `/cn${path}`;
      }
      return path;
    },
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    if (lang === "zh") {
      document.documentElement.classList.add("cn");
    } else {
      document.documentElement.classList.remove("cn");
    }
  }, [lang]);

  const t = useCallback(
    (en: string, zh: string) => (lang === "en" ? en : zh),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, prefix, localePath, t }),
    [lang, prefix, localePath, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
