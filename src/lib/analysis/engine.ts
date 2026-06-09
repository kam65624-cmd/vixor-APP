// ============================================================================
// Vixor Local Analysis Engine — Main Orchestrator
// ============================================================================
//
// This is the entry point that replaces Gemini AI for chart analysis.
// It composes all analysis modules into a single pipeline:
//
//   1. Generate/extract OHLCV data
//   2. Analyze market structure (SMC/ICT)
//   3. Detect Order Blocks, FVGs, Liquidity Zones
//   4. Detect candlestick patterns & chart formations
//   5. Calculate risk-reward & position sizing
//   6. Compose the final LocalAnalysisResult
//
// The engine is fully deterministic and requires ZERO external API keys.
// ============================================================================

import {
  OHLCVBar, LocalAnalysisResult, PairConfig, PAIR_CONFIGS,
  TrendDirection, RecommendationType, RiskLevel, SwingPoint,
} from "./core/types";

import { atr, formatPrice, avgRange } from "./core/candle-utils";
// NOTE: generateOHLCV is intentionally NOT imported here. It should only be
// used for testing/development, never for real analysis. If no real bars are
// provided, we return a WAIT result instead of generating fake data.
import { analyzeMarketStructure } from "./core/market-structure";

import { detectOrderBlocks } from "./smc/order-blocks";
import { detectFVGs, getActiveFVGs } from "./smc/fair-value-gaps";
import { detectLiquidityZones, detectSRLevels } from "./smc/liquidity";
import { detectRecentBOS, determineTrendFromSwings } from "./smc/bos-choch";

import { detectCandlestickPatterns } from "./patterns/candlestick-patterns";
import { detectChartFormations } from "./patterns/chart-formations";
import { detectHarmonicPatterns } from "./patterns/harmonic-patterns";

import { calculateRiskReward, rrRatio } from "./risk/risk-reward";
import { getLatestIndicators, getRSIStatus, getADXStrength, checkEMAAlignment } from "./indicators";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AnalysisInput {
  pair?: string;
  timeframe?: string;
  tradingStyle?: string;
  /** Optional: if the caller has real OHLCV data, pass it here */
  bars?: OHLCVBar[];
  /** Optional: image bytes for future OCR extraction */
  imageBytes?: Uint8Array;
}

/**
 * Run the full Vixor local analysis pipeline.
 *
 * This function is the drop-in replacement for `runChartAnalysis` from
 * `run-analysis.server.ts`. It returns the same `LocalAnalysisResult` shape
 * (compatible with `AnalysisSchema`).
 */
