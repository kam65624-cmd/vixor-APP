import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { translations } from "./translations";

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export type Language = "en" | "ar";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  isRTL: boolean;
}

// ═══════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════

const I18nContext = createContext<I18nContextType | null>(null);

// ═══════════════════════════════════════════════
// STORAGE KEY
// ═══════════════════════════════════════════════

const STORAGE_KEY = "vixor-lang";

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function getInitialLang(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // localStorage not available
  }
  return "en";
}

function applyDirection(lang: Language) {
  if (typeof document === "undefined") return;
  const isRTL = lang === "ar";
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  if (isRTL) {
    document.documentElement.classList.add("rtl");
  } else {
    document.documentElement.classList.remove("rtl");
  }
}

/**
 * Resolve a dot-separated key against a flat translations object.
 * Supports both flat keys ("dashboard.greeting.morning") and
 * also direct lookups.
 */
function resolve(
  dict: Record<string, string>,
  key: string,
  params?: Record<string, string | number>
): string {
  let value = dict[key];

  // If not found, try replacing dots with nested lookups
  if (value === undefined) {
    value = key;
  }

  // Interpolate parameters: {name} → value
  if (params && value) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return value;
}

// ═══════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  // Apply direction on mount and on lang change
  useEffect(() => {
    applyDirection(lang);
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
    applyDirection(newLang);
    setLangState(newLang);
  }, []);

  const isRTL = lang === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[lang] ?? translations.en;
      return resolve(dict, key, params);
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir, isRTL }}>
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
