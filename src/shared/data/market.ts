import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Whale Alerts Data ────────────────────────
export const getWhaleData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const allTrades = trades || [];

    // Compute trade value (quantity * entry_price) and sort descending
    const tradesWithValue = allTrades.map((t) => ({
      ...t,
      tradeValue: (t.quantity || 1) * (t.entry_price || 0),
    }));

    const sorted = tradesWithValue.sort((a, b) => b.tradeValue - a.tradeValue);
    const topWhales = sorted.slice(0, 20);

    // 24h volume
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recentTrades = allTrades.filter((t) => new Date(t.created_at).getTime() > dayAgo);
    const volume24h = recentTrades.reduce(
      (sum, t) => sum + (t.quantity || 1) * (t.entry_price || 0),
      0,
    );

    // Biggest trade
    const biggest = topWhales[0] || null;

    return {
      whaleTrades: topWhales,
      stats: {
        volume24h,
        largeTradeCount: topWhales.length,
        biggestTrade: biggest ? biggest.tradeValue : 0,
        biggestPair: biggest?.pair || "—",
      },
    };
  });

// ── Market Pulse Data ────────────────────────
export const getPulseData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: signals } = await supabase
      .from("daily_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const allTrades = trades || [];
    const allSignals = signals || [];

    // Build pulse feed from trades
    const pulseFeed = allTrades.map((t) => ({
      id: t.id,
      type: "trade" as const,
      action: t.direction === "long" ? "BOUGHT" : "SOLD",
      pair: t.pair || "—",
      price: t.entry_price,
      quantity: t.quantity,
      pnl: t.pnl,
      status: t.status,
      createdAt: t.created_at,
    }));

    // Build pulse feed from signals
    const signalFeed = allSignals.map((s) => ({
      id: s.id,
      type: "signal" as const,
      action: s.recommendation,
      pair: s.pair || "—",
      confidence: s.confidence,
      pattern: s.pattern,
      createdAt: s.created_at,
    }));

    // Merge and sort by time
    const combined = [
      ...pulseFeed.map((p) => ({ ...p, _time: new Date(p.createdAt).getTime() })),
      ...signalFeed.map((s) => ({ ...s, _time: new Date(s.createdAt).getTime() })),
    ].sort((a, b) => b._time - a._time);

    // Stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tradesToday = allTrades.filter((t) => new Date(t.created_at) >= todayStart).length;
    const signalsToday = allSignals.filter((s) => new Date(s.created_at) >= todayStart).length;

    // Most active pair
    const pairCounts = new Map<string, number>();
    for (const t of allTrades) {
      const pair = t.pair || "—";
      pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
    }
    let mostActivePair = "—";
    let maxCount = 0;
    for (const [pair, count] of pairCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostActivePair = pair;
      }
    }

    return {
      feed: combined,
      stats: {
        tradesToday,
        signalsToday,
        mostActivePair,
        totalTrades: allTrades.length,
        totalSignals: allSignals.length,
      },
    };
  });