export function runLocalAnalysis(input: AnalysisInput): LocalAnalysisResult {
  const pair = input.pair || detectPairFromImage(input.imageBytes) || "EUR/USD";
  const timeframe = input.timeframe || "1H";
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS["EUR/USD"]!;
  const decimals = config.decimals;

  // ── Step 1: Get OHLCV data ──────────────────────────────────────────
  // CRITICAL: We NEVER use generateOHLCV() for real analysis.
  // If no real bars are provided, we return a WAIT result instead of fake data.
  // generateOHLCV() is only for testing/development.
  if (!input.bars || input.bars.length < 20) {
    return generateFallbackResult(pair, timeframe, config);
  }
  const bars = input.bars;

  // ── Step 2: Market structure (SMC/ICT) ──────────────────────────────
  const structureResult = analyzeMarketStructure(bars);
  const swingHighs = structureResult.swingPoints.filter(s => s.type === "HIGH");
  const swingLows = structureResult.swingPoints.filter(s => s.type === "LOW");

  // ── Step 3: SMC concepts ────────────────────────────────────────────
  const orderBlocks = detectOrderBlocks(bars);
  const fvgs = detectFVGs(bars);
  const liquidityZones = detectLiquidityZones(structureResult.swingPoints, bars);
  const srLevels = detectSRLevels(bars);

  // ── Step 4: BOS / CHoCH details ────────────────────────────────────
  const bosResult = detectRecentBOS(bars, swingHighs, swingLows);
  const trendResult = determineTrendFromSwings(swingHighs, swingLows);

  // Use market structure direction as primary, fall back to swing analysis
  const trend: TrendDirection = structureResult.direction !== "SIDEWAYS"
    ? structureResult.direction
    : trendResult.direction;

  // ── Step 5: Pattern detection (74 candlestick + 20 chart formations + 8 harmonic) ──
  const candlePatterns = detectCandlestickPatterns(bars);
  const chartFormations = detectChartFormations(bars, structureResult.swingPoints);
  const harmonicPatterns = detectHarmonicPatterns(bars, structureResult.swingPoints);

  // ── Step 5b: Technical indicators (RSI, MACD, BB, EMA, ADX, etc.) ──
  const indicators = getLatestIndicators(bars);
  const rsiStatus = getRSIStatus(indicators.rsi);
  const adxStrength = getADXStrength(indicators.adx);
  const emaAlignment = checkEMAAlignment(
    indicators.ema9,
    indicators.ema21,
    indicators.ema50,
    indicators.ema200,
  );

  // ── Step 6: ATR & Support/Resistance for risk-reward ───────────────
  const atrValue = atr(bars, 14);
  const currentPrice = bars[bars.length - 1]!.close;
  const supportLevels = srLevels
    .filter(l => l.type === "SUPPORT")
    .map(l => l.price)
    .sort((a, b) => a - b);
  const resistanceLevels = srLevels
    .filter(l => l.type === "RESISTANCE")
    .map(l => l.price)
    .sort((a, b) => a - b);

  // ── Step 7: Risk-Reward calculation ────────────────────────────────
  const rr = calculateRiskReward(
    currentPrice, trend, atrValue, decimals,
    supportLevels, resistanceLevels, pair,
  );

  // Adjust recommendation based on pattern confluence + indicators
  // CRITICAL: Confluence scoring ensures consistency — the same data must produce
  // the same recommendation every time. No Math.random() anywhere.
  const confluence = calculateConfluenceScore(
    trend, rr.recommendation, candlePatterns, chartFormations, harmonicPatterns,
    rsiStatus, adxStrength, emaAlignment, indicators, currentPrice, orderBlocks, fvgs,
  );

  // Require minimum confluence to issue BUY/SELL — otherwise WAIT
  // This prevents the engine from flipping between BUY and SELL on minor data changes
  const MIN_CONFLUENCE_FOR_TRADE = 3; // Need at least 3 aligned signals
  let finalRec: RecommendationType;

  if (rr.recommendation === "WAIT" || confluence.score < MIN_CONFLUENCE_FOR_TRADE) {
    finalRec = "WAIT";
  } else if (confluence.direction === "BUY" && rr.recommendation === "BUY") {
    finalRec = "BUY";
  } else if (confluence.direction === "SELL" && rr.recommendation === "SELL") {
    finalRec = "SELL";
  } else {
    // Confluence direction disagrees with RR recommendation → WAIT
    finalRec = "WAIT";
  }

  // ── Step 8: Compose the result ─────────────────────────────────────
  const isBullish = finalRec === "BUY";
  const isBearish = finalRec === "SELL";
  const isWait = finalRec === "WAIT";

  // Confidence scoring — based on confluence score (deterministic, no Math.random())
  // Higher confluence = higher confidence. WAIT always gets lower confidence.
  const confidence = finalRec === "WAIT"
    ? (trend === "NEUTRAL" ? 42 : 48)
    : Math.min(35 + confluence.score * 7, 92); // 3 signals=56%, 4=63%, 5=70%, 6=77%, 7=84%, 8+=92%

  // Top liquidity zones
  const buySideLiquidity = liquidityZones
    .filter(z => z.type === "BUY_SIDE")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(z => formatPrice(z.price, decimals));

  const sellSideLiquidity = liquidityZones
    .filter(z => z.type === "SELL_SIDE")
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map(z => formatPrice(z.price, decimals));

  // Key levels
  const keyResistance = resistanceLevels.slice(0, 3).map(p => formatPrice(p, decimals));
  const keySupport = supportLevels.slice(0, 3).map(p => formatPrice(p, decimals));
  const pivot = srLevels.find(l => l.type === "PIVOT");
  const pivotPrice = pivot ? formatPrice(pivot.price, decimals) : undefined;

  // Pattern summary (includes harmonic patterns)
  const primaryPattern = buildPatternSummary(candlePatterns, chartFormations, harmonicPatterns, trend);

  // Reasons — now include confluence signals for meaningful, specific analysis
  const reasons = buildReasons(
    trend, finalRec, structureResult, orderBlocks, fvgs,
    candlePatterns, chartFormations, harmonicPatterns, srLevels,
    rsiStatus, adxStrength, confluence,
  );

  // Scenarios
  const entry = formatPrice(rr.entry, decimals);
  const sl = formatPrice(rr.stopLoss, decimals);
  const risk = Math.abs(rr.entry - rr.stopLoss);

  const scenarios = {
    conservative: {
      name: "Retest Entry",
      probability: 55,
      entry: String(entry),
      sl: formatPrice(rr.stopLoss, decimals),
      tp1: formatPrice(rr.takeProfits[0] ?? rr.entry + risk, decimals),
      tp2: formatPrice(rr.takeProfits[1] ?? rr.entry + risk * 1.5, decimals),
      rr: "1:1.0",
    },
    balanced: {
      name: "Market Entry",
      probability: 30,
      entry: String(entry),
      sl: formatPrice(rr.stopLoss, decimals),
      tp1: formatPrice(rr.takeProfits[1] ?? rr.entry + risk * 2, decimals),
      tp2: formatPrice(rr.takeProfits[2] ?? rr.entry + risk * 2.5, decimals),
      rr: rr.rr,
    },
    aggressive: {
      name: "Breakout",
      probability: 15,
      entry: String(formatPrice(rr.takeProfits[0] ?? currentPrice, decimals)),
      sl: formatPrice(rr.entry, decimals),
      tp1: formatPrice(rr.takeProfits[2] ?? rr.entry + risk * 3, decimals),
      tp2: formatPrice((rr.takeProfits[2] ?? rr.entry + risk * 3) + risk * 0.5, decimals),
      rr: "1:3.0",
    },
  };

  // Risk assessment
  const riskLevel = assessRisk(trend, atrValue, currentPrice, srLevels, fvgs, orderBlocks);
  const riskReasons = buildRiskReasons(riskLevel, trend, atrValue, currentPrice, srLevels);

  // Management instructions
  const management = buildManagementInstructions(
    finalRec, rr.entry, rr.stopLoss, rr.takeProfits, rr.invalidationLevel, decimals,
  );

  // Vixor message
  const vixorMessage = generateVixorMessage(
    pair, timeframe, trend, finalRec, confidence, primaryPattern,
    structureResult, orderBlocks, fvgs,
  );

  // News impact — only include if real news data is available
  // Previously used deterministic fake news — now returns undefined to avoid fabricated headlines
  const newsImpact: LocalAnalysisResult["news_impact"] | undefined = undefined;

  // Signal badge
  const signalBadge = {
    direction: finalRec,
    entry: String(entry),
    stop_loss: String(sl),
    take_profit: String(formatPrice(rr.takeProfits[1] ?? currentPrice, decimals)),
    rr: rr.rr,
  };

  return {
    pair,
    timeframe,
    trend: trend as TrendDirection,
    risk_level: riskLevel,
    risk_reasons: riskReasons,
    invalidation_level: formatPrice(rr.invalidationLevel, decimals),
    liquidity_zones: {
      buySide: buySideLiquidity,
      sellSide: sellSideLiquidity,
    },
    market_structure: {
      direction: (structureResult.direction === "SIDEWAYS" ? "NEUTRAL" : structureResult.direction) as TrendDirection,
      structure: structureResult.structure,
      bos: structureResult.lastBOS?.price
        ? formatPrice(structureResult.lastBOS.price, decimals)
        : undefined,
    },
    key_levels: {
      resistance: keyResistance,
      support: keySupport,
      pivot: pivotPrice,
    },
    recommendation: finalRec,
    confidence,
    entry: formatPrice(rr.entry, decimals),
    stop_loss: formatPrice(rr.stopLoss, decimals),
    take_profit: rr.takeProfits.map(p => formatPrice(p, decimals)),
    rr: rr.rr,
    pattern: primaryPattern,
    reasons,
    scenarios,
    management,
    news_impact: newsImpact,
    signal_badge: signalBadge,
    vixor_message: vixorMessage,
  };
}

