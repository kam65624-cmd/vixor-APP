// ============================================================================
// VIXOR Resilience — Public API
// ============================================================================
//
// Barrel export for all resilience patterns: circuit breaker, rate limiter,
// LRU cache.
//
// Usage:
//   import { CircuitBreaker, Limiters, Caches, SlidingWindowLimiter } from "@/shared/resilience";
// ============================================================================

export { CircuitBreaker } from "./circuit-breaker";
export type { CircuitState, CircuitBreakerConfig, CircuitBreakerStatus } from "./circuit-breaker";

export { RateLimiter, SlidingWindowLimiter, Limiters } from "./rate-limiter";
export type { RateLimiterConfig, SlidingWindowOptions } from "./rate-limiter";

export { LRUCache, Caches } from "./lru-cache";
export type { LRUCacheConfig, LRUCacheStats } from "./lru-cache";
