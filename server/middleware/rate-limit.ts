import { defineEventHandler, getRequestIP, createError, setResponseHeader } from "h3";
import {
  globalApiRateLimiter,
  webhookRateLimiter,
  initRateLimiters,
} from "@/shared/resilience/redis-rate-limiter";

// Ensure rate limiters are initialized with Redis on first request
let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initRateLimiters();
    initialized = true;
  }
}

export default defineEventHandler(async (event) => {
  const path = event.path || "";

  // Only rate-limit /api/ routes
  if (!path.startsWith("/api/")) return;

  // Skip health check (called by Vercel monitoring)
  if (path === "/api/health") return;

  await ensureInit();

  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  const limiter =
    path.includes("webhook") || path.includes("telegram") || path.includes("stars")
      ? webhookRateLimiter
      : globalApiRateLimiter;

  const result = await limiter.check(ip);

  // Add rate limit headers to all API responses
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
        endpoint: path,
      }),
    });
  }
});
