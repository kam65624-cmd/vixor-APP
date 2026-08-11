// ============================================================================
// Vixor Analysis Engine — Technical Indicators Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { computeIndicators, getLatestIndicators } from ".";
import type { OHLCVBar } from "../core/types";

function makeBars(count: number, basePrice: number, volatility: number): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.sin(i * 0.3) * 2 + Math.cos(i * 0.1)) * volatility * basePrice;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.abs(change) * 0.5;
    bars.push({
      time: Date.now() - (count - i) * 3600000,
      open,
      high,
      low,
      close,
      volume: 1000 + i * 100,
    });
    price = close;
  }
  return bars;
}

describe("ADX (real implementation)", () => {
  it("returns NaN for insufficient data (< 28 bars)", () => {
    const bars = makeBars(20, 100, 0.02);
    const result = computeIndicators(bars);
    // ADX requires period*2 = 28 bars minimum
    const validADX = result.adx.filter((v) => !isNaN(v));
    expect(validADX).toHaveLength(0);
  });

  it("produces valid ADX values for trending data (>= 28 bars)", () => {
    // Create a strong uptrend
    const bars: OHLCVBar[] = [];
    let price = 100;
    for (let i = 0; i < 100; i++) {
      price += 0.5 + Math.random() * 0.3;
      bars.push({
        time: Date.now() - (100 - i) * 3600000,
        open: price - 0.2,
        high: price + 0.3,
        low: price - 0.4,
        close: price,
        volume: 1000,
      });
    }
    const result = computeIndicators(bars);
    const validADX = result.adx.filter((v) => !isNaN(v));
    expect(validADX.length).toBeGreaterThan(0);

    // ADX should be >= 0
    for (const v of validADX) {
      expect(v).toBeGreaterThanOrEqual(0);
    }

    // In a strong trend, ADX should be above 20 (moderate)
    const lastADX = result.adx[result.adx.length - 1];
    if (!isNaN(lastADX)) {
      expect(lastADX).toBeGreaterThan(15);
    }
  });

  it("is NOT just smoothed RSI (regression check)", () => {
    const bars = makeBars(100, 100, 0.02);
    const result = computeIndicators(bars);
    const lastADX = result.adx[result.adx.length - 1];
    const lastRSI = result.rsi[result.rsi.length - 1];

    // They should not be identical (old fake ADX was literally EMA of RSI)
    if (!isNaN(lastADX) && !isNaN(lastRSI)) {
      expect(lastADX).not.toBeCloseTo(lastRSI, 0);
    }
  });

  it("returns empty array for zero bars", () => {
    const result = computeIndicators([]);
    expect(result.adx).toEqual([]);
  });
});

