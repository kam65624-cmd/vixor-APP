// ============================================================================
// VIXOR Rate Limit Wrapper — Works on Vercel Serverless (per-handler)
// ============================================================================
//
// Nitro middleware (server/middleware/) does NOT run for individually-compiled
// API routes on Vercel serverless. This utility wraps each handler directly
// so rate limiting actually executes.
//
// Usage:
//   export default withRateLimit(myHandler, { maxRequests: 60, windowSec: 60 });
//
// ============================================================================

import type { EventHandler, EventHandlerRequest } from "h3";
import { getRequestIP, createError, setResponseHeader } from "h3";
import {
  RedisRateLimiter,
  globalApiRateLimiter,
  webhookRateLimiter,
  initRateLimiters,
} from "@/shared/resilience/redis-rate-limiter";

export interface RateLimitConfig {
  /** Max requests in the window. Default: 120 */
  maxRequests?: number;
  /** Window duration in seconds. Default: 60 */
  windowSec?: number;
  /** Use the webhook limiter (30/min) instead of API limiter (120/min) */
  webhook?: boolean;
  /** Custom limiter instance (overrides all other options) */
  limiter?: RedisRateLimiter;
  /** Skip rate limiting for these paths/IPs */
  skip?: (event: EventHandlerRequest) => boolean;
}

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initRateLimiters().catch(() => {
      // Redis not available — in-memory fallback will be used
    });
    initialized = true;
  }
}

/**
 * Wraps an h3 event handler with distributed rate limiting.
 * Sets X-RateLimit-Limit/Remaining/Reset headers and throws 429 when exceeded.
 */
export function withRateLimit<T extends EventHandlerRequest>(
  handler: EventHandler<T>,
  config: RateLimitConfig = {},
): EventHandler<T> {
  return async (event) => {
    // Check skip condition
    if (config.skip?.(event)) {
      return handler(event);
    }

    await ensureInit();

    // Select limiter
    const limiter = (config.limiter ?? config.webhook) ? webhookRateLimiter : globalApiRateLimiter;

    // Use custom limits if specified (create a temporary limiter)
    let effectiveLimiter = limiter;
    if (config.maxRequests || config.windowSec) {
      effectiveLimiter = new RedisRateLimiter({
        maxRequests: config.maxRequests ?? limiter.maxRequests,
        windowSec: config.windowSec ?? limiter.windowSec,
        keyPrefix: config.webhook ? "vixor:rl:webhook:custom:" : "vixor:rl:api:custom:",
      });
      // Try to set Redis cache on custom limiter
      try {
        const { cache } = await import("@/shared/cache");
        effectiveLimiter.setCache(cache);
      } catch {
        // in-memory fallback
      }
    }

    // Identify client by IP (or custom key)
    const identifier = getRequestIP(event, { xForwardedFor: true }) || "unknown";

    const result = await effectiveLimiter.check(identifier);

    // Set rate limit headers
    setResponseHeader(event, "X-RateLimit-Limit", String(result.limit));
    setResponseHeader(event, "X-RateLimit-Remaining", String(result.remaining));
    setResponseHeader(event, "X-RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      setResponseHeader(
        event,
        "Retry-After",
        String(Math.ceil((result.retryAfterMs ?? 60000) / 1000)),
      );
      throw createError({
        statusCode: 429,
        statusMessage: JSON.stringify({
          error: "Too many requests",
          retryAfter: Math.ceil((result.retryAfterMs ?? 60000) / 1000),
        }),
      });
    }

    return handler(event);
  };
}
