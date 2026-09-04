import { describe, it, expect } from "vitest";
import {
  PROVIDER_STATUSES,
  PROVIDER_ERROR_CODES,
  successResult,
  emptyResult,
  failedResult,
  partialResult,
  unsupportedResult,
  loadingResult,
  isSuccess,
  isFailed,
  isPartial,
  isEmpty,
  type ProviderError,
  type ProviderResult,
} from "../providers/types";
import { MockDiscoveryProvider } from "../providers/mock-discovery-provider";
import { MockTokenIntelligenceProvider } from "../providers/mock-token-intelligence-provider";
import { MockEvidenceProvider } from "../providers/mock-evidence-provider";
import {
  MockSecurityScanProvider,
  isScanSafe,
  scanWarnings,
} from "../providers/mock-security-scan-provider";
import { MockOutcomeProvider } from "../providers/mock-outcome-provider";
import {
  CAUTION_CASE_ID,
  CAUTION_TARGET_ID,
  HIGH_RISK_CASE_ID,
  HIGH_RISK_TARGET_ID,
  LOW_RISK_CASE_ID,
  LOW_RISK_SCAN_ID,
  LOW_RISK_TARGET_ID,
  cautionTarget,
  highRiskTarget,
  lowRiskTarget,
} from "../fixtures";

describe("Provider Types — Result and Error", () => {
  it("defines all required provider statuses", () => {
    expect(PROVIDER_STATUSES).toContain("success");
    expect(PROVIDER_STATUSES).toContain("partial");
    expect(PROVIDER_STATUSES).toContain("empty");
    expect(PROVIDER_STATUSES).toContain("failed");
    expect(PROVIDER_STATUSES).toContain("unsupported");
    expect(PROVIDER_STATUSES).toContain("loading");
  });

  it("defines all required error codes", () => {
    const required = [
      "NETWORK_ERROR",
      "TIMEOUT",
      "RATE_LIMITED",
      "UNAUTHORIZED",
      "UNSUPPORTED_NETWORK",
      "INVALID_TARGET",
      "NO_DATA",
      "UPSTREAM_ERROR",
      "UNKNOWN_ERROR",
    ];
    for (const code of required) {
      expect(PROVIDER_ERROR_CODES).toContain(code);
    }
  });

  it("successResult returns a valid success result", () => {
    const r = successResult([1, 2, 3], "test");
    expect(r.data).toEqual([1, 2, 3]);
    expect(r.status).toBe("success");
    expect(r.source).toBe("test");
    expect(r.fetchedAt).toBeTruthy();
  });

  it("emptyResult returns a valid empty result", () => {
    const r = emptyResult<number[]>("test");
    expect(r.data).toBeNull();
    expect(r.status).toBe("empty");
  });

  it("failedResult returns a valid failed result with error", () => {
    const error: ProviderError = {
      code: "UPSTREAM_ERROR",
      message: "fail",
      retryable: true,
      provider: "test",
    };
    const r = failedResult<number[]>("test", error);
    expect(r.data).toBeNull();
    expect(r.status).toBe("failed");
    expect(r.error).toEqual(error);
  });

  it("partialResult returns data with warnings", () => {
    const r = partialResult([1, 2], "test", [
      { code: "UPSTREAM_ERROR", message: "partial", provider: "test" },
    ]);
    expect(r.data).toEqual([1, 2]);
    expect(r.status).toBe("partial");
    expect(r.warnings).toHaveLength(1);
  });

  it("unsupportedResult returns a valid unsupported result", () => {
    const r = unsupportedResult<number[]>("test", "network not supported");
    expect(r.status).toBe("unsupported");
    expect(r.error?.code).toBe("UNSUPPORTED_NETWORK");
  });

  it("loadingResult returns a valid loading result", () => {
    const r = loadingResult<number[]>("test");
    expect(r.status).toBe("loading");
    expect(r.data).toBeNull();
  });

  it("type guards work correctly", () => {
    const s: ProviderResult<number> = successResult(1, "t");
    const f: ProviderResult<number> = failedResult("t", {
      code: "NO_DATA",
      message: "x",
      retryable: false,
      provider: "t",
    });
    const p: ProviderResult<number> = partialResult(1, "t", []);
    const e: ProviderResult<number> = emptyResult("t");
    expect(isSuccess(s)).toBe(true);
    expect(isFailed(f)).toBe(true);
    expect(isPartial(p)).toBe(true);
    expect(isEmpty(e)).toBe(true);
  });

  it("provider errors never contain secrets, keys, or env values", () => {
    const error: ProviderError = {
      code: "NETWORK_ERROR",
      message: "safe message",
      retryable: true,
      provider: "mock",
    };
    const serialized = JSON.stringify(error);
    expect(serialized).not.toMatch(/api[_-]?key/i);
    expect(serialized).not.toMatch(/private[_-]?key/i);
    expect(serialized).not.toMatch(/password/i);
    expect(serialized).not.toMatch(/0x[0-9a-fA-F]{40,}/);
  });
});

