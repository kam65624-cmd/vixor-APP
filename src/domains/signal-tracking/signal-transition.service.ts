// ============================================================================
// VIXOR Signal Transition Service — Server-Authoritative Transition Execution
// ============================================================================
//
// This module is the SINGLE server-side entry point for all signal state
// transitions. It:
//   1. Fetches the current signal state from the database (authoritative)
//   2. Validates client input against the Transition Engine
//   3. Executes the transition atomically via PostgreSQL RPC
//   4. Sends user notifications (entry, TP, SL)
//   5. Emits domain events after successful commit
//   6. Returns the transition result
//
// The client can REQUEST a transition but CANNOT determine the outcome.
// The Transition Engine (pure domain logic) determines the result.
//
// ============================================================================

import { evaluateSignalTransition } from "./transition-engine";
import type {
  SignalTransitionRequest,
  SignalTransitionDecision,
  SignalEventType,
} from "./transition-engine";
import type { SignalTracking, SignalStatus } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/supabase/types";
import { fromSupabaseError } from "@/shared/errors";
import { TERMINAL_STATUSES } from "./types";
import { notificationRouter } from "@/shared/notifications";

// ── Transition Service Types ─────────────────────────────────────────────────

export interface TransitionServiceRequest {
  trackingId: string;
  /** Observed market price (for price-based transitions) */
  observedPrice?: number;
  /** ISO 8601 timestamp of the price observation */
  observedAt?: string;
  /** For non-price transitions: explicitly requested target state */
  requestedTransition?: "cancelled" | "expired" | "invalidated";
  /** Actor performing the transition (default: "user") */
  actor?: "user" | "system";
}

export interface TransitionServiceResult {
  ok: true;
  transition: {
    id: string;
    trackingId: string;
    from: SignalStatus;
    to: SignalStatus;
    event: SignalEventType;
    price: number | undefined;
    serverReceivedAt: string;
  };
}

export interface TransitionServiceError {
  ok: false;
  error: string;
  code: "VALIDATION" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "TRANSITION_DENIED" | "INTERNAL";
}

export type TransitionServiceResponse = TransitionServiceResult | TransitionServiceError;

// ── Concurrency Key Generation ────────────────────────────────────────────────
// We use updated_at as an optimistic concurrency key. The client must pass
// the updated_at they last saw, and we check it hasn't changed.
// This prevents stale-state transitions without requiring true row locks.

export interface TransitionServiceRequestWithVersion extends TransitionServiceRequest {
  /** The updated_at timestamp of the signal when the client last read it */
  currentVersion: string;
}

// ── Notification Helper ───────────────────────────────────────────────────────

function sendTransitionNotification(
  userId: string,
  tracking: { pair: string; direction: string | null },
  newStatus: SignalStatus,
  price: number | undefined,
): void {
  const dir = tracking.direction === "BUY" ? "Long" : "Short";
  let title = "";
  let body = "";
  let severity: "info" | "warning" = "info";

  if (newStatus === "active") {
    title = "Entry Reached on {{pair}}";
    body = `${dir} ${tracking.pair} — Entry reached. Now monitoring TP/SL.`;
  } else if (newStatus.startsWith("tp")) {
    title = "TP Hit on {{pair}}!";
    body = `${dir} ${tracking.pair} — Take Profit hit at $${price?.toFixed(2) ?? "?"}! Signal: ${newStatus}.`;
  } else if (newStatus === "sl_hit") {
    title = "SL Hit on {{pair}}";
    body = `${dir} ${tracking.pair} — Stop Loss hit at $${price?.toFixed(2) ?? "?"}! Signal closed.`;
    severity = "warning";
  } else {
    return; // No notification for cancel/expire/invalidate
  }

  if (title) {
    void notificationRouter
      .send({
        userId,
        title,
        body,
        severity,
        payload: {
          pair: tracking.pair,
          direction: tracking.direction,
          price,
          status: newStatus,
        },
      })
      .catch(() => {
        /* non-blocking */
      });
  }
}

