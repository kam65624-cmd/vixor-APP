// ============================================================================
// Trading Domain — Server Functions
// ============================================================================
//
// Price alerts, daily signals, and user strategies.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ---------- PRICE ALERTS ----------
export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        symbol: z.string().min(1),
        pair: z.string().min(1),
        condition: z.enum(["above", "below", "crosses_up", "crosses_down"]),
        targetPrice: z.number().positive(),
        currentPrice: z.number().optional(),
        note: z.string().max(200).optional(),
        timeframe: z.string().default("1H"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: alert, error } = await supabase
      .from("price_alerts")
      .insert({
        user_id: userId,
        symbol: data.symbol,
        pair: data.pair,
        condition: data.condition,
        target_price: data.targetPrice,
        current_price: data.currentPrice ?? null,
        note: data.note ?? null,
        timeframe: data.timeframe,
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return alert;
  });

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        pair: z.string().optional(),
        status: z.enum(["active", "triggered", "cancelled"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("price_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data.pair) query = query.eq("pair", data.pair);
    if (data.status) query = query.eq("status", data.status);
    else query = query.in("status", ["active", "triggered"]);

    const { data: alerts, error } = await query;
    if (error) throw new Error(error.message);
    return alerts ?? [];
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ alertId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("price_alerts")
      .update({ status: "cancelled" })
      .eq("id", data.alertId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runAlertCheck = createServerFn({ method: "POST" }).handler(async () => {
  const { checkAllAlerts } = await import("@/domains/trading/server/alert-checker");
  return await checkAllAlerts();
});

// ---------- DAILY SIGNALS ----------
export const generateDailySignals = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");
  const { fetchBinanceKlines, fetchTwelveDataKlines } = await import("@/domains/market/server/price-fetcher");
  const { runLocalAnalysis } = await import("@/domains/analysis/engine/engine");

  const pairs = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "GBP/JPY", "SOL/USDT"];
  const timeframes = ["1H", "4H"];
  const today = new Date().toISOString().split("T")[0];

  let generated = 0;

  for (const pair of pairs) {
    for (const tf of timeframes) {
      try {
        let bars;
        if (pair.includes("USDT")) {
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
        else console.warn(`[Signals] Insert failed for ${pair}/${tf}:`, error.message);
      } catch (err) {
        console.warn(
          `[Signals] Failed for ${pair}/${tf}:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }

  return { generated, date: today };
});

export const getDailySignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        pair: z.string().optional(),
        timeframe: z.string().optional(),
        recommendation: z.enum(["BUY", "SELL", "WAIT"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: strategy } = await supabase
      .from("user_strategies")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];
    let query = supabase
      .from("daily_signals")
      .select("*")
      .eq("signal_date", today)
      .order("confidence", { ascending: false })
      .limit(20);

    if (data.pair) {
      query = query.eq("pair", data.pair);
    } else if (strategy?.pairs && strategy.pairs.length > 0) {
      query = query.in("pair", strategy.pairs);
    }

    if (data.timeframe) query = query.eq("timeframe", data.timeframe);
    else if (strategy?.preferred_timeframes && strategy.preferred_timeframes.length > 0) {
      query = query.in("timeframe", strategy.preferred_timeframes);
    }

    if (data.recommendation) query = query.eq("recommendation", data.recommendation);

    const { data: signals, error } = await query;
    if (error) throw new Error(error.message);
    return signals ?? [];
  });

// ---------- USER STRATEGIES ----------
export const getUserStrategy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_strategies")
      .select("*")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      // No user strategy yet — return empty onboarding state, not fake data
      return {
        id: null,
        name: null,
        pairs: [],
        trading_style: null,
        risk_tolerance: null,
        preferred_timeframes: [],
        is_active: false,
        isOnboarding: true,
      };
    }
    return data;
  });

export const updateUserStrategy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().min(1).max(50).optional(),
        pairs: z.array(z.string()).optional(),
        tradingStyle: z.enum(["Scalping", "Day Trading", "Swing Trading"]).optional(),
        riskTolerance: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        preferredTimeframes: z.array(z.string()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const { data: existing } = await supabase
      .from("user_strategies")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    const updateData: {
      name?: string;
      pairs?: string[];
      trading_style?: string;
      risk_tolerance?: string;
      preferred_timeframes?: string[];
    } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.pairs !== undefined) updateData.pairs = data.pairs;
    if (data.tradingStyle !== undefined) updateData.trading_style = data.tradingStyle;
    if (data.riskTolerance !== undefined) updateData.risk_tolerance = data.riskTolerance;
    if (data.preferredTimeframes !== undefined)
      updateData.preferred_timeframes = data.preferredTimeframes;

    if (existing) {
      const { error } = await supabase
        .from("user_strategies")
        .update(updateData)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    } else {
      const { error } = await supabase.from("user_strategies").insert({
        user_id: userId,
        name: updateData.name,
        pairs: updateData.pairs,
        trading_style: updateData.trading_style,
        risk_tolerance: updateData.risk_tolerance,
        preferred_timeframes: updateData.preferred_timeframes,
      });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
  });
