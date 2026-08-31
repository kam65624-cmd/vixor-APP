import { defineEventHandler, getMethod, getHeader, createError, setResponseStatus } from "h3";
import { reanalyzeAllActiveAnalysisSignals } from "@/domains/analysis/reanalysis";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight, validateAdminKey } from "./_security";

/**
 * Vercel Cron endpoint for re-analyzing tracked analysis signals.
 *
 * Triggered by: GET /api/reanalysis-cron
 * Security: x-vercel-cron header OR Bearer CRON_SECRET OR x-admin-key
 *
 * Flow:
 *   1. Find all active/pending signal_trackings with source_type = "analysis"
 *   2. For each, fetch fresh OHLCV data
 *   3. Run runLocalAnalysis() on the fresh data
 *   4. Compare with original analysis
 *   5. Send notifications for significant changes
 *
 * Idempotent: Safe to run multiple times. In-memory cooldown prevents
 * re-analyzing the same signal more than once per 5 minutes.
 */
const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  const method = getMethod(event);

  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Security: Admin key (fast path) OR Vercel Cron OR Bearer CRON_SECRET
  if (validateAdminKey(event)) {
    // Authenticated via admin key — proceed
  } else {
    const isVercelCron = getHeader(event, "x-vercel-cron") === "1";
    const cronSecret = process.env.CRON_SECRET;

    if (isVercelCron) {
      // Vercel Cron requests are automatically authenticated by Vercel's infrastructure
    } else if (cronSecret) {
      const authHeader = getHeader(event, "authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        setResponseStatus(event, 401);
        return { error: "Unauthorized" };
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error(
        "[REANALYSIS CRON SECURITY] Request is not from Vercel Cron and CRON_SECRET is not set. Refusing.",
      );
      setResponseStatus(event, 500);
      return { error: "Cron not configured" };
    }
    // In development (no CRON_SECRET, no Vercel header), allow through
  }

  const startedAt = Date.now();

  try {
    const result = await reanalyzeAllActiveAnalysisSignals();
    const durationMs = Date.now() - startedAt;

    console.log(
      `[ReAnalysis Cron] Completed in ${durationMs}ms — ` +
        `${result.processed}/${result.total} processed, ${result.notified} notified, ${result.errors} errors`,
    );

    return {
      ok: true,
      durationMs,
      ...result,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(`[ReAnalysis Cron] Failed after ${durationMs}ms:`, error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});

export default withRateLimit(handler, { maxRequests: 30, windowSec: 60 });