// ── hit_tp ↔ status Invariant Normalization ────────────────────────────────────────
// hit_tp is a persisted derived field. The authoritative source is `status`.
// This function normalizes hit_tp from status to guarantee engine correctness
// even if a bug or direct DB write creates a mismatch.
//
// Canonical mapping:
//   pending / active / sl_hit / expired / cancelled / invalidated → 0
//   tp1_hit → 1
//   tp2_hit → 2
//   tp3_hit → 3

export const STATUS_TO_HIT_TP: Readonly<Record<string, number>> = {
  tp1_hit: 1,
  tp2_hit: 2,
  tp3_hit: 3,
};

export function normalizeHitTp(status: string, persistedHitTp: number): number {
  const correct = STATUS_TO_HIT_TP[status] ?? 0;
  if (persistedHitTp !== correct) {
    // Log the repair for observability — this should NEVER happen in production
    // but if it does, we want to know about it.
    console.warn(
      `[SignalTransition] hit_tp invariant repair: status=${status} had hit_tp=${persistedHitTp}, normalized to ${correct}`,
    );
  }
  return correct;
}

// ── Main Transition Service ──────────────────────────────────────────────────

/**
 * Execute a server-authoritative signal transition.
 *
 * This function:
 * 1. Loads the current signal from DB (server-authoritative state)
 * 2. Validates ownership via userId
 * 3. Normalizes hit_tp from status (invariant guarantee)
 * 4. Calls the Transition Engine (pure domain logic, no side effects)
 * 5. If allowed: atomically updates signal + creates audit record via RPC
 * 6. Sends user notifications for entry/TP/SL transitions
 * 7. Emits domain events after successful commit
 * 8. Returns structured result
 *
 * @param db - Supabase client (user-authenticated, RLS applies)
 * @param userId - Authenticated user ID (for ownership check)
 * @param request - The transition request
 */
