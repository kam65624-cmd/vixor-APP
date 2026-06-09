let lastCapturedError;
const TTL_MS = 5e3;
function record(error) {
  lastCapturedError = { error, at: Date.now() };
}
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record(event.error ?? event));
  globalThis.addEventListener(
    "unhandledrejection",
    (event) => record(event.reason)
  );
}
function consumeLastCapturedError() {
  if (!lastCapturedError) return void 0;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = void 0;
    return void 0;
  }
  const { error } = lastCapturedError;
  lastCapturedError = void 0;
  return error;
}
function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./server-ywbAJf4M.mjs").then((n) => n.s).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  console.error(`[Vixor] 500 JSON response body: ${body.substring(0, 2e3)}`);
  const captured = consumeLastCapturedError();
  if (captured) {
    console.error("[Vixor] Captured SSR error:", captured);
  }
  try {
    const parsed = JSON.parse(body);
    const errorMsg = parsed.message || parsed.error || body;
    const html = renderDebugErrorPage(errorMsg, captured?.stack);
    return new Response(html, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  } catch {
  }
  if (captured) {
    const html = renderDebugErrorPage(captured.message || String(captured), captured.stack);
    return new Response(html, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
function renderDebugErrorPage(message, stack) {
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
      Node: ${typeof process !== "undefined" ? process.version : "N/A"} |
      SUPABASE_URL: ${process.env.SUPABASE_URL ? "✅ set" : "❌ missing"} |
      SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? "✅ set" : "❌ missing"} |
      TWELVEDATA_API_KEY: ${process.env.TWELVEDATA_API_KEY ? "✅ set" : "❌ missing"} |
      FINNHUB_API_KEY: ${process.env.FINNHUB_API_KEY ? "✅ set" : "❌ missing"}
    </div>
  </body>
</html>`;
}
const server = {
  async fetch(request, env, ctx) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error("[Vixor Server Error]", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";
      const html = renderDebugErrorPage(errorMsg, errorStack);
      return new Response(html, {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }
  }
};
export {
  server as default
};
