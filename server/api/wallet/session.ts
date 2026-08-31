import { defineEventHandler, getMethod, createError, readBody } from "h3";
import { disconnectWallet, getWalletSessions } from "@/domains/wallet/server";
import { getSupabaseOrNull } from "@/shared/supabase/client";
import { withRateLimit } from "../../utils/with-rate-limit";
import { handlePreflight } from "../_security";

// ============================================================================
// /api/wallet/session
//
// GET  — List active wallet sessions for the authenticated user
// POST — Disconnect a specific wallet session
//
// Auth: Requires Supabase session (user must be logged in)
// ============================================================================

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  const method = getMethod(event);

  const supabase = getSupabaseOrNull();
  if (!supabase) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  if (!authSession) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  if (method === "GET") {
    const sessions = await getWalletSessions(authSession.user.id);
    return { sessions };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const { sessionId } = body ?? {};

    if (!sessionId || typeof sessionId !== "string") {
      throw createError({ statusCode: 400, statusMessage: "Missing sessionId" });
    }

    try {
      await disconnectWallet(sessionId, authSession.user.id);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect wallet";
      throw createError({ statusCode: 500, statusMessage: message });
    }
  }

  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});

export default withRateLimit(handler, { maxRequests: 60, windowSec: 60 });
