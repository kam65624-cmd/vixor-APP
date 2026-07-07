// ============================================================================
// VIXOR Analysis Re-Analysis — Server Function
// ============================================================================
//
// Re-analyzes tracked analysis signals with fresh OHLCV data.
// When price changes significantly, the system detects:
//   1. Trend Reversal — recommendation changed (e.g., BUY → SELL)
//   2. Confidence Update — confidence shifted >15%
//   3. Level Update — TP/SL levels shifted significantly
//
// Uses runLocalAnalysis() directly (no image upload needed).
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { log } from "@/shared/structured-logger";
import { notificationRouter } from "@/shared/notifications";
import type { SignalTracking } from "@/domains/signal-tracking/types";
import { TERMINAL_STATUSES } from "@/domains/signal-tracking/types";
import type { OHLCVBar, LocalAnalysisResult } from "@/domains/analysis/engine/core/types";

// ── In-memory rate-limit cache (keyed by tracking id) ────────────────────
// In serverless, this resets per cold start — that's acceptable since the
// cron itself gates to 5-minute intervals.
const lastReanalysisAt = new Map<string, number>();
const REANALYSIS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// ── Change detection thresholds ─────────────────────────────────────────
const CONFIDENCE_CHANGE_THRESHOLD = 15; // percentage points
const LEVEL_CHANGE_THRESHOLD_PCT = 0.5; // 0.5% price shift = significant

// ---------------------------------------------------------------------------
// Helper: Fetch fresh OHLCV data using the 4-tier fallback strategy
// ---------------------------------------------------------------------------

