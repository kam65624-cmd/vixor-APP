/**
 * API Inventory Generator
 * Scans all server functions and API routes, outputs a structured inventory.
 * Run: node --experimental-strip-types scripts/api-inventory.mts > API_INVENTORY.md
 */

import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const SRC = join(process.cwd(), "src");
const SERVER = join(process.cwd(), "server");

interface ServerFn {
  name: string;
  file: string;
}

interface ApiRoute {
  name: string;
  file: string;
  methods: string[];
  rateLimit?: string;
}

// ── Scan Server Functions ─────────────────────────────────────────────

function scanServerFns(dir: string): ServerFn[] {
  const results: ServerFn[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = join(dir, e.name);
      if (e.isDirectory()) {
        results.push(...scanServerFns(fullPath));
      } else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) {
        const content = readFileSync(fullPath, "utf-8");
        for (const m of content.matchAll(/export\s+const\s+(\w+)\s*=\s*createServerFn/g)) {
          results.push({ name: m[1], file: relative(process.cwd(), fullPath) });
        }
      }
    }
  } catch {
    // skip
  }
  return results;
}

// ── Scan HTTP API Routes ─────────────────────────────────────────────

function scanApiRoutes(): ApiRoute[] {
  const results: ApiRoute[] = [];
  try {
    const files = readdirSync(join(SERVER, "api"));
    for (const f of files) {
      if (!f.endsWith(".ts") || f.startsWith("_")) continue;
      const fullPath = join(SERVER, "api", f);
      const content = readFileSync(fullPath, "utf-8");
      const name = f.replace(".ts", "");

      const rlMatch = content.match(/withRateLimit\([^,]+,\s*\{\s*maxRequests:\s*(\d+),\s*windowSec:\s*(\d+)/);
      const rateLimit = rlMatch ? `${rlMatch[1]}/${rlMatch[2]}s` : undefined;
      const isWebhook = content.includes("webhook: true");

      const methods: string[] = [];
      if (isWebhook) {
        methods.push("WEBHOOK");
      } else {
        if (content.includes("getQuery")) methods.push("GET");
        if (content.includes("readBody") || content.includes("getBody")) methods.push("POST");
        if (methods.length === 0) methods.push("GET");
      }

      results.push({ name, file: relative(process.cwd(), fullPath), methods, rateLimit });
    }
  } catch {
    // skip
  }
  return results;
}

// ── Group by domain ──────────────────────────────────────────────────

function groupByDomain(fns: ServerFn[]): Map<string, ServerFn[]> {
  const map = new Map<string, ServerFn[]>();
  for (const fn of fns) {
    const parts = fn.file.replace(/^src\//, "").split("/");
    const domain = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0] || "root";
    if (!map.has(domain)) map.set(domain, []);
    map.get(domain)!.push(fn);
  }
  return map;
}

// ── Output ────────────────────────────────────────────────────────────

const apiRoutes = scanApiRoutes();
const allFns = scanServerFns(join(SRC, "domains"))
  .concat(scanServerFns(join(SRC, "shared/data")))
  .concat(scanServerFns(join(SRC, "routes")));
const grouped = groupByDomain(allFns);

const lines: string[] = [];
const p = (s: string) => lines.push(s);

p("# VIXOR API Inventory");
p("");
p(`> Auto-generated: ${new Date().toISOString().split("T")[0]}`);
p("");

// HTTP Routes
p("## HTTP API Routes");
p("");
p("| Endpoint | Methods | Rate Limit | File |");
p("|----------|---------|------------|------|");
for (const r of apiRoutes.sort((a, b) => a.name.localeCompare(b.name))) {
  p(`| /api/${r.name} | ${r.methods.join(", ")} | ${r.rateLimit || "\u2014"} | ${r.file} |`);
}
p("");
p(`**Total**: ${apiRoutes.length} endpoints`);
p("");

// Server Functions
p("## Server Functions (createServerFn)");
p("");
for (const [domain, fns] of [...grouped.entries()].sort()) {
  p(`### ${domain}`);
  p("");
  p("| Function | File |");
  p("|----------|------|");
  for (const fn of fns.sort((a, b) => a.name.localeCompare(b.name))) {
    p(`| ${fn.name} | ${fn.file.replace("src/", "")} |`);
  }
  p("");
}

p(`**Total**: ${allFns.length} server functions across ${grouped.size} modules`);
p("");

// Summary
p("## Summary");
p("");
p(`- HTTP API Routes: ${apiRoutes.length}`);
p(`- Server Functions: ${allFns.length}`);
p(`- Domain Modules: ${grouped.size}`);

process.stdout.write(lines.join("\n") + "\n");
