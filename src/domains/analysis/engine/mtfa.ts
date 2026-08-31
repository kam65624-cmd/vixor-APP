// ============================================================================
// VIXOR Analysis Engine — Multi-Timeframe Analysis (MTFA) Framework
// ============================================================================
//
// Runs analysis across multiple timeframes and combines results to determine
// whether timeframes are aligned, boosting confidence when they agree.
//
// ============================================================================

import { runLocalAnalysis, type AnalysisInput } from "./engine";
import type { OHLCVBar } from "./core/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MTFATimeframeResult {
  timeframe: string;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  keySignals: string[];
}

export interface MTFAResult {
  pair: string;
  timeframes: MTFATimeframeResult[];
  /** Combined direction across all timeframes */
  combinedDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
  /** Combined confidence (higher when timeframes agree) */
  combinedConfidence: number;
  /** Whether timeframes are aligned (all agree on direction) */
  isAligned: boolean;
}

export interface MTFAOptions {
  maxTimeframes?: number;
}

const DEFAULT_TIMEFRAMES = ["15M", "1H", "4H", "1D"];

// ---------------------------------------------------------------------------
// OHLCV fetcher type — allows injection for testing
// ---------------------------------------------------------------------------

export type OHLCVFetcher = (pair: string, timeframe: string, limit: number) => Promise<OHLCVBar[]>;

let _fetcher: OHLCVFetcher | null = null;

/**
 * Set the OHLCV fetcher for MTFA. Used by server code to inject
 * the real fetcher (Binance/TwelveData) and by tests to inject mocks.
 */
export function setMTFAFetcher(fetcher: OHLCVFetcher): void {
  _fetcher = fetcher;
}

/** Get the current fetcher (or throw if not set) */
function getFetcher(): OHLCVFetcher {
  if (!_fetcher) {
    throw new Error("MTFA fetcher not set. Call setMTFAFetcher() before running MTFA.");
  }
  return _fetcher;
}

// ---------------------------------------------------------------------------
// Core MTFA logic
// ---------------------------------------------------------------------------

/**
 * Run analysis across multiple timeframes and combine results.
 *
 * @param pair - Trading pair (e.g. "BTC/USDT")
 * @param timeframes - Optional list of timeframes (default: 15m, 1h, 4h, 1d)
 * @param options - MTFA configuration
 */
export async function runMultiTimeframeAnalysis(
  pair: string,
  timeframes?: string[],
  options?: MTFAOptions,
): Promise<MTFAResult> {
  const tfs = (timeframes || DEFAULT_TIMEFRAMES).slice(0, options?.maxTimeframes || 4);

  const fetcher = getFetcher();
  const results: MTFATimeframeResult[] = [];

  // Run analysis for each timeframe
  for (const tf of tfs) {
    try {
      const bars = await fetcher(pair, tf, 200);

      if (bars.length < 20) {
        results.push({
          timeframe: tf,
          direction: "NEUTRAL",
          confidence: 0,
          keySignals: ["Insufficient data"],
        });
        continue;
      }

      const input: AnalysisInput = { pair, timeframe: tf, bars };
      const analysis = runLocalAnalysis(input);

      results.push({
        timeframe: tf,
        direction: recToDirection(analysis.recommendation),
        confidence: analysis.confidence,
        keySignals: analysis.reasons.slice(0, 3),
      });
    } catch (err) {
      results.push({
        timeframe: tf,
        direction: "NEUTRAL",
        confidence: 0,
        keySignals: [`Analysis failed: ${err instanceof Error ? err.message : String(err)}`],
      });
    }
  }

  return combineMTFAResults(pair, results);
}

// ---------------------------------------------------------------------------
// Combine multiple timeframe results
// ---------------------------------------------------------------------------

function combineMTFAResults(pair: string, results: MTFATimeframeResult[]): MTFAResult {
  if (results.length === 0) {
    return {
      pair,
      timeframes: [],
      combinedDirection: "NEUTRAL",
      combinedConfidence: 0,
      isAligned: false,
    };
  }

  const validResults = results.filter((r) => r.confidence > 0);

  if (validResults.length === 0) {
    return {
      pair,
      timeframes: results,
      combinedDirection: "NEUTRAL",
      combinedConfidence: 0,
      isAligned: false,
    };
  }

  // Determine dominant direction
  let bullCount = 0;
  let bearCount = 0;
  let neutralCount = 0;
  let totalConfidence = 0;

  for (const r of validResults) {
    if (r.direction === "BULLISH") bullCount++;
    else if (r.direction === "BEARISH") bearCount++;
    else neutralCount++;
    totalConfidence += r.confidence;
  }

  const avgConfidence = totalConfidence / validResults.length;

  let combinedDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
  if (bullCount > bearCount && bullCount > neutralCount) {
    combinedDirection = "BULLISH";
  } else if (bearCount > bullCount && bearCount > neutralCount) {
    combinedDirection = "BEARISH";
  } else {
    combinedDirection = "NEUTRAL";
  }

  // Check alignment
  const isAligned =
    validResults.length > 1 &&
    validResults.every((r) => r.direction === combinedDirection && r.direction !== "NEUTRAL");

  // Adjust confidence based on alignment
  let combinedConfidence: number;
  if (isAligned) {
    // All timeframes agree: boost confidence by 15%
    combinedConfidence = Math.min(Math.round(avgConfidence * 1.15), 98);
  } else if (validResults.length > 1) {
    // Timeframes disagree: reduce confidence by 10%
    combinedConfidence = Math.max(Math.round(avgConfidence * 0.9), 10);
  } else {
    combinedConfidence = Math.round(avgConfidence);
  }

  return {
    pair,
    timeframes: results,
    combinedDirection,
    combinedConfidence,
    isAligned,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function recToDirection(rec: "BUY" | "SELL" | "WAIT"): "BULLISH" | "BEARISH" | "NEUTRAL" {
  if (rec === "BUY") return "BULLISH";
  if (rec === "SELL") return "BEARISH";
  return "NEUTRAL";
}
