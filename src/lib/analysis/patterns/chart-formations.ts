/**
 * Vixor Local Trading Analysis Engine — Chart Formation Detection
 *
 * Detects multi-candle chart formations (double tops/bottoms, head & shoulders,
 * triangles, flags, wedges, cup & handle) using swing point analysis and
 * trendline fitting.
 *
 * Each detector validates the geometric structure of the formation and
 * assigns a reliability score based on how closely the price action matches
 * the textbook pattern definition.
 *
 * Usage:
 *   const swings = detectSwingPoints(bars);
 *   const formations = detectChartFormations(bars, swings);
 *   // → sorted by reliability, only reliability > 40
 */

import { OHLCVBar, ChartFormation, SwingPoint } from "../core/types";
import { range } from "../core/candle-utils";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum % price difference for two levels to be considered "same" */
const LEVEL_TOLERANCE = 0.015; // 1.5%

/** Minimum distance (in bars) between swing points for a valid formation */
const MIN_SWING_DISTANCE = 4;

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Run all formation detectors and return combined results.
 * Only formations with reliability > 40 are returned, sorted descending.
 */
export function detectChartFormations(
  bars: OHLCVBar[],
  swingPoints: SwingPoint[],
): ChartFormation[] {
  if (bars.length < 20 || swingPoints.length < 3) return [];

  const detectors: Array<(sw: SwingPoint[], b: OHLCVBar[]) => ChartFormation | null> = [
    detectDoubleTop,
    detectDoubleBottom,
    detectHeadAndShoulders,
    detectInverseHeadAndShoulders,
    detectAscendingTriangle,
    detectDescendingTriangle,
    detectBullFlag,
    detectBearFlag,
    detectRisingWedge,
    detectFallingWedge,
    detectCupAndHandle,
    detectSymmetricalTriangle,
    detectRectangleBullish,
    detectRectangleBearish,
    detectBroadeningTop,
    detectBroadeningBottom,
    detectMegaphoneTop,
    detectRoundingTop,
    detectRoundingBottom,
    detectDiamondTop,
  ];

  const results: ChartFormation[] = [];
  for (const fn of detectors) {
    const result = fn(swingPoints, bars);
    if (result) results.push(result);
  }

  return results
    .filter((f) => f.reliability > 40)
    .sort((a, b) => b.reliability - a.reliability);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if two price levels are within tolerance of each other */
function sameLevel(a: number, b: number, tolerance = LEVEL_TOLERANCE): boolean {
  const avg = (a + b) / 2;
  if (avg === 0) return a === b;
  return Math.abs(a - b) / avg <= tolerance;
}

/** Get swing points of a specific type, sorted by index */
function swingsByType(swings: SwingPoint[], type: "HIGH" | "LOW"): SwingPoint[] {
  return swings.filter((s) => s.type === type).sort((a, b) => a.index - b.index);
}

/** Find the minimum low between two indices (the trough) */
function troughBetween(
  bars: OHLCVBar[],
  startIdx: number,
  endIdx: number,
): { price: number; index: number } {
  let minLow = Infinity;
  let minIdx = startIdx;
  for (let i = startIdx; i <= endIdx; i++) {
    if (bars[i].low < minLow) {
      minLow = bars[i].low;
      minIdx = i;
    }
  }
  return { price: minLow, index: minIdx };
}

/** Find the maximum high between two indices (the peak) */
function peakBetween(
  bars: OHLCVBar[],
  startIdx: number,
  endIdx: number,
): { price: number; index: number } {
  let maxHigh = -Infinity;
  let maxIdx = startIdx;
  for (let i = startIdx; i <= endIdx; i++) {
    if (bars[i].high > maxHigh) {
      maxHigh = bars[i].high;
      maxIdx = i;
    }
  }
  return { price: maxHigh, index: maxIdx };
}

/** Linear regression to get slope of a price series */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

/** Fit a trendline through swing points and return the slope */
function trendlineSlope(swings: SwingPoint[]): number {
  if (swings.length < 2) return 0;
  return linearSlope(swings.map((s) => s.price));
}

/**
 * Determine the short-term trend direction over the last `lookback` bars
 * ending at index `endIndex`. Uses a linear-regression-of-closes approach.
 */
function shortTermTrend(
  bars: OHLCVBar[],
  endIndex: number,
  lookback = 10,
): "UP" | "DOWN" | "FLAT" {
  const start = Math.max(0, endIndex - lookback + 1);
  const slice = bars.slice(start, endIndex + 1);
  if (slice.length < 3) return "FLAT";

  const n = slice.length;
  const xMean = (n - 1) / 2;
  const yMean = slice.reduce((s, b) => s + b.close, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (slice[i].close - yMean);
    den += dx * dx;
  }

  if (den === 0) return "FLAT";
  const slope = num / den;

  const avgPrice = yMean || 1;
  const pctPerBar = (slope / avgPrice) * 100;

  if (pctPerBar > 0.05) return "UP";
  if (pctPerBar < -0.05) return "DOWN";
  return "FLAT";
}

// ─── 1. Double Top ──────────────────────────────────────────────────────────

function detectDoubleTop(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  if (highs.length < 2) return null;

  // Look for two swing highs at the same level with a trough between them
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const first = highs[i];
      const second = highs[j];

      // Must be far enough apart
      if (second.index - first.index < MIN_SWING_DISTANCE) continue;

      // Peaks at similar level
      if (!sameLevel(first.price, second.price)) continue;

      // Must be preceded by an uptrend
      if (shortTermTrend(bars, first.index, 8) !== "UP") continue;

      // Trough between the two peaks
      const trough = troughBetween(bars, first.index, second.index);
      const avgPeak = (first.price + second.price) / 2;
      const depthPct = (avgPeak - trough.price) / avgPeak;

      // Trough must be at least 5% below the peaks for a valid double top
      if (depthPct < 0.05) continue;

      // Neckline = trough level
      const neckline = trough.price;
      const target = neckline - (avgPeak - neckline); // measured move

      let reliability = 60;
      // How close are the two peaks?
      const peakDiff = Math.abs(first.price - second.price) / avgPeak;
      if (peakDiff < 0.005) reliability += 15; // nearly identical
      else if (peakDiff < 0.01) reliability += 10;

      // Second peak slightly lower than first (classic sign of weakening)
      if (second.price < first.price) reliability += 5;

      // Depth of trough
      if (depthPct > 0.1) reliability += 5;

      return {
        name: "Double Top",
        type: "BEARISH",
        reliability: Math.min(reliability, 100),
        startIndex: first.index,
        endIndex: second.index,
        targetPrice: target,
        stopPrice: avgPeak,
      };
    }
  }
  return null;
}