export async function executeSignalTransition(
  db: SupabaseClient<Database>,
  userId: string,
  request: TransitionServiceRequestWithVersion,
): Promise<TransitionServiceResponse> {
  const { trackingId, observedPrice, observedAt, requestedTransition, actor, currentVersion } =
    request;

  // ── 1. Validate inputs ─────────────────────────────────────────────────

  if (!trackingId || typeof trackingId !== "string") {
    return { ok: false, error: "trackingId is required", code: "VALIDATION" };
  }

  if (!currentVersion || typeof currentVersion !== "string") {
    return {
      ok: false,
      error: "currentVersion (updated_at) is required for concurrency protection",
      code: "VALIDATION",
    };
  }

  // ── 2. Fetch current signal state (server-authoritative) ────────────────

  const { data: tracking, error: fetchError } = await db
    .from("signal_tracking")
    .select("*")
    .eq("id", trackingId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !tracking) {
    if (fetchError?.code === "PGRST116") {
      return { ok: false, error: "Signal tracking not found", code: "NOT_FOUND" };
    }
    return { ok: false, error: "Failed to fetch signal tracking", code: "INTERNAL" };
  }

  // ── 3. Concurrency check (optimistic locking via updated_at) ─────────────

  const dbVersion = tracking.updated_at;
  if (dbVersion !== currentVersion) {
    return {
      ok: false,
      error: `Signal state has changed since you last read it (server: ${dbVersion}, client: ${currentVersion})`,
      code: "CONFLICT",
    };
  }

  // ── 4. Build Transition Engine request ──────────────────────────────────

  const serverReceivedAt = new Date().toISOString();

  // For non-price transitions, the price is irrelevant to the business logic
  // but the engine still validates it. Use a non-zero placeholder.
  const effectivePrice = requestedTransition ? (observedPrice ?? 1) : observedPrice;

  if (effectivePrice === undefined || effectivePrice === null) {
    return {
      ok: false,
      error: "observedPrice is required for price-based transitions",
      code: "VALIDATION",
    };
  }

  const engineRequest: SignalTransitionRequest = {
    currentState: tracking.status as SignalStatus,
    direction: tracking.direction as "BUY" | "SELL" | "WAIT",
    entryPrice: tracking.entry_price,
    stopLoss: tracking.stop_loss,
    takeProfit: Array.isArray(tracking.take_profit) ? (tracking.take_profit as number[]) : null,
    // Normalize hit_tp from authoritative status (invariant guarantee)
    // This ensures the engine always receives a consistent cursor even if
    // a prior bug or direct DB write created a mismatch.
    hitTp: normalizeHitTp(tracking.status as SignalStatus, tracking.hit_tp),
    observedPrice: effectivePrice,
    observedAt: observedAt ?? serverReceivedAt,
    requestedTransition,
  };

  // ── 5. Evaluate via Transition Engine (pure domain logic) ───────────────

  const decision: SignalTransitionDecision = evaluateSignalTransition(engineRequest);

  if (!decision.allowed) {
    return {
      ok: false,
      error: decision.reason ?? "Transition denied by engine",
      code: "TRANSITION_DENIED",
    };
  }

  // ── 6. Execute atomic transition via PostgreSQL RPC ────────────────────
  // Uses a single RPC call that wraps the signal update + audit insert
  // in a PostgreSQL transaction. Falls back to sequential operations if
  // the RPC is not available (migration not yet applied).

  const newStatus = decision.to!;
  let transitionId = "";

  // Compute derived fields for the RPC
  let activatedAt: string | null = null;
  if (newStatus === "active") {
    activatedAt = serverReceivedAt;
  }

  let resolvedAt: string | null = null;
  if (TERMINAL_STATUSES.includes(newStatus)) {
    resolvedAt = serverReceivedAt;
  }

  let hitTp: number | null = null;
  if (decision.tpIndex !== undefined) {
    hitTp = decision.tpIndex + 1;
  } else {
    // For non-TP transitions (SL, cancel, expire, invalidate, entry),
    // always compute the correct hit_tp from the new status.
    // This prevents COALESCE(p_hit_tp, hit_tp) in the RPC from preserving
    // a stale hit_tp value (e.g., tp1_hit→sl_hit should reset hit_tp to 0).
    hitTp = STATUS_TO_HIT_TP[newStatus] ?? 0;
  }

  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  // Try RPC first (atomic)
  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
    "execute_signal_transition",
    {
      p_tracking_id: trackingId,
      p_user_id: userId,
      p_current_version: currentVersion,
      p_new_status: newStatus,
      p_current_price: decision.price ?? tracking.current_price,
      p_hit_tp: hitTp,
      p_activated_at: activatedAt,
      p_resolved_at: resolvedAt,
      p_from_status: tracking.status as string,
      p_event_type: decision.event!,
      p_observed_price: decision.price ?? null,
      p_tp_index: decision.tpIndex ?? null,
      p_transition_reason: decision.reason ?? null,
      p_observed_at: observedAt ?? serverReceivedAt,
      p_actor: actor ?? "user",
      p_source: "server",
    },
  );

  if (rpcError || !rpcResult) {
    // RPC not available — fall back to sequential operations
    // (This path handles the case where the migration hasn't been applied yet)
    if (rpcError?.message?.includes("execute_signal_transition")) {
      console.warn(
        "[SignalTransition] RPC not available, falling back to sequential operations. Apply migration 20260811000001.",
      );
    } else if (rpcError) {
      // Real RPC error (conflict, etc.)
      if (rpcError.message?.includes("CONFLICT")) {
        return { ok: false, error: "Signal state has changed concurrently", code: "CONFLICT" };
      }
      console.error("[SignalTransition] RPC error:", rpcError.message);
    }

    // ⚠️ NON-ATOMIC FALLBACK — UPDATE and INSERT run as separate statements.
    // If INSERT fails after UPDATE succeeds, the signal state will be updated
    // but the audit record will be missing. This path should NEVER execute in
    // production once migration 20260811000001 is applied.
    console.error(
      `[SignalTransition] NON-ATOMIC FALLBACK for tracking=${trackingId} user=${userId} — RPC unavailable. Signal state UPDATE and audit INSERT will run as separate statements.`,
    );

    // Sequential fallback — always set hit_tp from canonical mapping
    const updates: Database["public"]["Tables"]["signal_tracking"]["Update"] = {
      status: newStatus as Database["public"]["Enums"]["signal_status"],
      current_price: decision.price ?? tracking.current_price,
      hit_tp:
        decision.tpIndex !== undefined ? decision.tpIndex + 1 : (STATUS_TO_HIT_TP[newStatus] ?? 0),
      updated_at: serverReceivedAt,
    };

    if (newStatus === "active") {
      updates.activated_at = serverReceivedAt;
    }
    if (TERMINAL_STATUSES.includes(newStatus)) {
      updates.resolved_at = serverReceivedAt;
    }

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("signal_tracking")
      .update(updates)
      .eq("id", trackingId)
      .eq("user_id", userId)
      .eq("updated_at", currentVersion)
      .select("id")
      .single();

    if (updateError || !updatedRows) {
      if (updateError) {
        const domainErr = fromSupabaseError(updateError, "Signal transition update");
        if (domainErr.category === "conflict") {
          return { ok: false, error: "Signal state has changed concurrently", code: "CONFLICT" };
        }
      }
      return { ok: false, error: "Signal state has changed concurrently", code: "CONFLICT" };
    }

    // Sequential audit insert
    const { data: transition, error: insertError } = await supabaseAdmin
      .from("signal_transitions")
      .insert({
        signal_tracking_id: trackingId,
        user_id: userId,
        from_status: tracking.status as string,
        to_status: newStatus as string,
        event_type: decision.event!,
        observed_price: decision.price ?? null,
        tp_index: decision.tpIndex ?? null,
        transition_reason: decision.reason ?? null,
        server_received_at: serverReceivedAt,
        observed_at: observedAt ?? serverReceivedAt,
        actor: actor ?? "user",
        source: "server",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(
        `[SignalTransition] AUDIT FAILURE: signal ${trackingId} transitioned to ${newStatus} but audit record was not created:`,
        insertError.message,
      );
    } else {
      transitionId = transition?.id ?? "";
    }
  } else {
    // RPC succeeded — extract transition ID
    transitionId = (rpcResult as { transition?: { id: string } })?.transition?.id ?? "";
  }

  // ── 7. Send notification (non-blocking) ─────────────────────────────────
  sendTransitionNotification(
    userId,
    { pair: tracking.pair, direction: tracking.direction as string | null },
    newStatus,
    decision.price,
  );

  // ── 8. Emit domain events (after successful commit) ─────────────────────
  // Emits the generic transition.completed event PLUS granular TP/SL events
  // so that all registered consumers are properly activated.

  try {
    const { VixorEvents } = await import("@/shared/events");

    // 8a. Always emit the generic transition event
    await VixorEvents.emit("signal.transition.completed", {
      trackingId,
      userId,
      pair: tracking.pair,
      direction: tracking.direction as "BUY" | "SELL",
      fromStatus: tracking.status as string,
      toStatus: newStatus as string,
      eventType: decision.event,
      price: decision.price ?? null,
      tpIndex: decision.tpIndex ?? null,
      serverReceivedAt,
      actor: actor ?? "user",
    } as never);

    // 8b. Emit granular TP event for take-profit transitions
    if (decision.event?.startsWith("TP") && decision.tpIndex !== undefined) {
      await VixorEvents.emit("signal.tp_hit", {
        trackingId,
        userId,
        pair: tracking.pair,
        direction: tracking.direction as "BUY" | "SELL",
        tpIndex: decision.tpIndex,
        hitTp: decision.tpIndex + 1,
        currentPrice: decision.price ?? 0,
      });
    }

    // 8c. Emit granular SL event for stop-loss transition
    if (decision.event === "SL_HIT") {
      await VixorEvents.emit("signal.sl_hit", {
        trackingId,
        userId,
        pair: tracking.pair,
        direction: tracking.direction as "BUY" | "SELL",
        currentPrice: decision.price ?? 0,
        stopLoss: tracking.stop_loss ?? 0,
      });
    }
  } catch {
    // Event emission failure should NEVER break the transition flow
  }

  // ── 9. Return success ──────────────────────────────────────────────────

  return {
    ok: true,
    transition: {
      id: transitionId,
      trackingId,
      from: tracking.status as SignalStatus,
      to: newStatus,
      event: decision.event!,
      price: decision.price,
      serverReceivedAt,
    },
  };
}
