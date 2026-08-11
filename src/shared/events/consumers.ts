// ============================================================================
// VIXOR Event Consumers — Domain event handlers
// ============================================================================
//
// Registers handlers for emitted domain events.
// Consumers are side-effectful: logging, notifications, cache invalidation.
// They must NEVER mutate domain state directly.
//
// Usage:
//   import { registerEventConsumers } from "@/shared/events/consumers";
//   registerEventConsumers(); // call once at server startup
// ============================================================================

import { VixorEvents } from "./orchestrator";
import type { VixorEventMap } from "./orchestrator";

// ── Signal Transition Consumer ──────────────────────────────────────────────
// Logs structured transition data for observability.
// Future: trigger TanStack Query invalidation, push notifications, analytics.

function handleSignalTransitionCompleted(
  payload: VixorEventMap["signal.transition.completed"],
): void {
  const direction = payload.direction === "BUY" ? "LONG" : "SHORT";
  const priceStr = payload.price !== null ? `$${payload.price.toFixed(2)}` : "N/A";
  const tpStr = payload.tpIndex !== null ? ` TP${payload.tpIndex + 1}` : "";

  console.log(
    `[SignalTransition] ${payload.pair} ${direction}: ${payload.fromStatus} → ${payload.toStatus}${tpStr} @ ${priceStr} (actor: ${payload.actor})`,
  );

  // Log terminal transitions as structured events for analytics
  const terminalStatuses = [
    "sl_hit",
    "tp1_hit",
    "tp2_hit",
    "tp3_hit",
    "cancelled",
    "expired",
    "invalidated",
  ];
  if (terminalStatuses.includes(payload.toStatus)) {
    console.log(
      `[SignalTransition] TERMINAL: ${payload.pair} closed as ${payload.toStatus}. Duration: trackingId=${payload.trackingId}`,
    );
  }
}

// ── Alert Consumer ──────────────────────────────────────────────────────────

function handleAlertTriggered(payload: VixorEventMap["alert.triggered"]): void {
  console.log(
    `[Alert] ${payload.pair} ${payload.condition} triggered — target: $${payload.targetPrice}, current: $${payload.currentPrice}`,
  );
}

// ── Registration ─────────────────────────────────────────────────────────────

let registered = false;

/**
 * Register all domain event consumers.
 * Safe to call multiple times — only registers once.
 */
export function registerEventConsumers(): void {
  if (registered) return;
  registered = true;

  VixorEvents.on("signal.transition.completed", handleSignalTransitionCompleted);
  VixorEvents.on("alert.triggered", handleAlertTriggered);

  console.log("[EventConsumers] Registered signal.transition.completed, alert.triggered");
}

/**
 * Check if event consumers have been registered.
 */
export function isEventConsumersRegistered(): boolean {
  return registered;
}