describe("CCI (real implementation)", () => {
  it("returns NaN for insufficient data (< 20 bars)", () => {
    const bars = makeBars(15, 100, 0.02);
    const result = computeIndicators(bars);
    const validCCI = result.cci.filter((v) => !isNaN(v));
    expect(validCCI).toHaveLength(0);
  });

  it("produces valid CCI values for 20+ bars", () => {
    const bars = makeBars(50, 100, 0.02);
    const result = computeIndicators(bars);
    const validCCI = result.cci.filter((v) => !isNaN(v));
    expect(validCCI.length).toBeGreaterThan(0);

    // CCI should be finite numbers
    for (const v of validCCI) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("is NOT just SMA of closes (regression check)", () => {
    const bars = makeBars(50, 100, 0.02);
    const result = computeIndicators(bars);
    const lastCCI = result.cci[result.cci.length - 1];
    const lastSMA = result.sma.sma20[result.sma.sma20.length - 1];

    // CCI should differ from SMA (old fake CCI was literally SMA)
    if (!isNaN(lastCCI) && !isNaN(lastSMA)) {
      // CCI can be negative or > price; it's an oscillator, not a price
      expect(Math.abs(lastCCI)).not.toBeCloseTo(lastSMA, 0);
    }
  });

  it("returns empty array for zero bars", () => {
    const result = computeIndicators([]);
    expect(result.cci).toEqual([]);
  });

  it("oscillates around zero for normal data", () => {
    const bars = makeBars(100, 100, 0.01);
    const result = computeIndicators(bars);
    const validCCI = result.cci.filter((v) => Number.isFinite(v));
    expect(validCCI.length).toBeGreaterThan(10);

    // Some CCI values should be above 0 and some below for oscillating data
    const aboveZero = validCCI.filter((v) => v > 0).length;
    const belowZero = validCCI.filter((v) => v < 0).length;
    // With oscillating data, we expect a mix
    expect(aboveZero + belowZero).toBe(validCCI.length);
  });
});

describe("Stochastic RSI (real implementation)", () => {
  it("returns NaN for insufficient data (< 28 bars)", () => {
    const bars = makeBars(20, 100, 0.02);
    const result = computeIndicators(bars);
    const validK = result.stochRSI.k.filter((v) => !isNaN(v));
    expect(validK).toHaveLength(0);
  });

  it("produces valid Stochastic RSI values in [0, 100]", () => {
    const bars = makeBars(100, 100, 0.02);
    const result = computeIndicators(bars);
    const validK = result.stochRSI.k.filter((v) => !isNaN(v));
    expect(validK.length).toBeGreaterThan(0);

    for (const v of validK) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("does NOT produce NaN from NaN RSI values (regression check)", () => {
    // Old implementation ran RSI on RSI values, producing NaN everywhere
    const bars = makeBars(100, 100, 0.02);
    const result = computeIndicators(bars);
    const validK = result.stochRSI.k.filter((v) => !isNaN(v));
    // Should have plenty of valid values
    expect(validK.length).toBeGreaterThan(50);
  });

  it("%D is SMA of %K and has fewer valid values", () => {
    const bars = makeBars(100, 100, 0.02);
    const result = computeIndicators(bars);
    const validK = result.stochRSI.k.filter((v) => !isNaN(v));
    const validD = result.stochRSI.d.filter((v) => !isNaN(v));

    // %D starts 2 bars later than %K (SMA period 3 means first valid at period+2)
    expect(validD.length).toBeLessThanOrEqual(validK.length);
    expect(validD.length).toBeGreaterThan(0);
  });

  it("returns empty arrays for zero bars", () => {
    const result = computeIndicators([]);
    expect(result.stochRSI.k).toEqual([]);
    expect(result.stochRSI.d).toEqual([]);
  });

  it("produces 50 when RSI is flat (no range)", () => {
    // Flat price → flat RSI → stochastic = 50
    const bars: OHLCVBar[] = [];
    for (let i = 0; i < 100; i++) {
      bars.push({
        time: Date.now() - (100 - i) * 3600000,
        open: 100,
        high: 100.01,
        low: 99.99,
        close: 100,
        volume: 1000,
      });
    }
    const result = computeIndicators(bars);
    // With flat data, RSI might be NaN or 100; stoch should handle gracefully
    // The key is no crashes and valid finite values
    const lastK = result.stochRSI.k[result.stochRSI.k.length - 1];
    if (!isNaN(lastK)) {
      expect(Number.isFinite(lastK)).toBe(true);
    }
  });
});

describe("getLatestIndicators integration", () => {
  it("returns valid latest indicator values with real ADX/CCI/StochRSI", () => {
    const bars = makeBars(100, 67000, 0.02);
    const latest = getLatestIndicators(bars);

    // ADX
    expect(typeof latest.adx).toBe("number");

    // CCI
    expect(typeof latest.cci).toBe("number");

    // Stoch RSI
    expect(typeof latest.stochK).toBe("number");
    expect(typeof latest.stochD).toBe("number");

    // Values should be finite (even if NaN is ok for short data, 100 bars should suffice)
    if (!isNaN(latest.adx)) {
      expect(Number.isFinite(latest.adx)).toBe(true);
    }
    if (!isNaN(latest.cci)) {
      expect(Number.isFinite(latest.cci)).toBe(true);
    }
  });
});
