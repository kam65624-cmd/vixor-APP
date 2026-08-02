/**
 * Document Validation & Auto-Update Script
 * Checks that generated docs match current codebase state.
 * Run: node --experimental-strip-types scripts/validate-docs.mts
 *
 * Checks:
 *   1. API_INVENTORY.md — re-runs api-inventory and compares
 *   2. SPRINTS.md — checks no orphaned routes (files exist)
 *   3. DESIGN_TOKENS.md — checks tokens exist in styles.css
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

let errors = 0;
let warnings = 0;

function log(level: string, msg: string) {
  const icon = level === "ERROR" ? "❌" : level === "WARN" ? "⚠️" : "✅";
  console.log(`${icon} [${level}] ${msg}`);
  if (level === "ERROR") errors++;
  if (level === "WARN") warnings++;
}

// ── 1. API_INVENTORY.md freshness ──────────────────────────────────

function checkApiInventory() {
  console.log("\n── Checking API_INVENTORY.md ──");

  // Run the generator and capture output
  const fresh = execSync(
    'node --experimental-strip-types scripts/api-inventory.mts',
    { encoding: "utf-8" }
  );

  const current = existsSync("API_INVENTORY.md")
    ? readFileSync("API_INVENTORY.md", "utf-8")
    : "";

  if (fresh.trim() === current.trim()) {
    log("PASS", "API_INVENTORY.md is up to date");
  } else {
    log("ERROR", "API_INVENTORY.md is stale. Run: node --experimental-strip-types scripts/api-inventory.mts > API_INVENTORY.md");
    // Show diff summary
    const freshLines = fresh.trim().split("\n").length;
    const currentLines = current.trim().split("\n").length;
    console.log(`   Current: ${currentLines} lines, Expected: ${freshLines} lines`);
  }
}

// ── 2. SPRINTS.md route validation ─────────────────────────────────

function checkSprints() {
  console.log("\n── Checking SPRINTS.md routes ──");

  if (!existsSync("SPRINTS.md")) {
    log("ERROR", "SPRINTS.md not found");
    return;
  }

  const content = readFileSync("SPRINTS.md", "utf-8");

  // Extract file paths mentioned in SPRINTS.md
  const fileRefs = content.match(/src\/[\w/_-]+\.(tsx|ts)/g) || [];
  const unique = [...new Set(fileRefs)];

  let missing = 0;
  for (const ref of unique) {
    if (!existsSync(ref)) {
      log("WARN", `Referenced file missing: ${ref}`);
      missing++;
    }
  }

  if (missing === 0) {
    log("PASS", `All ${unique.length} referenced files exist`);
  } else {
    log("ERROR", `${missing}/${unique.length} referenced files are missing`);
  }

  // Check for new routes not in SPRINTS.md
  const routeFiles = execSync(
    "ls src/routes/_authenticated/*.tsx 2>/dev/null",
    { encoding: "utf-8" }
  ).trim().split("\n").filter(Boolean);

  let untracked = 0;
  for (const rf of routeFiles) {
    const basename = rf.replace("src/routes/_authenticated/", "");
    if (!content.includes(basename)) {
      untracked++;
    }
  }
  if (untracked > 0) {
    log("WARN", `${untracked} route files not referenced in SPRINTS.md`);
  }
}

// ── 3. DESIGN_TOKENS.md validation ──────────────────────────────────

function checkDesignTokens() {
  console.log("\n── Checking DESIGN_TOKENS.md ──");

  if (!existsSync("DESIGN_TOKENS.md")) {
    log("ERROR", "DESIGN_TOKENS.md not found");
    return;
  }

  if (!existsSync("src/styles.css")) {
    log("ERROR", "src/styles.css not found");
    return;
  }

  const tokenDoc = readFileSync("DESIGN_TOKENS.md", "utf-8");
  const styles = readFileSync("src/styles.css", "utf-8");

  // Extract token names from the doc
  const docTokens = tokenDoc.match(/`--([\w-]+)`/g)?.map((t) => t.replace(/[`]/g, "")) || [];

  let missing = 0;
  for (const token of docTokens) {
    if (!styles.includes(token)) {
      log("WARN", `Token ${token} not found in styles.css`);
      missing++;
    }
  }

  if (missing === 0) {
    log("PASS", `All ${docTokens.length} documented tokens exist in styles.css`);
  } else {
    log("ERROR", `${missing}/${docTokens.length} documented tokens missing from styles.css`);
  }
}

// ── Run all checks ──────────────────────────────────────────────────

console.log("VIXOR Document Validation");
console.log(`${"=".repeat(40)}`);

checkApiInventory();
checkSprints();
checkDesignTokens();

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${errors} errors, ${warnings} warnings`);

if (errors > 0) process.exit(1);
