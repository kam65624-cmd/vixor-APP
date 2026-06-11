// ============================================================================
// VIXOR Event Orchestrator — Typed Event Bus for the Trading Intelligence Platform
// ============================================================================
//
// Architecture:
//   1. In-process sync event chain (within a single serverless invocation)
//      — e.g., alert.triggered → notification.created → telegram.sent
//   2. Persistent event log (Supabase `domain_events` table)
//      — for cross-invocation observability, replay, and audit
//   3. Console logging (Vercel captures structured logs)
//
// Design Rules:
//   - Events are typed — every event has a known shape
//   - Events are synchronous within a request lifecycle
//   - Event persistence is async and non-blocking (fire-and-forget)
//   - Errors in handlers never break the emitter (caught and logged)
//   - No external dependencies — pure TypeScript
//
// Usage:
//   import { VixorEvents } from "@/shared/events";
//   VixorEvents.emit("alert.triggered", { alertId, pair, price });
//
//   VixorEvents.on("alert.triggered", async (payload) => {
//     // handle the event
//   });
// ============================================================================

// ── Event Type Definitions ──────────────────────────────────────────────────

export interface VixorEventMap {
  // Analysis events
  "analysis.created": {
    analysisId: string;
    pair: string;
    timeframe: string;
    userId: string;
    recommendation: "BUY" | "SELL" | "WAIT";
    confidence: number;
  };
  "analysis.failed": {
    pair: string;
    userId: string;
    error: string;
  };

  // Signal events
  "signal.generated": {
    pair: string;
    timeframe: string;
    recommendation: "BUY" | "SELL" | "WAIT";
    confidence: number;
    signalDate: string;
  };
  "signal.expired": {
    pair: string;
    signalDate: string;
  };

  // Alert events
  "alert.triggered": {
    alertId: string;
    userId: string;
    pair: string;
    condition: string;
    targetPrice: number;
    currentPrice: number;
  };
  "alert.created": {
    alertId: string;
    userId: string;
    pair: string;
    condition: string;
    targetPrice: number;
  };

  // Trade events
  "trade.opened": {
    tradeId: string;
    userId: string;
    pair: string;
    direction: "long" | "short";
    entryPrice: number;
  };
  "trade.closed": {
    tradeId: string;
    userId: string;
    pair: string;
    exitPrice: number;
    pnl: number;
  };
  "trade.updated": {
    tradeId: string;
    userId: string;
    updates: Record<string, unknown>;
  };

  // Journal events
  "journal.created": {
    noteId: string;
    userId: string;
    pair?: string;
    mood?: string;
  };
  "journal.updated": {
    noteId: string;
    userId: string;
  };

  // Notification events
  "notification.created": {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
  };

  // Copilot events
  "copilot.message.sent": {
    conversationId: string;
    userId: string;
    agentId: string;
  };
  "copilot.action.executed": {
    conversationId: string;
    userId: string;
    action: string;
    result: "success" | "error";
  };

  // User events
  "user.telegram.linked": {
    userId: string;
    telegramId: string | number;
  };
  "user.premium.subscribed": {
    userId: string;
    planId: string;
  };
  "user.points.credited": {
    userId: string;
    amount: number;
    reason: string;
  };

  // Daily Loop events
  "dailyloop.morning-prep.completed": {
    userId: string;
    date: string;
  };
  "dailyloop.eod-review.completed": {
    userId: string;
    date: string;
  };

  // Watchlist events
  "watchlist.item.added": {
    userId: string;
    pair: string;
    watchlistId: string;
  };
}

// ── Event Handler Type ───────────────────────────────────────────────────────

type EventHandler<T> = (payload: T) => Promise<void> | void;

// ── Event Log Entry ─────────────────────────────────────────────────────────

export interface EventLogEntry {
  event_type: string;
  payload: Record<string, unknown>;
  source?: string;
  trace_id?: string;
}

// ── Event Orchestrator Class ────────────────────────────────────────────────

class EventOrchestrator {
  private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();
  private enabled: boolean = true;
  private persistEnabled: boolean = false;
  private persistFn?: (entry: EventLogEntry) => Promise<void>;

