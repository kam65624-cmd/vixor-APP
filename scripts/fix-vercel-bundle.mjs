#!/usr/bin/env node
// ============================================================================
// fix-vercel-bundle.mjs — Post-build fix for Vercel serverless deployment
// ============================================================================
//
// PROBLEM: Nitro 3 beta code-splits the SSR server entry into a separate chunk
// (e.g., _ssr/server-ywbAJf4M.mjs), but Vercel's serverless runtime doesn't
// include dynamically-imported chunks that aren't in the static dependency graph.
// This causes ERR_MODULE_NOT_FOUND at runtime.
//
// FIX: Replace the dynamic import() with a static namespace import, so the
// chunk is resolved at module load time rather than lazily.
// ============================================================================

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, join } from "path";

const SSR_DIR = resolve(".vercel/output/functions/__server.func/_ssr");

function findServerChunk() {
  const files = readdirSync(SSR_DIR);
  const serverChunk = files.find((f) => /^server-[A-Za-z0-9_-]+\.mjs$/.test(f));
  if (!serverChunk) {
    console.log("[fix-vercel] No server-*.mjs chunk found — nothing to fix (already inlined?)");
    return null;
  }
  return serverChunk;
}

function fixIndexFile(serverChunkName) {
  const indexPath = join(SSR_DIR, "index.mjs");
  let indexContent;

  try {
    indexContent = readFileSync(indexPath, "utf-8");
  } catch {
    console.warn("[fix-vercel] Could not read _ssr/index.mjs — skipping fix");
    return false;
  }

  // Check if the dynamic import of the server chunk exists
  const dynamicImportCall = `import("./${serverChunkName}")`;
  if (!indexContent.includes(dynamicImportCall)) {
    console.log(`[fix-vercel] No dynamic import of ${serverChunkName} found — already fixed?`);
    return false;
  }

  console.log(`[fix-vercel] Found dynamic import: ${dynamicImportCall}`);

  // The original code is:
  //   serverEntryPromise = import("./server-HASH.mjs").then((n) => n.s).then(
  //     (m) => m.default ?? m
  //   );
  //
  // The server chunk exports: { server as s, TSS_SERVER_FUNCTION as T, ... }
  // And has Object.defineProperty for default export.
  //
  // Using namespace import: import * as __vixor_se__ from "./server-HASH.mjs"
  // This gives us __vixor_se__.s (which is the server object) and __vixor_se__.default
  //
  // Then replace import("./server-HASH.mjs") with Promise.resolve(__vixor_se__)
  // The .then((n) => n.s) chain still works because __vixor_se__.s exists.

  const staticImportName = `__vixor_se__`;
  const staticImportLine = `import * as ${staticImportName} from "./${serverChunkName}";\n`;

  // Add static import at the very beginning
  indexContent = staticImportLine + indexContent;

  // Replace ONLY the dynamic import() call, preserving the .then() chain
  indexContent = indexContent.replace(
    dynamicImportCall,
    `Promise.resolve(${staticImportName})`
  );

  writeFileSync(indexPath, indexContent, "utf-8");
  console.log("[fix-vercel] ✅ Patched _ssr/index.mjs — replaced dynamic import with static namespace import");
  return true;
}

// Main
console.log("[fix-vercel] Running post-build fix for Vercel serverless deployment...");
const serverChunk = findServerChunk();
if (serverChunk) {
  const success = fixIndexFile(serverChunk);
  if (success) {
    console.log("[fix-vercel] ✅ Fix applied — server chunk will be available at runtime");
  } else {
    console.warn("[fix-vercel] ⚠️ Fix could not be applied — deployment may fail");
  }
} else {
  console.log("[fix-vercel] No fix needed");
}
