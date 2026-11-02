import "./shared/p1-bootstrap";

import { renderErrorPage } from "./shared/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

import * as serverEntryModule from "@tanstack/react-start/server-entry";
const serverEntry = (serverEntryModule as any).default ?? serverEntryModule;

async function normalizeCatastrophicSsrResponse(
  request: Request,
  response: Response,
  requestId: string,
): Promise<Response> {
  if (response.status < 500) return response;

  const url = new URL(request.url);
  const isApiRequest = url.pathname === "/api" || url.pathname.startsWith("/api/");
  const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;

  // Preserve API response contracts. Never rewrite JSON API errors into HTML.
  if (isApiRequest || !acceptsHtml) {
    console.error("[vixor.ssr] response_error", {
      requestId,
      method: request.method,
      path: url.pathname,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "unknown",
    });
    return withRequestId(response, requestId);
  }

  console.error("[vixor.ssr] page_response_error", {
    requestId,
    method: request.method,
    path: url.pathname,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "unknown",
  });

  return new Response(request.method === "HEAD" ? null : renderErrorPage(), {
    status: response.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-vixor-request-id": requestId,
    },
  });
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-vixor-request-id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const startedAt = Date.now();

    // Safe diagnostics only: no cookies, authorization, query strings, IPs,
    // user-agent, request body, environment values, or raw exception messages.
    console.info("[vixor.ssr] handleServerRoutes_boundary_start", {
      requestId,
      method: request.method,
      path: url.pathname,
    });

    try {
      const handler = serverEntry as ServerEntry;
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(request, response, requestId);

      console.info("[vixor.ssr] handleServerRoutes_boundary_complete", {
        requestId,
        method: request.method,
        path: url.pathname,
        status: normalized.status,
        durationMs: Date.now() - startedAt,
      });

      return withRequestId(normalized, requestId);
    } catch (error) {
      // Error message/stack may contain user data or secrets; log only the class.
      console.error("[vixor.ssr] handleServerRoutes_boundary_throw", {
        requestId,
        method: request.method,
        path: url.pathname,
        errorName: error instanceof Error ? error.name : typeof error,
        durationMs: Date.now() - startedAt,
      });

      return new Response(request.method === "HEAD" ? null : renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-vixor-request-id": requestId,
        },
      });
    }
  },
};
