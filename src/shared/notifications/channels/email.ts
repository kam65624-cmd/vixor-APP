// ============================================================================
// VIXOR Notifications — Email Channel (stub via Resend)
// ============================================================================
//
// Resend (https://resend.com) is the recommended email provider for Vercel
// apps. Set RESEND_API_KEY to enable. Without a key, the channel reports
// "not configured" and the router skips it gracefully.
//
// This is currently a STUB — it builds the email payload and POSTs to
// Resend's `/emails` endpoint. For production, integrate Resend's official
// SDK (`resend`) and a template engine.
// ============================================================================

import type { ChannelSendOptions, NotificationChannelAdapter, NotificationResult } from "../types";

const CHANNEL_ID = "email" as const;
const DEFAULT_TIMEOUT_MS = 10_000;

function getApiKey(): string {
  return (process.env.RESEND_API_KEY ?? "").trim();
}

function getFromAddress(): string {
  return (process.env.RESEND_FROM ?? "Vixor <noreply@vixor.app>").trim();
}

function getBaseUrl(): string {
  return (process.env.RESEND_BASE_URL ?? "https://api.resend.com").replace(/\/$/, "");
}

class EmailChannel implements NotificationChannelAdapter {
  readonly id = CHANNEL_ID;

  isConfigured(): boolean {
    return getApiKey().length > 0;
  }

  async send(options: ChannelSendOptions): Promise<NotificationResult> {
    const startedAt = Date.now();
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        channel: CHANNEL_ID,
        ok: false,
        error: "RESEND_API_KEY not configured; skipping email channel.",
        durationMs: Date.now() - startedAt,
      };
    }

    if (!options.target) {
      return {
        channel: CHANNEL_ID,
        ok: false,
        error: "No email address provided (notification.targets.email).",
        durationMs: Date.now() - startedAt,
      };
    }

    const payload = {
      from: getFromAddress(),
      to: options.target,
      subject: options.title,
      text: options.body,
      html: `<div style="font-family: sans-serif;"><h2>${escapeHtml(options.title)}</h2><p>${escapeHtml(options.body).replace(/\n/g, "<br>")}</p></div>`,
    };

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    if (timer && typeof timer === "object" && "unref" in timer) timer.unref();

    try {
      const res = await fetch(`${getBaseUrl()}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });

      const json = (await res.json()) as { id?: string; message?: string };

      if (!res.ok) {
        return {
          channel: CHANNEL_ID,
          ok: false,
          error: `Resend API ${res.status}: ${json.message ?? "unknown error"}`,
          durationMs: Date.now() - startedAt,
        };
      }

      return {
        channel: CHANNEL_ID,
        ok: true,
        messageId: json.id,
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const emailChannel = new EmailChannel();
