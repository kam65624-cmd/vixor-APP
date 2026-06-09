/**
 * Vixor Local Trading Analysis Engine — Harmonic Pattern Detection
 *
 * Detects harmonic price patterns using Fibonacci ratios on swing points.
 * Each pattern identifies an XABCD 5-point formation and validates
 * Fibonacci ratios with a configurable tolerance (default ±5%).
 *
 * Supported patterns:
 *   Gartley, Butterfly, Bat, Crab, Shark, Cypher, ABCD, 5-0
 *
 * Each harmonic returns a ChartFormation with:
 *   - name: e.g. "Bullish Gartley", "Bearish Butterfly"
 *   - type: "BULLISH" | "BEARISH"
 *   - reliability: 0-100 based on Fibonacci ratio precision
 *   - startIndex / endIndex: X.index → D.index
 *   - targetPrice: PRZ (Potential Reversal Zone) target
 *   - stopPrice: beyond the PRZ
 *
 * Usage:
 *   const swingPoints = detectSwingPoints(bars);
 *   const harmonics = detectHarmonicPatterns(bars, swingPoints);
 */

import { OHLCVBar, SwingPoint, ChartFormation } from "../core/types";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default tolerance for Fibonacci ratio matching (±5%) */
const FIB_TOLERANCE = 0.05;

/** Minimum distance (in bars) between swing points for a valid pattern */
const MIN_SWING_DISTANCE = 3;

// ─── Fibonacci Helpers ───────────────────────────────────────────────────────

/** Calculate ratio a/b (returns 0 if b is 0) */
function fibRatio(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.abs(a / b);
}

/** Check if actual ratio is within tolerance of target ratio */
function isFibRatio(actual: number, target: number, tolerance: number = FIB_TOLERANCE): boolean {
  if (target === 0) return actual === 0;
  return Math.abs(actual - target) / target <= tolerance;
}

/** Check if actual ratio is within a range [low, high] with tolerance on each bound */
function isFibInRange(
  actual: number,
  low: number,
  high: number,
  tolerance: number = FIB_TOLERANCE,
): boolean {
  return actual >= low * (1 - tolerance) && actual <= high * (1 + tolerance);
}

// ─── XABCD Type ──────────────────────────────────────────────────────────────

interface XABCD {
  X: SwingPoint;
  A: SwingPoint;
  B: SwingPoint;
  C: SwingPoint;
  D: SwingPoint;
}

// ─── Find XABCD Patterns ────────────────────────────────────────────────────

/**
 * Find potential 5-point XABCD patterns from swing points.
 *
 * For a bullish pattern: X(LOW) → A(HIGH) → B(LOW) → C(HIGH) → D(LOW)
 * For a bearish pattern: X(HIGH) → A(LOW) → B(HIGH) → C(LOW) → D(HIGH)
 *
 * Returns all valid 5-point combinations.
 */
function findXABCD(swings: SwingPoint[], bars: OHLCVBar[]): XABCD[] {
  const results: XABCD[] = [];
  if (swings.length < 5) return results;

  // Try bullish XABCD: X(LOW), A(HIGH), B(LOW), C(HIGH), D(LOW)
  const lows = swings.filter((s) => s.type === "LOW").sort((a, b) => a.index - b.index);
  const highs = swings.filter((s) => s.type === "HIGH").sort((a, b) => a.index - b.index);

  // Bullish: X is a low, A is a high after X, B is a low after A, etc.
  for (const xLow of lows) {
    const aHighs = highs.filter((h) => h.index > xLow.index + MIN_SWING_DISTANCE);
    for (const aHigh of aHighs) {
      const bLows = lows.filter(
        (l) => l.index > aHigh.index + MIN_SWING_DISTANCE && l.price > xLow.price,
      );
      for (const bLow of bLows) {
        const cHighs = highs.filter(
          (h) => h.index > bLow.index + MIN_SWING_DISTANCE && h.price < aHigh.price,
        );
        for (const cHigh of cHighs) {
          const dLows = lows.filter(
            (l) => l.index > cHigh.index + MIN_SWING_DISTANCE && l.price > xLow.price,
          );
          for (const dLow of dLows) {
            results.push({
              X: xLow,
              A: aHigh,
              B: bLow,
              C: cHigh,
              D: dLow,
            });
          }
        }
      }
    }
  }

  // Bearish: X is a high, A is a low after X, B is a high after A, etc.
  for (const xHigh of highs) {
    const aLows = lows.filter((l) => l.index > xHigh.index + MIN_SWING_DISTANCE);
    for (const aLow of aLows) {
      const bHighs = highs.filter(
        (h) => h.index > aLow.index + MIN_SWING_DISTANCE && h.price < xHigh.price,
      );
      for (const bHigh of bHighs) {
        const cLows = lows.filter(
          (l) => l.index > bHigh.index + MIN_SWING_DISTANCE && l.price > aLow.price,
        );
        for (const cLow of cLows) {
          const dHighs = highs.filter(
            (h) => h.index > cLow.index + MIN_SWING_DISTANCE && h.price < xHigh.price,
          );
          for (const dHigh of dHighs) {
            results.push({
              X: xHigh,
              A: aLow,
              B: bHigh,
              C: cLow,
              D: dHigh,
            });
          }
        }
      }
    }
  }

  return results;
}

