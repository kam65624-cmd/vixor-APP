// ============================================================================
// Vixor Risk Governor — Types
// ============================================================================
//
// The Risk Governor evaluates every analysis signal and decides whether
// to proceed, reduce position size, wait, or block entirely.
//
// It is fully SYNCHRONOUS — no async, no DB calls, no API calls.
// It produces ADVISORY suggestions only — never executes anything.
// ============================================================================

export interface RiskProfile {
  /** Maximum position size as % of account per trade (e.g. 0.02 = 2%) */
  maxPositionSizePct: number;

  /** Maximum daily drawdown allowed (e.g. 0.05 = 5%) */
  maxDailyLossPct: number;

  /** Maximum number of concurrent open positions */
  maxOpenTrades: number;

  /** Whether to pause after consecutive losses */
  cooldownAfterLoss: boolean;
}

export type GovernorAction = "PROCEED" | "REDUCE_SIZE" | "WAIT" | "BLOCK";

export interface GovernorDecision {
  /** Whether the signal is approved for execution */
  approved: boolean;

  /** What action to take */
  action: GovernorAction;

  /** The original signal direction */
  originalSignal: "BUY" | "SELL" | "WAIT";

  /** The adjusted signal direction (may differ from original if blocked) */
  adjustedSignal: "BUY" | "SELL" | "WAIT";

  /** Suggested position size as fraction of normal size (0-1) */
  suggestedSizePct: number;

  /** Human-readable reason for the decision */
  reason: string;

  /** Warnings about this signal */
  warnings: string[];
}

/** Default risk profile — conservative, suitable for most traders */
export const DEFAULT_RISK_PROFILE: RiskProfile = {
  maxPositionSizePct: 0.02,
  maxDailyLossPct: 0.05,
  maxOpenTrades: 3,
  cooldownAfterLoss: true,
};
