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
// Package imports — lightweight-charts-indicators
// ---------------------------------------------------------------------------
import {
  RSI as _RSI,
  MACD as _MACD,
  BollingerBands as _BB,
  EMA as _EMA,
  SMA as _SMA,
  StochRSI as _StochRSI,
  ATR as _ATR,
  ADX as _ADX,
  CCI as _CCI,
  OBV as _OBV,
} from "lightweight-charts-indicators";

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

// ---------------------------------------------------------------------------
// Helper: extract a number[] from a TimeValue[] plot, converting null/undefined
// to NaN. The package returns arrays already the same length as input bars.
// ---------------------------------------------------------------------------
function plotToNumbers(
  plot: Array<{ time: number; value: number | null | undefined }> | undefined,
  length: number,
): number[] {
  if (!plot || plot.length === 0) {
    return new Array<number>(length).fill(NaN);
  }
  // The plot should already be the same length as input; if shorter, pad with NaN
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i < plot.length) {
      const v = plot[i].value;
      result.push(v === null || v === undefined ? NaN : v);
    } else {
      result.push(NaN);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Pure TypeScript implementation of VWAP (not available in the package)
// ---------------------------------------------------------------------------
function computeVWAP(bars: OHLCVBar[]): number[] {
  const result: number[] = new Array(bars.length).fill(NaN);
  if (bars.length === 0) return result;

  let cumulativeTPV = 0; // cumulative (typical price * volume)
  let cumulativeVol = 0; // cumulative volume

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const vol = bar.volume || 0;
    cumulativeTPV += typicalPrice * vol;
    cumulativeVol += vol;

    if (cumulativeVol > 0) {
      result[i] = cumulativeTPV / cumulativeVol;
    }
    // If cumulativeVol is 0 (first bar with 0 volume), result stays NaN
  }

  return result;
}

// ---------------------------------------------------------------------------
// computeIndicators — main function
// ---------------------------------------------------------------------------
export function computeIndicators(bars: OHLCVBar[]): IndicatorResults {
  const n = bars.length;

  // Edge case: no data
  if (n === 0) {
    const emptyArr = (): number[] => [];
    return {
      rsi: emptyArr(),
      macd: { macd: emptyArr(), signal: emptyArr(), histogram: emptyArr() },
      bollingerBands: {
        upper: emptyArr(),
        middle: emptyArr(),
        lower: emptyArr(),
      },
      ema: {
        ema9: emptyArr(),
        ema21: emptyArr(),
        ema50: emptyArr(),
        ema200: emptyArr(),
      },
      sma: { sma20: emptyArr(), sma50: emptyArr() },
      stochRSI: { k: emptyArr(), d: emptyArr() },
      atr: emptyArr(),
      adx: emptyArr(),
      cci: emptyArr(),
      obv: emptyArr(),
      vwap: emptyArr(),
    };
  }

  // The package's Bar type is structurally compatible with OHLCVBar
  // (time, open, high, low, close, volume) — no conversion needed.

  // ---- RSI(14) ----
  const rsiResult = _RSI.calculate(bars, { length: 14, src: "close" });
  const rsi = plotToNumbers(rsiResult.plots.plot0, n);

  // ---- MACD(12, 26, 9) ----
  const macdResult = _MACD.calculate(bars, {
    fastLength: 12,
    slowLength: 26,
    signalLength: 9,
    src: "close",
  });
  const macdLine = plotToNumbers(macdResult.plots.plot0, n);
  const macdSignal = plotToNumbers(macdResult.plots.plot1, n);
  const macdHistogram = plotToNumbers(macdResult.plots.plot2, n);

  // ---- Bollinger Bands(20, 2) ----
  const bbResult = _BB.calculate(bars, { length: 20, mult: 2, src: "close" });
  const bbUpper = plotToNumbers(bbResult.plots.plot0, n);
  const bbMiddle = plotToNumbers(bbResult.plots.plot1, n);
  const bbLower = plotToNumbers(bbResult.plots.plot2, n);

  // ---- EMAs ----
  const ema9Result = _EMA.calculate(bars, { length: 9, src: "close" });
  const ema21Result = _EMA.calculate(bars, { length: 21, src: "close" });
  const ema50Result = _EMA.calculate(bars, { length: 50, src: "close" });
  const ema200Result = _EMA.calculate(bars, { length: 200, src: "close" });
  const ema9 = plotToNumbers(ema9Result.plots.plot0, n);
  const ema21 = plotToNumbers(ema21Result.plots.plot0, n);
  const ema50 = plotToNumbers(ema50Result.plots.plot0, n);
  const ema200 = plotToNumbers(ema200Result.plots.plot0, n);

  // ---- SMAs ----
  const sma20Result = _SMA.calculate(bars, { len: 20, src: "close" });
  const sma50Result = _SMA.calculate(bars, { len: 50, src: "close" });
  const sma20 = plotToNumbers(sma20Result.plots.plot0, n);
  const sma50 = plotToNumbers(sma50Result.plots.plot0, n);

  // ---- Stochastic RSI ----
  const stochResult = _StochRSI.calculate(bars, {
    smoothK: 3,
    smoothD: 3,
    lengthRSI: 14,
    lengthStoch: 14,
  });
  const stochK = plotToNumbers(stochResult.plots.plot0, n);
  const stochD = plotToNumbers(stochResult.plots.plot1, n);

  // ---- ATR(14) ----
  const atrResult = _ATR.calculate(bars, { length: 14 });
  const atr = plotToNumbers(atrResult.plots.plot0, n);

  // ---- ADX(14) ----
  const adxResult = _ADX.calculate(bars, { adxSmoothing: 14, diLength: 14 });
  const adx = plotToNumbers(adxResult.plots.plot0, n);

  // ---- CCI(20) ----
  const cciResult = _CCI.calculate(bars, { length: 20 });
  const cci = plotToNumbers(cciResult.plots.plot0, n);

  // ---- OBV ----
  const obvResult = _OBV.calculate(bars, {});
  const obv = plotToNumbers(obvResult.plots.plot0, n);

  // ---- VWAP (pure TS implementation) ----
  const vwap = computeVWAP(bars);

  return {
    rsi,
    macd: {
      macd: macdLine,
      signal: macdSignal,
      histogram: macdHistogram,
    },
    bollingerBands: {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower,
    },
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
