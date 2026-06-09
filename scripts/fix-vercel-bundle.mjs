#!/usr/bin/env node
// ============================================================================
// fix-vercel-bundle.mjs — Post-build fix for Vercel serverless deployment
// ============================================================================
//
// ROOT CAUSE:
// Vite/Nitro code-splits the SSR bundle into separate chunk files in _ssr/
// (start-*.mjs, router-*.mjs, empty-plugin-adapters-*.mjs). Vercel's
// Node.js file tracer follows imports from the entry point, but since
// _ssr/index.mjs is loaded via a dynamic import from the main index.mjs,
// Vercel's tracer does NOT follow static imports WITHIN _ssr/index.mjs.
// This means the code-split chunk files are excluded from the deployment.
//
// FIX (3-pronged approach):
// 1. Add ALL _ssr chunk files to .vc-config.json "includeFiles" to force
//    Vercel to include them in the deployment regardless of tracing
// 2. Convert dynamic imports in _ssr/index.mjs to static imports so
//    Node.js can resolve them at runtime
// 3. Add static imports in main index.mjs as a belt-and-suspenders approach
// ============================================================================

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const FUNC_DIR = resolve(".vercel/output/functions/__server.func");
const SSR_DIR = join(FUNC_DIR, "_ssr");

// ── Step 1: Find all code-split chunks ──

function findChunks() {
  if (!existsSync(SSR_DIR)) {
    console.log("[fix-vercel] _ssr directory not found, skipping");
    return [];
  }
  const files = readdirSync(SSR_DIR);
  return files.filter(
    (f) =>
      /^(start|server|router|empty-plugin-adapters)-[A-Za-z0-9_-]+\.mjs$/.test(f),
  );
}

// ── Step 2: Add chunk files to .vc-config.json includeFiles ──
//
// This is the KEY fix. The .vc-config.json file tells Vercel which files
// to include in the serverless function deployment. By adding the _ssr
// chunk files to the "includeFiles" array, we force Vercel to include
// them regardless of what the file tracer determines.

function addToVcConfig(chunks) {
  const configPath = join(FUNC_DIR, ".vc-config.json");
  if (!existsSync(configPath)) {
    console.log("[fix-vercel] .vc-config.json not found, creating");
    const newConfig = {
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      runtime: "nodejs24.x",
      includeFiles: chunks.map((c) => `_ssr/${c}`),
    };
    writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");
    console.log(`[fix-vercel] Created .vc-config.json with ${chunks.length} includeFiles`);
    return;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (e) {
    console.error("[fix-vercel] Failed to parse .vc-config.json:", e);
    return;
  }

  // Add includeFiles
  const existingIncludes = config.includeFiles || [];
  const newIncludes = chunks
    .map((c) => `_ssr/${c}`)
    .filter((f) => !existingIncludes.includes(f));

  if (newIncludes.length === 0 && existingIncludes.length > 0) {
    console.log("[fix-vercel] .vc-config.json already has all chunk includeFiles");
    return;
  }

  config.includeFiles = [...existingIncludes, ...newIncludes];
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log(`[fix-vercel] Added ${newIncludes.length} files to .vc-config.json includeFiles (total: ${config.includeFiles.length})`);
}

// ── Step 3: Convert dynamic imports to static in _ssr/index.mjs ──

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

// ── Step 4: Add static imports to main index.mjs ──

function addStaticImportsToMainIndex(chunks) {
  const indexPath = join(FUNC_DIR, "index.mjs");
  if (!existsSync(indexPath)) {
    console.log("[fix-vercel] Main index.mjs not found, skipping");
    return;
  }

  let content = readFileSync(indexPath, "utf-8");

  if (content.includes("__vixor_ssr_chunks__")) {
    console.log("[fix-vercel] Main index.mjs already has static imports");
    return;
  }

  const importLines = chunks.map((chunk) => `import "./_ssr/${chunk}";`);
  const importBlock = [
    "// ── Vixor: Force Vercel to include _ssr chunks via static imports ──",
    "const __vixor_ssr_chunks__ = true;",
    ...importLines,
  ].join("\n");

  const lines = content.split("\n");
  lines.splice(1, 0, "", importBlock);
  content = lines.join("\n");

  writeFileSync(indexPath, content, "utf-8");
  console.log(`[fix-vercel] Added ${chunks.length} static imports to main index.mjs`);
}

// ── Step 5: Verify all chunks exist ──

function verifySsrFiles(chunks) {
  console.log(`[fix-vercel] Verifying _ssr/ directory...`);
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

// ── Step 6: Patch Nitro error handler for better debug info ──

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

addToVcConfig(chunks);
fixSsrIndex(chunks);
addStaticImportsToMainIndex(chunks);
verifySsrFiles(chunks);
fixNitroErrorHandler();

console.log("[fix-vercel] Done ✓");
