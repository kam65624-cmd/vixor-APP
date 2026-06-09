// ============================================================================
// Vixor Local Analysis Engine — Candle Utility Functions
// ============================================================================

import { OHLCVBar, PAIR_CONFIGS, PairConfig } from "./types";

// ---------------------------------------------------------------------------
// Basic candle metrics
// ---------------------------------------------------------------------------

/** Candle body size (absolute) */
export function bodySize(bar: OHLCVBar): number {
  return Math.abs(bar.close - bar.open);
}

/** Upper wick length */
export function upperWick(bar: OHLCVBar): number {
  return bar.high - Math.max(bar.open, bar.close);
}

/** Lower wick length */
export function lowerWick(bar: OHLCVBar): number {
  return Math.min(bar.open, bar.close) - bar.low;
}

/** Full range (high − low) */
export function range(bar: OHLCVBar): number {
  return bar.high - bar.low;
}

/** Is bullish candle */
export function isBullish(bar: OHLCVBar): boolean {
  return bar.close > bar.open;
}

/** Is bearish candle */
export function isBearish(bar: OHLCVBar): boolean {
  return bar.close < bar.open;
}

/** Body ratio (0-1): how much of the range is body */
export function bodyRatio(bar: OHLCVBar): number {
  const r = range(bar);
  return r === 0 ? 0 : bodySize(bar) / r;
}

/** Is doji (very small body relative to range) */
export function isDoji(bar: OHLCVBar, threshold = 0.1): boolean {
  return bodyRatio(bar) < threshold;
}

// ---------------------------------------------------------------------------
// Aggregate calculations
// ---------------------------------------------------------------------------

/** Average body size over N bars ending at endIdx (inclusive) */
export function avgBodySize(bars: OHLCVBar[], period: number, endIdx?: number): number {
  const start =
    endIdx !== undefined ? Math.max(0, endIdx - period + 1) : Math.max(0, bars.length - period);
  const slice = bars.slice(start, (endIdx ?? bars.length - 1) + 1);
  if (slice.length === 0) return 0;
  return slice.reduce((s, b) => s + bodySize(b), 0) / slice.length;
}

/** Average range over N bars ending at endIdx (inclusive) — simple ATR proxy */
export function avgRange(bars: OHLCVBar[], period: number, endIdx?: number): number {
  const start =
    endIdx !== undefined ? Math.max(0, endIdx - period + 1) : Math.max(0, bars.length - period);
  const slice = bars.slice(start, (endIdx ?? bars.length - 1) + 1);
  if (slice.length === 0) return 0;
  return slice.reduce((s, b) => s + range(b), 0) / slice.length;
}

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

/** Typical price (H + L + C) / 3 */
export function typicalPrice(bar: OHLCVBar): number {
  return (bar.high + bar.low + bar.close) / 3;
}

/** True range (handles gaps) */
export function trueRange(current: OHLCVBar, previous: OHLCVBar): number {
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close),
  );
}

/** ATR over N periods using Wilder-style calculation */
export function atr(bars: OHLCVBar[], period: number): number {
  if (bars.length < period + 1) return avgRange(bars, period);

  // Start with simple average of first `period` true ranges
  let prevAtr = 0;
  for (let i = 1; i <= period; i++) {
    prevAtr += trueRange(bars[i]!, bars[i - 1]!);
  }
  prevAtr /= period;

  // Wilder smoothing for the rest
  for (let i = period + 1; i < bars.length; i++) {
    const tr = trueRange(bars[i]!, bars[i - 1]!);
    prevAtr = (prevAtr * (period - 1) + tr) / period;
  }

  return prevAtr;
}

/** Format price with appropriate decimals */
export function formatPrice(price: number, decimals: number): number {
  return Number(price.toFixed(decimals));
}

// ---------------------------------------------------------------------------
// Deterministic OHLCV data generator
// ---------------------------------------------------------------------------

/** Simple deterministic hash for seeding the PRNG */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic OHLCV data from pair config.
 *
 * Uses a linear-congruential PRNG seeded by `pair + timeframe` so the same
 * inputs always produce the same bar sequence — essential for reproducible
 * analysis.
 */
