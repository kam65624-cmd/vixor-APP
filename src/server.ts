import "./shared/error-capture";

import { consumeLastCapturedError } from "./shared/error-capture";
import { renderErrorPage } from "./shared/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error("[Vixor Server Error]", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";

      // Show detailed error when VIXOR_DEBUG is set, generic page otherwise
      if (process.env.VIXOR_DEBUG) {
        const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Server Error</title><style>body{font:14px/1.5 monospace;background:#1a1a2e;color:#e0e0e0;padding:2rem;max-width:900px;margin:0 auto}h1{color:#ff6b6b;font-size:1.2rem}.stack{white-space:pre-wrap;background:#16213e;padding:1rem;border-radius:8px;overflow-x:auto;font-size:12px;color:#a8d8ea}</style></head><body><h1>Server Error (Debug)</h1><p>${errorMsg}</p><div class="stack">${errorStack || "No stack trace"}</div></body></html>`;
        return new Response(html, {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
