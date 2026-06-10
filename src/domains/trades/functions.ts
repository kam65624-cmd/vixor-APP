// ============================================================================
// Trades Domain — Server Functions
// ============================================================================
//
// CRUD operations and statistics for the trades table.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { TradeDirection, TradeStatus, TradeStats, EquityCurvePoint } from "./types";

// ---------- CREATE TRADE ----------
export const createTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        pair: z.string().min(1).max(30),
        direction: z.enum(["long", "short"]),
        entry_price: z.number().positive(),
        quantity: z.number().positive().optional().nullable(),
        stop_loss: z.number().positive().optional().nullable(),
        take_profit: z.number().positive().optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
        tags: z.array(z.string().max(30)).max(10).default([]),
        strategy: z.string().max(100).optional().nullable(),
        analysis_id: z.string().uuid().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: trade, error } = await supabase
      .from("trades")
      .insert({
        user_id: userId,
        pair: data.pair,
        direction: data.direction as TradeDirection,
        entry_price: data.entry_price,
        quantity: data.quantity ?? null,
        stop_loss: data.stop_loss ?? null,
        take_profit: data.take_profit ?? null,
        notes: data.notes ?? null,
        tags: data.tags,
        strategy: data.strategy ?? null,
        analysis_id: data.analysis_id ?? null,
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return trade;
  });

// ---------- LIST TRADES ----------
export const listTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        status: z.enum(["open", "closed", "cancelled"]).optional(),
        pair: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("trades")
      .select("*")
      .eq("user_id", context.userId)
      .order("entry_date", { ascending: false })
      .limit(data.limit);

    if (data.status) query = query.eq("status", data.status);
    if (data.pair) query = query.eq("pair", data.pair);
    if (data.dateFrom) query = query.gte("entry_date", data.dateFrom);
    if (data.dateTo) query = query.lte("entry_date", data.dateTo);

    const { data: trades, error } = await query;
    if (error) throw new Error(error.message);
    return trades ?? [];
  });

