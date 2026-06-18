// ============================================================================
// VIXOR Circuit Breaker — Resilience Pattern
// ============================================================================
//
// Port of QuantDinger's app/data_sources/circuit_breaker.py.
//
// Classic 3-state circuit breaker:
//   CLOSED → (failureThreshold consecutive failures) → OPEN
//   OPEN   → (resetTimeout elapsed)                  → HALF_OPEN
//   HALF_OPEN → success → CLOSED
//   HALF_OPEN → failure → OPEN (re-arm)
//
// Use this to wrap any flaky I/O (HTTP calls, DB queries, external APIs)
// so a single bad upstream doesn't take down the whole request.
//
// Usage:
//   import { CircuitBreaker } from "@/shared/resilience/circuit-breaker";
//
//   const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30_000 });
//   const result = await cb.execute(() => fetchPriceFromUpstream(pair));
//
// The breaker emits events via a tiny internal emitter so callers can hook
// into state transitions for metrics / logging:
//   cb.on("open", (info) => console.warn("breaker tripped", info));
// ============================================================================

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  /** Consecutive failures required to trip the breaker. Default: 3. */
  failureThreshold?: number;
  /** How long (ms) to stay OPEN before transitioning to HALF_OPEN. Default: 30_000. */
  resetTimeoutMs?: number;
  /** Max number of trial calls allowed in HALF_OPEN state. Default: 1. */
  halfOpenMaxCalls?: number;
  /** Name used in logs and event payloads. Default: "default". */
  name?: string;
}

export interface CircuitBreakerStatus {
  state: CircuitState;
  failures: number;
  lastError: string | null;
  lastFailureAt: number | null;
  halfOpenCalls: number;
}

export type CircuitBreakerEvent = "open" | "close" | "half-open" | "trip";

export type CircuitBreakerEventListener = (info: {
  name: string;
  state: CircuitState;
  failures: number;
  error: string | null;
}) => void;

/**
 * CircuitBreaker — guards an async operation against cascading failures.
 *
 * State machine:
 *   CLOSED  → OPEN       when consecutive failures ≥ failureThreshold
 *   OPEN    → HALF_OPEN  when resetTimeoutMs has elapsed since last failure
 *   HALF_OPEN → CLOSED   on first successful call
 *   HALF_OPEN → OPEN     on first failure (re-arm, restart cooldown)
 */
export class CircuitBreaker {
  readonly name: string;
  readonly failureThreshold: number;
  readonly resetTimeoutMs: number;
  readonly halfOpenMaxCalls: number;

  private state: CircuitState = "closed";
  private failures = 0;
  private lastError: string | null = null;
  private lastFailureAt: number | null = null;
  private halfOpenCalls = 0;

  private listeners = new Map<CircuitBreakerEvent, Set<CircuitBreakerEventListener>>();

  constructor(options: CircuitBreakerOptions = {}) {
    this.name = options.name ?? "default";
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls ?? 1;
  }

  // ── Event subscription ──────────────────────────────────────────────────

  on(event: CircuitBreakerEvent, listener: CircuitBreakerEventListener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => set!.delete(listener);
  }

  private emit(event: CircuitBreakerEvent): void {
    const set = this.listeners.get(event);
    if (!set) return;
    const info = {
      name: this.name,
      state: this.state,
      failures: this.failures,
      error: this.lastError,
    };
    for (const listener of set) {
      try {
        listener(info);
      } catch (err) {
        // Listener errors must never break the breaker.
        console.warn(
          `[CircuitBreaker:${this.name}] listener for "${event}" threw:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }

  // ── State queries ───────────────────────────────────────────────────────

  /**
   * Returns true if the breaker will allow a call through right now.
   * Side-effect: may transition OPEN → HALF_OPEN if cooldown has elapsed.
   */
  isAvailable(): boolean {
    if (this.state === "closed") return true;

    if (this.state === "open") {
      const now = Date.now();
      const elapsed = this.lastFailureAt !== null ? now - this.lastFailureAt : Infinity;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = "half_open";
        this.halfOpenCalls = 0;
        this.emit("half-open");
        return true;
      }
      return false;
    }

    // half_open
    if (this.halfOpenCalls < this.halfOpenMaxCalls) {
      return true;
    }
    return false;
  }

  getState(): CircuitState {
    return this.state;
  }

  getStatus(): CircuitBreakerStatus {
    return {
      state: this.state,
      failures: this.failures,
      lastError: this.lastError,
      lastFailureAt: this.lastFailureAt,
      halfOpenCalls: this.halfOpenCalls,
    };
  }

  // ── Outcome recording ───────────────────────────────────────────────────

  /** Record a successful call. Resets failures and returns to CLOSED. */
  recordSuccess(): void {
    if (this.state === "half_open") {
      // Half-open success → fully recovered.
    }
    this.state = "closed";
    this.failures = 0;
    this.halfOpenCalls = 0;
    this.lastError = null;
    this.emit("close");
  }

  /** Record a failed call. May trip the breaker. */
  recordFailure(error?: string | Error | null): void {
    this.failures += 1;
    this.lastFailureAt = Date.now();
    this.lastError = error instanceof Error ? error.message : (error ?? null);

    if (this.state === "half_open") {
      this.state = "open";
      this.halfOpenCalls = 0;
      this.emit("trip");
      this.emit("open");
    } else if (this.failures >= this.failureThreshold) {
      this.state = "open";
      this.emit("trip");
      this.emit("open");
    }
  }

  // ── Execution helper ────────────────────────────────────────────────────

  /**
   * Execute `fn` through the breaker. Returns its result on success, or
   * throws `CircuitOpenError` if the breaker is OPEN and not yet half-open.
   *
   * The breaker records success/failure automatically based on whether `fn`
   * resolves or rejects. To treat certain rejections as "success" (e.g.,
   * 404 Not Found is expected), pass `isFailure` predicate.
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: { isFailure?: (err: unknown) => boolean } = {},
  ): Promise<T> {
    if (!this.isAvailable()) {
      const err = new CircuitOpenError(
        `CircuitBreaker "${this.name}" is OPEN (failures=${this.failures})`,
      );
      throw err;
    }

    if (this.state === "half_open") {
      this.halfOpenCalls += 1;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      const isFailure = options.isFailure ?? (() => true);
      if (isFailure(err)) {
        this.recordFailure(err instanceof Error ? err : err != null ? String(err) : null);
      }
      throw err;
    }
  }

  // ── Manual control ──────────────────────────────────────────────────────

  /** Force the breaker back to CLOSED and clear failure counters. */
  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.halfOpenCalls = 0;
    this.lastError = null;
    this.lastFailureAt = null;
    this.emit("close");
  }
}

/**
 * Error thrown when the breaker is OPEN and rejects a call without invoking `fn`.
 */
export class CircuitOpenError extends Error {
  readonly code = "CIRCUIT_OPEN";
  constructor(message: string) {
    super(message);
    this.name = "CircuitOpenError";
  }
}
