// ============================================================================
// VIXOR V2 — Mock Discovery Provider
// ============================================================================
//
// Returns SAMPLE data only. No network calls, no API keys, no secrets.
// Scenarios: success, empty, unsupported, failed.
// ============================================================================

import type { ProviderResult } from "./types";
import { emptyResult, successResult, unsupportedResult, failedResult } from "./types";
import type { ListTargetsInput, DiscoveryProvider } from "./discovery-provider";
import type { Signal, Target } from "../types";
import {
  CAUTION_CASE_ID,
  CAUTION_TARGET_ID,
  HIGH_RISK_CASE_ID,
  HIGH_RISK_TARGET_ID,
  LOW_RISK_CASE_ID,
  LOW_RISK_TARGET_ID,
  cautionSignal,
  cautionTarget,
  highRiskSignal,
  highRiskTarget,
  lowRiskSignal,
  lowRiskTarget,
} from "../fixtures";

const MOCK_SOURCE = "mock-discovery";

export const SAMPLE_TARGETS: Target[] = [lowRiskTarget, cautionTarget, highRiskTarget];

const SAMPLE_SIGNALS: Record<string, Signal> = {
  [LOW_RISK_TARGET_ID]: lowRiskSignal,
  [CAUTION_TARGET_ID]: cautionSignal,
  [HIGH_RISK_TARGET_ID]: highRiskSignal,
};

export class MockDiscoveryProvider implements DiscoveryProvider {
  /** Scenario flag: set to override default success behavior */
  scenario: "success" | "empty" | "unsupported" | "failed" = "success";

  async listTargets(input?: ListTargetsInput): Promise<ProviderResult<Target[]>> {
    if (this.scenario === "empty") {
      return emptyResult<Target[]>(MOCK_SOURCE);
    }
    if (this.scenario === "unsupported") {
      return unsupportedResult<Target[]>(
        MOCK_SOURCE,
        `Network "${input?.network ?? "unknown"}" is not supported by the mock provider.`,
      );
    }
    if (this.scenario === "failed") {
      return failedResult<Target[]>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }

    let results = SAMPLE_TARGETS;
    if (input?.network) {
      results = results.filter((t) => t.network === input.network);
    }
    if (input?.query) {
      const q = input.query.toLowerCase();
      results = results.filter(
        (t) =>
          t.symbol?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q),
      );
    }
    if (input?.limit !== undefined) {
      results = results.slice(0, input.limit);
    }
    return successResult(results, MOCK_SOURCE);
  }

  async getSignal(targetId: string): Promise<ProviderResult<Signal>> {
    const signal = SAMPLE_SIGNALS[targetId];
    if (!signal) {
      return failedResult<Signal>(MOCK_SOURCE, {
        code: "NO_DATA",
        message: `No signal found for target "${targetId}".`,
        retryable: false,
        provider: MOCK_SOURCE,
      });
    }
    return successResult(signal, MOCK_SOURCE);
  }
}

// Re-export case IDs for test convenience
export { LOW_RISK_CASE_ID, CAUTION_CASE_ID, HIGH_RISK_CASE_ID };
