// ============================================================================
// VIXOR V2 — Mock Outcome Provider
// ============================================================================
//
// Simulates outcome tracking. Does NOT change past decisions.
// ============================================================================

import type { ProviderResult } from "./types";
import { successResult, failedResult, emptyResult } from "./types";
import type { OutcomeProvider } from "./outcome-provider";
import type { Outcome } from "../types";
import { lowRiskOutcome } from "../fixtures";

const MOCK_SOURCE = "mock-outcome";

export class MockOutcomeProvider implements OutcomeProvider {
  scenario: "success" | "empty" | "failed" = "success";

  async startTracking(caseId: string): Promise<ProviderResult<Outcome>> {
    if (this.scenario === "failed") {
      return failedResult<Outcome>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }
    if (this.scenario === "empty") {
      return emptyResult<Outcome>(MOCK_SOURCE);
    }
    const outcome: Outcome = {
      id: `outcome-${caseId}`,
      caseId,
      decisionId: `decision-${caseId}`,
      status: "pending",
      observedAt: new Date().toISOString(),
      notes: null,
    };
    return successResult(outcome, MOCK_SOURCE);
  }

  async getOutcome(caseId: string): Promise<ProviderResult<Outcome>> {
    if (this.scenario === "failed") {
      return failedResult<Outcome>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }
    if (this.scenario === "empty") {
      return emptyResult<Outcome>(MOCK_SOURCE);
    }
    // For the low-risk case, return the sample aligned outcome.
    if (caseId === lowRiskOutcome.caseId) {
      return successResult(lowRiskOutcome, MOCK_SOURCE);
    }
    return successResult(
      {
        id: `outcome-${caseId}`,
        caseId,
        decisionId: `decision-${caseId}`,
        status: "pending",
        observedAt: new Date().toISOString(),
        notes: null,
      },
      MOCK_SOURCE,
    );
  }
}
