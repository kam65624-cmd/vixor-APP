// ============================================================================
// VIXOR Redis-Backed Rate Limiter — Distributed sliding window via Upstash
// ============================================================================

import type { CacheProvider } from "@/shared/cache";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterMs?: number;
}

export interface RedisRateLimiterOptions {
  maxRequests: number;
  windowSec: number;
  cache?: CacheProvider;
  keyPrefix?: string;
}

/**
 * Simple in-memory sliding window for when Redis is unavailable.
 */
class InMemoryRateLimit {
  private windows = new Map<string, { count: number; resetAt: number }>();

  check(key: string, max: number, windowSec: number): RateLimitResult {
    const now = Math.floor(Date.now() / 1000);
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + windowSec });
      return { allowed: true, remaining: max - 1, limit: max, resetAt: now + windowSec };
    }

    if (entry.count >= max) {
      const retryAfterMs = (entry.resetAt - now) * 1000;
      return {
        allowed: false,
        remaining: 0,
        limit: max,
        resetAt: entry.resetAt,
        retryAfterMs,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: max - entry.count,
      limit: max,
      resetAt: entry.resetAt,
    };
  }
}

export class RedisRateLimiter {
  readonly maxRequests: number;
  readonly windowSec: number;
  private keyPrefix: string;
  private cache: CacheProvider | null;
  private fallback = new InMemoryRateLimit();
  private useRedis = false;

  constructor(options: RedisRateLimiterOptions) {
    if (!options.maxRequests || options.maxRequests <= 0) {
      throw new Error("RedisRateLimiter: maxRequests must be > 0");
    }
    if (!options.windowSec || options.windowSec <= 0) {
      throw new Error("RedisRateLimiter: windowSec must be > 0");
    }
    this.maxRequests = options.maxRequests;
    this.windowSec = options.windowSec;
    this.keyPrefix = options.keyPrefix || "vixor:rl:";
    this.cache = options.cache || null;
    if (this.cache) {
      this.useRedis = true;
    }
  }

  setCache(cache: CacheProvider): void {
    this.cache = cache;
    this.useRedis = true;
  }

  private getKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    if (this.useRedis && this.cache) {
      try {
        return await this.checkRedis(identifier);
      } catch {
        // Redis failed, fall back to in-memory
      }
    }
    return this.fallback.check(identifier, this.maxRequests, this.windowSec);
  }

  private async checkRedis(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const now = Math.floor(Date.now() / 1000);
    const resetAt = now + this.windowSec;

    const existing = await this.cache!.get<{ count: number; resetAt: number }>(key);

    if (existing && now < existing.resetAt) {
      if (existing.count >= this.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          limit: this.maxRequests,
          resetAt: existing.resetAt,
          retryAfterMs: (existing.resetAt - now) * 1000,
        };
      }
      const newCount = existing.count + 1;
      await this.cache!.set(key, { count: newCount, resetAt: existing.resetAt }, this.windowSec * 1000);
      return {
        allowed: true,
        remaining: this.maxRequests - newCount,
        limit: this.maxRequests,
        resetAt: existing.resetAt,
      };
    }

    await this.cache!.set(key, { count: 1, resetAt }, this.windowSec * 1000);
    return {
      allowed: true,
      remaining: this.maxRequests - 1,
      limit: this.maxRequests,
      resetAt,
    };
  }
}

// ── Pre-configured HTTP rate limiters ──────────────────────────────────────

export const globalApiRateLimiter = new RedisRateLimiter({
  maxRequests: 120,
  windowSec: 60,
  keyPrefix: "vixor:rl:api:",
});

export const webhookRateLimiter = new RedisRateLimiter({
  maxRequests: 30,
  windowSec: 60,
  keyPrefix: "vixor:rl:webhook:",
});

export async function initRateLimiters(): Promise<void> {
  const { cache } = await import("@/shared/cache");
  globalApiRateLimiter.setCache(cache);
  webhookRateLimiter.setCache(cache);
}