  // ── Register Handlers ───────────────────────────────────────────────────

  /**
   * Register a handler for a specific event type.
   * Multiple handlers can be registered for the same event.
   * Handlers are called in registration order.
   */
  on<K extends keyof VixorEventMap>(
    eventType: K,
    handler: EventHandler<VixorEventMap[K]>,
  ): void {
    if (!this.handlers.has(eventType as string)) {
      this.handlers.set(eventType as string, new Set());
    }
    this.handlers.get(eventType as string)!.add(handler as EventHandler<unknown>);
  }

  /**
   * Remove a previously registered handler.
   */
  off<K extends keyof VixorEventMap>(
    eventType: K,
    handler: EventHandler<VixorEventMap[K]>,
  ): void {
    this.handlers.get(eventType as string)?.delete(handler as EventHandler<unknown>);
  }

  // ── Emit Events ─────────────────────────────────────────────────────────

  /**
   * Emit an event. All registered handlers are called.
   * Handlers are called concurrently (Promise.allSettled).
   * Errors in handlers are caught and logged — never break the emitter.
   *
   * Event persistence (if configured) is non-blocking.
   */
  async emit<K extends keyof VixorEventMap>(
    eventType: K,
    payload: VixorEventMap[K],
    options?: { source?: string; trace_id?: string },
  ): Promise<void> {
    if (!this.enabled) return;

    const eventTypeStr = eventType as string;

    // Log the event
    console.log(
      `[VixorEvents] ${eventTypeStr}`,
      JSON.stringify(payload).slice(0, 200),
    );

    // Persist event (non-blocking)
    if (this.persistEnabled && this.persistFn) {
      this.persistFn({
        event_type: eventTypeStr,
        payload: payload as unknown as Record<string, unknown>,
        source: options?.source,
        trace_id: options?.trace_id,
      }).catch((err) => {
        console.warn(
          `[VixorEvents] Failed to persist event ${eventTypeStr}:`,
          err instanceof Error ? err.message : String(err),
        );
      });
    }

    // Call all registered handlers
    const handlers = this.handlers.get(eventTypeStr);
    if (!handlers || handlers.size === 0) return;

    const results = await Promise.allSettled(
      [...handlers].map((handler) =>
        Promise.resolve(handler(payload as unknown)).catch((err) => {
          console.error(
            `[VixorEvents] Handler error for ${eventTypeStr}:`,
            err instanceof Error ? err.message : String(err),
          );
          throw err; // re-throw so allSettled captures it
        }),
      ),
    );

    // Log handler failures
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          `[VixorEvents] Handler failed for ${eventTypeStr}:`,
          result.reason,
        );
      }
    }
  }

  // ── Configuration ───────────────────────────────────────────────────────

  /**
   * Enable or disable the event system.
   * When disabled, emit() is a no-op.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[VixorEvents] ${enabled ? "Enabled" : "Disabled"}`);
  }

  /**
   * Configure event persistence.
   * Provide a function that stores events (e.g., to Supabase).
   * Persistence is non-blocking — emit() never waits for it.
   */
  setPersistence(fn: (entry: EventLogEntry) => Promise<void>): void {
    this.persistFn = fn;
    this.persistEnabled = true;
    console.log("[VixorEvents] Persistence configured");
  }

  /**
   * Enable/disable persistence without changing the function.
   */
  setPersistenceEnabled(enabled: boolean): void {
    this.persistEnabled = enabled;
  }

  // ── Introspection ───────────────────────────────────────────────────────

  /**
   * Get all registered event types and their handler counts.
   */
  handlerCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [eventType, handlers] of this.handlers) {
      counts[eventType] = handlers.size;
    }
    return counts;
  }

  /**
   * Check if any handlers are registered for an event type.
   */
  hasHandlers(eventType: keyof VixorEventMap): boolean {
    return (this.handlers.get(eventType as string)?.size ?? 0) > 0;
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────

export const VixorEvents = new EventOrchestrator();
