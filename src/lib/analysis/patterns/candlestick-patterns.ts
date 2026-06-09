/**
 * Vixor Local Trading Analysis Engine — Candlestick Pattern Detection
 *
 * Detects 74 candlestick patterns using mathematical conditions on
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
      // ─── Existing 20 patterns ────────────────────────
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

      // ─── Bullish Reversal (21–38) ────────────────────
      detectInvertedHammer,
      detectDragonflyDoji,
      detectBullishAbandonedBaby,
      detectThreeInsideUp,
      detectThreeOutsideUp,
      detectBullishKicker,
      detectBullishBeltHold,
      detectBullishCounterattack,
      detectLadderBottom,
      detectBullishSeparatingLines,
      detectMatchingLow,
      detectBullishThrusting,
      detectBullishHomingPigeon,
      detectBullishBreakaway,
      detectThreeStarsInTheSouth,
      detectConcealingBabySwallow,
      detectStickSandwich,
      detectMorningDojiStar,

      // ─── Bearish Reversal (39–56) ────────────────────
      detectHangingMan,
      detectGravestoneDoji,
      detectBearishAbandonedBaby,
      detectThreeInsideDown,
      detectThreeOutsideDown,
      detectBearishKicker,
      detectBearishBeltHold,
      detectBearishCounterattack,
      detectAdvanceBlock,
      detectDeliberation,
      detectBearishBreakaway,
      detectTwoCrows,
      detectUpsideGapTwoCrows,
      detectThreeLineStrikeBearish,
      detectBearishThrusting,
      detectMatchingHigh,
      detectBearishHomingPigeon,
      detectOnNeck,

      // ─── Continuation (57–68) ────────────────────────
      detectThreeLineStrikeBullish,
      detectBullishMatHold,
      detectUpsideTasukiGap,
      detectSideBySideWhite,
      detectBullishClosingMarubozu,
      detectBearishClosingMarubozu,
      detectBearishOpeningMarubozu,
      detectBullishOpeningMarubozu,
      detectDownsideTasukiGap,
      detectInNeck,
      detectWindowUp,
      detectWindowDown,

      // ─── Neutral / Doji (69–74) ──────────────────────
      detectLongLeggedDoji,
      detectFourPriceDoji,
      detectRickshawMan,
      detectDojiStar,
      detectTriStarDojiBullish,
      detectTriStarDojiBearish,
    ];

    for (const fn of detectors) {
      const result = fn(bars, i);
      if (result) results.push(result);
    }
  }

  // Filter out low-reliability signals and sort descending
  return results.filter((p) => p.reliability > 50).sort((a, b) => b.reliability - a.reliability);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimum number of prior bars to confirm a trend */
const TREND_LOOKBACK = 5;

/**
 * Determine the short-term trend direction over the last `lookback` bars
 * ending at index `endIndex`. Uses a simple linear-regression-of-closes approach.
 */
function shortTermTrend(bars: OHLCVBar[], endIndex: number, lookback = 10): "UP" | "DOWN" | "FLAT" {
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

// ═══════════════════════════════════════════════════════════════════════════════
// BULLISH REVERSAL PATTERNS (21–38)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 21. Inverted Hammer ────────────────────────────────────────────────────

function detectInvertedHammer(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  // Body must be in the lower third of the range
  const bodyBottom = Math.min(bar.open, bar.close);
  const lowerPortion = bodyBottom - bar.low;
  if (lowerPortion > r * 0.1) return null; // very small or no lower wick

  // Upper wick must be at least 2× the body
  const uwick = upperWick(bar);
  if (uwick < body * 2) return null;

  // Upper wick must be ≥ 60% of total range
  if (uwick / r < 0.6) return null;

  // Must appear at bottom of downtrend (this distinguishes from Shooting Star)
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 20;

  // Longer upper wick relative to body = more reliable
  const wickBodyRatio = uwick / (body || 0.0001);
  if (wickBodyRatio > 3) baseReliability += 10;
  if (wickBodyRatio > 5) baseReliability += 5;

  // Small or no lower wick bonus
  if (lowerWick(bar) < body * 0.1) baseReliability += 5;

  return {
    name: "Inverted Hammer",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Small body at the bottom with a long upper wick (≥2× body) after a downtrend, suggesting buyers attempted to push higher — potential bullish reversal signal.",
  };
}

// ─── 22. Dragonfly Doji ─────────────────────────────────────────────────────

function detectDragonflyDoji(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const r = range(bar);

  if (r === 0) return null;

  // Must be a doji (very small body)
  if (!isDoji(bar)) return null;

  // No or negligible upper wick
  const uwick = upperWick(bar);
  if (uwick > r * 0.05) return null;

  // Long lower wick — must be ≥ 80% of the range
  const lwick = lowerWick(bar);
  if (lwick / r < 0.8) return null;

  // Must appear at the bottom of a downtrend for bullish signal
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 25;

  // Perfect dragonfly: no upper wick at all
  if (uwick === 0) baseReliability += 5;

  return {
    name: "Dragonfly Doji",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Doji with no upper wick and a long lower wick after a downtrend, indicating sellers pushed down but buyers absorbed all supply — strong bullish reversal signal.",
  };
}

// ─── 23. Bullish Abandoned Baby ─────────────────────────────────────────────

function detectBullishAbandonedBaby(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bearish candle
  const second = bars[i - 1]; // doji gap down
  const third = bars[i]; // bullish candle gap up

  // First: bearish with significant body
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: must be a doji
  if (!isDoji(second)) return null;

  // Doji must gap down from first candle (doji high below first low)
  if (second.high >= first.low) return null;

  // Third: bullish candle that gaps up from the doji (third low above second high)
  if (!isBullish(third)) return null;
  if (third.low <= second.high) return null;

  // Third should close well into the body of the first candle
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close < firstMidpoint) return null;

  let baseReliability = 80;
  if (inDowntrend(bars, i)) baseReliability += 10;

  // Larger third candle body = stronger signal
  if (bodySize(third) > avgBody) baseReliability += 5;

  return {
    name: "Bullish Abandoned Baby",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Rare bullish reversal: a bearish candle, a gapping-down doji, then a gapping-up bullish candle — complete abandonment of selling pressure.",
  };
}

// ─── 24. Three Inside Up ────────────────────────────────────────────────────

function detectThreeInsideUp(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // large bearish
  const second = bars[i - 1]; // small bullish inside
  const third = bars[i]; // bullish confirmation

  // First: large bearish
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: small bullish inside first's body (harami pattern)
  if (!isBullish(second)) return null;
  if (!(second.open >= first.close && second.close <= first.open)) return null;
  if (bodySize(second) > bodySize(first) * 0.5) return null;

  // Third: bullish candle closing above second's close (and ideally above first's midpoint)
  if (!isBullish(third)) return null;
  if (third.close <= second.close) return null;

  let baseReliability = 70;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Third closes above first's midpoint = stronger confirmation
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close > firstMidpoint) baseReliability += 5;

  // Third body substantial
  if (bodySize(third) > avgBody) baseReliability += 5;

  return {
    name: "Three Inside Up",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish reversal confirmation: a bearish candle, a small bullish candle inside it (harami), then a third bullish candle closing above the second — confirming the reversal.",
  };
}

