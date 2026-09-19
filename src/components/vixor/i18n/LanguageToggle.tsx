// ============================================================================
// VIXOR — LanguageToggle
// ============================================================================
//
// Segmented EN | العربية control bound to the global I18nProvider.
// Switching persists to localStorage ("vixor-lang"), swaps <html dir>
// (ltr/rtl) and lazy-loads the Arabic dictionary — all handled by the
// provider; this component only renders the control.
//
// Uses useI18nSafe so isolated renders (tests, storybook-like mounts) don't
// crash: without a provider the control renders inert with English active.
//
// ============================================================================

import { Languages } from "lucide-react";

import { useI18nSafe } from "@/shared/i18n";
import { LANGUAGES } from "@/shared/i18n/translations";
import { cn } from "@/shared/utils/cn";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const i18n = useI18nSafe();
  const active = i18n?.lang ?? "en";

  return (
    <div className={cn("flex items-center gap-2.5", className)} role="group" aria-label="Language">
      <Languages size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      <div
        className="flex items-center rounded-xl p-0.5"
        style={{
          background: "var(--surface-elevated, rgba(255,255,255,0.04))",
          border: "1px solid var(--color-border)",
        }}
      >
        {LANGUAGES.map((l) => {
          const isActive = l.code === active;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => i18n?.setLang(l.code)}
              aria-pressed={isActive}
              disabled={!i18n}
              className={cn(
                "min-w-[64px] rounded-[10px] px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer disabled:cursor-default",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
              )}
              style={
                isActive
                  ? {
                      background: "var(--primary-bg)",
                      color: "var(--color-primary)",
                      border: "1px solid var(--primary-border)",
                    }
                  : { color: "var(--color-muted-foreground)", border: "1px solid transparent" }
              }
            >
              {l.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
