// ============================================================================
// VIXOR Rate Limiter — Token Bucket + Sliding Window
// ============================================================================
//
// Port of QuantDinger's app/data_sources/rate_limiter.py.
//
// Provides TWO complementary algorithms:
//
//   1. TokenBucketLimiter — per-key token bucket. Tokens refill at a
//      configurable rate (refillRatePerSec) up to a max capacity. Each
//      `acquire(cost)` removes `cost` tokens; if insufficient, the caller
//      sleeps until enough have refilled.
//
//   2. SlidingWindowLimiter — per-key sliding-window counter. Tracks call
//      timestamps in a window; rejects calls that would exceed maxRequests
//      within windowMs.
//
// Use TokenBucket for "smoothed" rate limiting (e.g., max 100 req/sec but
// burstable up to 200). Use SlidingWindow for hard ceilings (e.g., max 60
// req/min, no bursts allowed).
//
// Both algorithms are in-memory only — for multi-instance rate limiting,
// back them with Redis (Upstash) or a shared store. (Single-instance
// Vercel serverless is the current default; see cache.ts for the same
// in-memory + Redis hybrid pattern.)
//
// Usage:
//   import { TokenBucketLimiter } from "@/shared/resilience/rate-limiter";
//   const limiter = new TokenBucketLimiter({ capacity: 100, refillRatePerSec: 10 });
//   await limiter.acquire(); // blocks until a token is available
//   await limiter.acquire(5); // cost-5 call
// ============================================================================

// ── Sleep helper that doesn't keep the event loop alive ─────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (t && typeof t === "object" && "unref" in t) t.unref();
  });
}

// ── Token Bucket ────────────────────────────────────────────────────────────

export interface TokenBucketOptions {
  /** Maximum tokens the bucket can hold. Default: 100. */
  capacity?: number;
  /** Tokens added per second. Default: 10. */
  refillRatePerSec?: number;
  /** Initial token count. Default: equals `capacity`. */
  initialTokens?: number;
  /** Optional per-key extractor for shared instances. */
  keyExtractor?: (...args: unknown[]) => string;
}

interface BucketState {
  tokens: number;
  lastRefillAt: number;
}

/**
 * Token Bucket rate limiter.
 *
 * Tokens refill continuously at `refillRatePerSec` up to `capacity`.
 * `acquire(cost)` blocks until enough tokens are available.
 */
export class TokenBucketLimiter {
  readonly capacity: number;
  readonly refillRatePerSec: number;
  private readonly keyExtractor?: (...args: unknown[]) => string;
  private buckets = new Map<string, BucketState>();
  private defaultBucket: BucketState;

  constructor(options: TokenBucketOptions = {}) {
    this.capacity = options.capacity ?? 100;
    this.refillRatePerSec = options.refillRatePerSec ?? 10;
    this.keyExtractor = options.keyExtractor;

    const initial = options.initialTokens ?? this.capacity;
    this.defaultBucket = { tokens: initial, lastRefillAt: Date.now() };
  }

  private getBucket(key?: string): BucketState {
    if (!key) return this.defaultBucket;
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefillAt: Date.now() };
      this.buckets.set(key, bucket);
    }
    return bucket;
  }

  private refill(bucket: BucketState): void {
    const now = Date.now();
    const elapsedMs = now - bucket.lastRefillAt;
    if (elapsedMs <= 0) return;
    const refill = (elapsedMs / 1000) * this.refillRatePerSec;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
    bucket.lastRefillAt = now;
  }

  /**
   * Try to acquire `cost` tokens without waiting. Returns true if successful.
   */
  tryAcquire(cost = 1, key?: string): boolean {
    const bucket = this.getBucket(key);
    this.refill(bucket);
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }
    return false;
  }

  /**
   * Acquire `cost` tokens, blocking until enough are available.
   * Returns the actual wait time in ms.
   */
  async acquire(cost = 1, key?: string): Promise<number> {
    const totalWaitMs = await this.acquireMany(cost, key);
    return totalWaitMs;
  }

  /**
   * Internal helper to acquire multiple tokens, possibly across multiple
   * refill cycles. Returns total wait time.
   */
  private async acquireMany(cost: number, key?: string): Promise<number> {
    if (cost > this.capacity) {
      throw new Error(`Requested cost ${cost} exceeds bucket capacity ${this.capacity}`);
    }

    let totalWaited = 0;
    // Safety cap so we don't loop forever if something goes wrong.
    const maxIterations = 10_000;

    for (let i = 0; i < maxIterations; i++) {
      const bucket = this.getBucket(key);
      this.refill(bucket);

      if (bucket.tokens >= cost) {
        bucket.tokens -= cost;
        return totalWaited;
      }

      // Need to wait for more tokens.
      const deficit = cost - bucket.tokens;
      const waitMs = Math.ceil((deficit / this.refillRatePerSec) * 1000);
      // Cap wait at a reasonable max (10s) to avoid pathological waits.
      const actualWait = Math.min(waitMs, 10_000);
      await sleep(actualWait);
      totalWaited += actualWait;
    }

    throw new Error(
      `RateLimiter: gave up after ${maxIterations} iterations (cost=${cost}, capacity=${this.capacity}, refill=${this.refillRatePerSec}/s)`,
    );
  }

  /**
   * Returns the current token count for a key (after refilling).
   */
  availableTokens(key?: string): number {
    const bucket = this.getBucket(key);
    this.refill(bucket);
    return bucket.tokens;
  }

  /** Reset a single key's bucket (or the default bucket if no key). */
  reset(key?: string): void {
    if (!key) {
      this.defaultBucket = { tokens: this.capacity, lastRefillAt: Date.now() };
      return;
    }
    this.buckets.delete(key);
  }

  /** Reset all buckets. */
  resetAll(): void {
    this.buckets.clear();
    this.defaultBucket = { tokens: this.capacity, lastRefillAt: Date.now() };
  }
}

