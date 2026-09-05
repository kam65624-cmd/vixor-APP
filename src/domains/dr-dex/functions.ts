// ============================================================================
// DR.DEX — Risk & Decision Safety — Server Functions
// ============================================================================
//
// assessToken: Aggregate security + liquidity + governor decision
// logPaperDecision: Record a paper decision (no execution)
//
// Design rules:
//   1. ADVISORY ONLY — never executes anything, even if API tokens are present
//   2. PAPER-FIRST — every decision is logged on paper
//   3. EXPLICIT SEPARATION between High Risk and Unable to Verify
//   4. Position sizing is a recommendation, never a mandate
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { scanToken } from "@/domains/shield/functions";
import { getTokenDetail } from "@/domains/hunt/functions";
import { RiskGovernor, DEFAULT_RISK_PROFILE } from "@/domains/risk-governor";
import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";
import type { PaperDecision, RiskAssessment, RiskVerdict } from "./types";

// ── Helper: derive risk level from security + liquidity data ─────────────────

function deriveRiskLevel(params: {
  isHoneypot: boolean;
  isMintable: boolean;
  ownershipRenounced: boolean;
  top10HolderPct: number;
  liquidity: number;
  securityRisksCount: number;
}): "LOW" | "MEDIUM" | "HIGH" {
  // Honeypot → always HIGH
  if (params.isHoneypot) return "HIGH";
  // High concentration → HIGH
  if (params.top10HolderPct > 70) return "HIGH";
  // Mintable + not renounced + low liquidity → HIGH
  if (params.isMintable && !params.ownershipRenounced && params.liquidity < 50_000) {
    return "HIGH";
  }
  // Mintable or not renounced or low liquidity → MEDIUM
  if (
    params.isMintable ||
    !params.ownershipRenounced ||
    params.liquidity < 100_000 ||
    params.securityRisksCount > 0
  ) {
    return "MEDIUM";
  }
  return "LOW";
}

// ── Helper: derive risk verdict from overall picture ──────────────────────────

function deriveRiskVerdict(params: {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  securityDataAvailable: boolean;
  marketDataAvailable: boolean;
  unknownsCount: number;
}): RiskVerdict {
  if (!params.securityDataAvailable) return "UNABLE_TO_VERIFY";
  if (params.unknownsCount > 2) return "UNABLE_TO_VERIFY";
  if (params.riskLevel === "HIGH") return "HIGH_RISK";
  if (params.riskLevel === "MEDIUM") return "MODERATE_RISK";
  return "LOW_RISK";
}

// ── Server Function: assessToken ─────────────────────────────────────────────