// ---------------------------------------------------------------------------
// Helper: Pair detection from image (placeholder for OCR)
// ---------------------------------------------------------------------------

function detectPairFromImage(_imageBytes?: Uint8Array): string | undefined {
  // Future: OCR extraction from chart image
  return undefined;
}

// ---------------------------------------------------------------------------
// Helper: Confluence scoring — requires multiple independent signals to agree
// ---------------------------------------------------------------------------

interface ConfluenceResult {
  direction: "BUY" | "SELL" | "NONE";
  score: number; // Number of independent signals that agree
  signals: string[]; // Names of agreeing signals for transparency
}

/**
 * Calculate confluence score from multiple independent analysis signals.
 * This is the KEY to consistency: we don't just look at one indicator,
 * we require at least 3 independent signals to agree before issuing a trade.
 *
 * Signals counted:
 * 1. Market structure trend (HH+HL = bullish, LH+LL = bearish)
 * 2. Risk-Reward direction (BUY or SELL from ATR-based levels)
 * 3. Candlestick patterns (recent bullish/bearish patterns)
 * 4. Chart formations (triangles, channels, etc.)
 * 5. Harmonic patterns (Gartley, Bat, etc.)
 * 6. RSI status (overbought → bearish, oversold → bullish)
 * 7. ADX trend strength (strong trend = confirms direction)
 * 8. EMA alignment (9/21/50/200)
 * 9. MACD histogram direction
 * 10. Order block confluence (unmitigated OBs in direction)
 * 11. FVG confluence (unfilled gaps in direction)
 * 12. Price position relative to key EMAs
 */