// ─── 25. Three Outside Up ───────────────────────────────────────────────────

function detectThreeOutsideUp(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bearish
  const second = bars[i - 1]; // bullish engulfing
  const third = bars[i]; // bullish confirmation

  // First: bearish
  if (!isBearish(first)) return null;

  // Second: bullish engulfing of first
  if (!isBullish(second)) return null;
  if (!(second.open <= first.close && second.close >= first.open)) return null;

  // Third: bullish, closes above second's close
  if (!isBullish(third)) return null;
  if (third.close <= second.close) return null;

  let baseReliability = 72;
  if (inDowntrend(bars, i)) baseReliability += 12;

  // Third candle body substantial
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(third) > avgBody) baseReliability += 5;

  return {
    name: "Three Outside Up",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish reversal confirmation: a bearish candle, a bullish engulfing candle, then a third bullish candle closing above the engulfing candle — strong reversal signal.",
  };
}

// ─── 26. Bullish Kicker ─────────────────────────────────────────────────────

function detectBullishKicker(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous must be bearish, current must be bullish
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Current must gap up from previous — no overlap at all
  // Current low must be above previous high
  if (curr.low <= prev.high) return null;

  // Both candles should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;

  let baseReliability = 80;
  if (inDowntrend(bars, i)) baseReliability += 10;

  // Larger gap = stronger signal
  const gapSize = curr.low - prev.high;
  const avgRange = avgBody * 2;
  if (gapSize > avgRange * 0.3) baseReliability += 5;

  return {
    name: "Bullish Kicker",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Dramatic bullish reversal: a bearish candle followed by a bullish candle gapping up with no overlap — a sudden shift in sentiment from sellers to buyers.",
  };
}

// ─── 27. Bullish Belt Hold ──────────────────────────────────────────────────

function detectBullishBeltHold(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBullish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);

  if (r === 0) return null;

  // Opens at the low (no lower wick or very small)
  if (lowerWick(bar) > r * 0.05) return null;

  // Body should be significant
  if (body < avgBody * 0.6) return null;

  // Body should be a large portion of range (belt hold = opening marubozu)
  if (body / r < 0.7) return null;

  // Must appear after a downtrend
  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 20;

  // Larger body = more reliable
  if (body > avgBody * 1.2) baseReliability += 10;
  if (body > avgBody * 1.5) baseReliability += 5;

  return {
    name: "Bullish Belt Hold",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish opening marubozu after a downtrend — opens at the low and closes near the high, indicating buyers controlled the entire session from the start.",
  };
}

// ─── 28. Bullish Counterattack ──────────────────────────────────────────────

function detectBullishCounterattack(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bearish, current: bullish
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Both candles should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;

  // Current closes at approximately the same level as previous closes
  // Tolerance: within 10% of average body
  const tolerance = avgBody * 0.1;
  if (Math.abs(curr.close - prev.close) > tolerance) return null;

  // Must appear after a downtrend
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 18;

  // Exact close match = higher reliability
  if (Math.abs(curr.close - prev.close) < tolerance * 0.3) baseReliability += 8;

  return {
    name: "Bullish Counterattack",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish reversal: a bearish candle followed by a bullish candle closing at the same level — buyers counterattack, neutralizing the prior selling.",
  };
}

// ─── 29. Ladder Bottom ──────────────────────────────────────────────────────

function detectLadderBottom(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 4) return null;
  const a = bars[i - 4]; // bearish
  const b = bars[i - 3]; // bearish, opens lower, closes lower
  const c = bars[i - 2]; // bearish, opens lower
  const d = bars[i - 1]; // bearish with upper wick
  const e = bars[i]; // bullish

  // First three should be bearish, each opening lower
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;

  // Opens should be declining (ladder pattern)
  if (b.open >= a.open || c.open >= b.open) return null;

  // Fourth candle: bearish with a long upper wick (hammer-like)
  if (!isBearish(d)) return null;
  if (upperWick(d) < bodySize(d)) return null;

  // Fifth candle: bullish, opening above prior close
  if (!isBullish(e)) return null;

  // Must appear in a downtrend
  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Fifth candle closes above d's open
  if (e.close > d.open) baseReliability += 5;

  return {
    name: "Ladder Bottom",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Five-candle bullish reversal: three declining bearish candles, a fourth bearish candle with an upper wick, then a bullish candle — like a ladder reaching the bottom.",
  };
}

// ─── 30. Bullish Separating Lines ───────────────────────────────────────────

function detectBullishSeparatingLines(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bearish, current: bullish
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Both candles open at the same price
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(curr.open - prev.open) > tolerance) return null;

  // Both should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;

  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Exact same open = higher reliability
  if (Math.abs(curr.open - prev.open) < tolerance * 0.2) baseReliability += 8;

  return {
    name: "Bullish Separating Lines",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish reversal: a bearish candle followed by a bullish candle opening at the same price — same starting point but opposite direction shows a shift in control.",
  };
}

// ─── 31. Matching Low ───────────────────────────────────────────────────────

function detectMatchingLow(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Both candles must be bearish
  if (!isBearish(prev) || !isBearish(curr)) return null;

  // Both should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;

  // Both close at approximately the same low
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(prev.close - curr.close) > tolerance) return null;

  // Must appear in a downtrend
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 20;

  // Exact match = higher reliability
  if (Math.abs(prev.close - curr.close) < tolerance * 0.2) baseReliability += 10;

  return {
    name: "Matching Low",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Two bearish candles closing at the same level after a downtrend — sellers unable to push lower, suggesting selling exhaustion and potential reversal.",
  };
}

// ─── 32. Bullish Thrusting ──────────────────────────────────────────────────

function detectBullishThrusting(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bearish, current: bullish
  if (!isBearish(prev) || !isBullish(curr)) return null;

  // Both should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;

  // Current opens below previous close
  if (curr.open >= prev.close) return null;

  // Current closes above previous close but below midpoint of previous body
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close <= prev.close) return null;
  if (curr.close >= prevMidpoint) return null;

  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Closer to midpoint = stronger thrust
  const penetration = (curr.close - prev.close) / (prevMidpoint - prev.close);
  if (penetration > 0.7) baseReliability += 5;

  return {
    name: "Bullish Thrusting",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish pattern: after a bearish candle, a bullish candle opens below and closes above the prior close but below its midpoint — a thrust upward that may signal reversal.",
  };
}

// ─── 33. Bullish Homing Pigeon ──────────────────────────────────────────────

function detectBullishHomingPigeon(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Both must be bearish (unlike harami where inner is bullish)
  if (!isBearish(prev) || !isBearish(curr)) return null;

  // Current body must be completely inside previous body
  if (!(curr.open <= prev.open && curr.close >= prev.close)) return null;

  // Current body must be smaller (less than 50%)
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;

  // Previous should have a significant body
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;

  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 18;

  // Smaller inner candle = more reliable
  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 10;

  return {
    name: "Bullish Homing Pigeon",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Like a bearish harami but both candles are bearish: a large bearish candle followed by a smaller bearish candle inside its body — selling momentum is weakening.",
  };
}

