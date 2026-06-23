// ============================================================================
// VIXOR Circuit Breaker — Resilience Pattern
// ============================================================================
//
// Classic 3-state circuit breaker to guard flaky I/O (HTTP calls, DB queries,
// external APIs) so a single bad upstream doesn't cascade.
//
// State machine:
//   CLOSED   → OPEN       when consecutive failures >= failureThreshold
//   OPEN     → HALF_OPEN  when cooldownMs has elapsed
//   HALF_OPEN → CLOSED    when successThreshold successes occur
//   HALF_OPEN → OPEN      on any failure (re-arm, restart cooldown)
//
// Usage:
//   const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 300_000 });
//   const result = await cb.call(() => fetchPriceFromUpstream(pair));
// ============================================================================

/** Circuit breaker status snapshot. */
export interface CircuitBreakerStatus {
  state: CircuitState;
  failures: number;
  lastError: string | null;
  lastFailureAt: number | null;
}

/** Circuit breaker states. */
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/** Configuration options for a CircuitBreaker instance. */
export interface CircuitBreakerConfig {
  /** Consecutive failures required to trip the breaker. Default: 3. */
  failureThreshold?: number;
  /**
   * Cooldown in ms before transitioning OPEN → HALF_OPEN. Default: 300_000 (5 min).
   * Alias: resetTimeoutMs (for backward compatibility).
   */
  cooldownMs?: number;
  /** @deprecated Use cooldownMs instead. */
  resetTimeoutMs?: number;
  /** Successes required in HALF_OPEN to transition to CLOSED. Default: 1. */
  successThreshold?: number;
  /**
   * Max number of trial calls allowed in HALF_OPEN state. Default: 1.
   * Alias: successThreshold (both control the same behavior).
   */
  halfOpenMaxCalls?: number;
  /** Name used in logs. Default: "default". */
  name?: string;
}

/**
 * CircuitBreaker — guards an async operation against cascading failures.
 */
export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureAt: number | null = null;

  readonly failureThreshold: number;
  readonly cooldownMs: number;
  readonly successThreshold: number;
  readonly name: string;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 3;
    // Support both old (resetTimeoutMs) and new (cooldownMs) option names
    this.cooldownMs = config.cooldownMs ?? config.resetTimeoutMs ?? 300_000;
    // halfOpenMaxCalls and successThreshold control the same behavior
    this.successThreshold = config.successThreshold ?? config.halfOpenMaxCalls ?? 1;
    this.name = config.name ?? "default";
  }

  /**
   * Get the current circuit breaker state.
   * Side-effect: may transition OPEN → HALF_OPEN if cooldown has elapsed.
   */
  getState(): CircuitState {
    if (this.state === "OPEN" && this.lastFailureAt !== null) {
      const elapsed = Date.now() - this.lastFailureAt;
      if (elapsed >= this.cooldownMs) {
        this.state = "HALF_OPEN";
        this.consecutiveSuccesses = 0;
      }
    }
    return this.state;
  }

  /**
   * Execute `fn` through the circuit breaker.
   *
   * @param fn - The async function to execute.
   * @returns The result of `fn` on success.
   * @throws If the circuit is OPEN (and not yet half-open) or if `fn` rejects.
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();

    if (state === "OPEN") {
      throw new Error(
        `CircuitBreaker "${this.name}" is OPEN (failures=${this.consecutiveFailures}). ` +
          `Retry after cooldown (${this.cooldownMs}ms).`,
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  /**
   * Alias for `call()`. Provided for backward compatibility.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.call(fn);
  }

  /**
   * Returns a status snapshot with current state and failure counts.
   */
  getStatus(): CircuitBreakerStatus {
    return {
      state: this.getState(),
      failures: this.consecutiveFailures,
      lastError: null,
      lastFailureAt: this.lastFailureAt,
    };
  }

  /** Record a successful call. */
  recordSuccess(): void {
    this.consecutiveFailures = 0;

    if (this.state === "HALF_OPEN") {
      this.consecutiveSuccesses += 1;
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.state = "CLOSED";
        this.consecutiveSuccesses = 0;
      }
    }
  }

  /** Record a failed call. */
  recordFailure(): void {
    this.consecutiveFailures += 1;
    this.lastFailureAt = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.consecutiveSuccesses = 0;
    } else if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  /** Force the breaker back to CLOSED and clear all counters. */
  reset(): void {
    this.state = "CLOSED";
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureAt = null;
  }
}