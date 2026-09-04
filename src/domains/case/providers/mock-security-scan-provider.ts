// ============================================================================
// VIXOR V2 — Mock Security Scan Provider
// ============================================================================
//
// Simulates security scans. A failed or partial scan NEVER returns a
// "no-issue" status. The returned scan object reflects the actual scan
// status so consumers can detect incomplete data.
// ============================================================================

import type { ProviderResult } from "./types";
import { emptyResult, successResult, failedResult, type ProviderWarning } from "./types";
import type { SecurityScanProvider, SecurityScanInput } from "./security-scan-provider";
import type { SecurityScan } from "../types";
import {
  LOW_RISK_SCAN_ID,
  CAUTION_SCAN_ID,
  HIGH_RISK_SCAN_ID,
  lowRiskScan,
  cautionScan,
  highRiskScan,
} from "../fixtures";

const MOCK_SOURCE = "mock-security-scan";

const SAMPLE_SCANS: Record<string, SecurityScan> = {
  [LOW_RISK_SCAN_ID]: lowRiskScan,
  [CAUTION_SCAN_ID]: cautionScan,
  [HIGH_RISK_SCAN_ID]: highRiskScan,
};

export class MockSecurityScanProvider implements SecurityScanProvider {
  scenario: "success" | "partial" | "failed" | "rate-limited" = "success";

  async runScan(input: SecurityScanInput): Promise<ProviderResult<SecurityScan>> {
    if (this.scenario === "failed") {
      const failedScan: SecurityScan = {
        id: `scan-failed-${input.caseId}`,
        caseId: input.caseId,
        status: "failed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        coverage: 0,
        evidenceIds: [],
      };
      return successResult(failedScan, MOCK_SOURCE);
    }

    if (this.scenario === "rate-limited") {
      return failedResult<SecurityScan>(MOCK_SOURCE, {
        code: "RATE_LIMITED",
        message: "Mock provider simulated a rate limit.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }

    if (this.scenario === "partial") {
      const partialScan: SecurityScan = {
        id: `scan-partial-${input.caseId}`,
        caseId: input.caseId,
        status: "partial",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        coverage: 50,
        evidenceIds: [],
      };
      return successResult(partialScan, MOCK_SOURCE);
    }

    // success: return the low-risk scan as a default complete scan
    return successResult(
      {
        ...lowRiskScan,
        caseId: input.caseId,
      },
      MOCK_SOURCE,
    );
  }

  async getScanStatus(scanId: string): Promise<ProviderResult<SecurityScan>> {
    if (this.scenario === "failed") {
      return failedResult<SecurityScan>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }
    const scan = SAMPLE_SCANS[scanId];
    if (!scan) {
      return failedResult<SecurityScan>(MOCK_SOURCE, {
        code: "NO_DATA",
        message: `No scan found with id "${scanId}".`,
        retryable: false,
        provider: MOCK_SOURCE,
      });
    }
    return successResult(scan, MOCK_SOURCE);
  }
}

// Helper: detect that a scan is not safe
export function isScanSafe(scan: SecurityScan): boolean {
  // A scan is only "safe" (complete) if status is "complete" and coverage is high.
  return scan.status === "complete" && scan.coverage >= 80;
}

// Helper: provide warnings for non-complete scans
export function scanWarnings(scan: SecurityScan): ProviderWarning[] {
  if (scan.status === "complete") return [];
  return [
    {
      code: "UPSTREAM_ERROR",
      message: `Scan status is "${scan.status}" with ${scan.coverage}% coverage. Not safe to conclude.`,
      provider: "mock-security-scan",
    },
  ];
}
