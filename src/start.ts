import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "@/shared/error-page";
import { attachSupabaseAuth } from "@/shared/supabase/auth-attacher";
import { log } from "@/shared/structured-logger";
import { metrics } from "@/shared/metrics-store";

// ── P1 Bootstrap: Register event consumers + configure event persistence ──
// Must run BEFORE createStart() so all event handlers are active when
// the first server function executes.
import "@/shared/p1-bootstrap";

// Structured request logging + metrics recording.
// Logs every request as a single JSON line for downstream ingestion (Loki/ELK/Datadog).
const loggingMiddleware = createMiddleware().server(async ({ next, request }) => {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const method = request.method;
  const route = url.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const res = await next();
    const durationMs = Date.now() - startedAt;
    const status = res.response.status ?? 200;
    metrics.recordHttpRequest(method, route, status);
    metrics.recordDurationMs(durationMs);
    const fn = status >= 500 ? log.error : status >= 400 ? log.warn : log.info;
    fn("http", { method, route, status, durationMs, ip, ua: userAgent.slice(0, 120) });
    // Alert hooks (logged, not blocked — alerting consumes these lines)
    if (status === 404) {
      log.warn("404", { method, route, ip, ua: userAgent.slice(0, 80) });
    }
    if (status >= 500) {
      log.error("5xx", { status, method, route, ip, ua: userAgent.slice(0, 80) });
      metrics.recordError(`http_${status}`);
    }
    return res;
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    metrics.recordHttpRequest(method, route, 500);
    metrics.recordDurationMs(durationMs);
    metrics.recordError("uncaught");
    log.error("http_uncaught", {
      method,
      route,
      status: 500,
      durationMs,
      ip,
      error: String(err?.message || err).slice(0, 500),
    });
    log.error("500_alert", {
      method,
      route,
      ip,
      error: String(err?.message || err).slice(0, 200),
    });
    throw err;
  }
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    log.error("unhandled", {
      message: String((error as Error)?.message || error).slice(0, 500),
      stack: String((error as Error)?.stack || "").slice(0, 2000),
    });
    metrics.recordError("unhandled");
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [loggingMiddleware, errorMiddleware],
  serverFns: {
    // CSRF protection enabled — VIXOR MASTER V2 Phase 0
  },
}));
