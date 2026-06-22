/**
 * @module server/api/vixor-ai/feedback
 * @description POST endpoint for recording user feedback on agent decisions.
 * Accepts "accepted" or "rejected" feedback for a specific decision.
 *
 * Auth: Supabase session required (Bearer token).
 * Rate limit: 30 requests per minute per user.
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

// Rate limit: 30 req/min/user
const feedbackLimiter = new SlidingWindowLimiter({
  maxRequests: 30,
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
  if (!feedbackLimiter.tryAcquire(userId)) {
    throw createError({ statusCode: 429, statusMessage: "RATE_LIMITED: Max 30 feedback requests per minute." });
  }

  // Parse and validate body
  const body = await readBody(event);
  const { decisionId, feedback } = body as Record<string, unknown>;

  if (!decisionId || typeof decisionId !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing or invalid 'decisionId'." });
  }
  if (!feedback || (feedback !== "accepted" && feedback !== "rejected")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid 'feedback' — must be 'accepted' or 'rejected'." });
  }

  try {
    const { acceptDecision, rejectDecision } = await import("@/domains/copilot/server/feedback");

    if (feedback === "accepted") {
      await acceptDecision(decisionId, userId);
    } else {
      await rejectDecision(decisionId, userId);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Feedback API] Error:", message);

    // Determine status code based on error type
    if (message.includes("not found")) {
      throw createError({ statusCode: 404, statusMessage: message });
    }
    if (message.includes("Unauthorized")) {
      throw createError({ statusCode: 403, statusMessage: message });
    }

    throw createError({ statusCode: 500, statusMessage: "Feedback recording failed." });
  }
});
