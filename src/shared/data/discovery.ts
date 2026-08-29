import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Bonding Curves / Accumulation Data ────────────────────────
export const getBondingCurveData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const allTrades = trades || [];

    // Group trades by pair
    const pairMap = new Map<
      string,
      {
        pair: string;
        buyCount: number;
        sellCount: number;
        totalBuys: number;
        totalSells: number;
        totalVolume: number;
        lastTradeAt: string;
      }
    >();

    for (const t of allTrades) {
      const pair = t.pair || "UNKNOWN";
      const qty = t.quantity || 1;
      const price = t.entry_price || 0;
      const value = qty * price;
      const isBuy = t.direction === "long";

      if (pairMap.has(pair)) {
        const entry = pairMap.get(pair)!;
        if (isBuy) {
          entry.buyCount++;
          entry.totalBuys += qty;
        } else {
          entry.sellCount++;
          entry.totalSells += qty;
        }
        entry.totalVolume += value;
        if (new Date(t.created_at).getTime() > new Date(entry.lastTradeAt).getTime()) {
          entry.lastTradeAt = t.created_at;
        }
      } else {
        pairMap.set(pair, {
          pair,
          buyCount: isBuy ? 1 : 0,
          sellCount: isBuy ? 0 : 1,
          totalBuys: isBuy ? qty : 0,
          totalSells: isBuy ? 0 : qty,
          totalVolume: value,
          lastTradeAt: t.created_at,
        });
      }
    }

    // Sort by buy/sell ratio (accumulation signal)
    const pairs = [...pairMap.values()]
      .map((p) => ({
        ...p,
        ratio:
          p.buyCount > 0 && p.sellCount > 0
            ? p.buyCount / p.sellCount
            : p.buyCount > 0
              ? p.buyCount
              : 0,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    // Pairs being accumulated (buy count > sell count)
    const accumulating = pairs.filter((p) => p.buyCount > p.sellCount);

    // Most traded pair
    const mostTraded =
      pairs.length > 0 ? pairs.reduce((a, b) => (a.totalVolume > b.totalVolume ? a : b)) : null;

    return {
      pairs,
      accumulating,
      stats: {
        accumulatingCount: accumulating.length,
        uniquePairs: pairs.length,
        mostTradedPair: mostTraded?.pair || "—",
        mostTradedVolume: mostTraded?.totalVolume || 0,
      },
    };
  });
