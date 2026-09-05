// ============================================================================
// DR.DEX — Risk & Decision Safety — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import type { GovernorAction, PaperDecision, RiskAssessment, RiskVerdict } from "./types";

describe("Risk Verdict type", () => {
  it("should accept all valid verdict values", () => {
    const verdicts: RiskVerdict[] = [
      "LOW_RISK",
      "MODERATE_RISK",
      "HIGH_RISK",
      "EXTREME_RISK",
      "UNABLE_TO_VERIFY",
    ];
    for (const v of verdicts) {
      const r: RiskVerdict = v;
      expect(r).toBe(v);
    }
  });
});

describe("Governor Action type", () => {
  it("should accept all valid action values", () => {
    const actions: GovernorAction[] = ["PROCEED", "REDUCE_SIZE", "WAIT", "BLOCK"];
    for (const a of actions) {
      expect(a).toBeTruthy();
    }
  });
});

describe("PaperDecision shape", () => {
  it("should support a complete BUY decision with all optional fields", () => {
    const decision: PaperDecision = {
      tokenAddress: "0xToken",
      chain: "ethereum",
      action: "BUY",
      rationale: "Honeypot check passed, liquidity adequate, trend bullish.",
      invalidationCondition: "If price drops below support at $0.001.",
      targetPrice: 0.005,
      stopLoss: 0.0008,
      positionSizePct: 0.02,
      governorAction: "PROCEED",
      decidedAt: new Date().toISOString(),
    };
    expect(decision.action).toBe("BUY");
    expect(decision.targetPrice).toBe(0.005);
  });

  it("should support a SELL decision without targetPrice", () => {
    const decision: PaperDecision = {
      tokenAddress: "SoMintAddr",
      chain: "solana",
      action: "SELL",
      rationale: "Bearish divergence on 4H.",
      invalidationCondition: "If price reclaims the 200 EMA.",
      positionSizePct: 0.01,
      governorAction: "REDUCE_SIZE",
      decidedAt: new Date().toISOString(),
    };
    expect(decision.action).toBe("SELL");
    expect(decision.targetPrice).toBeUndefined();
  });

  it("should support a WAIT decision with no trade parameters", () => {
    const decision: PaperDecision = {
      tokenAddress: "0xWait",
      chain: "ethereum",
      action: "WAIT",
      rationale: "Risk Governor returned BLOCK — high risk score.",
      invalidationCondition: "Re-evaluate when more data is available.",
      positionSizePct: 0,
      governorAction: "BLOCK",
      decidedAt: new Date().toISOString(),
    };
    expect(decision.positionSizePct).toBe(0);
  });
});

describe("RiskAssessment shape", () => {
  it("should have all required top-level fields", () => {
    const assessment: RiskAssessment = {
      token: { address: "0xTest", chain: "ethereum", name: "Test", symbol: "TST" },
      riskVerdict: "MODERATE_RISK",
      securitySummary: {
        isHoneypot: false,
        isMintable: true,
        ownershipRenounced: false,
        top10HolderPct: 45,
        risks: ["Mintable"],
      },
      liquiditySummary: {
        totalLiquidityUsd: 75_000,
        liquidityAdequate: true,
      },
      governorDecision: {
        approved: true,
        action: "REDUCE_SIZE",
        originalSignal: "BUY",
        adjustedSignal: "BUY",
        suggestedSizePct: 0.5,
        reason: "Marginal risk",
        warnings: ["Reduced size"],
      },
      unknowns: [],
      assessedAt: new Date().toISOString(),
    };
    expect(assessment.token.symbol).toBe("TST");
    expect(assessment.governorDecision.action).toBe("REDUCE_SIZE");
  });

  it("should distinguish High Risk from Unable to Verify", () => {
    const highRisk: RiskAssessment = {
      token: { address: "0x", chain: "ethereum", name: "X", symbol: "X" },
      riskVerdict: "HIGH_RISK",
      securitySummary: { isHoneypot: true, isMintable: true, ownershipRenounced: false, risks: [] },
      liquiditySummary: { totalLiquidityUsd: 1000, liquidityAdequate: false },
      governorDecision: {
        approved: false,
        action: "BLOCK",
        originalSignal: "WAIT",
        adjustedSignal: "WAIT",
        suggestedSizePct: 0,
        reason: "Honeypot",
        warnings: [],
      },
      unknowns: [],
      assessedAt: new Date().toISOString(),
    };

    const unable: RiskAssessment = {
      ...highRisk,
      riskVerdict: "UNABLE_TO_VERIFY",
      unknowns: ["Security scan failed", "Market data unavailable"],
    };

    // High Risk and Unable to Verify are distinct concepts
    expect(highRisk.riskVerdict).not.toBe(unable.riskVerdict);
    // High Risk: we know it's bad
    expect(highRisk.unknowns).toHaveLength(0);
    // Unable to Verify: we don't know enough
    expect(unable.unknowns.length).toBeGreaterThan(0);
  });
});
