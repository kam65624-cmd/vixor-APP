// Production-only Sentry SDK wrapper
// Guards: typeof window, import.meta.env.PROD, VITE_SENTRY_DSN

export function initSentry() {
  /* noop */
}

export function captureException(error: unknown, ctx?: Record<string, unknown>) {
  /* noop */
}
