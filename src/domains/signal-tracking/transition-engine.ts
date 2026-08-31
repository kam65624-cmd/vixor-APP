// ============================================================================
// VIXOR Signal Transition Engine — Pure Domain Logic
// ============================================================================
//
// Authoritative state machine for signal lifecycle transitions.
// This module decides WHETHER a transition is legal and WHAT the next state is.
//
// INVARIANTS:
//   - Zero external dependencies (no DB, Supabase, React, notifications, MOXI).
//   - Pure and deterministic: same input always produces same output.
//   - No side effects: does not write, emit, or call anything.
//   - Client status is NEVER authoritative — this engine is the authority.
//
// OHLC AMBIGUITY POLICY (for future historical evaluation):
//   When evaluating OHLC candles, assume worst-case ordering:
//     BUY  → check LOW first (SL), then HIGH (TP)
//     SELL → check HIGH first (SL), then LOW (TP)
//   For live ticks, the observed price resolves ordering naturally.
//
// ============================================================================

import type { SignalStatus } from "./types";

// ── Event Types ────────────────────────────────────────────────────────────────
// Events produced by the transition engine. These map to domain events
// that will be persisted and consumed by MOXI, notifications, and audit.

export type SignalEventType =
  | "ENTRY_REACHED"
  | "TP1_HIT"
  | "TP2_HIT"
  | "TP3_HIT"
  | "SL_HIT"
  | "SIGNAL_INVALIDATED"
  | "SIGNAL_EXPIRED"
  | "SIGNAL_CANCELLED";

// ── Transition Request ─────────────────────────────────────────────────────────
// Input to the engine. Contains everything needed to make a transition decision.
// The caller (server layer) is responsible for validating ownership, signal
// version, and rate-limiting BEFORE invoking the engine.
//
// TODO(P1-6, Task-2): observedAt is provided by the client. The server-authority
// implementation (Task 2) must add serverReceivedAt and validate/round observedAt.
// Do NOT add server timestamps in 1.2C.

export interface SignalTransitionRequest {
  /** Current signal status in the database */
  currentState: SignalStatus;
  /** Trade direction from the signal setup */
  direction: "BUY" | "SELL" | "WAIT";
  /** Entry price from signal setup (null if not set) */
  entryPrice: number | null;
  /** Stop loss price from signal setup (null if not set) */
  stopLoss: number | null;
  /** Take profit levels from signal setup (null if not set) */
  takeProfit: number[] | null;
  /** Number of TPs already hit (0 = none, 1 = TP1, 2 = TP2) */
  hitTp: number;
  /** Observed market price */
  observedPrice: number;
  /** ISO 8601 timestamp of the price observation */
  observedAt: string;
  /**
   * For non-price transitions: explicitly requested target state.
   * Only "cancelled", "expired", and "invalidated" are accepted.
   * If set, price evaluation is skipped.
   */
  requestedTransition?: "cancelled" | "expired" | "invalidated";
}

// ── Transition Decision ────────────────────────────────────────────────────────
// Output from the engine. The caller uses this to decide whether to
// commit the state change, emit events, and send notifications.

export interface SignalTransitionDecision {
  /** Whether the transition is allowed */
  allowed: boolean;
  /** Current (pre-transition) status */
  from: SignalStatus;
  /** Target status if allowed, null if denied */
  to: SignalStatus | null;
  /** Domain event type if allowed, null if denied */
  event: SignalEventType | null;
  /** Human-readable reason. Always set when allowed=false; optional when allowed=true */
  reason?: string;
  /** Price that triggered the transition (the observed price) */
  price?: number;
  /** 0-based index of the TP level hit (0=TP1, 1=TP2, 2=TP3). Undefined for non-TP transitions */
  tpIndex?: number;
}

// ── Terminal States ────────────────────────────────────────────────────────────
// These states are final. No further transitions are allowed.
// Note: tp1_hit and tp2_hit are INTERMEDIATE — monitoring must continue.

export const TRANSITION_TERMINAL_STATUSES: ReadonlySet<SignalStatus> = new Set([
  "tp3_hit",
  "sl_hit",
  "invalidated",
  "expired",
  "cancelled",
]);

/** Check if a status is terminal (no further transitions possible) */
export function isTerminalStatus(status: SignalStatus): boolean {
  return TRANSITION_TERMINAL_STATUSES.has(status);
}

// ── Legal Transition Matrix ────────────────────────────────────────────────────
// Explicit allow-list of state transitions. Everything not listed is DENIED.
//
// Rules derived from the VIXOR Signal Runtime Implementation Brief:
//   pending  → active, invalidated, expired, cancelled
//   active   → tp1_hit, sl_hit
//   tp1_hit  → tp2_hit, sl_hit
//   tp2_hit  → tp3_hit, sl_hit
//   terminal → (nothing)
//
// Non-price transitions (cancel, expire, invalidate) are allowed from any
// non-terminal state. This is a general rule beyond the price-based matrix.

const NON_PRICE_TRANSITIONS: ReadonlySet<string> = new Set(["cancelled", "expired", "invalidated"]);

