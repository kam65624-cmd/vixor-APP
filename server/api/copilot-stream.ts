import {
  defineEventHandler,
  getMethod,
  readBody,
  createError,
  setResponseStatus,
  getHeader,
} from "h3";
import { SlidingWindowLimiter } from "@/shared/resilience/rate-limiter";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/supabase/types";
import { handlePreflight, rateLimit, requireAuth } from "./_security";

// Rate limit: max 20 streaming requests per user per minute
const streamLimiter = new SlidingWindowLimiter({
  maxRequests: 20,
  windowMs: 60_000,
});

/** Extract user ID + authenticated Supabase client from Bearer token */
async function authenticateRequest(
  event: ReturnType<typeof defineEventHandler> extends (...args: any[]) => Promise<any>
    ? any
    : never,
): Promise<{ userId: string; supabase: ReturnType<typeof createClient<Database>> } | null> {
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { userId: data.user.id, supabase };
}

export default defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  if (!rateLimit(event)) return;

  if (!requireAuth(event)) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }

  const method = getMethod(event);
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Auth check
  const authResult = await authenticateRequest(event);
  if (!authResult) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  const { userId, supabase } = authResult;

  // Rate limit check per user
  if (!streamLimiter.tryAcquire(userId)) {
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