// ─── 2. Double Bottom ───────────────────────────────────────────────────────

function detectDoubleBottom(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const lows = swingsByType(swings, "LOW");
  if (lows.length < 2) return null;

  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const first = lows[i];
      const second = lows[j];

      if (second.index - first.index < MIN_SWING_DISTANCE) continue;
      if (!sameLevel(first.price, second.price)) continue;

      // Must be preceded by a downtrend
      if (shortTermTrend(bars, first.index, 8) !== "DOWN") continue;

      // Peak between the two lows
      const peak = peakBetween(bars, first.index, second.index);
      const avgLow = (first.price + second.price) / 2;
      const heightPct = (peak.price - avgLow) / avgLow;

      if (heightPct < 0.05) continue;

      const neckline = peak.price;
      const target = neckline + (neckline - avgLow);

      let reliability = 60;
      const lowDiff = Math.abs(first.price - second.price) / avgLow;
      if (lowDiff < 0.005) reliability += 15;
      else if (lowDiff < 0.01) reliability += 10;

      if (second.price > first.price) reliability += 5; // higher low = more bullish
      if (heightPct > 0.1) reliability += 5;

      return {
        name: "Double Bottom",
        type: "BULLISH",
        reliability: Math.min(reliability, 100),
        startIndex: first.index,
        endIndex: second.index,
        targetPrice: target,
        stopPrice: avgLow,
      };
    }
  }
  return null;
}

// ─── 3. Head and Shoulders ──────────────────────────────────────────────────

function detectHeadAndShoulders(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  if (highs.length < 3) return null;

  // Look for three consecutive swing highs: left shoulder, head (higher), right shoulder
  for (let i = 0; i < highs.length - 2; i++) {
    const leftShoulder = highs[i];
    const head = highs[i + 1];
    const rightShoulder = highs[i + 2];

    // Head must be higher than both shoulders
    if (head.price <= leftShoulder.price || head.price <= rightShoulder.price) continue;

    // Shoulders at similar level
    if (!sameLevel(leftShoulder.price, rightShoulder.price)) continue;

    // Spacing
    if (head.index - leftShoulder.index < MIN_SWING_DISTANCE) continue;
    if (rightShoulder.index - head.index < MIN_SWING_DISTANCE) continue;

    // Preceded by uptrend
    if (shortTermTrend(bars, leftShoulder.index, 10) !== "UP") continue;

    // Find neckline (troughs between shoulders and head)
    const trough1 = troughBetween(bars, leftShoulder.index, head.index);
    const trough2 = troughBetween(bars, head.index, rightShoulder.index);

    // Neckline should be roughly level (two troughs at similar level)
    if (!sameLevel(trough1.price, trough2.price, 0.03)) continue;

    const neckline = (trough1.price + trough2.price) / 2;
    const headHeight = head.price - neckline;
    const target = neckline - headHeight;

    let reliability = 65;
    const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
    if (shoulderDiff < 0.005) reliability += 15;
    else if (shoulderDiff < 0.015) reliability += 10;

    // Symmetrical spacing
    const spacingRatio = (head.index - leftShoulder.index) / (rightShoulder.index - head.index);
    if (spacingRatio > 0.6 && spacingRatio < 1.6) reliability += 10;

    // Right shoulder slightly lower than left (more bearish confirmation)
    if (rightShoulder.price < leftShoulder.price) reliability += 5;

    return {
      name: "Head and Shoulders",
      type: "BEARISH",
      reliability: Math.min(reliability, 100),
      startIndex: leftShoulder.index,
      endIndex: rightShoulder.index,
      targetPrice: target,
      stopPrice: head.price,
    };
  }
  return null;
}

// ─── 4. Inverse Head and Shoulders ──────────────────────────────────────────

function detectInverseHeadAndShoulders(
  swings: SwingPoint[],
  bars: OHLCVBar[],
): ChartFormation | null {
  const lows = swingsByType(swings, "LOW");
  if (lows.length < 3) return null;

  for (let i = 0; i < lows.length - 2; i++) {
    const leftShoulder = lows[i];
    const head = lows[i + 1];
    const rightShoulder = lows[i + 2];

    // Head must be lower than both shoulders
    if (head.price >= leftShoulder.price || head.price >= rightShoulder.price) continue;

    // Shoulders at similar level
    if (!sameLevel(leftShoulder.price, rightShoulder.price)) continue;

    // Spacing
    if (head.index - leftShoulder.index < MIN_SWING_DISTANCE) continue;
    if (rightShoulder.index - head.index < MIN_SWING_DISTANCE) continue;

    // Preceded by downtrend
    if (shortTermTrend(bars, leftShoulder.index, 10) !== "DOWN") continue;

    // Find neckline (peaks between shoulders and head)
    const peak1 = peakBetween(bars, leftShoulder.index, head.index);
    const peak2 = peakBetween(bars, head.index, rightShoulder.index);

    if (!sameLevel(peak1.price, peak2.price, 0.03)) continue;

    const neckline = (peak1.price + peak2.price) / 2;
    const headDepth = neckline - head.price;
    const target = neckline + headDepth;

    let reliability = 65;
    const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
    if (shoulderDiff < 0.005) reliability += 15;
    else if (shoulderDiff < 0.015) reliability += 10;

    const spacingRatio = (head.index - leftShoulder.index) / (rightShoulder.index - head.index);
    if (spacingRatio > 0.6 && spacingRatio < 1.6) reliability += 10;

    if (rightShoulder.price > leftShoulder.price) reliability += 5;

    return {
      name: "Inverse Head and Shoulders",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: leftShoulder.index,
      endIndex: rightShoulder.index,
      targetPrice: target,
      stopPrice: head.price,
    };
  }
  return null;
}

