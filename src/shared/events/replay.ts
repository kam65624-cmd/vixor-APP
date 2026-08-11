// ============================================================================
// VIXOR Event Replay — Replay events from the domain_events table
// ============================================================================
//
// Allows replaying persisted events for a given time range. Useful for:
//   - Rebuilding projection state after a bug fix
//   - Debugging by replaying events through handlers
//   - Backfilling new consumers with historical events
//
// Usage:
//   import { replayEvents } from "@/shared/events/replay";
//   const result = await replayEvents({
//     eventType: "signal.transition.completed",
//     since: "2026-08-01T00:00:00.000Z",
//     handler: async (type, payload) => {
//       // process the event
//     },
//   });
// ============================================================================

import { supabaseAdmin } from "@/shared/supabase/client.server";

export interface ReplayOptions {
  /** Filter by event type (e.g., "signal.transition.completed") */
  eventType?: string;
  /** Start of time range (ISO timestamp, inclusive) */
  since?: string;
  /** End of time range (ISO timestamp, exclusive) */
  until?: string;
  /** Maximum number of events to process */
  limit?: number;
  /** Handler called for each event */
  handler: (eventType: string, payload: Record<string, unknown>) => Promise<void>;
}

export interface ReplayResult {
  processed: number;
  errors: number;
}

/**
 * Replay events from the domain_events table for a given time range.
 *
 * Non-blocking error handling: if a handler throws for one event,
 * the error is logged and replay continues with the next event.
 */
export async function replayEvents(options: ReplayOptions): Promise<ReplayResult> {
  let query = supabaseAdmin
    .from("domain_events")
    .select("event_type, payload, created_at")
    .order("created_at", { ascending: true });

  // Apply filters
  if (options.eventType) {
    query = query.eq("event_type", options.eventType);
  }
  if (options.since) {
    query = query.gte("created_at", options.since);
  }
  if (options.until) {
    query = query.lt("created_at", options.until);
  }

  // Apply limit (default: 1000 for safety)
  const limit = options.limit ?? 1000;
  query = query.limit(limit);

  const { data: events, error } = await query;

  if (error) {
    throw new Error(`Failed to query domain_events for replay: ${error.message}`);
  }

  if (!events || events.length === 0) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const eventType = event.event_type as string;
      const payload = (event.payload as Record<string, unknown>) ?? {};
      await options.handler(eventType, payload);
      processed++;
    } catch (err) {
      errors++;
      console.warn(
        `[EventReplay] Handler error for event ${event.event_type} (${event.created_at}):`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return { processed, errors };
}
