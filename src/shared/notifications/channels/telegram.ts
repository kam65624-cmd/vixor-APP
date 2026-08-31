// ============================================================================
// VIXOR Notifications — Telegram Channel
// ============================================================================
//
// Uses the existing TELEGRAM_BOT_TOKEN env var (already configured on Vercel).
// Sends a message via the Telegram Bot API to a chat_id resolved from:
//   1. options.target (explicit override)
//   2. user's profile.telegram_id in Supabase
//   3. user_settings.telegram_chat_id in Supabase
//
// Supports HTML parse mode (default) for rich formatting.
// ============================================================================

import type { ChannelSendOptions, NotificationChannelAdapter, NotificationResult } from "../types";
import { NotificationError } from "../types";

const CHANNEL_ID = "telegram" as const;
const DEFAULT_TIMEOUT_MS = 6_000;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
}

async function resolveChatId(userId: string, target?: string): Promise<string> {
  // Explicit override wins.
  if (target && target.trim()) return target.trim();

  // Look up from Supabase profiles / user_settings.
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    // First try user_settings (preferred post-migration).
    const { data: settingsRow } = await supabaseAdmin
      .from("user_settings")
      .select("notification_channels, telegram_chat_id")
      .eq("user_id", userId)
      .maybeSingle();

    const tg = (settingsRow as any)?.telegram_chat_id;
    if (tg) return String(tg);

    // Fall back to profiles table.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("telegram_id")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.telegram_id) return String(profile.telegram_id);
  } catch (err) {
    throw new NotificationError(
      `Failed to resolve Telegram chat_id for user ${userId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
      { channel: CHANNEL_ID, code: "TELEGRAM_CHAT_ID_LOOKUP_FAILED" },
    );
  }

  throw new NotificationError(
    `No Telegram chat_id configured for user ${userId}. Set it in user_settings.telegram_chat_id or pass notification.targets.telegram.`,
    { channel: CHANNEL_ID, code: "TELEGRAM_NO_CHAT_ID" },
  );
}

class TelegramChannel implements NotificationChannelAdapter {
  readonly id = CHANNEL_ID;

  isConfigured(): boolean {
    return getBotToken().length > 0;
  }

  async send(options: ChannelSendOptions): Promise<NotificationResult> {
    const startedAt = Date.now();
    const botToken = getBotToken();
    if (!botToken) {
      throw new NotificationError("TELEGRAM_BOT_TOKEN is not configured.", {
        channel: CHANNEL_ID,
        code: "TELEGRAM_NOT_CONFIGURED",
      });
    }

    let chatId: string;
    try {
      chatId = await resolveChatId(options.userId, options.target);
    } catch (err) {
      return {
        channel: CHANNEL_ID,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startedAt,
      };
    }

    const text = `<b>${escapeHtml(options.title)}</b>\n\n${escapeHtml(options.body)}`;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    if (timer && typeof timer === "object" && "unref" in timer) timer.unref();

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: ctrl.signal,
      });

      const json = (await res.json()) as {
        ok: boolean;
        result?: { message_id?: number };
        description?: string;
      };

      if (!res.ok || !json.ok) {
        return {
          channel: CHANNEL_ID,
          ok: false,
          error: `Telegram API error: ${json.description ?? res.status}`,
          durationMs: Date.now() - startedAt,
        };
      }

      return {
        channel: CHANNEL_ID,
        ok: true,
        messageId: json.result?.message_id ? String(json.result.message_id) : undefined,
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

export const telegramChannel = new TelegramChannel();
