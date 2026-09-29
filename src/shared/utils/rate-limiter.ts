// ============================================================================
// Shared Rate Limiter Utility (Phase 4.2)
// ============================================================================
// Simple in-memory sliding window rate limiter.
// Works for serverless/SSR contexts where each invocation is stateless.
// For multi-instance deployments, consider Redis-based locking.
//
// Usage:
//   const limiter = createRateLimiter({ rpm: 30, daily: 1000 });
//   if (!limiter.try()) throw new Error("Rate limited, retry after X seconds");
// ============================================================================

interface RateLimiterConfig {
  /** Requests per minute */
  rpm?: number;
  /** Requests per hour */
  rph?: number;
  /** Requests per day */
  daily?: number;
}

interface RateLimiterState {
  minute: number[];
  hour: number[];
  day: number[];
}

const stores = new Map<string, RateLimiterState>();

/**
 * Create a rate limiter keyed by `id`.
 * Idempotent — calling with the same id returns the same limiter.
 */
export function createRateLimiter(id: string, config: RateLimiterConfig): RateLimiter {
  if (!stores.has(id)) {
    stores.set(id, { minute: [], hour: [], day: [] });
  }

  const state = stores.get(id)!;

  function cleanOld(now: number) {
    const ONE_MIN = 60_000;
    const ONE_HOUR = 3_600_000;
    const ONE_DAY = 86_400_000;

    state.minute = state.minute.filter((t) => now - t < ONE_MIN);
    state.hour = state.hour.filter((t) => now - t < ONE_HOUR);
    state.day = state.day.filter((t) => now - t < ONE_DAY);
  }

  function tryRecord(): boolean {
    const now = Date.now();
    cleanOld(now);

    const rpm = config.rpm ?? Infinity;
    const rph = config.rph ?? Infinity;
    const daily = config.daily ?? Infinity;

    if (state.minute.length >= rpm) return false;
    if (state.hour.length >= rph) return false;
    if (state.day.length >= daily) return false;

    state.minute.push(now);
    state.hour.push(now);
    state.day.push(now);
    return true;
  }

  function getResetIn(): { minute: number; hour: number; day: number } {
    const now = Date.now();
    const oldestMinute = state.minute[0];
    const oldestHour = state.hour[0];
    const oldestDay = state.day[0];
    return {
      minute: oldestMinute ? Math.max(0, 60_000 - (now - oldestMinute)) : 0,
      hour: oldestHour ? Math.max(0, 3_600_000 - (now - oldestHour)) : 0,
      day: oldestDay ? Math.max(0, 86_400_000 - (now - oldestDay)) : 0,
    };
  }

  return { tryRecord, getResetIn, id };
}

export interface RateLimiter {
  /** Attempt to record a request. Returns true if allowed, false if rate-limited. */
  tryRecord(): boolean;
  /** Get ms until each window resets. */
  getResetIn(): { minute: number; hour: number; day: number };
  id: string;
}

// ── Pre-configured limiters for external APIs ─────────────────────────────────

/** Birdeye: free tier = 1000 req/day, ~60 req/min. Using 500/day, 30/min as safe margin. */
export const birdeyeLimiter = (apiKey: string) =>
  createRateLimiter(`birdeye:${apiKey || "anon"}`, { rpm: 30, daily: 500 });

/** GoPlus: free tier = ~120 req/min, no daily limit documented. Using 60/min as safe margin. */
export const goplusLimiter = () => createRateLimiter("goplus", { rpm: 60 });

/** Jupiter: no published limit. Conservative 120 req/min. */
export const jupiterLimiter = () => createRateLimiter("jupiter", { rpm: 120 });

/** 1inch: ~300 req/min. Using 200/min as safe margin. */
export const inchLimiter = () => createRateLimiter("1inch", { rpm: 200 });
