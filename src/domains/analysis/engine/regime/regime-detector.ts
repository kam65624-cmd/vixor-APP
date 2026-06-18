// ============================================================================
// VIXOR Analysis Engine — Market Regime Detector
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/experiment/regime.py
//
// Rule-based regime detection using EMA gap, ATR, ADX, directional efficiency,
// and Hurst exponent. Sits as a sibling under `analysis/engine/regime/` — does
// NOT modify the existing SMC/ICT engine.

import type { Candle } from "@/domains/backtest/engine/types";
import { ema as emaArr, sma as smaArr } from "./indicator-math";

export type Regime = "trending_up" | "trending_down" | "ranging" | "volatile" | "quiet";

export interface RegimeIndicators {
  adx: number;
  atrPercentile: number;
  hurst: number;
  trendStrength: number;
  emaGapPct: number;
  realizedVolPct: number;
  directionalEfficiency: number;
  priceChangePct: number;
}

export interface RegimeClassification {
  regime: Regime;
  /** maps to the QuantDinger regime keys for back-compat with the runner */
  regimeKey: "bull_trend" | "bear_trend" | "range_compression" | "high_volatility" | "transition";
  label: string;
  confidence: number; // 0..1
  indicators: RegimeIndicators;
  /** preferred strategy families for this regime */
  strategyFamilies: string[];
}

export interface RegimeOpts {
  /** minimum candle count required (default 30) */
  minCandles?: number;
  /** EMA periods used for trend-gap feature */
  emaFast?: number;
  emaSlow?: number;
  /** ADX period */
  adxPeriod?: number;
  /** ATR period */
  atrPeriod?: number;
  /** lookback window (in bars) for Hurst exponent estimate */
  hurstWindow?: number;
}

const REGIME_FAMILIES: Record<RegimeClassification["regimeKey"], string[]> = {
  bull_trend: ["trend_following", "breakout", "pullback_continuation"],
  bear_trend: ["trend_following", "breakdown", "short_pullback"],
  range_compression: ["mean_reversion", "bollinger_reversion", "range_breakout_watch"],
  high_volatility: ["volatility_breakout", "reduced_risk_trend", "event_drive"],
  transition: ["hybrid", "wait_and_see", "confirmation_breakout"],
};

const REGIME_LABELS: Record<RegimeClassification["regimeKey"], string> = {
  bull_trend: "Bull Trend",
  bear_trend: "Bear Trend",
  range_compression: "Range Compression",
  high_volatility: "High Volatility",
  transition: "Transition",
};

/**
 * Detect market regime from a candle series.
 *
 * Throws if fewer than `opts.minCandles` (default 30) candles are supplied.
 */
