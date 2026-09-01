// ============================================================================
// Trade — Candlestick Pattern Detector
// ============================================================================
//
// Ported from:
//   - Eptelligence/Candlestick-Signal-Bot (candlestick patterns)
//   - RichardTsang2022/crypto-monitor-railway912 (chart patterns)
//
// Detects patterns on OHLCV candle arrays.
// All functions are pure — no API calls, no side effects.
// ============================================================================

export interface Candle {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DetectedPattern {
  name: string;
  type: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-100
  timeframe: string;
  description: string;
  detectedAt: string; // ISO timestamp
  candleIndex: number; // index of last candle in pattern
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function body(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function upperWick(c: Candle): number {
  return c.high - Math.max(c.open, c.close);
}

function lowerWick(c: Candle): number {
  return Math.min(c.open, c.close) - c.low;
}

function totalRange(c: Candle): number {
  return c.high - c.low;
}

function isBullish(c: Candle): boolean {
  return c.close > c.open;
}

function isBearish(c: Candle): boolean {
  return c.close < c.open;
}

function midpoint(c: Candle): number {
  return (c.high + c.low) / 2;
}

function isoDates(candle: Candle): string {
  return new Date(candle.time * 1000).toISOString();
}

// ── Single-Candle Patterns ────────────────────────────────────────────────────

function detectHammer(candle: Candle, prev: Candle, timeframe: string): DetectedPattern | null {
  const b = body(candle);
  const lower = lowerWick(candle);
  const upper = upperWick(candle);
  const range = totalRange(candle);

  if (range === 0) return null;

  // Hammer: small body at top, long lower wick (≥2x body), tiny upper wick
  if (lower >= 2 * b && upper <= 0.3 * b && b <= 0.35 * range && isBearish(prev)) {
    return {
      name: "Hammer",
      type: "bullish",
      confidence: Math.min(95, 60 + Math.round((lower / b) * 5)),
      timeframe,
      description: "Hammer candle after downtrend — potential bullish reversal",
      detectedAt: isoDates(candle),
      candleIndex: 0,
    };
  }
  return null;
}

function detectShootingStar(
  candle: Candle,
  prev: Candle,
  timeframe: string,
): DetectedPattern | null {
  const b = body(candle);
  const lower = lowerWick(candle);
  const upper = upperWick(candle);
  const range = totalRange(candle);

  if (range === 0) return null;

  // Shooting Star: small body at bottom, long upper wick (≥2x body), tiny lower wick
  if (upper >= 2 * b && lower <= 0.3 * b && b <= 0.35 * range && isBullish(prev)) {
    return {
      name: "Shooting Star",
      type: "bearish",
      confidence: Math.min(95, 60 + Math.round((upper / b) * 5)),
      timeframe,
      description: "Shooting Star after uptrend — potential bearish reversal",
      detectedAt: isoDates(candle),
      candleIndex: 0,
    };
  }
  return null;
}

function detectDoji(candle: Candle, timeframe: string): DetectedPattern | null {
  const b = body(candle);
  const range = totalRange(candle);
  if (range === 0) return null;

  // Doji: body is <10% of total range
  if (b <= 0.1 * range) {
    return {
      name: "Doji",
      type: "neutral",
      confidence: 65,
      timeframe,
      description: "Doji — indecision, watch for breakout direction",
      detectedAt: isoDates(candle),
      candleIndex: 0,
    };
  }
  return null;
}

// ── Two-Candle Patterns ───────────────────────────────────────────────────────

function detectBullishEngulfing(
  prev: Candle,
  curr: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (isBearish(prev) && isBullish(curr) && curr.open < prev.close && curr.close > prev.open) {
    const bodyRatio = body(curr) / (body(prev) || 0.001);
    return {
      name: "Bullish Engulfing",
      type: "bullish",
      confidence: Math.min(95, 65 + Math.round(bodyRatio * 5)),
      timeframe,
      description: "Bullish engulfing — buyers overwhelmed sellers, momentum shift",
      detectedAt: isoDates(curr),
      candleIndex: 0,
    };
  }
  return null;
}

function detectBearishEngulfing(
  prev: Candle,
  curr: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (isBullish(prev) && isBearish(curr) && curr.open > prev.close && curr.close < prev.open) {
    const bodyRatio = body(curr) / (body(prev) || 0.001);
    return {
      name: "Bearish Engulfing",
      type: "bearish",
      confidence: Math.min(95, 65 + Math.round(bodyRatio * 5)),
      timeframe,
      description: "Bearish engulfing — sellers overwhelmed buyers, momentum shift",
      detectedAt: isoDates(curr),
      candleIndex: 0,
    };
  }
  return null;
}

function detectBullishHarami(
  prev: Candle,
  curr: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (isBearish(prev) && isBullish(curr) && curr.open > prev.close && curr.close < prev.open) {
    return {
      name: "Bullish Harami",
      type: "bullish",
      confidence: 68,
      timeframe,
      description: "Bullish Harami — smaller bullish candle inside bearish, potential reversal",
      detectedAt: isoDates(curr),
      candleIndex: 0,
    };
  }
  return null;
}

function detectBearishHarami(
  prev: Candle,
  curr: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (isBullish(prev) && isBearish(curr) && curr.open < prev.close && curr.close > prev.open) {
    return {
      name: "Bearish Harami",
      type: "bearish",
      confidence: 68,
      timeframe,
      description: "Bearish Harami — smaller bearish candle inside bullish, potential reversal",
      detectedAt: isoDates(curr),
      candleIndex: 0,
    };
  }
  return null;
}

// ── Three-Candle Patterns ─────────────────────────────────────────────────────

function detectMorningStar(
  c1: Candle,
  c2: Candle,
  c3: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (
    isBearish(c1) &&
    body(c2) < body(c1) * 0.3 && // small middle candle
    isBullish(c3) &&
    c3.close > midpoint(c1)
  ) {
    return {
      name: "Morning Star",
      type: "bullish",
      confidence: 80,
      timeframe,
      description: "Morning Star — 3-candle bullish reversal pattern after downtrend",
      detectedAt: isoDates(c3),
      candleIndex: 0,
    };
  }
  return null;
}

function detectEveningStar(
  c1: Candle,
  c2: Candle,
  c3: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (isBullish(c1) && body(c2) < body(c1) * 0.3 && isBearish(c3) && c3.close < midpoint(c1)) {
    return {
      name: "Evening Star",
      type: "bearish",
      confidence: 80,
      timeframe,
      description: "Evening Star — 3-candle bearish reversal pattern after uptrend",
      detectedAt: isoDates(c3),
      candleIndex: 0,
    };
  }
  return null;
}

function detectThreeWhiteSoldiers(
  c1: Candle,
  c2: Candle,
  c3: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (
    isBullish(c1) &&
    isBullish(c2) &&
    isBullish(c3) &&
    c2.open > c1.open &&
    c2.open < c1.close &&
    c3.open > c2.open &&
    c3.open < c2.close &&
    body(c1) > 0 &&
    body(c2) > 0 &&
    body(c3) > 0
  ) {
    return {
      name: "Three White Soldiers",
      type: "bullish",
      confidence: 82,
      timeframe,
      description: "Three White Soldiers — strong bullish momentum continuation",
      detectedAt: isoDates(c3),
      candleIndex: 0,
    };
  }
  return null;
}

function detectThreeBlackCrows(
  c1: Candle,
  c2: Candle,
  c3: Candle,
  timeframe: string,
): DetectedPattern | null {
  if (
    isBearish(c1) &&
    isBearish(c2) &&
    isBearish(c3) &&
    c2.open < c1.open &&
    c2.open > c1.close &&
    c3.open < c2.open &&
    c3.open > c2.close &&
    body(c1) > 0 &&
    body(c2) > 0 &&
    body(c3) > 0
  ) {
    return {
      name: "Three Black Crows",
      type: "bearish",
      confidence: 82,
      timeframe,
      description: "Three Black Crows — strong bearish momentum continuation",
      detectedAt: isoDates(c3),
      candleIndex: 0,
    };
  }
  return null;
}

// ── Chart Patterns (multi-candle) ────────────────────────────────────────────

function detectDoubleTop(candles: Candle[], timeframe: string): DetectedPattern | null {
  if (candles.length < 20) return null;

  const highs = candles.map((c) => c.high);
  const maxHigh = Math.max(...highs);
  const maxIndex = highs.indexOf(maxHigh);

  if (maxIndex < 5 || maxIndex > candles.length - 5) return null;

  // Find second peak near same level (within 2%)
  const tolerance = maxHigh * 0.02;
  const leftSection = highs.slice(0, maxIndex - 3);
  const rightSection = highs.slice(maxIndex + 3);

  const leftPeak = Math.max(...leftSection);
  const rightPeak = Math.max(...rightSection);

  if (Math.abs(leftPeak - maxHigh) <= tolerance && Math.abs(rightPeak - maxHigh) <= tolerance) {
    return {
      name: "Double Top",
      type: "bearish",
      confidence: 72,
      timeframe,
      description: "Double Top pattern detected — potential bearish reversal",
      detectedAt: isoDates(candles[candles.length - 1]),
      candleIndex: candles.length - 1,
    };
  }
  return null;
}

function detectDoubleBottom(candles: Candle[], timeframe: string): DetectedPattern | null {
  if (candles.length < 20) return null;

  const lows = candles.map((c) => c.low);
  const minLow = Math.min(...lows);
  const minIndex = lows.indexOf(minLow);

  if (minIndex < 5 || minIndex > candles.length - 5) return null;

  const tolerance = minLow * 0.02;
  const leftSection = lows.slice(0, minIndex - 3);
  const rightSection = lows.slice(minIndex + 3);

  const leftTrough = Math.min(...leftSection);
  const rightTrough = Math.min(...rightSection);

  if (Math.abs(leftTrough - minLow) <= tolerance && Math.abs(rightTrough - minLow) <= tolerance) {
    return {
      name: "Double Bottom",
      type: "bullish",
      confidence: 72,
      timeframe,
      description: "Double Bottom pattern detected — potential bullish reversal",
      detectedAt: isoDates(candles[candles.length - 1]),
      candleIndex: candles.length - 1,
    };
  }
  return null;
}

function detectBullFlag(candles: Candle[], timeframe: string): DetectedPattern | null {
  if (candles.length < 15) return null;

  // Strong uptrend in first half, consolidation in second half
  const mid = Math.floor(candles.length / 2);
  const firstHalf = candles.slice(0, mid);
  const secondHalf = candles.slice(mid);

  const firstReturn =
    (firstHalf[firstHalf.length - 1].close - firstHalf[0].open) / firstHalf[0].open;
  const secondReturn =
    (secondHalf[secondHalf.length - 1].close - secondHalf[0].open) / secondHalf[0].open;

  if (firstReturn > 0.05 && Math.abs(secondReturn) < 0.03) {
    return {
      name: "Bull Flag",
      type: "bullish",
      confidence: 70,
      timeframe,
      description: "Bull Flag — consolidation after strong uptrend, potential breakout",
      detectedAt: isoDates(candles[candles.length - 1]),
      candleIndex: candles.length - 1,
    };
  }
  return null;
}

function detectBearFlag(candles: Candle[], timeframe: string): DetectedPattern | null {
  if (candles.length < 15) return null;

  const mid = Math.floor(candles.length / 2);
  const firstHalf = candles.slice(0, mid);
  const secondHalf = candles.slice(mid);

  const firstReturn =
    (firstHalf[firstHalf.length - 1].close - firstHalf[0].open) / firstHalf[0].open;
  const secondReturn =
    (secondHalf[secondHalf.length - 1].close - secondHalf[0].open) / secondHalf[0].open;

  if (firstReturn < -0.05 && Math.abs(secondReturn) < 0.03) {
    return {
      name: "Bear Flag",
      type: "bearish",
      confidence: 70,
      timeframe,
      description: "Bear Flag — consolidation after strong downtrend, potential breakdown",
      detectedAt: isoDates(candles[candles.length - 1]),
      candleIndex: candles.length - 1,
    };
  }
  return null;
}

// ── Main Detector ─────────────────────────────────────────────────────────────

/**
 * Run all pattern detectors on a candle array.
 * Returns detected patterns sorted by confidence descending.
 *
 * @param candles - OHLCV candle array (oldest first)
 * @param timeframe - e.g. "1h", "4h", "1d"
 */
export function detectPatterns(candles: Candle[], timeframe: string): DetectedPattern[] {
  if (candles.length < 3) return [];

  const patterns: DetectedPattern[] = [];
  const n = candles.length;
  const last = candles[n - 1];
  const prev1 = candles[n - 2];
  const prev2 = candles[n - 3];

  // Single-candle patterns (last candle)
  const hammer = detectHammer(last, prev1, timeframe);
  if (hammer) patterns.push({ ...hammer, candleIndex: n - 1 });

  const star = detectShootingStar(last, prev1, timeframe);
  if (star) patterns.push({ ...star, candleIndex: n - 1 });

  const doji = detectDoji(last, timeframe);
  if (doji) patterns.push({ ...doji, candleIndex: n - 1 });

  // Two-candle patterns
  const bullEng = detectBullishEngulfing(prev1, last, timeframe);
  if (bullEng) patterns.push({ ...bullEng, candleIndex: n - 1 });

  const bearEng = detectBearishEngulfing(prev1, last, timeframe);
  if (bearEng) patterns.push({ ...bearEng, candleIndex: n - 1 });

  const bullHar = detectBullishHarami(prev1, last, timeframe);
  if (bullHar) patterns.push({ ...bullHar, candleIndex: n - 1 });

  const bearHar = detectBearishHarami(prev1, last, timeframe);
  if (bearHar) patterns.push({ ...bearHar, candleIndex: n - 1 });

  // Three-candle patterns
  const mornStar = detectMorningStar(prev2, prev1, last, timeframe);
  if (mornStar) patterns.push({ ...mornStar, candleIndex: n - 1 });

  const eveStar = detectEveningStar(prev2, prev1, last, timeframe);
  if (eveStar) patterns.push({ ...eveStar, candleIndex: n - 1 });

  const tws = detectThreeWhiteSoldiers(prev2, prev1, last, timeframe);
  if (tws) patterns.push({ ...tws, candleIndex: n - 1 });

  const tbc = detectThreeBlackCrows(prev2, prev1, last, timeframe);
  if (tbc) patterns.push({ ...tbc, candleIndex: n - 1 });

  // Chart patterns (requires more candles)
  if (candles.length >= 20) {
    const dblTop = detectDoubleTop(candles, timeframe);
    if (dblTop) patterns.push(dblTop);

    const dblBot = detectDoubleBottom(candles, timeframe);
    if (dblBot) patterns.push(dblBot);

    const bullFlag = detectBullFlag(candles, timeframe);
    if (bullFlag) patterns.push(bullFlag);

    const bearFlag = detectBearFlag(candles, timeframe);
    if (bearFlag) patterns.push(bearFlag);
  }

  // Sort by confidence descending, deduplicate similar names
  const seen = new Set<string>();
  return patterns
    .sort((a, b) => b.confidence - a.confidence)
    .filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
}

/** Format pattern for display */
export function patternIcon(type: "bullish" | "bearish" | "neutral"): string {
  return type === "bullish" ? "📈" : type === "bearish" ? "📉" : "📊";
}

export function patternColor(type: "bullish" | "bearish" | "neutral"): string {
  return type === "bullish"
    ? "var(--color-bullish)"
    : type === "bearish"
      ? "var(--color-bearish)"
      : "var(--color-gold)";
}
