/**
 * GET /api/echo-stats
 * =====================
 * Returns ECHO domain aggregate stats from Supabase.
 * Exposes real numbers for the user's tracking & outcome learning surface.
 *
 * Read-only. No auth required — returns zeroed stats if Supabase is
 * not configured or tables are empty.
 *
 * Response shape:
 *   {
 *     signalTracking: { active, total, hitRate },
 *     trades: { total, wins, losses, netPnl, winRate },
 *     dailyLoop: { todayCompleted, currentStreak, daysLogged },
 *     watchlist: { count },
 *     notes: { total, recentWeek },
 *     fetchedAt: ISO timestamp,
 *     degraded: boolean (true if any source failed)
 *   }
 */

import { defineEventHandler } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";
import { cache, CACHE_TTL } from "@/shared/cache";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight } from "./_security";

const CACHE_KEY = "echo-stats";
const DAY_MS = 24 * 60 * 60 * 1000;

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  // Try cache first (30s)
  const cached = await cache.get<ReturnType<typeof buildPayload>>(CACHE_KEY);
  if (cached) return { ...cached, cached: true };

  const result = await buildPayload();
  await cache.set(CACHE_KEY, result, CACHE_TTL.MARKET_PRICES);

  if (result.degraded && result.signalTracking.active === 0) {
    // Surface as 200 with degraded flag rather than 5xx — UI can render empty state
    return result;
  }

  return result;
});

