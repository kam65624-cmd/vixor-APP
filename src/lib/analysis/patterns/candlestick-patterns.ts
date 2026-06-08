/**
 * Vixor Local Trading Analysis Engine — Candlestick Pattern Detection
 *
 * Detects 20 key candlestick patterns using mathematical conditions on
 * body size, wick ratios, and trend context. Each detector returns a
 * CandlePattern with a reliability score (0-100) reflecting how perfectly
 * the pattern matches the textbook definition.
 *
 * Usage:
 *   const patterns = detectCandlestickPatterns(bars);
 *   // → sorted by reliability, only reliability > 50
 */

import { OHLCVBar, CandlePattern } from "../core/types";
import {
  bodySize,
  upperWick,
  lowerWick,
  range,
  isBullish,
  isBearish,
  isDoji,
  avgBodySize,
  bodyRatio,
} from "../core/candle-utils";

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Run all pattern detectors across the bar array and return combined results.
 * Only patterns with reliability > 50 are returned, sorted by reliability descending.
 */
export function detectCandlestickPatterns(bars: OHLCVBar[]): CandlePattern[] {
  if (bars.length < 5) return [];

  const results: CandlePattern[] = [];

  for (let i = 2; i < bars.length; i++) {
    const detectors: Array<(b: OHLCVBar[], idx: number) => CandlePattern | null> = [
      detectBullishEngulfing,
      detectHammer,
      detectMorningStar,
      detectBullishHarami,
      detectPiercingLine,
      detectThreeWhiteSoldiers,
      detectBullishDojiStar,
      detectBearishEngulfing,
      detectShootingStar,
      detectEveningStar,
      detectBearishHarami,
      detectDarkCloudCover,
      detectThreeBlackCrows,
      detectBearishDojiStar,
      detectRisingThreeMethods,
      detectFallingThreeMethods,
      detectSpinningTop,
      detectMarubozuBullish,
      detectMarubozuBearish,
      detectTweezerTopBottom,
    ];

    for (const fn of detectors) {
      const result = fn(bars, i);
      if (result) results.push(result);
    }
  }

  // Filter out low-reliability signals and sort descending
  return results
    .filter((p) => p.reliability > 50)
    .sort((a, b) => b.reliability - a.reliability);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimum number of prior bars to confirm a trend */
const TREND_LOOKBACK = 5;

/**
 * Determine the short-term trend direction over the last `lookback` bars
 * ending at index `endIndex`. Uses a simple linear-regression-of-closes approach.
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

/** Is the bar at index i in a downtrend (closes declining)? */
function inDowntrend(bars: OHLCVBar[], i: number): boolean {
  return shortTermTrend(bars, i, TREND_LOOKBACK) === "DOWN";
}

/** Is the bar at index i in an uptrend (closes rising)? */
function inUptrend(bars: OHLCVBar[], i: number): boolean {
  return shortTermTrend(bars, i, TREND_LOOKBACK) === "UP";
}

/** Average body of the last N bars ending at index i */
function contextAvgBody(bars: OHLCVBar[], i: number, lookback = 10): number {
  return avgBodySize(bars, lookback, i);
}

// ─── 1. Bullish Engulfing ───────────────────────────────────────────────────

function detectBullishEngulfing(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous must be bearish, current must be bullish
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Current body must engulf previous body: curr open ≤ prev close AND curr close ≥ prev open
  if (!(curr.open <= prev.close && curr.close >= prev.open)) return null;

  // Context: should appear at bottom of a downtrend
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Current body significantly larger than previous
  const bRatio = bodySize(curr) / (bodySize(prev) || 0.0001);
  if (bRatio > 2) baseReliability += 10;
  if (bRatio > 3) baseReliability += 5;

  // Upper wick should be small (strong close)
  if (upperWick(curr) < bodySize(curr) * 0.15) baseReliability += 5;

  return {
    name: "Bullish Engulfing",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Strong bullish candle completely engulfs the prior bearish candle, signaling a potential reversal from downtrend to uptrend.",
  };
}

// ─── 2. Hammer ──────────────────────────────────────────────────────────────

function detectHammer(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  // Body must be in the upper third of the range
  const bodyTop = Math.max(bar.open, bar.close);
  const upperPortion = bar.high - bodyTop;
  if (upperPortion > r * 0.1) return null; // tiny or no upper wick allowed

  // Lower wick must be at least 2× the body
  const lwick = lowerWick(bar);
  if (lwick < body * 2) return null;

  // Lower wick must be ≥ 60% of total range
  if (lwick / r < 0.6) return null;

  // Must appear at bottom of downtrend
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 20;

  // Longer lower wick = more reliable
  const wickBodyRatio = lwick / (body || 0.0001);
  if (wickBodyRatio > 3) baseReliability += 10;
  if (wickBodyRatio > 5) baseReliability += 5;

  // Small or nonexistent upper wick bonus
  if (upperWick(bar) < body * 0.1) baseReliability += 5;

  return {
    name: "Hammer",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Small body at the top with a long lower wick (≥2× body) after a downtrend, indicating buyers stepped in aggressively at lower prices.",
  };
}

// ─── 3. Morning Star ────────────────────────────────────────────────────────

function detectMorningStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bearish candle
  const second = bars[i - 1]; // small body / indecision
  const third = bars[i]; // bullish candle

  // First candle: bearish with significant body
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second candle: small body (star), gaps down from first
  if (bodySize(second) > bodySize(first) * 0.5) return null;
  // Star should gap down — or at least not close above first midpoint
  const firstMidpoint = (first.open + first.close) / 2;
  if (Math.max(second.open, second.close) > firstMidpoint) return null;

  // Third candle: bullish, closes into the body of the first candle
  if (!isBullish(third)) return null;
  if (third.close < firstMidpoint) return null; // must close above midpoint of first

  let baseReliability = 70;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Third candle body should be substantial
  if (bodySize(third) > avgBody) baseReliability += 8;

  // Second candle is a doji (even more reliable)
  if (isDoji(second)) baseReliability += 7;

  return {
    name: "Morning Star",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three-candle bullish reversal: a bearish candle, followed by a small-body star, then a strong bullish candle closing above the midpoint of the first candle.",
  };
}

