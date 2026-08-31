// ============================================================================
// VIXOR Query Cache Invalidation — Wire domain events to TanStack Query cache
// ============================================================================
//
// Sets up automatic TanStack Query cache invalidation based on domain events.
// Since this is server-side, the function registers event consumers that log
// the invalidation intent. Actual WebSocket-based invalidation to the client
// will be implemented in Phase 6.
//
// Query Key Mappings:
//   signal.transition.completed → ['signalTrackings']
//   alert.triggered              → ['priceAlerts']
//   journal.created              → ['tradingNotes']
//   trade.opened / trade.closed  → ['trades']
//
// Usage:
//   import { setupQueryInvalidation } from "@/shared/events/query-invalidation";
//   setupQueryInvalidation(); // call once at server startup
// ============================================================================

import { VixorEvents } from "./orchestrator";

// ── Query Key → Event Type Mapping ──────────────────────────────────────────

const INVALIDATION_MAP: Record<string, string[]> = {
  "signal.transition.completed": ["signalTrackings"],
  "alert.triggered": ["priceAlerts"],
  "journal.created": ["tradingNotes"],
  "trade.opened": ["trades"],
  "trade.closed": ["trades"],
};

// ── Setup Function ───────────────────────────────────────────────────────────

let setup = false;

/**
 * Set up automatic TanStack Query cache invalidation based on domain events.
 *
 * Registers event consumers for each mapped event type. When an event fires,
 * the consumer logs the cache invalidation intent. In Phase 6, this will
 * emit WebSocket messages to connected clients.
 */
export function setupQueryInvalidation(): void {
  if (setup) return;
  setup = true;

  for (const [eventType, queryKeys] of Object.entries(INVALIDATION_MAP)) {
    VixorEvents.on(eventType as keyof import("./orchestrator").VixorEventMap, () => {
      for (const key of queryKeys) {
        console.log(`[CacheInvalidation] Query key ["${key}"] invalidated by event ${eventType}`);
      }
    });
  }

  console.log(
    `[QueryInvalidation] Registered invalidation consumers for ${Object.keys(INVALIDATION_MAP).length} event types`,
  );
}

/**
 * Check if query invalidation has been set up.
 */
export function isQueryInvalidationSetup(): boolean {
  return setup;
}

/**
 * Get the invalidation mapping (for testing).
 */
export function getInvalidationMap(): Record<string, string[]> {
  return { ...INVALIDATION_MAP };
}
