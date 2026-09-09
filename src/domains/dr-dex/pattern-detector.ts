/**
 * VIXOR — DR.DEX Pattern Detection Engine
 * ==========================================
 *
 * Wires DR.DEX to the 74 candlestick patterns in:
 *   src/domains/analysis/engine/patterns/candlestick-patterns.ts
 *
 * Also includes chart formation detection from:
 *   src/domains/analysis/engine/patterns/chart-formations.ts
 *
 * Usage:
 *   const patterns = await detectPatternsForSymbol({ symbol: 'BTCUSDT', interval: '1h' });
 *   // → CandlePattern[] sorted by reliability
 */

import type { OHLCVBar } from "@/domains/analysis/engine/core/types";
import { detectCandlestickPatterns } from "@/domains/analysis/engine/patterns/candlestick-patterns";
import type { CandlePattern } from "@/domains/analysis/engine/core/types";

export type { CandlePattern, OHLCVBar };

// ── Input / Output types ──────────────────────────────────────────────────────

export interface PatternDetectionParams {
  /** Binance symbol, e.g. "BTCUSDT", "SOLUSDT" */
  symbol: string;
  /** Timeframe — default "1h" for swing trading decisions */
  interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
  /** Number of candles to analyze — more = better context */
  limit?: number;
  /** Minimum reliability threshold — patterns below this are dropped */
  minReliability?: number;
  /** Use testnet */
  testnet?: boolean;
}

export interface PatternDetectionResult {
  symbol: string;
  interval: string;
  /** All detected patterns, sorted by reliability descending */
  patterns: CandlePattern[];
  /** Bullish patterns only */
  bullishSignals: CandlePattern[];
  /** Bearish patterns only */
  bearishSignals: CandlePattern[];
  /** Summary for DR.DEX decision */
  summary: PatternSummary;
  analyzedAt: string;
}

export interface PatternSummary {
  totalPatterns: number;
  bullishCount: number;
  bearishCount: number;
  strongestSignal: CandlePattern | null;
  overallBias: "BULLISH" | "BEARISH" | "NEUTRAL" | "NO_SIGNAL";
  confidenceScore: number; // 0-100
  riskImplication: "SUPPORTS_ENTRY" | "AGAINST_ENTRY" | "NEUTRAL";
}

// ── Pattern detector ─────────────────────────────────────────────────────────

/**
 * Main entry point: fetch klines from Binance and run all pattern detectors.
 * Returns null if Binance fetch fails (graceful degradation).
 */
export async function detectPatternsForSymbol(
  params: PatternDetectionParams,
): Promise<PatternDetectionResult | null> {
  const { symbol, interval = "1h", limit = 200, minReliability = 50, testnet = false } = params;

  // Lazy import to avoid circular deps
  const { getRecentBars } = await import("@/shared/market-data/binance-klines");

  const bars = await getRecentBars(symbol, interval, limit, testnet);

  if (bars.length < 5) {
    return null;
  }

  const patterns = detectCandlestickPatterns(bars);

  // Filter by minimum reliability
  const filtered = patterns.filter((p) => p.reliability >= minReliability);

  const bullish = filtered.filter((p) => p.type === "BULLISH");
  const bearish = filtered.filter((p) => p.type === "BEARISH");

  // ── Derive summary ─────────────────────────────────────────────────────────

  const strongest = filtered[0] ?? null;

  let overallBias: PatternSummary["overallBias"] = "NO_SIGNAL";
  let confidenceScore = 0;

  if (filtered.length === 0) {
    overallBias = "NO_SIGNAL";
    confidenceScore = 0;
  } else if (bullish.length > bearish.length * 1.5) {
    overallBias = "BULLISH";
    // Confidence = weighted by count and strongest reliability
    confidenceScore = Math.min(
      Math.round(
        (bullish.reduce((s, p) => s + p.reliability, 0) / bullish.length) *
          Math.min(bullish.length / 3, 1),
      ),
      100,
    );
  } else if (bearish.length > bullish.length * 1.5) {
    overallBias = "BEARISH";
    confidenceScore = Math.min(
      Math.round(
        (bearish.reduce((s, p) => s + p.reliability, 0) / bearish.length) *
          Math.min(bearish.length / 3, 1),
      ),
      100,
    );
  } else {
    overallBias = "NEUTRAL";
    confidenceScore = Math.min(Math.round(strongest?.reliability ?? 0 * 0.5), 100);
  }

  let riskImplication: PatternSummary["riskImplication"] = "NEUTRAL";
  if (overallBias === "BULLISH" && confidenceScore >= 60) {
    riskImplication = "SUPPORTS_ENTRY";
  } else if (overallBias === "BEARISH" && confidenceScore >= 60) {
    riskImplication = "AGAINST_ENTRY";
  }

  return {
    symbol,
    interval,
    patterns: filtered,
    bullishSignals: bullish,
    bearishSignals: bearish,
    summary: {
      totalPatterns: filtered.length,
      bullishCount: bullish.length,
      bearishCount: bearish.length,
      strongestSignal: strongest,
      overallBias,
      confidenceScore,
      riskImplication,
    },
    analyzedAt: new Date().toISOString(),
  };
}

// ── Overload: accept bars directly (for testing / other data sources) ──────────

export function detectPatternsFromBars(
  bars: OHLCVBar[],
  options?: { minReliability?: number },
): CandlePattern[] {
  const { minReliability = 50 } = options ?? {};
  const patterns = detectCandlestickPatterns(bars);
  return patterns.filter((p) => p.reliability >= minReliability);
}

// ── Pattern formatting for DR.DEX UI ─────────────────────────────────────────

/**
 * Format a pattern for display in the DR.DEX risk page.
 */
export function formatPatternForDisplay(p: CandlePattern): {
  label: string;
  direction: "📈 BULLISH" | "📉 BEARISH";
  reliabilityColor: "green" | "yellow" | "red";
  badge: string;
} {
  const reliabilityColor = p.reliability >= 75 ? "green" : p.reliability >= 60 ? "yellow" : "red";

  return {
    label: p.name,
    direction: p.type === "BULLISH" ? "📈 BULLISH" : "📉 BEARISH",
    reliabilityColor,
    badge: `${p.reliability}%`,
  };
}
