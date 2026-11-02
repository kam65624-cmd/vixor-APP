import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "@/shared/error-page";
import { attachSupabaseAuth } from "@/shared/supabase/auth-attacher";
import { log } from "@/shared/structured-logger";
import { metrics } from "@/shared/metrics-store";

import "@/shared/p1-bootstrap";

function safeRouteGroup(pathname: string): string {
  if (pathname === "/") return "/";
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment ? `/${firstSegment}` : "/";
}

function safeErrorCode(error: unknown): string {
  if (error instanceof TypeError && error.message.startsWith("object is not iterable")) {
    return "OBJECT_NOT_ITERABLE";
  }
  return "UNCLASSIFIED";
}

function safeErrorClass(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

// Structured request logging + metrics. Do not record IPs, user agents,
// query strings, request bodies, auth headers, raw messages, or stack traces.
const loggingMiddleware = createMiddleware().server(async ({ next, request }) => {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const method = request.method;
  const route = safeRouteGroup(url.pathname);

  try {
    const res = await next();
    const durationMs = Date.now() - startedAt;
    const status = res.response.status ?? 200;
    metrics.recordHttpRequest(method, route, status);
    metrics.recordDurationMs(durationMs);
    const fn = status >= 500 ? log.error : status >= 400 ? log.warn : log.info;
    fn("http", { method, route, status, durationMs });
    if (status === 404) log.warn("404", { method, route });
    if (status >= 500) {
      log.error("5xx", { status, method, route });
      metrics.recordError(`http_${status}`);
    }
    return res;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorClass = safeErrorClass(error);
    const errorCode = safeErrorCode(error);
    metrics.recordHttpRequest(method, route, 500);
    metrics.recordDurationMs(durationMs);
    metrics.recordError("uncaught");
    log.error("http_uncaught", {
      method,
      route,
      status: 500,
      durationMs,
      errorClass,
      errorCode,
    });
    log.error("500_alert", { status: 500, method, route, errorClass, errorCode });
    throw error;
  }
});

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof Response) throw error;
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    log.error("unhandled", {
      errorClass: safeErrorClass(error),
      errorCode: safeErrorCode(error),
    });
    metrics.recordError("unhandled");

    const url = new URL(request.url);
    const isApiRequest = url.pathname === "/api" || url.pathname.startsWith("/api/");
    const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
    const wantsJson = isApiRequest || !acceptsHtml;
    const body = request.method === "HEAD"
      ? null
      : wantsJson
        ? JSON.stringify({ error: "Internal Server Error" })
        : renderErrorPage();

    return new Response(body, {
      status: 500,
      headers: {
        "content-type": wantsJson ? "application/json; charset=utf-8" : "text/html; charset=utf-8",
      },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [loggingMiddleware, errorMiddleware],
  serverFns: {},
}));