export function generateOHLCV(
  pair: string,
  timeframe: string,
  barCount: number = 200,
  seed?: number,
): OHLCVBar[] {
  const config: PairConfig = PAIR_CONFIGS[pair] ?? PAIR_CONFIGS["EUR/USD"]!;

  // Simple seeded PRNG (Lehmer / LCG)
  let s = seed ?? hashCode(pair + timeframe);
  function next(): number {
    s = ((s * 1664525 + 1013904223) >>> 0) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  }

  // Timeframe multipliers for volatility scaling
  const tfMultiplier: Record<string, number> = {
    "1M": 0.15,
    "5M": 0.25,
    "15M": 0.4,
    "30M": 0.55,
    "1H": 0.7,
    "4H": 0.85,
    "1D": 1.0,
    "1W": 1.5,
  };
  const tf = tfMultiplier[timeframe] ?? 0.7;

  // Interval in seconds for timestamp generation
  const tfMs: Record<string, number> = {
    "1M": 60_000,
    "5M": 300_000,
    "15M": 900_000,
    "30M": 1_800_000,
    "1H": 3_600_000,
    "4H": 14_400_000,
    "1D": 86_400_000,
    "1W": 604_800_000,
  };
  const intervalSec = Math.floor((tfMs[timeframe] ?? 3_600_000) / 1000);
  const startTimeSec = Math.floor(Date.now() / 1000) - barCount * intervalSec;

  const bars: OHLCVBar[] = [];
  let price = config.basePrice;

  // Trend bias that evolves over time for realistic price action
  let trendBias = 0;
  let trendDuration = 0;
  let maxTrendDuration = Math.floor(20 + next() * 40);

  // Track recent swing levels for more realistic structure
  let lastSwingHigh = price;
  let lastSwingLow = price;

  for (let i = 0; i < barCount; i++) {
    // Periodically update trend bias for realistic trending / ranging behaviour
    trendDuration++;
    if (trendDuration > maxTrendDuration) {
      trendBias = (next() - 0.5) * 0.6; // range [-0.3, 0.3]
      trendDuration = 0;
      maxTrendDuration = Math.floor(20 + next() * 40);
    }

    const vol = config.volatility * tf;
    const baseChange = (next() - 0.48 + trendBias * 0.1) * vol * price;
    const open = price;
    const close = open + baseChange;

    // Generate wicks — occasionally create longer wicks for liquidity sweeps
    const sweepChance = next();
    const wickMultiplierUp = sweepChance > 0.92 ? 1.5 + next() * 2 : 0.5 + next() * 0.5;
    const wickMultiplierDown =
      sweepChance > 0.88 && sweepChance <= 0.92 ? 1.5 + next() * 2 : 0.5 + next() * 0.5;

    const wickUp = next() * vol * price * wickMultiplierUp;
    const wickDown = next() * vol * price * wickMultiplierDown;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    // Volume — higher on big moves, occasional spikes
    const isSpike = next() > 0.95;
    const volumeBase = isSpike ? 3000 + next() * 5000 : 500 + next() * 2000;
    const volume = volumeBase * (1 + Math.abs(baseChange) / (vol * price + 1e-10));

    bars.push({
      time: startTimeSec + i * intervalSec,
      open: Number(open.toFixed(config.decimals + 1)),
      high: Number(high.toFixed(config.decimals + 1)),
      low: Number(low.toFixed(config.decimals + 1)),
      close: Number(close.toFixed(config.decimals + 1)),
      volume: Math.floor(volume),
    });

    // Update swing tracking
    if (close > lastSwingHigh) lastSwingHigh = close;
    if (close < lastSwingLow) lastSwingLow = close;

    // Mean-reversion pull: soft pull toward base price to avoid unbounded drift
    const driftFromBase = (price - config.basePrice) / config.basePrice;
    price = close * (1 - driftFromBase * 0.005); // gentle mean reversion

    // Update last swing levels slowly
    lastSwingHigh = lastSwingHigh * 0.998 + price * 0.002;
    lastSwingLow = lastSwingLow * 0.998 + price * 0.002;
  }

  return bars;
}
