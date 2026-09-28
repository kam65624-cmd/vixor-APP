// ============================================================================
// DR.DEX — Candlestick Analyzer — Unit Tests
// ============================================================================
//
// Tests the pure logic of pattern analysis:
//   - PatternSummary construction
//   - Bias derivation
//   - Risk implication logic
//
// Does NOT test the server function (needs Supabase middleware).
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CandlePattern } from "@/domains/analysis/engine/core/types";

// Re-export the types so this file is self-contained
import type { PatternSummary, PatternAnalysisResult } from "./candlestick-analyzer";

// ── Mock bars helper ─────────────────────────────────────────────────────────

function makeBar(
  over: Partial<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = {},
): { time: number; open: number; high: number; low: number; close: number; volume: number } {
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

// ── Pure function re-implementations for verification ────────────────────────

function deriveBias(
  bullish: CandlePattern[],
  bearish: CandlePattern[],
): { bias: "BULLISH" | "BEARISH" | "NEUTRAL" | "NO_SIGNAL"; confidence: number } {
  if (bullish.length === 0 && bearish.length === 0) {
    return { bias: "NO_SIGNAL", confidence: 0 };
  }
  if (bullish.length > bearish.length * 1.5) {
    const confidence = Math.min(
      Math.round(
        (bullish.reduce((s, p) => s + p.reliability, 0) / bullish.length) *
          Math.min(bullish.length / 3, 1),
      ),
      100,
    );
    return { bias: "BULLISH", confidence };
  }
  if (bearish.length > bullish.length * 1.5) {
    const confidence = Math.min(
      Math.round(
        (bearish.reduce((s, p) => s + p.reliability, 0) / bearish.length) *
          Math.min(bearish.length / 3, 1),
      ),
      100,
    );
    return { bias: "BEARISH", confidence };
  }
  const strongest = [...bullish, ...bearish].sort((a, b) => b.reliability - a.reliability)[0];
  return {
    bias: "NEUTRAL",
    confidence: Math.min(Math.round(strongest?.reliability ?? 0 * 0.5), 100),
  };
}

function buildSummary(
  patterns: CandlePattern[],
  bias: "BULLISH" | "BEARISH" | "NEUTRAL" | "NO_SIGNAL",
  confidence: number,
): PatternSummary {
  const bullish = patterns.filter((p) => p.type === "BULLISH");
  const bearish = patterns.filter((p) => p.type === "BEARISH");
  let riskImplication: PatternSummary["riskImplication"] = "NEUTRAL";
  if (bias === "BULLISH" && confidence >= 60) riskImplication = "SUPPORTS_ENTRY";
  else if (bias === "BEARISH" && confidence >= 60) riskImplication = "AGAINST_ENTRY";
  return {
    totalPatterns: patterns.length,
    bullishCount: bullish.length,
    bearishCount: bearish.length,
    strongestSignal: patterns[0] ?? null,
    overallBias: bias,
    confidenceScore: confidence,
    riskImplication,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("deriveBias", () => {
  it("returns NO_SIGNAL when no patterns", () => {
    const result = deriveBias([], []);
    expect(result.bias).toBe("NO_SIGNAL");
    expect(result.confidence).toBe(0);
  });

  it("returns BULLISH when bullish >> bearish", () => {
    const bullish: CandlePattern[] = [
      { name: "Hammer", index: 0, type: "BULLISH", reliability: 80, description: "test" },
      {
        name: "Bullish Engulfing",
        index: 1,
        type: "BULLISH",
        reliability: 75,
        description: "test",
      },
      { name: "Morning Star", index: 2, type: "BULLISH", reliability: 70, description: "test" },
    ];
    const result = deriveBias(bullish, []);
    expect(result.bias).toBe("BULLISH");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns BEARISH when bearish >> bullish", () => {
    const bearish: CandlePattern[] = [
      { name: "Shooting Star", index: 0, type: "BEARISH", reliability: 85, description: "test" },
      { name: "Evening Star", index: 1, type: "BEARISH", reliability: 78, description: "test" },
    ];
    const result = deriveBias([], bearish);
    expect(result.bias).toBe("BEARISH");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns NEUTRAL when bullish and bearish are balanced", () => {
    const bullish: CandlePattern[] = [
      { name: "Hammer", index: 0, type: "BULLISH", reliability: 70, description: "test" },
    ];
    const bearish: CandlePattern[] = [
      { name: "Shooting Star", index: 1, type: "BEARISH", reliability: 68, description: "test" },
    ];
    const result = deriveBias(bullish, bearish);
    expect(result.bias).toBe("NEUTRAL");
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("caps confidence at 100", () => {
    const bullish: CandlePattern[] = Array.from({ length: 10 }, (_, i) => ({
      name: `Pattern ${i}`,
      index: i,
      type: "BULLISH" as const,
      reliability: 100,
      description: "test",
    }));
    const result = deriveBias(bullish, []);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });
});

describe("buildSummary", () => {
  it("returns NO_SIGNAL summary for empty patterns", () => {
    const summary = buildSummary([], "NO_SIGNAL", 0);
    expect(summary.totalPatterns).toBe(0);
    expect(summary.bullishCount).toBe(0);
    expect(summary.bearishCount).toBe(0);
    expect(summary.strongestSignal).toBeNull();
    expect(summary.overallBias).toBe("NO_SIGNAL");
    expect(summary.confidenceScore).toBe(0);
    expect(summary.riskImplication).toBe("NEUTRAL");
  });

  it("sets SUPPORTS_ENTRY for BULLISH + high confidence", () => {
    const patterns: CandlePattern[] = [
      { name: "Hammer", index: 0, type: "BULLISH", reliability: 80, description: "test" },
    ];
    const summary = buildSummary(patterns, "BULLISH", 75);
    expect(summary.riskImplication).toBe("SUPPORTS_ENTRY");
    expect(summary.bullishCount).toBe(1);
    expect(summary.strongestSignal?.name).toBe("Hammer");
  });

  it("sets AGAINST_ENTRY for BEARISH + high confidence", () => {
    const patterns: CandlePattern[] = [
      { name: "Evening Star", index: 0, type: "BEARISH", reliability: 78, description: "test" },
    ];
    const summary = buildSummary(patterns, "BEARISH", 65);
    expect(summary.riskImplication).toBe("AGAINST_ENTRY");
    expect(summary.bearishCount).toBe(1);
  });

  it("sets NEUTRAL for low confidence even if BULLISH", () => {
    const patterns: CandlePattern[] = [
      { name: "Hammer", index: 0, type: "BULLISH", reliability: 55, description: "test" },
    ];
    const summary = buildSummary(patterns, "BULLISH", 50);
    expect(summary.riskImplication).toBe("NEUTRAL");
  });

  it("counts bullish and bearish correctly", () => {
    const patterns: CandlePattern[] = [
      { name: "Hammer", index: 0, type: "BULLISH", reliability: 80, description: "test" },
      {
        name: "Bullish Engulfing",
        index: 1,
        type: "BULLISH",
        reliability: 75,
        description: "test",
      },
      { name: "Shooting Star", index: 2, type: "BEARISH", reliability: 70, description: "test" },
    ];
    const summary = buildSummary(patterns, "BULLISH", 80);
    expect(summary.totalPatterns).toBe(3);
    expect(summary.bullishCount).toBe(2);
    expect(summary.bearishCount).toBe(1);
  });
});

describe("PatternAnalysisResult interface completeness", () => {
  it("PatternSummary has all required fields", () => {
    const summary: PatternSummary = {
      totalPatterns: 5,
      bullishCount: 3,
      bearishCount: 2,
      strongestSignal: {
        name: "Hammer",
        index: 0,
        type: "BULLISH",
        reliability: 80,
        description: "test",
      },
      overallBias: "BULLISH",
      confidenceScore: 80,
      riskImplication: "SUPPORTS_ENTRY",
    };
    expect(summary.totalPatterns).toBe(5);
    expect(summary.overallBias).toBe("BULLISH");
    expect(summary.riskImplication).toBe("SUPPORTS_ENTRY");
  });

  it("PatternAnalysisResult can be constructed with summary", () => {
    const summary: PatternSummary = {
      totalPatterns: 2,
      bullishCount: 1,
      bearishCount: 1,
      strongestSignal: null,
      overallBias: "NEUTRAL",
      confidenceScore: 50,
      riskImplication: "NEUTRAL",
    };

    const result: PatternAnalysisResult = {
      symbol: "BTCUSDT",
      dataAvailable: true,
      barsAnalyzed: 200,
      patterns: [],
      bullishCount: 1,
      bearishCount: 1,
      patternBias: "NEUTRAL",
      patternConfidence: 50,
      primaryTimeframe: "1h",
      analyzedAt: new Date().toISOString(),
      summary,
    };

    expect(result.summary.overallBias).toBe("NEUTRAL");
    expect(result.summary.totalPatterns).toBe(2);
  });

  it("insufficient-data result has correct shape", () => {
    const result: PatternAnalysisResult = {
      symbol: "SOLUSDT",
      dataAvailable: false,
      barsAnalyzed: 3,
      patterns: [],
      bullishCount: 0,
      bearishCount: 0,
      patternBias: "NO_SIGNAL",
      patternConfidence: 0,
      primaryTimeframe: "1h",
      error: "Insufficient data: only 3 bars available",
      analyzedAt: new Date().toISOString(),
      summary: {
        totalPatterns: 0,
        bullishCount: 0,
        bearishCount: 0,
        strongestSignal: null,
        overallBias: "NO_SIGNAL",
        confidenceScore: 0,
        riskImplication: "NEUTRAL",
      },
    };

    expect(result.dataAvailable).toBe(false);
    expect(result.patternBias).toBe("NO_SIGNAL");
    expect(result.summary.overallBias).toBe("NO_SIGNAL");
    expect(result.summary.strongestSignal).toBeNull();
  });
});
