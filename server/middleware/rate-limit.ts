import { defineEventHandler, getRequestIP, createError } from "h3";
import { SlidingWindowLimiter } from "@/shared/resilience/rate-limiter";

// Per-IP rate limiter for all /api/ routes
// 120 requests per minute per IP (generous for normal use, blocks abuse)
const globalApiLimiter = new SlidingWindowLimiter({
  maxRequests: 120,
  windowMs: 60_000,
});

// Separate stricter limiter for webhook endpoints (Telegram can retry aggressively)
const webhookLimiter = new SlidingWindowLimiter({
  maxRequests: 30,
  windowMs: 60_000,
});

export default defineEventHandler(async (event) => {
  const path = event.path || "";

  // Only rate-limit /api/ routes
  if (!path.startsWith("/api/")) return;

  // Skip health check (called by Vercel monitoring) — it has its own auth
  if (path === "/api/health") return;

  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";

  // Use stricter limits for webhook endpoints
  if (path.includes("webhook") || path.includes("telegram") || path.includes("stars")) {
    const allowed = webhookLimiter.tryAcquire(ip);
    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: JSON.stringify({
          error: "Too many requests",
          retryAfter: 60,
          endpoint: path,
        }),
      });
    }
    return;
  }

  // Apply global limiter to other /api/ routes
  const allowed = globalApiLimiter.tryAcquire(ip);
  if (!allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: JSON.stringify({
        error: "Too many requests",
        retryAfter: 60,
        endpoint: path,
      }),
    });
  }
});