// ─── 4. Bullish Harami ──────────────────────────────────────────────────────

function detectBullishHarami(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous large bearish, current small bullish inside
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Current body must be completely inside previous body
  if (!(curr.open >= prev.close && curr.close <= prev.open)) return null;

  // Current body should be less than 50% of previous body
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;

  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Smaller inner candle = more reliable
  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 10;
  if (bodySize(curr) < bodySize(prev) * 0.15) baseReliability += 5;

  return {
    name: "Bullish Harami",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "A large bearish candle followed by a small bullish candle contained within its body, suggesting waning selling pressure and potential reversal.",
  };
}

// ─── 5. Piercing Line ───────────────────────────────────────────────────────

function detectPiercingLine(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous bearish, current bullish
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Current opens below previous low
  if (curr.open >= prev.low) return null;

  // Current closes above midpoint of previous body
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close <= prevMidpoint) return null;

  // But does not close above previous open (otherwise it's an engulfing)
  if (curr.close >= prev.open) return null;

  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Deeper penetration into previous body = stronger signal
  const penetration = (curr.close - prevMidpoint) / (bodySize(prev) / 2);
  if (penetration > 0.5) baseReliability += 10;
  if (penetration > 0.8) baseReliability += 5;

  return {
    name: "Piercing Line",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish reversal: bearish candle followed by a bullish candle that opens below the prior low but closes above the midpoint of the prior body.",
  };
}

// ─── 6. Three White Soldiers ─────────────────────────────────────────────────

function detectThreeWhiteSoldiers(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];

  // All three must be bullish
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;

  // Each successive candle opens within the body of the previous
  if (b.open < a.close - bodySize(a) * 0.1 || b.open > a.close) return null;
  if (c.open < b.close - bodySize(b) * 0.1 || c.open > b.close) return null;

  // Each closes progressively higher
  if (b.close <= a.close || c.close <= b.close) return null;

  // Bodies should be reasonably large
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.6) return null;
  if (bodySize(b) < avgBody * 0.6) return null;
  if (bodySize(c) < avgBody * 0.6) return null;

  // Small or no upper wicks (strong closes)
  let baseReliability = 70;
  if (upperWick(a) < bodySize(a) * 0.2) baseReliability += 3;
  if (upperWick(b) < bodySize(b) * 0.2) baseReliability += 3;
  if (upperWick(c) < bodySize(c) * 0.2) baseReliability += 3;

  if (inDowntrend(bars, i - 2)) baseReliability += 10;

  return {
    name: "Three White Soldiers",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three consecutive bullish candles, each opening within the prior body and closing progressively higher, signaling strong buying momentum.",
  };
}

// ─── 7. Bullish Doji Star ───────────────────────────────────────────────────

function detectBullishDojiStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous bearish, current is doji
  if (!isBearish(prev)) return null;
  if (!isDoji(curr)) return null;

  // Doji should gap down from previous close
  if (Math.max(curr.open, curr.close) > prev.close) return null;

  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 20;

  // The more extreme the doji (smaller body ratio), the better
  if (bodyRatio(curr) < 0.05) baseReliability += 10;

  return {
    name: "Bullish Doji Star",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "A bearish candle followed by a doji star gapping down, indicating indecision and exhaustion of selling pressure after a downtrend.",
  };
}

// ─── 8. Bearish Engulfing ───────────────────────────────────────────────────

function detectBearishEngulfing(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous bullish, current bearish
  if (!isBullish(prev) || !isBearish(curr)) return null;

  // Current body engulfs previous body
  if (!(curr.open >= prev.close && curr.close <= prev.open)) return null;

  let baseReliability = 65;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Body ratio
  const bRatio = bodySize(curr) / (bodySize(prev) || 0.0001);
  if (bRatio > 2) baseReliability += 10;
  if (bRatio > 3) baseReliability += 5;

  // Small lower wick (strong bearish close)
  if (lowerWick(curr) < bodySize(curr) * 0.15) baseReliability += 5;

  return {
    name: "Bearish Engulfing",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Strong bearish candle completely engulfs the prior bullish candle, signaling a potential reversal from uptrend to downtrend.",
  };
}

// ─── 9. Shooting Star ───────────────────────────────────────────────────────

function detectShootingStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  // Body in the lower portion of the range
  const bodyBottom = Math.min(bar.open, bar.close);
  const lowerPortion = bodyBottom - bar.low;
  if (lowerPortion > r * 0.1) return null; // very small lower wick

  // Upper wick must be at least 2× the body
  const uwick = upperWick(bar);
  if (uwick < body * 2) return null;

  // Upper wick must be ≥ 60% of total range
  if (uwick / r < 0.6) return null;

  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 20;

  const wickBodyRatio = uwick / (body || 0.0001);
  if (wickBodyRatio > 3) baseReliability += 10;
  if (wickBodyRatio > 5) baseReliability += 5;

  if (lowerWick(bar) < body * 0.1) baseReliability += 5;

  return {
    name: "Shooting Star",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Small body at the bottom with a long upper wick (≥2× body) after an uptrend, indicating sellers rejected higher prices aggressively.",
  };
}

// ─── 10. Evening Star ───────────────────────────────────────────────────────

function detectEveningStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bullish candle
  const second = bars[i - 1]; // small body / indecision
  const third = bars[i]; // bearish candle

  // First: bullish with significant body
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: small body (star), gaps up from first
  if (bodySize(second) > bodySize(first) * 0.5) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (Math.min(second.open, second.close) < firstMidpoint) return null;

  // Third: bearish, closes below midpoint of first
  if (!isBearish(third)) return null;
  if (third.close > firstMidpoint) return null;

  let baseReliability = 70;
  if (inUptrend(bars, i)) baseReliability += 15;

  if (bodySize(third) > avgBody) baseReliability += 8;
  if (isDoji(second)) baseReliability += 7;

  return {
    name: "Evening Star",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three-candle bearish reversal: a bullish candle, a small-body star, then a strong bearish candle closing below the midpoint of the first candle.",
  };
}

// ─── 11. Bearish Harami ─────────────────────────────────────────────────────

function detectBearishHarami(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous large bullish, current small bearish inside
  if (!isBullish(prev) || !isBearish(curr)) return null;

  // Current body inside previous body
  if (!(curr.open <= prev.close && curr.close >= prev.open)) return null;

  // Small inner body
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;

  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;

  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 10;
  if (bodySize(curr) < bodySize(prev) * 0.15) baseReliability += 5;

  return {
    name: "Bearish Harami",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "A large bullish candle followed by a small bearish candle contained within its body, suggesting waning buying pressure and potential reversal.",
  };
}

// ─── 12. Dark Cloud Cover ───────────────────────────────────────────────────

function detectDarkCloudCover(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous bullish, current bearish
  if (!isBullish(prev) || !isBearish(curr)) return null;

  // Current opens above previous high
  if (curr.open <= prev.high) return null;

  // Current closes below midpoint of previous body
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close >= prevMidpoint) return null;

  // But does not close below prev open (otherwise engulfing)
  if (curr.close <= prev.open) return null;

  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Deeper penetration below midpoint
  const penetration = (prevMidpoint - curr.close) / (bodySize(prev) / 2);
  if (penetration > 0.5) baseReliability += 10;
  if (penetration > 0.8) baseReliability += 5;

  return {
    name: "Dark Cloud Cover",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal: bullish candle followed by a bearish candle that opens above the prior high but closes below the midpoint of the prior body.",
  };
}

