#!/usr/bin/env node
// Vercel NFT tracing only. Error handling and request diagnostics live in src/server.ts.
// This script adds unreachable literal dynamic imports so @vercel/nft can discover
// every SSR chunk without eagerly evaluating those chunks at runtime.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const functionDir = resolve(".vercel/output/functions/__server.func");
const ssrDir = join(functionDir, "_ssr");
const entryPath = join(functionDir, "index.mjs");

if (!existsSync(entryPath)) {
  throw new Error("[vercel-nft] Missing serverless entry: .vercel/output/functions/__server.func/index.mjs");
}

if (!existsSync(ssrDir)) {
  throw new Error("[vercel-nft] Missing SSR chunk directory: .vercel/output/functions/__server.func/_ssr");
}

const chunks = readdirSync(ssrDir)
  .filter((file) => /^(start|server|router|empty-plugin-adapters)-[A-Za-z0-9_-]+\\.mjs$/.test(file))
  .sort();

if (chunks.length === 0) {
  throw new Error("[vercel-nft] No expected SSR chunks found; refusing to produce an unverifiable bundle");
}

let source = readFileSync(entryPath, "utf8");
if (source.includes("__VIXOR_NFT_TRACE_ONLY__")) {
  console.log("[vercel-nft] Trace-only imports already present");
  process.exit(0);
}

const imports = chunks.map((file) => `  void import("./_ssr/${file}");`).join("\n");
const block = [
  "// __VIXOR_NFT_TRACE_ONLY__",
  "// Static analyzer sees literal import paths; runtime never evaluates this branch.",
  "if (false) {",
  imports,
  "}",
].join("\n");

const lines = source.split("\n");
lines.splice(1, 0, "", block);
writeFileSync(entryPath, lines.join("\n"), "utf8");

for (const file of chunks) {
  const fullPath = join(ssrDir, file);
  const size = readFileSync(fullPath).byteLength;
  if (size === 0) throw new Error(`[vercel-nft] Empty SSR chunk: ${file}`);
  console.log(`[vercel-nft] discovered candidate ${file} (${size} bytes)`);
}

console.log(`[vercel-nft] Added ${chunks.length} unreachable literal imports; no runtime chunk loading`);
