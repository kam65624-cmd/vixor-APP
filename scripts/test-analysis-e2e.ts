/**
 * VIXOR Analysis Engine — End-to-End Test Script
 * FIX-6: Comprehensive pipeline validation
 *
 * Tests:
 * 1. Engine imports and runs without crashing
 * 2. LocalAnalysisResult type contract is valid (entry/stop_loss are numbers)
 * 3. SMC/ICT pipeline produces valid results for all PAIR_CONFIGS
 * 4. Zod schema validation passes for engine output
 * 5. VLM fallback chain structure is valid
 */

// ── Test 1: Engine imports ──
console.log("=== FIX-6: VIXOR Analysis E2E Test ===\n");

let importErrors = 0;

try {
  const { runLocalAnalysis, generateFallbackResult } = await import(
    "../src/domains/analysis/engine/engine.ts"
  );
  console.log("[PASS] 1a. Engine imports successfully");
} catch (e) {
  importErrors++;
  console.error("[FAIL] 1a. Engine import failed:", e.message);
}

try {
  const { PAIR_CONFIGS } = await import("../src/domains/analysis/engine/core/types.ts");
  console.log("[PASS] 1b. PAIR_CONFIGS imported, count:", Object.keys(PAIR_CONFIGS).length);
} catch (e) {
  importErrors++;
  console.error("[FAIL] 1b. PAIR_CONFIGS import failed:", e.message);
}

try {
  await import("../src/domains/chart-intelligence/chart-vision.ts");
  console.log("[PASS] 1c. Chart vision imports successfully");
} catch (e) {
  importErrors++;
  console.error("[FAIL] 1c. Chart vision import failed:", e.message);
}

try {
  await import("../src/domains/analysis/server/run-analysis.ts");
  console.log("[PASS] 1d. Run analysis imports successfully");
} catch (e) {
  importErrors++;
  console.error("[FAIL] 1d. Run analysis import failed:", e.message);
}

if (importErrors > 0) {
  console.error(`\n[FATAL] ${importErrors} import error(s). Aborting.`);
  process.exit(1);
}

// ── Test 2: Engine produces valid results ──
const { runLocalAnalysis } = await import("../src/domains/analysis/engine/engine.ts");
const { PAIR_CONFIGS } = await import("../src/domains/analysis/engine/core/types.ts");
const { z } = await import("zod");

let typeErrors = 0;
const pairs = Object.keys(PAIR_CONFIGS);

for (const pair of pairs) {
  for (const tf of ["15M", "1H", "4H"]) {
    try {
      const result = runLocalAnalysis({ pair, timeframe: tf, tradingStyle: "Day Trading" });

      // Type contract checks
      const checks = [
        { name: "entry is number", ok: typeof result.entry === "number" },
        { name: "stop_loss is number", ok: typeof result.stop_loss === "number" },
        { name: "confidence is number 0-100", ok: typeof result.confidence === "number" && result.confidence >= 0 && result.confidence <= 100 },
        { name: "take_profit is number[3]", ok: Array.isArray(result.take_profit) && result.take_profit.length === 3 && result.take_profit.every((v: unknown) => typeof v === "number") },
        { name: "recommendation valid", ok: ["BUY", "SELL", "WAIT"].includes(result.recommendation) },
        { name: "risk_level valid", ok: ["LOW", "MEDIUM", "HIGH"].includes(result.risk_level) },
        { name: "rr is string", ok: typeof result.rr === "string" },
        { name: "reasons has 3-5 items", ok: Array.isArray(result.reasons) && result.reasons.length >= 3 && result.reasons.length <= 5 },
        { name: "management has 3-6 items", ok: Array.isArray(result.management) && result.management.length >= 3 && result.management.length <= 6 },
        { name: "vixor_message is string", ok: typeof result.vixor_message === "string" && result.vixor_message.length > 0 },
      ];

      for (const c of checks) {
        if (!c.ok) {
          typeErrors++;
          console.error(`[FAIL] 2. ${pair} ${tf}: ${c.name} (got: ${JSON.stringify(result[c.name.split(" ")[0]])})`);
        }
      }
    } catch (e) {
      typeErrors++;
      console.error(`[FAIL] 2. ${pair} ${tf}: Engine threw: ${e.message}`);
    }
  }
}

if (typeErrors === 0) {
  console.log(`[PASS] 2. All ${pairs.length * 3} engine runs produce valid type contracts`);
} else {
  console.error(`\n[FAIL] 2. ${typeErrors} type contract error(s) across ${pairs.length * 3} runs`);
}

// ── Test 3: Zod schema validation ──
const { AnalysisSchema } = await import("../src/domains/analysis/server/run-analysis.ts");

let schemaErrors = 0;
for (const pair of ["EUR/USD", "BTC/USDT", "XAU/USD"]) {
  try {
    const result = runLocalAnalysis({ pair, timeframe: "1H" });
    const parsed = AnalysisSchema.safeParse(result);
    if (!parsed.success) {
      schemaErrors++;
      console.error(`[FAIL] 3. ${pair}: Zod validation failed:`, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "));
    }
  } catch (e) {
    schemaErrors++;
    console.error(`[FAIL] 3. ${pair}: Schema test threw: ${e.message}`);
  }
}

if (schemaErrors === 0) {
  console.log("[PASS] 3. Zod schema validation passes for all test pairs");
} else {
  console.error(`\n[FAIL] 3. ${schemaErrors} schema validation error(s)`);
}

// ── Test 4: VLM fallback chain structure ──
try {
  const visionModule = await import("../src/domains/chart-intelligence/chart-vision.ts");
  // The module should export extractChartContext and extractChartContextFromBase64
  if (typeof visionModule.extractChartContext === "function") {
    console.log("[PASS] 4a. extractChartContext is exported as function");
  } else {
    console.error("[FAIL] 4a. extractChartContext is not a function");
    typeErrors++;
  }
  if (typeof visionModule.extractChartContextFromBase64 === "function") {
    console.log("[PASS] 4b. extractChartContextFromBase64 is exported as function");
  } else {
    console.error("[FAIL] 4b. extractChartContextFromBase64 is not a function");
    typeErrors++;
  }
} catch (e) {
  console.error("[FAIL] 4. VLM module test failed:", e.message);
  typeErrors++;
}

// ── Summary ──
const totalErrors = importErrors + typeErrors + schemaErrors;
console.log(`\n=== FIX-6 Test Summary ===`);
console.log(`  Imports:     ${importErrors === 0 ? "PASS" : `FAIL (${importErrors})`}`);
console.log(`  Type checks: ${typeErrors === 0 ? "PASS" : `FAIL (${typeErrors})`}`);
console.log(`  Zod schema:  ${schemaErrors === 0 ? "PASS" : `FAIL (${schemaErrors})`}`);
console.log(`  VLM module:  ${typeErrors === 0 ? "PASS" : "checked above"}`);
console.log(`  Total:       ${totalErrors === 0 ? "ALL PASS ✓" : `${totalErrors} FAILURES`}`);

if (totalErrors > 0) {
  process.exit(1);
}