// ---------- UPDATE TRADE ----------
export const updateTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        tradeId: z.string().uuid(),
        exit_price: z.number().positive().optional().nullable(),
        exit_date: z.string().optional().nullable(),
        status: z.enum(["open", "closed", "cancelled"]).optional(),
        stop_loss: z.number().positive().optional().nullable(),
        take_profit: z.number().positive().optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
        tags: z.array(z.string().max(30)).max(10).optional(),
        strategy: z.string().max(100).optional().nullable(),
        quantity: z.number().positive().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: {
      exit_price?: number | null;
      exit_date?: string | null;
      status?: TradeStatus;
      stop_loss?: number | null;
      take_profit?: number | null;
      notes?: string | null;
      tags?: string[];
      strategy?: string | null;
      quantity?: number | null;
    } = {};

    if (data.exit_price !== undefined) update.exit_price = data.exit_price;
    if (data.exit_date !== undefined) update.exit_date = data.exit_date;
    if (data.status !== undefined) update.status = data.status;
    if (data.stop_loss !== undefined) update.stop_loss = data.stop_loss;
    if (data.take_profit !== undefined) update.take_profit = data.take_profit;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.tags !== undefined) update.tags = data.tags;
    if (data.strategy !== undefined) update.strategy = data.strategy;
    if (data.quantity !== undefined) update.quantity = data.quantity;

    const { error } = await context.supabase
      .from("trades")
      .update(update)
      .eq("id", data.tradeId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- DELETE TRADE ----------
export const deleteTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ tradeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trades")
      .delete()
      .eq("id", data.tradeId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- GET TRADE STATS ----------
export const getTradeStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Fetch all closed trades for stats calculation
    const { data: trades, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "closed")
      .order("exit_date", { ascending: true })
      .limit(500);

    if (error) throw new Error(error.message);

    const closed = (trades ?? []) as Array<{
      id: string;
      pair: string;
      direction: string;
      pnl: number | null;
      pnl_pips: number | null;
      r_multiple: number | null;
      entry_price: number;
      exit_price: number | null;
      entry_date: string;
      exit_date: string | null;
      stop_loss: number | null;
    }>;

    // Also get total count including open trades
    const { count: totalCount, error: countError } = await supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw new Error(countError.message);

    const totalTrades = totalCount ?? 0;
    const closedTrades = closed.length;
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
    const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = closedTrades > 0 ? Math.round((winCount / closedTrades) * 100) : 0;

    // Total P&L
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const avgPnl = closedTrades > 0 ? totalPnl / closedTrades : 0;

    // Profit Factor: gross profit / |gross loss|
    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : null;

    // Max Drawdown (peak-to-trough)
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePnl = 0;
    for (const t of closed) {
      cumulativePnl += t.pnl ?? 0;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const drawdown = peak - cumulativePnl;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Average R-multiple
    const rMultiples = closed.filter((t) => t.r_multiple !== null).map((t) => t.r_multiple!);
    const avgRMultiple =
      rMultiples.length > 0
        ? Math.round((rMultiples.reduce((s, r) => s + r, 0) / rMultiples.length) * 100) / 100
        : null;

    // Best / worst trade
    const sortedByPnl = [...closed].sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    const bestTrade =
      sortedByPnl.length > 0
        ? { pnl: sortedByPnl[0].pnl ?? 0, pair: sortedByPnl[0].pair }
        : null;
    const worstTrade =
      sortedByPnl.length > 0
        ? { pnl: sortedByPnl[sortedByPnl.length - 1].pnl ?? 0, pair: sortedByPnl[sortedByPnl.length - 1].pair }
        : null;

    // Average holding time (hours)
    const holdingTimes = closed
      .filter((t) => t.exit_date && t.entry_date)
      .map((t) => {
        const entry = new Date(t.entry_date).getTime();
        const exit = new Date(t.exit_date!).getTime();
        return (exit - entry) / (1000 * 60 * 60);
      });
    const avgHoldingTimeHours =
      holdingTimes.length > 0
        ? Math.round((holdingTimes.reduce((s, h) => s + h, 0) / holdingTimes.length) * 10) / 10
        : null;

    // Win rate by pair
    const pairMap = new Map<string, { count: number; wins: number; pnl: number }>();
    closed.forEach((t) => {
      const existing = pairMap.get(t.pair) ?? { count: 0, wins: 0, pnl: 0 };
      pairMap.set(t.pair, {
        count: existing.count + 1,
        wins: existing.wins + ((t.pnl ?? 0) > 0 ? 1 : 0),
        pnl: existing.pnl + (t.pnl ?? 0),
      });
    });
    const winRateByPair = Array.from(pairMap.entries())
      .map(([pair, { count, wins, pnl }]) => ({
        pair,
        count,
        winRate: Math.round((wins / count) * 100),
        totalPnl: Math.round(pnl * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Win rate by direction
    const directionMap = new Map<string, { count: number; wins: number; pnl: number }>();
    closed.forEach((t) => {
      const dir = t.direction;
      const existing = directionMap.get(dir) ?? { count: 0, wins: 0, pnl: 0 };
      directionMap.set(dir, {
        count: existing.count + 1,
        wins: existing.wins + ((t.pnl ?? 0) > 0 ? 1 : 0),
        pnl: existing.pnl + (t.pnl ?? 0),
      });
    });
    const winRateByDirection = Array.from(directionMap.entries())
      .map(([direction, { count, wins, pnl }]) => ({
        direction,
        count,
        winRate: Math.round((wins / count) * 100),
        totalPnl: Math.round(pnl * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Win rate by day of week
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap = new Map<string, { count: number; wins: number; pnl: number }>();
    closed.forEach((t) => {
      if (!t.exit_date) return;
      const day = dayNames[new Date(t.exit_date).getUTCDay()];
      const existing = dayMap.get(day) ?? { count: 0, wins: 0, pnl: 0 };
      dayMap.set(day, {
        count: existing.count + 1,
        wins: existing.wins + ((t.pnl ?? 0) > 0 ? 1 : 0),
        pnl: existing.pnl + (t.pnl ?? 0),
      });
    });
    const tradingDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const winRateByDay = tradingDays
      .map((day) => {
        const d = dayMap.get(day);
        return d
          ? {
              day,
              count: d.count,
              winRate: Math.round((d.wins / d.count) * 100),
              totalPnl: Math.round(d.pnl * 100) / 100,
            }
          : { day, count: 0, winRate: 0, totalPnl: 0 };
      })
      .filter((d) => d.count > 0);

    const stats: TradeStats = {
      totalTrades,
      closedTrades,
      winCount,
      lossCount,
      winRate,
      totalPnl: Math.round(totalPnl * 100) / 100,
      avgPnl: Math.round(avgPnl * 100) / 100,
      profitFactor,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      avgRMultiple,
      bestTrade,
      worstTrade,
      avgHoldingTimeHours,
      winRateByPair,
      winRateByDirection,
      winRateByDay,
    };

    return stats;
  });

// ---------- GET EQUITY CURVE ----------
export const getEquityCurve = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades, error } = await supabase
      .from("trades")
      .select("exit_date, pnl")
      .eq("user_id", userId)
      .eq("status", "closed")
      .not("exit_date", "is", null)
      .order("exit_date", { ascending: true })
      .limit(500);

    if (error) throw new Error(error.message);

    const closed = (trades ?? []) as Array<{ exit_date: string; pnl: number | null }>;

    let cumulativePnl = 0;
    const curve: EquityCurvePoint[] = closed.map((t) => {
      cumulativePnl += t.pnl ?? 0;
      return {
        date: t.exit_date.split("T")[0], // YYYY-MM-DD
        cumulative_pnl: Math.round(cumulativePnl * 100) / 100,
      };
    });

    return curve;
  });
