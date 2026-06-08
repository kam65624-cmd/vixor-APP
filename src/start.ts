import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("[Vixor Server Error]", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    // In production, show generic error. In dev, show details.
    const isDev = process.env.NODE_ENV !== "production";
    const html = isDev
      ? `<!doctype html><html><head><meta charset="utf-8"><title>Server Error</title><style>body{font:14px/1.5 monospace;background:#1a1a2e;color:#e0e0e0;padding:2rem;max-width:900px;margin:0 auto}h1{color:#ff6b6b;font-size:1.2rem}.stack{white-space:pre-wrap;background:#16213e;padding:1rem;border-radius:8px;overflow-x:auto;font-size:12px;color:#a8d8ea}</style></head><body><h1>Server Error</h1><p>${errorMsg}</p><div class="stack">${errorStack || "No stack trace"}</div></body></html>`
      : renderErrorPage();
    return new Response(html, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
