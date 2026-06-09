#!/usr/bin/env node
// ============================================================================
// fix-vercel-bundle.mjs — Post-build fix for Vercel serverless deployment
// ============================================================================

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

const FUNC_DIR = resolve(".vercel/output/functions/__server.func");
const SSR_DIR = join(FUNC_DIR, "_ssr");

function findServerChunk() {
  const files = readdirSync(SSR_DIR);
  return files.find((f) => /^server-[A-Za-z0-9_-]+\.mjs$/.test(f)) || null;
}

function fixSsrIndex(serverChunkName) {
  const indexPath = join(SSR_DIR, "index.mjs");
  let content = readFileSync(indexPath, "utf-8");
  const dynamicImportCall = "import(\"./" + serverChunkName + "\")";
  if (!content.includes(dynamicImportCall)) {
    console.log("[fix-vercel] SSR index: no dynamic import found, skipping");
    return;
  }
  const varName = "__vixor_se__";
  content = "import * as " + varName + " from \"./" + serverChunkName + "\";\n" + content;
  content = content.replace(dynamicImportCall, "Promise.resolve(" + varName + ")");
  writeFileSync(indexPath, content, "utf-8");
  console.log("[fix-vercel] Patched _ssr/index.mjs - static import for " + serverChunkName);
}

function fixNitroErrorHandler() {
  const indexPath = join(FUNC_DIR, "index.mjs");
  let content = readFileSync(indexPath, "utf-8");

  if (content.includes("__vixor_debug__")) {
    console.log("[fix-vercel] Nitro error handler already patched");
    return;
  }

  // Find the defaultHandler function and replace it
  // We need to find the exact string from the built output.
  // The key change: for unhandled 500 errors, return HTML debug page
  // instead of generic JSON.

  const marker = "const errorHandlers = [errorHandler$1];";

  if (!content.includes(marker)) {
    console.log("[fix-vercel] WARNING: Could not find errorHandlers marker");
    return;
  }

  // Insert a wrapper that intercepts 500 errors before the default handler
  const wrapperCode = [
    "function __vixor_debug__(error, event) {",
    "  const unhandled = error.unhandled ?? !(error && (error.statusCode || error.status));",
    "  if (!unhandled && (error.statusCode || error.status || 999) < 500) return null;",
    "  const status = unhandled ? 500 : (error.statusCode || error.status || 500);",
    "  const errMsg = (error instanceof Error ? error.message : String(error || 'Unknown error'));",
    "  const errStack = (error instanceof Error ? error.stack : '') || '';",
    "  const su = process.env.SUPABASE_URL ? 'set' : 'missing';",
    "  const sk = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) ? 'set' : 'missing';",
    "  const safeMsg = errMsg.replace(/&/g,'&amp;').replace(/</g,'&lt;');",
    "  const safeStack = errStack.replace(/&/g,'&amp;').replace(/</g,'&lt;');",
    "  const html = '<!doctype html><html><head><meta charset=utf-8><title>Vixor Error</title>' +",
    "    '<style>body{font:13px/1.5 monospace;background:#0a0a0f;color:#e0e0e0;padding:2rem;max-width:900px;margin:0 auto}' +",
    "    'h1{color:#ff6b6b;font-size:1.1rem}.msg{background:#1a1a2e;padding:1rem;border-radius:8px;border-left:3px solid #ff6b6b;margin-bottom:1rem;word-break:break-word}' +",
    "    '.stk{white-space:pre-wrap;background:#16213e;padding:1rem;border-radius:8px;font-size:11px;color:#a8d8ea;max-height:400px;overflow:auto}' +",
    "    '.env{background:#16213e;padding:.75rem;border-radius:8px;font-size:11px;color:#888;margin-top:1rem}</style></head>' +",
    "    '<body><h1>Vixor Server Error</h1><div class=msg>' + safeMsg + '</div>' +",
    "    (safeStack ? '<details><summary>Stack</summary><div class=stk>' + safeStack + '</div></details>' : '') +",
    "    '<div class=env>Node:' + process.version + ' | SUPABASE_URL:' + su + ' | ANON_KEY:' + sk + '</div></body></html>';",
    "  return new NodeResponse(html, { status, headers: new Headers({'content-type':'text/html; charset=utf-8'}) });",
    "}",
  ].join("\n");

  content = content.replace(
    marker,
    wrapperCode + "\nconst errorHandlers = [__vixor_debug__, errorHandler$1];"
  );

  writeFileSync(indexPath, content, "utf-8");
  console.log("[fix-vercel] Patched index.mjs - added debug error handler");
}

// Main
console.log("[fix-vercel] Running post-build fixes...");
const serverChunk = findServerChunk();
if (serverChunk) {
  fixSsrIndex(serverChunk);
} else {
  console.log("[fix-vercel] No server chunk found");
}
fixNitroErrorHandler();
console.log("[fix-vercel] Done");
