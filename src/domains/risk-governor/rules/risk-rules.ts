// ============================================================================
// Vixor Risk Governor — Risk Rules (Pure Functions)
// ============================================================================
//
// Pure scoring functions with NO side effects.
// Each function evaluates one dimension of risk and returns a multiplier
// (0.0 = reject, 1.0 = full size, > 1.0 = bonus).
//
// These are the building blocks the Governor uses to produce a decision.
// ============================================================================

/**
 * Evaluate risk level — maps LOW/MEDIUM/HIGH to a size multiplier.
 * - LOW:    full size (1.0)
 * - MEDIUM: reduced size (0.6)
 * - HIGH:   minimal size (0.25)
 */
export function evaluateRiskLevel(riskLevel: "LOW" | "MEDIUM" | "HIGH"): number {
  switch (riskLevel) {
    case "LOW":
      return 1.0;
    case "MEDIUM":
      return 0.6;
    case "HIGH":
      return 0.25;
    default:
      return 0.5;
  }
}

/**
 * Evaluate risk/reward ratio — parse the RR string and score it.
 * - RR < 1.0:  reject (0) — not worth the risk
 * - RR 1.0-1.5: marginal (0.5)
 * - RR 1.5-3.0: good (1.0)
 * - RR > 3.0:  excellent (1.2 bonus)
 */
export function evaluateRR(rrString: string): number {
  if (!rrString) return 0.3; // No RR info — cautious default

  // Parse RR string: "1:2.5" → 2.5, "1/2.5" → 2.5, "2.5R" → 2.5
  let rr = 0;
  const colonMatch = rrString.match(/1[:/]\s*([\d.]+)/);
  if (colonMatch) {
    rr = parseFloat(colonMatch[1]);
  } else {
    const rMatch = rrString.match(/([\d.]+)\s*R/i);
    if (rMatch) {
      rr = parseFloat(rMatch[1]);
    } else {
      rr = parseFloat(rrString);
    }
  }

  if (isNaN(rr) || rr <= 0) return 0.3;

  if (rr < 1.0) return 0;        // Reject — bad RR
  if (rr < 1.5) return 0.5;      // Marginal
  if (rr <= 3.0) return 1.0;     // Good
  return 1.2;                      // Excellent — slight bonus
}

/**
 * Evaluate confidence score — maps 0-100 confidence to a multiplier.
 * - < 50:  very low confidence (0.3)
 * - 50-70: moderate confidence (0.6)
 * - 70-85: good confidence (0.8)
 * - > 85:  high confidence (1.0)
 */
export function evaluateConfidence(confidence: number): number {
  if (confidence < 50) return 0.3;
  if (confidence < 70) return 0.6;
  if (confidence < 85) return 0.8;
  return 1.0;
}

/**
 * Calculate composite score from the three risk dimensions.
 * Multiplies the three multipliers together and clamps to 0-1.
 *
 * A composite of 1.0 means: low risk + good RR + high confidence = proceed at full size
 * A composite of 0.0 means: any dimension rejected (e.g. RR < 1.0) = block
 */
export function compositeScore(
  riskMult: number,
  rrMult: number,
  confMult: number,
): number {
  const score = riskMult * rrMult * confMult;
  return Math.max(0, Math.min(1, score));
}
