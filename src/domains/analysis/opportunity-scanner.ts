// ============================================================================
// VIXOR Analysis Engine — Opportunity Scanner
// ============================================================================
//
// Scans a list of pairs for high-confidence trading opportunities using
// the local analysis engine. Returns sorted, filtered results.
//
// ============================================================================

import { runLocalAnalysis, type AnalysisInput } from "./engine/engine";
import type { OHLCVBar, LocalAnalysisResult } from "./engine/core/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScannedOpportunity {
  pair: string;
  timeframe: string;
  direction: "BUY" | "SELL" | "WAIT";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  riskReward: number;
  keySignals: string[];
  regime: string;
  scannedAt: string;
}

export interface ScanResult {
  opportunities: ScannedOpportunity[];
  totalScanned: number;
  scanDurationMs: number;
}

export interface ScanOptions {
  minConfidence?: number;
  timeframes?: string[];
  maxResults?: number;
}

// ---------------------------------------------------------------------------
// OHLCV fetcher type — allows injection for testing
// ---------------------------------------------------------------------------

export type ScanOHLCVFetcher = (
  pair: string,
  timeframe: string,
  limit: number,
) => Promise<OHLCVBar[]>;

let _scanFetcher: ScanOHLCVFetcher | null = null;

/**
 * Set the OHLCV fetcher for the opportunity scanner.
 */
export function setScanFetcher(fetcher: ScanOHLCVFetcher): void {
  _scanFetcher = fetcher;
}

function getScanFetcher(): ScanOHLCVFetcher {
  if (!_scanFetcher) {
    throw new Error("Scan fetcher not set. Call setScanFetcher() before scanning.");
  }
  return _scanFetcher;
}

// ---------------------------------------------------------------------------
// Core scanning logic
// ---------------------------------------------------------------------------

/**
 * Scan a list of pairs for high-confidence trading opportunities.
 *
 * @param pairs - Trading pairs to scan (e.g. ["BTC/USDT", "ETH/USDT"])
 * @param options - Scan configuration
 */
export async function scanForOpportunities(
  pairs: string[],
  options?: ScanOptions,
): Promise<ScanResult> {
  const startTime = Date.now();
  const minConfidence = options?.minConfidence ?? 65;
  const timeframes = options?.timeframes ?? ["1H", "4H"];
  const maxResults = options?.maxResults ?? 10;
  const fetcher = getScanFetcher();

  const allOpportunities: ScannedOpportunity[] = [];

  for (const pair of pairs) {
    for (const tf of timeframes) {
      try {
        const bars = await fetcher(pair, tf, 200);
        if (bars.length < 20) continue;

        const input: AnalysisInput = { pair, timeframe: tf, bars };
        const analysis = runLocalAnalysis(input);

        // Skip WAIT recommendations
        if (analysis.recommendation === "WAIT") continue;

        // Skip below minimum confidence
        if (analysis.confidence < minConfidence) continue;

        // Parse risk-reward ratio string (e.g. "1:2.5" → 2.5)
        const riskReward = parseRR(analysis.rr);

        allOpportunities.push({
          pair,
          timeframe: tf,
          direction: analysis.recommendation,
          confidence: analysis.confidence,
          entryPrice: analysis.entry,
          stopLoss: analysis.stop_loss,
          takeProfits: analysis.take_profit,
          riskReward,
          keySignals: analysis.reasons.slice(0, 3),
          regime: (analysis as any).regime || "unknown",
          scannedAt: new Date().toISOString(),
        });
      } catch {
        // Skip pairs/timeframes that fail analysis
        continue;
      }
    }
  }

  // Sort by confidence descending
  allOpportunities.sort((a, b) => b.confidence - a.confidence);

  // Limit results
  const opportunities = allOpportunities.slice(0, maxResults);

  return {
    opportunities,
    totalScanned: pairs.length * timeframes.length,
    scanDurationMs: Date.now() - startTime,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse risk-reward ratio string like "1:2.5" to numeric 2.5 */
function parseRR(rr: string): number {
  if (!rr || !rr.includes(":")) return 0;
  const parts = rr.split(":");
  if (parts.length !== 2) return 0;
  const right = parseFloat(parts[1]!);
  return isNaN(right) ? 0 : right;
}
