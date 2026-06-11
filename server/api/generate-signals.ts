import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";
import { fetchBinanceKlines, fetchTwelveDataKlines } from "@/domains/market/server/price-fetcher";
import { runLocalAnalysis } from "@/domains/analysis/engine/engine";
import { AssetRegistry } from "@/shared/asset-registry";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Security: Verify this is a legitimate cron request
  const isVercelCron = getHeader(event, "x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (isVercelCron) {
    // Vercel Cron requests are automatically authenticated
  } else if (cronSecret) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[CRON SECURITY] Request is not from Vercel Cron and CRON_SECRET is not set. Refusing.");
    throw createError({ statusCode: 500, statusMessage: "Cron not configured" });
  }

  try {
    const pairs = AssetRegistry.signalPairs();
    const timeframes = ["1H", "4H"];
    const today = new Date().toISOString().split("T")[0];

    let generated = 0;

    for (const pair of pairs) {
      for (const tf of timeframes) {
        try {
          let bars;
          if (AssetRegistry.isCrypto(pair)) {
            bars = await fetchBinanceKlines(pair, tf, 200);
          }
          if (!bars || bars.length <= 20) {
            const tdBars = await fetchTwelveDataKlines(pair, tf, 200);
            if (tdBars.length > 20) bars = tdBars;
          }

          const result = runLocalAnalysis({
            pair,
            timeframe: tf,
            tradingStyle: "Day Trading",
            bars: bars && bars.length > 20 ? bars : undefined,
          });

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
