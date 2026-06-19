import { defineEventHandler, getMethod, readBody, createError, setResponseStatus, getHeader } from "h3";
import { SlidingWindowLimiter } from "@/shared/resilience/rate-limiter";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/supabase/types";

// Rate limit: max 20 streaming requests per user per minute
const streamLimiter = new SlidingWindowLimiter({
  maxRequests: 20,
  windowMs: 60_000,
});

/** Extract user ID from Bearer token in h3 request */
async function authenticateRequest(event: ReturnType<typeof defineEventHandler> extends (...args: any[]) => Promise<any> ? any : never): Promise<string | null> {
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
  return data.user.id;
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Auth check
  const userId = await authenticateRequest(event);
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

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
          context: {
            profile: {},
            recentAnalyses: [],
            signals: [],
            alerts: [],
            strategy: null,
            watchlist: [],
            marketPrices: [],
            economicEvents: [],
          },
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
          delta: `Error: ${err instanceof Error ? err.message : "Streaming failed"}`,
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
