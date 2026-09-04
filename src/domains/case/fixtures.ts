// ============================================================================
// VIXOR V2 — Case Fixtures (Sample Data)
// ============================================================================
//
// All fixtures are clearly marked as SAMPLE data.
// They do NOT contain real addresses, tokens, or secrets.
// They cover: low-risk, caution, and high-risk cases, plus a partial-evidence
// case to verify that incomplete data is not promoted to a safe status.
// ============================================================================

import type {
  Case,
  CaseBundle,
  Decision,
  EvidenceItem,
  Outcome,
  RiskAssessment,
  SecurityScan,
  Signal,
  Target,
  XPEvent,
} from "./types";

// ── Low-Risk Case ──────────────────────────────────────────────────────────
//
// Complete evidence. No major risk. User chooses to watch.
//
export const LOW_RISK_CASE_ID = "case-sample-low-risk";
export const LOW_RISK_TARGET_ID = "target-sample-low-risk";
export const LOW_RISK_SCAN_ID = "scan-sample-low-risk";
export const LOW_RISK_RISK_ID = "risk-sample-low-risk";
export const LOW_RISK_DECISION_ID = "decision-sample-low-risk";

export const lowRiskTarget: Target = {
  id: LOW_RISK_TARGET_ID,
  caseId: LOW_RISK_CASE_ID,
  kind: "token",
  address: "SAMPLE_LOW_RISK_ADDRESS_DO_NOT_USE",
  symbol: "LRD",
  name: "Low Risk Demo Token",
  network: "ethereum",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const lowRiskSignal: Signal = {
  id: "signal-sample-low-risk",
  caseId: LOW_RISK_CASE_ID,
  reason: "Volume increased 12% over 24h on a verified contract.",
  source: "volume_change",
  detectedAt: "2026-01-01T01:00:00.000Z",
  confidence: 72,
};

export const lowRiskEvidence: EvidenceItem[] = [
  {
    id: "evidence-sample-low-risk-1",
    caseId: LOW_RISK_CASE_ID,
    category: "contract",
    finding: "Contract is verified and source code is public.",
    severity: "info",
    status: "confirmed",
    source: "etherscan",
    observedAt: "2026-01-01T02:00:00.000Z",
  },
  {
    id: "evidence-sample-low-risk-2",
    caseId: LOW_RISK_CASE_ID,
    category: "liquidity",
    finding: "Liquidity locked for 90 days.",
    severity: "info",
    status: "confirmed",
    source: "lock-explorer",
    observedAt: "2026-01-01T02:01:00.000Z",
  },
];

export const lowRiskScan: SecurityScan = {
  id: LOW_RISK_SCAN_ID,
  caseId: LOW_RISK_CASE_ID,
  status: "complete",
  startedAt: "2026-01-01T01:30:00.000Z",
  completedAt: "2026-01-01T02:05:00.000Z",
  coverage: 100,
  evidenceIds: lowRiskEvidence.map((e) => e.id),
};

export const lowRiskAssessment: RiskAssessment = {
  id: LOW_RISK_RISK_ID,
  caseId: LOW_RISK_CASE_ID,
  scanId: LOW_RISK_SCAN_ID,
  status: "no-issue",
  reasons: ["Verified contract", "Locked liquidity", "No concentration flags"],
  unknowns: [],
  recommendedAction: "Add to watchlist and monitor.",
  createdAt: "2026-01-01T02:10:00.000Z",
};

export const lowRiskCase: Case = {
  id: LOW_RISK_CASE_ID,
  targetId: LOW_RISK_TARGET_ID,
  stage: "outcome_reviewed",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
};

export const lowRiskDecision: Decision = {
  id: LOW_RISK_DECISION_ID,
  caseId: LOW_RISK_CASE_ID,
  action: "watch",
  rationale: "Low risk with locked liquidity. Worth monitoring.",
  invalidationCondition: "Liquidity unlock within 14 days or owner changes.",
  createdAt: "2026-01-01T02:15:00.000Z",
};

export const lowRiskOutcome: Outcome = {
  id: "outcome-sample-low-risk",
  caseId: LOW_RISK_CASE_ID,
  decisionId: LOW_RISK_DECISION_ID,
  status: "aligned",
  observedAt: "2026-01-15T00:00:00.000Z",
  notes: "No risk materialised during the watch period.",
};

export const lowRiskBundle: CaseBundle = {
  case: lowRiskCase,
  target: lowRiskTarget,
  signals: [lowRiskSignal],
  evidence: lowRiskEvidence,
  scans: [lowRiskScan],
  riskAssessments: [lowRiskAssessment],
  decisions: [lowRiskDecision],
  outcomes: [lowRiskOutcome],
};

// ── Caution Case ───────────────────────────────────────────────────────────
//
// Partial evidence. Some unresolved findings. User decides to wait.
//
export const CAUTION_CASE_ID = "case-sample-caution";
export const CAUTION_TARGET_ID = "target-sample-caution";
export const CAUTION_SCAN_ID = "scan-sample-caution";
export const CAUTION_RISK_ID = "risk-sample-caution";
export const CAUTION_DECISION_ID = "decision-sample-caution";

export const cautionTarget: Target = {
  id: CAUTION_TARGET_ID,
  caseId: CAUTION_CASE_ID,
  kind: "token",
  address: "SAMPLE_CAUTION_ADDRESS_DO_NOT_USE",
  symbol: "CTD",
  name: "Caution Demo Token",
  network: "ethereum",
  createdAt: "2026-02-01T00:00:00.000Z",
};

export const cautionSignal: Signal = {
  id: "signal-sample-caution",
  caseId: CAUTION_CASE_ID,
  reason: "Unusual wallet activity detected in the last 6 hours.",
  source: "wallet_activity",
  detectedAt: "2026-02-01T01:00:00.000Z",
  confidence: 58,
};

export const cautionEvidence: EvidenceItem[] = [
  {
    id: "evidence-sample-caution-1",
    caseId: CAUTION_CASE_ID,
    category: "holders",
    finding: "Top 10 holders control 38% of supply.",
    severity: "caution",
    status: "confirmed",
    source: "holder-explorer",
    observedAt: "2026-02-01T02:00:00.000Z",
  },
  {
    id: "evidence-sample-caution-2",
    caseId: CAUTION_CASE_ID,
    category: "liquidity",
    finding: "Liquidity pool size is moderate but unlock date is unknown.",
    severity: "warning",
    status: "unresolved",
    source: "lock-explorer",
    observedAt: "2026-02-01T02:01:00.000Z",
  },
];

export const cautionScan: SecurityScan = {
  id: CAUTION_SCAN_ID,
  caseId: CAUTION_CASE_ID,
  status: "partial",
  startedAt: "2026-02-01T01:30:00.000Z",
  completedAt: "2026-02-01T02:05:00.000Z",
  coverage: 70,
  evidenceIds: cautionEvidence.map((e) => e.id),
};

export const cautionAssessment: RiskAssessment = {
  id: CAUTION_RISK_ID,
  caseId: CAUTION_CASE_ID,
  scanId: CAUTION_SCAN_ID,
  status: "caution",
  reasons: ["Concentrated holders", "Unknown liquidity unlock"],
  unknowns: ["Liquidity unlock date"],
  recommendedAction: "Wait for more evidence before any action.",
  createdAt: "2026-02-01T02:10:00.000Z",
};

export const cautionCase: Case = {
  id: CAUTION_CASE_ID,
  targetId: CAUTION_TARGET_ID,
  stage: "decision_recorded",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T02:15:00.000Z",
};

export const cautionDecision: Decision = {
  id: CAUTION_DECISION_ID,
  caseId: CAUTION_CASE_ID,
  action: "wait",
  rationale: "Partial evidence with unresolved liquidity unlock.",
  invalidationCondition: "If liquidity unlock date is confirmed within 30 days.",
  createdAt: "2026-02-01T02:15:00.000Z",
};

export const cautionBundle: CaseBundle = {
  case: cautionCase,
  target: cautionTarget,
  signals: [cautionSignal],
  evidence: cautionEvidence,
  scans: [cautionScan],
  riskAssessments: [cautionAssessment],
  decisions: [cautionDecision],
  outcomes: [],
};

// ── High-Risk Case ──────────────────────────────────────────────────────────
//
// Confirmed critical findings. User chooses to avoid.
//
export const HIGH_RISK_CASE_ID = "case-sample-high-risk";
export const HIGH_RISK_TARGET_ID = "target-sample-high-risk";
export const HIGH_RISK_SCAN_ID = "scan-sample-high-risk";
export const HIGH_RISK_RISK_ID = "risk-sample-high-risk";
export const HIGH_RISK_DECISION_ID = "decision-sample-high-risk";

export const highRiskTarget: Target = {
  id: HIGH_RISK_TARGET_ID,
  caseId: HIGH_RISK_CASE_ID,
  kind: "token",
  address: "SAMPLE_HIGH_RISK_ADDRESS_DO_NOT_USE",
  symbol: "HRD",
  name: "High Risk Demo Token",
  network: "ethereum",
  createdAt: "2026-03-01T00:00:00.000Z",
};

export const highRiskSignal: Signal = {
  id: "signal-sample-high-risk",
  caseId: HIGH_RISK_CASE_ID,
  reason: "Sudden liquidity removal detected.",
  source: "liquidity_behavior",
  detectedAt: "2026-03-01T01:00:00.000Z",
  confidence: 91,
};

export const highRiskEvidence: EvidenceItem[] = [
  {
    id: "evidence-sample-high-risk-1",
    caseId: HIGH_RISK_CASE_ID,
    category: "permissions",
    finding: "Owner can mint unlimited tokens.",
    severity: "critical",
    status: "confirmed",
    source: "contract-analysis",
    observedAt: "2026-03-01T02:00:00.000Z",
  },
  {
    id: "evidence-sample-high-risk-2",
    caseId: HIGH_RISK_CASE_ID,
    category: "liquidity",
    finding: "60% of liquidity removed in the last hour.",
    severity: "critical",
    status: "confirmed",
    source: "dex-explorer",
    observedAt: "2026-03-01T02:01:00.000Z",
  },
  {
    id: "evidence-sample-high-risk-3",
    caseId: HIGH_RISK_CASE_ID,
    category: "holders",
    finding: "Deployer wallet holds 45% of supply.",
    severity: "critical",
    status: "confirmed",
    source: "holder-explorer",
    observedAt: "2026-03-01T02:02:00.000Z",
  },
];

export const highRiskScan: SecurityScan = {
  id: HIGH_RISK_SCAN_ID,
  caseId: HIGH_RISK_CASE_ID,
  status: "complete",
  startedAt: "2026-03-01T01:30:00.000Z",
  completedAt: "2026-03-01T02:05:00.000Z",
  coverage: 100,
  evidenceIds: highRiskEvidence.map((e) => e.id),
};

export const highRiskAssessment: RiskAssessment = {
  id: HIGH_RISK_RISK_ID,
  caseId: HIGH_RISK_CASE_ID,
  scanId: HIGH_RISK_SCAN_ID,
  status: "high-risk",
  reasons: [
    "Mint authority not renounced",
    "Major liquidity removal",
    "Concentrated deployer holdings",
  ],
  unknowns: [],
  recommendedAction: "Do not proceed. Avoid exposure.",
  createdAt: "2026-03-01T02:10:00.000Z",
};

export const highRiskCase: Case = {
  id: HIGH_RISK_CASE_ID,
  targetId: HIGH_RISK_TARGET_ID,
  stage: "tracking",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T02:15:00.000Z",
};

export const highRiskDecision: Decision = {
  id: HIGH_RISK_DECISION_ID,
  caseId: HIGH_RISK_CASE_ID,
  action: "avoid",
  rationale: "Critical risk signals across permissions, liquidity, and holders.",
  invalidationCondition: null,
  createdAt: "2026-03-01T02:15:00.000Z",
};

export const highRiskBundle: CaseBundle = {
  case: highRiskCase,
  target: highRiskTarget,
  signals: [highRiskSignal],
  evidence: highRiskEvidence,
  scans: [highRiskScan],
  riskAssessments: [highRiskAssessment],
  decisions: [highRiskDecision],
  outcomes: [],
};

// ── Sample XPEvent (type only, no logic) ──────────────────────────────────

export const sampleXPEvent: XPEvent = {
  id: "xp-event-sample-1",
  caseId: LOW_RISK_CASE_ID,
  eventType: "evidence_review_complete",
  characterId: "mrVigo",
  amount: 0,
  reason: "SAMPLE — no XP logic applied",
  createdAt: "2026-01-01T02:05:00.000Z",
};

// ── Exported fixture key constant (for downstream consumers) ──────────────

export const LOW_RISK_BUNDLE_KEYS = {
  caseId: LOW_RISK_CASE_ID,
  targetId: LOW_RISK_TARGET_ID,
  scanId: LOW_RISK_SCAN_ID,
  riskId: LOW_RISK_RISK_ID,
  decisionId: LOW_RISK_DECISION_ID,
} as const;