// ─── 5. Ascending Triangle ──────────────────────────────────────────────────

function detectAscendingTriangle(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Flat resistance: two or more swing highs at the same level
  for (let i = 0; i < highs.length - 1; i++) {
    const h1 = highs[i];
    const h2 = highs[i + 1];

    if (!sameLevel(h1.price, h2.price)) continue;
    if (h2.index - h1.index < MIN_SWING_DISTANCE) continue;

    // Rising support: swing lows in the same range should be trending up
    const rangeLows = lows.filter(
      (l) => l.index >= h1.index && l.index <= h2.index,
    );
    if (rangeLows.length < 2) continue;

    const lowSlope = trendlineSlope(rangeLows);
    if (lowSlope <= 0) continue; // must be rising

    const resistance = (h1.price + h2.price) / 2;
    const target = resistance + (resistance - rangeLows[0].price);

    let reliability = 60;
    // How flat is resistance?
    const resistDiff = Math.abs(h1.price - h2.price) / resistance;
    if (resistDiff < 0.005) reliability += 15;
    else if (resistDiff < 0.01) reliability += 10;

    // More touches on resistance = more reliable
    const resistanceTouches = highs.filter(
      (h) => h.index >= h1.index && h.index <= h2.index && sameLevel(h.price, resistance, 0.01),
    ).length;
    if (resistanceTouches >= 3) reliability += 10;

    return {
      name: "Ascending Triangle",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: h1.index,
      endIndex: h2.index,
      targetPrice: target,
      stopPrice: rangeLows[0].price,
    };
  }
  return null;
}

// ─── 6. Descending Triangle ─────────────────────────────────────────────────

function detectDescendingTriangle(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Flat support: two or more swing lows at the same level
  for (let i = 0; i < lows.length - 1; i++) {
    const l1 = lows[i];
    const l2 = lows[i + 1];

    if (!sameLevel(l1.price, l2.price)) continue;
    if (l2.index - l1.index < MIN_SWING_DISTANCE) continue;

    // Declining resistance: swing highs in the same range should be trending down
    const rangeHighs = highs.filter(
      (h) => h.index >= l1.index && h.index <= l2.index,
    );
    if (rangeHighs.length < 2) continue;

    const highSlope = trendlineSlope(rangeHighs);
    if (highSlope >= 0) continue; // must be declining

    const support = (l1.price + l2.price) / 2;
    const target = support - (rangeHighs[0].price - support);

    let reliability = 60;
    const supportDiff = Math.abs(l1.price - l2.price) / support;
    if (supportDiff < 0.005) reliability += 15;
    else if (supportDiff < 0.01) reliability += 10;

    const supportTouches = lows.filter(
      (l) => l.index >= l1.index && l.index <= l2.index && sameLevel(l.price, support, 0.01),
    ).length;
    if (supportTouches >= 3) reliability += 10;

    return {
      name: "Descending Triangle",
      type: "BEARISH",
      reliability: Math.min(reliability, 100),
      startIndex: l1.index,
      endIndex: l2.index,
      targetPrice: target,
      stopPrice: rangeHighs[0].price,
    };
  }
  return null;
}

// ─── 7. Bull Flag ───────────────────────────────────────────────────────────

function detectBullFlag(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  if (bars.length < 20) return null;

  const lastBar = bars.length - 1;
  const lookback = Math.min(30, bars.length);

  // Identify the flagpole: a sharp upward move
  let poleStart = lastBar - lookback;
  let poleEnd = -1;
  let bestMove = 0;

  for (let start = lastBar - lookback; start < lastBar - 8; start++) {
    for (let end = start + 5; end <= lastBar; end++) {
      const move = bars[end].high - bars[start].low;
      const movePct = move / bars[start].low;
      if (movePct > bestMove && shortTermTrend(bars, end, end - start) === "UP") {
        bestMove = movePct;
        poleStart = start;
        poleEnd = end;
      }
    }
  }

  // Pole must be at least 3% move
  if (bestMove < 0.03 || poleEnd === -1) return null;

  // Flag: slight downward channel after the pole
  const flagBars = bars.slice(poleEnd, lastBar + 1);
  if (flagBars.length < 3) return null;

  // Flag should be a slight pullback (not a reversal)
  const flagSlope = linearSlope(flagBars.map((b) => b.close));
  const avgPrice = flagBars.reduce((s, b) => s + b.close, 0) / flagBars.length;

  // Flag should have slight downward slope (but not strong)
  if (flagSlope >= 0) return null; // not declining at all
  const flagPctPerBar = (flagSlope / avgPrice) * 100;
  if (Math.abs(flagPctPerBar) > 0.5) return null; // too steep — not a flag

  // Flag should retrace less than 50% of the pole
  const poleHigh = bars[poleEnd].high;
  const poleLow = bars[poleStart].low;
  const poleSize = poleHigh - poleLow;
  const flagLow = Math.min(...flagBars.map((b) => b.low));
  const retracement = (poleHigh - flagLow) / poleSize;
  if (retracement > 0.5) return null;

  const poleTop = poleHigh;
  const target = poleTop + poleSize;

  let reliability = 60;
  // Less retracement = more reliable
  if (retracement < 0.382) reliability += 15;
  else if (retracement < 0.25) reliability += 10;

  // Tighter flag channel
  const flagRange = Math.max(...flagBars.map((b) => b.high)) - Math.min(...flagBars.map((b) => b.low));
  if (flagRange / poleSize < 0.3) reliability += 10;

  return {
    name: "Bull Flag",
    type: "BULLISH",
    reliability: Math.min(reliability, 100),
    startIndex: poleStart,
    endIndex: lastBar,
    targetPrice: target,
    stopPrice: flagLow,
  };
}

