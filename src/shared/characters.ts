// ============================================================================
// VIXOR — Character System · Stable UI Bridge
// ============================================================================
//
// Single source of truth that binds the semantic character registry
// (packages/vixor-gamification) to presentation concerns: routes, icons,
// and the canonical --char-* design tokens defined in src/styles.css.
//
// Drift this bridge eliminates (v2 audit findings):
//   - Machine ids (mrVigo/drDex) vs route slugs (/mr-vigo…) vs token keys (vigo/dex)
//   - Hardcoded hex colors duplicating styles.css tokens (e.g. loop.tsx)
//   - Per-page character definitions that silently diverge
//
// Rule: any surface that needs character identity imports from here.
// Never redefine characters, colors, or routes at the page level.
//
// ============================================================================

import { Activity, BarChart3, Search, ShieldCheck, type LucideIcon } from "lucide-react";

import { getCharacter } from "../../packages/vixor-gamification/src/characters/registry";
import type {
  CharacterDefinition,
  CharacterId,
  CharacterRole,
} from "../../packages/vixor-gamification/src/characters/types";

export type { CharacterDefinition, CharacterId, CharacterRole };

/** Primary surface each character leads, in Decision Loop order. */
export type CharacterRoute = "/alpha" | "/investigate" | "/risk" | "/echo";

/** Token keys as declared in src/styles.css (--char-{token}-*). */
export type CharacterTokenKey = "moxi" | "vigo" | "dex" | "echo";

export interface CharacterPresentation {
  readonly id: CharacterId;
  readonly displayName: string;
  readonly role: CharacterRole;
  /** Short human label used as the role badge. */
  readonly roleLabel: string;
  readonly icon: LucideIcon;
  /** One-line hook shown under the name. */
  readonly tagline: string;
  /** Long-form explanation for guide surfaces. */
  readonly description: string;
  readonly route: CharacterRoute;
  /** CTA label for the character's primary surface. */
  readonly surfaceLabel: string;
  readonly token: CharacterTokenKey;
  /** Canonical color tokens — always via CSS vars, never hex literals. */
  readonly colorVar: string;
  readonly dimVar: string;
  readonly borderVar: string;
  readonly glowVar: string;
}

const ROLE_LABELS: Record<CharacterRole, string> = {
  main_guide: "Discovery",
  investigator: "Investigation",
  risk_analyst: "Risk Assessment",
  memory_learning: "Tracking & Learning",
};

const TOKENS: Record<CharacterId, CharacterTokenKey> = {
  moxi: "moxi",
  mrVigo: "vigo",
  drDex: "dex",
  echo: "echo",
};

const varOf = (token: CharacterTokenKey) => ({
  colorVar: `var(--char-${token})`,
  dimVar: `var(--char-${token}-dim)`,
  borderVar: `var(--char-${token}-border)`,
  glowVar: `var(--char-${token}-glow)`,
});

interface CharacterUiSpec {
  icon: LucideIcon;
  tagline: string;
  description: string;
  route: CharacterRoute;
  surfaceLabel: string;
}

const UI_SPECS: Record<CharacterId, CharacterUiSpec> = {
  moxi: {
    icon: Activity,
    tagline: "Finds the opportunity",
    description:
      "Scans the market and surfaces tokens that match your criteria — momentum, volume, whale activity, or custom filters.",
    route: "/alpha",
    surfaceLabel: "Open MOXI",
  },
  mrVigo: {
    icon: Search,
    tagline: "Gathers the evidence",
    description:
      "Aggregates security signals from Shield, whale movements from Hunt, and market context — then builds a structured evidence file.",
    route: "/investigate",
    surfaceLabel: "Open MR.VIGO",
  },
  drDex: {
    icon: ShieldCheck,
    tagline: "Quantifies the risk",
    description:
      "Runs the RiskGovernor engine against the evidence file. Outputs position sizing, maximum exposure, and a clear GO / WAIT / BLOCK verdict.",
    route: "/risk",
    surfaceLabel: "Open DR.DEX",
  },
  echo: {
    icon: BarChart3,
    tagline: "Records the outcome",
    description:
      "Tracks every decision, its rationale, and the actual result. Weekly summaries show what is working and what needs adjustment.",
    route: "/echo",
    surfaceLabel: "Open ECHO",
  },
};

function toPresentation(id: CharacterId): CharacterPresentation {
  const def: CharacterDefinition = getCharacter(id);
  const spec = UI_SPECS[id];
  return {
    id,
    displayName: def.displayName,
    role: def.role,
    roleLabel: ROLE_LABELS[def.role],
    icon: spec.icon,
    tagline: spec.tagline,
    description: spec.description,
    route: spec.route,
    surfaceLabel: spec.surfaceLabel,
    token: TOKENS[id],
    ...varOf(TOKENS[id]),
  };
}

/** All four active characters in Decision Loop order (MOXI → MR.VIGO → DR.DEX → ECHO). */
export const CHARACTERS: readonly CharacterPresentation[] = (
  ["moxi", "mrVigo", "drDex", "echo"] as const
).map(toPresentation);

/** Lookup by machine id. */
export const CHARACTER_MAP: Record<CharacterId, CharacterPresentation> = {
  moxi: CHARACTERS[0],
  mrVigo: CHARACTERS[1],
  drDex: CHARACTERS[2],
  echo: CHARACTERS[3],
};

/**
 * Presentation for one character. Throws for unknown ids (same contract as
 * the registry's getCharacter), keeping page code honest about bad ids.
 */
export function getCharacterPresentation(id: CharacterId): CharacterPresentation {
  return CHARACTER_MAP[id];
}

/** Two-letter monogram used by avatars (MO / MR / DR / EC). */
export function characterMonogram(id: CharacterId): string {
  return getCharacterPresentation(id).displayName.slice(0, 2);
}
