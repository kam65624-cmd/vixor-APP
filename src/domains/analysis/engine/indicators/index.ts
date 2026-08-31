// ============================================================================
// Vixor Analysis Engine — Technical Indicators Module
// ============================================================================
//
// Integrates the `lightweight-charts-indicators` package (built on oakscriptjs)
// with the Vixor analysis engine, providing a unified interface for computing
// common technical indicators on OHLCVBar data.
//
// The lightweight-charts-indicators package exposes pure-compute `calculate()`
// functions that take `Bar[]` data and return `IndicatorResult` objects with
// plot arrays. Our `OHLCVBar` type is structurally compatible with the
// package's `Bar` type, so no data conversion is needed.
//
// For indicators not available in the package (VWAP), we implement them
// from scratch using well-known mathematical formulas.
// ============================================================================

import { OHLCVBar } from "../core/types";

// ---------------------------------------------------------------------------
// Result of computing all indicators
// ---------------------------------------------------------------------------
export interface IndicatorResults {
  rsi: number[]; // RSI(14) values
  macd: {
    // MACD(12,26,9)
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  bollingerBands: {
    // BB(20,2)
    upper: number[];
    middle: number[];
    lower: number[];
  };
  ema: {
    // EMA values
    ema9: number[];
    ema21: number[];
    ema50: number[];
    ema200: number[];
  };
  sma: {
    // SMA values
    sma20: number[];
    sma50: number[];
  };
  stochRSI: {
    // Stochastic RSI
    k: number[];
    d: number[];
  };
  atr: number[]; // ATR(14) values
  adx: number[]; // ADX(14) values
  cci: number[]; // CCI(20) values
  obv: number[]; // On Balance Volume
  vwap: number[]; // VWAP
}

// Pure TypeScript Technical Indicator Calculations
// ---------------------------------------------------------------------------

function computeSMA(prices: number[], length: number): number[] {
  const res: number[] = new Array(prices.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < prices.length; i++) {
    sum += prices[i];
    if (i >= length) sum -= prices[i - length];
    if (i >= length - 1) res[i] = sum / length;
  }
  return res;
}

function computeEMA(prices: number[], length: number): number[] {
  const res: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < length) return res;
  const k = 2 / (length + 1);
  let sum = 0;
  for (let i = 0; i < length; i++) sum += prices[i];
  let ema = sum / length;
  res[length - 1] = ema;
  for (let i = length; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    res[i] = ema;
  }
  return res;
}

function computeRSI(prices: number[], length = 14): number[] {
  const res: number[] = new Array(prices.length).fill(NaN);
  if (prices.length <= length) return res;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= length;
  avgLoss /= length;

  res[length] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = length + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (length - 1) + gain) / length;
    avgLoss = (avgLoss * (length - 1) + loss) / length;
    res[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return res;
}

function computeMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = computeEMA(prices, fast);
  const emaSlow = computeEMA(prices, slow);
  const macdLine: number[] = new Array(prices.length).fill(NaN);
  for (let i = 0; i < prices.length; i++) {
    if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
      macdLine[i] = emaFast[i] - emaSlow[i];
    }
  }
  const validMacd = macdLine.filter((v) => !isNaN(v));
  const signalValues = computeEMA(validMacd, signal);
  const signalLine: number[] = new Array(prices.length).fill(NaN);
  const histogram: number[] = new Array(prices.length).fill(NaN);

  let validIdx = 0;
  for (let i = 0; i < prices.length; i++) {
    if (!isNaN(macdLine[i])) {
      signalLine[i] = signalValues[validIdx] ?? NaN;
      if (!isNaN(signalLine[i])) {
        histogram[i] = macdLine[i] - signalLine[i];
      }
      validIdx++;
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

function computeBollingerBands(prices: number[], length = 20, mult = 2) {
  const middle = computeSMA(prices, length);
  const upper: number[] = new Array(prices.length).fill(NaN);
  const lower: number[] = new Array(prices.length).fill(NaN);

  for (let i = length - 1; i < prices.length; i++) {
    const slice = prices.slice(i - length + 1, i + 1);
    const mean = middle[i];
    const stdDev = Math.sqrt(slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / length);
    upper[i] = mean + mult * stdDev;
    lower[i] = mean - mult * stdDev;
  }

  return { upper, middle, lower };
}

function computeATR(bars: OHLCVBar[], length = 14): number[] {
  const tr: number[] = new Array(bars.length).fill(NaN);
  if (bars.length === 0) return tr;
  tr[0] = bars[0].high - bars[0].low;
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high;
    const l = bars[i].low;
    const prevC = bars[i - 1].close;
    tr[i] = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
  }
  return computeEMA(tr, length);
}

function computeOBV(bars: OHLCVBar[]): number[] {
  const res: number[] = new Array(bars.length).fill(0);
  if (bars.length === 0) return res;
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].close > bars[i - 1].close) res[i] = res[i - 1] + bars[i].volume;
    else if (bars[i].close < bars[i - 1].close) res[i] = res[i - 1] - bars[i].volume;
    else res[i] = res[i - 1];
  }
  return res;
}