// ─── 8. Bear Flag ───────────────────────────────────────────────────────────

function detectBearFlag(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  if (bars.length < 20) return null;

  const lastBar = bars.length - 1;
  const lookback = Math.min(30, bars.length);

  let poleStart = lastBar - lookback;
  let poleEnd = -1;
  let bestMove = 0;

  for (let start = lastBar - lookback; start < lastBar - 8; start++) {
    for (let end = start + 5; end <= lastBar; end++) {
      const move = bars[start].high - bars[end].low;
      const movePct = move / bars[start].high;
      if (movePct > bestMove && shortTermTrend(bars, end, end - start) === "DOWN") {
        bestMove = movePct;
        poleStart = start;
        poleEnd = end;
      }
    }
  }

  if (bestMove < 0.03 || poleEnd === -1) return null;

  const flagBars = bars.slice(poleEnd, lastBar + 1);
  if (flagBars.length < 3) return null;

  const flagSlope = linearSlope(flagBars.map((b) => b.close));
  const avgPrice = flagBars.reduce((s, b) => s + b.close, 0) / flagBars.length;

  // Flag should have slight upward slope (counter-trend)
  if (flagSlope <= 0) return null;
  const flagPctPerBar = (flagSlope / avgPrice) * 100;
  if (flagPctPerBar > 0.5) return null;

  const poleHigh = bars[poleStart].high;
  const poleLow = bars[poleEnd].low;
  const poleSize = poleHigh - poleLow;
  const flagHigh = Math.max(...flagBars.map((b) => b.high));
  const retracement = (flagHigh - poleLow) / poleSize;
  if (retracement > 0.5) return null;

  const poleBottom = poleLow;
  const target = poleBottom - poleSize;

  let reliability = 60;
  if (retracement < 0.382) reliability += 15;
  else if (retracement < 0.25) reliability += 10;

  const flagRange = Math.max(...flagBars.map((b) => b.high)) - Math.min(...flagBars.map((b) => b.low));
  if (flagRange / poleSize < 0.3) reliability += 10;

  return {
    name: "Bear Flag",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex: poleStart,
    endIndex: lastBar,
    targetPrice: target,
    stopPrice: flagHigh,
  };
}

// ─── 9. Rising Wedge ────────────────────────────────────────────────────────

function detectRisingWedge(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Both trendlines rising but converging
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  if (recentHighs.length < 2 || recentLows.length < 2) return null;

  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);

  // Both slopes must be positive (rising)
  if (highSlope <= 0 || lowSlope <= 0) return null;

  // Lower slope must be steeper than upper slope (converging)
  if (lowSlope <= highSlope) return null;

  // Must span enough bars
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 2) return null;

  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const wedgeWidth = lastHigh - lastLow;
  const target = lastLow - wedgeWidth;

  let reliability = 55;

  // More convergent = more reliable
  const convergenceRatio = highSlope / lowSlope;
  if (convergenceRatio < 0.5) reliability += 15;
  else if (convergenceRatio < 0.7) reliability += 10;

  // Preceded by uptrend
  if (shortTermTrend(bars, startIndex, 10) === "UP") reliability += 10;

  return {
    name: "Rising Wedge",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastHigh,
  };
}

// ─── 10. Falling Wedge ──────────────────────────────────────────────────────

function detectFallingWedge(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  if (recentHighs.length < 2 || recentLows.length < 2) return null;

  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);

  // Both slopes must be negative (falling)
  if (highSlope >= 0 || lowSlope >= 0) return null;

  // Upper slope must fall faster (more negative) than lower slope (converging)
  if (highSlope >= lowSlope) return null;

  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 2) return null;

  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const wedgeWidth = lastHigh - lastLow;
  const target = lastHigh + wedgeWidth;

  let reliability = 55;

  const convergenceRatio = lowSlope / highSlope; // both negative, lower is less negative
  if (convergenceRatio < 0.5) reliability += 15;
  else if (convergenceRatio < 0.7) reliability += 10;

  if (shortTermTrend(bars, startIndex, 10) === "DOWN") reliability += 10;

  return {
    name: "Falling Wedge",
    type: "BULLISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastLow,
  };
}

// ─── 11. Cup and Handle ─────────────────────────────────────────────────────

