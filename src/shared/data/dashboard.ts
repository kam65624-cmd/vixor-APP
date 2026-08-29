import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Dashboard Aggregated Data ────────────────────────
export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: trades }, { data: signals }, { data: analyses }, { data: profile }] =
      await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("daily_signals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("analyses")
          .select("id, pair, recommendation, confidence, created_at, status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("profiles")
          .select("username, display_name, xp, streak_days")
          .eq("id", userId)
          .single(),
      ]);

    // Compute portfolio from trades
    const holdingMap = new Map<
      string,
      { symbol: string; amount: number; value: number; pnl: number; pnlPct: number; up: boolean }
    >();
    for (const t of trades || []) {
      const sym = t.pair || "UNKNOWN";
      const pnl = (t.exit_price || 0) - t.entry_price;
      const price = t.exit_price || t.entry_price;
      const qty = t.quantity || 1;
      const value = qty * price;
      const pnlPct = t.entry_price ? ((price - t.entry_price) / t.entry_price) * 100 : 0;
      if (holdingMap.has(sym)) {
        const e = holdingMap.get(sym)!;
        e.amount += qty;
        e.value += value;
        e.pnl += pnl;
        e.pnlPct = pnlPct;
        e.up = pnlPct >= 0;
      } else {
        holdingMap.set(sym, { symbol: sym, amount: qty, value, pnl, pnlPct, up: pnlPct >= 0 });
      }
    }
    const holdings = [...holdingMap.values()].sort((a, b) => b.value - a.value).slice(0, 5);
    const totalValue = holdings.reduce((s, h) => s + h.value, 0);
    const totalPnl = holdings.reduce((s, h) => s + h.pnl, 0);
    const totalPnlPct = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;

    // Recent activity from trades
    const recentActivity = (trades || []).slice(0, 5).map((t) => ({
      msg: `${t.direction === "long" ? "Bought" : "Shorted"} ${t.quantity || 0} ${t.pair} at $${t.entry_price}`,
      time: formatRelativeTime(t.created_at),
      type: t.direction as "buy" | "sell",
      pnl:
        t.pnl != null
          ? t.pnl >= 0
            ? `+$${t.pnl.toFixed(2)}`
            : `-$${Math.abs(t.pnl).toFixed(2)}`
          : "",
    }));

    // Signals from daily_signals
    const liveSignals = (signals || []).slice(0, 5).map((s) => ({
      token: s.pair.split("/")[0] || s.pair,
      type: s.recommendation as "BUY" | "SELL" | "WAIT",
      reason: s.reasons?.[0] || "Technical analysis signal",
      confidence: s.confidence,
      price: s.entry ? `$${s.entry}` : "—",
    }));

    return {
      holdings,
      totalValue,
      totalPnl,
      totalPnlPct,
      tradeCount: trades?.length ?? 0,
      recentActivity,
      liveSignals,
      profile: profile || null,
      winRate: trades?.length
        ? Math.round((trades.filter((t) => (t.pnl ?? 0) > 0).length / trades.length) * 100)
        : 0,
      assetCount: holdingMap.size,
    };
  });

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Home Market Overview (public — no auth) ─────────────────────
export interface HomeTickerItem {
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
}

export interface HomeMarketData {
  tickers: HomeTickerItem[];
  fearGreedIndex: { value: number; label: string; change: number } | null;
  marketOverview: {
    totalVolume: number;
    btcDominance: number;
    topGainers: HomeTickerItem[];
    topLosers: HomeTickerItem[];
  } | null;
}

export const getHomeMarketData = createServerFn({ method: "GET" }).handler(async () => {
  // Fetch 20 top crypto prices directly from Binance (no API key needed)
  let tickers: HomeTickerItem[] = [];
  let marketOverview: HomeMarketData["marketOverview"] = null;

  // Expanded symbol list — top 20 cryptos by volume
  const symbols = [
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDT",
    "BNBUSDT",
    "XRPUSDT",
    "DOGEUSDT",
    "ADAUSDT",
    "AVAXUSDT",
    "DOTUSDT",
    "LINKUSDT",
    "MATICUSDT",
    "UNIUSDT",
    "ATOMUSDT",
    "LTCUSDT",
    "NEARUSDT",
    "APTUSDT",
    "ARBUSDT",
    "OPUSDT",
    "FILUSDT",
    "INJUSDT",
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbols=" + JSON.stringify(symbols),
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        tickers = data.map((t: any) => ({
          symbol: (t.symbol || "").replace("USDT", ""),
          price: parseFloat(t.lastPrice) || 0,
          change24h: parseFloat(t.priceChangePercent) || 0,
          volume24h: parseFloat(t.quoteVolume) || 0,
          high24h: parseFloat(t.highPrice) || 0,
          low24h: parseFloat(t.lowPrice) || 0,
        }));

        // Compute market overview
        const totalVolume = tickers.reduce((s: number, t: any) => s + (t.volume24h || 0), 0);
        const sorted = [...tickers].sort((a: any, b: any) => b.change24h - a.change24h);

        marketOverview = {
          totalVolume,
          btcDominance: 0, // Would need market cap API for accurate value
          topGainers: sorted.slice(0, 3),
          topLosers: sorted.slice(-3).reverse(),
        };
      }
    }
  } catch (e) {
    console.warn("[Home] Failed to fetch Binance tickers:", e);
  }

  // Fear & Greed Index from alternative.me (free, no API key)
  let fearGreedIndex: HomeMarketData["fearGreedIndex"] = null;
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=2", {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    const current = json?.data?.[0];
    const prev = json?.data?.[1];
    if (current) {
      fearGreedIndex = {
        value: Number(current.value) || 0,
        label: (current.value_classification as string) || "Neutral",
        change: prev ? Number(current.value) - Number(prev.value) : 0,
      };
    }
  } catch (e) {
    console.warn("[Home] Failed to fetch Fear & Greed Index:", e);
  }

  // BTC dominance from CoinGecko (free, no key needed)
  let btcDominance = 0;
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    btcDominance = json?.data?.market_cap_percentage?.btc ?? 0;
    if (marketOverview) {
      marketOverview.btcDominance = btcDominance;
    }
  } catch (e) {
    console.warn("[Home] Failed to fetch BTC dominance:", e);
  }

  return { tickers, fearGreedIndex, marketOverview } satisfies HomeMarketData;
});
