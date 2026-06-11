// ============================================================================
// Copilot Domain — Server Functions
// ============================================================================
//
// AI copilot with multi-agent system.
//
// P1 Intelligence Layer Integration:
//   User message → processWithAgent() first (tool execution)
//   If no tool intent → fall back to AI (runAgent)
//   This ensures the Copilot Agent is ALWAYS in the path.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// ---------- ASK COPILOT (P1 Intelligence Layer + Multi-Agent) ----------
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

    // ═══════════════════════════════════════════════════════════════════════
    // P1 INTELLIGENCE LAYER: Try tool execution FIRST, then fall back to AI
    // ═══════════════════════════════════════════════════════════════════════
    try {
      // Ensure tools are registered (side-effect import for Vercel serverless)
      await import("@/shared/tool-registry/tools/trading");
      await import("@/shared/tool-registry/tools/journal-analysis");
      // Ensure event persistence is configured
      const { configureEventPersistence } = await import("@/shared/events/persist");
      configureEventPersistence();

      const { processWithAgent } = await import("./server/copilot-agent");
      const { ToolRegistry } = await import("@/shared/tool-registry");

      // Build ToolContext from auth context
      const toolContext: import("@/shared/tool-registry").ToolContext = {
        userId,
        isPremium: (profile as any)?.is_premium ?? false,
        isAdmin: false,
        traceId: `copilot-${Date.now()}`,
      };

      // Try P1 Agent first — detect intent and execute tool if matched
      const agentResult = await processWithAgent(message, toolContext);

      if (agentResult.toolExecuted && !agentResult.shouldFallbackToAI) {
        // Tool was executed successfully — return the tool response directly
        console.log(`[Copilot] P1 Tool executed: ${agentResult.toolName}`);

        // Persist the message to conversation (same as AI flow)
        return {
          response: agentResult.response,
          agent: "auto" as const,
          toolExecuted: true,
          toolName: agentResult.toolName,
        };
      }

      if (!agentResult.shouldFallbackToAI && agentResult.response) {
        // Intent detected but missing params — return the clarification
        console.log(`[Copilot] P1 Intent detected, needs clarification`);
        return {
          response: agentResult.response,
          agent: "auto" as const,
          toolExecuted: false,
        };
      }

      // No tool intent — log and fall through to AI
      console.log(`[Copilot] No tool intent, falling back to AI`);
    } catch (err) {
      // P1 layer error — don't break the copilot, fall back to AI
      console.warn("[Copilot] P1 Agent error, falling back to AI:", err instanceof Error ? err.message : String(err));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AI FALLBACK: Use existing multi-agent system
    // ═══════════════════════════════════════════════════════════════════════

    // Inject user memories into the context for AI agents
    let memoryContext: string | undefined;
    try {
      const { MemoryStore } = await import("@/shared/memory");
      memoryContext = await MemoryStore.contextForPrompt(userId);
      console.log(`[Copilot] Memory context loaded for AI prompt`);
    } catch {
      // Non-critical — AI works fine without memory
    }

    const { runAgent } = await import("@/domains/copilot/server/agent-orchestrator");
    const result = await runAgent({
      agent: agent as any,
      message,
      history,
      context: {
        ...userContext,
        memoryContext, // Injected memory for AI prompt
      },
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

    // Inject user memories for consensus agents too
    let memoryContext: string | undefined;
    try {
      const { MemoryStore } = await import("@/shared/memory");
      memoryContext = await MemoryStore.contextForPrompt(userId);
    } catch {
      // Non-critical
    }

    const { runConsensus } = await import("@/domains/copilot/server/agent-orchestrator");
    const result = await runConsensus({
      message,
      history: [],
      context: {
        ...userContext,
        memoryContext,
      },
    });

    return result;
  });
