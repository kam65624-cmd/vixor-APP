/**
 * @module server/api/vixor-ai/risk
 * @description POST endpoint for the VIXOR Risk Governor agent.
 * Assesses trade risk and returns allow/warn/block decision.
 *
 * Auth: Supabase session required (Bearer token).
 * Rate limit: 15 requests per minute per user.
 */

import {
  defineEventHandler,
  getMethod,
  readBody,
  createError,
  getHeader,
} from "h3";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/supabase/types";
import { SlidingWindowLimiter } from "@/shared/resilience/rate-limiter";

// Rate limit: 15 req/min/user
const riskLimiter = new SlidingWindowLimiter({
  maxRequests: 15,
  windowMs: 60_000,
});

/** Extract user ID from Bearer token in h3 request. */
async function authenticateRequest(event: Parameters<typeof defineEventHandler>[0] extends (...args: infer A) => any ? (...args: A) => any : never): Promise<string | null> {
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Auth check
  const userId = await authenticateRequest(event);
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // Rate limit check
  if (!riskLimiter.tryAcquire(userId)) {
    throw createError({ statusCode: 429, statusMessage: "RATE_LIMITED: Max 15 risk requests per minute." });
  }

  // Parse and validate body
  const body = await readBody(event);
  const { action, token, amount, currentPrice, portfolioValue } = body as Record<string, unknown>;

  if (!action || (action !== "buy" && action !== "sell")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid 'action' — must be 'buy' or 'sell'." });
  }
  if (!token || typeof token !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'token' field." });
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'amount' — must be a positive number." });
  }
  if (!currentPrice || typeof currentPrice !== "number" || currentPrice <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'currentPrice' — must be a positive number." });
  }
  if (!portfolioValue || typeof portfolioValue !== "number" || portfolioValue <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'portfolioValue' — must be a positive number." });
  }

  try {
    const { assessRisk } = await import("@/domains/copilot/server/governor.agent");

    const result = await assessRisk({
      userId,
      token,
      action: action as "buy" | "sell",
      amount,
      currentPrice,
      portfolioValue,
    });

    return { success: true, data: result };
  } catch (err) {
    console.error("[Risk API] Error:", err instanceof Error ? err.message : err);
    throw createError({ statusCode: 500, statusMessage: "Risk assessment failed." });
  }
});
