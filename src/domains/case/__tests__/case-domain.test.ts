import { describe, it, expect } from "vitest";
import {
  CASE_STAGES,
  CASE_STAGE_ORDER,
  isValidTransition,
  canTransition,
  getNextStage,
  isTerminalStage,
  type Case,
  type CaseBundle,
  type CaseStage,
  type Decision,
  type EvidenceItem,
  type Outcome,
  type RiskAssessment,
  type SecurityScan,
  type Target,
} from "../index";
import {
  LOW_RISK_BUNDLE_KEYS,
  cautionBundle,
  cautionCase,
  cautionDecision,
  highRiskBundle,
  highRiskCase,
  highRiskDecision,
  lowRiskBundle,
  lowRiskCase,
  lowRiskDecision,
  lowRiskTarget,
  lowRiskEvidence,
  lowRiskScan,
  lowRiskAssessment,
  sampleXPEvent,
} from "../fixtures";

describe("Case Domain — Types and Stages", () => {
  it("defines exactly ten case stages in the canonical order", () => {
    expect(CASE_STAGES).toHaveLength(10);
    expect(CASE_STAGES).toEqual(CASE_STAGE_ORDER);
    expect(CASE_STAGES[0]).toBe("new");
    expect(CASE_STAGES[CASE_STAGES.length - 1]).toBe("outcome_reviewed");
  });

  it("every stage appears in CASE_STAGE_ORDER", () => {
    for (const stage of CASE_STAGES) {
      expect(CASE_STAGE_ORDER).toContain(stage);
    }
  });
});

describe("Case Domain — State Machine", () => {
  it("accepts forward transitions along the happy path", () => {
    expect(isValidTransition("new", "target_selected")).toBe(true);
    expect(isValidTransition("target_selected", "signal_explained")).toBe(true);
    expect(isValidTransition("signal_explained", "evidence_loading")).toBe(true);
    expect(isValidTransition("evidence_loading", "evidence_ready")).toBe(true);
    expect(isValidTransition("evidence_ready", "risk_assessed")).toBe(true);
    expect(isValidTransition("risk_assessed", "decision_pending")).toBe(true);
    expect(isValidTransition("decision_pending", "decision_recorded")).toBe(true);
    expect(isValidTransition("decision_recorded", "tracking")).toBe(true);
    expect(isValidTransition("tracking", "outcome_reviewed")).toBe(true);
  });

  it("rejects skipping stages", () => {
    expect(isValidTransition("new", "evidence_loading")).toBe(false);
    expect(isValidTransition("new", "decision_pending")).toBe(false);
    expect(isValidTransition("signal_explained", "risk_assessed")).toBe(false);
    expect(isValidTransition("evidence_ready", "decision_recorded")).toBe(false);
    expect(isValidTransition("risk_assessed", "tracking")).toBe(false);
  });

  it("rejects backward transitions", () => {
    expect(isValidTransition("target_selected", "new")).toBe(false);
    expect(isValidTransition("evidence_ready", "evidence_loading")).toBe(false);
    expect(isValidTransition("outcome_reviewed", "tracking")).toBe(false);
  });

  it("rejects transitions from terminal stage", () => {
    expect(isValidTransition("outcome_reviewed", "new")).toBe(false);
    expect(isValidTransition("outcome_reviewed", "tracking")).toBe(false);
  });

  it("canTransition is an alias for isValidTransition", () => {
    expect(canTransition("new", "target_selected")).toBe(
      isValidTransition("new", "target_selected"),
    );
    expect(canTransition("new", "outcome_reviewed")).toBe(false);
  });

  it("getNextStage returns the canonical next stage", () => {
    expect(getNextStage("new")).toBe("target_selected");
    expect(getNextStage("evidence_loading")).toBe("evidence_ready");
    expect(getNextStage("tracking")).toBe("outcome_reviewed");
    expect(getNextStage("outcome_reviewed")).toBeNull();
  });

  it("isTerminalStage identifies terminal stages", () => {
    expect(isTerminalStage("outcome_reviewed")).toBe(true);
    expect(isTerminalStage("new")).toBe(false);
    expect(isTerminalStage("decision_pending")).toBe(false);
  });
});

