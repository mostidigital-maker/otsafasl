import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, languages, Language, TranslationShape } from "@/i18n/translations";

interface LanguageContextValue {
  lang: Language;
  dir: "rtl" | "ltr";
  setLang: (lang: Language) => void;
  t: TranslationShape;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "ar";
    const stored = localStorage.getItem("lang") as Language | null;
    if (stored && ["ar", "he", "en"].includes(stored)) return stored;
    const browserLangs = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean);
    for (const l of browserLangs) {
      const code = l.toLowerCase().split("-")[0];
      if (code === "ar" || code === "he" || code === "iw") return code === "iw" ? "he" : (code as Language);
      if (code === "en") return "en";
    }
    return "ar";
  });

  const dir = languages.find((l) => l.code === lang)?.dir ?? "rtl";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("lang", lang);
  }, [lang, dir]);

  const setLang = (l: Language) => setLangState(l);

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