function detectCupAndHandle(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  // Cup and handle requires: initial peak, rounded bottom, return to peak, small downward drift (handle)
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Look for two swing highs at similar levels with a rounded bottom between them
  for (let i = 0; i < highs.length - 1; i++) {
    const leftRim = highs[i];
    const rightRim = highs[i + 1];

    // Rims should be at similar price levels
    if (!sameLevel(leftRim.price, rightRim.price, 0.02)) continue;

    // Must be far enough apart for a meaningful cup
    if (rightRim.index - leftRim.index < MIN_SWING_DISTANCE * 3) continue;

    // Find the bottom of the cup (lowest low between the two rims)
    const cupBottom = troughBetween(bars, leftRim.index, rightRim.index);
    const rimAvg = (leftRim.price + rightRim.price) / 2;
    const cupDepth = rimAvg - cupBottom.price;
    const depthPct = cupDepth / rimAvg;

    // Cup should be 10-30% deep (too shallow or too deep isn't a cup)
    if (depthPct < 0.05 || depthPct > 0.35) continue;

    // The bottom should be roughly in the middle of the cup (U-shape)
    const cupMidpoint = (leftRim.index + rightRim.index) / 2;
    const bottomOffset = Math.abs(cupBottom.index - cupMidpoint) / (rightRim.index - leftRim.index);
    // Bottom should be within 30% of center
    if (bottomOffset > 0.3) continue;

    // Handle: slight pullback after the right rim
    const handleBars = bars.slice(rightRim.index, bars.length);
    if (handleBars.length < 2) continue;

    // Handle should drift slightly downward
    const handleSlope = linearSlope(handleBars.map((b) => b.close));
    if (handleSlope > 0) continue; // handle must slope down

    const handleAvgPrice = handleBars.reduce((s, b) => s + b.close, 0) / handleBars.length;
    const handlePctDrift = Math.abs((handleSlope / handleAvgPrice) * 100);

    // Handle drift should be gentle (not a sharp drop)
    if (handlePctDrift > 0.3) continue;

    // Handle should retrace no more than 33% of the cup's rise
    const handleLow = Math.min(...handleBars.map((b) => b.low));
    const handleRetracement = (rightRim.price - handleLow) / cupDepth;
    if (handleRetracement > 0.5) continue;

    const breakout = rimAvg;
    const target = breakout + cupDepth;

    let reliability = 55;

    // U-shaped bottom (bottom close to center)
    if (bottomOffset < 0.15) reliability += 15;
    else if (bottomOffset < 0.25) reliability += 10;

    // Rims at nearly identical level
    const rimDiff = Math.abs(leftRim.price - rightRim.price) / rimAvg;
    if (rimDiff < 0.005) reliability += 10;
    else if (rimDiff < 0.01) reliability += 5;

    // Handle retraces 12-25% (ideal)
    if (handleRetracement > 0.12 && handleRetracement < 0.25) reliability += 10;

    return {
      name: "Cup and Handle",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: leftRim.index,
      endIndex: bars.length - 1,
      targetPrice: target,
      stopPrice: handleLow,
    };
  }
  return null;
}

// ─── 12. Symmetrical Triangle ───────────────────────────────────────────────

function detectSymmetricalTriangle(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Use recent swing points to fit trendlines
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  if (recentHighs.length < 2 || recentLows.length < 2) return null;

  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);

  // Highs must have a negative slope (descending resistance)
  if (highSlope >= 0) return null;

  // Lows must have a positive slope (rising support)
  if (lowSlope <= 0) return null;

  // Must span enough bars
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 2) return null;

  // Convergence: the gap between the trendlines is narrowing
  const firstHighPrice = recentHighs[0].price;
  const firstLowPrice = recentLows[0].price;
  const lastHighPrice = recentHighs[recentHighs.length - 1].price;
  const lastLowPrice = recentLows[recentLows.length - 1].price;

  const initialWidth = firstHighPrice - firstLowPrice;
  const finalWidth = lastHighPrice - lastLowPrice;

  if (initialWidth <= 0 || finalWidth <= 0) return null;
  if (finalWidth >= initialWidth) return null; // must converge

  // Determine breakout direction from prior trend
  const priorTrend = shortTermTrend(bars, startIndex, 12);
  const isBullish = priorTrend === "UP";
  const isBearish = priorTrend === "DOWN";

  // If no clear prior trend, default to measuring the triangle width
  const type: "BULLISH" | "BEARISH" = isBullish ? "BULLISH" : "BEARISH";

  const triangleHeight = initialWidth;
  const lastHigh = lastHighPrice;
  const lastLow = lastLowPrice;

  const target = isBullish
    ? lastHigh + triangleHeight
    : lastLow - triangleHeight;

  let reliability = 55;

  // More convergent = more reliable
  const convergenceRatio = finalWidth / initialWidth;
  if (convergenceRatio < 0.3) reliability += 15;
  else if (convergenceRatio < 0.5) reliability += 10;
  else if (convergenceRatio < 0.7) reliability += 5;

  // More touches on each trendline
  const totalHighs = recentHighs.length;
  const totalLows = recentLows.length;
  if (totalHighs >= 3 && totalLows >= 3) reliability += 10;
  else if (totalHighs >= 2 && totalLows >= 2) reliability += 5;

  // Prior trend alignment improves confidence
  if (isBullish || isBearish) reliability += 5;

  return {
    name: "Symmetrical Triangle",
    type,
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: isBullish ? lastLow : lastHigh,
  };
}

// ─── 13. Rectangle (Bullish) ────────────────────────────────────────────────

function detectRectangleBullish(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Find flat resistance (two highs at same level)
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const h1 = highs[i];
      const h2 = highs[j];

      if (!sameLevel(h1.price, h2.price)) continue;
      if (h2.index - h1.index < MIN_SWING_DISTANCE) continue;

      // Find flat support (two lows at same level) within the same range
      const rangeLows = lows.filter(
        (l) => l.index >= h1.index && l.index <= h2.index,
      );
      if (rangeLows.length < 2) continue;

      const lowSlope = trendlineSlope(rangeLows);
      // Support should be flat
      const avgLowPrice = rangeLows.reduce((s, l) => s + l.price, 0) / rangeLows.length;
      const lowPctSlope = Math.abs((lowSlope / avgLowPrice) * 100);
      if (lowPctSlope > 0.1) continue; // too sloped

      // Resistance should be flat
      const resistance = (h1.price + h2.price) / 2;
      const highPctDiff = Math.abs(h1.price - h2.price) / resistance;
      if (highPctDiff > LEVEL_TOLERANCE * 2) continue;

      // Support level
      const support = avgLowPrice;

      // Check support is flat by verifying lows are at same level
      let allLowsSameLevel = true;
      for (let k = 0; k < rangeLows.length - 1; k++) {
        if (!sameLevel(rangeLows[k].price, rangeLows[k + 1].price, 0.025)) {
          allLowsSameLevel = false;
          break;
        }
      }
      if (!allLowsSameLevel) continue;

      // At least 4 total touches (2 highs + 2 lows minimum)
      const totalTouches = 2 + rangeLows.filter(
        (l) => sameLevel(l.price, support, 0.015),
      ).length;
      if (totalTouches < 4) continue;

      // Prior uptrend
      if (shortTermTrend(bars, h1.index, 10) !== "UP") continue;

      const rectangleHeight = resistance - support;
      if (rectangleHeight / support < 0.02) continue; // too narrow

      const target = resistance + rectangleHeight;

      let reliability = 60;

      // More touches = more reliable
      if (totalTouches >= 6) reliability += 15;
      else if (totalTouches >= 5) reliability += 10;

      // How flat is the range
      if (highPctDiff < 0.005) reliability += 10;
      else if (highPctDiff < 0.01) reliability += 5;

      return {
        name: "Rectangle (Bullish)",
        type: "BULLISH",
        reliability: Math.min(reliability, 100),
        startIndex: h1.index,
        endIndex: h2.index,
        targetPrice: target,
        stopPrice: support,
      };
    }
  }
  return null;
}