async function fetchFreshOHLCV(pair: string, timeframe: string): Promise<OHLCVBar[] | undefined> {
  const { fetchBinanceKlines, fetchTwelveDataKlines } =
    await import("@/domains/market/server/price-fetcher");

  // Source 1: Binance for crypto pairs
  if (
    pair.includes("USDT") ||
    pair.includes("BTC") ||
    pair.includes("ETH") ||
    pair.includes("SOL")
  ) {
    try {
      const klines = await fetchBinanceKlines(pair, timeframe, 200);
      if (klines.length > 20) {
        return klines.map((k) => ({
          time: k.time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
        }));
      }
    } catch (err) {
      console.warn(
        `[ReAnalysis] Binance fetch failed for ${pair}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // Source 2: TwelveData for forex/commodity pairs
  try {
    const klines = await fetchTwelveDataKlines(pair, timeframe, 200);
    if (klines.length > 20) {
      return klines.map((k) => ({
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
      }));
    }
  } catch (err) {
    console.warn(
      `[ReAnalysis] TwelveData fetch failed for ${pair}:`,
      err instanceof Error ? err.message : String(err),
    );
  }

  // Source 3: Try Binance as fallback even for non-crypto
  if (!pair.includes("USDT")) {
    try {
      const klines = await fetchBinanceKlines(pair, timeframe, 200);
      if (klines.length > 20) {
        return klines.map((k) => ({
          time: k.time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
        }));
      }
    } catch {
      // Non-fatal
    }
  }

  // Source 4: Try TwelveData with 1D interval as last resort
  try {
    const klines = await fetchTwelveDataKlines(pair, "1D", 100);
    if (klines.length > 10) {
      return klines.map((k) => ({
        time: k.time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
      }));
    }
  } catch {
    // Non-fatal
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Helper: Compare old vs new analysis and classify changes
// ---------------------------------------------------------------------------

interface AnalysisDiff {
  trendReversal: boolean;
  confidenceUpdate: boolean;
  levelUpdate: boolean;
  oldRec: string;
  newRec: string;
  oldConfidence: number;
  newConfidence: number;
  priceChangePct: number;
  summary: string;
}

function compareAnalyses(
  oldAnalysis: {
    recommendation: string;
    confidence: number;
    entry: number;
    stop_loss: number;
    take_profit: number[];
    pair: string;
  },
  newResult: LocalAnalysisResult,
  currentPrice: number,
  originalEntry: number,
): AnalysisDiff {
  const trendReversal =
    oldAnalysis.recommendation !== "WAIT" &&
    newResult.recommendation !== "WAIT" &&
    oldAnalysis.recommendation !== newResult.recommendation;

  const confidenceDelta = Math.abs(newResult.confidence - oldAnalysis.confidence);
  const confidenceUpdate = confidenceDelta > CONFIDENCE_CHANGE_THRESHOLD;

  // Check if TP/SL levels shifted significantly relative to price
  const oldSLDist = Math.abs(oldAnalysis.stop_loss - originalEntry);
  const newSLDist = Math.abs(newResult.stop_loss - newResult.entry);
  const slShiftPct = oldSLDist > 0 ? Math.abs(newSLDist - oldSLDist) / oldSLDist : 0;

  const oldTPAvg =
    oldAnalysis.take_profit.length > 0
      ? oldAnalysis.take_profit.reduce((a, b) => a + b, 0) / oldAnalysis.take_profit.length
      : 0;
  const newTPAvg =
    newResult.take_profit.length > 0
      ? newResult.take_profit.reduce((a, b) => a + b, 0) / newResult.take_profit.length
      : 0;
  const tpShiftPct = oldTPAvg > 0 ? Math.abs(newTPAvg - oldTPAvg) / oldTPAvg : 0;

  const levelUpdate =
    slShiftPct > LEVEL_CHANGE_THRESHOLD_PCT || tpShiftPct > LEVEL_CHANGE_THRESHOLD_PCT;

  const priceChangePct =
    originalEntry > 0 ? ((currentPrice - originalEntry) / originalEntry) * 100 : 0;

  // Build summary
  const parts: string[] = [];
  if (trendReversal) {
    parts.push(`Direction changed: ${oldAnalysis.recommendation} → ${newResult.recommendation}`);
  }
  if (confidenceUpdate) {
    parts.push(
      `Confidence: ${Math.round(oldAnalysis.confidence)}% → ${Math.round(newResult.confidence)}% (${confidenceDelta > 0 ? "+" : ""}${Math.round(confidenceDelta)}pp)`,
    );
  }
  if (levelUpdate) {
    parts.push("TP/SL levels shifted significantly");
  }

  return {
    trendReversal,
    confidenceUpdate,
    levelUpdate,
    oldRec: oldAnalysis.recommendation,
    newRec: newResult.recommendation,
    oldConfidence: oldAnalysis.confidence,
    newConfidence: newResult.confidence,
    priceChangePct,
    summary: parts.join(". ") || "No significant change",
  };
}

// ---------------------------------------------------------------------------
// Helper: Format price based on pair magnitude
// ---------------------------------------------------------------------------

function fmtPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 10) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

// ---------------------------------------------------------------------------
// Re-analyze a single tracked signal
// ---------------------------------------------------------------------------

export async function reanalyzeSingleTracking(
  tracking: SignalTracking,
  analysis: {
    id: string;
    timeframe: string;
    recommendation: string;
    confidence: number;
    entry: number;
    stop_loss: number;
    take_profit: number[];
    pair: string;
  },
): Promise<{
  trackingId: string;
  status: "skipped" | "no_change" | "notified" | "error";
  reason?: string;
  diff?: AnalysisDiff;
  newResult?: LocalAnalysisResult;
}> {
  const trackingId = tracking.id;
  const pair = tracking.pair;
  const timeframe = analysis.timeframe || "1H";

  // ── Rate limit check ──────────────────────────────────────────────
  const now = Date.now();
  const lastRun = lastReanalysisAt.get(trackingId);
  if (lastRun && now - lastRun < REANALYSIS_COOLDOWN_MS) {
    return { trackingId, status: "skipped", reason: "cooldown" };
  }
  lastReanalysisAt.set(trackingId, now);

  // ── Fetch fresh OHLCV data ────────────────────────────────────────
  let bars: OHLCVBar[] | undefined;
  try {
    bars = await fetchFreshOHLCV(pair, timeframe);
  } catch (err) {
    console.warn(
      `[ReAnalysis] Failed to fetch OHLCV for ${pair}/${timeframe}:`,
      err instanceof Error ? err.message : String(err),
    );
    return { trackingId, status: "error", reason: "ohlcv_fetch_failed" };
  }

  // ── Run local analysis ────────────────────────────────────────────
  let newResult: LocalAnalysisResult;
  try {
    const { runLocalAnalysis } = await import("@/domains/analysis/engine/engine");
    newResult = runLocalAnalysis({
      pair,
      timeframe,
      bars,
    });
  } catch (err) {
    console.error(
      `[ReAnalysis] Engine failed for ${pair}/${timeframe}:`,
      err instanceof Error ? err.message : String(err),
    );
    return { trackingId, status: "error", reason: "engine_failed" };
  }

  // ── Get current price from the latest bar ─────────────────────────
  const currentPrice = bars?.[bars.length - 1]?.close ?? newResult.entry;

  // ── Compare old vs new ────────────────────────────────────────────
  const diff = compareAnalyses(analysis, newResult, currentPrice, analysis.entry);

  // ── Update signal_tracking with new current_price ─────────────────
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");
  try {
    await supabaseAdmin
      .from("signal_tracking")
      .update({
        current_price: currentPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackingId);
  } catch (err) {
    console.warn(
      `[ReAnalysis] Failed to update tracking ${trackingId}:`,
      err instanceof Error ? err.message : String(err),
    );
  }

  // ── No significant change → skip notification ─────────────────────
  if (!diff.trendReversal && !diff.confidenceUpdate && !diff.levelUpdate) {
    return { trackingId, status: "no_change", diff };
  }

  // ── Build notification content ────────────────────────────────────
  const dir =
    tracking.direction === "BUY" ? "Long" : tracking.direction === "SELL" ? "Short" : "Wait";

  let title: string;
  let body: string;
  let severity: "info" | "warning" = "info";

  if (diff.trendReversal) {
    title = `Trend Reversal Alert — ${pair}`;
    severity = "warning";
    body =
      `${dir} ${pair} (${timeframe})\n` +
      `Direction: ${diff.oldRec} → ${diff.newRec}\n` +
      `Price: ${fmtPrice(currentPrice)} (${diff.priceChangePct >= 0 ? "+" : ""}${diff.priceChangePct.toFixed(2)}% from entry)\n` +
      `Confidence: ${Math.round(diff.newConfidence)}%\n` +
      `Pattern: ${newResult.pattern}\n` +
      `\n${diff.summary}`;
  } else if (diff.confidenceUpdate) {
    title = `Confidence Update — ${pair}`;
    body =
      `${dir} ${pair} (${timeframe}) — ${diff.newRec}\n` +
      `Confidence: ${Math.round(diff.oldConfidence)}% → ${Math.round(diff.newConfidence)}%\n` +
      `Price: ${fmtPrice(currentPrice)} (${diff.priceChangePct >= 0 ? "+" : ""}${diff.priceChangePct.toFixed(2)}%)\n` +
      `\n${diff.summary}`;
  } else {
    title = `Level Update — ${pair}`;
    body =
      `${dir} ${pair} (${timeframe}) — ${diff.newRec}\n` +
      `SL: ${fmtPrice(analysis.stop_loss)} → ${fmtPrice(newResult.stop_loss)}\n` +
      `Entry: ${fmtPrice(analysis.entry)} → ${fmtPrice(newResult.entry)}\n` +
      `Price: ${fmtPrice(currentPrice)}\n` +
      `\n${diff.summary}`;
  }

  // ── Send notification ─────────────────────────────────────────────
  try {
    void notificationRouter
      .send({
        userId: tracking.user_id,
        title,
        body,
        severity,
        payload: {
          pair,
          direction: tracking.direction,
          oldRecommendation: diff.oldRec,
          newRecommendation: diff.newRec,
          oldConfidence: diff.oldConfidence,
          newConfidence: diff.newConfidence,
          currentPrice,
          priceChangePct: diff.priceChangePct,
          trackingId,
          analysisId: analysis.id,
        },
      })
      .catch(() => {
        /* non-blocking */
      });
  } catch {
    /* non-blocking */
  }

  return { trackingId, status: "notified", diff, newResult };
}

// ---------------------------------------------------------------------------
// Public server function: Trigger re-analysis for the current user's trackings
// ---------------------------------------------------------------------------

export const reanalyzeTrackedSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;

    // 1. Get all active/pending signal_trackings where source_type = "analysis"
    const { data: trackings, error: tErr } = await supabase
      .from("signal_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("source_type", "analysis")
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (tErr || !trackings || trackings.length === 0) {
      return { reanalyzed: 0, results: [] };
    }

    const results: Array<{
      trackingId: string;
      status: string;
      reason?: string;
      pair?: string;
    }> = [];

    // 2. For each tracking, fetch the original analysis
    for (const tracking of trackings as SignalTracking[]) {
      if (!tracking.signal_id) {
        results.push({
          trackingId: tracking.id,
          status: "skipped",
          reason: "no_analysis_id",
        });
        continue;
      }

      try {
        const { data: analysis } = await supabase
          .from("analyses")
          .select("id, pair, timeframe, recommendation, confidence, entry, stop_loss, take_profit")
          .eq("id", tracking.signal_id)
          .eq("status", "complete")
          .maybeSingle();

        if (!analysis) {
          results.push({
            trackingId: tracking.id,
            status: "skipped",
            reason: "analysis_not_found_or_incomplete",
          });
          continue;
        }

        // 3-6. Run re-analysis and collect results
        const result = await reanalyzeSingleTracking(tracking, analysis as any);
        results.push({
          trackingId: tracking.id,
          status: result.status,
          reason: result.reason,
          pair: tracking.pair,
        });
      } catch (err) {
        console.warn(
          `[ReAnalysis] Error processing tracking ${tracking.id}:`,
          err instanceof Error ? err.message : String(err),
        );
        results.push({
          trackingId: tracking.id,
          status: "error",
          reason: "unexpected_error",
          pair: tracking.pair,
        });
      }
    }

    const notified = results.filter((r) => r.status === "notified").length;
    return {
      reanalyzed: results.length,
      notified,
      results,
    };
  });

// ---------------------------------------------------------------------------
// Batch re-analysis: Used by the cron endpoint (no user auth — runs as system)
// ---------------------------------------------------------------------------

export async function reanalyzeAllActiveAnalysisSignals(): Promise<{
  total: number;
  processed: number;
  notified: number;
  errors: number;
}> {
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  // Get ALL active/pending analysis signal trackings (system-wide)
  const { data: trackings, error: tErr } = await supabaseAdmin
    .from("signal_tracking")
    .select(
      "id, user_id, signal_id, source_type, pair, direction, entry_price, stop_loss, take_profit, status, current_price, created_at",
    )
    .eq("source_type", "analysis")
    .in("status", ["pending", "active"])
    .limit(200);

  if (tErr || !trackings || trackings.length === 0) {
    return { total: 0, processed: 0, notified: 0, errors: 0 };
  }

  let processed = 0;
  let notified = 0;
  let errors = 0;

  for (const tracking of trackings as SignalTracking[]) {
    if (!tracking.signal_id) continue;

    try {
      const { data: analysis } = await supabaseAdmin
        .from("analyses")
        .select("id, pair, timeframe, recommendation, confidence, entry, stop_loss, take_profit")
        .eq("id", tracking.signal_id)
        .eq("status", "complete")
        .maybeSingle();

      if (!analysis) continue;

      const result = await reanalyzeSingleTracking(tracking, analysis as any);
      processed++;
      if (result.status === "notified") notified++;
      if (result.status === "error") errors++;
    } catch (err) {
      console.warn(
        `[ReAnalysis Cron] Error for tracking ${tracking.id}:`,
        err instanceof Error ? err.message : String(err),
      );
      errors++;
    }
  }

  // Prune in-memory cache to avoid unbounded growth
  if (lastReanalysisAt.size > 500) {
    const cutoff = Date.now() - REANALYSIS_COOLDOWN_MS;
    for (const [key, ts] of lastReanalysisAt.entries()) {
      if (ts < cutoff) lastReanalysisAt.delete(key);
    }
  }

  return {
    total: trackings.length,
    processed,
    notified,
    errors,
  };
}
