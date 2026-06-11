// ============================================================================
// VIXOR Execution Engine — Centralized Database Writes & Audit Trail
// ============================================================================
//
// All mutative operations (database writes, event creation, notifications)
// should flow through this engine for:
//   - Consistent audit logging
//   - Event emission on state changes
//   - Error handling and retry patterns
//   - Future: transaction management
//
// Usage:
//   import { ExecutionEngine } from "@/shared/execution";
//
//   const result = await ExecutionEngine.insert({
//     table: "trading_notes",
//     data: { user_id: userId, content: "..." },
//     userId,
//     eventType: "journal.created",
//     eventPayload: { noteId: "..." },
//   });
// ============================================================================

import { VixorEvents } from "../events";

// ── Execution Types ──────────────────────────────────────────────────────────

export interface ExecutionInput {
  /** Target Supabase table */
  table: string;
  /** Data to insert or update */
  data: Record<string, unknown>;
  /** User ID performing the action */
  userId: string;
  /** Event type to emit on success (optional) */
  eventType?: string;
  /** Event payload (optional) */
  eventPayload?: Record<string, unknown>;
  /** Audit description for logging */
  description: string;
}

export interface UpdateExecutionInput {
  /** Target Supabase table */
  table: string;
  /** Data to update */
  data: Record<string, unknown>;
  /** Filter for the update (e.g., { id: "xxx", user_id: "yyy" }) */
  filter: Record<string, unknown>;
  /** User ID performing the action */
  userId: string;
  /** Event type to emit on success (optional) */
  eventType?: string;
  /** Event payload (optional) */
  eventPayload?: Record<string, unknown>;
  /** Audit description for logging */
  description: string;
}

export interface ExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ── Execution Engine Class ────────────────────────────────────────────────────

class ExecutionEngineClass {
  /**
   * Insert a row into a Supabase table with audit logging and event emission.
   */
  async insert(input: ExecutionInput): Promise<ExecutionResult> {
    console.log(`[ExecEngine] INSERT ${input.table} — ${input.description} (user: ${input.userId})`);

    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { data, error } = await supabaseAdmin
        .from(input.table)
        .insert(input.data)
        .select("*")
        .single();

      if (error) {
        console.error(`[ExecEngine] INSERT FAILED ${input.table}: ${error.message}`);
        return { success: false, error: error.message };
      }

      // Emit event if specified
      if (input.eventType && input.eventPayload) {
        void VixorEvents.emit(
          input.eventType as keyof import("../events/orchestrator").VixorEventMap,
          input.eventPayload as any,
        );
      }

      console.log(`[ExecEngine] ✓ INSERT ${input.table} — ${input.description}`);
      return { success: true, data: data as Record<string, unknown> };
    } catch (err) {
      console.error(`[ExecEngine] INSERT ERROR ${input.table}:`, err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Update rows in a Supabase table with audit logging and event emission.
   */
  async update(input: UpdateExecutionInput): Promise<ExecutionResult> {
    console.log(`[ExecEngine] UPDATE ${input.table} — ${input.description} (user: ${input.userId})`);

    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      let query = supabaseAdmin.from(input.table).update(input.data);

      // Apply filters
      for (const [key, value] of Object.entries(input.filter)) {
        query = query.eq(key, value);
      }

      const { data, error } = await query.select("*").single();

      if (error) {
        console.error(`[ExecEngine] UPDATE FAILED ${input.table}: ${error.message}`);
        return { success: false, error: error.message };
      }

      // Emit event if specified
      if (input.eventType && input.eventPayload) {
        void VixorEvents.emit(
          input.eventType as keyof import("../events/orchestrator").VixorEventMap,
          input.eventPayload as any,
        );
      }

      console.log(`[ExecEngine] ✓ UPDATE ${input.table} — ${input.description}`);
      return { success: true, data: data as Record<string, unknown> };
    } catch (err) {
      console.error(`[ExecEngine] UPDATE ERROR ${input.table}:`, err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Create an in-app notification for a user.
   */
  async notify(params: {
    userId: string;
    title: string;
    body: string;
    type: string;
  }): Promise<ExecutionResult> {
    return this.insert({
      table: "notifications",
      data: {
        user_id: params.userId,
        title: params.title,
        body: params.body,
        type: params.type,
      },
      userId: params.userId,
      eventType: "notification.created",
      eventPayload: {
        notificationId: "pending",
        userId: params.userId,
        type: params.type,
        title: params.title,
      },
      description: `Notify user: ${params.title}`,
    });
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const ExecutionEngine = new ExecutionEngineClass();