async function buildPayload() {
  const errors: string[] = [];
  const now = new Date().toISOString();
  const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  // ── Signal tracking stats ─────────────────────────────────────────────
  let signalTracking = {
    active: 0,
    total: 0,
    hitTp1: 0,
    hitTp2: 0,
    hitTp3: 0,
    stopped: 0,
    invalidated: 0,
  };
  try {
    const [activeResult, totalResult, tp1, tp2, tp3, stopped, invalidated] = await Promise.all([
      supabaseAdmin
        .from("signal_tracking")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "active", "tp1_hit", "tp2_hit", "tp3_hit"]),
      supabaseAdmin.from("signal_tracking").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("signal_tracking")
        .select("id", { count: "exact", head: true })
        .in("status", ["tp1_hit", "tp2_hit", "tp3_hit", "tp1_hit_only"]),
      supabaseAdmin
        .from("signal_tracking")
        .select("id", { count: "exact", head: true })
        .in("status", ["tp2_hit", "tp3_hit", "tp2_hit_only"]),
      supabaseAdmin
        .from("signal_tracking")
        .select("id", { count: "exact", head: true })
        .eq("status", "tp3_hit"),
      supabaseAdmin
        .from("signal_tracking")
        .select("id", { count: "exact", head: true })
        .eq("status", "stopped"),
      supabaseAdmin
        .from("signal_tracking")
        .select("id", { count: "exact", head: true })
        .eq("status", "invalidated"),
    ]);
    signalTracking = {
      active: activeResult.count ?? 0,
      total: totalResult.count ?? 0,
      hitTp1: tp1.count ?? 0,
      hitTp2: tp2.count ?? 0,
      hitTp3: tp3.count ?? 0,
      stopped: stopped.count ?? 0,
      invalidated: invalidated.count ?? 0,
    };
  } catch (err) {
    errors.push(`signal_tracking: ${err instanceof Error ? err.message : "unknown"}`);
  }

  // ── Trades stats ─────────────────────────────────────────────────────
  let trades = {
    total: 0,
    closed: 0,
    wins: 0,
    losses: 0,
    netPnl: 0,
    winRate: 0,
    bestTradePnl: 0,
    worstTradePnl: 0,
    last7Days: 0,
  };
  try {
    const { data: allTrades, error } = await supabaseAdmin
      .from("trades")
      .select("id, pnl, status, exit_date, direction, pair")
      .eq("status", "closed")
      .order("exit_date", { ascending: false, nullsFirst: false })
      .limit(500);

    if (error) throw error;

    const closed = allTrades ?? [];
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
    const netPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const sortedByPnl = [...closed].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    const last7Days = closed.filter(
      (t) => t.exit_date && new Date(t.exit_date) >= new Date(weekAgo),
    ).length;

    trades = {
      total: closed.length,
      closed: closed.length,
      wins: wins.length,
      losses: losses.length,
      netPnl: Math.round(netPnl * 100) / 100,
      winRate: closed.length > 0 ? Math.round((wins.length / closed.length) * 10000) / 100 : 0,
      bestTradePnl: sortedByPnl[0]?.pnl ?? 0,
      worstTradePnl: sortedByPnl[sortedByPnl.length - 1]?.pnl ?? 0,
      last7Days,
    };
  } catch (err) {
    errors.push(`trades: ${err instanceof Error ? err.message : "unknown"}`);
  }

  // ── Daily loops stats ───────────────────────────────────────────────
  const dailyLoop: {
    todayCompleted: boolean;
    todayPrep: boolean;
    todaySession: boolean;
    todayReview: boolean;
    totalDays: number;
    completedDays: number;
    currentStreak: number;
    longestStreak: number;
  } = {
    todayCompleted: false,
    todayPrep: false,
    todaySession: false,
    todayReview: false,
    totalDays: 0,
    completedDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  };
  try {
    const [todayResult, totalResult, completedResult, recentResult] = await Promise.all([
      supabaseAdmin
        .from("daily_loops")
        .select(
          "morning_prep_completed, watchlist_reviewed, london_session_traded, ny_session_traded, asian_session_traded, eod_review_completed, completion_percentage",
        )
        .eq("date", today)
        .maybeSingle(),
      supabaseAdmin.from("daily_loops").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("daily_loops")
        .select("id", { count: "exact", head: true })
        .eq("completion_percentage", 100),
      supabaseAdmin
        .from("daily_loops")
        .select("date, completion_percentage")
        .order("date", { ascending: false })
        .limit(60),
    ]);

    if (todayResult.data) {
      dailyLoop.todayPrep = todayResult.data.morning_prep_completed ?? false;
      dailyLoop.todaySession = !!(
        todayResult.data.watchlist_reviewed ||
        todayResult.data.london_session_traded ||
        todayResult.data.ny_session_traded ||
        todayResult.data.asian_session_traded
      );
      dailyLoop.todayReview = todayResult.data.eod_review_completed ?? false;
      dailyLoop.todayCompleted = (todayResult.data.completion_percentage ?? 0) >= 100;
    }

    dailyLoop.totalDays = totalResult.count ?? 0;
    dailyLoop.completedDays = completedResult.count ?? 0;

    // Compute current streak from recent results
    let streak = 0;
    for (const day of recentResult.data ?? []) {
      if ((day.completion_percentage ?? 0) >= 100) {
        streak++;
      } else {
        break;
      }
    }
    dailyLoop.currentStreak = streak;
    dailyLoop.longestStreak = Math.max(streak, dailyLoop.completedDays);
  } catch (err) {
    errors.push(`daily_loops: ${err instanceof Error ? err.message : "unknown"}`);
  }

  // ── Watchlist stats ─────────────────────────────────────────────────
  let watchlist = { count: 0, alertsEnabled: 0 };
  try {
    const [all, withAlerts] = await Promise.all([
      supabaseAdmin.from("watchlists").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("user_watchlist")
        .select("id", { count: "exact", head: true })
        .eq("alert_enabled", true),
    ]);
    watchlist = {
      count: (all.count ?? 0) + (withAlerts.count ?? 0),
      alertsEnabled: withAlerts.count ?? 0,
    };
  } catch (err) {
    errors.push(`watchlist: ${err instanceof Error ? err.message : "unknown"}`);
  }

  // ── Notes stats ─────────────────────────────────────────────────────
  let notes = { total: 0, recentWeek: 0 };
  try {
    const [totalRes, weekRes] = await Promise.all([
      supabaseAdmin.from("trading_notes").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("trading_notes")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
    ]);
    notes = {
      total: totalRes.count ?? 0,
      recentWeek: weekRes.count ?? 0,
    };
  } catch (err) {
    errors.push(`notes: ${err instanceof Error ? err.message : "unknown"}`);
  }

  if (errors.length > 0) {
    console.warn("[echo-stats] Partial data:", errors);
  }

  return {
    signalTracking,
    trades,
    dailyLoop,
    watchlist,
    notes,
    fetchedAt: now,
    degraded: errors.length > 0,
  };
}

export default withRateLimit(handler, { maxRequests: 60, windowSec: 60 });