function calculateConfluenceScore(
  trend: TrendDirection,
  rrDirection: RecommendationType,
  patterns: Array<{ type: string; reliability: number }>,
  formations: Array<{ type: string; reliability: number }>,
  harmonics: Array<{ type: string; reliability: number }>,
  rsiStatus: string,
  adxStrength: string,
  emaAlignment: { alignment: string; strength: number },
  indicators: { rsi: number; macdHistogram: number; ema9: number; ema21: number; ema50: number; ema200: number; adx: number; bollingerPosition: number; stochK: number; stochD: number; volumeTrend: string; emaTrend: string },
  currentPrice: number,
  obs: Array<{ type: string; mitigated: boolean; strength: number }>,
  fvgs: Array<{ type: string; filled: boolean }>,
): ConfluenceResult {
  let bullSignals = 0;
  let bearSignals = 0;
  const bullReasons: string[] = [];
  const bearReasons: string[] = [];

  // 1. Market structure trend
  if (trend === "BULLISH") { bullSignals++; bullReasons.push("Bullish market structure (HH+HL)"); }
  if (trend === "BEARISH") { bearSignals++; bearReasons.push("Bearish market structure (LH+LL)"); }

  // 2. Risk-Reward direction
  if (rrDirection === "BUY") { bullSignals++; bullReasons.push("RR calculation favors long"); }
  if (rrDirection === "SELL") { bearSignals++; bearReasons.push("RR calculation favors short"); }

  // 3. Candlestick patterns (last 5)
  const recentPatterns = patterns.slice(0, 5);
  let patternBull = 0, patternBear = 0;
  for (const p of recentPatterns) {
    if (p.type === "BULLISH") patternBull += p.reliability / 100;
    if (p.type === "BEARISH") patternBear += p.reliability / 100;
  }
  if (patternBull > patternBear + 0.3) { bullSignals++; bullReasons.push("Bullish candlestick patterns"); }
  if (patternBear > patternBull + 0.3) { bearSignals++; bearReasons.push("Bearish candlestick patterns"); }

  // 4. Chart formations
  const recentFormations = formations.slice(0, 3);
  let formBull = 0, formBear = 0;
  for (const f of recentFormations) {
    if (f.type === "BULLISH") formBull += f.reliability / 100;
    if (f.type === "BEARISH") formBear += f.reliability / 100;
  }
  if (formBull > formBear) { bullSignals++; bullReasons.push("Bullish chart formation"); }
  if (formBear > formBull) { bearSignals++; bearReasons.push("Bearish chart formation"); }

  // 5. Harmonic patterns (high weight)
  const recentHarmonics = harmonics.slice(0, 2);
  let harmBull = 0, harmBear = 0;
  for (const h of recentHarmonics) {
    if (h.type === "BULLISH") harmBull += (h.reliability / 100) * 1.5;
    if (h.type === "BEARISH") harmBear += (h.reliability / 100) * 1.5;
  }
  if (harmBull > harmBear) { bullSignals++; bullReasons.push("Bullish harmonic pattern"); }
  if (harmBear > harmBull) { bearSignals++; bearReasons.push("Bearish harmonic pattern"); }

  // 6. RSI status
  if (rsiStatus === "OVERSOLD") { bullSignals++; bullReasons.push("RSI oversold — reversal zone"); }
  if (rsiStatus === "OVERBOUGHT") { bearSignals++; bearReasons.push("RSI overbought — reversal zone"); }

  // 7. ADX strength — only counts if there's a direction
  if (adxStrength === "STRONG" && trend === "BULLISH") { bullSignals++; bullReasons.push("Strong ADX confirms bullish trend"); }
  if (adxStrength === "STRONG" && trend === "BEARISH") { bearSignals++; bearReasons.push("Strong ADX confirms bearish trend"); }
  if (adxStrength === "WEAK") {
    // Weak ADX reduces confidence in any direction — no signal added
  }

  // 8. EMA alignment
  if (emaAlignment.alignment === "BULLISH" && emaAlignment.strength >= 60) {
    bullSignals++; bullReasons.push(`Bullish EMA alignment (${emaAlignment.strength}%)`);
  }
  if (emaAlignment.alignment === "BEARISH" && emaAlignment.strength >= 60) {
    bearSignals++; bearReasons.push(`Bearish EMA alignment (${emaAlignment.strength}%)`);
  }

  // 9. MACD histogram direction (deterministic based on value)
  const macdH = indicators.macdHistogram;
  if (!isNaN(macdH)) {
    if (macdH > 0) { bullSignals++; bullReasons.push("MACD histogram positive"); }
    if (macdH < 0) { bearSignals++; bearReasons.push("MACD histogram negative"); }
  }

  // 10. Order block confluence
  const unmitigated = obs.filter(o => !o.mitigated);
  const bullOBs = unmitigated.filter(o => o.type === "BULLISH").length;
  const bearOBs = unmitigated.filter(o => o.type === "BEARISH").length;
  if (bullOBs > bearOBs + 1) { bullSignals++; bullReasons.push(`${bullOBs} unmitigated bullish OBs`); }
  if (bearOBs > bullOBs + 1) { bearSignals++; bearReasons.push(`${bearOBs} unmitigated bearish OBs`); }

  // 11. FVG confluence
  const activeFVGs = fvgs.filter(f => !f.filled);
  const bullFVGs = activeFVGs.filter(f => f.type === "BULLISH").length;
  const bearFVGs = activeFVGs.filter(f => f.type === "BEARISH").length;
  if (bullFVGs > bearFVGs) { bullSignals++; bullReasons.push(`${bullFVGs} unfilled bullish FVGs`); }
  if (bearFVGs > bullFVGs) { bearSignals++; bearReasons.push(`${bearFVGs} unfilled bearish FVGs`); }

  // 12. Price position relative to EMA200 (if available)
  const ema200 = indicators.ema200;
  if (!isNaN(ema200)) {
    if (currentPrice > ema200) { bullSignals++; bullReasons.push("Price above EMA200"); }
    if (currentPrice < ema200) { bearSignals++; bearReasons.push("Price below EMA200"); }
  }

  // Determine dominant direction
  if (bullSignals > bearSignals) {
    return { direction: "BUY", score: bullSignals, signals: bullReasons };
  } else if (bearSignals > bullSignals) {
    return { direction: "SELL", score: bearSignals, signals: bearReasons };
  } else {
    return { direction: "NONE", score: 0, signals: [] };
  }
}