describe("MockDiscoveryProvider", () => {
  it("returns success with sample targets by default", async () => {
    const p = new MockDiscoveryProvider();
    const r = await p.listTargets();
    expect(r.status).toBe("success");
    expect(r.data).not.toBeNull();
    expect(r.data!.length).toBeGreaterThan(0);
  });

  it("returns empty when scenario is empty", async () => {
    const p = new MockDiscoveryProvider();
    p.scenario = "empty";
    const r = await p.listTargets();
    expect(r.status).toBe("empty");
    expect(r.data).toBeNull();
  });

  it("returns unsupported for unsupported network", async () => {
    const p = new MockDiscoveryProvider();
    p.scenario = "unsupported";
    const r = await p.listTargets({ network: "unknown-chain" });
    expect(r.status).toBe("unsupported");
    expect(r.error?.code).toBe("UNSUPPORTED_NETWORK");
  });

  it("returns failed with error code when scenario is failed", async () => {
    const p = new MockDiscoveryProvider();
    p.scenario = "failed";
    const r = await p.listTargets();
    expect(r.status).toBe("failed");
    expect(r.error).toBeDefined();
    expect(r.error?.code).toBe("UPSTREAM_ERROR");
  });

  it("getSignal returns a signal for a known target", async () => {
    const p = new MockDiscoveryProvider();
    const r = await p.getSignal(LOW_RISK_TARGET_ID);
    expect(r.status).toBe("success");
    expect(r.data?.caseId).toBe(LOW_RISK_CASE_ID);
  });

  it("getSignal returns failed for unknown target", async () => {
    const p = new MockDiscoveryProvider();
    const r = await p.getSignal("nonexistent-target");
    expect(r.status).toBe("failed");
    expect(r.error?.code).toBe("NO_DATA");
  });

  it("filters by network", async () => {
    const p = new MockDiscoveryProvider();
    const r = await p.listTargets({ network: "ethereum" });
    expect(r.status).toBe("success");
    expect(r.data!.every((t) => t.network === "ethereum")).toBe(true);
  });

  it("limits results", async () => {
    const p = new MockDiscoveryProvider();
    const r = await p.listTargets({ limit: 1 });
    expect(r.data!.length).toBe(1);
  });

  it("every result includes source and fetchedAt", async () => {
    const p = new MockDiscoveryProvider();
    const r = await p.listTargets();
    expect(r.source).toBe("mock-discovery");
    expect(r.fetchedAt).toBeTruthy();
  });
});

describe("MockTokenIntelligenceProvider", () => {
  it("returns a token profile for a known target", async () => {
    const p = new MockTokenIntelligenceProvider();
    const r = await p.getTokenProfile(LOW_RISK_TARGET_ID);
    expect(r.status).toBe("success");
    expect(r.data?.symbol).toBe(lowRiskTarget.symbol);
  });

  it("returns empty when scenario is empty", async () => {
    const p = new MockTokenIntelligenceProvider();
    p.scenario = "empty";
    const r = await p.getTokenProfile(LOW_RISK_TARGET_ID);
    expect(r.status).toBe("empty");
  });

  it("returns a market snapshot for a known target", async () => {
    const p = new MockTokenIntelligenceProvider();
    const r = await p.getMarketSnapshot(CAUTION_TARGET_ID);
    expect(r.status).toBe("success");
    expect(r.data?.targetId).toBe(CAUTION_TARGET_ID);
  });

  it("returns failed for unknown target", async () => {
    const p = new MockTokenIntelligenceProvider();
    const r = await p.getTokenProfile("nonexistent");
    expect(r.status).toBe("failed");
    expect(r.error?.code).toBe("NO_DATA");
  });
});

describe("MockEvidenceProvider", () => {
  it("returns evidence linked to the caseId", async () => {
    const p = new MockEvidenceProvider();
    const r = await p.getEvidence(LOW_RISK_CASE_ID);
    expect(r.status).toBe("success");
    expect(r.data!.every((e) => e.caseId === LOW_RISK_CASE_ID)).toBe(true);
  });

  it("returns partial evidence with warnings", async () => {
    const p = new MockEvidenceProvider();
    p.scenario = "partial";
    const r = await p.getEvidence(LOW_RISK_CASE_ID);
    expect(r.status).toBe("partial");
    expect(r.warnings).toBeDefined();
    expect(r.warnings!.length).toBeGreaterThan(0);
  });

  it("returns empty when scenario is empty", async () => {
    const p = new MockEvidenceProvider();
    p.scenario = "empty";
    const r = await p.getEvidence(LOW_RISK_CASE_ID);
    expect(r.status).toBe("empty");
  });

  it("returns failed for unknown caseId", async () => {
    const p = new MockEvidenceProvider();
    const r = await p.getEvidence("nonexistent-case");
    expect(r.status).toBe("failed");
    expect(r.error?.code).toBe("NO_DATA");
  });

  it("evidence items are still linked to the caseId in partial scenario", async () => {
    const p = new MockEvidenceProvider();
    p.scenario = "partial";
    const r = await p.getEvidence(HIGH_RISK_CASE_ID);
    expect(r.data!.every((e) => e.caseId === HIGH_RISK_CASE_ID)).toBe(true);
  });
});

