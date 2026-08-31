// ============================================================================
// MOXI — Server Functions
// ============================================================================
//
// askMoxi: The main MOXI endpoint.
// 1. Auth + rate limit
// 2. Build context (reuse buildMoxiContext)
// 3. Tool intent detection → execute tool if matched
// 4. AI fallback with MOXI system prompt via LLMRouter
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { SlidingWindowLimiter } from "@/shared/resilience/rate-limiter";
import { buildMoxiContext } from "./context-engine";
import { getMoxiPersona } from "./persona";
import { buildMoxiSystemPrompt, formatMoxiContext } from "./prompt";

// Rate limit: max 25 MOXI requests per user per minute
const moxiLimiter = new SlidingWindowLimiter({
  maxRequests: 25,
  windowMs: 60_000,
});

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// ---------- ASK MOXI ----------
export const askMoxi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        message: z.string().min(1).max(4000),
        history: z.array(ChatMessageSchema).max(30).optional(),
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
    const { message, history = [], chartSession } = data;

    // Rate limit
    if (!moxiLimiter.tryAcquire(userId)) {
      throw new Error("RATE_LIMITED: Too many MOXI requests. Please wait a moment.");
    }

    // ── Build MOXI Context (parallel) ──
    const [moxiCtx, persona] = await Promise.all([
      buildMoxiContext(userId, supabase),
      getMoxiPersona(userId, supabase),
    ]);

    // ── Format context for prompt ──
    const formattedCtx = formatMoxiContext(moxiCtx);

    // ── Get tool descriptions for prompt ──
    try {
      await import("@/shared/tool-registry/tools/trading");
      await import("@/shared/tool-registry/tools/journal-analysis");
      const { ToolRegistry } = await import("@/shared/tool-registry");
      const toolContext = {
        userId,
        isPremium: (moxiCtx.profile as any)?.is_premium ?? false,
        isAdmin: false,
        traceId: `moxi-${Date.now()}`,
      };
      formattedCtx.toolDescriptions = ToolRegistry.toolDescriptionsForPrompt(toolContext);
    } catch {
      formattedCtx.toolDescriptions = "Tools available but descriptions could not be loaded.";
    }

    // ── P1 Intelligence Layer: Try tool execution first ──
    try {
      const { configureEventPersistence } = await import("@/shared/events/persist");
      configureEventPersistence();

      const { processWithAgent } = await import("@/domains/moxi/server/agent");
      const toolContext: import("@/shared/tool-registry").ToolContext = {
        userId,
        isPremium: (moxiCtx.profile as any)?.is_premium ?? false,
        isAdmin: false,
        traceId: `moxi-${Date.now()}`,
      };

      const agentResult = await processWithAgent(message, toolContext);

      if (agentResult.toolExecuted && !agentResult.shouldFallbackToAI) {
        console.log(`[MOXI] Tool executed: ${agentResult.toolName}`);
        return {
          response: agentResult.response,
          agent: "moxi" as const,
          toolExecuted: true,
          toolName: agentResult.toolName,
        };
      }

      if (!agentResult.shouldFallbackToAI && agentResult.response) {
        console.log(`[MOXI] Intent detected, needs clarification`);
        return {
          response: agentResult.response,
          agent: "moxi" as const,
          toolExecuted: false,
        };
      }
    } catch (err) {
      console.warn(
        "[MOXI] P1 layer error, falling back to AI:",
        err instanceof Error ? err.message : String(err),
      );
    }

    // ── AI FALLBACK: Use MOXI's system prompt via agent-orchestrator ──
    const systemPrompt = buildMoxiSystemPrompt(persona, formattedCtx);

    // Build chart session context if present
    let fullMessage = message;
    if (chartSession) {
      try {
        const { buildChartSessionPrompt, createSessionContext } =
          await import("@/domains/chart-intelligence");
        const chartCtx = createSessionContext({
          symbol: chartSession.pair,
          timeframe: chartSession.timeframe,
          currentPrice: chartSession.currentPrice,
        });
        fullMessage = `${buildChartSessionPrompt(chartCtx)}\n\n${message}`;
      } catch {
        // Non-critical
      }
    }

    const { LLMRouter } = await import("@/shared/llm");
    const router = new LLMRouter();

    const routerMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: fullMessage },
    ];

    const result = await router.chat({ messages: routerMessages, temperature: 0.7 });

    const response = result.content || "No response generated.";

    return {
      response,
      agent: "moxi" as const,
    };
  });

// ---------- UPDATE MOXI PERSONA ----------
export const updateMoxiPersona = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().max(30).optional(),
        personality: z.string().max(500).optional(),
        communicationStyle: z.enum(["formal", "casual", "mixed"]).optional(),
        avatarVariant: z
          .enum(["default", "bull", "bear", "crystal", "flame", "ocean", "phantom", "nova"])
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { updateMoxiPersona: updatePersona } = await import("./persona");
    const persona = await updatePersona(userId, supabase, data);
    return { success: true, persona };
  });

// ---------- GET MOXI PERSONA ----------
export const getMoxiPersonaFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { getMoxiPersona: getPersona } = await import("./persona");
    const persona = await getPersona(userId, supabase);
    return persona;
  });

// ---------- GET MOXI INSIGHTS (Proactive Feed) ----------
export const getMoxiInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { generateMoxiInsights } = await import("./notification-hub");
    const insights = await generateMoxiInsights(userId, supabase);
    return insights;
  });
