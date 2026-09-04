// ============================================================================
// VIXOR V2 — Case Domain Types
// ============================================================================
//
// The Case is the root object that links the entire V2 decision loop:
//   DISCOVER → UNDERSTAND → VERIFY → DECIDE → EXECUTE → TRACK → LEARN
//
// Every entity in this file is associated with a Case via `caseId`.
// This domain is V2-only and is intentionally separate from legacy
// analysis, signal, or trade entities. It does not contain XP logic.
// ============================================================================

// ── Case Stage (state machine) ──────────────────────────────────────────────

export const CASE_STAGES = [
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
] as const;

export type CaseStage = (typeof CASE_STAGES)[number];

// ── Target ──────────────────────────────────────────────────────────────────

export type TargetKind = "token" | "wallet";

export interface Target {
  id: string;
  caseId: string;
  kind: TargetKind;
  address: string;
  symbol: string | null;
  name: string | null;
  network: string | null;
  createdAt: string;
}

// ── Signal ──────────────────────────────────────────────────────────────────

export type SignalSource =
  | "volume_change"
  | "liquidity_behavior"
  | "wallet_activity"
  | "detected_event"
  | "user_paste"
  | "feed_entry";

export interface Signal {
  id: string;
  caseId: string;
  reason: string;
  source: SignalSource;
  detectedAt: string;
  confidence: number;
}

// ── Evidence ────────────────────────────────────────────────────────────────

export type EvidenceCategory =
  "contract" | "ownership" | "permissions" | "liquidity" | "holders" | "deployer" | "transactions";

export type EvidenceSeverity = "info" | "caution" | "warning" | "critical";

export type EvidenceStatus = "confirmed" | "unresolved" | "failed";

export interface EvidenceItem {
  id: string;
  caseId: string;
  category: EvidenceCategory;
  finding: string;
  severity: EvidenceSeverity;
  status: EvidenceStatus;
  source: string;
  observedAt: string;
}

// ── Security Scan ───────────────────────────────────────────────────────────

export type ScanStatus = "pending" | "partial" | "complete" | "failed";

export interface SecurityScan {
  id: string;
  caseId: string;
  status: ScanStatus;
  startedAt: string;
  completedAt: string | null;
  coverage: number;
  evidenceIds: string[];
}

// ── Risk Assessment ─────────────────────────────────────────────────────────

export type RiskStatus = "no-issue" | "caution" | "high-risk" | "unable-to-verify";

export interface RiskAssessment {
  id: string;
  caseId: string;
  scanId: string;
  status: RiskStatus;
  reasons: string[];
  unknowns: string[];
  recommendedAction: string;
  createdAt: string;
}

// ── Decision ───────────────────────────────────────────────────────────────

export type DecisionAction =
  "watch" | "wait" | "investigate_further" | "paper_test" | "avoid" | "proceed";

export interface Decision {
  id: string;
  caseId: string;
  action: DecisionAction;
  rationale: string;
  invalidationCondition: string | null;
  createdAt: string;
}

// ── Outcome ────────────────────────────────────────────────────────────────

export type OutcomeStatus = "pending" | "aligned" | "partial" | "invalidated" | "missed";

export interface Outcome {
  id: string;
  caseId: string;
  decisionId: string;
  status: OutcomeStatus;
  observedAt: string;
  notes: string | null;
}

// ── XPEvent (type only, no XP logic) ───────────────────────────────────────

export type XPEventType =
  | "first_guided_scan"
  | "target_explained"
  | "evidence_review_complete"
  | "threat_identified"
  | "decision_recorded"
  | "high_risk_avoided"
  | "outcome_reviewed"
  | "pattern_corrected";

export interface XPEvent {
  id: string;
  caseId: string;
  eventType: XPEventType;
  characterId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

// ── Case (root object) ─────────────────────────────────────────────────────

export interface Case {
  id: string;
  targetId: string;
  stage: CaseStage;
  createdAt: string;
  updatedAt: string;
}

// ── Case Bundle (aggregated view, not persisted) ───────────────────────────

export interface CaseBundle {
  case: Case;
  target: Target;
  signals: Signal[];
  evidence: EvidenceItem[];
  scans: SecurityScan[];
  riskAssessments: RiskAssessment[];
  decisions: Decision[];
  outcomes: Outcome[];
}