// ─── 14. Rectangle (Bearish) ────────────────────────────────────────────────

function detectRectangleBearish(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Find flat support (two lows at same level)
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const l1 = lows[i];
      const l2 = lows[j];

      if (!sameLevel(l1.price, l2.price)) continue;
      if (l2.index - l1.index < MIN_SWING_DISTANCE) continue;

      // Find flat resistance within the same range
      const rangeHighs = highs.filter(
        (h) => h.index >= l1.index && h.index <= l2.index,
      );
      if (rangeHighs.length < 2) continue;

      const highSlope = trendlineSlope(rangeHighs);
      const avgHighPrice = rangeHighs.reduce((s, h) => s + h.price, 0) / rangeHighs.length;
      const highPctSlope = Math.abs((highSlope / avgHighPrice) * 100);
      if (highPctSlope > 0.1) continue;

      const support = (l1.price + l2.price) / 2;
      const lowPctDiff = Math.abs(l1.price - l2.price) / support;
      if (lowPctDiff > LEVEL_TOLERANCE * 2) continue;

      const resistance = avgHighPrice;

      // Verify highs are at same level
      let allHighsSameLevel = true;
      for (let k = 0; k < rangeHighs.length - 1; k++) {
        if (!sameLevel(rangeHighs[k].price, rangeHighs[k + 1].price, 0.025)) {
          allHighsSameLevel = false;
          break;
        }
      }
      if (!allHighsSameLevel) continue;

      const totalTouches = 2 + rangeHighs.filter(
        (h) => sameLevel(h.price, resistance, 0.015),
      ).length;
      if (totalTouches < 4) continue;

      // Prior downtrend
      if (shortTermTrend(bars, l1.index, 10) !== "DOWN") continue;

      const rectangleHeight = resistance - support;
      if (rectangleHeight / support < 0.02) continue;

      const target = support - rectangleHeight;

      let reliability = 60;

      if (totalTouches >= 6) reliability += 15;
      else if (totalTouches >= 5) reliability += 10;

      if (lowPctDiff < 0.005) reliability += 10;
      else if (lowPctDiff < 0.01) reliability += 5;

      return {
        name: "Rectangle (Bearish)",
        type: "BEARISH",
        reliability: Math.min(reliability, 100),
        startIndex: l1.index,
        endIndex: l2.index,
        targetPrice: target,
        stopPrice: resistance,
      };
    }
  }
  return null;
}

// ─── 15. Broadening Top ─────────────────────────────────────────────────────

function detectBroadeningTop(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  // Use recent swings
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  if (recentHighs.length < 2 || recentLows.length < 2) return null;

  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);

  // Highs must be rising (positive slope)
  if (highSlope <= 0) return null;

  // Lows must be falling (negative slope) — diverging
  if (lowSlope >= 0) return null;

  // Must span enough bars
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 2) return null;

  // Preceded by uptrend (reversal pattern)
  if (shortTermTrend(bars, startIndex, 10) !== "UP") return null;

  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const patternWidth = lastHigh - lastLow;

  const target = lastLow - patternWidth;

  let reliability = 55;

  // Divergence quality: how clearly the lines spread apart
  const divergenceStrength = Math.abs(highSlope) + Math.abs(lowSlope);
  const avgPrice = (lastHigh + lastLow) / 2;
  const divergencePct = (divergenceStrength / avgPrice) * 100;
  if (divergencePct > 0.3) reliability += 10;
  else if (divergencePct > 0.15) reliability += 5;

  // More swing points touching each trendline
  if (recentHighs.length >= 3 && recentLows.length >= 3) reliability += 10;

  return {
    name: "Broadening Top",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastHigh,
  };
}

// ─── 16. Broadening Bottom ──────────────────────────────────────────────────

function detectBroadeningBottom(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  if (highs.length < 2 || lows.length < 2) return null;

  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  if (recentHighs.length < 2 || recentLows.length < 2) return null;

  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);

  // Highs must be rising (positive slope) — diverging
  if (highSlope <= 0) return null;

  // Lows must be falling (negative slope) — diverging
  if (lowSlope >= 0) return null;

  // Must span enough bars
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 2) return null;

  // Preceded by downtrend (bullish reversal pattern)
  if (shortTermTrend(bars, startIndex, 10) !== "DOWN") return null;

  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const patternWidth = lastHigh - lastLow;

  const target = lastHigh + patternWidth;

  let reliability = 55;

  const divergenceStrength = Math.abs(highSlope) + Math.abs(lowSlope);
  const avgPrice = (lastHigh + lastLow) / 2;
  const divergencePct = (divergenceStrength / avgPrice) * 100;
  if (divergencePct > 0.3) reliability += 10;
  else if (divergencePct > 0.15) reliability += 5;

  if (recentHighs.length >= 3 && recentLows.length >= 3) reliability += 10;

  return {
    name: "Broadening Bottom",
    type: "BULLISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastLow,
  };
}

// ─── 17. Megaphone Top ──────────────────────────────────────────────────────