export function detectRegime(candles: readonly Candle[], opts?: RegimeOpts): RegimeClassification {
  const minCandles = opts?.minCandles ?? 30;
  if (candles.length < minCandles) {
    throw new Error(
      `At least ${minCandles} candles are required for regime detection (got ${candles.length})`,
    );
  }
  const emaFastPeriod = opts?.emaFast ?? 10;
  const emaSlowPeriod = opts?.emaSlow ?? 30;
  const adxPeriod = opts?.adxPeriod ?? 14;
  const atrPeriod = opts?.atrPeriod ?? 14;
  const hurstWindow = opts?.hurstWindow ?? 50;

  const close = candles.map((c) => c.close);
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const volume = candles.map((c) => c.volume);

  const emaFast = emaArr(close, emaFastPeriod);
  const emaSlow = emaArr(close, emaSlowPeriod);
  const lastClose = close[close.length - 1] || 1e-9;
  const emaGapPct =
    Math.abs(
      (emaFast[emaFast.length - 1] - emaSlow[emaSlow.length - 1]) / Math.max(lastClose, 1e-9),
    ) * 100;
  const priceChangePct = (close[close.length - 1] / Math.max(close[0], 1e-9) - 1) * 100;

  // realised volatility (last 30 bars, annualised-via-sqrt for stability)
  const returns: number[] = [];
  for (let i = 1; i < close.length; i++) {
    const prev = close[i - 1];
    if (prev > 0) returns.push((close[i] - prev) / prev);
  }
  const last30 = returns.slice(-30);
  const meanRet = last30.length > 0 ? last30.reduce((a, b) => a + b, 0) / last30.length : 0;
  const variance =
    last30.length > 0 ? last30.reduce((a, b) => a + (b - meanRet) ** 2, 0) / last30.length : 0;
  const std = Math.sqrt(variance);
  const realizedVolPct = std * Math.sqrt(30) * 100;

  // ATR%
  const atr = computeAtr(high, low, close, atrPeriod);
  const lastAtr = atr[atr.length - 1] ?? 0;
  const atrPct = (lastAtr / Math.max(lastClose, 1e-9)) * 100;

  // ATR percentile (rank of last ATR within historical distribution)
  const validAtr = atr.filter((v) => Number.isFinite(v) && v > 0);
  const atrPercentile =
    validAtr.length > 0
      ? (validAtr.filter((v) => v <= lastAtr).length / validAtr.length) * 100
      : 50;

  // Directional efficiency: |net move| / sum(|per-bar moves|) over last 30 bars
  const last30Close = close.slice(-31);
  let netMove = 0;
  let pathLen = 0;
  for (let i = 1; i < last30Close.length; i++) {
    const d = last30Close[i] - last30Close[i - 1];
    netMove += d;
    pathLen += Math.abs(d);
  }
  const directionalEfficiency = pathLen > 1e-9 ? Math.abs(netMove) / pathLen : 0;

  // ADX
  const adxSeries = computeAdx(high, low, close, adxPeriod);
  const adx = adxSeries[adxSeries.length - 1] ?? 0;

  // Hurst exponent (R/S over recent window)
  const hurst = computeHurst(close.slice(-hurstWindow));

  // Trend strength = normalised (emaGapPct * directionalEfficiency * 0..1)
  const trendStrength = Math.min(1, (emaGapPct / 5) * 0.5 + directionalEfficiency * 0.5);

  const indicators: RegimeIndicators = {
    adx: round2(adx),
    atrPercentile: round2(atrPercentile),
    hurst: round3(hurst),
    trendStrength: round3(trendStrength),
    emaGapPct: round2(emaGapPct),
    realizedVolPct: round2(realizedVolPct),
    directionalEfficiency: round3(directionalEfficiency),
    priceChangePct: round2(priceChangePct),
  };

  // Classification (mirrors the Python rule thresholds)
  let regimeKey: RegimeClassification["regimeKey"];
  let confidence: number;

  if (emaGapPct >= 1.0 && directionalEfficiency >= 0.55 && priceChangePct > 1.0) {
    regimeKey = "bull_trend";
    confidence = Math.min(0.99, 0.55 + emaGapPct * 0.12 + directionalEfficiency * 0.3);
  } else if (emaGapPct >= 1.0 && directionalEfficiency >= 0.55 && priceChangePct < -1.0) {
    regimeKey = "bear_trend";
    confidence = Math.min(0.99, 0.55 + emaGapPct * 0.12 + directionalEfficiency * 0.3);
  } else if (realizedVolPct >= 4.5 || atrPct >= 3.5) {
    regimeKey = "high_volatility";
    confidence = Math.min(0.99, 0.5 + Math.max(realizedVolPct / 10, atrPct / 7));
  } else if (emaGapPct <= 0.45 && directionalEfficiency <= 0.38 && atrPct <= 2.0) {
    regimeKey = "range_compression";
    confidence = Math.min(
      0.99,
      0.52 + (0.45 - emaGapPct) * 0.35 + (0.38 - directionalEfficiency) * 0.25,
    );
  } else {
    regimeKey = "transition";
    confidence = 0.55;
  }

  // Map regimeKey → friendly regime
  const regime: Regime =
    regimeKey === "bull_trend"
      ? "trending_up"
      : regimeKey === "bear_trend"
        ? "trending_down"
        : regimeKey === "range_compression"
          ? "ranging"
          : regimeKey === "high_volatility"
            ? "volatile"
            : "quiet";

  return {
    regime,
    regimeKey,
    label: REGIME_LABELS[regimeKey],
    confidence: Math.round(confidence * 100) / 100,
    indicators,
    strategyFamilies: REGIME_FAMILIES[regimeKey],
  };
}

