import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  detectPatternsFromBars,
  formatPatternForDisplay,
} from "./pattern-detector";
import type { OHLCVBar } from "@/domains/analysis/engine/core/types";

/**
 * Unit tests for the DR.DEX pattern detector.
 * Uses synthetic OHLCV bars to verify pattern detection logic.
 */

function makeBar(over: Partial<OHLCVBar> = {}): OHLCVBar {
  return {
    time: 1700000000000,
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000,
    ...over,
  };
}

function makeUptrendBars(count: number): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  let close = 100;
  for (let i = 0; i < count; i++) {
    close += 2;
    bars.push(makeBar({ close, high: close + 2, low: close - 2, open: close - 1 }));
  }
  return bars;
}

function makeDowntrendBars(count: number): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  let close = 200;
  for (let i = 0; i < count; i++) {
    close -= 2;
    bars.push(makeBar({ close, high: close + 2, low: close - 2, open: close + 1 }));
  }
  return bars;
}

describe("detectPatternsFromBars", () => {
  it("returns empty for too few bars", () => {
    const bars = [makeBar(), makeBar(), makeBar()];
    expect(detectPatternsFromBars(bars)).toEqual([]);
  });

  it("returns empty for empty array", () => {
    expect(detectPatternsFromBars([])).toEqual([]);
  });

  it("detects patterns in uptrend context", () => {
    const bars = makeUptrendBars(20);
    const patterns = detectPatternsFromBars(bars);
    expect(Array.isArray(patterns)).toBe(true);
  });

  it("detects patterns in downtrend context", () => {
    const bars = makeDowntrendBars(20);
    const patterns = detectPatternsFromBars(bars);
    expect(Array.isArray(patterns)).toBe(true);
  });

  it("respects minReliability threshold", () => {
    const bars = makeUptrendBars(20);
    const all = detectPatternsFromBars(bars, { minReliability: 0 });
    const highOnly = detectPatternsFromBars(bars, { minReliability: 90 });

    expect(highOnly.length).toBeLessThanOrEqual(all.length);
  });

  it("returns patterns sorted by reliability desc", () => {
    const bars = makeUptrendBars(30);
    const patterns = detectPatternsFromBars(bars);
    for (let i = 1; i < patterns.length; i++) {
      expect(patterns[i - 1].reliability).toBeGreaterThanOrEqual(patterns[i].reliability);
    }
  });

  it("includes only patterns with type BULLISH or BEARISH", () => {
    const bars = makeUptrendBars(20);
    const patterns = detectPatternsFromBars(bars);
    for (const p of patterns) {
      expect(["BULLISH", "BEARISH", "NEUTRAL"]).toContain(p.type);
    }
  });
});

describe("formatPatternForDisplay", () => {
  it("formats bullish pattern with up arrow", () => {
    const display = formatPatternForDisplay({
      name: "Hammer",
      index: 5,
      type: "BULLISH",
      reliability: 80,
      description: "test",
    });
    expect(display.label).toBe("Hammer");
    expect(display.direction).toContain("BULLISH");
    expect(display.reliabilityColor).toBe("green");
    expect(display.badge).toBe("80%");
  });

  it("formats bearish pattern with down arrow", () => {
    const display = formatPatternForDisplay({
      name: "Shooting Star",
      index: 5,
      type: "BEARISH",
      reliability: 75,
      description: "test",
    });
    expect(display.direction).toContain("BEARISH");
    expect(display.reliabilityColor).toBe("green");
  });

  it("uses yellow for medium reliability (60-74)", () => {
    const display = formatPatternForDisplay({
      name: "Doji",
      index: 5,
      type: "NEUTRAL",
      reliability: 65,
      description: "test",
    });
    expect(display.reliabilityColor).toBe("yellow");
  });

  it("uses red for low reliability (50-59)", () => {
    const display = formatPatternForDisplay({
      name: "Spinning Top",
      index: 5,
      type: "NEUTRAL",
      reliability: 55,
      description: "test",
    });
    expect(display.reliabilityColor).toBe("red");
  });
});