export const assessToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ address: z.string().min(10), chain: z.string() }))
  .handler(async ({ data, context }): Promise<RiskAssessment> => {
    const { address, chain } = data;
    const unknowns: string[] = [];
    let securityDataAvailable = false;
    let marketDataAvailable = false;

    // ── Step 1: Security scan ────────────────────────────────────────
    let securitySummary: RiskAssessment["securitySummary"] = {
      isHoneypot: false,
      isMintable: false,
      ownershipRenounced: true,
      risks: [],
    };

    try {
      const scan = await scanToken({ data: { address, chain } });
      if (scan.ok) {
        securityDataAvailable = true;
        securitySummary = {
          isHoneypot: scan.security.isHoneypot,
          isMintable: scan.security.isMintable,
          ownershipRenounced: scan.security.ownershipRenounced,
          top10HolderPct: scan.security.top10HolderPct,
          risks: scan.security.risks,
        };
        if (scan.security.isHoneypot) {
          unknowns.push("Honeypot risk confirmed — selling may be restricted.");
        }
      } else {
        unknowns.push(`Security scan failed: ${scan.error || "unknown reason"}`);
      }
    } catch (err) {
      unknowns.push(`Security scan error: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── Step 2: Market data ─────────────────────────────────────────
    let liquiditySummary: RiskAssessment["liquiditySummary"] = {
      totalLiquidityUsd: 0,
      liquidityAdequate: false,
    };
    let tokenName = "Unknown";
    let tokenSymbol = "???";

    try {
      const detail = await getTokenDetail({ data: { address, chain } });
      marketDataAvailable = true;
      tokenName = detail.name;
      tokenSymbol = detail.symbol;
      liquiditySummary = {
        totalLiquidityUsd: detail.liquidity,
        liquidityAdequate: detail.liquidity >= 50_000,
      };
      if (detail.liquidity < 50_000) {
        unknowns.push(
          `Low liquidity ($${detail.liquidity.toLocaleString()}) — single transactions can move the price significantly.`,
        );
      }
    } catch (err) {
      unknowns.push(`Market data error: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── Step 3: Build synthetic AnalysisResult for the Governor ─────
    const riskLevel = deriveRiskLevel({
      isHoneypot: securitySummary.isHoneypot,
      isMintable: securitySummary.isMintable,
      ownershipRenounced: securitySummary.ownershipRenounced,
      top10HolderPct: securitySummary.top10HolderPct ?? 0,
      liquidity: liquiditySummary.totalLiquidityUsd,
      securityRisksCount: securitySummary.risks.length,
    });

    // Map risk level to a confidence score (synthetic — the Governor needs a number)
    const confidence =
      riskLevel === "HIGH"
        ? 30
        : riskLevel === "MEDIUM"
          ? 55
          : securityDataAvailable && marketDataAvailable
            ? 75
            : 45;

    // Build a minimal AnalysisResult shape the Governor expects
    const syntheticAnalysis: Pick<
      AnalysisResult,
      "recommendation" | "risk_level" | "rr" | "confidence"
    > = {
      recommendation: securitySummary.isHoneypot || riskLevel === "HIGH" ? "WAIT" : "BUY",
      risk_level: riskLevel,
      rr: liquiditySummary.liquidityAdequate ? "1:2.0" : "1:1.0",
      confidence,
    };

    // ── Step 4: Run RiskGovernor ────────────────────────────────────
    const governor = new RiskGovernor();
    const governorDecision = governor.evaluate(
      syntheticAnalysis as AnalysisResult,
      DEFAULT_RISK_PROFILE,
    );

    // ── Step 5: Derive the user-facing verdict ───────────────────────
    const riskVerdict = deriveRiskVerdict({
      riskLevel,
      securityDataAvailable,
      marketDataAvailable,
      unknownsCount: unknowns.length,
    });

    return {
      token: { address, chain, name: tokenName, symbol: tokenSymbol },
      riskVerdict,
      securitySummary,
      liquiditySummary,
      governorDecision,
      unknowns,
      assessedAt: new Date().toISOString(),
    };
  });

// ── Server Function: logPaperDecision ───────────────────────────────────────
//
// This is a PERSIST-FREE function: it returns the decision object back to the
// caller so the client can store it. We deliberately do not write to any
// database table for now — that wiring belongs to ECHO (the next surface
// we're building) and should happen with a proper migrations review.

export const logPaperDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      tokenAddress: z.string().min(10),
      chain: z.string(),
      action: z.enum(["BUY", "SELL", "WAIT"]),
      rationale: z.string().min(1).max(2000),
      invalidationCondition: z.string().min(1).max(500),
      targetPrice: z.number().optional(),
      stopLoss: z.number().optional(),
      positionSizePct: z.number().min(0).max(1),
      governorAction: z.enum(["PROCEED", "REDUCE_SIZE", "WAIT", "BLOCK"]),
    }),
  )
  .handler(async ({ data, context }): Promise<PaperDecision> => {
    // Paper-only — we DO NOT execute anything, even if user has API keys.
    // We just record the decision and return it.
    return {
      tokenAddress: data.tokenAddress,
      chain: data.chain,
      action: data.action,
      rationale: data.rationale,
      invalidationCondition: data.invalidationCondition,
      targetPrice: data.targetPrice,
      stopLoss: data.stopLoss,
      positionSizePct: data.positionSizePct,
      governorAction: data.governorAction,
      decidedAt: new Date().toISOString(),
    };
  });