// ─── Pattern Validators ─────────────────────────────────────────────────────

/**
 * Calculate reliability based on how closely Fibonacci ratios match targets.
 * Each ratio match contributes to the score.
 */
function calcReliability(ratioChecks: Array<{ actual: number; target: number }>): number {
  if (ratioChecks.length === 0) return 0;

  let totalDeviation = 0;
  let matchCount = 0;

  for (const check of ratioChecks) {
    if (check.target === 0) continue;
    const deviation = Math.abs(check.actual - check.target) / check.target;
    totalDeviation += deviation;
    if (deviation <= FIB_TOLERANCE) matchCount++;
  }

  // Base reliability from match ratio
  const matchRatio = matchCount / ratioChecks.length;
  let reliability = 40 + matchRatio * 45; // 40-85 base

  // Bonus for very tight matches
  const avgDeviation = totalDeviation / ratioChecks.length;
  if (avgDeviation < 0.02) reliability += 15;
  else if (avgDeviation < 0.03) reliability += 10;
  else if (avgDeviation < 0.05) reliability += 5;

  return Math.min(Math.round(reliability), 100);
}

// ─── 1. Gartley ──────────────────────────────────────────────────────────────
// AB = 0.618 of XA, BC = 0.382-0.886 of AB, CD = 1.272-1.618 of BC, AD = 0.786 of XA

