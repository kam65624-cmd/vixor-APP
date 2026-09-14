// ============================================================================
// VIXOR — Character i18n Bridge
// ============================================================================
//
// Localizes the user-facing strings of the character system without breaking
// the P0 contract: outside an I18nProvider (unit tests, isolated renders) or
// in English, every string resolves to the canonical copy owned by
// src/shared/characters.ts. With a provider mounted, strings resolve through
// the translations layer — the `characters` namespace in en.ts mirrors the
// bridge copy and a parity test (characters-i18n.test.tsx) guards the sync.
//
// Character display names (MOXI / MR.VIGO / DR.DEX / ECHO) are brand marks
// and intentionally stay Latin in both languages.
//
// ============================================================================

import { useI18nSafe } from "@/shared/i18n";
import { getCharacterPresentation, type CharacterId } from "@/shared/characters";
import type { CharacterGuideState } from "@/components/characters/CharacterGuide";

/** Localized user-facing strings for one character. */
export interface LocalizedCharacterStrings {
  /** Brand mark — always Latin (MOXI / MR.VIGO / DR.DEX / ECHO). */
  readonly name: string;
  readonly role: string;
  readonly tagline: string;
  readonly description: string;
  readonly surfaceLabel: string;
}

/** Localized strings for the CharacterGuide state machine + actions. */
export interface LocalizedGuideStrings {
  readonly loading: string;
  readonly ready: string;
  readonly working: string;
  readonly success: string;
  readonly error: string;
  readonly retry: string;
  /** Accessible card label, e.g. "MOXI guide" / "دليل MOXI". */
  readonly ariaLabel: (name: string) => string;
}

const GUIDE_FALLBACK: LocalizedGuideStrings = {
  loading: "Gathering signals…",
  ready: "Guidance is ready.",
  working: "Working on it…",
  success: "Recorded.",
  error: "Something went wrong.",
  retry: "Retry",
  ariaLabel: (name) => `${name} guide`,
};

/**
 * Localized strings for a character. Falls back to the canonical bridge copy
 * whenever no I18nProvider is mounted (keeps P0 tests and isolated renders
 * deterministic) or the language is English.
 */
export function useCharacterStrings(id: CharacterId): LocalizedCharacterStrings {
  const char = getCharacterPresentation(id);
  const i18n = useI18nSafe();

  if (!i18n) {
    return {
      name: char.displayName,
      role: char.roleLabel,
      tagline: char.tagline,
      description: char.description,
      surfaceLabel: char.surfaceLabel,
    };
  }

  const { t } = i18n;
  return {
    name: char.displayName,
    role: t(`characters.roles.${char.role}`),
    tagline: t(`characters.${id}.tagline`),
    description: t(`characters.${id}.description`),
    surfaceLabel: t(`characters.${id}.surfaceLabel`),
  };
}

/**
 * Localized CharacterGuide state messages. Same fallback contract as
 * useCharacterStrings — canonical English when no provider is mounted.
 */
export function useGuideStrings(): LocalizedGuideStrings {
  const i18n = useI18nSafe();
  if (!i18n) return GUIDE_FALLBACK;

  const { t } = i18n;
  return {
    loading: t("characters.guide.loading"),
    ready: t("characters.guide.ready"),
    working: t("characters.guide.working"),
    success: t("characters.guide.success"),
    error: t("characters.guide.error"),
    retry: t("common.retry"),
    ariaLabel: (name) => t("characters.guide.ariaLabel", { name }),
  };
}

/** Re-export for consumers that type on the state union. */
export type { CharacterGuideState };