// ─── 34. Bullish Breakaway ──────────────────────────────────────────────────

function detectBullishBreakaway(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 4) return null;
  const a = bars[i - 4]; // long bearish
  const b = bars[i - 3]; // bearish
  const c = bars[i - 2]; // bearish
  const d = bars[i - 1]; // bearish (or small body)
  const e = bars[i]; // long bullish

  // First: long bearish
  if (!isBearish(a)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.7) return null;

  // Middle three: continuation bearish or small bodies, each closing lower
  if (!isBearish(b) && bodySize(b) > avgBody * 0.3) return null;
  if (!isBearish(c) && bodySize(c) > avgBody * 0.3) return null;
  if (!isBearish(d) && bodySize(d) > avgBody * 0.3) return null;

  // Progressively lower closes
  if (b.close >= a.close || c.close >= b.close || d.close >= c.close) return null;

  // Fifth: long bullish closing above b's close
  if (!isBullish(e)) return null;
  if (bodySize(e) < avgBody * 0.6) return null;
  if (e.close <= b.close) return null;

  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Fifth closes above a's midpoint = stronger
  const aMid = (a.open + a.close) / 2;
  if (e.close > aMid) baseReliability += 5;

  return {
    name: "Bullish Breakaway",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Five-candle bullish reversal: a long bearish candle, three declining candles, then a long bullish candle breaking the decline — sellers exhausted, buyers take over.",
  };
}

// ─── 35. Three Stars in the South ───────────────────────────────────────────

function detectThreeStarsInTheSouth(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // long bearish with long lower wick
  const b = bars[i - 1]; // shorter bearish with shorter lower wick, opens within a's body
  const c = bars[i]; // small bearish, no lower wick (or very short)

  // All three bearish
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;

  // First: long bearish with long lower wick
  if (lowerWick(a) < bodySize(a) * 0.5) return null;

  // Second: opens within first's body, smaller range and body
  if (b.open > a.open || b.open < a.close) return null;
  if (range(b) >= range(a)) return null;
  if (lowerWick(b) >= lowerWick(a)) return null;

  // Third: very small body, opens within second's body, no (or tiny) lower wick
  if (c.open > b.open || c.open < b.close) return null;
  if (bodySize(c) > bodySize(b) * 0.7) return null;
  if (lowerWick(c) > bodySize(c) * 0.2) return null;

  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 18;

  // Third closes at its low = perfect star
  if (c.close === c.low) baseReliability += 5;

  return {
    name: "Three Stars in the South",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three bearish candles with progressively decreasing ranges and lower wicks — selling pressure is diminishing step by step, signaling a potential bottom.",
  };
}

// ─── 36. Concealing Baby Swallow ────────────────────────────────────────────

function detectConcealingBabySwallow(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 3) return null;
  const a = bars[i - 3]; // bearish, opening marubozu
  const b = bars[i - 2]; // bearish, opening marubozu
  const c = bars[i - 1]; // bearish with upper wick (or harami inside)
  const d = bars[i]; // bearish, engulfs c including its upper wick

  // All four must be bearish
  if (!isBearish(a) || !isBearish(b) || !isBearish(c) || !isBearish(d)) return null;

  // First two: opening marubozu (no upper wick, opens at high)
  const avgBody = contextAvgBody(bars, i);
  if (upperWick(a) > bodySize(a) * 0.05) return null;
  if (upperWick(b) > bodySize(b) * 0.05) return null;
  if (bodySize(a) < avgBody * 0.5) return null;
  if (bodySize(b) < avgBody * 0.5) return null;

  // Third: bearish but has an upper wick (shadows appear)
  if (upperWick(c) < bodySize(c) * 0.1) return null;

  // Fourth: bearish, opens above c's open and engulfs c's body and upper wick
  if (d.open < c.open) return null;
  if (d.high < c.high) return null;

  let baseReliability = 68;
  if (inDowntrend(bars, i)) baseReliability += 15;

  return {
    name: "Concealing Baby Swallow",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Four bearish candles: two opening marubozu, a third with an upper wick, and a fourth engulfing it — sellers are so extreme they exhaust themselves, signaling reversal.",
  };
}

// ─── 37. Stick Sandwich ─────────────────────────────────────────────────────

function detectStickSandwich(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // bearish
  const b = bars[i - 1]; // bullish
  const c = bars[i]; // bearish

  // Pattern: bearish, bullish, bearish
  if (!isBearish(a) || !isBullish(b) || !isBearish(c)) return null;

  // Both bearish candles close at approximately the same level
  const tolerance = Math.max(bodySize(a), bodySize(c)) * 0.05;
  if (Math.abs(a.close - c.close) > tolerance) return null;

  // Bodies should be significant
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;
  if (bodySize(b) < avgBody * 0.3) return null;
  if (bodySize(c) < avgBody * 0.4) return null;

  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 18;

  // Exact close match = higher reliability
  if (Math.abs(a.close - c.close) < tolerance * 0.2) baseReliability += 8;

  return {
    name: "Stick Sandwich",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Two bearish candles sandwiching a bullish one, all closing at the same level — a support level is being established, suggesting a potential bullish reversal.",
  };
}

// ─── 38. Morning Doji Star ──────────────────────────────────────────────────

function detectMorningDojiStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bearish candle
  const second = bars[i - 1]; // doji (must be doji, not just small body)
  const third = bars[i]; // bullish candle

  // First candle: bearish with significant body
  if (!isBearish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second candle: MUST be a doji (stricter than morning star)
  if (!isDoji(second)) return null;

  // Doji should gap down from first close
  if (Math.max(second.open, second.close) > first.close) return null;

  // Third candle: bullish, closes above midpoint of first
  if (!isBullish(third)) return null;
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close < firstMidpoint) return null;

  let baseReliability = 75;
  if (inDowntrend(bars, i)) baseReliability += 15;

  // Third candle body should be substantial
  if (bodySize(third) > avgBody) baseReliability += 5;

  // Doji gaps down from first body
  if (second.high < first.close) baseReliability += 5;

  return {
    name: "Morning Doji Star",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three-candle bullish reversal: a bearish candle, a gapping-down doji, then a strong bullish candle — the doji confirms indecision and enhances reversal probability.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BEARISH REVERSAL PATTERNS (39–56)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 39. Hanging Man ────────────────────────────────────────────────────────

function detectHangingMan(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const body = bodySize(bar);
  const r = range(bar);

  if (r === 0) return null;

  // Body in the upper portion (same shape as hammer but at top of uptrend)
  const bodyTop = Math.max(bar.open, bar.close);
  const upperPortion = bar.high - bodyTop;
  if (upperPortion > r * 0.1) return null;

  // Lower wick must be at least 2× the body
  const lwick = lowerWick(bar);
  if (lwick < body * 2) return null;

  // Lower wick must be ≥ 60% of total range
  if (lwick / r < 0.6) return null;

  // Must appear at the top of an uptrend (this distinguishes from Hammer)
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 22;

  const wickBodyRatio = lwick / (body || 0.0001);
  if (wickBodyRatio > 3) baseReliability += 8;
  if (wickBodyRatio > 5) baseReliability += 4;

  return {
    name: "Hanging Man",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Hammer-shaped candle at the top of an uptrend — small body with long lower wick, indicating sellers pushed prices down significantly before close, a warning of reversal.",
  };
}

// ─── 40. Gravestone Doji ────────────────────────────────────────────────────

function detectGravestoneDoji(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const r = range(bar);

  if (r === 0) return null;

  // Must be a doji
  if (!isDoji(bar)) return null;

  // No or negligible lower wick
  const lwick = lowerWick(bar);
  if (lwick > r * 0.05) return null;

  // Long upper wick — must be ≥ 80% of the range
  const uwick = upperWick(bar);
  if (uwick / r < 0.8) return null;

  // Must appear at the top of an uptrend
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 23;

  // Perfect gravestone: no lower wick at all
  if (lwick === 0) baseReliability += 5;

  return {
    name: "Gravestone Doji",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Doji with no lower wick and a long upper wick at the top of an uptrend — buyers pushed higher but were completely rejected, signaling bearish reversal.",
  };
}

// ─── 41. Bearish Abandoned Baby ─────────────────────────────────────────────

function detectBearishAbandonedBaby(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bullish candle
  const second = bars[i - 1]; // doji gap up
  const third = bars[i]; // bearish candle gap down

  // First: bullish with significant body
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: must be a doji
  if (!isDoji(second)) return null;

  // Doji must gap up from first candle (doji low above first high)
  if (second.low <= first.high) return null;

  // Third: bearish candle that gaps down from the doji (third high below second low)
  if (!isBearish(third)) return null;
  if (third.high >= second.low) return null;

  // Third should close well below midpoint of first
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close > firstMidpoint) return null;

  let baseReliability = 80;
  if (inUptrend(bars, i)) baseReliability += 10;

  // Larger third candle body = stronger signal
  if (bodySize(third) > avgBody) baseReliability += 5;

  return {
    name: "Bearish Abandoned Baby",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Rare bearish reversal: a bullish candle, a gapping-up doji, then a gapping-down bearish candle — complete abandonment of buying pressure.",
  };
}

// ─── 42. Three Inside Down ──────────────────────────────────────────────────

function detectThreeInsideDown(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // large bullish
  const second = bars[i - 1]; // small bearish inside
  const third = bars[i]; // bearish confirmation

  // First: large bullish
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: small bearish inside first's body (bearish harami)
  if (!isBearish(second)) return null;
  if (!(second.open <= first.close && second.close >= first.open)) return null;
  if (bodySize(second) > bodySize(first) * 0.5) return null;

  // Third: bearish, closes below second's close
  if (!isBearish(third)) return null;
  if (third.close >= second.close) return null;

  let baseReliability = 70;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Third closes below first's midpoint = stronger
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close < firstMidpoint) baseReliability += 5;

  if (bodySize(third) > avgBody) baseReliability += 5;

  return {
    name: "Three Inside Down",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal confirmation: a bullish candle, a small bearish candle inside it (harami), then a third bearish candle closing below the second — confirming the reversal.",
  };
}

// ─── 43. Three Outside Down ─────────────────────────────────────────────────

function detectThreeOutsideDown(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bullish
  const second = bars[i - 1]; // bearish engulfing
  const third = bars[i]; // bearish confirmation

  // First: bullish
  if (!isBullish(first)) return null;

  // Second: bearish engulfing of first
  if (!isBearish(second)) return null;
  if (!(second.open >= first.close && second.close <= first.open)) return null;

  // Third: bearish, closes below second's close
  if (!isBearish(third)) return null;
  if (third.close >= second.close) return null;

  let baseReliability = 72;
  if (inUptrend(bars, i)) baseReliability += 12;

  const avgBody = contextAvgBody(bars, i);
  if (bodySize(third) > avgBody) baseReliability += 5;

  return {
    name: "Three Outside Down",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal confirmation: a bullish candle, a bearish engulfing candle, then a third bearish candle closing below the engulfing candle — strong reversal signal.",
  };
}

// ─── 44. Bearish Kicker ─────────────────────────────────────────────────────

function detectBearishKicker(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous must be bullish, current must be bearish
  if (!isBullish(prev) || !isBearish(curr)) return null;

  // Current must gap down from previous — no overlap at all
  // Current high must be below previous low
  if (curr.high >= prev.low) return null;

  // Both candles should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;

  let baseReliability = 80;
  if (inUptrend(bars, i)) baseReliability += 10;

  // Larger gap = stronger signal
  const gapSize = prev.low - curr.high;
  const avgRange = avgBody * 2;
  if (gapSize > avgRange * 0.3) baseReliability += 5;

  return {
    name: "Bearish Kicker",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Dramatic bearish reversal: a bullish candle followed by a bearish candle gapping down with no overlap — a sudden shift in sentiment from buyers to sellers.",
  };
}

// ─── 45. Bearish Belt Hold ──────────────────────────────────────────────────

function detectBearishBeltHold(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBearish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);

  if (r === 0) return null;

  // Opens at the high (no upper wick or very small)
  if (upperWick(bar) > r * 0.05) return null;

  // Body should be significant
  if (body < avgBody * 0.6) return null;

  // Body should be a large portion of range
  if (body / r < 0.7) return null;

  // Must appear after an uptrend
  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 20;

  if (body > avgBody * 1.2) baseReliability += 10;
  if (body > avgBody * 1.5) baseReliability += 5;

  return {
    name: "Bearish Belt Hold",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish opening marubozu after an uptrend — opens at the high and closes near the low, indicating sellers controlled the entire session from the start.",
  };
}

// ─── 46. Bearish Counterattack ──────────────────────────────────────────────

function detectBearishCounterattack(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bullish, current: bearish
  if (!isBullish(prev) || !isBearish(curr)) return null;

  // Both candles should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;
  if (bodySize(curr) < avgBody * 0.5) return null;

  // Current closes at approximately the same level as previous closes
  const tolerance = avgBody * 0.1;
  if (Math.abs(curr.close - prev.close) > tolerance) return null;

  // Must appear after an uptrend
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 18;

  if (Math.abs(curr.close - prev.close) < tolerance * 0.3) baseReliability += 8;

  return {
    name: "Bearish Counterattack",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal: a bullish candle followed by a bearish candle closing at the same level — sellers counterattack, neutralizing the prior buying.",
  };
}

// ─── 47. Advance Block ──────────────────────────────────────────────────────