function detectMegaphoneTop(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  // Need at least 3 highs and 3 lows for a 5-point pattern
  if (highs.length < 3 || lows.length < 3) return null;

  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);

  if (recentHighs.length < 3 || recentLows.length < 3) return null;

  const highSlope = trendlineSlope(recentHighs);
  const lowSlope = trendlineSlope(recentLows);

  // Diverging trendlines: highs rising, lows falling
  if (highSlope <= 0) return null;
  if (lowSlope >= 0) return null;

  // Need at least 5 swing points total in the pattern
  if (recentHighs.length + recentLows.length < 5) return null;

  // Must span enough bars
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 3) return null;

  // Preceded by uptrend
  if (shortTermTrend(bars, startIndex, 12) !== "UP") return null;

  // Check for increasing volume/spikes in the pattern area
  // (as a proxy, check that bar ranges are expanding)
  const patternBars = bars.slice(startIndex, endIndex + 1);
  if (patternBars.length < 6) return null;

  const firstHalfRanges = patternBars.slice(0, Math.floor(patternBars.length / 2));
  const secondHalfRanges = patternBars.slice(Math.floor(patternBars.length / 2));
  const avgFirstHalfRange = firstHalfRanges.reduce((s, b) => s + (b.high - b.low), 0) / firstHalfRanges.length;
  const avgSecondHalfRange = secondHalfRanges.reduce((s, b) => s + (b.high - b.low), 0) / secondHalfRanges.length;

  // Ranges should be expanding (increasing volatility characteristic of megaphone)
  if (avgSecondHalfRange <= avgFirstHalfRange) return null;

  const lastHigh = recentHighs[recentHighs.length - 1].price;
  const lastLow = recentLows[recentLows.length - 1].price;
  const patternWidth = lastHigh - lastLow;

  const target = lastLow - patternWidth;

  let reliability = 55;

  // More swing points = clearer 5-point structure
  const totalPoints = recentHighs.length + recentLows.length;
  if (totalPoints >= 7) reliability += 15;
  else if (totalPoints >= 6) reliability += 10;
  else if (totalPoints >= 5) reliability += 5;

  // Range expansion adds to reliability
  const rangeExpansion = avgSecondHalfRange / avgFirstHalfRange;
  if (rangeExpansion > 1.5) reliability += 10;
  else if (rangeExpansion > 1.2) reliability += 5;

  return {
    name: "Megaphone Top",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: lastHigh,
  };
}

// ─── 18. Rounding Top ───────────────────────────────────────────────────────

function detectRoundingTop(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");

  if (highs.length < 3) return null;

  // Look for a dome shape: highs rise then fall gradually
  for (let i = 0; i < highs.length - 2; i++) {
    const h1 = highs[i];
    const h2 = highs[i + 1];
    const h3 = highs[i + 2];

    // Spacing
    if (h2.index - h1.index < MIN_SWING_DISTANCE) continue;
    if (h3.index - h2.index < MIN_SWING_DISTANCE) continue;

    // Dome shape: h1 < h2 > h3 (middle is the apex)
    if (h2.price <= h1.price || h2.price <= h3.price) continue;

    // Apex should be in the middle portion of the formation
    const totalSpan = h3.index - h1.index;
    const apexPosition = (h2.index - h1.index) / totalSpan;
    if (apexPosition < 0.25 || apexPosition > 0.75) continue;

    // Preceded by uptrend
    if (shortTermTrend(bars, h1.index, 10) !== "UP") continue;

    // Check that the dome is gradual (not a sharp spike)
    const leftSlope = (h2.price - h1.price) / (h2.index - h1.index);
    const rightSlope = (h3.price - h2.price) / (h3.index - h2.index);

    // Slopes should be gentle (not too steep)
    const avgPrice = (h1.price + h2.price + h3.price) / 3;
    const leftPctSlope = Math.abs((leftSlope / avgPrice) * 100);
    const rightPctSlope = Math.abs((rightSlope / avgPrice) * 100);

    if (leftPctSlope > 1.0 || rightPctSlope > 1.0) continue; // too steep for rounding

    // Check for more highs forming the dome shape
    const domeHighs = highs.filter((h) => h.index >= h1.index && h.index <= h3.index);

    // Symmetry: left rise should be roughly equal to right fall
    const leftRise = h2.price - h1.price;
    const rightFall = h2.price - h3.price;
    const symmetryRatio = Math.min(leftRise, rightFall) / Math.max(leftRise, rightFall);

    const trough = troughBetween(bars, h1.index, h3.index);
    const domeHeight = h2.price - trough.price;
    const target = trough.price - domeHeight;

    let reliability = 55;

    // More points forming the dome
    if (domeHighs.length >= 5) reliability += 15;
    else if (domeHighs.length >= 4) reliability += 10;
    else if (domeHighs.length >= 3) reliability += 5;

    // Better symmetry
    if (symmetryRatio > 0.8) reliability += 10;
    else if (symmetryRatio > 0.6) reliability += 5;

    return {
      name: "Rounding Top",
      type: "BEARISH",
      reliability: Math.min(reliability, 100),
      startIndex: h1.index,
      endIndex: h3.index,
      targetPrice: target,
      stopPrice: h2.price,
    };
  }
  return null;
}

// ─── 19. Rounding Bottom ────────────────────────────────────────────────────

