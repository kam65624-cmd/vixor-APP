import en, { type Translations } from "./en";

// P1: Lazy-load Arabic translations — saves ~23KB from root chunk
// Only loaded when user switches to Arabic, not on first page load.
type TranslationLoader = () => Promise<{ default: Translations }>;
const langLoaders: Record<string, TranslationLoader> = {
  ar: () => import("./ar"),
};

// Synchronous translations map — en is always available
export const translations: Record<string, Translations> = { en };

/**
 * Ensure a language's translations are loaded into the map.
 * Call this before translate() if using a lazy-loaded language.
 */
export async function ensureTranslations(lang: string): Promise<void> {
  if (translations[lang]) return; // already loaded
  const loader = langLoaders[lang];
  if (!loader) return; // no loader for this language (already static)
  const mod = await loader();
  translations[lang] = mod.default;
}

export type Language = "en" | "ar";

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
];

export function getLanguageConfig(lang: Language) {
  return LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];
}

/**
 * Resolve a dot-separated key like "dashboard.greeting.morning"
 * from a nested translations object.
 */
function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Replace {key} placeholders in a string with values from params.
 * Example: "Member for {days} days" + { days: "5" } → "Member for 5 days"
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

/**
 * Main translate function.
 */
export function translate(lang: Language, key: string, params?: Record<string, string | number>): string {
  const dict = translations[lang] ?? translations.en;
  const value = resolve(dict as unknown as Record<string, unknown>, key);
  if (value !== undefined) return interpolate(value, params);

  // Fallback to English if key not found in current language
  if (lang !== "en") {
    const fallback = resolve(en as unknown as Record<string, unknown>, key);
    if (fallback !== undefined) return interpolate(fallback, params);
  }

  // Return the key itself as last resort
  return key;
}
