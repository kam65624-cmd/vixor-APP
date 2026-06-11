// ============================================================================
// VIXOR Event Persistence — Supabase-backed event log
// ============================================================================
//
// Persists domain events to the `domain_events` table for:
//   - Cross-invocation observability
//   - Audit trail
//   - Debugging and replay
//   - Future analytics
//
// Usage:
//   import { configureEventPersistence } from "@/shared/events/persist";
//   configureEventPersistence(); // uses supabaseAdmin internally
// ============================================================================

import { VixorEvents, type EventLogEntry } from "./orchestrator";

/**
 * Persist an event to the domain_events table.
 * Called non-blocking by the EventOrchestrator.
 */
async function persistEvent(entry: EventLogEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    const { error } = await supabaseAdmin.from("domain_events").insert({
      event_type: entry.event_type,
      payload: entry.payload,
      source: entry.source || null,
      trace_id: entry.trace_id || null,
    });

    if (error) {
      // Don't throw — event persistence should never break the main flow
      console.warn(
        `[EventPersist] Failed to persist ${entry.event_type}: ${error.message}`,
      );
    }
  } catch (err) {
    console.warn(
      `[EventPersist] Supabase import or insert failed:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Configure the VixorEvents orchestrator to persist events to Supabase.
 * Call this once at server startup.
 */
export function configureEventPersistence(): void {
  VixorEvents.setPersistence(persistEvent);
  console.log("[EventPersist] Configured — events will be logged to domain_events");
}
