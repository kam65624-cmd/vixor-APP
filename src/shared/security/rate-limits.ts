// ============================================================================
// VIXOR Security — Centralized Rate Limit Configuration
// ============================================================================
//
// Defines all rate limit thresholds and provides a lightweight in-memory
// checkRateLimit function for serverless-compatible enforcement.
//
// Usage:
//   import { checkRateLimit, RATE_LIMITS } from '@/shared/security/rate-limits';
//   const { allowed, remaining } = await checkRateLimit('user-123', RATE_LIMITS.askMoxi);
// ============================================================================

/** Configuration for a single rate limit rule. */
export interface RateLimitConfig {
  /** Time window in milliseconds. */
  readonly windowMs: number;
  /** Maximum number of requests allowed within the window. */
  readonly maxRequests: number;
}

/** Centralized rate limit configuration for all VIXOR endpoints. */
export const RATE_LIMITS = {
  // Server functions
  askMoxi: { windowMs: 60_000, maxRequests: 25 },
  createAnalysis: { windowMs: 60_000, maxRequests: 10 },
  scanOpportunities: { windowMs: 300_000, maxRequests: 5 },
  createSignalTracking: { windowMs: 60_000, maxRequests: 30 },
  requestSignalTransition: { windowMs: 60_000, maxRequests: 120 },

  // HTTP API routes
  health: { windowMs: 10_000, maxRequests: 100 },
  webhook: { windowMs: 60_000, maxRequests: 50 },

  // Global
  global: { windowMs: 60_000, maxRequests: 300 },
} as const satisfies Record<string, RateLimitConfig>;

// ── In-memory sliding window store ──────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

/**
 * Check a rate limit for a given key.
 *
 * Uses an in-memory sliding window counter. Suitable for serverless
 * environments where Redis may not be available.
 *
 * Returns `{ allowed, remaining }` where:
 *   - `allowed` is true if the request is under the limit
 *   - `remaining` is the number of requests left in the current window
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune expired timestamps
  while (entry.timestamps.length > 0 && entry.timestamps[0] < cutoff) {
    entry.timestamps.shift();
  }

  const remaining = Math.max(0, config.maxRequests - entry.timestamps.length);

  if (entry.timestamps.length >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1 };
}

/**
 * Reset the rate limit state for a specific key (or all keys).
 * Primarily used in tests.
 */
export function resetRateLimit(key?: string): void {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}
