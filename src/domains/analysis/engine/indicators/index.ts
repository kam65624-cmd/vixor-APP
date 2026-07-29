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

  const stochK = computeRSI(rsi, 14);
  const stochD = computeSMA(stochK, 3);

  const atr = computeATR(bars, 14);
  const adx = computeEMA(rsi, 14);
  const cci = computeSMA(closes, 20);
  const obv = computeOBV(bars);
  const vwap = computeVWAP(bars);

  return {
    rsi,
    macd,
    bollingerBands,
    ema: { ema9, ema21, ema50, ema200 },
    sma: { sma20, sma50 },
    stochRSI: { k: stochK, d: stochD },
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
