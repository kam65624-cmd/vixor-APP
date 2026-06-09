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
  // Always log the full error body for debugging (remove after fixing the 500)
  console.error(`[Vixor] 500 JSON response body: ${body.substring(0, 2000)}`);

  // Also try to recover from h3-swallowed errors
  const captured = consumeLastCapturedError();
  if (captured) {
    console.error("[Vixor] Captured SSR error:", captured);
  }

  // For ANY 500 JSON response, try to show the error instead of generic page
  try {
    const parsed = JSON.parse(body);
    const errorMsg = parsed.message || parsed.error || body;
    const html = renderDebugErrorPage(errorMsg, captured?.stack);
    return new Response(html, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    // Not valid JSON, fall through
  }

  if (captured) {
    const html = renderDebugErrorPage(captured.message || String(captured), captured.stack);
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

function renderDebugErrorPage(message: string, stack?: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Vixor — Server Error</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 13px/1.6 'SF Mono', 'Fira Code', monospace; background: #0a0a0f; color: #e0e0e0; padding: 2rem; max-width: 900px; margin: 0 auto; }
      h1 { color: #ff6b6b; font-size: 1.1rem; margin-bottom: 0.5rem; }
      .msg { background: #1a1a2e; padding: 1rem; border-radius: 8px; border-left: 3px solid #ff6b6b; margin-bottom: 1rem; }
      .stack { white-space: pre-wrap; background: #16213e; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 11px; color: #a8d8ea; max-height: 400px; overflow-y: auto; }
      .env-info { background: #16213e; padding: 0.75rem; border-radius: 8px; font-size: 11px; color: #888; margin-top: 1rem; }
    </style>
  </head>
  <body>
    <h1>Vixor Server Error</h1>
    <div class="msg">${message}</div>
    ${stack ? `<details><summary>Stack Trace</summary><div class="stack">${stack}</div></details>` : ""}
    <div class="env-info">
      Node: ${typeof process !== 'undefined' ? process.version : 'N/A'} |
      SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ set' : '❌ missing'} |
      SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ set' : '❌ missing'} |
      TWELVEDATA_API_KEY: ${process.env.TWELVEDATA_API_KEY ? '✅ set' : '❌ missing'} |
      FINNHUB_API_KEY: ${process.env.FINNHUB_API_KEY ? '✅ set' : '❌ missing'}
    </div>
  </body>
</html>`;
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

      // Always show detailed error for debugging (change back to generic after fixing)
      const html = renderDebugErrorPage(errorMsg, errorStack);
      return new Response(html, {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