function detectAdvanceBlock(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // bullish
  const b = bars[i - 1]; // bullish
  const c = bars[i]; // bullish (weakening)

  // All three must be bullish
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;

  // Each closes higher
  if (b.close <= a.close || c.close <= b.close) return null;

  // But momentum is weakening: each successive body is smaller
  // OR upper wicks are getting longer
  const avgBody = contextAvgBody(bars, i);

  // At least one sign of weakening: shrinking bodies or growing wicks
  const bodiesShrinking = bodySize(b) < bodySize(a) && bodySize(c) < bodySize(b);
  const wicksGrowing = upperWick(b) > upperWick(a) && upperWick(c) > upperWick(b);

  if (!bodiesShrinking && !wicksGrowing) return null;

  // First candle should have a significant body
  if (bodySize(a) < avgBody * 0.5) return null;

  // Third candle should show the most weakness
  const thirdWeak = bodySize(c) < bodySize(a) * 0.7 || upperWick(c) > bodySize(c);

  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 18;

  if (bodiesShrinking) baseReliability += 5;
  if (wicksGrowing) baseReliability += 5;
  if (thirdWeak) baseReliability += 5;

  return {
    name: "Advance Block",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three bullish candles with weakening momentum — shrinking bodies and/or growing upper wicks signal the uptrend is losing steam, warning of a potential reversal.",
  };
}

// ─── 48. Deliberation ───────────────────────────────────────────────────────

function detectDeliberation(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // bullish
  const b = bars[i - 1]; // bullish
  const c = bars[i]; // small body or doji

  // First two must be bullish with significant bodies
  if (!isBullish(a) || !isBullish(b)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.5) return null;
  if (bodySize(b) < avgBody * 0.5) return null;

  // Each closes higher
  if (b.close <= a.close) return null;

  // Third candle: small body or doji, gapping up from second
  if (bodySize(c) > avgBody * 0.4) return null;
  if (c.low <= b.high) return null; // must gap up

  // Third should close near its open (indecision at the top)
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 18;

  if (isDoji(c)) baseReliability += 8;

  return {
    name: "Deliberation",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Three bullish candles where the third is a small body or doji gapping up — buyers are deliberating at the top, suggesting the rally may be ending.",
  };
}

// ─── 49. Bearish Breakaway ──────────────────────────────────────────────────

function detectBearishBreakaway(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 4) return null;
  const a = bars[i - 4]; // long bullish
  const b = bars[i - 3]; // bullish
  const c = bars[i - 2]; // bullish
  const d = bars[i - 1]; // bullish (or small body)
  const e = bars[i]; // long bearish

  // First: long bullish
  if (!isBullish(a)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.7) return null;

  // Middle three: continuation bullish or small bodies, each closing higher
  if (!isBullish(b) && bodySize(b) > avgBody * 0.3) return null;
  if (!isBullish(c) && bodySize(c) > avgBody * 0.3) return null;
  if (!isBullish(d) && bodySize(d) > avgBody * 0.3) return null;

  // Progressively higher closes
  if (b.close <= a.close || c.close <= b.close || d.close <= c.close) return null;

  // Fifth: long bearish closing below b's close
  if (!isBearish(e)) return null;
  if (bodySize(e) < avgBody * 0.6) return null;
  if (e.close >= b.close) return null;

  let baseReliability = 65;
  if (inUptrend(bars, i)) baseReliability += 15;

  const aMid = (a.open + a.close) / 2;
  if (e.close < aMid) baseReliability += 5;

  return {
    name: "Bearish Breakaway",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Five-candle bearish reversal: a long bullish candle, three rising candles, then a long bearish candle breaking the advance — buyers exhausted, sellers take over.",
  };
}

// ─── 50. Two Crows ──────────────────────────────────────────────────────────

function detectTwoCrows(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bullish
  const second = bars[i - 1]; // bearish, gaps up
  const third = bars[i]; // bearish, closes below first's close

  // First: bullish with significant body
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: bearish, gaps up from first (opens above first's high)
  if (!isBearish(second)) return null;
  if (second.open <= first.high) return null;

  // Third: bearish, opens above second's open, closes below first's close
  if (!isBearish(third)) return null;
  if (third.open < second.open) return null;
  if (third.close >= first.close) return null;

  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 18;

  // Third closes deeper below first's close = stronger
  if (third.close < (first.open + first.close) / 2) baseReliability += 5;

  return {
    name: "Two Crows",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal: a bullish candle, a gapping-up bearish candle, then another bearish closing below the first candle — the gap up was a trap, sellers are in control.",
  };
}

// ─── 51. Upside Gap Two Crows ───────────────────────────────────────────────

function detectUpsideGapTwoCrows(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const first = bars[i - 2]; // bullish
  const second = bars[i - 1]; // bearish, gaps up
  const third = bars[i]; // bearish, engulfs second

  // First: bullish with significant body
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.5) return null;

  // Second: bearish, gaps up from first (opens above first's high)
  if (!isBearish(second)) return null;
  if (second.open <= first.high) return null;

  // Third: bearish, opens above second's open, closes below second's close
  // (engulfs the second bearish candle)
  if (!isBearish(third)) return null;
  if (third.open <= second.open) return null;
  if (third.close >= second.close) return null;

  // Third should close into or below the gap area
  let baseReliability = 62;
  if (inUptrend(bars, i)) baseReliability += 18;

  // Third closes below first's high (filling the gap)
  if (third.close < first.high) baseReliability += 8;

  return {
    name: "Upside Gap Two Crows",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal: a bullish candle, a gapping-up bearish candle, then a larger bearish candle engulfing the second — the upside gap is being filled, sellers dominate.",
  };
}

// ─── 52. Three Line Strike (Bearish) ────────────────────────────────────────

function detectThreeLineStrikeBearish(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 3) return null;
  const a = bars[i - 3]; // bullish
  const b = bars[i - 2]; // bullish
  const c = bars[i - 1]; // bullish
  const d = bars[i]; // bearish, engulfs all three

  // First three: bullish, each closing higher
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;
  if (b.close <= a.close || c.close <= b.close) return null;

  // Bodies should be significant
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;

  // Fourth: large bearish engulfing all three prior candles
  if (!isBearish(d)) return null;
  if (d.open <= c.close) return null; // opens above third's close
  if (d.close >= a.open) return null; // closes below first's open

  let baseReliability = 65;
  if (inUptrend(bars, i)) baseReliability += 18;

  // Fourth body should be large
  if (bodySize(d) > avgBody * 1.5) baseReliability += 5;

  return {
    name: "Three Line Strike (Bearish)",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish reversal: three rising bullish candles followed by one large bearish candle engulfing all three — a sudden, dramatic shift from buying to selling pressure.",
  };
}

// ─── 53. Bearish Thrusting ──────────────────────────────────────────────────

function detectBearishThrusting(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bullish, current: bearish
  if (!isBullish(prev) || !isBearish(curr)) return null;

  // Both should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;

  // Current opens above previous close
  if (curr.open <= prev.close) return null;

  // Current closes below previous close but above midpoint of previous body
  const prevMidpoint = (prev.open + prev.close) / 2;
  if (curr.close >= prev.close) return null;
  if (curr.close <= prevMidpoint) return null;

  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Closer to midpoint = stronger thrust down
  const penetration = (prev.close - curr.close) / (prev.close - prevMidpoint);
  if (penetration > 0.7) baseReliability += 5;

  return {
    name: "Bearish Thrusting",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish pattern: after a bullish candle, a bearish candle opens above and closes below the prior close but above its midpoint — a thrust downward that may signal reversal.",
  };
}

