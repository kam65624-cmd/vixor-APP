"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type Language,
  translate,
  getLanguageConfig,
  LANGUAGES,
} from "./translations";

// ═══════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════

interface I18nContextType {
  /** Current language code */
  lang: Language;
  /** Set language and persist to localStorage */
  setLang: (lang: Language) => void;
  /** Translate a key with optional params: t("dashboard.greeting.morning") */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Text direction: "ltr" or "rtl" */
  dir: "ltr" | "rtl";
  /** Whether the current language is RTL */
  isRTL: boolean;
  /** Available languages list */
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nContextType | null>(null);

// ═══════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════

const STORAGE_KEY = "vixor-lang";

function getSavedLang(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {}
  return "en";
}

function applyDirection(lang: Language) {
  if (typeof document === "undefined") return;
  const config = getLanguageConfig(lang);
  document.documentElement.dir = config.dir;
  document.documentElement.lang = lang;
  if (config.dir === "rtl") {
    document.documentElement.classList.add("rtl");
  } else {
    document.documentElement.classList.remove("rtl");
  }
}

// ═══════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getSavedLang);

  // Apply direction on mount and when language changes
  useEffect(() => {
    applyDirection(lang);
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    applyDirection(newLang);
  }, []);

  const config = getLanguageConfig(lang);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang],
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        dir: config.dir,
        isRTL: config.dir === "rtl",
        languages: LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// ═══════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

// Re-export types and utilities for convenience
export type { Language } from "./translations";
export { LANGUAGES, getLanguageConfig } from "./translations";
