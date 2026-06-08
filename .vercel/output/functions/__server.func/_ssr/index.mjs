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
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./server-YJcowFjo.mjs").then((n) => n.s).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
function renderDebugError(title, errorMsg, errorStack) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>body{font:14px/1.5 monospace;background:#1a1a2e;color:#e0e0e0;padding:2rem;max-width:900px;margin:0 auto}h1{color:#ff6b6b;font-size:1.2rem;margin-bottom:1rem}.info{background:#16213e;padding:0.75rem;border-radius:8px;margin-bottom:1rem;font-size:12px;color:#a8d8ea}.stack{white-space:pre-wrap;background:#0d1117;padding:1rem;border-radius:8px;overflow-x:auto;font-size:11px;color:#c9d1d9;border:1px solid #30363d}h2{color:#ffa657;font-size:1rem;margin-top:1.5rem;margin-bottom:0.5rem}</style></head><body><h1>${title}</h1><div class="info"><strong>Time:</strong> ${(/* @__PURE__ */ new Date()).toISOString()} | <strong>Node:</strong> ${typeof process !== "undefined" ? process.version : "unknown"} | <strong>ENV vars:</strong> SUPABASE_URL=${!!process.env.SUPABASE_URL} SUPABASE_PUBLISHABLE_KEY=${!!process.env.SUPABASE_PUBLISHABLE_KEY} SUPABASE_SERVICE_ROLE_KEY=${!!process.env.SUPABASE_SERVICE_ROLE_KEY} VITE_SUPABASE_URL=${!!process.env.VITE_SUPABASE_URL} GEMINI_API_KEY=${!!process.env.GEMINI_API_KEY}</div><h2>Error Message</h2><div class="stack">${errorMsg || "No error message"}</div><h2>Stack Trace</h2><div class="stack">${errorStack || "No stack trace available"}</div></body></html>`;
  return new Response(html, {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
async function normalizeCatastrophicSsrResponse(response) {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  console.error(`[Vixor] h3 500 response body: ${body.substring(0, 500)}`);
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    const captured2 = consumeLastCapturedError();
    const capturedMsg = captured2 instanceof Error ? captured2.message : captured2 ? String(captured2) : "";
    const capturedStack = captured2 instanceof Error ? captured2.stack : "";
    const combinedMsg = `${body}

Captured error: ${capturedMsg}`;
    return renderDebugError("Vixor Server Error (Non-h3 500)", combinedMsg, capturedStack);
  }
  const captured = consumeLastCapturedError();
  const errorMsg = captured instanceof Error ? captured.message : captured ? String(captured) : `h3 swallowed SSR error: ${body}`;
  const errorStack = captured instanceof Error ? captured.stack : "";
  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return renderDebugError("Vixor Server Error (h3 Swallowed)", errorMsg, errorStack);
}
const server = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log(`[Vixor] Request: ${url.pathname}${url.search}`);
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (response.status >= 500) {
        console.error(`[Vixor] 500 error on ${url.pathname}`);
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          return await normalizeCatastrophicSsrResponse(response);
        }
        const body = await response.clone().text();
        const captured = consumeLastCapturedError();
        const capturedMsg = captured instanceof Error ? captured.message : captured ? String(captured) : "";
        const capturedStack = captured instanceof Error ? captured.stack : "";
        return renderDebugError("Vixor Server Error (Non-JSON 500)", `${body}

Captured: ${capturedMsg}`, capturedStack);
      }
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";
      console.error("[Vixor] Fatal server error:", errorMsg, errorStack);
      return renderDebugError("Vixor Fatal Server Error", errorMsg, errorStack || "");
    }
  }
};
export {
  server as default
};