// ─── 54. Matching High ──────────────────────────────────────────────────────

function detectMatchingHigh(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Both candles must be bullish
  if (!isBullish(prev) || !isBullish(curr)) return null;

  // Both should have significant bodies
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;
  if (bodySize(curr) < avgBody * 0.4) return null;

  // Both close at approximately the same high
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(prev.close - curr.close) > tolerance) return null;

  // Must appear in an uptrend
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 20;

  if (Math.abs(prev.close - curr.close) < tolerance * 0.2) baseReliability += 10;

  return {
    name: "Matching High",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Two bullish candles closing at the same level after an uptrend — buyers unable to push higher, suggesting buying exhaustion and potential reversal.",
  };
}

// ─── 55. Bearish Homing Pigeon ──────────────────────────────────────────────

function detectBearishHomingPigeon(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Both must be bullish (like harami but both bullish, smaller inside)
  if (!isBullish(prev) || !isBullish(curr)) return null;

  // Current body must be completely inside previous body
  if (!(curr.open >= prev.open && curr.close <= prev.close)) return null;

  // Current body must be smaller (less than 50%)
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;

  // Previous should have a significant body
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;

  let baseReliability = 52;
  if (inUptrend(bars, i)) baseReliability += 18;

  if (bodySize(curr) < bodySize(prev) * 0.25) baseReliability += 8;

  return {
    name: "Bearish Homing Pigeon",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Like a bullish harami but both candles are bullish: a large bullish candle followed by a smaller bullish candle inside its body — buying momentum is weakening, rare bearish signal.",
  };
}

// ─── 56. On Neck ────────────────────────────────────────────────────────────

function detectOnNeck(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bearish with significant body, current: bullish (small)
  if (!isBearish(prev) || !isBullish(curr)) return null;

  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;

  // Current should be small-bodied
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;

  // Current closes at approximately the previous low
  const tolerance = Math.max(bodySize(prev), bodySize(curr)) * 0.05;
  if (Math.abs(curr.close - prev.low) > tolerance) return null;

  // Must appear in a downtrend
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;

  if (Math.abs(curr.close - prev.low) < tolerance * 0.2) baseReliability += 8;

  return {
    name: "On Neck",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish continuation: a bearish candle followed by a small bullish candle closing at the prior low — the prior support level is holding as resistance, downtrend likely continues.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTINUATION PATTERNS (57–68)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 57. Three Line Strike (Bullish) ────────────────────────────────────────

function detectThreeLineStrikeBullish(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 3) return null;
  const a = bars[i - 3]; // bearish
  const b = bars[i - 2]; // bearish
  const c = bars[i - 1]; // bearish
  const d = bars[i]; // bullish, engulfs all three

  // First three: bearish, each closing lower
  if (!isBearish(a) || !isBearish(b) || !isBearish(c)) return null;
  if (b.close >= a.close || c.close >= b.close) return null;

  // Bodies should be significant
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;

  // Fourth: large bullish engulfing all three prior candles
  if (!isBullish(d)) return null;
  if (d.open >= c.close) return null; // opens below third's close
  if (d.close <= a.open) return null; // closes above first's open

  let baseReliability = 65;
  if (inDowntrend(bars, i)) baseReliability += 18;

  if (bodySize(d) > avgBody * 1.5) baseReliability += 5;

  return {
    name: "Three Line Strike (Bullish)",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish continuation: three declining bearish candles followed by one large bullish candle engulfing all three — after a brief pullback, buyers surge back with force.",
  };
}

// ─── 58. Bullish Mat Hold ───────────────────────────────────────────────────

function detectBullishMatHold(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 4) return null;
  const first = bars[i - 4]; // large bullish
  const two = bars[i - 3]; // small bearish (gap up)
  const three = bars[i - 2]; // small bearish/bullish
  const four = bars[i - 1]; // small bearish
  const fifth = bars[i]; // bullish continuation

  // First: large bullish
  if (!isBullish(first)) return null;
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(first) < avgBody * 0.7) return null;

  // Second: gaps up from first (bullish gap)
  if (two.low <= first.high) return null;

  // Middle three: small bodies staying above first's midpoint
  const firstMid = (first.open + first.close) / 2;
  const middleBars = [two, three, four];
  for (const mb of middleBars) {
    if (bodySize(mb) > avgBody * 0.6) return null;
    if (mb.low < firstMid) return null; // must stay above first's midpoint
  }

  // At least two of the middle should be bearish (flag-like)
  const bearishCount = middleBars.filter((b) => isBearish(b)).length;
  if (bearishCount < 1) return null;

  // Fifth: bullish, closes above first's close
  if (!isBullish(fifth)) return null;
  if (fifth.close <= first.close) return null;
  if (bodySize(fifth) < avgBody * 0.5) return null;

  let baseReliability = 70;
  if (inUptrend(bars, i - 4)) baseReliability += 12;

  // Fifth has small upper wick
  if (upperWick(fifth) < bodySize(fifth) * 0.2) baseReliability += 5;

  return {
    name: "Bullish Mat Hold",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish continuation: a large bullish candle, a gapping-up bearish flag, then a bullish continuation — the flag holds above the first candle's midpoint, confirming the uptrend.",
  };
}

// ─── 59. Upside Tasuki Gap ──────────────────────────────────────────────────

function detectUpsideTasukiGap(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // bullish
  const b = bars[i - 1]; // bullish, gaps up
  const c = bars[i]; // bearish, partial fill

  // First: bullish
  if (!isBullish(a)) return null;
  const avgBody = contextAvgBody(bars, i);

  // Second: bullish, gaps up from first
  if (!isBullish(b)) return null;
  if (b.low <= a.high) return null; // gap exists

  // Third: bearish, opens within second's body, partially fills the gap
  if (!isBearish(c)) return null;
  if (c.open < b.close || c.open > b.open) return null;

  // Third closes into the gap but doesn't close it completely
  if (c.close >= b.low) return null; // must enter the gap
  if (c.close <= a.high) return null; // but not fill it entirely

  let baseReliability = 60;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Gap size is significant
  if (b.low - a.high > avgBody * 0.3) baseReliability += 5;

  return {
    name: "Upside Tasuki Gap",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish continuation: two bullish candles with an upside gap, then a bearish candle partially filling the gap — the gap holds, confirming the uptrend will continue.",
  };
}

// ─── 60. Side by Side White ─────────────────────────────────────────────────

function detectSideBySideWhite(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // bullish
  const b = bars[i - 1]; // bullish, gaps up
  const c = bars[i]; // bullish, same level as b

  // All three must be bullish
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return null;

  // Second gaps up from first
  if (b.low <= a.high) return null;

  // Third opens at approximately the same level as second
  const tolerance = Math.max(bodySize(b), bodySize(c)) * 0.1;
  if (Math.abs(c.open - b.open) > tolerance) return null;

  // Bodies should be significant
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(a) < avgBody * 0.4) return null;
  if (bodySize(b) < avgBody * 0.4) return null;

  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 15;

  // All three have similar body sizes
  const maxBody = Math.max(bodySize(a), bodySize(b), bodySize(c));
  const minBody = Math.min(bodySize(a), bodySize(b), bodySize(c));
  if (minBody > maxBody * 0.6) baseReliability += 5;

  return {
    name: "Side by Side White",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish continuation: two bullish candles at the same level with a gap up from a prior bullish candle — strong buying momentum with no seller pushback at the gap.",
  };
}

