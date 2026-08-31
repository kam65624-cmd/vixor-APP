// ============================================================================
// VIXOR Notifications — Types
// ============================================================================
//
// Shared types for the notification system.
// ============================================================================

export type NotificationChannel = "telegram" | "email" | "webhook" | "in-app";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface Notification {
  /**
   * Stable id (UUID) for deduplication. The router will generate one if
   * omitted.
   */
  id?: string;
  /** The user this notification is for. */
  userId: string;
  /**
   * Which channels to fan out to. If omitted, the router reads the user's
   * preferences from `user_settings.notification_channels`.
   */
  channels?: NotificationChannel[];
  /** Title / subject line. */
  title: string;
  /** Body text (plain text — channels will format as needed). */
  body: string;
  /** Severity for prioritization. Default: "info". */
  severity?: NotificationSeverity;
  /**
   * Optional structured payload. Channel templates can reference fields
   * via `{{key}}` substitution.
   */
  payload?: Record<string, unknown>;
  /**
   * Channel-specific targets. If a channel requires a target that isn't in
   * the user's settings (e.g., a webhook URL), it must be provided here.
   */
  targets?: Partial<Record<NotificationChannel, string>>;
}

export interface NotificationResult {
  channel: NotificationChannel;
  ok: boolean;
  /** Error message if `ok` is false. */
  error?: string;
  /** Channel-specific delivery id (e.g., Telegram message_id). */
  messageId?: string;
  /** Wall-clock duration in ms. */
  durationMs: number;
}

export interface ChannelSendOptions {
  /** The user this notification is being sent to. */
  userId: string;
  /** Plain-text title. */
  title: string;
  /** Plain-text body. */
  body: string;
  /** Severity hint. */
  severity: NotificationSeverity;
  /** Full structured payload (for templating). */
  payload: Record<string, unknown>;
  /** Channel-specific target override. */
  target?: string;
  /** Per-call timeout in ms. */
  timeoutMs?: number;
}

/**
 * Interface that all channel adapters must implement.
 */
export interface NotificationChannelAdapter {
  readonly id: NotificationChannel;
  /** Whether the channel is configured (env vars set, etc.). */
  isConfigured(): boolean;
  /** Send a notification via this channel. */
  send(options: ChannelSendOptions): Promise<NotificationResult>;
}

/**
 * Error thrown when a notification cannot be sent.
 */
export class NotificationError extends Error {
  readonly channel: NotificationChannel;
  readonly code: string;

  constructor(
    message: string,
    options: { channel: NotificationChannel; code?: string } = {
      channel: "in-app",
    },
  ) {
    super(message);
    this.name = "NotificationError";
    this.channel = options.channel;
    this.code = options.code ?? "NOTIFICATION_FAILED";
  }
}
