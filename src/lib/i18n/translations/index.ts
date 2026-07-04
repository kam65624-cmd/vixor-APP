import en, { type Translations } from "./en";
import ar from "./ar";

export const translations: Record<string, Translations> = { en, ar };

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
