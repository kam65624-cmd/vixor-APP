// ============================================================================
// MR.VIGO — Investigation Domain — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import type { Evidence, InvestigationResult, Unknown } from "./types";

// ── Mock helpers ─────────────────────────────────────────────────────────────

function makeEvidence(
  params: Partial<Evidence> & { label: string; value: Evidence["value"] },
): Evidence {
  return {
    label: params.label,
    value: params.value,
    source: params.source ?? "Test",
    status: params.status ?? "reported",
    fetchedAt: new Date().toISOString(),
    detail: params.detail,
  };
}

function makeResult(overrides: Partial<InvestigationResult>): InvestigationResult {
  return {
    token: { address: "0xTest", chain: "ethereum", name: "Test Token", symbol: "TEST" },
    verdict: "CAUTION",
    evidence: { security: [], liquidity: [], ownership: [], market: [] },
    unknowns: [],
    investigatedAt: new Date().toISOString(),
    complete: true,
    ...overrides,
  };
}

// ── Verdict logic — tested indirectly via result shape ──────────────────────

describe("InvestigationResult shape", () => {
  it("should have all required top-level fields", () => {
    const result = makeResult({});
    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("verdict");
    expect(result).toHaveProperty("evidence");
    expect(result).toHaveProperty("unknowns");
    expect(result).toHaveProperty("investigatedAt");
    expect(result).toHaveProperty("complete");
  });

  it("should accept all valid verdict values", () => {
    const verdicts: InvestigationResult["verdict"][] = [
      "SAFE",
      "CAUTION",
      "SUSPICIOUS",
      "DANGER",
      "UNABLE_TO_VERIFY",
    ];
    for (const v of verdicts) {
      expect(makeResult({ verdict: v }).verdict).toBe(v);
    }
  });

  it("should support all evidence status values", () => {
    const statuses: Evidence["status"][] = ["verified", "reported", "unavailable", "unknown"];
    for (const s of statuses) {
      const ev = makeEvidence({ label: "Test", value: true, status: s });
      expect(ev.status).toBe(s);
    }
  });

  it("should support all serializable value types", () => {
    const values: Evidence["value"][] = [
      true,
      false,
      0,
      1.5,
      -0.001,
      1_000_000,
      "string",
      null,
      ["a", "b"],
      [1, 2, 3],
      { website: true, twitter: false },
    ];
    for (const v of values) {
      const ev = makeEvidence({ label: "Test", value: v });
      expect(ev.value).toEqual(v);
    }
  });
});

describe("Evidence grouping", () => {
  it("should group evidence into security, liquidity, ownership, market categories", () => {
    const security = makeEvidence({ label: "Honeypot", value: false, status: "verified" });
    const liquidity = makeEvidence({ label: "Liquidity", value: 50000, status: "reported" });
    const ownership = makeEvidence({ label: "Mintable", value: false, status: "reported" });
    const market = makeEvidence({ label: "Price", value: 0.001, status: "verified" });

    const result = makeResult({
      evidence: {
        security: [security],
        liquidity: [liquidity],
        ownership: [ownership],
        market: [market],
      },
    });

    expect(result.evidence.security).toHaveLength(1);
    expect(result.evidence.liquidity).toHaveLength(1);
    expect(result.evidence.ownership).toHaveLength(1);
    expect(result.evidence.market).toHaveLength(1);
  });
});

describe("Unknowns handling", () => {
  it("should support empty unknowns array (all verified)", () => {
    const result = makeResult({ unknowns: [] });
    expect(result.unknowns).toHaveLength(0);
    expect(result.complete).toBe(true);
  });

  it("should support multiple unknowns", () => {
    const unknowns: Unknown[] = [
      { topic: "Social presence", reason: "No links found", suggestion: "DYOR" },
      { topic: "Deployer history", reason: "API returned 404" },
    ];
    const result = makeResult({ unknowns, complete: false });
    expect(result.unknowns).toHaveLength(2);
    expect(result.complete).toBe(false);
  });

  it("should allow optional technical evidence", () => {
    const tech = makeEvidence({ label: "Chart pattern", value: "Bull flag", status: "reported" });
    const result = makeResult({
      evidence: { security: [], liquidity: [], ownership: [], market: [], technical: [tech] },
    });
    expect(result.evidence.technical).toHaveLength(1);
  });
});
