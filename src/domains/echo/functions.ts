// ============================================================================
// ECHO — Tracking & Outcome & Learning — Server Functions
// ============================================================================
//
// getEchoOverview: Aggregates the user's decision/trade/note timeline
//                  into a single view. Uses Supabase directly to avoid
//                  coupling to the inconsistent APIs of upstream domains.
//
// Schema reference (see src/shared/supabase/types.ts):
//   - signal_tracking: id, user_id, pair, direction, status, entry_price,
//                       created_at, pnl, source_type, ...
//   - trades: id, user_id, pair, direction, status, entry_date, exit_date,
//              pnl, notes, tags, ...
//   - watchlists: id, user_id, name, sort_order, created_at
//   - daily_loops: id, user_id, date, morning_prep_completed,
//                    eod_review_completed, completion_percentage, ...
//
// Design rules:
//   1. GRACEFUL — every underlying call is wrapped in try/catch
//   2. TIMELINE-ORDERED — entries are sorted by occurredAt desc
//   3. READ-ONLY — ECHO never mutates anything
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { EchoOverview, TimelineEntry, WeeklySummary } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Server Function: getEchoOverview ────────────────────────────────────────

export const getEchoOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EchoOverview> => {
    const { supabase, userId } = context;
    const timeline: TimelineEntry[] = [];
    let activeTrackings = 0;
    let totalTrades = 0;
    let watchlistCount = 0;
    let recentNotesCount = 0;
    let recentWeek: WeeklySummary | undefined;
    let todayLoop: EchoOverview["todayLoop"] = {
      completed: false,
      morningPrep: false,
      sessionTracking: false,
      eodReview: false,
    };

    // ── 1. Signal trackings (most recent, active status) ───────────
    try {
      const { data, error } = await supabase
        .from("signal_tracking")
        .select("id, pair, direction, status, created_at")
        .eq("user_id", userId)
        .in("status", ["active", "pending", "tp1_hit", "tp2_hit", "tp3_hit"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      activeTrackings = data?.length ?? 0;
      for (const t of data ?? []) {
        timeline.push({
          id: `sig-${t.id}`,
          type: "DECISION",
          occurredAt: t.created_at,
          title: `Tracking: ${t.pair}`,
          summary: `${t.direction.toUpperCase()} • Status: ${t.status}.`,
          tag: t.status,
        });
      }
    } catch {
      // Skip signal trackings if unavailable
    }

    // ── 2. Recent closed trades ─────────────────────────────────────
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("id, pair, direction, status, pnl, entry_date, exit_date, notes, created_at")
        .eq("user_id", userId)
        .order("exit_date", { ascending: false, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      totalTrades = data?.length ?? 0;
      recentNotesCount = (data ?? []).filter((t) => t.notes && t.notes.length > 0).length;
      for (const trade of data ?? []) {
        const pnl = trade.pnl ?? 0;
        timeline.push({
          id: `trade-${trade.id}`,
          type: "TRADE",
          occurredAt: trade.exit_date ?? trade.entry_date ?? trade.created_at,
          title: `${trade.direction.toUpperCase()} ${trade.pair}`,
          summary: trade.notes ?? `Status: ${trade.status}.`,
          value: pnl,
          unit: "USD",
          tag: trade.status,
        });
      }
    } catch {
      // Skip trades if unavailable
    }

    // ── 3. Watchlist ────────────────────────────────────────────────
    try {
      const { data, error } = await supabase
        .from("watchlists")
        .select("id, name, created_at")
        .eq("user_id", userId);
      if (error) throw error;
      watchlistCount = data?.length ?? 0;
      for (const w of data ?? []) {
        timeline.push({
          id: `watch-${w.id}`,
          type: "WATCHLIST",
          occurredAt: w.created_at,
          title: `Watchlist: ${w.name}`,
          summary: "Saved watchlist.",
          tag: "WATCHING",
        });
      }
    } catch {
      // Skip watchlist if unavailable
    }

    // ── 4. Weekly performance (from trades table) ───────────────────
    try {
      const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
      const { data, error } = await supabase
        .from("trades")
        .select("id, pair, direction, pnl, status, exit_date")
        .eq("user_id", userId)
        .eq("status", "closed")
        .gte("exit_date", weekAgo);
      if (error) throw error;
      const trades = data ?? [];
      const wins = trades.filter((t) => (t.pnl ?? 0) > 0).length;
      const losses = trades.filter((t) => (t.pnl ?? 0) < 0).length;
      const netPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
      const sortedByPnl = [...trades].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
      const best = sortedByPnl[0];
      const worst = sortedByPnl[sortedByPnl.length - 1];
      recentWeek = {
        weekStart: weekAgo,
        weekEnd: new Date().toISOString(),
        totalTrades: trades.length,
        wins,
        losses,
        netPnlUsd: netPnl,
        winRate,
        bestTrade: best
          ? { title: `${best.direction} ${best.pair}`, pnlUsd: best.pnl ?? 0 }
          : undefined,
        worstTrade: worst
          ? { title: `${worst.direction} ${worst.pair}`, pnlUsd: worst.pnl ?? 0 }
          : undefined,
      };
    } catch {
      // Skip weekly summary if unavailable
    }

    // ── 5. Today's daily loop ───────────────────────────────────────
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("daily_loops")
        .select(
          "id, date, morning_prep_completed, eod_review_completed, london_session_traded, ny_session_traded, asian_session_traded, completion_percentage",
        )
        .eq("user_id", userId)
        .eq("date", today)
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        const sessionTraded =
          data.london_session_traded || data.ny_session_traded || data.asian_session_traded;
        todayLoop = {
          completed: !!data.morning_prep_completed && !!data.eod_review_completed,
          morningPrep: !!data.morning_prep_completed,
          sessionTracking: sessionTraded,
          eodReview: !!data.eod_review_completed,
        };
        timeline.push({
          id: `loop-${data.id}`,
          type: "LOOP",
          occurredAt: data.date,
          title: "Daily Loop",
          summary: todayLoop.completed
            ? "All phases completed today."
            : `${[
                todayLoop.morningPrep ? "✓ Prep" : "○ Prep",
                todayLoop.sessionTracking ? "✓ Session" : "○ Session",
                todayLoop.eodReview ? "✓ Review" : "○ Review",
              ].join(" • ")}`,
          tag: todayLoop.completed ? "COMPLETED" : "IN_PROGRESS",
        });
      }
    } catch {
      // Skip daily loop if unavailable
    }

    // ── Sort timeline newest first ─────────────────────────────────
    timeline.sort((a, b) => {
      const aT = new Date(a.occurredAt).getTime();
      const bT = new Date(b.occurredAt).getTime();
      return bT - aT;
    });

    return {
      timeline: timeline.slice(0, 30),
      activeTrackings,
      totalTrades,
      recentWeek,
      watchlistCount,
      recentNotesCount,
      todayLoop,
      fetchedAt: new Date().toISOString(),
    };
  });
