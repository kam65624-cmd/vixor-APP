// ============================================================================
// VIXOR Notifications — NotificationRouter
// ============================================================================
//
// Fans a single Notification out to all subscribed channels for the user.
//
// Channel selection:
//   1. notification.channels (explicit override) — if set, only those channels
//      are used.
//   2. user_settings.notification_channels — read from Supabase.
//   3. Default: ["telegram", "in-app"] for backwards-compatibility.
//
// Templating: simple {{key}} substitution from notification.payload.
//   e.g., title = "Price alert on {{symbol}}", payload = { symbol: "EUR/USD" }
//   → rendered title = "Price alert on EUR/USD"
//
// All channels are invoked in parallel — one channel failure does not block
// the others. Each result is returned in the results array.
//
// Usage:
//   import { notificationRouter } from "@/shared/notifications";
//   const results = await notificationRouter.send({
//     userId: "abc-123",
//     title: "Price alert on {{symbol}}",
//     body: "Price crossed {{target}}",
//     payload: { symbol: "EUR/USD", target: 1.085 },
//   });
// ============================================================================

import type {
  Notification,
  NotificationChannel,
  NotificationChannelAdapter,
  NotificationResult,
  NotificationSeverity,
} from "./types";
import { telegramChannel } from "./channels/telegram";
import { emailChannel } from "./channels/email";
import { webhookChannel } from "./channels/webhook";
import { inAppChannel } from "./channels/in-app";

// ── Channel registry ────────────────────────────────────────────────────────

const CHANNELS: Record<NotificationChannel, NotificationChannelAdapter> = {
  telegram: telegramChannel,
  email: emailChannel,
  webhook: webhookChannel,
  "in-app": inAppChannel,
};

const DEFAULT_CHANNELS: NotificationChannel[] = ["telegram", "in-app"];

// ── Templating ──────────────────────────────────────────────────────────────

/**
 * Replace `{{key}}` placeholders in a string with values from `payload`.
 * Missing keys are left as-is (so users can see what wasn't substituted).
 *
 * Supports dot-notation: `{{user.name}}` resolves payload.user.name.
 */
export function renderTemplate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, keyPath: string) => {
    const parts = keyPath.split(".");
    let current: unknown = payload;
    for (const part of parts) {
      if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return match; // Leave the placeholder if the path doesn't resolve.
      }
    }
    if (current === null || current === undefined) return "";
    if (typeof current === "object") return JSON.stringify(current);
    return String(current);
  });
}

// ── Channel resolution ──────────────────────────────────────────────────────

async function resolveChannels(
  userId: string,
  explicit?: NotificationChannel[],
): Promise<NotificationChannel[]> {
  if (explicit && explicit.length > 0) return explicit;

  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_settings")
      .select("notification_channels")
      .eq("user_id", userId)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    const fromSettings = row?.notification_channels;
    if (Array.isArray(fromSettings) && fromSettings.length > 0) {
      // Validate that each value is a known channel.
      return fromSettings.filter(
        (c: unknown): c is NotificationChannel =>
          c === "telegram" || c === "email" || c === "webhook" || c === "in-app",
      );
    }
  } catch {
    // Fall through to defaults.
  }

  return DEFAULT_CHANNELS;
}

// ── Router ──────────────────────────────────────────────────────────────────

export class NotificationRouter {
  /**
   * Fan out a notification to all configured channels for the user.
   *
   * Returns one NotificationResult per channel attempted (in channel order).
   * A channel that is not configured (missing API key, etc.) is included
   * as a failed result with a clear error message — NOT silently skipped —
   * so callers can surface the issue to the user.
   */
  async send(notification: Notification): Promise<NotificationResult[]> {
    const channels = await resolveChannels(notification.userId, notification.channels);

    const payload = notification.payload ?? {};
    const title = renderTemplate(notification.title, payload);
    const body = renderTemplate(notification.body, payload);
    const severity: NotificationSeverity = notification.severity ?? "info";

    const results = await Promise.all(
      channels.map(async (channelId): Promise<NotificationResult> => {
        const channel = CHANNELS[channelId];
        if (!channel) {
          return {
            channel: channelId,
            ok: false,
            error: `Unknown channel: ${channelId}`,
            durationMs: 0,
          };
        }

        const target = notification.targets?.[channelId];
        try {
          return await channel.send({
            userId: notification.userId,
            title,
            body,
            severity,
            payload,
            target,
          });
        } catch (err) {
          return {
            channel: channelId,
            ok: false,
            error: err instanceof Error ? err.message : String(err),
            durationMs: 0,
          };
        }
      }),
    );

    return results;
  }

  /**
   * Returns the list of channels that are globally configured (env vars set).
   * Useful for surfacing "what can I use?" in the UI.
   */
  listAvailableChannels(): Array<{
    id: NotificationChannel;
    configured: boolean;
  }> {
    return (Object.keys(CHANNELS) as NotificationChannel[]).map((id) => ({
      id,
      configured: CHANNELS[id].isConfigured(),
    }));
  }
}

// ── Singleton + barrel re-exports ───────────────────────────────────────────

export const notificationRouter = new NotificationRouter();

export type {
  Notification,
  NotificationChannel,
  NotificationResult,
  NotificationSeverity,
  ChannelSendOptions,
  NotificationChannelAdapter,
} from "./types";

export { NotificationError } from "./types";
export { telegramChannel } from "./channels/telegram";
export { emailChannel } from "./channels/email";
export { webhookChannel } from "./channels/webhook";
export { inAppChannel } from "./channels/in-app";
