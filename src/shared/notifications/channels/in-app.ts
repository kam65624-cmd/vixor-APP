// ============================================================================
// VIXOR Notifications — In-App Channel (Supabase `notifications` table)
// ============================================================================
//
// Persists a notification row to the `notifications` table so the user can
// see it in the /notifications page. Status starts as "pending"; the page
// marks it "read" when the user opens it.
//
// Requires the `notifications` migration (20260618000000_add_quantdinger_reuse.sql)
// to be applied.
// ============================================================================

import type { ChannelSendOptions, NotificationChannelAdapter, NotificationResult } from "../types";

const CHANNEL_ID = "in-app" as const;

class InAppChannel implements NotificationChannelAdapter {
  readonly id = CHANNEL_ID;

  /**
   * The in-app channel is always "configured" — it just requires Supabase,
   * which the rest of the app also requires.
   */
  isConfigured(): boolean {
    return true;
  }

  async send(options: ChannelSendOptions): Promise<NotificationResult> {
    const startedAt = Date.now();

    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: options.userId,
          channel: "in-app",
          payload: {
            title: options.title,
            body: options.body,
            severity: options.severity,
            ...options.payload,
          },
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !data) {
        return {
          channel: CHANNEL_ID,
          ok: false,
          error: error?.message ?? "Failed to insert in-app notification row.",
          durationMs: Date.now() - startedAt,
        };
      }

      return {
        channel: CHANNEL_ID,
        ok: true,
        messageId: data.id as string,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      return {
        channel: CHANNEL_ID,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startedAt,
      };
    }
  }
}

export const inAppChannel = new InAppChannel();
