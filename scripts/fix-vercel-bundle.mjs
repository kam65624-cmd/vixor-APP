#!/usr/bin/env node
// ============================================================================
// fix-vercel-bundle.mjs — Post-build fix for Vercel serverless deployment
// ============================================================================
//
// Vite/Nitro code-splits the SSR bundle into separate chunks (start-*.mjs,
// server-*.mjs, router-*.mjs, etc.) but Vercel's serverless runtime can't
// resolve these dynamic imports at runtime, causing ERR_MODULE_NOT_FOUND.
//
// Root cause: Vercel's Node.js runtime only includes files that are statically
// importable from the entry point. Dynamic import() targets are NOT traced
// by Vercel's file tracer, so they get excluded from the deployment.
//
// This script:
//   1. Finds ALL dynamically imported chunks in _ssr/index.mjs
//   2. Converts them to static imports at the top of the file
//   3. Replaces the dynamic import() calls with Promise.resolve()
//   4. Patches the Nitro error handler for better debug info
// ============================================================================

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const FUNC_DIR = resolve(".vercel/output/functions/__server.func");
const SSR_DIR = join(FUNC_DIR, "_ssr");

// ── Step 1: Find all code-split chunks that need static imports ──

function findChunks() {
  if (!existsSync(SSR_DIR)) {
    console.log("[fix-vercel] _ssr directory not found, skipping");
    return [];
  }
  const files = readdirSync(SSR_DIR);
  // Match all hash-named chunks that are dynamically imported:
  // start-*, server-*, router-*, empty-plugin-adapters-*
  return files.filter(
    (f) =>
      /^(start|server|router|empty-plugin-adapters)-[A-Za-z0-9_-]+\.mjs$/.test(f),
  );
}

// ── Step 2: Patch _ssr/index.mjs — convert dynamic imports to static ──
//
// Vercel's file tracer only follows static imports. By converting
// import("./chunk.mjs") → static import at top + Promise.resolve(var),
// we ensure the chunk is included in the deployment AND available at runtime.

function fixSsrIndex(chunks) {
  const indexPath = join(SSR_DIR, "index.mjs");
  if (!existsSync(indexPath)) {
    console.log("[fix-vercel] _ssr/index.mjs not found, skipping");
    return;
  }

  let content = readFileSync(indexPath, "utf-8");
  let patchCount = 0;

  const staticImports = [];

  for (const chunkName of chunks) {
    const dynamicImportCall = `import("./${chunkName}")`;

    if (!content.includes(dynamicImportCall)) {
      console.log(`[fix-vercel] No dynamic import for ${chunkName}, skipping`);
      continue;
    }

    // Create a unique variable name from the chunk name
    const varName = "__vixor_" + chunkName.replace(/[^A-Za-z0-9]/g, "_") + "__";

    // Collect static imports (we'll add them all at once at the top)
    staticImports.push(`import * as ${varName} from "./${chunkName}";`);

    // Replace dynamic import with resolved promise
    content = content.replace(dynamicImportCall, `Promise.resolve(${varName})`);

    patchCount++;
    console.log(`[fix-vercel] Patched _ssr/index.mjs - static import for ${chunkName}`);
  }

  if (patchCount > 0) {
    // Add all static imports at the very top of the file
    content = staticImports.join("\n") + "\n" + content;
    writeFileSync(indexPath, content, "utf-8");
    console.log(`[fix-vercel] Total: ${patchCount} chunks patched in _ssr/index.mjs`);
  } else {
    console.log("[fix-vercel] No dynamic imports needed patching");
  }
}

// ── Step 3: Ensure _ssr chunks are included in the Vercel output ──
// The _ssr/ directory should already be in the function output, but we verify
// and log what's there for debugging purposes.

function verifySsrFiles(chunks) {
  console.log(`[fix-vercel] Verifying _ssr/ directory has ${chunks.length} required chunks...`);
  for (const chunk of chunks) {
    const chunkPath = join(SSR_DIR, chunk);
    if (existsSync(chunkPath)) {
      const size = readFileSync(chunkPath).length;
      console.log(`[fix-vercel]   ✅ ${chunk} (${(size / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`[fix-vercel]   ❌ ${chunk} MISSING!`);
    }
  }
}

// ── Step 4: Patch Nitro error handler for better debug info ──

function fixNitroErrorHandler() {
  const indexPath = join(FUNC_DIR, "index.mjs");
  if (!existsSync(indexPath)) {
    console.log("[fix-vercel] Main index.mjs not found for error handler patch");
    return;
  }

  let content = readFileSync(indexPath, "utf-8");

  if (content.includes("__vixor_debug__")) {
    console.log("[fix-vercel] Nitro error handler already patched");
    return;
  }

  const marker = "const errorHandlers = [errorHandler$1];";
  if (!content.includes(marker)) {
    console.log("[fix-vercel] WARNING: Could not find errorHandlers marker");
    return;
  }

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

  content = content.replace(
    marker,
    wrapperCode + "\nconst errorHandlers = [__vixor_debug__, errorHandler$1];"
  );

  writeFileSync(indexPath, content, "utf-8");
  console.log("[fix-vercel] Patched index.mjs - added debug error handler");
}

// ── Main ──

console.log("[fix-vercel] Running post-build fixes...");

const chunks = findChunks();
console.log(`[fix-vercel] Found ${chunks.length} code-split chunks: ${chunks.join(", ")}`);

fixSsrIndex(chunks);
verifySsrFiles(chunks);
fixNitroErrorHandler();

console.log("[fix-vercel] Done ✓");
