import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Yield Data (for yield page) ────────────────────────
export const getYieldData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "closed")
      .order("created_at", { ascending: false });

    const allClosed = trades || [];
    const profitable = allClosed.filter((t) => (t.pnl ?? 0) > 0);

    const totalYield = profitable.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgYield = profitable.length > 0 ? totalYield / profitable.length : 0;
    const bestYield = profitable.length > 0 ? Math.max(...profitable.map((t) => t.pnl ?? 0)) : 0;
    const bestTrade = profitable.find((t) => t.pnl === bestYield) || null;

    // Build yield positions from profitable trades
    const yieldPositions = profitable.map((t) => {
      const entryDate = new Date(t.entry_date || t.created_at);
      const exitDate = new Date(t.exit_date || t.created_at);
      const durationMs = exitDate.getTime() - entryDate.getTime();
      const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
      const yieldPct =
        t.entry_price > 0 ? ((t.pnl ?? 0) / (t.entry_price * (t.quantity || 1))) * 100 : 0;

      return {
        id: t.id,
        pair: t.pair,
        yield: t.pnl ?? 0,
        yieldPct,
        duration: durationDays,
        entryPrice: t.entry_price,
        exitPrice: t.exit_price ?? t.entry_price,
        direction: t.direction,
        quantity: t.quantity ?? 1,
        rMultiple: t.r_multiple,
        entryDate: t.entry_date || t.created_at,
        exitDate: t.exit_date || t.created_at,
      };
    });

    return {
      totalYield,
      avgYield,
      bestYield,
      bestTrade: bestTrade
        ? {
            pair: bestTrade.pair,
            yield: bestTrade.pnl ?? 0,
            direction: bestTrade.direction,
          }
        : null,
      yieldCount: profitable.length,
      totalClosed: allClosed.length,
      positions: yieldPositions,
    };
  });

// ── Perpetuals / Positions Data ────────────────────────
export const getPerpetualsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Open positions
    const { data: openTrades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    // Recent closed trades
    const { data: closedTrades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "open")
      .order("exit_date", { ascending: false })
      .limit(20);

    const openPositions = (openTrades || []).map((t) => ({
      id: t.id,
      pair: t.pair || "—",
      direction: t.direction === "long" ? "LONG" : "SHORT",
      entryPrice: t.entry_price || 0,
      quantity: t.quantity || 1,
      stopLoss: t.stop_loss,
      takeProfit: t.take_profit,
      pnl: t.pnl || 0,
      rMultiple: t.r_multiple || 0,
      createdAt: t.created_at,
      entryDate: t.entry_date,
    }));

    const closedPerformance = (closedTrades || []).map((t) => ({
      id: t.id,
      pair: t.pair || "—",
      direction: t.direction === "long" ? "LONG" : "SHORT",
      entryPrice: t.entry_price || 0,
      exitPrice: t.exit_price || 0,
      quantity: t.quantity || 1,
      pnl: t.pnl || 0,
      rMultiple: t.r_multiple || 0,
      status: t.status,
      createdAt: t.created_at,
      exitDate: t.exit_date,
    }));

    // Compute stats
    const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
    const totalRealizedPnl = closedPerformance.reduce((sum, t) => sum + t.pnl, 0);

    // Best performing pair from closed trades
    const pairPnlMap = new Map<string, number>();
    for (const t of closedPerformance) {
      pairPnlMap.set(t.pair, (pairPnlMap.get(t.pair) || 0) + t.pnl);
    }
    let bestPair = "—";
    let bestPnl = -Infinity;
    for (const [pair, pnl] of pairPnlMap) {
      if (pnl > bestPnl) {
        bestPnl = pnl;
        bestPair = pair;
      }
    }
    if (bestPnl === -Infinity) bestPnl = 0;

    const winningTrades = closedPerformance.filter((t) => t.pnl > 0).length;
    const totalClosed = closedPerformance.length;
    const winRate = totalClosed > 0 ? Math.round((winningTrades / totalClosed) * 100) : 0;

    return {
      openPositions,
      closedPerformance,
      stats: {
        openCount: openPositions.length,
        totalUnrealizedPnl,
        totalRealizedPnl,
        bestPair,
        bestPairPnl: bestPnl,
        winRate,
        totalClosed,
      },
    };
  });

// ── Arbitrage Scanner ─────────────────────────────────────────
export type ArbitrageScanResponse = {
  scannedAt: number;
  mode: string;
  opportunities: Array<{
    id: string;
    strategy: string;
    startToken: string;
    endToken: string;
    grossProfitBps: number;
    netProfitBps: number;
    confidence: number;
    legs: Array<{
      venue: string;
      inputSymbol: string;
      outputSymbol: string;
    }>;
  }>;
  rejected: Array<{ reason: string; strategy: string }>;
  durationMs: number;
};

export const scanArbitrage = createServerFn({ method: "GET" }).handler(async () => {
  // Arbitrage engine was removed — return empty mock response
  return {
    scannedAt: Date.now(),
    mode: "mock" as const,
    opportunities: [],
    rejected: [],
    durationMs: 0,
  } satisfies ArbitrageScanResponse;
});
