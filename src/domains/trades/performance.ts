// ============================================================================
// VIXOR Performance Dashboard — Trading Performance Aggregation
// ============================================================================
//
// Calculates trading performance metrics from signal tracking transitions.
// Joins signal_transitions (terminal states) with signal_tracking (entry/SL/TP).
//
// ============================================================================

import { supabaseAdmin } from "@/shared/supabase/client.server";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TradingPerformance {
  totalTrades: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  profitFactor: number;
  totalPnlPct: number;
  bestTrade: { pair: string; pnlPct: number } | null;
  worstTrade: { pair: string; pnlPct: number } | null;
  avgDurationHours: number;
  byDirection: {
    long: { trades: number; winRate: number };
    short: { trades: number; winRate: number };
  };
}

interface TerminalTransitionRow {
  signal_tracking_id: string;
  user_id: string;
  from_status: string;
  to_status: string;
  observed_price: number | null;
  tp_index: number | null;
  created_at: string;
  // Joined from signal_tracking
  pair: string;
  direction: string;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number[] | null;
  activated_at: string | null;
  resolved_at: string | null;
  tracking_created_at: string;
}

// ── P&L Calculation ──────────────────────────────────────────────────────────

function calculateTradePnl(tracking: TerminalTransitionRow): number {
  const entry = tracking.entry_price ?? 0;
  const direction = tracking.direction;
  const tps: number[] = Array.isArray(tracking.take_profit) ? tracking.take_profit : [];

  if (entry === 0) return 0;

  if (tracking.to_status === "tp3_hit") {
    const tpPrice = tps.length >= 3 ? tps[2] : (tps[tps.length - 1] ?? 0);
    if (direction === "BUY") return ((tpPrice - entry) / entry) * 100;
    return ((entry - tpPrice) / entry) * 100;
  }

  if (tracking.to_status === "sl_hit") {
    const slPrice = tracking.stop_loss ?? 0;
    if (direction === "BUY") return ((slPrice - entry) / entry) * 100;
    return ((entry - slPrice) / entry) * 100;
  }

  // cancelled / expired / invalidated: 0 P&L
  return 0;
}

function calculateDurationHours(tracking: TerminalTransitionRow): number {
  const start = tracking.activated_at ?? tracking.tracking_created_at;
  const end = tracking.resolved_at;
  if (!start || !end) return 0;
  return (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
}

// ── Main Function ────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = ["tp3_hit", "sl_hit", "cancelled", "expired", "invalidated"];

/**
 * Calculate trading performance metrics from signal tracking transitions.
 */
export async function calculatePerformance(userId: string): Promise<TradingPerformance> {
  const emptyResult: TradingPerformance = {
    totalTrades: 0,
    winRate: 0,
    avgWinPct: 0,
    avgLossPct: 0,
    profitFactor: 0,
    totalPnlPct: 0,
    bestTrade: null,
    worstTrade: null,
    avgDurationHours: 0,
    byDirection: { long: { trades: 0, winRate: 0 }, short: { trades: 0, winRate: 0 } },
  };

  // 1. Fetch all signal_transitions for the user that resulted in terminal states
  //    Join with signal_tracking to get entry/SL/TP prices
  const { data: transitions, error } = await supabaseAdmin
    .from("signal_transitions")
    .select(
      `
      id,
      signal_tracking_id,
      user_id,
      from_status,
      to_status,
      observed_price,
      tp_index,
      created_at,
      signal_tracking:pair, direction, entry_price, stop_loss, take_profit, activated_at, resolved_at, created_at
    `,
    )
    .eq("user_id", userId)
    .in("to_status", TERMINAL_STATUSES);

  if (error || !transitions || transitions.length === 0) {
    return emptyResult;
  }

  // Flatten joined rows
  const rows: TerminalTransitionRow[] = transitions.map((t: any) => ({
    signal_tracking_id: t.signal_tracking_id,
    user_id: t.user_id,
    from_status: t.from_status,
    to_status: t.to_status,
    observed_price: t.observed_price,
    tp_index: t.tp_index,
    created_at: t.created_at,
    pair: t.signal_tracking?.pair ?? "",
    direction: t.signal_tracking?.direction ?? "",
    entry_price: t.signal_tracking?.entry_price ?? null,
    stop_loss: t.signal_tracking?.stop_loss ?? null,
    take_profit: t.signal_tracking?.take_profit ?? null,
    activated_at: t.signal_tracking?.activated_at ?? null,
    resolved_at: t.signal_tracking?.resolved_at ?? null,
    tracking_created_at: t.signal_tracking?.created_at ?? "",
  }));

  // 2. Calculate P&L for each trade
  const tradesWithPnl = rows.map((row) => ({
    ...row,
    pnlPct: calculateTradePnl(row),
    durationHours: calculateDurationHours(row),
  }));

  const totalTrades = tradesWithPnl.length;
  const wins = tradesWithPnl.filter((t) => t.pnlPct > 0);
  const losses = tradesWithPnl.filter((t) => t.pnlPct < 0);

  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const avgWinPct = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlPct, 0) / wins.length : 0;
  const avgLossPct =
    losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnlPct, 0) / losses.length : 0;

  // Profit factor: total wins / |total losses|
  const totalWins = wins.reduce((sum, t) => sum + t.pnlPct, 0);
  const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnlPct, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  const totalPnlPct = tradesWithPnl.reduce((sum, t) => sum + t.pnlPct, 0);

  // Best/worst trade
  const sorted = [...tradesWithPnl].sort((a, b) => b.pnlPct - a.pnlPct);
  const bestTrade = sorted[0] ? { pair: sorted[0].pair, pnlPct: sorted[0].pnlPct } : null;
  const worstTrade = sorted[sorted.length - 1]
    ? { pair: sorted[sorted.length - 1].pair, pnlPct: sorted[sorted.length - 1].pnlPct }
    : null;

  // Average duration
  const durations = tradesWithPnl.map((t) => t.durationHours).filter((d) => d > 0);
  const avgDurationHours =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  // By direction
  const longTrades = tradesWithPnl.filter((t) => t.direction === "BUY");
  const shortTrades = tradesWithPnl.filter((t) => t.direction === "SELL");
  const longWins = longTrades.filter((t) => t.pnlPct > 0).length;
  const shortWins = shortTrades.filter((t) => t.pnlPct > 0).length;

  return {
    totalTrades,
    winRate: Math.round(winRate * 100) / 100,
    avgWinPct: Math.round(avgWinPct * 100) / 100,
    avgLossPct: Math.round(avgLossPct * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    totalPnlPct: Math.round(totalPnlPct * 100) / 100,
    bestTrade,
    worstTrade,
    avgDurationHours: Math.round(avgDurationHours * 10) / 10,
    byDirection: {
      long: {
        trades: longTrades.length,
        winRate:
          longTrades.length > 0 ? Math.round((longWins / longTrades.length) * 10000) / 100 : 0,
      },
      short: {
        trades: shortTrades.length,
        winRate:
          shortTrades.length > 0 ? Math.round((shortWins / shortTrades.length) * 10000) / 100 : 0,
      },
    },
  };
}