function detectGartley(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);

  if (XA === 0) return null;

  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);

  // AB must retrace ~0.618 of XA
  if (!isFibRatio(abRatio, 0.618, 0.1)) return null;

  // AD must retrace ~0.786 of XA
  if (!isFibRatio(adRatio, 0.786, 0.1)) return null;

  // BC must retrace 0.382-0.886 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;

  // CD must be 1.272-1.618 of BC
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 1.272, 1.618, 0.1)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish Gartley" : "Bearish Gartley";

  // PRZ target: D point is the reversal zone, target is beyond
  const przTarget = isBullish
    ? D.price + AD * 0.618
    : D.price - AD * 0.618;

  const stopPrice = isBullish
    ? X.price - XA * 0.05
    : X.price + XA * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 0.618 },
    { actual: adRatio, target: 0.786 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 1.414 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 2. Butterfly ────────────────────────────────────────────────────────────
// AB = 0.786 of XA, BC = 0.382-0.886 of AB, CD = 1.618-2.618 of BC, AD = 1.27 of XA

function detectButterfly(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);

  if (XA === 0) return null;

  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);

  // AB must retrace ~0.786 of XA
  if (!isFibRatio(abRatio, 0.786, 0.12)) return null;

  // AD must extend ~1.27 of XA (D goes beyond X)
  if (!isFibRatio(adRatio, 1.27, 0.12)) return null;

  // BC must retrace 0.382-0.886 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;

  // CD must extend 1.618-2.618 of BC
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 1.618, 2.618, 0.1)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish Butterfly" : "Bearish Butterfly";

  const przTarget = isBullish
    ? D.price + AD * 0.618
    : D.price - AD * 0.618;

  const stopPrice = isBullish
    ? D.price - XA * 0.05
    : D.price + XA * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 0.786 },
    { actual: adRatio, target: 1.27 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 2.0 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 3. Bat ──────────────────────────────────────────────────────────────────
// AB = 0.382-0.50 of XA, BC = 0.382-0.886 of AB, CD = 1.618-2.618 of BC, AD = 0.886 of XA

function detectBat(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);

  if (XA === 0) return null;

  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);

  // AB must retrace 0.382-0.50 of XA
  if (!isFibInRange(abRatio, 0.382, 0.50, 0.1)) return null;

  // AD must retrace ~0.886 of XA
  if (!isFibRatio(adRatio, 0.886, 0.1)) return null;

  // BC must retrace 0.382-0.886 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;

  // CD must extend 1.618-2.618 of BC
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 1.618, 2.618, 0.1)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish Bat" : "Bearish Bat";

  const przTarget = isBullish
    ? D.price + AD * 0.618
    : D.price - AD * 0.618;

  const stopPrice = isBullish
    ? X.price - XA * 0.05
    : X.price + XA * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 0.441 },
    { actual: adRatio, target: 0.886 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 2.0 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 4. Crab ─────────────────────────────────────────────────────────────────
// AB = 0.382-0.618 of XA, BC = 0.382-0.886 of AB, CD = 2.618-3.618 of BC, AD = 1.618 of XA

function detectCrab(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);
  const AD = Math.abs(D.price - A.price);

  if (XA === 0) return null;

  const abRatio = fibRatio(AB, XA);
  const adRatio = fibRatio(AD, XA);

  // AB must retrace 0.382-0.618 of XA
  if (!isFibInRange(abRatio, 0.382, 0.618, 0.1)) return null;

  // AD must extend ~1.618 of XA (D goes well beyond X)
  if (!isFibRatio(adRatio, 1.618, 0.12)) return null;

  // BC must retrace 0.382-0.886 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 0.382, 0.886, 0.1)) return null;

  // CD must extend 2.618-3.618 of BC
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 2.618, 3.618, 0.1)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish Crab" : "Bearish Crab";

  const przTarget = isBullish
    ? D.price + AD * 0.382
    : D.price - AD * 0.382;

  const stopPrice = isBullish
    ? D.price - XA * 0.05
    : D.price + XA * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 0.618 },
    { actual: adRatio, target: 1.618 },
    { actual: bcRatio, target: 0.618 },
    { actual: cdRatio, target: 3.14 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 5. Shark ────────────────────────────────────────────────────────────────
// AB = 0.446-0.618 of XA, BC = 1.130-1.618 of AB, CD = 0.886-1.130 of BC

function detectShark(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);

  if (XA === 0) return null;

  const abRatio = fibRatio(AB, XA);

  // AB must retrace 0.446-0.618 of XA
  if (!isFibInRange(abRatio, 0.446, 0.618, 0.1)) return null;

  // BC must extend 1.130-1.618 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 1.130, 1.618, 0.1)) return null;

  // CD must retrace 0.886-1.130 of BC
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibInRange(cdRatio, 0.886, 1.130, 0.1)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish Shark" : "Bearish Shark";

  const AD = Math.abs(D.price - A.price);
  const przTarget = isBullish
    ? D.price + AD * 0.618
    : D.price - AD * 0.618;

  const stopPrice = isBullish
    ? D.price - BC * 0.05
    : D.price + BC * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 0.532 },
    { actual: bcRatio, target: 1.414 },
    { actual: cdRatio, target: 1.0 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 6. Cypher ───────────────────────────────────────────────────────────────
// AB = 0.382-0.618 of XA, BC = 1.272-1.414 of AB, CD = 0.786 of XC

function detectCypher(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const XC = Math.abs(C.price - X.price);

  if (XA === 0 || XC === 0) return null;

  const abRatio = fibRatio(AB, XA);

  // AB must retrace 0.382-0.618 of XA
  if (!isFibInRange(abRatio, 0.382, 0.618, 0.1)) return null;

  // BC must extend 1.272-1.414 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 1.272, 1.414, 0.1)) return null;

  // CD must retrace ~0.786 of XC
  const CD = Math.abs(D.price - C.price);
  const cdXcRatio = fibRatio(CD, XC);
  if (!isFibRatio(cdXcRatio, 0.786, 0.1)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish Cypher" : "Bearish Cypher";

  const AD = Math.abs(D.price - A.price);
  const przTarget = isBullish
    ? D.price + AD * 0.618
    : D.price - AD * 0.618;

  const stopPrice = isBullish
    ? X.price - XA * 0.05
    : X.price + XA * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 0.5 },
    { actual: bcRatio, target: 1.343 },
    { actual: cdXcRatio, target: 0.786 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 7. ABCD ─────────────────────────────────────────────────────────────────
// AB = CD in both price and time. BC retraces 0.618-0.786 of AB.

function detectABCD(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);

  if (AB === 0) return null;

  // BC must retrace 0.618-0.786 of AB
  const bcRatio = fibRatio(BC, AB);
  if (!isFibInRange(bcRatio, 0.618, 0.786, 0.1)) return null;

  // CD should approximately equal AB (fibRatio should be near 1.0)
  const cdAbRatio = fibRatio(CD, AB);
  if (!isFibRatio(cdAbRatio, 1.0, 0.15)) return null;

  // Time symmetry: AB and CD should have similar duration
  const abDuration = B.index - A.index;
  const cdDuration = D.index - C.index;
  if (abDuration > 0 && cdDuration > 0) {
    const timeRatio = Math.min(abDuration, cdDuration) / Math.max(abDuration, cdDuration);
    if (timeRatio < 0.5) return null; // too asymmetric in time
  }

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish ABCD" : "Bearish ABCD";

  const przTarget = isBullish
    ? D.price + AB * 0.618
    : D.price - AB * 0.618;

  const stopPrice = isBullish
    ? D.price - AB * 0.05
    : D.price + AB * 0.05;

  const reliability = calcReliability([
    { actual: bcRatio, target: 0.707 },
    { actual: cdAbRatio, target: 1.0 },
  ]);

  // Bonus for time symmetry
  let finalReliability = reliability;
  if (abDuration > 0 && cdDuration > 0) {
    const timeRatio = Math.min(abDuration, cdDuration) / Math.max(abDuration, cdDuration);
    if (timeRatio > 0.85) finalReliability = Math.min(finalReliability + 10, 100);
    else if (timeRatio > 0.7) finalReliability = Math.min(finalReliability + 5, 100);
  }

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability: finalReliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── 8. 5-0 ──────────────────────────────────────────────────────────────────
// AB = 1.130-1.618 of XA, BC = 1.618-2.240 of AB, CD = 0.50 of BC

function detect50(pattern: XABCD): ChartFormation | null {
  const { X, A, B, C, D } = pattern;

  const XA = Math.abs(A.price - X.price);
  const AB = Math.abs(B.price - A.price);
  const BC = Math.abs(C.price - B.price);
  const CD = Math.abs(D.price - C.price);

  if (XA === 0) return null;

  const abRatio = fibRatio(AB, XA);

  // AB must extend 1.130-1.618 of XA
  if (!isFibInRange(abRatio, 1.130, 1.618, 0.1)) return null;

  // BC must extend 1.618-2.240 of AB
  const bcRatio = fibRatio(BC, AB);
  if (AB === 0 || !isFibInRange(bcRatio, 1.618, 2.240, 0.1)) return null;

  // CD must retrace ~0.50 of BC
  const cdRatio = fibRatio(CD, BC);
  if (BC === 0 || !isFibRatio(cdRatio, 0.50, 0.12)) return null;

  const isBullish = D.type === "LOW";
  const name = isBullish ? "Bullish 5-0" : "Bearish 5-0";

  const AD = Math.abs(D.price - A.price);
  const przTarget = isBullish
    ? D.price + AD * 0.618
    : D.price - AD * 0.618;

  const stopPrice = isBullish
    ? D.price - BC * 0.05
    : D.price + BC * 0.05;

  const reliability = calcReliability([
    { actual: abRatio, target: 1.414 },
    { actual: bcRatio, target: 2.0 },
    { actual: cdRatio, target: 0.50 },
  ]);

  return {
    name,
    type: isBullish ? "BULLISH" : "BEARISH",
    reliability,
    startIndex: X.index,
    endIndex: D.index,
    targetPrice: przTarget,
    stopPrice,
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Detect all harmonic patterns in the given bars using swing point analysis.
 *
 * Returns an array of ChartFormation objects, sorted by reliability descending.
 * Only patterns with reliability > 40 are returned.
 */
export function detectHarmonicPatterns(
  bars: OHLCVBar[],
  swingPoints: SwingPoint[],
): ChartFormation[] {
  if (bars.length < 30 || swingPoints.length < 5) return [];

  const patterns = findXABCD(swingPoints, bars);
  if (patterns.length === 0) return [];

  // Limit the number of patterns to process for performance
  const patternsToCheck = patterns.slice(0, 200);

  const results: ChartFormation[] = [];
  const seenPatterns = new Set<string>();

  const validators: Array<(p: XABCD) => ChartFormation | null> = [
    detectGartley,
    detectButterfly,
    detectBat,
    detectCrab,
    detectShark,
    detectCypher,
    detectABCD,
    detect50,
  ];

  for (const pattern of patternsToCheck) {
    for (const validator of validators) {
      const result = validator(pattern);
      if (result && result.reliability > 40) {
        // Deduplicate: avoid same pattern type at same location
        const key = `${result.name}-${result.startIndex}-${result.endIndex}`;
        if (!seenPatterns.has(key)) {
          seenPatterns.add(key);
          results.push(result);
        }
      }
    }
  }

  return results.sort((a, b) => b.reliability - a.reliability);
}
