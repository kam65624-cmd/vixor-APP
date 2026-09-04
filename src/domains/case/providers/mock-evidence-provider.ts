// ============================================================================
// VIXOR V2 — Mock Evidence Provider
// ============================================================================
//
// Returns SAMPLE evidence items. Supports partial scenario where some
// evidence is available but with warnings.
// ============================================================================

import type { ProviderResult } from "./types";
import {
  emptyResult,
  successResult,
  partialResult,
  failedResult,
  type ProviderWarning,
} from "./types";
import type { EvidenceProvider } from "./evidence-provider";
import type { EvidenceItem } from "../types";
import {
  LOW_RISK_CASE_ID,
  CAUTION_CASE_ID,
  HIGH_RISK_CASE_ID,
  lowRiskEvidence,
  cautionEvidence,
  highRiskEvidence,
} from "../fixtures";

const MOCK_SOURCE = "mock-evidence";

const SAMPLE_EVIDENCE: Record<string, EvidenceItem[]> = {
  [LOW_RISK_CASE_ID]: lowRiskEvidence,
  [CAUTION_CASE_ID]: cautionEvidence,
  [HIGH_RISK_CASE_ID]: highRiskEvidence,
};

export class MockEvidenceProvider implements EvidenceProvider {
  scenario: "success" | "partial" | "empty" | "failed" = "success";

  async getEvidence(caseId: string): Promise<ProviderResult<EvidenceItem[]>> {
    if (this.scenario === "empty") {
      return emptyResult<EvidenceItem[]>(MOCK_SOURCE);
    }
    if (this.scenario === "failed") {
      return failedResult<EvidenceItem[]>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }

    const evidence = SAMPLE_EVIDENCE[caseId];
    if (!evidence) {
      return failedResult<EvidenceItem[]>(MOCK_SOURCE, {
        code: "NO_DATA",
        message: `No evidence found for case "${caseId}".`,
        retryable: false,
        provider: MOCK_SOURCE,
      });
    }

    // Ensure every item is linked to the requested caseId
    const items = evidence.map((e) => ({ ...e, caseId }));

    if (this.scenario === "partial") {
      // Simulate a partial response: return only the first half of evidence
      // with a warning.
      const half = Math.max(1, Math.floor(items.length / 2));
      const partial = items.slice(0, half);
      const warnings: ProviderWarning[] = [
        {
          code: "UPSTREAM_ERROR",
          message: `Only ${partial} of ${items.length} evidence items available.`,
          provider: MOCK_SOURCE,
        },
      ];
      return partialResult(partial, MOCK_SOURCE, warnings);
    }

    return successResult(items, MOCK_SOURCE);
  }
}
