// ============================================================================
// Vixor Chart Truth — Truth Score Engine
// ============================================================================
//
// Calculates a composite truth score that measures how well the vision-
// extracted data matches real market data.
//
// Weights:
//   symbolMatch (0.5)    — Did vision detect a valid, known symbol?
//   timeframeDetected (0.2) — Was a timeframe successfully identified?
//   priceDelta (0.3)     — How close is the vision price to the real price?
//
// Scoring:
//   truthScore >= 0.85  → "verified"
//   truthScore 0.6-0.85 → "unverified"
//   truthScore < 0.6    → "unreliable"
//   priceDelta > 15%    → forced "unreliable" regardless of other factors
// ============================================================================

import type { TruthValidationResult, TruthStatus } from "./types";

interface TruthScoreParams {
  /** Whether the vision-detected symbol matches a known trading pair */
  symbolMatch: boolean;

  /** Whether a timeframe was successfully detected */
  timeframeDetected: boolean;

  /** Percentage difference between vision price and real market price */
  priceDelta: number;
}

/**
 * Calculate the truth validation result from individual signal components.
 *
 * The scoring model uses weighted contributions:
 * - Symbol match contributes up to 0.5 (binary: matched or not)
 * - Timeframe detection contributes up to 0.2 (binary: detected or not)
 * - Price delta contributes up to 0.3, with penalty for large deltas
 *   - delta <= 1%  → full 0.3
 *   - delta 1-3%   → 0.2
 *   - delta 3-5%   → 0.1
 *   - delta > 5%   → penalized further
 *   - delta > 15%  → forces "unreliable" status
 */
export function calculateTruthScore(params: TruthScoreParams): TruthValidationResult {
  const { symbolMatch, timeframeDetected, priceDelta } = params;
  const warnings: string[] = [];

  // ── Symbol match score (0 or 0.5) ──
  const symbolScore = symbolMatch ? 0.5 : 0;
  if (!symbolMatch) {
    warnings.push("Vision-detected symbol does not match any known trading pair in the asset registry.");
  }

  // ── Timeframe detection score (0 or 0.2) ──
  const timeframeScore = timeframeDetected ? 0.2 : 0;
  if (!timeframeDetected) {
    warnings.push("No timeframe was detected from the chart image — analysis may use an inferred default.");
  }

  // ── Price delta score (0 to 0.3, with penalties) ──
  let priceScore: number;
  if (priceDelta === 0) {
    // No market price available to compare — neutral contribution
    priceScore = 0.15; // Half credit when we can't verify
  } else if (priceDelta <= 1) {
    priceScore = 0.3; // Excellent match
  } else if (priceDelta <= 3) {
    priceScore = 0.2; // Acceptable match
    warnings.push(`Vision price is ${priceDelta}% away from the real market price — minor discrepancy.`);
  } else if (priceDelta <= 5) {
    priceScore = 0.1; // Marginal match
    warnings.push(`Vision price is ${priceDelta}% away from the real market price — significant discrepancy.`);
  } else if (priceDelta <= 15) {
    priceScore = 0.02; // Very poor match
    warnings.push(`Vision price is ${priceDelta}% away from the real market price — the detected price may be incorrect.`);
  } else {
    priceScore = 0; // Completely unreliable
    warnings.push(`Vision price is ${priceDelta}% away from the real market price — vision extraction is unreliable.`);
  }

  // ── Calculate composite truth score ──
  let truthScore = symbolScore + timeframeScore + priceScore;
  truthScore = Math.round(truthScore * 100) / 100; // Round to 2 decimal places

  // ── Determine status ──
  let status: TruthStatus;
  if (priceDelta > 15) {
    status = "unreliable"; // Forced regardless of other factors
  } else if (truthScore >= 0.85) {
    status = "verified";
  } else if (truthScore >= 0.6) {
    status = "unverified";
  } else {
    status = "unreliable";
  }

  return {
    truthScore,
    status,
    priceDelta: priceDelta > 0 ? priceDelta : null,
    symbolMatch,
    warnings,
  };
}
