// ============================================================================
// Vixor Chart Truth — Market Truth Service
// ============================================================================
//
// Orchestrates the truth validation pipeline:
//   1. Fetches the real market price for the vision-detected symbol
//   2. Reconciles the vision price against the real price
//   3. Calculates the composite truth score
//   4. Returns a TruthValidationResult (NEVER throws)
//
// This is the single entry point for truth validation.
// It is designed to be called from run-analysis.ts AFTER Step 2 (validation)
// and BEFORE Step 3 (pair determination).
// ============================================================================

import type { ChartContext } from "@/domains/chart-intelligence";
import { fetchPrice } from "@/domains/market/server/price-fetcher";
import { reconcilePrice } from "./price-reconciler";
import { calculateTruthScore } from "./truth-score.engine";
import type { TruthValidationResult } from "./types";

/**
 * Validate chart truth — compare vision-extracted data against real market data.
 *
 * This function NEVER throws. If anything fails (price fetch, reconciliation, etc.),
 * it returns an "unverified" result with appropriate warnings instead of crashing
 * the analysis pipeline.
 *
 * @param chartContext - The ChartContext extracted by the vision pipeline
 * @returns TruthValidationResult with score, status, and warnings
 */
export async function validateChartTruth(
  chartContext: ChartContext,
): Promise<TruthValidationResult> {
  try {
    // ── Step 1: Determine if we have a symbol to validate ──
    const symbol = chartContext.symbol;
    if (!symbol) {
      return {
        truthScore: 0,
        status: "unverified",
        priceDelta: null,
        symbolMatch: false,
        warnings: ["No symbol detected in chart context — cannot validate against market data."],
      };
    }

    // ── Step 2: Fetch the real market price ──
    let marketPrice: number | null = null;
    try {
      const priceResult = await fetchPrice(symbol);
      if (priceResult && priceResult.price > 0) {
        marketPrice = priceResult.price;
        console.log(`[ChartTruth] Real market price for ${symbol}: ${marketPrice} (source: ${priceResult.source})`);
      } else {
        console.warn(`[ChartTruth] No real market price available for ${symbol}`);
      }
    } catch (priceErr) {
      console.warn(
        `[ChartTruth] Price fetch failed for ${symbol}:`,
        priceErr instanceof Error ? priceErr.message : String(priceErr),
      );
    }

    // ── Step 3: Reconcile vision price against market price ──
    const priceDelta = reconcilePrice(chartContext.currentPrice, marketPrice);

    // ── Step 4: Calculate truth score ──
    const result = calculateTruthScore({
      symbolMatch: !!symbol, // If we have a symbol, it's a match (vision detected something)
      timeframeDetected: !!chartContext.timeframe,
      priceDelta,
    });

    // ── Step 5: Log the result ──
    console.log(
      `[ChartTruth] Truth validation for ${symbol}: score=${result.truthScore}, status=${result.status}, ` +
      `priceDelta=${priceDelta > 0 ? `${priceDelta}%` : "N/A"}, ` +
      `visionPrice=${chartContext.currentPrice ?? "N/A"}, marketPrice=${marketPrice ?? "N/A"}`,
    );

    if (result.warnings.length > 0) {
      console.warn(`[ChartTruth] Warnings for ${symbol}:`, result.warnings);
    }

    return result;
  } catch (err) {
    // NEVER throw — this is a fail-safe layer
    console.error(
      "[ChartTruth] Truth validation failed unexpectedly:",
      err instanceof Error ? err.message : String(err),
    );
    return {
      truthScore: 0,
      status: "unverified",
      priceDelta: null,
      symbolMatch: false,
      warnings: [
        "Truth validation encountered an unexpected error and could not complete. Analysis will proceed without truth verification.",
      ],
    };
  }
}