// ---------------------------------------------------------------------------
// Internal math — duplicated from script-runtime (kept local to avoid coupling
// the analysis engine to the strategy runtime module).
// ---------------------------------------------------------------------------

function computeAtr(high: number[], low: number[], close: number[], period: number): number[] {
  const n = high.length;
  const tr = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tr[i] = high[i] - low[i];
      continue;
    }
    const a = high[i] - low[i];
    const b = Math.abs(high[i] - close[i - 1]);
    const c = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(a, b, c);
  }
  const out = new Array<number>(n).fill(NaN);
  if (n < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < n; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

function computeAdx(high: number[], low: number[], close: number[], period: number): number[] {
  const n = high.length;
  const out = new Array<number>(n).fill(NaN);
  if (n < period * 2) return out;
  const plusDM = new Array<number>(n).fill(0);
  const minusDM = new Array<number>(n).fill(0);
  const tr = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = high[i] - high[i - 1];
    const down = low[i - 1] - low[i];
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
    const a = high[i] - low[i];
    const b = Math.abs(high[i] - close[i - 1]);
    const c = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(a, b, c);
  }
  const atr = new Array<number>(n).fill(NaN);
  const plus = new Array<number>(n).fill(NaN);
  const minus = new Array<number>(n).fill(NaN);
  let trSum = 0;
  let plusSum = 0;
  let minusSum = 0;
  for (let i = 1; i <= period; i++) {
    trSum += tr[i];
    plusSum += plusDM[i];
    minusSum += minusDM[i];
  }
  atr[period] = trSum;
  plus[period] = plusSum;
  minus[period] = minusSum;
  for (let i = period + 1; i < n; i++) {
    atr[i] = atr[i - 1] - atr[i - 1] / period + tr[i];
    plus[i] = plus[i - 1] - plus[i - 1] / period + plusDM[i];
    minus[i] = minus[i - 1] - minus[i - 1] / period + minusDM[i];
  }
  const dx = new Array<number>(n).fill(NaN);
  for (let i = period; i < n; i++) {
    if (atr[i] < 1e-12) {
      dx[i] = 0;
      continue;
    }
    const plusDI = (plus[i] / atr[i]) * 100;
    const minusDI = (minus[i] / atr[i]) * 100;
    const sum = plusDI + minusDI;
    dx[i] = sum < 1e-12 ? 0 : (Math.abs(plusDI - minusDI) / sum) * 100;
  }
  let adx = NaN;
  let dxSum = 0;
  let count = 0;
  for (let i = period; i < n; i++) {
    if (Number.isFinite(dx[i])) {
      dxSum += dx[i];
      count++;
      if (count === period) {
        adx = dxSum / period;
        out[i] = adx;
      } else if (count > period) {
        adx = (adx * (period - 1) + dx[i]) / period;
        out[i] = adx;
      }
    }
  }
  return out;
}

/**
 * Estimate Hurst exponent using the rescaled-range (R/S) method.
 * Returns 0..1. Values < 0.5 indicate mean-reversion, > 0.5 trending, ~0.5 random walk.
 */
function computeHurst(values: number[]): number {
  if (values.length < 20) return 0.5;
  const ts = values.filter((v) => Number.isFinite(v));
  if (ts.length < 20) return 0.5;

  // Compute mean-deviation cumulative series
  const mean = ts.reduce((a, b) => a + b, 0) / ts.length;
  const cum = new Array<number>(ts.length).fill(0);
  let acc = 0;
  for (let i = 0; i < ts.length; i++) {
    acc += ts[i] - mean;
    cum[i] = acc;
  }
  const R = Math.max(...cum) - Math.min(...cum);
  // standard deviation of original series
  let sqSum = 0;
  for (const v of ts) sqSum += (v - mean) ** 2;
  const S = Math.sqrt(sqSum / ts.length);
  if (S < 1e-12 || R < 1e-12) return 0.5;
  const rs = R / S;
  // Hurst ≈ log(R/S) / log(N)
  const hurst = Math.log(rs) / Math.log(ts.length);
  return Number.isFinite(hurst) ? Math.max(0, Math.min(1, hurst)) : 0.5;
}

function round2(v: number): number {
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}
function round3(v: number): number {
  return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0;
}

// Re-export indicator math for the scorer (avoid a second import of script-runtime)
export { emaArr, smaArr };