const PRICE_TRANSITION_MATRIX: Map<SignalStatus, Set<SignalStatus>> = new Map([
  ["pending" as SignalStatus, new Set<SignalStatus>(["active"])],
  ["active" as SignalStatus, new Set<SignalStatus>(["tp1_hit", "sl_hit"])],
  ["tp1_hit" as SignalStatus, new Set<SignalStatus>(["tp2_hit", "sl_hit"])],
  ["tp2_hit" as SignalStatus, new Set<SignalStatus>(["tp3_hit", "sl_hit"])],
]);

function isPriceTransitionAllowed(from: SignalStatus, to: SignalStatus): boolean {
  const targets = PRICE_TRANSITION_MATRIX.get(from);
  return targets ? targets.has(to) : false;
}

// ── Price Evaluation Functions ────────────────────────────────────────────────

/** BUY entry: price must drop to or below entry */
function isBuyEntryReached(entryPrice: number, observedPrice: number): boolean {
  return observedPrice <= entryPrice;
}

/** SELL entry: price must rise to or above entry */
function isSellEntryReached(entryPrice: number, observedPrice: number): boolean {
  return observedPrice >= entryPrice;
}

/** BUY stop-loss: price drops to or below SL */
function isBuyStopLossHit(stopLoss: number, observedPrice: number): boolean {
  return observedPrice <= stopLoss;
}

/** SELL stop-loss: price rises to or above SL */
function isSellStopLossHit(stopLoss: number, observedPrice: number): boolean {
  return observedPrice >= stopLoss;
}

/** BUY take-profit: price rises to or above TP level */
function isBuyTpHit(tpPrice: number, observedPrice: number): boolean {
  return observedPrice >= tpPrice;
}

/** SELL take-profit: price drops to or below TP level */
function isSellTpHit(tpPrice: number, observedPrice: number): boolean {
  return observedPrice <= tpPrice;
}

// ── Decision Builders ──────────────────────────────────────────────────────────

function deny(from: SignalStatus, code: string, message: string): SignalTransitionDecision {
  return {
    allowed: false,
    from,
    to: null,
    event: null,
    reason: `${code}: ${message}`,
  };
}

function allow(
  from: SignalStatus,
  to: SignalStatus,
  event: SignalEventType,
  price: number,
  tpIndex?: number,
): SignalTransitionDecision {
  return {
    allowed: true,
    from,
    to,
    event,
    price,
    ...(tpIndex !== undefined ? { tpIndex } : {}),
  };
}

// ── Input Validation ──────────────────────────────────────────────────────────

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

function isValidDateString(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  const date = new Date(str);
  return !isNaN(date.getTime());
}

// ── Event Mapping ──────────────────────────────────────────────────────────────

const NON_PRICE_EVENT_MAP: Record<string, SignalEventType> = {
  cancelled: "SIGNAL_CANCELLED",
  expired: "SIGNAL_EXPIRED",
  invalidated: "SIGNAL_INVALIDATED",
};

const TP_EVENT_MAP: Record<number, SignalEventType> = {
  0: "TP1_HIT",
  1: "TP2_HIT",
  2: "TP3_HIT",
};

const TP_STATUS_MAP: Record<number, SignalStatus> = {
  0: "tp1_hit",
  1: "tp2_hit",
  2: "tp3_hit",
};

// ── Main Engine ───────────────────────────────────────────────────────────────

/**
 * Evaluate whether a signal state transition is legal and determine the outcome.
 *
 * This is the SINGLE authoritative function for signal lifecycle decisions.
 * It is pure, deterministic, and has no side effects.
 *
 * @param request - The transition request with current state, signal setup, and observation data
 * @returns A transition decision indicating whether the transition is allowed
 */
export function evaluateSignalTransition(
  request: SignalTransitionRequest,
): SignalTransitionDecision {
  const {
    currentState,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    hitTp,
    observedPrice,
    observedAt,
    requestedTransition,
  } = request;

  // ── 1. Validate inputs ──────────────────────────────────────────────────

  if (!isValidPrice(observedPrice)) {
    return deny(currentState, "INVALID_PRICE", "Observed price must be a finite positive number");
  }

  if (!isValidDateString(observedAt)) {
    return deny(
      currentState,
      "INVALID_TIMESTAMP",
      "observedAt must be a valid ISO 8601 date string",
    );
  }

  if (requestedTransition && !NON_PRICE_TRANSITIONS.has(requestedTransition)) {
    return deny(
      currentState,
      "INVALID_REQUESTED_TRANSITION",
      `Requested transition '${requestedTransition}' is not a valid non-price transition`,
    );
  }

  // ── 2. Terminal state protection ────────────────────────────────────────

  if (TRANSITION_TERMINAL_STATUSES.has(currentState)) {
    return deny(
      currentState,
      "TERMINAL_STATE",
      `Signal is in terminal state '${currentState}'. No further transitions allowed.`,
    );
  }

  // ── 3. WAIT direction ───────────────────────────────────────────────────
  // WAIT signals have no price-based transitions. Only non-price transitions.

  if (direction === "WAIT") {
    if (requestedTransition) {
      return handleNonPriceTransition(currentState, requestedTransition, observedPrice);
    }
    return deny(
      currentState,
      "WAIT_DIRECTION",
      "WAIT signals do not support price-based transitions",
    );
  }

  // ── 4. Non-price transitions (cancel, expire, invalidate) ───────────────
  // These are allowed from any non-terminal state.

  if (requestedTransition) {
    return handleNonPriceTransition(currentState, requestedTransition, observedPrice);
  }

  // ── 5. Price-based transitions ─────────────────────────────────────────

  return evaluatePriceTransition(
    currentState,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    hitTp,
    observedPrice,
  );
}