function detectRoundingBottom(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const lows = swingsByType(swings, "LOW");

  if (lows.length < 3) return null;

  // Look for a bowl shape: lows fall then rise gradually
  for (let i = 0; i < lows.length - 2; i++) {
    const l1 = lows[i];
    const l2 = lows[i + 1];
    const l3 = lows[i + 2];

    // Spacing
    if (l2.index - l1.index < MIN_SWING_DISTANCE) continue;
    if (l3.index - l2.index < MIN_SWING_DISTANCE) continue;

    // Bowl shape: l1 > l2 < l3 (middle is the lowest point)
    if (l2.price >= l1.price || l2.price >= l3.price) continue;

    // Bottom should be in the middle portion
    const totalSpan = l3.index - l1.index;
    const bottomPosition = (l2.index - l1.index) / totalSpan;
    if (bottomPosition < 0.25 || bottomPosition > 0.75) continue;

    // Preceded by downtrend
    if (shortTermTrend(bars, l1.index, 10) !== "DOWN") continue;

    // Check that the bowl is gradual (not a sharp V)
    const leftSlope = (l2.price - l1.price) / (l2.index - l1.index);
    const rightSlope = (l3.price - l2.price) / (l3.index - l2.index);

    const avgPrice = (l1.price + l2.price + l3.price) / 3;
    const leftPctSlope = Math.abs((leftSlope / avgPrice) * 100);
    const rightPctSlope = Math.abs((rightSlope / avgPrice) * 100);

    if (leftPctSlope > 1.0 || rightPctSlope > 1.0) continue;

    // Check for more lows forming the bowl
    const bowlLows = lows.filter((l) => l.index >= l1.index && l.index <= l3.index);

    // Symmetry
    const leftFall = l1.price - l2.price;
    const rightRise = l3.price - l2.price;
    const symmetryRatio = Math.min(leftFall, rightRise) / Math.max(leftFall, rightRise);

    const peak = peakBetween(bars, l1.index, l3.index);
    const bowlDepth = peak.price - l2.price;
    const target = peak.price + bowlDepth;

    let reliability = 55;

    if (bowlLows.length >= 5) reliability += 15;
    else if (bowlLows.length >= 4) reliability += 10;
    else if (bowlLows.length >= 3) reliability += 5;

    if (symmetryRatio > 0.8) reliability += 10;
    else if (symmetryRatio > 0.6) reliability += 5;

    return {
      name: "Rounding Bottom",
      type: "BULLISH",
      reliability: Math.min(reliability, 100),
      startIndex: l1.index,
      endIndex: l3.index,
      targetPrice: target,
      stopPrice: l2.price,
    };
  }
  return null;
}

// ─── 20. Diamond Top ────────────────────────────────────────────────────────

function detectDiamondTop(swings: SwingPoint[], bars: OHLCVBar[]): ChartFormation | null {
  const highs = swingsByType(swings, "HIGH");
  const lows = swingsByType(swings, "LOW");

  // Need sufficient swing points
  if (highs.length < 3 || lows.length < 3) return null;

  // A diamond pattern: broadening then narrowing after an uptrend
  // The shape looks like: wider in the middle, narrowing at top and bottom
  // We need to find:
  //   - An initial broadening phase (highs rising, lows falling)
  //   - Followed by a converging phase (highs falling, lows rising)

  const recentHighs = highs.slice(-5);
  const recentLows = lows.slice(-5);

  if (recentHighs.length < 3 || recentLows.length < 3) return null;

  // Must span enough bars
  const startIndex = Math.min(recentHighs[0].index, recentLows[0].index);
  const endIndex = Math.max(
    recentHighs[recentHighs.length - 1].index,
    recentLows[recentLows.length - 1].index,
  );
  if (endIndex - startIndex < MIN_SWING_DISTANCE * 3) return null;

  // Preceded by uptrend
  if (shortTermTrend(bars, startIndex, 12) !== "UP") return null;

  // Split swings into first half (broadening) and second half (narrowing)
  const midIndex = Math.floor((startIndex + endIndex) / 2);

  const firstHalfHighs = recentHighs.filter((h) => h.index <= midIndex);
  const secondHalfHighs = recentHighs.filter((h) => h.index > midIndex);
  const firstHalfLows = recentLows.filter((l) => l.index <= midIndex);
  const secondHalfLows = recentLows.filter((l) => l.index > midIndex);

  // Need swings in both halves
  if (firstHalfHighs.length < 2 || secondHalfHighs.length < 1) return null;
  if (firstHalfLows.length < 2 || secondHalfLows.length < 1) return null;

  // First half: broadening (highs rising, lows falling)
  const firstHighSlope = trendlineSlope(firstHalfHighs);
  const firstLowSlope = trendlineSlope(firstHalfLows);

  if (firstHighSlope <= 0) return null; // highs should rise in first half
  if (firstLowSlope >= 0) return null;  // lows should fall in first half

  // Second half: converging (highs falling, lows rising)
  if (secondHalfHighs.length >= 2) {
    const secondHighSlope = trendlineSlope(secondHalfHighs);
    if (secondHighSlope >= 0) return null; // highs should fall in second half
  }
  if (secondHalfLows.length >= 2) {
    const secondLowSlope = trendlineSlope(secondHalfLows);
    if (secondLowSlope <= 0) return null; // lows should rise in second half
  }

  // Calculate pattern dimensions
  const peakPrice = Math.max(...recentHighs.map((h) => h.price));
  const troughPrice = Math.min(...recentLows.map((l) => l.price));
  const patternHeight = peakPrice - troughPrice;

  const target = troughPrice - patternHeight;

  let reliability = 55;

  // More swings forming the diamond shape
  const totalSwings = recentHighs.length + recentLows.length;
  if (totalSwings >= 8) reliability += 15;
  else if (totalSwings >= 6) reliability += 10;
  else if (totalSwings >= 5) reliability += 5;

  // Clear broadening then converging shape
  const broadeningStrength = Math.abs(firstHighSlope) + Math.abs(firstLowSlope);
  const avgPrice = (peakPrice + troughPrice) / 2;
  const broadeningPct = (broadeningStrength / avgPrice) * 100;
  if (broadeningPct > 0.2) reliability += 10;
  else if (broadeningPct > 0.1) reliability += 5;

  return {
    name: "Diamond Top",
    type: "BEARISH",
    reliability: Math.min(reliability, 100),
    startIndex,
    endIndex,
    targetPrice: target,
    stopPrice: peakPrice,
  };
}
