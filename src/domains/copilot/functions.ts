// ============================================================================
// Copilot Domain — Server Functions
// ============================================================================
//
// AI copilot with multi-agent system.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// ---------- ASK COPILOT (Multi-Agent) ----------
export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        message: z.string().min(1).max(4000),
        history: z.array(ChatMessageSchema).max(20).optional(),
        agent: z
          .enum(["market_analyst", "risk_manager", "news_analyst", "strategy_builder", "auto"])
          .default("auto"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { message, history = [], agent } = data;

    const [
      { data: profile },
      { data: recentAnalyses },
      { data: signals },
      { data: alerts },
      { data: strategy },
      watchlistItems,
      marketPrices,
      economicEvents,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("analyses")
        .select("id,pair,timeframe,recommendation,confidence,pattern,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("daily_signals")
        .select("pair,timeframe,recommendation,confidence,pattern")
        .order("signal_date", { ascending: false })
        .limit(5),
      supabase
        .from("price_alerts")
        .select("pair,condition,target_price,status")
        .eq("status", "active")
        .limit(5),
      supabase
        .from("user_strategies")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      (async () => {
        try {
          const { data: wlItems } = await supabase
            .from("watchlist_items")
            .select("pair,notes,category")
            .limit(20);
          return wlItems || [];
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          const { fetchPrices, POPULAR_PAIRS } = await import("@/domains/market/server/price-fetcher");
          const pairs = POPULAR_PAIRS.map((p) => p.pair);
          return await fetchPrices(pairs);
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          const { fetchEconomicCalendar } = await import("@/domains/market/server/economic-calendar");
          return await fetchEconomicCalendar(7);
        } catch {
          return [];
        }
      })(),
    ]);

    const userContext: import("@/domains/copilot/server/agents").UserContext = {
      profile: profile || {},
      recentAnalyses: recentAnalyses || [],
      signals: signals || [],
      alerts: alerts || [],
      strategy: strategy || null,
      watchlist: watchlistItems || [],
      marketPrices: Array.isArray(marketPrices) ? marketPrices : [],
      economicEvents: Array.isArray(economicEvents) ? economicEvents : [],
    };

    const { runAgent } = await import("@/domains/copilot/server/agent-orchestrator");
    const result = await runAgent({
      agent: agent as any,
      message,
      history,
      context: userContext,
    });

    return { response: result.response, agent: result.agent };
  });

// ---------- MULTI-AGENT CONSENSUS ----------
export const getConsensus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        message: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { message } = data;

    const [
      { data: profile },
      { data: recentAnalyses },
      { data: signals },
      { data: alerts },
      { data: strategy },
      watchlistItems,
      marketPrices,
      economicEvents,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("analyses")
        .select("id,pair,timeframe,recommendation,confidence,pattern,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("daily_signals")
        .select("pair,timeframe,recommendation,confidence,pattern")
        .order("signal_date", { ascending: false })
        .limit(5),
      supabase
        .from("price_alerts")
        .select("pair,condition,target_price,status")
        .eq("status", "active")
        .limit(5),
      supabase
        .from("user_strategies")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      (async () => {
        try {
          const { data: wlItems } = await supabase
            .from("watchlist_items")
            .select("pair,notes,category")
            .limit(20);
          return wlItems || [];
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          const { fetchPrices, POPULAR_PAIRS } = await import("@/domains/market/server/price-fetcher");
          const pairs = POPULAR_PAIRS.map((p) => p.pair);
          return await fetchPrices(pairs);
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          const { fetchEconomicCalendar } = await import("@/domains/market/server/economic-calendar");
          return await fetchEconomicCalendar(7);
        } catch {
          return [];
        }
      })(),
    ]);

    const userContext: import("@/domains/copilot/server/agents").UserContext = {
      profile: profile || {},
      recentAnalyses: recentAnalyses || [],
      signals: signals || [],
      alerts: alerts || [],
      strategy: strategy || null,
      watchlist: watchlistItems || [],
      marketPrices: Array.isArray(marketPrices) ? marketPrices : [],
      economicEvents: Array.isArray(economicEvents) ? economicEvents : [],
    };

    const { runConsensus } = await import("@/domains/copilot/server/agent-orchestrator");
    const result = await runConsensus({
      message,
      history: [],
      context: userContext,
    });

    return result;
  });
