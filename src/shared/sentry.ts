// Production-only Sentry SDK wrapper
// Guards: typeof window, import.meta.env.PROD, VITE_SENTRY_DSN

import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  if (initialized || typeof window === "undefined" || !import.meta.env.PROD) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [],
    beforeSend(event: Sentry.ErrorEvent) {
      // Filter localhost
      if (event.request?.url?.includes("localhost")) return null;
      // Filter noise
      const msg = event.exception?.values?.[0]?.value || "";
      const noise = ["ResizeObserver loop", "Non-Error promise rejection", "SecurityError", "Script error"];
      if (noise.some((n) => msg.includes(n))) return null;
      return event;
    },
  });
  initialized = true;
}

export function captureException(error: unknown, ctx?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.captureException(error, { extra: ctx });
}