// ── Sliding Window ──────────────────────────────────────────────────────────

export interface SlidingWindowOptions {
  /** Maximum requests allowed within the window. */
  maxRequests: number;
  /** Window size in milliseconds. */
  windowMs: number;
  /** Optional per-key extractor for shared instances. */
  keyExtractor?: (...args: unknown[]) => string;
}

/**
 * Sliding-window rate limiter.
 *
 * Tracks request timestamps in a rolling window. `tryAcquire()` returns
 * false if `maxRequests` would be exceeded within the past `windowMs`.
 * `acquire()` blocks until a slot opens up.
 */
export class SlidingWindowLimiter {
  readonly maxRequests: number;
  readonly windowMs: number;
  private readonly keyExtractor?: (...args: unknown[]) => string;
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
    this.keyExtractor = options.keyExtractor;
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
    // Mutate in place to keep the same array reference held by the map.
    while (window.length > 0 && window[0] < cutoff) {
      window.shift();
    }
    return window;
  }

  tryAcquire(key?: string): boolean {
    const now = Date.now();
    const window = this.prune(this.getWindow(key), now);
    if (window.length >= this.maxRequests) {
      return false;
    }
    window.push(now);
    return true;
  }

  async acquire(key?: string): Promise<number> {
    let totalWaited = 0;
    const maxIterations = 10_000;

    for (let i = 0; i < maxIterations; i++) {
      if (this.tryAcquire(key)) {
        return totalWaited;
      }
      // Wait a small slice and retry. Compute precise wait until the oldest
      // request leaves the window.
      const now = Date.now();
      const window = this.prune(this.getWindow(key), now);
      if (window.length === 0) continue;
      const oldest = window[0];
      const waitMs = Math.max(1, oldest + this.windowMs - now);
      const actualWait = Math.min(waitMs, 10_000);
      await sleep(actualWait);
      totalWaited += actualWait;
    }

    throw new Error(`SlidingWindowLimiter: gave up after ${maxIterations} iterations`);
  }

  /**
   * Returns the number of requests currently in the window.
   */
  currentCount(key?: string): number {
    const now = Date.now();
    return this.prune(this.getWindow(key), now).length;
  }

  reset(key?: string): void {
    if (!key) {
      this.defaultWindow = [];
      return;
    }
    this.windows.delete(key);
  }

  resetAll(): void {
    this.windows.clear();
    this.defaultWindow = [];
  }
}

// ── Generic RateLimiter facade ──────────────────────────────────────────────

/**
 * Generic RateLimiter API as specified in the porting task.
 *
 * Wraps a TokenBucketLimiter so callers get a single uniform interface:
 *   await limiter.acquire()     // blocks until 1 token is available
 *   await limiter.acquire(5)    // blocks until 5 tokens are available
 *   limiter.tryAcquire()        // non-blocking
 *   limiter.tryAcquire(5)
 *
 * Underlying algorithm: token bucket.
 */
export class RateLimiter extends TokenBucketLimiter {
  // Inherits acquire(cost) and tryAcquire(cost) — signature matches.
}

// ── Default singletons (mirror QuantDinger's global instances) ──────────────

/**
 * Default shared rate limiter. Tune via env or import + configure directly.
 * 60 requests / minute (1/sec) with burst capacity of 10.
 */
export const defaultRateLimiter = new RateLimiter({
  capacity: 10,
  refillRatePerSec: 1,
});