// ─── 13. Three Black Crows ──────────────────────────────────────────────────

function detectThreeBlackCrows(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2];
  const b = bars[i - 1];
  const c = bars[i];

  // All three bearish
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;

  // Each opens within previous body
  if (b.open > a.close + bodySize(a) * 0.1 || b.open < a.close) return null;
  if (c.open > b.close + bodySize(b) * 0.1 || c.open < b.close) return null;

  // Each closes progressively lower
  if (b.close >= a.close || c.close >= b.close) return null;

  // Substantial bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.6) return null;
  if (bodySize(b) < avgBody * 0.6) return null;
  if (bodySize(c) < avgBody * 0.6) return null;

  let baseReliability = 70;
  if (lowerWick(a) < bodySize(a) * 0.2) baseReliability += 3;
  if (lowerWick(b) < bodySize(b) * 0.2) baseReliability += 3;
  if (lowerWick(c) < bodySize(c) * 0.2) baseReliability += 3;

  if (inUptrend(bars, i - 2)) baseReliability += 10;

  return {
    name: "Three Black Crows",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three consecutive bearish candles, each opening within the prior body and closing progressively lower, signaling strong selling momentum.",
  };
}

// ─── 14. Bearish Doji Star ──────────────────────────────────────────────────

function detectBearishDojiStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  if (!isBullish(prev)) return null;
  if (!isDoji(curr)) return null;

  // Doji gaps up from previous close
  if (Math.min(curr.open, curr.close) < prev.close) return null;

  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 20;
  if (bodyRatio(curr) < 0.05) baseReliability += 10;

  return {
    name: "Bearish Doji Star",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "A bullish candle followed by a doji star gapping up, indicating indecision and exhaustion of buying pressure after an uptrend.",
  };
}

// ─── 15. Rising Three Methods ───────────────────────────────────────────────

function detectRisingThreeMethods(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 4) return null;
  const first = bars[i - 4]; // large bullish
  const two = bars[i - 3];
  const three = bars[i - 2];
  const four = bars[i - 1];
  const fifth = bars[i]; // large bullish continuation

  // First: large bullish
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.8) return null;

  // Middle three: small bearish (or at least not strongly bullish) staying within first's range
  const middleBars = [two, three, four];
  for (const mb of middleBars) {
    if (isBullish(mb) && bodySize(mb) > avgBody * 0.5) return null;
    // Must stay within the range of the first candle
    if (mb.low < first.low || mb.high > first.high) return null;
  }
  // At least two of the three should be bearish
  const bearishCount = middleBars.filter((b) => isBearish(b)).length;
  if (bearishCount < 2) return null;

  // Fifth: large bullish, closes above first's close
  if (!isBullish(fifth)) return null;
  if (fifth.close <= first.close) return null;
  if (bodySize(fifth) < avgBody * 0.6) return null;

  let baseReliability = 65;
  if (inUptrend(bars, i - 4)) baseReliability += 15;

  // Fifth candle should have small upper wick
  if (upperWick(fifth) < bodySize(fifth) * 0.2) baseReliability += 5;

  return {
    name: "Rising Three Methods",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish continuation: a large bullish candle, three small pullback candles staying within its range, then another bullish candle closing above the first.",
  };
}

// ─── 16. Falling Three Methods ──────────────────────────────────────────────

function detectFallingThreeMethods(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 4) return null;
  const first = bars[i - 4]; // large bearish
  const two = bars[i - 3];
  const three = bars[i - 2];
  const four = bars[i - 1];
  const fifth = bars[i]; // large bearish continuation

  // First: large bearish
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.8) return null;

  // Middle three: small bullish staying within first's range
  const middleBars = [two, three, four];
  for (const mb of middleBars) {
    if (isBearish(mb) && bodySize(mb) > avgBody * 0.5) return null;
    if (mb.low < first.low || mb.high > first.high) return null;
  }
  const bullishCount = middleBars.filter((b) => isBullish(b)).length;
  if (bullishCount < 2) return null;

  // Fifth: large bearish, closes below first's close
  if (!isBearish(fifth)) return null;
  if (fifth.close >= first.close) return null;
  if (bodySize(fifth) < avgBody * 0.6) return null;

  let baseReliability = 65;
  if (inDowntrend(bars, i - 4)) baseReliability += 15;

  if (lowerWick(fifth) < bodySize(fifth) * 0.2) baseReliability += 5;

  return {
    name: "Falling Three Methods",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish continuation: a large bearish candle, three small bounce candles staying within its range, then another bearish candle closing below the first.",
  };
}