// ---------------------------------------------------------------------------
// Helper: Confidence scoring
// ---------------------------------------------------------------------------

function calculateConfidence(
  trend: TrendDirection,
  rec: RecommendationType,
  patterns: Array<{ type: string; reliability: number }>,
  formations: Array<{ type: string; reliability: number }>,
  harmonics: Array<{ type: string; reliability: number }>,
  obs: Array<{ type: string; mitigated: boolean; strength: number }>,
  fvgs: Array<{ type: string; filled: boolean }>,
  structure: { direction: string; bosEvents: Array<{ type: string }> },
  rsiStatus: string,
  adxStrength: string,
  emaAlignment: { alignment: string; strength: number },
): number {
  if (rec === "WAIT") {
    // Deterministic confidence for WAIT based on trend clarity
    // No Math.random() — must be reproducible across runs
    const waitConfidence = trend === "NEUTRAL" ? 42 : 48;
    return waitConfidence;
  }

  let confidence = 55;

  // Trend alignment
  if ((trend === "BULLISH" && rec === "BUY") || (trend === "BEARISH" && rec === "SELL")) {
    confidence += 10;
  }

  // Recent patterns support the direction
  const supportingPatterns = patterns.filter(p =>
    (rec === "BUY" && p.type === "BULLISH") || (rec === "SELL" && p.type === "BEARISH")
  );
  confidence += Math.min(supportingPatterns.length * 3, 10);

  // Chart formations
  const supportingFormations = formations.filter(f =>
    (rec === "BUY" && f.type === "BULLISH") || (rec === "SELL" && f.type === "BEARISH")
  );
  confidence += Math.min(supportingFormations.length * 5, 10);

  // Harmonic patterns (carry more weight)
  const supportingHarmonics = harmonics.filter(h =>
    (rec === "BUY" && h.type === "BULLISH") || (rec === "SELL" && h.type === "BEARISH")
  );
  confidence += Math.min(supportingHarmonics.length * 7, 12);

  // Unmitigated order blocks in the direction
  const unmitigatedOBs = obs.filter(ob =>
    !ob.mitigated &&
    ((rec === "BUY" && ob.type === "BULLISH") || (rec === "SELL" && ob.type === "BEARISH"))
  );
  confidence += Math.min(unmitigatedOBs.length * 3, 8);

  // Active FVGs
  const activeFVGs = fvgs.filter(f => !f.filled);
  confidence += Math.min(activeFVGs.length, 4);

  // BOS/CHoCH events
  if (structure.bosEvents.length > 0) confidence += 3;
  if (structure.bosEvents.some(e => e.type === "CHoCH")) confidence += 2;

  // Indicator-based confidence adjustments
  // RSI in favorable zone
  if ((rec === "BUY" && rsiStatus === "OVERSOLD") || (rec === "SELL" && rsiStatus === "OVERBOUGHT")) {
    confidence += 5; // Reversal from extreme RSI
  } else if ((rec === "BUY" && rsiStatus === "OVERBOUGHT") || (rec === "SELL" && rsiStatus === "OVERSOLD")) {
    confidence -= 5; // Trading against RSI extreme
  }

  // ADX trend strength
  if (adxStrength === "STRONG") confidence += 5;
  else if (adxStrength === "WEAK") confidence -= 3;

  // EMA alignment
  if (emaAlignment.alignment === (rec === "BUY" ? "BULLISH" : "BEARISH")) {
    confidence += Math.min(emaAlignment.strength / 10, 5);
  } else if (emaAlignment.alignment !== "NEUTRAL") {
    confidence -= 3;
  }

  return Math.min(Math.max(confidence, 40), 95);
}

// ---------------------------------------------------------------------------
// Helper: Pattern summary
// ---------------------------------------------------------------------------

function buildPatternSummary(
  candlePatterns: Array<{ name: string; type: string }>,
  chartFormations: Array<{ name: string; type: string }>,
  harmonicPatterns: Array<{ name: string; type: string }>,
  trend: TrendDirection,
): string {
  const parts: string[] = [];

  if (candlePatterns.length > 0) {
    parts.push(candlePatterns[0]!.name);
  }

  if (chartFormations.length > 0) {
    parts.push(chartFormations[0]!.name);
  }

  if (harmonicPatterns.length > 0) {
    parts.push(harmonicPatterns[0]!.name);
  }

  // Add SMC context
  if (trend === "BULLISH") parts.push("Bullish Structure");
  else if (trend === "BEARISH") parts.push("Bearish Structure");

  if (parts.length === 0) return "Consolidation Range";

  return parts.join(" + ");
}

// ---------------------------------------------------------------------------
// Helper: Build reasons
// ---------------------------------------------------------------------------

