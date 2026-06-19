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
  if (content.includes("__vixor_debug__")) return;

  const marker = "const errorHandlers = [errorHandler$1];";
  if (!content.includes(marker)) return;

  const wrapperCode = [
    "function __vixor_debug__(error, event) {",
    "  try {",
    "    const unhandled = error.unhandled ?? !(error && (error.statusCode || error.status));",
    "    const status = unhandled ? 500 : (error.statusCode || error.status || 500);",
    "    const parts = [];",
    "    parts.push('Type: ' + (error && error.constructor ? error.constructor.name : typeof error));",
    "    if (error instanceof Error) parts.push('Message: ' + error.message);",
    "    else parts.push('Value: ' + String(error));",
    "    if (error && error.statusCode) parts.push('Status: ' + error.statusCode);",
    "    if (error && error.statusMessage) parts.push('StatusText: ' + error.statusMessage);",
    "    if (error && error.data) parts.push('Data: ' + JSON.stringify(error.data));",
    "    if (error && error.path) parts.push('Path: ' + error.path);",
    "    const errStack = (error instanceof Error ? error.stack : '') || '';",
    "    const su = process.env.SUPABASE_URL ? 'set' : 'missing';",
    "    const sk = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) ? 'set' : 'missing';",
    "    const safeMsg = parts.join('<br>').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');",
    "    const safeStack = errStack.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');",
    "    const html = '<!doctype html><html><head><meta charset=utf-8><title>Vixor Error</title>' +",
    "      '<style>body{font:13px/1.5 monospace;background:#0a0a0f;color:#e0e0e0;padding:2rem;max-width:900px;margin:0 auto}' +",
    "      'h1{color:#ff6b6b;font-size:1.1rem}.msg{background:#1a1a2e;padding:1rem;border-radius:8px;border-left:3px solid #ff6b6b;margin-bottom:1rem;word-break:break-word}' +",
    "      '.stk{white-space:pre-wrap;background:#16213e;padding:1rem;border-radius:8px;font-size:11px;color:#a8d8ea;max-height:400px;overflow:auto}' +",
    "      '.env{background:#16213e;padding:.75rem;border-radius:8px;font-size:11px;color:#888;margin-top:1rem}</style></head>' +",
    "      '<body><h1>Vixor Server Error</h1><div class=msg>' + safeMsg + '</div>' +",
    "      (safeStack ? '<details><summary>Stack</summary><div class=stk>' + safeStack + '</div></details>' : '') +",
    "      '<div class=env>Node:' + process.version + ' | SUPABASE_URL:' + su + ' | ANON_KEY:' + sk + '</div></body></html>';",
    "    return new NodeResponse(html, { status, headers: new Headers({'content-type':'text/html; charset=utf-8'}) });",
    "  } catch(e) {",
    "    console.error('[vixor debug handler error]', e);",
    "    return null;",
    "  }",
    "}",
  ].join("\n");

  content = content.replace(marker, wrapperCode + "\nconst errorHandlers = [__vixor_debug__, errorHandler$1];");
  writeFileSync(indexPath, content, "utf-8");
  console.log("[fix-vercel] Patched index.mjs - added debug error handler");
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

function removeApiRouteInterception() {
  const indexPath = join(FUNC_DIR, "index.mjs");
  if (!existsSync(indexPath)) {
    console.log("[fix-vercel] index.mjs not found, skipping API interception removal");
    return;
  }

  let content = readFileSync(indexPath, "utf-8");

  // Fast pre-check: if NONE of the markers exist, skip entirely.
  // Avoids any regex work on a 295KB file when nothing needs to be removed.
  if (!content.includes("__vixor_api__") &&
      !content.includes("async fetch(req, context)")) {
    console.log("[fix-vercel] No API route interception found (already clean)");
    return;
  }

  let modified = false;

  // Remove the __vixor_api__ function definition using bracket-matching
  // (NOT regex — regex with [\s\S]*? on a 295KB file causes catastrophic
  // backtracking on Vercel's slower single-core build VMs, hanging the build
  // after "[fix-vercel] Patched index.mjs - added debug error handler").
  if (content.includes("__vixor_api__")) {
    const startMarker = "// ── Vixor: API Route Interception ──";
    const startIdx = content.indexOf(startMarker);
    if (startIdx !== -1) {
      // Find the function opening brace after the marker
      const braceIdx = content.indexOf("{", startIdx);
      if (braceIdx !== -1) {
        // Walk the string, matching braces, to find the function's closing brace
        let depth = 1;
        let i = braceIdx + 1;
        const len = content.length;
        while (i < len && depth > 0) {
          const ch = content[i];
          if (ch === "{") depth++;
          else if (ch === "}") depth--;
          i++;
        }
        if (depth === 0) {
          // Include the trailing newline if present
          let endIdx = i;
          if (content[endIdx] === "\n") endIdx++;
          content = content.slice(0, startIdx) +
            "// [REMOVED] API route interception — VIXOR MASTER V2 Phase 0\n" +
            content.slice(endIdx);
          modified = true;
          console.log("[fix-vercel] Removed __vixor_api__ function from index.mjs");
        }
      }
    }
  }

  // Remove the API interception call in fetch() — string replacement, no regex
  const apiCallMarker = "const apiResponse = __vixor_api__(req);";
  const apiCallIdx = content.indexOf(apiCallMarker);
  if (apiCallIdx !== -1) {
    // Find the end of "if (apiResponse) return apiResponse;\n"
    const ifMarker = "if (apiResponse) return apiResponse;";
    const ifIdx = content.indexOf(ifMarker, apiCallIdx);
    if (ifIdx !== -1) {
      let endIdx = ifIdx + ifMarker.length;
      if (content[endIdx] === "\n") endIdx++;
      // Also strip leading whitespace/newline before apiCallMarker
      let startIdx = apiCallIdx;
      while (startIdx > 0 && (content[startIdx - 1] === " " || content[startIdx - 1] === "\t")) {
        startIdx--;
      }
      if (content[startIdx - 1] === "\n") startIdx--;
      content = content.slice(0, startIdx) + "\n" + content.slice(endIdx);
      modified = true;
      console.log("[fix-vercel] Removed API interception call from fetch()");
    }
  }

  // Revert async fetch back to sync — simple string replacement
  if (content.includes("async fetch(req, context)")) {
    content = content.split("async fetch(req, context)").join("fetch(req, context)");
    modified = true;
    console.log("[fix-vercel] Reverted fetch() from async to sync");
  }

  if (modified) {
    writeFileSync(indexPath, content, "utf-8");
    console.log("[fix-vercel] API route interception CLEANED from index.mjs");
  }
}

// ── Main ──
console.log("[fix-vercel] Running post-build fixes...");
const chunks = findChunks();
console.log(`[fix-vercel] Found ${chunks.length} code-split chunks: ${chunks.join(", ")}`);
addNftTraceableImports(chunks);
verifySsrFiles(chunks);
fixNitroErrorHandler();
removeApiRouteInterception();
console.log("[fix-vercel] Done ✓");
