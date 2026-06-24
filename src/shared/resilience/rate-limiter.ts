// ============================================================================
// VIXOR Rate Limiter — Minimum Interval + Sliding Window
// ============================================================================
//
// Provides two rate limiting approaches:
//
//   1. RateLimiter — minimum interval between calls with optional jitter.
//      Use for throttling API calls to external providers.
//
//   2. SlidingWindowLimiter — per-key sliding-window counter.
//      Use for hard request ceilings (e.g., max 120 req/min per IP).
//
// Usage:
//   // Simple interval limiter
//   const limiter = new RateLimiter({ minInterval: 1000, jitter: 200 });
//   await limiter.wait();
//
//   // Sliding window limiter
//   const sw = new SlidingWindowLimiter({ maxRequests: 120, windowMs: 60_000 });
//   const allowed = sw.tryAcquire("user-123");
// ============================================================================

// ── Sleep helper that doesn't keep the event loop alive ─────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (t && typeof t === "object" && "unref" in t) (t as { unref: () => void }).unref();
  });
}

// ── RateLimiter (min interval + jitter) ────────────────────────────────────

/** Configuration for a RateLimiter. */
export interface RateLimiterConfig {
  /** Minimum interval between consecutive calls in ms. Default: 1000. */
  minInterval?: number;
  /** Random jitter (±ms) added to the interval. Default: 0. */
  jitter?: number;
}

/**
 * Rate limiter using minimum interval + optional jitter.
 *
 * Each call to `wait()` blocks until the required time has elapsed since
 * the last `wait()` call. Jitter is applied as ±jitter ms uniformly.
 */
export class RateLimiter {
  readonly minInterval: number;
  readonly jitter: number;
  private lastCallAt: number = 0;

  constructor(config: RateLimiterConfig = {}) {
    this.minInterval = config.minInterval ?? 1000;
    this.jitter = config.jitter ?? 0;
  }

  /**
   * Wait until the minimum interval (plus jitter) has elapsed since the
   * last call. Returns immediately on the first call.
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallAt;

    if (this.lastCallAt === 0 || elapsed >= this.minInterval) {
      this.lastCallAt = now;
      return;
    }

    // Apply jitter
    const jitterMs = this.jitter > 0
      ? Math.floor(Math.random() * 2 * this.jitter) - this.jitter
      : 0;
    const waitMs = Math.max(0, this.minInterval - elapsed + jitterMs);

    await sleep(waitMs);
    this.lastCallAt = Date.now();
  }
}

// ── SlidingWindowLimiter (max requests per window) ────────────────────────

/** Configuration for a SlidingWindowLimiter. */
export interface SlidingWindowOptions {
  /** Maximum requests allowed within the window. */
  maxRequests: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/**
 * Sliding-window rate limiter.
 *
 * Tracks request timestamps in a rolling window. `tryAcquire(key)` returns
 * false if `maxRequests` would be exceeded within the past `windowMs`.
 */
export class SlidingWindowLimiter {
  readonly maxRequests: number;
  readonly windowMs: number;
  private windows = new Map<string, number[]>();
  private defaultWindow: number[] = [];

  constructor(options: SlidingWindowOptions) {
    if (!options.maxRequests || options.maxRequests <= 0) {
      throw new Error("SlidingWindowLimiter: maxRequests must be > 0");
    }
    if (!options.windowMs || options.windowMs <= 0) {
      throw new Error("SlidingWindowLimiter: windowMs must be > 0");
    }
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  private getWindow(key?: string): number[] {
    if (!key) return this.defaultWindow;
    let w = this.windows.get(key);
    if (!w) {
      w = [];
      this.windows.set(key, w);
    }
    return w;
  }

  private prune(window: number[], now: number): number[] {
    const cutoff = now - this.windowMs;
    while (window.length > 0 && window[0] < cutoff) {
      window.shift();
    }
    return window;
  }

  /**
   * Try to acquire a request slot for the given key.
   * Returns true if the request is allowed (under the limit).
   */
  tryAcquire(key?: string): boolean {
    const now = Date.now();
    const window = this.prune(this.getWindow(key), now);
    if (window.length >= this.maxRequests) {
      return false;
    }
    window.push(now);
    return true;
  }

  /**
   * Returns the number of requests currently in the window for a key.
   */
  currentCount(key?: string): number {
    const now = Date.now();
    return this.prune(this.getWindow(key), now).length;
  }

  /** Reset the window for a specific key (or the default if no key). */
  reset(key?: string): void {
    if (!key) {
      this.defaultWindow = [];
      return;
    }
    this.windows.delete(key);
  }

  /** Reset all windows. */
  resetAll(): void {
    this.windows.clear();
    this.defaultWindow = [];
  }
}

// ── Pre-configured limiters for external APIs ──────────────────────────────

/** Pre-configured rate limiters keyed by provider name. */
export const Limiters = {
  /** Finnhub: 60 calls/min → ~1000ms interval, 100ms jitter. */
  finnhub: new RateLimiter({ minInterval: 1050, jitter: 100 }),
  /** Twelve Data: 8 calls/min → ~7500ms interval, 500ms jitter. */
  twelvedata: new RateLimiter({ minInterval: 7500, jitter: 500 }),
  /** Telegram Bot API: 30 calls/sec → ~35ms interval, 10ms jitter. */
  telegram: new RateLimiter({ minInterval: 35, jitter: 10 }),
  /** Binance REST: 1200 calls/min → ~55ms interval, 10ms jitter. */
  binance: new RateLimiter({ minInterval: 55, jitter: 10 }),
  /** DexScreener: 60 calls/min → ~1100ms interval, 100ms jitter. */
  dexscreener: new RateLimiter({ minInterval: 1100, jitter: 100 }),
  /** Helius RPC: conservative 50 calls/sec → ~25ms interval. */
  helius: new RateLimiter({ minInterval: 25, jitter: 5 }),
  /** Alchemy RPC: conservative 50 calls/sec → ~25ms interval. */
  alchemy: new RateLimiter({ minInterval: 25, jitter: 5 }),
} as const;