// ─── 61. Bullish Closing Marubozu ───────────────────────────────────────────

function detectBullishClosingMarubozu(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBullish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);

  if (r === 0) return null;

  // Closes at the high (no upper wick or negligible)
  if (upperWick(bar) > r * 0.02) return null;

  // Body must be significant
  if (body < avgBody * 0.6) return null;

  // Body should be a large portion of range
  if (body / r < 0.7) return null;

  // Context: continuation in uptrend
  let baseReliability = 58;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Larger body = more reliable
  if (body > avgBody * 1.3) baseReliability += 8;
  if (body > avgBody * 1.5) baseReliability += 4;

  return {
    name: "Bullish Closing Marubozu",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish candle closing at its high — buyers maintained control to the very end of the session, signaling strong buying pressure and potential continuation.",
  };
}

// ─── 62. Bearish Closing Marubozu ───────────────────────────────────────────

function detectBearishClosingMarubozu(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBearish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);

  if (r === 0) return null;

  // Closes at the low (no lower wick or negligible)
  if (lowerWick(bar) > r * 0.02) return null;

  // Body must be significant
  if (body < avgBody * 0.6) return null;

  // Body should be a large portion of range
  if (body / r < 0.7) return null;

  // Context: continuation in downtrend
  let baseReliability = 58;
  if (inDowntrend(bars, i)) baseReliability += 15;

  if (body > avgBody * 1.3) baseReliability += 8;
  if (body > avgBody * 1.5) baseReliability += 4;

  return {
    name: "Bearish Closing Marubozu",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish candle closing at its low — sellers maintained control to the very end of the session, signaling strong selling pressure and potential continuation.",
  };
}

// ─── 63. Bearish Opening Marubozu ───────────────────────────────────────────

function detectBearishOpeningMarubozu(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBearish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);

  if (r === 0) return null;

  // Opens at the high (no upper wick or negligible)
  if (upperWick(bar) > r * 0.02) return null;

  // Body must be significant
  if (body < avgBody * 0.6) return null;

  // Body should be a large portion of range
  if (body / r < 0.7) return null;

  // Context: continuation in downtrend
  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;

  if (body > avgBody * 1.3) baseReliability += 8;

  return {
    name: "Bearish Opening Marubozu",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish candle opening at its high — selling pressure began immediately and never let up, signaling strong bearish momentum and potential continuation.",
  };
}

// ─── 64. Bullish Opening Marubozu ───────────────────────────────────────────

function detectBullishOpeningMarubozu(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  if (!isBullish(bar)) return null;

  const body = bodySize(bar);
  const r = range(bar);
  const avgBody = contextAvgBody(bars, i);

  if (r === 0) return null;

  // Opens at the low (no lower wick or negligible)
  if (lowerWick(bar) > r * 0.02) return null;

  // Body must be significant
  if (body < avgBody * 0.6) return null;

  // Body should be a large portion of range
  if (body / r < 0.7) return null;

  // Context: continuation in uptrend
  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;

  if (body > avgBody * 1.3) baseReliability += 8;

  return {
    name: "Bullish Opening Marubozu",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bullish candle opening at its low — buying pressure began immediately and never let up, signaling strong bullish momentum and potential continuation.",
  };
}

// ─── 65. Downside Tasuki Gap ────────────────────────────────────────────────

function detectDownsideTasukiGap(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // bearish
  const b = bars[i - 1]; // bearish, gaps down
  const c = bars[i]; // bullish, partial fill

  // First: bearish
  if (!isBearish(a)) return null;
  const avgBody = contextAvgBody(bars, i);

  // Second: bearish, gaps down from first
  if (!isBearish(b)) return null;
  if (b.high >= a.low) return null; // gap exists

  // Third: bullish, opens within second's body, partially fills the gap
  if (!isBullish(c)) return null;
  if (c.open > b.open || c.open < b.close) return null;

  // Third closes into the gap but doesn't close it completely
  if (c.close <= b.high) return null; // must enter the gap
  if (c.close >= a.low) return null; // but not fill it entirely

  let baseReliability = 60;
  if (inDowntrend(bars, i)) baseReliability += 15;

  if (a.low - b.high > avgBody * 0.3) baseReliability += 5;

  return {
    name: "Downside Tasuki Gap",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish continuation: two bearish candles with a downside gap, then a bullish candle partially filling the gap — the gap holds, confirming the downtrend will continue.",
  };
}

// ─── 66. In Neck ────────────────────────────────────────────────────────────

function detectInNeck(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Previous: bearish with significant body, current: bullish (small)
  if (!isBearish(prev) || !isBullish(curr)) return null;

  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.5) return null;

  // Current should be small-bodied
  if (bodySize(curr) > bodySize(prev) * 0.5) return null;

  // Current closes slightly above previous close (not at previous low like On Neck)
  // The close should be just above prev.close
  const tolerance = bodySize(prev) * 0.1;
  if (curr.close < prev.close) return null;
  if (curr.close > prev.close + tolerance) return null;

  // Must appear in a downtrend
  let baseReliability = 52;
  if (inDowntrend(bars, i)) baseReliability += 15;

  return {
    name: "In Neck",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Bearish continuation: a bearish candle followed by a small bullish candle closing slightly above the prior close — weak buying, downtrend likely to continue.",
  };
}

// ─── 67. Window Up (Gap Up) ─────────────────────────────────────────────────

function detectWindowUp(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Gap up: current's low is above previous's high
  if (curr.low <= prev.high) return null;

  // Gap should be significant
  const avgBody = contextAvgBody(bars, i);
  const gapSize = curr.low - prev.high;
  if (gapSize < avgBody * 0.1) return null;

  let baseReliability = 55;
  if (inUptrend(bars, i)) baseReliability += 15;

  // Larger gap = more significant
  if (gapSize > avgBody * 0.3) baseReliability += 8;
  if (gapSize > avgBody * 0.5) baseReliability += 5;

  return {
    name: "Window Up",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Gap up (window): current candle's low is above the previous candle's high — a price gap indicating strong buying momentum and potential support at the gap zone.",
  };
}

// ─── 68. Window Down (Gap Down) ─────────────────────────────────────────────

