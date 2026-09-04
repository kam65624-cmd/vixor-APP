export type CharacterId = "moxi" | "mrVigo" | "drDex" | "echo";

export type CharacterRole = "main_guide" | "investigator" | "risk_analyst" | "memory_learning";

export type CharacterSurface =
  | "onboarding"
  | "discovery"
  | "guidance"
  | "investigation"
  | "evidence"
  | "risk_assessment"
  | "decision_review"
  | "history"
  | "outcome_review"
  | "learning";

export interface CharacterDefinition {
  id: CharacterId;
  displayName: string;
  shortDescription: string;
  role: CharacterRole;
  allowedSurfaces: CharacterSurface[];
  tone: string[];
  active: boolean;
}
