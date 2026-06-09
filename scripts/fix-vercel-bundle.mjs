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
// 1. Add dynamic import() calls for the _ssr chunks in the MAIN index.mjs
//    entry point. @vercel/nft DOES trace dynamic import() with static string
//    literals from the entry point. These are wrapped in a Promise.allSettled()
//    so they don't block or crash the function.
// 2. Convert dynamic import() in _ssr/index.mjs to static imports so
//    Node.js resolves them synchronously at module load time.
// ============================================================================

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
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

// ── Step 2: Convert dynamic imports to static in _ssr/index.mjs ──

function fixSsrIndex(chunks) {
  const indexPath = join(SSR_DIR, "index.mjs");
  if (!existsSync(indexPath)) return;

  let content = readFileSync(indexPath, "utf-8");
  let patchCount = 0;
  const staticImports = [];

  for (const chunkName of chunks) {
    const dynamicImportCall = `import("./${chunkName}")`;
    if (!content.includes(dynamicImportCall)) continue;

    const varName = "__vixor_" + chunkName.replace(/[^A-Za-z0-9]/g, "_") + "__";
    staticImports.push(`import * as ${varName} from "./${chunkName}";`);
    content = content.replace(dynamicImportCall, `Promise.resolve(${varName})`);
    patchCount++;
    console.log(`[fix-vercel] Patched _ssr/index.mjs - static import for ${chunkName}`);
  }

  if (patchCount > 0) {
    content = staticImports.join("\n") + "\n" + content;
    writeFileSync(indexPath, content, "utf-8");
    console.log(`[fix-vercel] Total: ${patchCount} chunks patched in _ssr/index.mjs`);
  }
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

// ── Main ──
console.log("[fix-vercel] Running post-build fixes...");
const chunks = findChunks();
console.log(`[fix-vercel] Found ${chunks.length} code-split chunks: ${chunks.join(", ")}`);
addNftTraceableImports(chunks);
fixSsrIndex(chunks);
verifySsrFiles(chunks);
fixNitroErrorHandler();
console.log("[fix-vercel] Done ✓");
