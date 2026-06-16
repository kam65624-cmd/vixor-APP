import { defineEventHandler, getHeader, createError } from "h3";

/**
 * GET /api/health
 * Returns aggregated health of the VIXOR app:
 *  - app: always "ok" if this route executed
 *  - supabase: ping by issuing a cheap query (auth.getSession)
 *  - redis: ping Upstash via REST (if configured)
 *  - env: which critical env vars are present
 *
 * Auth: same gate as other /api routes — Vercel Cron header OR CRON_SECRET.
 */
export default defineEventHandler(async (event) => {
  const method = (event.node.req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Allow CRON_SECRET OR a health-check token (HEALTH_TOKEN) OR Vercel cron
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

  const startedAt = Date.now();
  const checks: Record<string, { status: "ok" | "degraded" | "down"; latencyMs: number; detail?: string }> = {};

  // --- Supabase ping -------------------------------------------------------
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      checks.supabase = { status: "degraded", latencyMs: 0, detail: "SUPABASE_URL or anon key missing" };
    } else {
      const t0 = Date.now();
      const r = await fetch(`${supabaseUrl}/rest/v1/?apikey=${anonKey}`, { method: "GET" });
      checks.supabase = {
        status: r.ok || r.status === 200 ? "ok" : "degraded",
        latencyMs: Date.now() - t0,
        detail: `HTTP ${r.status}`,
      };
    }
  } catch (e: any) {
    checks.supabase = { status: "down", latencyMs: 0, detail: String(e?.message || e) };
  }

  // --- Upstash Redis ping --------------------------------------------------
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!redisUrl || !redisToken) {
      checks.redis = { status: "degraded", latencyMs: 0, detail: "UPSTASH_REDIS_REST_URL/TOKEN not set (in-memory fallback active)" };
    } else {
      const t0 = Date.now();
      const r = await fetch(`${redisUrl}/ping`, {
        method: "GET",
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      checks.redis = {
        status: r.ok ? "ok" : "degraded",
        latencyMs: Date.now() - t0,
        detail: `HTTP ${r.status}`,
      };
    }
  } catch (e: any) {
    checks.redis = { status: "down", latencyMs: 0, detail: String(e?.message || e) };
  }

  // --- Env presence --------------------------------------------------------
  const envPresence = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    CRON_SECRET: !!process.env.CRON_SECRET,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
    TWELVEDATA_API_KEY: !!process.env.TWELVEDATA_API_KEY,
  };

  const overall = Object.values(checks).some((c) => c.status === "down")
    ? "down"
    : Object.values(checks).some((c) => c.status === "degraded")
    ? "degraded"
    : "ok";

  return {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime_s: Math.round(process.uptime?.() ?? 0),
    responseTimeMs: Date.now() - startedAt,
    checks,
    env: envPresence,
    region: process.env.VERCEL_REGION || process.env.AWS_REGION || "unknown",
    deployment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
  };
});
