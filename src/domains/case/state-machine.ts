// ============================================================================
// VIXOR V2 — Case State Machine
// ============================================================================
//
// Defines valid stage transitions and validation rules.
// A failed or partial scan must NEVER be promoted to a "safe" risk status.
// An Outcome cannot be recorded before a Decision.
// ============================================================================

import type { CaseStage } from "./types";

export const CASE_STAGE_ORDER: CaseStage[] = [
  "new",
  "target_selected",
  "signal_explained",
  "evidence_loading",
  "evidence_ready",
  "risk_assessed",
  "decision_pending",
  "decision_recorded",
  "tracking",
  "outcome_reviewed",
];

// ── Forward transitions ────────────────────────────────────────────────────
//
// These are the canonical happy-path transitions. Backward and skip
// transitions are rejected unless explicitly allowed below.
//
export const VALID_TRANSITIONS: Record<CaseStage, CaseStage[]> = {
  new: ["target_selected"],
  target_selected: ["signal_explained"],
  signal_explained: ["evidence_loading"],
  evidence_loading: ["evidence_ready"],
  evidence_ready: ["risk_assessed"],
  risk_assessed: ["decision_pending"],
  decision_pending: ["decision_recorded"],
  decision_recorded: ["tracking"],
  tracking: ["outcome_reviewed"],
  outcome_reviewed: [],
};

export function isValidTransition(from: CaseStage, to: CaseStage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransition(from: CaseStage, to: CaseStage): boolean {
  return isValidTransition(from, to);
}

export function getNextStage(current: CaseStage): CaseStage | null {
  const allowed = VALID_TRANSITIONS[current] ?? [];
  return allowed.length > 0 ? allowed[0] : null;
}

export function isTerminalStage(stage: CaseStage): boolean {
  return VALID_TRANSITIONS[stage]?.length === 0;
}
