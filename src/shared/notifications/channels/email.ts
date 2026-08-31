// ============================================================================
// VIXOR Notifications — Email Channel (Resend)
// ============================================================================
//
// Production-ready email channel using Resend's REST API.
// Supports plain text and HTML email delivery with VIXOR branding.
// Set RESEND_API_KEY to enable. Without a key, the channel reports
// "not configured" and the router skips it gracefully.
//
// HTML template uses inline styles for maximum email client compatibility.
// ============================================================================

import type { ChannelSendOptions, NotificationChannelAdapter, NotificationResult } from "../types";

const CHANNEL_ID = "email" as const;
const DEFAULT_TIMEOUT_MS = 10_000;

// ── VIXOR brand colors (inline for email compat) ─────────────────────────

const BRAND = {
  primary: "#6C5CE7",
  background: "#0B0F1A",
  surface: "#131722",
  text: "#E1E5EE",
  muted: "#8B95A8",
  accent: "#00E676",
  danger: "#FF4757",
  border: "rgba(255,255,255,0.08)",
} as const;

function getApiKey(): string {
  return (process.env.RESEND_API_KEY ?? "").trim();
}

function getFromAddress(): string {
  return (process.env.RESEND_FROM ?? "VIXOR <noreply@vixor.app>").trim();
}

function getBaseUrl(): string {
  return (process.env.RESEND_BASE_URL ?? "https://api.resend.com").replace(/\/$/, "");
}

// ── HTML Template ─────────────────────────────────────────────────────────

/**
 * Build a branded HTML email from title + body text.
 * Uses inline styles and a table-based layout for broad email client support.
 */
function buildHtmlEmail(title: string, body: string): string {
  const escapedTitle = escapeHtml(title);
  const paragraphs = body
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;line-height:1.6;color:${BRAND.text};font-size:15px;">${escapeHtml(p)}</p>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:22px;font-weight:800;color:${BRAND.primary};letter-spacing:-0.5px;">
                    VIXOR
                  </td>
                  <td style="padding-left:8px;font-size:12px;color:${BRAND.muted};vertical-align:middle;">
                    AI Trading Terminal
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding:28px 0 8px 0;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;line-height:1.3;">
                ${escapedTitle}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:8px 0 28px 0;">
              ${paragraphs}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0 0;border-top:1px solid ${BRAND.border};text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
                Sent by VIXOR AI Trading Terminal<br>
                <a href="https://vixor.app" style="color:${BRAND.primary};text-decoration:none;">vixor.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Channel Implementation ─────────────────────────────────────────────────

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

    const html = buildHtmlEmail(options.title, options.body);

    const payload = {
      from: getFromAddress(),
      to: options.target,
      subject: options.title,
      text: options.body,
      html,
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
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const emailChannel = new EmailChannel();
