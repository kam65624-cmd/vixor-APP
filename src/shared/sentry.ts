// Production-only Sentry SDK wrapper
// Guards: typeof window, import.meta.env.PROD, VITE_SENTRY_DSN

const SAFE_ORIGINS = [
  "vixor.app",
  "localhost",
];

export function initSentry() {
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD) return;

  const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined);
  if (!dsn) return;

  // Only initialize in browser
  import("@sentry/react").then(({ init, default: Sentry }) => {
    init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
      ],
      // Prevent Sentry from capturing errors from 3rd-party iframes (e.g. TradingView widgets)
      allowUrls: SAFE_ORIGINS.map((o) => new RegExp(`https?://([^/]+\\.)?${o.replace(".", "\\.")}`)),
      // Performance
      tracesSampleRate: 0.1,
      // Replay — only 10% of sessions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }).catch(() => {/* noop — Sentry unavailable */});
}

export function captureException(error: unknown, ctx?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD) {
    // Log to console in dev
    console.error("[Vixor][Sentry:skipped]", error, ctx);
    return;
  }
  import("@sentry/react").then(({ captureException: cap }) => {
    cap(error as Error, { extra: ctx });
  }).catch(() => {/* noop */});
}
