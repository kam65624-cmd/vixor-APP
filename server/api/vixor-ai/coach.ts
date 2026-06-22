/**
 * @module server/api/vixor-ai/coach
 * @description POST endpoint for the VIXOR Coach agent.
 * Provides real-time coaching feedback when a user previews a trade.
 *
 * Auth: Supabase session required (Bearer token).
 * Rate limit: 10 requests per minute per user.
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

// Rate limit: 10 req/min/user
const coachLimiter = new SlidingWindowLimiter({
  maxRequests: 10,
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
  if (!coachLimiter.tryAcquire(userId)) {
    throw createError({ statusCode: 429, statusMessage: "RATE_LIMITED: Max 10 coach requests per minute." });
  }

  // Parse and validate body
  const body = await readBody(event);
  const { token, action, amount, chain, currentPrice } = body as Record<string, unknown>;

  if (!token || typeof token !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'token' field." });
  }
  if (!action || (action !== "buy" && action !== "sell")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid 'action' — must be 'buy' or 'sell'." });
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'amount' — must be a positive number." });
  }
  if (!chain || typeof chain !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'chain' field." });
  }
  if (!currentPrice || typeof currentPrice !== "number" || currentPrice <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'currentPrice' — must be a positive number." });
  }

  try {
    const { coachTrade } = await import("@/domains/copilot/server/coach.agent");

    const result = await coachTrade({
      userId,
      token,
      action: action as "buy" | "sell",
      amount,
      chain,
      currentPrice,
    });

    return { success: true, data: result };
  } catch (err) {
    console.error("[Coach API] Error:", err instanceof Error ? err.message : err);
    throw createError({ statusCode: 500, statusMessage: "Coach analysis failed." });
  }
});