// ── Non-Price Transition Handler ──────────────────────────────────────────────

function handleNonPriceTransition(
  currentState: SignalStatus,
  requested: "cancelled" | "expired" | "invalidated",
  price: number,
): SignalTransitionDecision {
  // Non-price transitions are allowed from any non-terminal state.
  // Terminal states are already filtered out before this function is called.
  const eventType = NON_PRICE_EVENT_MAP[requested];
  return allow(currentState, requested, eventType, price);
}

// ── Price Transition Handler ──────────────────────────────────────────────────

function evaluatePriceTransition(
  currentState: SignalStatus,
  direction: "BUY" | "SELL",
  entryPrice: number | null,
  stopLoss: number | null,
  takeProfit: number[] | null,
  hitTp: number,
  observedPrice: number,
): SignalTransitionDecision {
  // ── PENDING: Check entry price ─────────────────────────────────────────
  if (currentState === "pending") {
    if (entryPrice === null || !isValidPrice(entryPrice)) {
      return deny(
        "pending",
        "MISSING_ENTRY_PRICE",
        "Entry price is required and must be a valid positive number",
      );
    }

    const entryReached =
      direction === "BUY"
        ? isBuyEntryReached(entryPrice, observedPrice)
        : isSellEntryReached(entryPrice, observedPrice);

    if (entryReached) {
      return allow("pending", "active", "ENTRY_REACHED", observedPrice);
    }

    return deny("pending", "ENTRY_NOT_REACHED", "Price has not reached entry level");
  }

  // ── ACTIVE / TP states: Check SL first, then next TP ───────────────────
  // SL is checked before TP (protective priority). If both could trigger
  // on the same tick, SL wins. This is a conservative approach.

  if (currentState === "active" || currentState === "tp1_hit" || currentState === "tp2_hit") {
    // Check SL
    if (stopLoss !== null && isValidPrice(stopLoss)) {
      const slHit =
        direction === "BUY"
          ? isBuyStopLossHit(stopLoss, observedPrice)
          : isSellStopLossHit(stopLoss, observedPrice);

      if (slHit) {
        if (!isPriceTransitionAllowed(currentState, "sl_hit")) {
          return deny(
            currentState,
            "ILLEGAL_TRANSITION",
            `${currentState} → sl_hit is not allowed by the transition matrix`,
          );
        }
        return allow(currentState, "sl_hit", "SL_HIT", observedPrice);
      }
    }

    // Check next TP in sequence (must be sequential: TP1 → TP2 → TP3)
    const tps: number[] = Array.isArray(takeProfit) ? takeProfit : [];
    const nextTpIndex = hitTp; // 0-based: 0=TP1, 1=TP2, 2=TP3

    if (nextTpIndex >= 0 && nextTpIndex <= 2 && nextTpIndex < tps.length) {
      const tpPrice = tps[nextTpIndex];

      if (tpPrice !== undefined && isValidPrice(tpPrice)) {
        const tpHit =
          direction === "BUY"
            ? isBuyTpHit(tpPrice, observedPrice)
            : isSellTpHit(tpPrice, observedPrice);

        if (tpHit) {
          const targetStatus = TP_STATUS_MAP[nextTpIndex];
          const eventType = TP_EVENT_MAP[nextTpIndex];

          if (!targetStatus || !eventType) {
            return deny(
              currentState,
              "INVALID_TP_INDEX",
              `TP index ${nextTpIndex} is out of valid range (0-2)`,
            );
          }

          if (!isPriceTransitionAllowed(currentState, targetStatus)) {
            return deny(
              currentState,
              "ILLEGAL_TRANSITION",
              `${currentState} → ${targetStatus} violates the transition matrix (sequential TP ordering)`,
            );
          }

          return allow(currentState, targetStatus, eventType, observedPrice, nextTpIndex);
        }
      }
    }

    // No SL or TP triggered
    return {
      allowed: false,
      from: currentState,
      to: null,
      event: null,
      reason: "NO_TRIGGER: Price has not triggered SL or next TP level",
    };
  }

  // ── Unreachable for valid non-terminal states ──────────────────────────
  return deny(
    currentState,
    "UNEXPECTED_STATE",
    `Price evaluation is not applicable for state '${currentState}'`,
  );
}
