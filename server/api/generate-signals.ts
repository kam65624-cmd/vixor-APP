import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";
import { fetchBinanceKlines, fetchTwelveDataKlines } from "@/domains/market/server/price-fetcher";
import { runLocalAnalysis } from "@/domains/analysis/engine/engine";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Both GET and POST are supported so Vercel Cron and manual triggers work
  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Validate CRON_SECRET when set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  }

  try {
    const pairs = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "GBP/JPY", "SOL/USDT"];
    const timeframes = ["1H", "4H"];
    const today = new Date().toISOString().split("T")[0];

    let generated = 0;

    for (const pair of pairs) {
      for (const tf of timeframes) {
        try {
          // Try to get real OHLCV data from Binance for crypto pairs
          let bars;
          if (pair.includes("USDT")) {
            bars = await fetchBinanceKlines(pair, tf, 200);
          }
          // Try TwelveData for forex/commodity pairs
          if (!bars || bars.length <= 20) {
            const tdBars = await fetchTwelveDataKlines(pair, tf, 200);
            if (tdBars.length > 20) bars = tdBars;
          }

          // Run local analysis (with real data if available)
          const result = runLocalAnalysis({
            pair,
            timeframe: tf,
            tradingStyle: "Day Trading",
            bars: bars && bars.length > 20 ? bars : undefined,
          });

          // Insert signal
          const { error } = await supabaseAdmin.from("daily_signals").insert({
            pair,
            timeframe: tf,
            recommendation: result.recommendation,
            confidence: result.confidence,
            entry: result.entry,
            stop_loss: result.stop_loss,
            take_profit: result.take_profit,
            reasons: result.reasons,
            pattern: result.pattern,
            market_structure: result.market_structure as any,
            liquidity_zones: result.liquidity_zones as any,
            signal_date: today,
          });

          if (!error) generated++;
        } catch (err) {
          console.warn(
            `[Signals API] Failed for ${pair}/${tf}:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }

    return { generated, date: today };
  } catch (error) {
    console.error("Signal generation error:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
