// ============================================================================
// VIXOR Resilience — Public API
// ============================================================================
//
// Barrel export for all resilience patterns: circuit breaker, rate limiter,
// LRU cache. Import from here to keep imports stable as the directory grows.
//
// Usage:
//   import {
//     CircuitBreaker,
//     RateLimiter,
//     LRUCache,
//   } from "@/shared/resilience";
// ============================================================================

export { CircuitBreaker, CircuitOpenError } from "./circuit-breaker";

export type {
  CircuitState,
  CircuitBreakerOptions,
  CircuitBreakerStatus,
  CircuitBreakerEvent,
  CircuitBreakerEventListener,
} from "./circuit-breaker";

export {
  RateLimiter,
  TokenBucketLimiter,
  SlidingWindowLimiter,
  defaultRateLimiter,
} from "./rate-limiter";

export type { TokenBucketOptions, SlidingWindowOptions } from "./rate-limiter";

export { LRUCache } from "./lru-cache";
export type { LRUCacheOptions, LRUCacheStats } from "./lru-cache";
