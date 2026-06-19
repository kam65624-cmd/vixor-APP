#!/usr/bin/env node
// ============================================================================
// fix-vercel-bundle.mjs — Post-build fix for Vercel serverless deployment
// ============================================================================
//
// ROOT CAUSE:
// Vite/Nitro code-splits the SSR bundle into chunk files in _ssr/.
// Vercel's @vercel/nft file tracer traces static imports and dynamic import()
// with static string literals from the ENTRY POINT only. Since _ssr/index.mjs
// is loaded via lazyService(() => import("./_ssr/index.mjs")), @vercel/nft
// includes _ssr/index.mjs but does NOT recursively trace its static imports
// to find the code-split chunks.
//
// FIX:
// Add dynamic import() calls for the _ssr chunks in the MAIN index.mjs
// entry point. @vercel/nft DOES trace dynamic import() with static string
// literals from the entry point. These are wrapped in a Promise.allSettled()
// so they don't block or crash the function.
//
// IMPORTANT: Do NOT convert dynamic imports to static imports inside
// _ssr/index.mjs. The chunks (e.g. start-*.mjs) import from index.mjs,
// creating a circular dependency. Dynamic imports break the cycle by deferring
// evaluation. Converting to static imports causes ESM live bindings to resolve
// as undefined during the first pass, causing "createMiddleware is not a function".
// ============================================================================

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { resolve, join } from "path";

const FUNC_DIR = resolve(".vercel/output/functions/__server.func");
const SSR_DIR = join(FUNC_DIR, "_ssr");

function findChunks() {
  if (!existsSync(SSR_DIR)) return [];
  const files = readdirSync(SSR_DIR);
  return files.filter(
    (f) => /^(start|server|router|empty-plugin-adapters)-[A-Za-z0-9_-]+\.mjs$/.test(f),
  );
}

// ── Step 1: Add dynamic import() for chunks in main index.mjs ──
// @vercel/nft traces dynamic import() with static string paths from the
// entry point. This forces the chunk files to be included in the deployment.
// We use Promise.allSettled() so failures don't crash the function.

function addNftTraceableImports(chunks) {
  const indexPath = join(FUNC_DIR, "index.mjs");
  if (!existsSync(indexPath)) return;

  let content = readFileSync(indexPath, "utf-8");

  if (content.includes("__vixor_nft_trace__")) {
    console.log("[fix-vercel] Main index.mjs already has NFT-traceable imports");
    return;
  }

  // Build the traceable import block
  const importCalls = chunks.map(
    (chunk) => `import("./_ssr/${chunk}")`
  );

  const traceBlock = [
    "// ── Vixor: @vercel/nft traceable imports for _ssr chunks ──",
    "// @vercel/nft traces dynamic import() with static string paths from the",
    "// entry point. This ensures code-split chunks are included in deployment.",
    "// Promise.allSettled() prevents circular dep or load-order issues.",
    "const __vixor_nft_trace__ = Promise.allSettled([",
    ...importCalls.map((call) => `  ${call},`),
    "]);",
  ].join("\n");

  // Insert after the first line
  const lines = content.split("\n");
  lines.splice(1, 0, "", traceBlock);
  content = lines.join("\n");

  writeFileSync(indexPath, content, "utf-8");
  console.log(`[fix-vercel] Added ${chunks.length} @vercel/nft-traceable imports to main index.mjs`);
}

function verifySsrFiles(chunks) {
  console.log(`[fix-vercel] Verifying _ssr/ directory...`);
  for (const chunk of chunks) {
    const chunkPath = join(SSR_DIR, chunk);
    if (existsSync(chunkPath)) {
      console.log(`[fix-vercel]   ✅ ${chunk} (${(readFileSync(chunkPath).length / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`[fix-vercel]   ❌ ${chunk} MISSING!`);
    }
  }
}

function fixNitroErrorHandler() {
  const indexPath = join(FUNC_DIR, "index.mjs");
  if (!existsSync(indexPath)) return;
  let content = readFileSync(indexPath, "utf-8");
  if (content.includes("__vixor_error_handler__")) return;

  const marker = "const errorHandlers = [errorHandler$1];";
  if (!content.includes(marker)) return;

  // Production-safe error handler: shows generic error page without
  // exposing stack traces, env vars, or internal details.
  // In development, the original Nitro handler provides full debug info.
  const wrapperCode = [
    "function __vixor_error_handler__(error, event) {",
    "  try {",
    "    // In development, fall through to original Nitro handler for full debug info",
    "    if (process.env.NODE_ENV === 'development') return null;",
    "    // Production: return generic error page — no stack traces, no env vars",
    "    const status = (error && (error.statusCode || error.status)) || 500;",
    "    const html = '<!doctype html><html><head><meta charset=utf-8><title>Vixor</title>' +",
    "      '<style>body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}' +",
    "      '.c{text-align:center;padding:2rem}' +",
    "      'h1{color:#ff6b6b;font-size:1.2rem;margin-bottom:.5rem}' +",
    "      'p{color:#8b92a5;font-size:.9rem}' +",
    "      'a{color:#FFB800;text-decoration:none}' +",
    "      '</style></head>' +",
    "      '<body><div class=c>' +",
    "      '<h1>Something went wrong</h1>' +",
    "      '<p>An unexpected error occurred. Please try again.</p>' +",
    "      '<a href=/>Go to Dashboard</a>' +",
    "      '</div></body></html>';",
    "    return new NodeResponse(html, { status, headers: new Headers({'content-type':'text/html; charset=utf-8'}) });",
    "  } catch(e) {",
    "    return null;",
    "  }",
    "}",
  ].join("\n");

  content = content.replace(marker, wrapperCode + "\nconst errorHandlers = [__vixor_error_handler__, errorHandler$1];");
  writeFileSync(indexPath, content, "utf-8");
  console.log("[fix-vercel] Patched index.mjs - added production-safe error handler");
}

// ── Step 3: REMOVED — API route interception ──
// PREVIOUSLY: This function intercepted ALL /api/* requests and returned
// static JSON stubs, effectively disabling all backend functionality.
// This was the #1 critical bug: cron jobs, alerts, signals, and webhooks
// were all silently killed by this interceptor.
//
// The real API routes are handled by Nitro/h3 event handlers defined in:
//   server/api/check-alerts.ts
//   server/api/generate-signals.ts
//   server/api/telegram-webhook.ts
//   server/api/migrate.ts
//
// These routes are automatically discovered by Nitro and should be routed
// correctly WITHOUT any interception. If /api/* routes return 404 after
// this removal, the issue is in Nitro's route discovery config, not here.
//
// REMOVED: addApiRouteInterception() — 2026-06-11 VIXOR MASTER V2 Phase 0

// ── Main ──
console.log("[fix-vercel] Running post-build fixes...");
const chunks = findChunks();
console.log(`[fix-vercel] Found ${chunks.length} code-split chunks: ${chunks.join(", ")}`);
addNftTraceableImports(chunks);
verifySsrFiles(chunks);
fixNitroErrorHandler();
// NOTE: removeApiRouteInterception() removed — it was hanging on Vercel's
// build VM after the fixNitroErrorHandler() step, even though locally it
// completes in <50ms. The markers it was supposed to remove don't exist
// in the current index.mjs anyway (they were stripped in Phase 0 commit
// 217d117). The function definition is kept above for historical reference
// but is no longer called.
console.log("[fix-vercel] Done ✓");
