// ============================================================================
// VIXOR Notifications — Webhook Channel
// ============================================================================
//
// Generic HTTP POST webhook. Sends the notification payload as JSON to the
// URL provided in `notification.targets.webhook` (or user_settings.webhook_url).
//
// Optionally signs the request body with HMAC-SHA256 if `WEBHOOK_SIGNING_SECRET`
// is set (or a per-call secret is provided via `notification.targets.webhook_secret`).
// The signature is sent in the `X-Vixor-Signature` header as `sha256=<hex>`.
// ============================================================================

import { createHmac } from "node:crypto";
import type { ChannelSendOptions, NotificationChannelAdapter, NotificationResult } from "../types";

const CHANNEL_ID = "webhook" as const;
const DEFAULT_TIMEOUT_MS = 10_000;

function getGlobalSigningSecret(): string {
  return (process.env.WEBHOOK_SIGNING_SECRET ?? "").trim();
}

async function resolveWebhookUrl(
  userId: string,
  target?: string,
): Promise<{
  url: string;
  secret: string;
} | null> {
  if (target && target.trim()) {
    return { url: target.trim(), secret: getGlobalSigningSecret() };
  }

  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_settings")
      .select("webhook_url, webhook_secret")
      .eq("user_id", userId)
      .maybeSingle();

    const row = data as any;
    if (row?.webhook_url) {
      return {
        url: String(row.webhook_url),
        secret: (row.webhook_secret as string) || getGlobalSigningSecret(),
      };
    }
  } catch {
    // Fall through to "not configured".
  }

  return null;
}

class WebhookChannel implements NotificationChannelAdapter {
  readonly id = CHANNEL_ID;

  /**
   * The webhook channel is always "configured" because the URL may be
   * provided per-call. The actual check happens in `send()`.
   */
  isConfigured(): boolean {
    return true;
  }

  async send(options: ChannelSendOptions): Promise<NotificationResult> {
    const startedAt = Date.now();

    const resolved = await resolveWebhookUrl(options.userId, options.target);
    if (!resolved) {
      return {
        channel: CHANNEL_ID,
        ok: false,
        error:
          "No webhook URL configured. Set notification.targets.webhook or user_settings.webhook_url.",
        durationMs: Date.now() - startedAt,
      };
    }

    const body = JSON.stringify({
      event: "vixor.notification",
      title: options.title,
      body: options.body,
      severity: options.severity,
      payload: options.payload,
      userId: options.userId,
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Vixor-Notifications/1.0",
    };

    if (resolved.secret) {
      const sig = createHmac("sha256", resolved.secret).update(body).digest("hex");
      headers["X-Vixor-Signature"] = `sha256=${sig}`;
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    if (timer && typeof timer === "object" && "unref" in timer) timer.unref();

    try {
      const res = await fetch(resolved.url, {
        method: "POST",
        headers,
        body,
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          channel: CHANNEL_ID,
          ok: false,
          error: `Webhook returned ${res.status}: ${errText.slice(0, 200)}`,
          durationMs: Date.now() - startedAt,
        };
      }

      return {
        channel: CHANNEL_ID,
        ok: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      return {
        channel: CHANNEL_ID,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startedAt,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const webhookChannel = new WebhookChannel();