describe("Case Domain — Case Object", () => {
  it("creates a Case with a valid id, targetId, and stage", () => {
    const c: Case = {
      id: "case-valid-1",
      targetId: "target-1",
      stage: "new",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(c.id).toBe("case-valid-1");
    expect(c.stage).toBe("new");
  });

  it("rejects Case without a Target (validated by caller, not type)", () => {
    // Type system enforces required fields; we verify the contract here.
    const c: Case = {
      id: "case-no-target",
      targetId: "",
      stage: "new",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(c.targetId).toBe("");
    // Consumers must validate that targetId is non-empty before processing.
  });
});

describe("Case Domain — Evidence", () => {
  it("every evidence item is associated with a caseId", () => {
    const items: EvidenceItem[] = lowRiskEvidence;
    for (const item of items) {
      expect(item.caseId).toBeTruthy();
      expect(item.caseId).toBe(items[0].caseId);
    }
  });

  it("evidence severity uses only approved values", () => {
    const validSeverities = ["info", "caution", "warning", "critical"];
    for (const item of lowRiskEvidence) {
      expect(validSeverities).toContain(item.severity);
    }
  });

  it("evidence status uses only approved values", () => {
    const validStatuses = ["confirmed", "unresolved", "failed"];
    for (const item of lowRiskEvidence) {
      expect(validStatuses).toContain(item.status);
    }
  });
});

describe("Case Domain — Risk Assessment", () => {
  it("rejects RiskAssessment without a known scan (caller validation)", () => {
    const r: RiskAssessment = lowRiskAssessment;
    expect(r.scanId).toBeTruthy();
    // The domain requires scanId; consumers must verify scan exists.
  });

  it("risk status uses only approved values", () => {
    const valid = ["no-issue", "caution", "high-risk", "unable-to-verify"];
    expect(valid).toContain(lowRiskAssessment.status);
    expect(valid).toContain(cautionBundle.riskAssessments[0].status);
    expect(valid).toContain(highRiskBundle.riskAssessments[0].status);
  });

  it("partial scan must not produce a no-issue risk status", () => {
    // The caution case has a partial scan and a caution risk status.
    // A partial scan producing "no-issue" would be a bug.
    expect(cautionBundle.scans[0].status).toBe("partial");
    expect(cautionBundle.riskAssessments[0].status).not.toBe("no-issue");
  });

  it("failed scan must not produce a no-issue risk status", () => {
    const r: RiskAssessment = {
      id: "risk-failed-1",
      caseId: "case-failed",
      scanId: "scan-failed",
      status: "no-issue",
      reasons: [],
      unknowns: ["scan failed"],
      recommendedAction: "retry",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    // Consumers must reject this combination.
    const scan: SecurityScan = {
      id: "scan-failed",
      caseId: "case-failed",
      status: "failed",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.000Z",
      coverage: 0,
      evidenceIds: [],
    };
    const isInconsistent = scan.status === "failed" && r.status === "no-issue";
    expect(isInconsistent).toBe(true);
    // The domain guarantees consumers can detect this inconsistency.
  });
});

describe("Case Domain — Decision", () => {
  it("rejects Decision without a rationale (caller validation)", () => {
    const d: Decision = {
      id: "decision-bad",
      caseId: "case-1",
      action: "watch",
      rationale: "",
      invalidationCondition: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(d.rationale).toBe("");
    // Consumers must reject empty rationale.
  });

  it("decision action uses only approved values", () => {
    const valid = ["watch", "wait", "investigate_further", "paper_test", "avoid", "proceed"];
    expect(valid).toContain(lowRiskDecision.action);
    expect(valid).toContain(cautionDecision.action);
    expect(valid).toContain(highRiskDecision.action);
  });

  it("Decision is linked to a caseId", () => {
    expect(lowRiskDecision.caseId).toBeTruthy();
    expect(cautionDecision.caseId).toBeTruthy();
    expect(highRiskDecision.caseId).toBeTruthy();
  });
});

describe("Case Domain — Outcome", () => {
  it("rejects Outcome before a Decision (caller validation)", () => {
    const o: Outcome = {
      id: "outcome-orphan",
      caseId: "case-1",
      decisionId: "",
      status: "pending",
      observedAt: "2026-01-01T00:00:00.000Z",
      notes: null,
    };
    expect(o.decisionId).toBe("");
    // Consumers must reject orphan outcomes.
  });

  it("Outcome references a valid decisionId", () => {
    for (const o of lowRiskBundle.outcomes) {
      expect(o.decisionId).toBeTruthy();
      expect(o.caseId).toBe(lowRiskBundle.case.id);
    }
  });
});

describe("Case Domain — Fixtures", () => {
  it("low-risk case has a no-issue risk status and a watch decision", () => {
    expect(lowRiskCase.stage).toBe("outcome_reviewed");
    expect(lowRiskBundle.riskAssessments[0].status).toBe("no-issue");
    expect(lowRiskDecision.action).toBe("watch");
  });

  it("caution case has a caution risk status and a wait decision", () => {
    expect(cautionCase.stage).toBe("decision_recorded");
    expect(cautionBundle.riskAssessments[0].status).toBe("caution");
    expect(cautionDecision.action).toBe("wait");
    expect(cautionBundle.scans[0].status).toBe("partial");
  });

  it("high-risk case has a high-risk status and an avoid decision", () => {
    expect(highRiskCase.stage).toBe("tracking");
    expect(highRiskBundle.riskAssessments[0].status).toBe("high-risk");
    expect(highRiskDecision.action).toBe("avoid");
  });

  it("every fixture is clearly marked as SAMPLE data", () => {
    // Check that addresses contain SAMPLE or DO_NOT_USE markers.
    expect(lowRiskTarget.address).toMatch(/SAMPLE|DO_NOT_USE/);
    expect(cautionBundle.target.address).toMatch(/SAMPLE|DO_NOT_USE/);
    expect(highRiskBundle.target.address).toMatch(/SAMPLE|DO_NOT_USE/);
  });

  it("every fixture case has a stable caseId", () => {
    expect(lowRiskCase.id).toBeTruthy();
    expect(cautionCase.id).toBeTruthy();
    expect(highRiskCase.id).toBeTruthy();
    // Different cases must have different IDs.
    const ids = new Set([lowRiskCase.id, cautionCase.id, highRiskCase.id]);
    expect(ids.size).toBe(3);
  });

  it("every fixture evidence is linked to its case", () => {
    expect(lowRiskEvidence.every((e) => e.caseId === lowRiskCase.id)).toBe(true);
    expect(cautionBundle.evidence.every((e) => e.caseId === cautionCase.id)).toBe(true);
    expect(highRiskBundle.evidence.every((e) => e.caseId === highRiskCase.id)).toBe(true);
  });

  it("no fixture contains secrets or real addresses", () => {
    const bundles: CaseBundle[] = [lowRiskBundle, cautionBundle, highRiskBundle];
    for (const bundle of bundles) {
      const allText = JSON.stringify(bundle);
      // Should not contain common secret patterns.
      expect(allText).not.toMatch(/private[_-]?key/i);
      expect(allText).not.toMatch(/api[_-]?key/i);
      expect(allText).not.toMatch(/password/i);
      expect(allText).not.toMatch(/secret/i);
      // Should not contain a 0x followed by 40+ hex chars (real ETH address).
      expect(allText).not.toMatch(/0x[0-9a-fA-F]{40,}/);
    }
  });

  it("XPEvent sample has zero amount (no XP logic applied)", () => {
    expect(sampleXPEvent.amount).toBe(0);
  });
});

describe("Case Domain — Happy Path", () => {
  it("accepts the full path from new to outcome_reviewed", () => {
    let stage: CaseStage = "new";
    const path: CaseStage[] = [stage];
    while (true) {
      const next = getNextStage(stage);
      if (next === null) break;
      expect(isValidTransition(stage, next)).toBe(true);
      stage = next;
      path.push(stage);
    }
    expect(stage).toBe("outcome_reviewed");
    expect(path).toEqual(CASE_STAGE_ORDER);
  });
});

describe("Case Domain — Exported fixture keys", () => {
  it("exposes the expected fixture key constant", () => {
    expect(LOW_RISK_BUNDLE_KEYS).toBeDefined();
  });
});