function detectWindowDown(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Gap down: current's high is below previous's low
  if (curr.high >= prev.low) return null;

  // Gap should be significant
  const avgBody = contextAvgBody(bars, i);
  const gapSize = prev.low - curr.high;
  if (gapSize < avgBody * 0.1) return null;

  let baseReliability = 55;
  if (inDowntrend(bars, i)) baseReliability += 15;

  if (gapSize > avgBody * 0.3) baseReliability += 8;
  if (gapSize > avgBody * 0.5) baseReliability += 5;

  return {
    name: "Window Down",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Gap down (window): current candle's high is below the previous candle's low — a price gap indicating strong selling momentum and potential resistance at the gap zone.",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEUTRAL / DOJI PATTERNS (69–74)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 69. Long Legged Doji ───────────────────────────────────────────────────

function detectLongLeggedDoji(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const r = range(bar);

  if (r === 0) return null;

  // Must be a doji
  if (!isDoji(bar)) return null;

  // Both wicks must be long (upper + lower wick ≥ 85% of range)
  const uwick = upperWick(bar);
  const lwick = lowerWick(bar);

  if ((uwick + lwick) / r < 0.85) return null;

  // Both wicks should be substantial (each ≥ 30% of range)
  if (uwick / r < 0.3) return null;
  if (lwick / r < 0.3) return null;

  let baseReliability = 55;

  // More equal wicks = more reliable indecision
  const wickRatio = uwick / (lwick || 0.0001);
  if (wickRatio > 0.6 && wickRatio < 1.7) baseReliability += 10;

  // Context can shift the signal
  if (inUptrend(bars, i)) baseReliability += 5;
  if (inDowntrend(bars, i)) baseReliability += 5;

  return {
    name: "Long Legged Doji",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description:
      "Doji with long wicks on both sides — extreme indecision with large price swings in both directions, indicating a potential turning point in any trend.",
  };
}

// ─── 70. Four Price Doji ────────────────────────────────────────────────────

function detectFourPriceDoji(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];

  // Open = High = Low = Close (extremely rare)
  if (bar.open !== bar.close || bar.high !== bar.low || bar.open !== bar.high) return null;

  // This is extremely rare in real data, but when it occurs it's significant
  let baseReliability = 60;

  if (inUptrend(bars, i)) baseReliability += 5;
  if (inDowntrend(bars, i)) baseReliability += 5;

  return {
    name: "Four Price Doji",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description:
      "Extremely rare doji where open, high, low, and close are all equal — absolute market paralysis, typically indicating a complete lack of trading activity or extreme equilibrium.",
  };
}

// ─── 71. Rickshaw Man ───────────────────────────────────────────────────────

function detectRickshawMan(bars: OHLCVBar[], i: number): CandlePattern | null {
  const bar = bars[i];
  const r = range(bar);

  if (r === 0) return null;

  // Must be a doji
  if (!isDoji(bar)) return null;

  // Very long wicks on both sides (each ≥ 40% of range)
  const uwick = upperWick(bar);
  const lwick = lowerWick(bar);

  if (uwick / r < 0.4) return null;
  if (lwick / r < 0.4) return null;

  // Body should be at the very middle of the range
  const bodyCenter = (bar.open + bar.close) / 2;
  const rangeCenter = (bar.high + bar.low) / 2;
  const bodyOffset = Math.abs(bodyCenter - rangeCenter) / r;

  if (bodyOffset > 0.1) return null; // body must be near middle

  let baseReliability = 55;

  // More centered body = more reliable
  if (bodyOffset < 0.05) baseReliability += 10;

  if (inUptrend(bars, i)) baseReliability += 5;
  if (inDowntrend(bars, i)) baseReliability += 5;

  return {
    name: "Rickshaw Man",
    index: i,
    type: "NEUTRAL",
    reliability: Math.min(baseReliability, 100),
    description:
      "Long-legged doji with the body precisely at the midpoint of the range — maximum indecision with equal pressure from buyers and sellers, signaling potential trend change.",
  };
}

// ─── 72. Doji Star ──────────────────────────────────────────────────────────

function detectDojiStar(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 1) return null;
  const prev = bars[i - 1];
  const curr = bars[i];

  // Current must be a doji
  if (!isDoji(curr)) return null;

  // Previous should have a significant body (to create a star pattern)
  const avgBody = contextAvgBody(bars, i);
  if (bodySize(prev) < avgBody * 0.4) return null;

  // Doji should gap from previous close
  const gapUp = Math.min(curr.open, curr.close) > prev.close;
  const gapDown = Math.max(curr.open, curr.close) < prev.close;

  if (!gapUp && !gapDown) return null;

  let baseReliability = 52;

  // Context determines bullish/bearish bias
  if (inUptrend(bars, i) && gapUp) baseReliability += 10;
  if (inDowntrend(bars, i) && gapDown) baseReliability += 10;

  // Very small body ratio = more extreme doji
  if (bodyRatio(curr) < 0.03) baseReliability += 8;

  // Determine type based on context
  const type: "BULLISH" | "BEARISH" | "NEUTRAL" =
    inDowntrend(bars, i) && gapDown
      ? "BULLISH"
      : inUptrend(bars, i) && gapUp
        ? "BEARISH"
        : "NEUTRAL";

  return {
    name: "Doji Star",
    index: i,
    type,
    reliability: Math.min(baseReliability, 100),
    description:
      "A doji that gaps away from the prior candle — a star pattern signaling indecision and potential reversal. Context (uptrend/downtrend) determines directional bias.",
  };
}

// ─── 73. Tri Star Doji (Bullish) ────────────────────────────────────────────

function detectTriStarDojiBullish(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // doji
  const b = bars[i - 1]; // doji, gaps down
  const c = bars[i]; // doji, gaps up

  // All three must be dojis
  if (!isDoji(a) || !isDoji(b) || !isDoji(c)) return null;

  // Middle doji gaps down from first
  if (Math.max(b.open, b.close) >= Math.min(a.open, a.close)) return null;

  // Third doji gaps up from middle
  if (Math.min(c.open, c.close) <= Math.max(b.open, b.close)) return null;

  // Must appear at the bottom of a downtrend
  let baseReliability = 72;
  if (inDowntrend(bars, i)) baseReliability += 15;

  return {
    name: "Tri Star Doji (Bullish)",
    index: i,
    type: "BULLISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Rare bullish reversal: three dojis in a row at the bottom of a downtrend with a down-gap then up-gap — extreme indecision transitioning to bullish reversal.",
  };
}

// ─── 74. Tri Star Doji (Bearish) ────────────────────────────────────────────

function detectTriStarDojiBearish(bars: OHLCVBar[], i: number): CandlePattern | null {
  if (i < 2) return null;
  const a = bars[i - 2]; // doji
  const b = bars[i - 1]; // doji, gaps up
  const c = bars[i]; // doji, gaps down

  // All three must be dojis
  if (!isDoji(a) || !isDoji(b) || !isDoji(c)) return null;

  // Middle doji gaps up from first
  if (Math.min(b.open, b.close) <= Math.max(a.open, a.close)) return null;

  // Third doji gaps down from middle
  if (Math.max(c.open, c.close) >= Math.min(b.open, b.close)) return null;

  // Must appear at the top of an uptrend
  let baseReliability = 72;
  if (inUptrend(bars, i)) baseReliability += 15;

  return {
    name: "Tri Star Doji (Bearish)",
    index: i,
    type: "BEARISH",
    reliability: Math.min(baseReliability, 100),
    description:
      "Rare bearish reversal: three dojis in a row at the top of an uptrend with an up-gap then down-gap — extreme indecision transitioning to bearish reversal.",
  };
}
