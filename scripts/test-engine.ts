/**
 * Quick unit test for the Vixor Analysis Engine
 * Tests that runLocalAnalysis produces a valid, complete result
 */
import { runLocalAnalysis, type AnalysisInput } from "@/domains/analysis/engine/engine";

// Generate realistic BTC/USDT bars (simulating real data)
function generateTestBars(count: number): Array<{
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> {
  const bars = [];
  let price = 65000;
  const now = Date.now();
  const interval = 3600 * 1000; // 1H

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 500; // slight bullish bias
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    const volume = 100 + Math.random() * 500;

    bars.push({
      time: now - (count - i) * interval,
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return bars;
}

// ── TEST 1: Engine with real-looking data ──
console.log("=== TEST 1: Engine with 200 bars (BTC/USDT) ===");
try {
  const bars = generateTestBars(200);
  const input: AnalysisInput = {
    pair: "BTC/USDT",
    timeframe: "1H",
    tradingStyle: "Day Trading",
    bars,
  };

  const t0 = performance.now();
  const result = runLocalAnalysis(input);
  const elapsed = Math.round(performance.now() - t0);

  console.log(`✅ Engine completed in ${elapsed}ms`);
  console.log(`  Pair: ${result.pair}`);
  console.log(`  Timeframe: ${result.timeframe}`);
  console.log(`  Trend: ${result.trend}`);
  console.log(`  Recommendation: ${result.recommendation}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Pattern: ${result.pattern}`);
  console.log(`  Entry: ${result.entry}`);
  console.log(`  Stop Loss: ${result.stop_loss}`);
  console.log(`  Take Profits: ${JSON.stringify(result.take_profit)}`);
  console.log(`  RR: ${result.rr}`);
  console.log(`  Risk Level: ${result.risk_level}`);
  console.log(`  Market Structure: ${JSON.stringify(result.market_structure)}`);
  console.log(`  Key Levels: ${JSON.stringify(result.key_levels)}`);
  console.log(`  Reasons: ${JSON.stringify(result.reasons)}`);
  console.log(`  Management: ${JSON.stringify(result.management)}`);
  console.log(`  Scenarios keys: ${Object.keys(result.scenarios).join(", ")}`);

  // Validation
  const errors: string[] = [];
  if (!["BULLISH", "BEARISH", "SIDEWAYS"].includes(result.trend)) errors.push(`Invalid trend: ${result.trend}`);
  if (!["BUY", "SELL", "WAIT"].includes(result.recommendation)) errors.push(`Invalid recommendation: ${result.recommendation}`);
  if (result.confidence < 0 || result.confidence > 100) errors.push(`Invalid confidence: ${result.confidence}`);
  if (!result.entry) errors.push("Missing entry");
  if (!result.stop_loss) errors.push("Missing stop_loss");
  if (!result.take_profit || result.take_profit.length !== 3) errors.push(`Invalid take_profit: ${JSON.stringify(result.take_profit)}`);
  if (!result.rr) errors.push("Missing rr");
  if (!result.pattern) errors.push("Missing pattern");
  if (!result.reasons || result.reasons.length < 3) errors.push(`Not enough reasons: ${result.reasons.length}`);
  if (!result.management || result.management.length < 3) errors.push(`Not enough management steps: ${result.management?.length}`);
  if (!result.risk_level) errors.push("Missing risk_level");

  if (errors.length > 0) {
    console.error("\n❌ VALIDATION ERRORS:");
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log("\n✅ ALL VALIDATIONS PASSED");
  }
} catch (err) {
  console.error("❌ ENGINE THREW ERROR:", err);
  process.exit(1);
}

// ── TEST 2: Engine with no bars (synthetic fallback) ──
console.log("\n=== TEST 2: Engine with NO bars (synthetic fallback) ===");
try {
  const input: AnalysisInput = {
    pair: "EUR/USD",
    timeframe: "1H",
    tradingStyle: "Day Trading",
    bars: [], // Empty — should use synthetic
  };

  const result = runLocalAnalysis(input);
  console.log(`✅ Synthetic fallback completed`);
  console.log(`  Recommendation: ${result.recommendation}`);
  console.log(`  Confidence: ${result.confidence}%`);
  console.log(`  Pattern: ${result.pattern}`);

  if (result.vixor_message?.includes("SIMULATED DATA")) {
    console.log("  ✅ Correctly tagged as SIMULATED DATA");
  } else {
    console.error("  ❌ Missing SIMULATED DATA tag in vixor_message");
  }
} catch (err) {
  console.error("❌ SYNTHETIC FALLBACK THREW:", err);
  process.exit(1);
}

// ── TEST 3: Engine with minimal bars (< 20, should use synthetic) ──
console.log("\n=== TEST 3: Engine with only 5 bars (below threshold) ===");
try {
  const bars = generateTestBars(5);
  const input: AnalysisInput = {
    pair: "XAU/USD",
    timeframe: "4H",
    bars,
  };

  const result = runLocalAnalysis(input);
  console.log(`✅ Low-bar fallback completed`);
  console.log(`  Recommendation: ${result.recommendation}`);
  console.log(`  Confidence: ${result.confidence}%`);
} catch (err) {
  console.error("❌ LOW-BAR FALLBACK THREW:", err);
  process.exit(1);
}

console.log("\n=== ALL 3 TESTS PASSED ===");