// ─── 17. Spinning Top ───────────────────────────────────────────────────────

function detectSpinningTop(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  // Body must be small (≤ 25% of range)
  if (body / r > 0.25) return null;

  // Both wicks should be present and roughly equal
  const uwick = upperWick(bar);
  const lwick = lowerWick(bar);

  // Both wicks should be at least as large as the body
  if (uwick < body) return null;
  if (lwick < body) return null;

  // Wicks should be roughly equal (ratio between 0.4 and 2.5)
  const wickRatio = uwick / (lwick || 0.0001);
  if (wickRatio < 0.4 || wickRatio > 2.5) return null;

  let baseReliability = 50;

  // More equal wicks = more reliable indecision signal
  if (wickRatio > 0.6 && wickRatio < 1.7) baseReliability += 10;

  // Smaller body = more indecision
  if (body / r < 0.15) baseReliability += 10;

  return {
    name: "Spinning Top",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description:
      "Small body with roughly equal upper and lower wicks, indicating market indecision and a potential turning point.",
  };
}

// ─── 18. Marubozu Bullish ───────────────────────────────────────────────────

function detectMarubozuBullish(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBullish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  // No or negligible wicks: body ≥ 95% of range
  if (body / r < 0.95) return null;

  // Body must be significant compared to average
  const avgBody = contextAvgBody(bars, i);
  if (body < avgBody * 0.8) return null;

  let baseReliability = 65;

  // Pure marubozu (0 wicks)
  if (upperWick(bar) === 0 && lowerWick(bar) === 0) baseReliability += 20;
  // Near-perfect
  else if (body / r > 0.98) baseReliability += 15;

  // Large body relative to average
  if (body > avgBody * 1.5) baseReliability += 10;

  return {
    name: "Marubozu Bullish",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish candle with no (or negligible) wicks, opening at the low and closing at the high — pure buying momentum with no seller pushback.",
  };
}

// ─── 19. Marubozu Bearish ───────────────────────────────────────────────────

function detectMarubozuBearish(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBearish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  if (body / r < 0.95) return null;

  const avgBody = contextAvgBody(bars, i);
  if (body < avgBody * 0.8) return null;

  let baseReliability = 65;

  if (upperWick(bar) === 0 && lowerWick(bar) === 0) baseReliability += 20;
  else if (body / r > 0.98) baseReliability += 15;

  if (body > avgBody * 1.5) baseReliability += 10;

  return {
    name: "Marubozu Bearish",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish candle with no (or negligible) wicks, opening at the high and closing at the low — pure selling momentum with no buyer pushback.",
  };
}

// ─── 20. Tweezer Top / Bottom ───────────────────────────────────────────────

function detectTweezerTopBottom(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  const tolerance = range(prev) * 0.05 || 0.0001; // 5% tolerance for "same" level

  // Check Tweezer Top: prev bullish, curr bearish, same highs
  if (isBullish(prev) && isBearish(curr)) {
    if (Math.abs(prev.high - curr.high) <= tolerance) {
      let baseReliability = 55;
      if (inUptrend(bars, i)) baseReliability += 20;
      // Exact match = higher reliability
      if (Math.abs(prev.high - curr.high) < tolerance * 0.2) baseReliability += 10;
      return {
        name: "Tweezer Top",
        index: i,
        type: "BEARISH",
        reliability: Math.min(baseReliability, 100),
        description:
          "Two candles with matching highs — a bullish candle followed by a bearish candle rejecting the same resistance level, signaling a potential top.",
      };
    }
  }

  // Check Tweezer Bottom: prev bearish, curr bullish, same lows
  if (isBearish(prev) && isBullish(curr)) {
    if (Math.abs(prev.low - curr.low) <= tolerance) {
      let baseReliability = 55;
      if (inDowntrend(bars, i)) baseReliability += 20;
      if (Math.abs(prev.low - curr.low) < tolerance * 0.2) baseReliability += 10;
      return {
        name: "Tweezer Bottom",
        index: i,
        type: "BULLISH",
        reliability: Math.min(baseReliability, 100),
        description:
          "Two candles with matching lows — a bearish candle followed by a bullish candle holding the same support level, signaling a potential bottom.",
      };
    }
  }

  return null;
}