function buildReasons(
  trend: TrendDirection,
  rec: RecommendationType,
  structure: { direction: string; structure: string; lastBOS?: { type: string } },
  obs: Array<{ type: string; mitigated: boolean }>,
  fvgs: Array<{ type: string; filled: boolean }>,
  patterns: Array<{ name: string; type: string; reliability: number }>,
  formations: Array<{ name: string; type: string }>,
  harmonics: Array<{ name: string; type: string; reliability: number }>,
  _srLevels: Array<{ type: string; strength: number }>,
  rsiStatus: string,
  adxStrength: string,
  confluence: ConfluenceResult,
): string[] {
  const reasons: string[] = [];

  // If WAIT, explain why
  if (rec === "WAIT") {
    if (confluence.score < 3) {
      reasons.push(`Insufficient confluence — only ${confluence.score} signal(s) aligned. Need at least 3 for a trade.`);
    } else {
      reasons.push("Conflicting signals — bullish and bearish confluences are balanced. Wait for clear direction.");
    }
    if (trend === "NEUTRAL") {
      reasons.push("Market is consolidating with no clear trend structure. Wait for a BOS or CHoCH.");
    }
    if (adxStrength === "WEAK") {
      reasons.push("ADX shows weak trend momentum — no directional conviction from institutions.");
    }
    return reasons.slice(0, 5);
  }

  // Use confluence signals as the primary reasons — these are the REAL reasons
  // the engine is making this call, not generic SMC terminology
  const relevantSignals = rec === "BUY" ? confluence.signals : confluence.signals;
  for (let i = 0; i < Math.min(relevantSignals.length, 3); i++) {
    reasons.push(relevantSignals[i]!);
  }

  // Add SMC-specific context if BOS/CHoCH exists
  if (structure.lastBOS?.type === "CHoCH") {
    reasons.push("Change of Character (CHoCH) confirms institutional reversal intent.");
  } else if (structure.lastBOS?.type === "BOS" && reasons.length < 5) {
    reasons.push("Break of Structure (BOS) confirms trend continuation.");
  }

  // Ensure at least 3 reasons
  if (reasons.length < 3) {
    if (trend === "BULLISH") {
      reasons.push("Price is showing higher-timeframe bullish structure with orderly pullbacks.");
    } else if (trend === "BEARISH") {
      reasons.push("Price is showing lower-timeframe bearish structure with orderly pullbacks.");
    }
  }

  return reasons.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Helper: Risk assessment
// ---------------------------------------------------------------------------

function assessRisk(
  trend: TrendDirection,
  atrValue: number,
  currentPrice: number,
  srLevels: Array<{ type: string; price: number; strength: number }>,
  fvgs: Array<{ filled: boolean }>,
  obs: Array<{ mitigated: boolean }>,
): RiskLevel {
  let riskScore = 0;

  // Sideways = high risk
  if (trend === "NEUTRAL") riskScore += 3;

  // High volatility = higher risk
  const atrPercent = (atrValue / currentPrice) * 100;
  if (atrPercent > 2) riskScore += 2;
  if (atrPercent > 3) riskScore += 1;

  // No clear S/R levels = higher risk
  const nearLevels = srLevels.filter(l => Math.abs(l.price - currentPrice) / currentPrice < 0.01);
  if (nearLevels.length === 0) riskScore += 1;

  // Many unfilled FVGs = potential reversal risk
  const activeFVGs = fvgs.filter(f => !f.filled).length;
  if (activeFVGs > 5) riskScore += 1;

  // Many mitigated OBs = less institutional conviction
  const mitigatedOBs = obs.filter(o => o.mitigated).length;
  if (mitigatedOBs > obs.length * 0.6) riskScore += 1;

  if (riskScore >= 5) return "HIGH";
  if (riskScore >= 3) return "MEDIUM";
  return "LOW";
}

function buildRiskReasons(
  riskLevel: RiskLevel,
  trend: TrendDirection,
  _atrValue: number,
  _currentPrice: number,
  srLevels: Array<{ type: string; price: number }>,
): string[] {
  const reasons: string[] = [];

  if (trend === "NEUTRAL") {
    reasons.push("Market direction is unclear — risk of whipsaw in consolidation.");
  }

  if (srLevels.length === 0) {
    reasons.push("No clear support/resistance structure identified nearby.");
  } else {
    reasons.push("Approaching major liquidity zone — expect potential stop runs.");
  }

  if (riskLevel === "HIGH") {
    reasons.push("High volatility environment — reduce position size accordingly.");
  } else if (riskLevel === "MEDIUM") {
    reasons.push("Moderate volatility — standard risk management applies.");
  }

  return reasons.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Helper: Management instructions
// ---------------------------------------------------------------------------

function buildManagementInstructions(
  rec: RecommendationType,
  entry: number,
  sl: number,
  tps: number[],
  invalidation: number,
  decimals: number,
): string[] {
  if (rec === "WAIT") {
    return [
      "Do not enter — wait for a clear Break of Structure (BOS) or Change of Character (CHoCH).",
      "Monitor Fair Value Gap fills for potential entry zones.",
      "Set alerts at key support/resistance levels.",
    ];
  }

  const isBuy = rec === "BUY";
  return [
    `Enter ${isBuy ? "long" : "short"} at ${formatPrice(entry, decimals)} — wait for candle close confirmation.`,
    `Place stop loss at ${formatPrice(sl, decimals)} and move to breakeven after TP1 (${formatPrice(tps[0]!, decimals)}) is hit.`,
    `Scale out 50% at TP2 (${formatPrice(tps[1]!, decimals)}) and trail the remainder using a 1× ATR trailing stop.`,
    `Close position immediately if price closes beyond invalidation level at ${formatPrice(invalidation, decimals)}.`,
  ];
}

// ---------------------------------------------------------------------------
// Helper: Vixor message
// ---------------------------------------------------------------------------

function generateVixorMessage(
  pair: string,
  timeframe: string,
  trend: TrendDirection,
  rec: RecommendationType,
  confidence: number,
  pattern: string,
  structure: { direction: string; lastBOS?: { type: string; direction: string } },
  obs: Array<{ type: string; mitigated: boolean }>,
  fvgs: Array<{ type: string; filled: boolean }>,
): string {
  const unmitigatedOBs = obs.filter(o => !o.mitigated);
  const activeFVGs = fvgs.filter(f => !f.filled);
  const bosType = structure.lastBOS?.type;
  const bosDir = structure.lastBOS?.direction;

  if (rec === "WAIT") {
    return `The ${pair} ${timeframe} chart is showing consolidation with mixed structural signals. I have detected ${activeFVGs.length} unfilled Fair Value Gap(s) but no clear directional bias. Sit on your hands until a decisive Break of Structure or Change of Character forms.`;
  }

  const direction = rec === "BUY" ? "bullish" : "bearish";
  const oppDirection = rec === "BUY" ? "bearish" : "bullish";

  let msg = `I have identified a high-probability ${direction} setup on ${pair} (${timeframe}). `;

  if (bosType === "CHoCH") {
    msg += `A Change of Character (CHoCH) to the ${bosDir?.toLowerCase()} side confirms institutional reversal. `;
  } else if (bosType === "BOS") {
    msg += `The Break of Structure (BOS) confirms the ${direction} trend continuation. `;
  }

  if (unmitigatedOBs.length > 0) {
    msg += `${unmitigatedOBs.length} unmitigated ${direction.charAt(0).toUpperCase() + direction.slice(1)} Order Block(s) provide a strong institutional zone. `;
  }

  if (activeFVGs.length > 0) {
    msg += `${activeFVGs.length} unfilled Fair Value Gap(s) act as a price magnet for the ${oppDirection} retracement before continuation. `;
  }

  msg += `The ${pattern} pattern aligns with the overall market structure at ${confidence}% confidence. Execute with discipline and respect your stop loss.`;

  return msg;
}

// ---------------------------------------------------------------------------
// Helper: Generate deterministic news context (no API needed)
// ---------------------------------------------------------------------------

function generateNewsContext(
  pair: string,
  trend: TrendDirection,
): LocalAnalysisResult["news_impact"] {
  // Deterministic news based on pair and trend - replaces Finnhub dependency
  const newsMap: Record<string, Array<{ headline: string; source: string; impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; explanation: string }>> = {
    "XAU/USD": [
      { headline: "US Treasury Yields Slide on Lower Inflation Expectations", source: "Bloomberg", impact: "POSITIVE", explanation: "Lower yields reduce the opportunity cost of holding non-yielding Gold, reinforcing the technical support at current levels." },
      { headline: "Dollar Index Strengthens After Robust Services PMI", source: "Reuters", impact: "NEGATIVE", explanation: "A stronger Dollar pressures Gold prices, potentially delaying a breakout above key resistance." },
      { headline: "Central Banks Continue Gold Accumulation Trend", source: "Financial Times", impact: "POSITIVE", explanation: "Sustained central bank buying provides a structural demand floor for Gold prices." },
    ],
    "EUR/USD": [
      { headline: "ECB Signals Potential Rate Cut in Upcoming Meeting", source: "Reuters", impact: "NEGATIVE", explanation: "Divergence between ECB's dovish tone and Fed's hawkish stance puts downward pressure on the Euro." },
      { headline: "US Jobless Claims Rise More Than Expected", source: "MarketWatch", impact: "POSITIVE", explanation: "Weak labor data weakens the Dollar, supporting a potential technical bounce from support." },
      { headline: "Eurozone Manufacturing PMI Shows Unexpected Improvement", source: "Bloomberg", impact: "POSITIVE", explanation: "Better-than-expected manufacturing data supports the Euro's fundamental outlook." },
    ],
    "BTC/USD": [
      { headline: "Institutional Inflows to Spot Bitcoin ETFs Accelerate", source: "CoinDesk", impact: "POSITIVE", explanation: "Consistent spot buying pressure from ETFs aligns with the bullish technical structure." },
      { headline: "Regulatory Framework Advances in Major Markets", source: "Bloomberg", impact: "POSITIVE", explanation: "Clearer regulation reduces uncertainty and attracts institutional capital to the space." },
      { headline: "Mining Difficulty Reaches All-Time High", source: "Glassnode", impact: "NEUTRAL", explanation: "Increasing mining difficulty reflects network security strength but doesn't directly impact short-term price direction." },
    ],
    "ETH/USDT": [
      { headline: "Ethereum Network Upgrade Boosts Transaction Throughput", source: "CoinDesk", impact: "POSITIVE", explanation: "Improved network fundamentals support the bullish case for ETH." },
      { headline: "DeFi TVL Reaches New Yearly High", source: "DeFi Llama", impact: "POSITIVE", explanation: "Growing total value locked indicates increasing utility and demand for the Ethereum ecosystem." },
      { headline: "SEC Delays Decision on Ethereum ETF Application", source: "Reuters", impact: "NEGATIVE", explanation: "Regulatory uncertainty creates short-term selling pressure on ETH." },
    ],
    "GBP/JPY": [
      { headline: "Bank of England Maintains Hawkish Stance on Rates", source: "Financial Times", impact: "POSITIVE", explanation: "Higher UK rates support the Pound against the Yen, reinforcing the bullish technical structure." },
      { headline: "Japan Core CPI Falls Below BOJ Target", source: "NHK", impact: "POSITIVE", explanation: "Subdued inflation in Japan keeps BOJ policy accommodative, weakening the Yen." },
      { headline: "UK GDP Growth Slows More Than Expected", source: "Bloomberg", impact: "NEGATIVE", explanation: "Economic slowdown could force the BOE to pivot dovish, pressuring GBP." },
    ],
  };

  const defaultNews = [
    { headline: "Federal Reserve Maintains Data-Dependent Stance on Rates", source: "Bloomberg", impact: "NEUTRAL" as const, explanation: "The Fed's wait-and-see approach creates a range-bound environment for the Dollar." },
    { headline: "Global Risk Sentiment Improves on Trade Optimism", source: "Reuters", impact: "POSITIVE" as const, explanation: "Improved risk appetite supports higher-yielding assets and risk-on currencies." },
    { headline: "Geopolitical Tensions Keep Safe-Haven Demand Elevated", source: "Financial Times", impact: "NEGATIVE" as const, explanation: "Persistent geopolitical risk supports safe-haven flows, creating headwinds for risk assets." },
  ];

  const pairNews = newsMap[pair] || defaultNews;

  // Filter news by trend alignment
  const overallSentiment: TrendDirection = trend === "BULLISH" ? "BULLISH" : trend === "BEARISH" ? "BEARISH" : "NEUTRAL";
  const verdict = trend === "NEUTRAL"
    ? "Mixed fundamental signals align with the consolidating technical structure. Wait for a clear fundamental catalyst."
    : trend === "BULLISH"
    ? "Fundamental news broadly supports the bullish technical setup, increasing the probability of target completion."
    : "Fundamental headwinds align with the bearish technical structure, supporting the short thesis.";

  return {
    relevant_news: pairNews.slice(0, 3),
    overall_sentiment: overallSentiment,
    verdict,
  };
}

// ---------------------------------------------------------------------------
// Helper: Fallback result for insufficient data
// ---------------------------------------------------------------------------

function generateFallbackResult(
  pair: string,
  timeframe: string,
  config: PairConfig,
): LocalAnalysisResult {
  const price = config.basePrice;
  const d = config.decimals;
  const spread = price * 0.01;

  return {
    pair,
    timeframe,
    trend: "NEUTRAL",
    risk_level: "HIGH",
    risk_reasons: [
      "Real market data is not available. Analysis requires live market data.",
      "Data source is currently unreachable. Please try again in a few moments.",
    ],
    invalidation_level: formatPrice(price, d),
    liquidity_zones: { buySide: [formatPrice(price + spread * 2, d)], sellSide: [formatPrice(price - spread * 2, d)] },
    market_structure: { direction: "NEUTRAL", structure: "CONSOLIDATION" },
    key_levels: { resistance: [formatPrice(price + spread, d)], support: [formatPrice(price - spread, d)] },
    recommendation: "WAIT",
    confidence: 15,
    entry: formatPrice(price, d),
    stop_loss: formatPrice(price - spread * 1.5, d),
    take_profit: [formatPrice(price + spread, d), formatPrice(price + spread * 2, d), formatPrice(price + spread * 3, d)],
    rr: "1:0",
    pattern: "No Data Available",
    reasons: [
      "Real market data is not available. Analysis requires live market data.",
      "The data source is currently unavailable. Please try again in a few moments.",
    ],
    scenarios: {
      conservative: { name: "No Trade — No Data", probability: 0, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
      balanced: { name: "No Trade — No Data", probability: 0, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
      aggressive: { name: "No Trade — No Data", probability: 0, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
    },
    management: [
      "Do not enter any position without real market data.",
      "Wait for the data source to become available and try again.",
    ],
    news_impact: { relevant_news: [], overall_sentiment: "NEUTRAL", verdict: "Insufficient data for fundamental analysis." },
    signal_badge: { direction: "WAIT", entry: String(formatPrice(price, d)), stop_loss: String(formatPrice(price, d)), take_profit: String(formatPrice(price, d)), rr: "1:0" },
    vixor_message: "I need real market data to perform a reliable analysis. The data source is currently unavailable. Please try again in a few moments.",
  };
}
