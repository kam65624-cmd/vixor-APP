// ============================================================================
// VIXOR Trade Domain — Server Functions
// ============================================================================
// Real server functions for trading dashboard, chart candles, signals, PnL,
// and Jupiter swap quote execution.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { detectPatterns } from "./pattern-detector";
import type { Candle } from "./pattern-detector";
import { fetchJupiterQuote, SOLANA_MINTS } from "./jupiter-client";

export interface DashboardStatsResult {
  totalPnlUsd: number;
  dailyPnlUsd: number;
  winRatePct: number;
  totalTradesCount: number;
  recentTrades: Array<{
    id: string;
    token_symbol: string;
    side: string;
    amount: number;
    price_usd: number;
    total_usd: number;
    pnl_usd: number;
    pnl_pct: number;
    status: string;
    created_at: string;
  }>;
}

/** 1. Dashboard Data — calculate portfolio stats & recent trades from Supabase */
export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardStatsResult> => {
    const { supabase, userId } = context;

    // Recent 5 trades
    const { data: recentTrades } = await (supabase.from as any)("user_trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // All trades for PnL calculation
    const { data: allTrades } = await (supabase.from as any)("user_trades")
      .select("pnl_usd, created_at")
      .eq("user_id", userId);

    const tradesList = (allTrades || []) as Array<{ pnl_usd: number | null; created_at: string }>;

    let totalPnlUsd = 0;
    let dailyPnlUsd = 0;
    let winCount = 0;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    tradesList.forEach((t) => {
      const pnl = t.pnl_usd || 0;
      totalPnlUsd += pnl;
      if (pnl > 0) winCount++;
      if (new Date(t.created_at) >= oneDayAgo) {
        dailyPnlUsd += pnl;
      }
    });

    const totalTradesCount = tradesList.length;
    const winRatePct = totalTradesCount > 0 ? (winCount / totalTradesCount) * 100 : 0;

    return {
      totalPnlUsd,
      dailyPnlUsd,
      winRatePct,
      totalTradesCount,
      recentTrades: (recentTrades || []).map((tr: any) => ({
        id: tr.id,
        token_symbol: tr.token_symbol || "SOL",
        side: tr.side || "buy",
        amount: Number(tr.amount || 0),
        price_usd: Number(tr.price_usd || 0),
        total_usd: Number(tr.total_usd || 0),
        pnl_usd: Number(tr.pnl_usd || 0),
        pnl_pct: Number(tr.pnl_pct || 0),
        status: tr.status || "confirmed",
        created_at: tr.created_at,
      })),
    };
  });

export interface BinanceCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** 2. Trade Chart OHLCV Candles from Binance API */
export const getCandles = createServerFn({ method: "GET" })
  .validator(
    z.object({
      symbol: z.string().default("BTCUSDT"),
      interval: z.string().default("1h"),
      limit: z.number().default(200),
    }),
  )
  .handler(async ({ data }): Promise<BinanceCandle[]> => {
    const symbol = data.symbol.toUpperCase().replace("/", "");
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${data.interval}&limit=${data.limit}`,
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch candles for ${symbol}: ${res.statusText}`);
    }

    const json = (await res.json()) as any[];
    return json.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000), // seconds timestamp for lightweight-charts
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  });

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

/** 2b. Trade Chart 24hr Ticker from Binance API */
export const getTicker = createServerFn({ method: "GET" })
  .validator(z.object({ symbol: z.string().default("BTCUSDT") }))
  .handler(async ({ data }): Promise<BinanceTicker> => {
    const symbol = data.symbol.toUpperCase().replace("/", "");
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch ticker for ${symbol}`);
    }
    return (await res.json()) as BinanceTicker;
  });

/** 3. Technical Signals from Pattern Detector */
export const getTechnicalSignals = createServerFn({ method: "GET" })
  .validator(
    z.object({
      symbol: z.string().default("BTCUSDT"),
      interval: z.string().default("1h"),
    }),
  )
  .handler(async ({ data }) => {
    const symbol = data.symbol.toUpperCase().replace("/", "");
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${data.interval}&limit=100`,
    );

    if (!res.ok) return { patterns: [], symbol };
    const rawK = (await res.json()) as any[];
    const candles: Candle[] = rawK.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    const patterns = detectPatterns(candles, data.interval);
    return {
      symbol: data.symbol,
      interval: data.interval,
      patterns,
      lastPrice: candles.length > 0 ? candles[candles.length - 1].close : 0,
    };
  });

/** 4. User Trades for PnL Tracker */
export const getUserTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await (supabase.from as any)("user_trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const tradesList = (trades || []) as any[];
    let totalPnl = 0;
    let winCount = 0;
    let bestTradePnl = -Infinity;
    let worstTradePnl = Infinity;

    tradesList.forEach((tr) => {
      const pnl = Number(tr.pnl_usd || 0);
      totalPnl += pnl;
      if (pnl > 0) winCount++;
      if (pnl > bestTradePnl) bestTradePnl = pnl;
      if (pnl < worstTradePnl) worstTradePnl = pnl;
    });

    const totalTrades = tradesList.length;
    const winRatePct = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    return {
      trades: tradesList,
      summary: {
        totalPnlUsd: totalPnl,
        totalTrades,
        winRatePct,
        bestTradeUsd: bestTradePnl === -Infinity ? 0 : bestTradePnl,
        worstTradeUsd: worstTradePnl === Infinity ? 0 : worstTradePnl,
      },
    };
  });

/** 5. Trade Execute / Swap Quote via Jupiter V6 */
export const getJupiterSwapQuote = createServerFn({ method: "GET" })
  .validator(
    z.object({
      inputMint: z.string(),
      outputMint: z.string(),
      amount: z.number().positive(),
      slippageBps: z.number().optional().default(100),
    }),
  )
  .handler(async ({ data }) => {
    const amountLamports = Math.floor(data.amount * 1e9);
    const quote = await fetchJupiterQuote(
      data.inputMint,
      data.outputMint,
      amountLamports,
      data.slippageBps,
    );
    return quote;
  });

/** 5b. Save a trade execution record to user_trades */
export const saveUserTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      tokenAddress: z.string(),
      tokenSymbol: z.string(),
      chain: z.string().default("solana"),
      side: z.enum(["buy", "sell"]),
      amount: z.number(),
      priceUsd: z.number().optional(),
      totalUsd: z.number().optional(),
      status: z.enum(["pending", "confirmed", "failed", "cancelled"]).default("pending"),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: inserted, error } = await (supabase.from as any)("user_trades")
      .insert({
        user_id: userId,
        token_address: data.tokenAddress,
        token_symbol: data.tokenSymbol,
        chain: data.chain,
        side: data.side,
        amount: data.amount,
        price_usd: data.priceUsd ?? 0,
        total_usd: data.totalUsd ?? 0,
        status: data.status,
      })
      .select("id")
      .single();

    return { ok: !error, tradeId: (inserted as any)?.id ?? null, error: error?.message ?? null };
  });

/** 6. Get popular Jupiter SPL tokens list */
export const getPopularSwapTokens = createServerFn({ method: "GET" }).handler(async () => {
  return SOLANA_MINTS;
});
