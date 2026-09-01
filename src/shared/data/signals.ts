import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { fetchBinanceKlines, fetchPrice } from "@/domains/market/server/price-fetcher";
import { detectPatterns } from "@/domains/trade/pattern-detector";

// ── Trading Journal ─────────────────────────
export const getJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: entries } = await supabase
      .from("trading_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { entries: entries || [] };
  });

// Pairs to scan for live signals if DB signals are sparse
const SIGNAL_SCAN_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "DOGE/USDT",
  "BNB/USDT",
  "ADA/USDT",
  "AVAX/USDT",
];

// ── Daily Signals (for signals page) ────────────────────────
export const getDailySignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // First try DB
    const { data: dbSignals } = await supabase
      .from("daily_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (dbSignals && dbSignals.length >= 5) {
      return { signals: dbSignals };
    }

    // If DB is empty or has <5 signals, calculate live signals from Binance OHLCV pattern detection
    const liveSignals = [];

    for (const pair of SIGNAL_SCAN_PAIRS) {
      try {
        const [klines, priceInfo] = await Promise.all([
          fetchBinanceKlines(pair, "1h", 50),
          fetchPrice(pair),
        ]);

        if (!klines || klines.length < 10) continue;

        const patterns = detectPatterns(klines, "1h");
        if (patterns.length === 0) continue;

        const primary = patterns[0];
        const currentPrice = priceInfo?.price ?? klines[klines.length - 1].close;

        // Calculate entry, stop_loss, take_profit
        const isBull = primary.type === "bullish";
        const stopLoss = isBull ? currentPrice * 0.97 : currentPrice * 1.03;
        const takeProfit1 = isBull ? currentPrice * 1.05 : currentPrice * 0.95;
        const takeProfit2 = isBull ? currentPrice * 1.09 : currentPrice * 0.91;

        const recommendation: "BUY" | "SELL" | "WAIT" =
          primary.type === "bullish" ? "BUY" : primary.type === "bearish" ? "SELL" : "WAIT";

        liveSignals.push({
          id: `live-${pair.replace("/", "")}-${primary.name.toLowerCase().replace(/\s+/g, "-")}`,
          pair,
          timeframe: "1H",
          recommendation,
          confidence: primary.confidence,
          entry: Number(currentPrice.toFixed(4)),
          stop_loss: Number(stopLoss.toFixed(4)),
          take_profit: [Number(takeProfit1.toFixed(4)), Number(takeProfit2.toFixed(4))],
          reasons: [primary.description, `24h Change: ${priceInfo?.change24h?.toFixed(2) ?? 0}%`],
          pattern: primary.name,
          signal_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[getDailySignals] Error scanning ${pair}:`, err);
      }
    }

    const merged = [...(dbSignals || []), ...liveSignals];
    return { signals: merged };
  });

// ── Recent Analyses (for vision page) ────────────────────────
export const getRecentAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: analyses } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return { analyses: analyses || [] };
  });