function computeVWAP(bars: OHLCVBar[]): number[] {
  const result: number[] = new Array(bars.length).fill(NaN);
  if (bars.length === 0) return result;

  let cumulativeTPV = 0;
  let cumulativeVol = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const vol = bar.volume || 0;
    cumulativeTPV += typicalPrice * vol;
    cumulativeVol += vol;

    if (cumulativeVol > 0) {
      result[i] = cumulativeTPV / cumulativeVol;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Real ADX implementation with +DI/-DI
// ---------------------------------------------------------------------------
function computeADX(bars: OHLCVBar[], period = 14): number[] {
  const n = bars.length;
  const out: number[] = new Array(n).fill(NaN);
  if (n < period * 2) return out;

  // Step 1: True Range, +DM, -DM
  const tr: number[] = new Array(n).fill(0);
  const plusDM: number[] = new Array(n).fill(0);
  const minusDM: number[] = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevHigh = bars[i - 1].high;
    const prevLow = bars[i - 1].low;
    const prevClose = bars[i - 1].close;

    tr[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }

  // Step 2: Wilder's smoothing (EMA with alpha = 1/period)
  // Seed: sum of first `period` values (indices 1..period)
  let trSum = 0;
  let plusSum = 0;
  let minusSum = 0;
  for (let i = 1; i <= period; i++) {
    trSum += tr[i];
    plusSum += plusDM[i];
    minusSum += minusDM[i];
  }

  const smoothTR: number[] = new Array(n).fill(NaN);
  const smoothPlus: number[] = new Array(n).fill(NaN);
  const smoothMinus: number[] = new Array(n).fill(NaN);
  smoothTR[period] = trSum;
  smoothPlus[period] = plusSum;
  smoothMinus[period] = minusSum;

  for (let i = period + 1; i < n; i++) {
    smoothTR[i] = smoothTR[i - 1] - smoothTR[i - 1] / period + tr[i];
    smoothPlus[i] = smoothPlus[i - 1] - smoothPlus[i - 1] / period + plusDM[i];
    smoothMinus[i] = smoothMinus[i - 1] - smoothMinus[i - 1] / period + minusDM[i];
  }

  // Step 3: +DI, -DI, DX
  const dx: number[] = new Array(n).fill(NaN);
  for (let i = period; i < n; i++) {
    if (smoothTR[i] < 1e-12) {
      dx[i] = 0;
      continue;
    }
    const plusDI = (smoothPlus[i] / smoothTR[i]) * 100;
    const minusDI = (smoothMinus[i] / smoothTR[i]) * 100;
    const diSum = plusDI + minusDI;
    dx[i] = diSum < 1e-12 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
  }

  // Step 4: ADX = Wilder's smoothing of DX
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

// ---------------------------------------------------------------------------
// Real CCI implementation
// ---------------------------------------------------------------------------
function computeCCI(bars: OHLCVBar[], period = 20): number[] {
  const n = bars.length;
  const out: number[] = new Array(n).fill(NaN);
  if (n < period) return out;

  // Typical Price = (high + low + close) / 3
  const tp: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    tp[i] = (bars[i].high + bars[i].low + bars[i].close) / 3;
  }

  // SMA of TP
  const smaTP = computeSMA(tp, period);

  // Mean Deviation = SMA of |TP - SMA_TP|
  for (let i = period - 1; i < n; i++) {
    const slice = tp.slice(i - period + 1, i + 1);
    const meanTP = smaTP[i]!;
    let meanDev = 0;
    for (let j = 0; j < period; j++) {
      meanDev += Math.abs(slice[j] - meanTP);
    }
    meanDev /= period;

    if (meanDev < 1e-12) {
      out[i] = 0;
    } else {
      out[i] = (tp[i] - meanTP) / (0.015 * meanDev);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// NaN-safe SMA — skips NaN values when computing the average.
// Used for smoothing Stochastic %K where leading NaN values exist.
// ---------------------------------------------------------------------------
function computeSMANaN(prices: number[], length: number): number[] {
  const res: number[] = new Array(prices.length).fill(NaN);
  for (let i = length - 1; i < prices.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - length + 1; j <= i; j++) {
      if (Number.isFinite(prices[j])) {
        sum += prices[j];
        count++;
      }
    }
    if (count >= length) {
      res[i] = sum / count;
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// Real Stochastic RSI implementation
// ---------------------------------------------------------------------------
function computeStochasticRSI(
  prices: number[],
  rsiPeriod = 14,
  stochPeriod = 14,
  smoothPeriod = 3,
): { k: number[]; d: number[] } {
  const rsi = computeRSI(prices, rsiPeriod);
  const n = rsi.length;
  const k: number[] = new Array(n).fill(NaN);

  // Apply Stochastic formula on RSI values
  for (let i = stochPeriod + rsiPeriod - 1; i < n; i++) {
    const window = rsi.slice(i - stochPeriod + 1, i + 1);
    const valid = window.filter((v) => Number.isFinite(v));
    if (valid.length === 0) continue;

    const minRSI = Math.min(...valid);
    const maxRSI = Math.max(...valid);
    const currentRSI = rsi[i];

    if (!Number.isFinite(currentRSI)) continue;

    const range = maxRSI - minRSI;
    if (range < 1e-12) {
      k[i] = 50; // Flat RSI → middle stochastic
    } else {
      k[i] = ((currentRSI - minRSI) / range) * 100;
    }
  }

  // %D = NaN-safe SMA of %K
  const d = computeSMANaN(k, smoothPeriod);

  return { k, d };
}

// ---------------------------------------------------------------------------
// computeIndicators — main function
// ---------------------------------------------------------------------------
export function computeIndicators(bars: OHLCVBar[]): IndicatorResults {
  const n = bars.length;

  if (n === 0) {
    const emptyArr = (): number[] => [];
    return {
      rsi: emptyArr(),
      macd: { macd: emptyArr(), signal: emptyArr(), histogram: emptyArr() },
      bollingerBands: { upper: emptyArr(), middle: emptyArr(), lower: emptyArr() },
      ema: { ema9: emptyArr(), ema21: emptyArr(), ema50: emptyArr(), ema200: emptyArr() },
      sma: { sma20: emptyArr(), sma50: emptyArr() },
      stochRSI: { k: emptyArr(), d: emptyArr() },
      atr: emptyArr(),
      adx: emptyArr(),
      cci: emptyArr(),
      obv: emptyArr(),
      vwap: emptyArr(),
    };
  }

  const closes = bars.map((b) => b.close);

  const rsi = computeRSI(closes, 14);
  const macd = computeMACD(closes, 12, 26, 9);
  const bollingerBands = computeBollingerBands(closes, 20, 2);

  const ema9 = computeEMA(closes, 9);
  const ema21 = computeEMA(closes, 21);
  const ema50 = computeEMA(closes, 50);
  const ema200 = computeEMA(closes, 200);

  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);

  const stochRSI = computeStochasticRSI(closes, 14, 14, 3);

  const atr = computeATR(bars, 14);
  const adx = computeADX(bars, 14);
  const cci = computeCCI(bars, 20);
  const obv = computeOBV(bars);
  const vwap = computeVWAP(bars);

  return {
    rsi,
    macd,
    bollingerBands,
    ema: { ema9, ema21, ema50, ema200 },
    sma: { sma20, sma50 },
    stochRSI: { k: stochRSI.k, d: stochRSI.d },
    atr,
    adx,
    cci,
    obv,
    vwap,
  };
}

// ---------------------------------------------------------------------------
// getLatestIndicators — extract the latest (most recent) indicator values
// ---------------------------------------------------------------------------
export function getLatestIndicators(bars: OHLCVBar[]): {
  rsi: number;
  macdHistogram: number;
  bollingerPosition: number; // 0-1 where price is within bands
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  emaTrend: "BULLISH" | "BEARISH" | "NEUTRAL";
  adx: number;
  stochK: number;
  stochD: number;
  cci: number;
  atr: number;
  volumeTrend: "RISING" | "FALLING" | "NEUTRAL";
} {
  if (bars.length === 0) {
    return {
      rsi: NaN,
      macdHistogram: NaN,
      bollingerPosition: NaN,
      ema9: NaN,
      ema21: NaN,
      ema50: NaN,
      ema200: NaN,
      emaTrend: "NEUTRAL",
      adx: NaN,
      stochK: NaN,
      stochD: NaN,
      cci: NaN,
      atr: NaN,
      volumeTrend: "NEUTRAL",
    };
  }

  const indicators = computeIndicators(bars);
  const last = bars.length - 1;

  // Bollinger position: 0 = at lower band, 1 = at upper band
  let bollingerPosition = NaN;
  const bbUpper = indicators.bollingerBands.upper[last];
  const bbLower = indicators.bollingerBands.lower[last];
  const bbMiddle = indicators.bollingerBands.middle[last];
  const closePrice = bars[last].close;

  if (!isNaN(bbUpper) && !isNaN(bbLower) && !isNaN(bbMiddle) && bbUpper !== bbLower) {
    bollingerPosition = (closePrice - bbLower) / (bbUpper - bbLower);
    // Clamp to [0, 1] for extreme moves outside bands
    bollingerPosition = Math.max(0, Math.min(1, bollingerPosition));
  } else if (!isNaN(bbMiddle)) {
    // If bands are equal (zero width), check if price is above/below
    bollingerPosition = closePrice >= bbMiddle ? 1 : 0;
  }

  // EMA trend: check alignment of EMA9 > EMA21 > EMA50 > EMA200
  const ema9Val = indicators.ema.ema9[last];
  const ema21Val = indicators.ema.ema21[last];
  const ema50Val = indicators.ema.ema50[last];
  const ema200Val = indicators.ema.ema200[last];

  let emaTrend: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";

  // Only determine trend if at least EMA9 and EMA21 are available
  if (!isNaN(ema9Val) && !isNaN(ema21Val)) {
    if (!isNaN(ema50Val) && !isNaN(ema200Val)) {
      // Full alignment check
      if (ema9Val > ema21Val && ema21Val > ema50Val && ema50Val > ema200Val) {
        emaTrend = "BULLISH";
      } else if (ema9Val < ema21Val && ema21Val < ema50Val && ema50Val < ema200Val) {
        emaTrend = "BEARISH";
      }
    } else if (!isNaN(ema50Val)) {
      // Partial alignment with EMA9, EMA21, EMA50
      if (ema9Val > ema21Val && ema21Val > ema50Val) {
        emaTrend = "BULLISH";
      } else if (ema9Val < ema21Val && ema21Val < ema50Val) {
        emaTrend = "BEARISH";
      }
    } else {
      // Just EMA9 and EMA21
      if (ema9Val > ema21Val) {
        emaTrend = "BULLISH";
      } else if (ema9Val < ema21Val) {
        emaTrend = "BEARISH";
      }
    }
  }

  // Volume trend: compare recent average volume to longer-term average
  let volumeTrend: "RISING" | "FALLING" | "NEUTRAL" = "NEUTRAL";
  if (bars.length >= 20) {
    const recentVol = bars.slice(-5).reduce((sum, b) => sum + b.volume, 0) / 5;
    const longerVol = bars.slice(-20).reduce((sum, b) => sum + b.volume, 0) / 20;

    if (recentVol > longerVol * 1.2) {
      volumeTrend = "RISING";
    } else if (recentVol < longerVol * 0.8) {
      volumeTrend = "FALLING";
    }
  }

  return {
    rsi: indicators.rsi[last],
    macdHistogram: indicators.macd.histogram[last],
    bollingerPosition,
    ema9: ema9Val,
    ema21: ema21Val,
    ema50: ema50Val,
    ema200: ema200Val,
    emaTrend,
    adx: indicators.adx[last],
    stochK: indicators.stochRSI.k[last],
    stochD: indicators.stochRSI.d[last],
    cci: indicators.cci[last],
    atr: indicators.atr[last],
    volumeTrend,
  };
}

// ---------------------------------------------------------------------------
// getRSIStatus — determine overbought/oversold status from RSI
// ---------------------------------------------------------------------------
export function getRSIStatus(rsi: number): "OVERBOUGHT" | "OVERSOLD" | "NEUTRAL" {
  if (isNaN(rsi)) return "NEUTRAL";
  if (rsi >= 70) return "OVERBOUGHT";
  if (rsi <= 30) return "OVERSOLD";
  return "NEUTRAL";
}

// ---------------------------------------------------------------------------
// getADXStrength — get trend strength from ADX
// ---------------------------------------------------------------------------
export function getADXStrength(adx: number): "STRONG" | "MODERATE" | "WEAK" {
  if (isNaN(adx)) return "WEAK";
  if (adx >= 25) return "STRONG";
  if (adx >= 20) return "MODERATE";
  return "WEAK";
}

// ---------------------------------------------------------------------------
// checkEMAAlignment — check EMA alignment for trend confirmation
// ---------------------------------------------------------------------------
export function checkEMAAlignment(
  ema9: number,
  ema21: number,
  ema50: number,
  ema200: number,
): {
  alignment: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number; // 0-100
} {
  // Count how many EMA pairs are in bullish/bearish alignment
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalPairs = 0;

  // EMA9 vs EMA21
  if (!isNaN(ema9) && !isNaN(ema21)) {
    totalPairs++;
    if (ema9 > ema21) bullishSignals++;
    else if (ema9 < ema21) bearishSignals++;
  }

  // EMA21 vs EMA50
  if (!isNaN(ema21) && !isNaN(ema50)) {
    totalPairs++;
    if (ema21 > ema50) bullishSignals++;
    else if (ema21 < ema50) bearishSignals++;
  }

  // EMA50 vs EMA200
  if (!isNaN(ema50) && !isNaN(ema200)) {
    totalPairs++;
    if (ema50 > ema200) bullishSignals++;
    else if (ema50 < ema200) bearishSignals++;
  }

  // EMA9 vs EMA50 (faster momentum)
  if (!isNaN(ema9) && !isNaN(ema50)) {
    totalPairs++;
    if (ema9 > ema50) bullishSignals++;
    else if (ema9 < ema50) bearishSignals++;
  }

  // EMA9 vs EMA200 (fastest vs slowest)
  if (!isNaN(ema9) && !isNaN(ema200)) {
    totalPairs++;
    if (ema9 > ema200) bullishSignals++;
    else if (ema9 < ema200) bearishSignals++;
  }

  if (totalPairs === 0) {
    return { alignment: "NEUTRAL", strength: 0 };
  }

  const netBullish = bullishSignals - bearishSignals;

  let alignment: "BULLISH" | "BEARISH" | "NEUTRAL";
  let strength: number;

  if (netBullish > 0) {
    alignment = "BULLISH";
    strength = (bullishSignals / totalPairs) * 100;
  } else if (netBullish < 0) {
    alignment = "BEARISH";
    strength = (bearishSignals / totalPairs) * 100;
  } else {
    alignment = "NEUTRAL";
    strength = 50;
  }

  return { alignment, strength: Math.round(strength) };
}
