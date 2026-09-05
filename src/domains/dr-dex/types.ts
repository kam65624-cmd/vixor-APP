// ============================================================================
// DR.DEX — Risk & Decision Safety — Public Types
// ============================================================================
//
// DR.DEX is the Risk Assessment and Decision Safety surface. It evaluates
// tokens for risk, displays the BLOCK/WAIT/REDUCE_SIZE/PROCEED decision,
// and allows the user to log a Paper Decision.
//
// Key principles:
//   - ADVISORY ONLY — never executes anything, even in dev
//   - PAPER-FIRST — every decision is logged on paper, not on-chain
//   - EXPLICIT SEPARATION between High Risk and Unable to Verify
//   - POSITION SIZING is a recommendation, never a mandate
// ============================================================================

import type { GovernorAction, GovernorDecision } from "@/domains/risk-governor";

export type { GovernorAction, GovernorDecision, RiskProfile } from "@/domains/risk-governor";

/**
 * The risk verdict for a token, distinct from the Governor decision.
 * The verdict is "what we know about the risk", while the decision is
 * "what to do given the verdict + the analysis".
 */
export type RiskVerdict =
  "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK" | "EXTREME_RISK" | "UNABLE_TO_VERIFY";

/**
 * A paper decision logged by the user. The decision is NOT executed —
 * it's a record of what the user intended, useful for ECHO's outcome
 * tracking later.
 */
export interface PaperDecision {
  tokenAddress: string;
  chain: string;
  action: "BUY" | "SELL" | "WAIT";
  rationale: string;
  /** Condition that would invalidate the decision */
  invalidationCondition: string;
  /** Optional: target price for entry/exit */
  targetPrice?: number;
  /** Optional: stop-loss price */
  stopLoss?: number;
  /** Position size as fraction of normal (0-1) */
  positionSizePct: number;
  /** The Governor decision that informed this Paper Decision */
  governorAction: GovernorAction;
  decidedAt: string;
}

/**
 * Aggregated risk assessment for a token. Combines security, liquidity,
 * and the Governor's decision into a single view.
 */
export interface RiskAssessment {
  token: {
    address: string;
    chain: string;
    name: string;
    symbol: string;
  };
  riskVerdict: RiskVerdict;
  /** Security findings — honeypot, mintable, ownership, etc. */
  securitySummary: {
    isHoneypot: boolean;
    isMintable: boolean;
    ownershipRenounced: boolean;
    top10HolderPct?: number;
    risks: string[];
  };
  /** Liquidity findings */
  liquiditySummary: {
    totalLiquidityUsd: number;
    liquidityAdequate: boolean;
  };
  /** The Governor's decision */
  governorDecision: GovernorDecision;
  /** Items that prevented a confident verdict */
  unknowns: string[];
  /** ISO timestamp */
  assessedAt: string;
}
