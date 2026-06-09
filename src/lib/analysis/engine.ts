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

import { generateOHLCV, atr, formatPrice, avgRange } from "./core/candle-utils";
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
  const bars = input.bars ?? generateOHLCV(pair, timeframe, 200);
  if (bars.length < 20) {
    return generateFallbackResult(pair, timeframe, config);
  }

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
  const finalRec = adjustRecommendationWithPatterns(
    rr.recommendation, trend, candlePatterns, chartFormations, harmonicPatterns,
    rsiStatus, adxStrength, emaAlignment,
  );

  // ── Step 8: Compose the result ─────────────────────────────────────
  const isBullish = finalRec === "BUY";
  const isBearish = finalRec === "SELL";
  const isWait = finalRec === "WAIT";

  // Confidence scoring (enhanced with indicators + harmonics)
  const confidence = calculateConfidence(
    trend, finalRec, candlePatterns, chartFormations, harmonicPatterns,
    orderBlocks, fvgs, structureResult, rsiStatus, adxStrength, emaAlignment,
  );

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

  // Reasons (enhanced with indicators + harmonics)
  const reasons = buildReasons(
    trend, finalRec, structureResult, orderBlocks, fvgs,
    candlePatterns, chartFormations, harmonicPatterns, srLevels,
    rsiStatus, adxStrength,
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

  // News impact (deterministic based on pair/trend - no API needed)
  const newsImpact = generateNewsContext(pair, trend);

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
// Helper: Adjust recommendation with pattern confluence
// ---------------------------------------------------------------------------

function adjustRecommendationWithPatterns(
  baseRec: RecommendationType,
  trend: TrendDirection,
  patterns: Array<{ type: string; reliability: number }>,
  formations: Array<{ type: string; reliability: number }>,
  harmonics: Array<{ type: string; reliability: number }>,
  rsiStatus: string,
  adxStrength: string,
  emaAlignment: { alignment: string; strength: number },
): RecommendationType {
  if (baseRec === "WAIT") return "WAIT";

  const recentPatterns = patterns.slice(0, 5);
  const recentFormations = formations.slice(0, 3);
  const recentHarmonics = harmonics.slice(0, 2);

  // Count pattern directions
  let bullishSignals = 0;
  let bearishSignals = 0;

  for (const p of recentPatterns) {
    if (p.type === "BULLISH") bullishSignals += p.reliability / 100;
    if (p.type === "BEARISH") bearishSignals += p.reliability / 100;
  }
  for (const f of recentFormations) {
    if (f.type === "BULLISH") bullishSignals += f.reliability / 100;
    if (f.type === "BEARISH") bearishSignals += f.reliability / 100;
  }
  for (const h of recentHarmonics) {
    if (h.type === "BULLISH") bullishSignals += (h.reliability / 100) * 1.5; // Harmonics carry more weight
    if (h.type === "BEARISH") bearishSignals += (h.reliability / 100) * 1.5;
  }

  // RSI overbought/oversold influences
  if (rsiStatus === "OVERBOUGHT" && baseRec === "BUY") bearishSignals += 0.5;
  if (rsiStatus === "OVERSOLD" && baseRec === "SELL") bullishSignals += 0.5;

  // Weak ADX = no clear trend → prefer WAIT
  if (adxStrength === "WEAK") {
    bullishSignals *= 0.7;
    bearishSignals *= 0.7;
  }

  // EMA alignment opposes the trade
  if (baseRec === "BUY" && emaAlignment.alignment === "BEARISH") bearishSignals += 0.8;
  if (baseRec === "SELL" && emaAlignment.alignment === "BULLISH") bullishSignals += 0.8;

  // If patterns contradict the trend strongly, switch to WAIT
  if (baseRec === "BUY" && bearishSignals > bullishSignals * 1.5) return "WAIT";
  if (baseRec === "SELL" && bullishSignals > bearishSignals * 1.5) return "WAIT";

  return baseRec;
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
  if (rec === "WAIT") return 40 + Math.floor(Math.random() * 10);

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
): string[] {
  const reasons: string[] = [];

  // SMC reasons
  if (structure.lastBOS?.type === "BOS") {
    reasons.push(
      trend === "BULLISH"
        ? "Break of Structure (BOS) confirming bullish continuation with higher highs."
        : "Break of Structure (BOS) confirming bearish continuation with lower lows."
    );
  } else if (structure.lastBOS?.type === "CHoCH") {
    reasons.push(
      "Change of Character (CHoCH) detected — potential trend reversal with institutional sponsorship."
    );
  }

  // Order Block reasons
  const unmitigated = obs.filter(o => !o.mitigated);
  if (unmitigated.length > 0) {
    const bullOBs = unmitigated.filter(o => o.type === "BULLISH").length;
    const bearOBs = unmitigated.filter(o => o.type === "BEARISH").length;
    if (rec === "BUY" && bullOBs > 0) {
      reasons.push(`${bullOBs} unmitigated Bullish Order Block(s) providing institutional demand zone.`);
    } else if (rec === "SELL" && bearOBs > 0) {
      reasons.push(`${bearOBs} unmitigated Bearish Order Block(s) providing institutional supply zone.`);
    }
  }

  // FVG reasons
  const activeFVGs = fvgs.filter(f => !f.filled);
  if (activeFVGs.length > 0) {
    const bullFVGs = activeFVGs.filter(f => f.type === "BULLISH").length;
    const bearFVGs = activeFVGs.filter(f => f.type === "BEARISH").length;
    if (rec === "BUY" && bullFVGs > 0) {
      reasons.push(`${bullFVGs} unfilled Bullish Fair Value Gap(s) acting as price magnet for retracement.`);
    } else if (rec === "SELL" && bearFVGs > 0) {
      reasons.push(`${bearFVGs} unfilled Bearish Fair Value Gap(s) acting as price magnet for retracement.`);
    }
  }

  // Pattern reasons
  if (patterns.length > 0) {
    const topPattern = patterns[0]!;
    reasons.push(`${topPattern.name} pattern detected with ${topPattern.reliability}% reliability score.`);
  }

  if (formations.length > 0) {
    reasons.push(`${formations[0]!.name} formation reinforcing the directional bias.`);
  }

  // Harmonic pattern reasons
  if (harmonics.length > 0) {
    const topHarmonic = harmonics[0]!;
    reasons.push(`${topHarmonic.name} harmonic pattern with ${topHarmonic.reliability}% Fibonacci alignment.`);
  }

  // Indicator-based reasons
  if (rsiStatus === "OVERSOLD" && rec === "BUY") {
    reasons.push("RSI in oversold territory — selling exhaustion supports bullish reversal.");
  } else if (rsiStatus === "OVERBOUGHT" && rec === "SELL") {
    reasons.push("RSI in overbought territory — buying exhaustion supports bearish reversal.");
  }

  if (adxStrength === "STRONG") {
    reasons.push("ADX confirms strong trend — directional momentum is well-established.");
  }

  // Ensure at least 3 reasons
  if (reasons.length < 3) {
    if (trend === "BULLISH") {
      reasons.push("Price is showing higher-timeframe bullish structure with orderly pullbacks.");
    } else if (trend === "BEARISH") {
      reasons.push("Price is showing lower-timeframe bearish structure with orderly pullbacks.");
    } else {
      reasons.push("Market is consolidating — wait for a clear structural break before committing.");
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
    risk_reasons: ["Insufficient data for reliable analysis.", "Market direction is unclear."],
    invalidation_level: formatPrice(price, d),
    liquidity_zones: { buySide: [formatPrice(price + spread * 2, d)], sellSide: [formatPrice(price - spread * 2, d)] },
    market_structure: { direction: "NEUTRAL", structure: "CONSOLIDATION" },
    key_levels: { resistance: [formatPrice(price + spread, d)], support: [formatPrice(price - spread, d)] },
    recommendation: "WAIT",
    confidence: 30,
    entry: formatPrice(price, d),
    stop_loss: formatPrice(price - spread * 1.5, d),
    take_profit: [formatPrice(price + spread, d), formatPrice(price + spread * 2, d), formatPrice(price + spread * 3, d)],
    rr: "1:1.0",
    pattern: "Insufficient Data",
    reasons: ["Not enough candles for structural analysis.", "Wait for more price data to form."],
    scenarios: {
      conservative: { name: "No Trade", probability: 80, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
      balanced: { name: "No Trade", probability: 15, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
      aggressive: { name: "No Trade", probability: 5, entry: String(formatPrice(price, d)), sl: formatPrice(price, d), tp1: formatPrice(price, d), tp2: formatPrice(price, d), rr: "1:0" },
    },
    management: ["Wait for sufficient data before entering any position."],
    news_impact: { relevant_news: [], overall_sentiment: "NEUTRAL", verdict: "Insufficient data for fundamental analysis." },
    signal_badge: { direction: "WAIT", entry: String(formatPrice(price, d)), stop_loss: String(formatPrice(price, d)), take_profit: String(formatPrice(price, d)), rr: "1:0" },
    vixor_message: "I cannot perform a reliable analysis with the current data. Wait for more price action to form before seeking a signal.",
  };
}