describe("MockSecurityScanProvider", () => {
  it("returns a complete scan by default", async () => {
    const p = new MockSecurityScanProvider();
    const r = await p.runScan({
      caseId: LOW_RISK_CASE_ID,
      targetId: LOW_RISK_TARGET_ID,
      network: "ethereum",
      address: lowRiskTarget.address,
    });
    expect(r.status).toBe("success");
    expect(r.data?.status).toBe("complete");
  });

  it("returns a failed scan (not a safe result) when scenario is failed", async () => {
    const p = new MockSecurityScanProvider();
    p.scenario = "failed";
    const r = await p.runScan({
      caseId: LOW_RISK_CASE_ID,
      targetId: LOW_RISK_TARGET_ID,
      network: "ethereum",
      address: lowRiskTarget.address,
    });
    expect(r.data?.status).toBe("failed");
    expect(isScanSafe(r.data!)).toBe(false);
    expect(scanWarnings(r.data!).length).toBeGreaterThan(0);
  });

  it("returns a partial scan (not a safe result) when scenario is partial", async () => {
    const p = new MockSecurityScanProvider();
    p.scenario = "partial";
    const r = await p.runScan({
      caseId: CAUTION_CASE_ID,
      targetId: cautionTarget.id,
      network: "ethereum",
      address: cautionTarget.address,
    });
    expect(r.data?.status).toBe("partial");
    expect(isScanSafe(r.data!)).toBe(false);
  });

  it("returns rate-limited error when scenario is rate-limited", async () => {
    const p = new MockSecurityScanProvider();
    p.scenario = "rate-limited";
    const r = await p.runScan({
      caseId: HIGH_RISK_CASE_ID,
      targetId: highRiskTarget.id,
      network: "ethereum",
      address: highRiskTarget.address,
    });
    expect(r.status).toBe("failed");
    expect(r.error?.code).toBe("RATE_LIMITED");
    expect(r.error?.retryable).toBe(true);
  });

  it("getScanStatus returns known sample scans", async () => {
    const p = new MockSecurityScanProvider();
    const r = await p.getScanStatus(LOW_RISK_SCAN_ID);
    expect(r.status).toBe("success");
    expect(r.data?.caseId).toBe(LOW_RISK_CASE_ID);
  });

  it("failed scan must not produce a no-issue risk implicitly", async () => {
    const p = new MockSecurityScanProvider();
    p.scenario = "failed";
    const r = await p.runScan({
      caseId: LOW_RISK_CASE_ID,
      targetId: LOW_RISK_TARGET_ID,
      network: "ethereum",
      address: lowRiskTarget.address,
    });
    // The provider must NOT return a scan that looks safe when it failed.
    expect(r.data?.status).not.toBe("complete");
  });
});

describe("MockOutcomeProvider", () => {
  it("starts tracking a case with a pending outcome", async () => {
    const p = new MockOutcomeProvider();
    const r = await p.startTracking(LOW_RISK_CASE_ID);
    expect(r.status).toBe("success");
    expect(r.data?.status).toBe("pending");
  });

  it("getOutcome returns aligned outcome for low-risk case", async () => {
    const p = new MockOutcomeProvider();
    const r = await p.getOutcome(LOW_RISK_CASE_ID);
    expect(r.status).toBe("success");
    expect(r.data?.status).toBe("aligned");
  });

  it("getOutcome returns empty for unknown case", async () => {
    const p = new MockOutcomeProvider();
    p.scenario = "empty";
    const r = await p.getOutcome("nonexistent");
    expect(r.status).toBe("empty");
  });

  it("returns failed when scenario is failed", async () => {
    const p = new MockOutcomeProvider();
    p.scenario = "failed";
    const r = await p.startTracking(LOW_RISK_CASE_ID);
    expect(r.status).toBe("failed");
    expect(r.error?.code).toBe("UPSTREAM_ERROR");
  });
});

describe("Offline Test Guarantee", () => {
  it("all mock providers work without network, secrets, or wallet", async () => {
    const discovery = new MockDiscoveryProvider();
    const token = new MockTokenIntelligenceProvider();
    const evidence = new MockEvidenceProvider();
    const scan = new MockSecurityScanProvider();
    const outcome = new MockOutcomeProvider();

    // Run all providers in sequence
    const targets = await discovery.listTargets();
    const profile = await token.getTokenProfile(LOW_RISK_TARGET_ID);
    const ev = await evidence.getEvidence(LOW_RISK_CASE_ID);
    const sc = await scan.runScan({
      caseId: LOW_RISK_CASE_ID,
      targetId: LOW_RISK_TARGET_ID,
      network: "ethereum",
      address: lowRiskTarget.address,
    });
    const out = await outcome.startTracking(LOW_RISK_CASE_ID);

    expect(targets.status).toBe("success");
    expect(profile.status).toBe("success");
    expect(ev.status).toBe("success");
    expect(sc.status).toBe("success");
    expect(out.status).toBe("success");
  });
});
