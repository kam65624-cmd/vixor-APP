import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { createArbitrageEngine } from "@/domains/arbitrage";

// ============================================================================
// POST /api/arbitrage/scan
//
// Triggers a single arbitrage scan and returns:
//   - opportunities: detected opportunities (sorted by net profit, desc)
//   - stats: bot stats (total scans, trades, profit, etc.)
//
// Security:
//   - Requires CRON_SECRET or admin auth (same gate as /api/health)
//   - In development, allows unauthenticated access for testing
// ============================================================================

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Auth gate (same pattern as /api/health)
  const isVercelCron = getHeader(event, "x-vercel-cron") === "1";
  const authHeader = getHeader(event, "authorization");
  const cronSecret = process.env.CRON_SECRET;
  const healthToken = process.env.HEALTH_TOKEN;
  const authorized =
    isVercelCron ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (healthToken && authHeader === `Bearer ${healthToken}`) ||
    process.env.NODE_ENV !== "production";
  if (!authorized) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  try {
    const engine = await createArbitrageEngine();
    const result = await engine.scanOnce();
    const stats = engine.getStats();

    return {
      opportunities: result.opportunities,
      rejected: result.rejected,
      stats,
      scanDurationMs: result.durationMs,
      scannedAt: result.scannedAt,
      mode: result.mode,
    };
  } catch (error) {
    console.error("[Arbitrage Scan] Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Arbitrage scan failed",
      data: String(error),
    });
  }
});
