/**
 * GET /api/echo-stats
 *
 * TEMPORARILY DISABLED.
 *
 * The former implementation queried cross-user trading, P&L, win-rate,
 * signal-tracking, journal and activity aggregates through supabaseAdmin
 * without authenticating or scoping the caller. Returning a global aggregate
 * is not an acceptable substitute for a user-scoped authorization boundary.
 *
 * Keep this endpoint fail-closed until the ECHO read model is redesigned for
 * the approved crypto-only product scope and authenticated per-user access.
 */
import { defineEventHandler, setResponseStatus } from "h3";

export default defineEventHandler((event) => {
  setResponseStatus(event, 404);
  return { error: "Not found" };
});
