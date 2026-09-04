import type { CharacterDefinition, CharacterId } from "./types";

export const CHARACTER_REGISTRY: Record<CharacterId, CharacterDefinition> = {
  moxi: {
    id: "moxi",
    displayName: "MOXI",
    shortDescription:
      "Main character and face of the product. Welcomes the user, introduces the workflow, surfaces opportunities, and keeps the journey understandable.",
    role: "main_guide",
    allowedSurfaces: ["onboarding", "discovery", "guidance"],
    tone: ["curious", "encouraging", "concise", "never overconfident"],
    active: true,
  },
  mrVigo: {
    id: "mrVigo",
    displayName: "MR.VIGO",
    shortDescription:
      "Investigator. Collects and presents evidence about a token, wallet, contract, liquidity, and behavior.",
    role: "investigator",
    allowedSurfaces: ["investigation", "evidence"],
    tone: ["observant", "methodical", "evidence-first", "skeptical"],
    active: true,
  },
  drDex: {
    id: "drDex",
    displayName: "DR.DEX",
    shortDescription:
      "Analyst and risk specialist. Interprets evidence, identifies threats, explains severity, and gives the user a clear risk picture.",
    role: "risk_analyst",
    allowedSurfaces: ["risk_assessment", "decision_review"],
    tone: ["clinical", "precise", "protective", "action-oriented"],
    active: true,
  },
  echo: {
    id: "echo",
    displayName: "ECHO",
    shortDescription:
      "Unified memory and learning layer. Connects case history, records decisions and outcomes, and turns results into personal learning.",
    role: "memory_learning",
    allowedSurfaces: ["history", "outcome_review", "learning"],
    tone: ["quiet", "reflective", "contextual", "non-intrusive"],
    active: true,
  },
};

export const ACTIVE_CHARACTER_IDS: CharacterId[] = ["moxi", "mrVigo", "drDex", "echo"];

export function getCharacter(id: CharacterId): CharacterDefinition {
  const def = CHARACTER_REGISTRY[id];
  if (!def) {
    throw new Error(`Unknown character id: ${id}`);
  }
  return def;
}

export function isActiveCharacter(id: string): id is CharacterId {
  return id in CHARACTER_REGISTRY && CHARACTER_REGISTRY[id as CharacterId]?.active === true;
}

export function isAllowedSurface(id: CharacterId, surface: string): boolean {
  const def = CHARACTER_REGISTRY[id];
  if (!def) return false;
  return def.allowedSurfaces.includes(surface as never);
}

export function getAllActiveCharacters(): CharacterDefinition[] {
  return ACTIVE_CHARACTER_IDS.map((id) => CHARACTER_REGISTRY[id]);
}
