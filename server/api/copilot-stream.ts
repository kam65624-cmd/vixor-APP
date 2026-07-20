import {
  defineEventHandler,
  getMethod,
  readBody,
  createError,
  setResponseStatus,
  setResponseHeader,
  getRequestIP,
} from "h3";
import { handlePreflight, authenticateRequest } from "./_security";
import {
  RedisRateLimiter,
  globalApiRateLimiter,
  initRateLimiters,
} from "@/shared/resilience/redis-rate-limiter";

// Per-user streaming rate limit: max 20 streaming requests per user per minute
// Uses Redis-backed limiter (falls back to in-memory when Redis is unavailable)
const streamLimiter = new RedisRateLimiter({
  maxRequests: 20,
  windowSec: 60,
  keyPrefix: "vixor:rl:stream:",
});

let rateLimitersInitialized = false;
async function ensureRateLimiters() {
  if (!rateLimitersInitialized) {
    await initRateLimiters().catch(() => {
      // Redis not available — in-memory fallback will be used
    });
    // Also set Redis cache on the per-stream limiter
    try {
      const { cache } = await import("@/shared/cache");
      streamLimiter.setCache(cache);
    } catch {
      // in-memory fallback
    }
    rateLimitersInitialized = true;
  }
}

export default defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  // Ensure Redis rate limiters are initialized
  await ensureRateLimiters();

  // Global IP-based rate limit (Redis-backed, works on serverless)
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  const globalResult = await globalApiRateLimiter.check(ip);
  setResponseHeader(event, "X-RateLimit-Limit", String(globalResult.limit));
  setResponseHeader(event, "X-RateLimit-Remaining", String(globalResult.remaining));
  setResponseHeader(event, "X-RateLimit-Reset", String(globalResult.resetAt));
  if (!globalResult.allowed) {
    setResponseHeader(
      event,
      "Retry-After",
      String(Math.ceil((globalResult.retryAfterMs ?? 60000) / 1000)),
    );
    throw createError({ statusCode: 429, statusMessage: "Too many requests" });
  }

  const method = getMethod(event);
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Authenticate request (validates JWT via Supabase)
  const authResult = await authenticateRequest(event);
  if (!authResult) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const { userId, supabase } = authResult;

  // Per-user streaming rate limit (Redis-backed)
  const streamResult = await streamLimiter.check(userId);
  if (!streamResult.allowed) {
    setResponseHeader(
      event,
      "Retry-After",
      String(Math.ceil((streamResult.retryAfterMs ?? 60000) / 1000)),
    );
    throw createError({ statusCode: 429, statusMessage: "RATE_LIMITED" });
  }

  // Parse body
  const body = await readBody(event);
  const message = String(body.message || "");
  const history = Array.isArray(body.history) ? body.history : [];
  const agent = String(body.agent || "auto");

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Message is required" });
  }

  // Set SSE headers
  setResponseStatus(event, 200);
  event.node.res.setHeader("Content-Type", "text/event-stream");
  event.node.res.setHeader("Cache-Control", "no-cache, no-transform");
  event.node.res.setHeader("Connection", "keep-alive");
  event.node.res.setHeader("X-Accel-Buffering", "no");

  // Load full user context in parallel (same pattern as askCopilot)
  const [
    { data: profile },
    { data: recentAnalyses },
    { data: signals },
    { data: alerts },
    { data: strategy },
    watchlistItems,
    marketPrices,
    economicEvents,
    memoryContext,
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
        // Defense-in-depth: explicitly filter by user's own watchlists
        // (RLS also enforces this, but explicit filtering prevents leakage
        //  if RLS is ever disabled or service-role key is accidentally used)
        const { data: userWatchlists } = await supabase
          .from("watchlists")
          .select("id")
          .eq("user_id", userId);
        const watchlistIds = (userWatchlists || []).map((w: { id: string }) => w.id);

        if (watchlistIds.length === 0) return [];

        const { data: wlItems } = await supabase
          .from("watchlist_items")
          .select("pair,notes,category")
          .in("watchlist_id", watchlistIds)
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
        const pairs = POPULAR_PAIRS.map((p: any) => p.pair);
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
    (async () => {
      try {
        const { MemoryStore } = await import("@/shared/memory");
        return await MemoryStore.contextForPrompt(userId);
      } catch {
        return undefined;
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
    memoryContext,
  };

  // Import streaming function
  const { streamAgent } = await import("@/domains/copilot/server/agent-orchestrator");

  // ── MOXI-specific streaming path ──
  // MOXI has its own context engine + persona system + prompt builder.
  // We handle it separately so it uses the rich MOXI context, not the generic agent context.
  const isMoxi = agent === "moxi";

  if (isMoxi) {
    const { buildMoxiContext } = await import("@/domains/moxi/context-engine");
    const { getMoxiPersona: getPersona } = await import("@/domains/moxi/persona");
    const { buildMoxiSystemPrompt, formatMoxiContext } = await import("@/domains/moxi/prompt");
    const { LLMRouter } = await import("@/shared/llm");

    const [moxiCtx, persona] = await Promise.all([
      buildMoxiContext(userId, supabase),
      getPersona(userId, supabase),
    ]);
    const formattedCtx = formatMoxiContext(moxiCtx);

    // Get tool descriptions for MOXI
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

    // Build message array for streaming
    const routerMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    const moxiStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function sendSSE(data: object) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        // Yield agent ID first
        sendSSE({ delta: "", agent: "moxi" });

        try {
          const router = new LLMRouter();
          for await (const chunk of router.stream({
            messages: routerMessages,
            temperature: 0.7,
          })) {
            sendSSE({
              delta: chunk.delta || "",
              done: chunk.done || false,
              agent: "moxi",
            });
          }
          sendSSE({ delta: "", done: true, agent: "moxi" });
        } catch (err) {
          console.error("[MOXI Stream] Error:", err);
          sendSSE({
            delta: "Error: MOXI streaming failed. Retrying with standard mode...",
            done: true,
            error: true,
          });
        } finally {
          controller.close();
        }
      },
    });

    return moxiStream;
  }

  // ── Standard agent streaming path (non-MOXI) ──
  // Create a ReadableStream that yields SSE events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendSSE(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        for await (const chunk of streamAgent({
          agent: agent as any,
          message,
          history,
          context: userContext,
        })) {
          sendSSE({
            delta: chunk.delta || "",
            done: chunk.done || false,
            agent: chunk.agent || null,
          });
        }
        sendSSE({ delta: "", done: true });
      } catch (err) {
        sendSSE({
          delta: "Error: Streaming failed",
          done: true,
          error: true,
        });
      } finally {
        controller.close();
      }
    },
  });

  return stream;
});
