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
import { SlidingWindowLimiter } from "@/shared/resilience/rate-limiter";

// Rate limit: max 20 copilot requests per user per minute
const copilotLimiter = new SlidingWindowLimiter({
  maxRequests: 20,
  windowMs: 60_000,
});

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
          .enum([
            "market_analyst",
            "risk_manager",
            "news_analyst",
            "strategy_builder",
            "auto",
            "moxi",
          ])
          .default("auto"),
        chartSession: z
          .object({
            pair: z.string(),
            timeframe: z.string(),
            currentPrice: z.number(),
            tradingViewSymbol: z.string(),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { message, history = [], agent, chartSession } = data;

    // ── MOXI routing: delegate to askMoxi when agent is "moxi" ──
    if (agent === "moxi") {
      // Import the MOXI handler logic directly — can't call a ServerFn from inside another
      const { buildMoxiContext } = await import("@/domains/moxi/context-engine");
      const { getMoxiPersona: getPersona } = await import("@/domains/moxi/persona");
      const { buildMoxiSystemPrompt, formatMoxiContext } = await import("@/domains/moxi/prompt");
      const { LLMRouter } = await import("@/shared/llm");

      const [moxiCtx, persona] = await Promise.all([
        buildMoxiContext(userId, supabase),
        getPersona(userId, supabase),
      ]);
      const formattedCtx = formatMoxiContext(moxiCtx);

      // Get tool descriptions
      try {
        await import("@/shared/tool-registry/tools/trading");
        await import("@/shared/tool-registry/tools/journal-analysis");
        const { ToolRegistry } = await import("@/shared/tool-registry");
        formattedCtx.toolDescriptions = ToolRegistry.toolDescriptionsForPrompt({
          userId,
          isPremium: (moxiCtx.profile as any)?.is_premium ?? false,
          isAdmin: false,
        });
      } catch {
        formattedCtx.toolDescriptions = "Tools available.";
      }

      const systemPrompt = buildMoxiSystemPrompt(persona, formattedCtx);

      let fullMsg = message;
      if (chartSession) {
        try {
          const { buildChartSessionPrompt, createSessionContext } =
            await import("@/domains/chart-intelligence");
          fullMsg = `${buildChartSessionPrompt(createSessionContext({ symbol: chartSession.pair, timeframe: chartSession.timeframe, currentPrice: chartSession.currentPrice }))}\n\n${message}`;
        } catch {
          /* non-critical */
        }
      }

      const router = new LLMRouter();
      const routerMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: fullMsg },
      ];
      const result = await router.chat({ messages: routerMessages, temperature: 0.7 });
      return { response: result.content || "No response generated.", agent: "moxi" as const };
    }

    // Rate limit check per user
    if (!copilotLimiter.tryAcquire(userId)) {
      throw new Error("RATE_LIMITED: Too many copilot requests. Please wait a moment.");
    }

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
          const { fetchPrices, POPULAR_PAIRS } =
            await import("@/domains/market/server/price-fetcher");
          const pairs = POPULAR_PAIRS.map((p) => p.pair);
          return await fetchPrices(pairs);
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          const { fetchEconomicCalendar } =
            await import("@/domains/market/server/economic-calendar");
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
      console.warn(
        "[Copilot] P1 Agent error, falling back to AI:",
        err instanceof Error ? err.message : String(err),
      );
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

    // Build chart session context string for the AI prompt
    let chartSessionPrompt: string | undefined;
    if (chartSession) {
      const { buildChartSessionPrompt, createSessionContext } =
        await import("@/domains/chart-intelligence");
      const chartCtx = createSessionContext({
        symbol: chartSession.pair,
        timeframe: chartSession.timeframe,
        currentPrice: chartSession.currentPrice,
      });
      chartSessionPrompt = buildChartSessionPrompt(chartCtx);
    }

    const result = await runAgent({
      agent: agent as any,
      message: chartSessionPrompt ? `${chartSessionPrompt}\n\n${message}` : message,
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
          const { fetchPrices, POPULAR_PAIRS } =
            await import("@/domains/market/server/price-fetcher");
          const pairs = POPULAR_PAIRS.map((p) => p.pair);
          return await fetchPrices(pairs);
        } catch {
          return [];
        }
      })(),
      (async () => {
        try {
          const { fetchEconomicCalendar } =
            await import("@/domains/market/server/economic-calendar");
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

// ═══════════════════════════════════════════════════════════════════════
// Phase C.1 — VIXOR AI 4 Agents Server Functions
// ═══════════════════════════════════════════════════════════════════════

import type {
  CoachInput,
  CoachResponse,
  GovernorInput,
  RiskDecision,
  HunterInput,
  HunterScore,
  AnalystReport,
} from "./types";

// ---------- COACH: Real-time Trade Coaching ----------
export const coachTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(1).max(50),
        action: z.enum(["buy", "sell"]),
        amount: z.number().positive(),
        chain: z.string().min(1).max(50),
        currentPrice: z.number().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<CoachResponse> => {
    const { userId } = context;
    const input: CoachInput = { userId, ...data };
    const { coachTrade: runCoach } = await import("./server/coach.agent");
    return runCoach(input);
  });

// ---------- GOVERNOR: Risk Assessment ----------
export const assessRisk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        action: z.enum(["buy", "sell"]),
        token: z.string().min(1).max(50),
        amount: z.number().positive(),
        currentPrice: z.number().positive(),
        portfolioValue: z.number().min(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RiskDecision> => {
    const { userId } = context;
    const input: GovernorInput = { userId, ...data };
    const { assessRisk: runGovernor } = await import("./server/governor.agent");
    return runGovernor(input);
  });

// ---------- HUNTER: Smart Money Scoring ----------
export const scoreOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(1).max(50),
        chain: z.string().min(1).max(50),
        smartMoneyActivity: z.string().max(4000).optional().default(""),
        priceData: z.string().max(4000).optional().default(""),
        volumeData: z.string().max(4000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<HunterScore> => {
    const { userId } = context;
    const input: HunterInput = {
      token: data.token,
      chain: data.chain,
      smartMoneyActivity: data.smartMoneyActivity,
      priceData: data.priceData,
      volumeData: data.volumeData,
    };
    const { scoreOpportunity: runHunter } = await import("./server/hunter.agent");
    return runHunter(input, { userId });
  });

// ---------- ANALYST: Weekly Behavioral Report ----------
export const generateWeeklyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({}).parse(d))
  .handler(async ({ context }): Promise<AnalystReport> => {
    const { userId } = context;
    const { generateWeeklyReport: runAnalyst } = await import("./server/analyst.agent");
    return runAnalyst(userId);
  });

// ---------- FEEDBACK: Accept/Reject Agent Decision ----------
export const submitDecisionFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        feedback: z.enum(["accepted", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { recordFeedback } = await import("./server/feedback");
    return recordFeedback(data.decisionId, userId, data.feedback);
  });

// ---------- DECISIONS: Get recent decisions for a user ----------
export const getRecentDecisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        limit: z.number().min(1).max(50).default(20),
        agentId: z.enum(["coach", "analyst", "governor", "hunter"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    let query = supabaseAdmin
      .from("vixor_decisions")
      .select(
        "id, agent_id, decision_type, title, description, data, confidence, severity, token_symbol, feedback, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data.agentId) {
      query = query.eq("agent_id", data.agentId);
    }

    const { data: decisions, error } = await query.limit(data.limit);

    if (error) {
      console.error(`[Decisions] Fetch error: ${error.message}`);
      return { decisions: [], error: error.message };
    }

    return { decisions: decisions || [] };
  });
