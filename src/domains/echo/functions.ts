// ============================================================================
// ECHO — Tracking & Outcome & Learning — Server Functions
// ============================================================================
//
// getEchoOverview: Aggregates the user's decision/trade/note timeline
//                  into a single view. Uses Supabase directly to avoid
//                  coupling to the inconsistent APIs of upstream domains.
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
    const errors: string[] = [];
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

    // ── 1. Signal tracking records (most recent, non-terminal status) ─
    try {
      const { data, error } = await supabase
        .from("signal_tracking")
        .select("id, pair, status, source_type, created_at, activated_at, resolved_at")
        .eq("user_id", userId)
        .in("status", ["pending", "active", "tp1_hit", "tp2_hit", "tp3_hit"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      activeTrackings = data?.length ?? 0;
      for (const t of data ?? []) {
        timeline.push({
          id: `sig-${t.id}`,
          type: "DECISION",
          occurredAt: t.activated_at ?? t.resolved_at ?? t.created_at,
          title: `Tracking: ${t.pair}`,
          summary: `Status: ${t.status}. Source: ${t.source_type ?? "manual"}.`,
          tag: t.status,
        });
      }
    } catch (err) {
      errors.push(`signal_tracking: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── 2. Recent closed trades ─────────────────────────────────────
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("id, pair, direction, status, pnl, entry_date, exit_date, notes")
        .eq("user_id", userId)
        .eq("status", "closed")
        .order("exit_date", { ascending: false, nullsFirst: false })
        .limit(20);
      if (error) throw error;
      totalTrades = data?.length ?? 0;
      for (const trade of data ?? []) {
        const pnl = trade.pnl ?? 0;
        timeline.push({
          id: `trade-${trade.id}`,
          type: "TRADE",
          occurredAt: trade.exit_date ?? trade.entry_date,
          title: `${(trade.direction ?? "TRADE").toUpperCase()} ${trade.pair ?? "—"}`,
          summary: trade.notes ?? `Status: ${trade.status}.`,
          value: pnl,
          unit: "USD",
          tag: trade.status,
        });
      }
    } catch (err) {
      errors.push(`trades: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── 3. Recent notes ─────────────────────────────────────────────
    try {
      const { data, error } = await supabase
        .from("trading_notes")
        .select("id, title, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      recentNotesCount = data?.length ?? 0;
      for (const note of data ?? []) {
        timeline.push({
          id: `note-${note.id}`,
          type: "NOTE",
          occurredAt: note.created_at,
          title: note.title ?? "Note",
          summary: (note.content ?? "").slice(0, 100),
          tag: "JOURNAL",
        });
      }
    } catch (err) {
      errors.push(`notes: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── 4. Watchlist ────────────────────────────────────────────────
    try {
      const { data, error } = await supabase
        .from("watchlists")
        .select("id, name, sort_order, created_at")
        .eq("user_id", userId);
      if (error) throw error;
      watchlistCount = data?.length ?? 0;
    } catch (err) {
      errors.push(`watchlists: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── 5. Weekly performance (from trades table) ───────────────────
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
    } catch (err) {
      errors.push(`weekly: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── 6. Today's daily loop ───────────────────────────────────────
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("daily_loops")
        .select(
          "id, date, morning_prep_completed, watchlist_reviewed, london_session_traded, ny_session_traded, asian_session_traded, eod_review_completed, completion_percentage",
        )
        .eq("user_id", userId)
        .eq("date", today)
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        todayLoop = {
          completed: data.completion_percentage >= 100,
          morningPrep: data.morning_prep_completed,
          sessionTracking:
            data.watchlist_reviewed ||
            data.london_session_traded ||
            data.ny_session_traded ||
            data.asian_session_traded,
          eodReview: data.eod_review_completed,
        };
        timeline.push({
          id: `loop-${data.id}`,
          type: "LOOP",
          occurredAt: data.date,
          title: "Daily Loop",
          summary: todayLoop.completed
            ? "All three phases completed today."
            : `${[
                todayLoop.morningPrep ? "✓ Prep" : "○ Prep",
                todayLoop.sessionTracking ? "✓ Session" : "○ Session",
                todayLoop.eodReview ? "✓ Review" : "○ Review",
              ].join(" • ")}`,
          tag: todayLoop.completed ? "COMPLETED" : "IN_PROGRESS",
        });
      }
    } catch (err) {
      errors.push(`daily_loops: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ── Sort timeline newest first ─────────────────────────────────
    timeline.sort((a, b) => {
      const aT = new Date(a.occurredAt).getTime();
      const bT = new Date(b.occurredAt).getTime();
      return bT - aT;
    });

    if (errors.length > 0) {
      // Surface partial-degradation info in console (not to user)
      console.warn("[ECHO] Partial data:", errors);
    }

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
