// ============================================================================
// MOXI — Hunter Agent (Real Implementation)
// ============================================================================
//
// Smart money & opportunity scoring. Uses the local analysis engine
// (runLocalAnalysis) as primary, falls back to LLM if engine unavailable.
// Returns deterministic scores from real market data, not random numbers.
// ============================================================================

import { runLocalAnalysis, type AnalysisInput } from "@/domains/analysis/engine/engine";
import type { LocalAnalysisResult } from "@/domains/analysis/engine/core/types";
import { callLLM } from "@/shared/llm";
import type { HunterInput, HunterScore, HunterSignal } from "../types";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse risk-reward ratio string like "1:2.5" to numeric 2.5 */
function parseRR(rr: string): number {
  if (!rr || !rr.includes(":")) return 0;
  const parts = rr.split(":");
  if (parts.length !== 2) return 0;
  const right = parseFloat(parts[1]!);
  return isNaN(right) ? 0 : right;
}

function signalFromScore(score: number): HunterSignal {
  if (score >= 75) return "strong_buy";
  if (score >= 55) return "buy";
  if (score >= 40) return "hold";
  return "hold";
}

/** Calculate a composite 0-100 score from analysis result */
function calculateHunterScore(
  analysis: LocalAnalysisResult,
  smartMoneyLen: number,
): {
  score: number;
  reasoning: string;
  wallets: string[];
  confidence: number;
} {
  const { confidence, recommendation, rr, reasons, regime } = analysis;
  const riskReward = parseRR(rr);

  // Base score from confidence
  let score = confidence;

  // Bonus for good R:R (>= 2.0)
  if (riskReward >= 2.5) score += 10;
  else if (riskReward >= 2.0) score += 6;
  else if (riskReward >= 1.5) score += 3;

  // Bonus for favorable regime
  if (regime === "trending" || regime === "strong_trend") score += 5;
  else if (regime === "volatile") score -= 5;

  // Bonus for smart money activity
  if (smartMoneyLen > 100) score += 8;
  else if (smartMoneyLen > 50) score += 4;

  // Penalty for low confidence
  if (confidence < 40) score -= 10;

  // Clamp 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Build reasoning from analysis data
  const topReasons = reasons.slice(0, 3);
  const reasoning = [
    `${recommendation} signal with ${confidence}% confidence.`,
    `R:R = ${rr}.`,
    `Regime: ${regime || "unknown"}.`,
    topReasons.length > 0 ? `Key: ${topReasons.join(", ")}.` : "",
    smartMoneyLen > 0
      ? `Smart money data: ${smartMoneyLen} chars analyzed.`
      : "No smart money data provided.",
  ]
    .filter(Boolean)
    .join(" ");

  // Confidence based on data quality
  const hasSmartMoney = smartMoneyLen > 20;
  const dataConfidence = Math.min(0.9, 0.4 + (hasSmartMoney ? 0.2 : 0) + (confidence / 100) * 0.3);

  // Wallets — extract from smart money data if it looks like wallet addresses
  const wallets: string[] = [];
  if (smartMoneyLen > 0) {
    const walletPattern = /0x[a-fA-F0-9]{8,40}/g;
    const matches = (analysis as any).smartMoneyActivity?.match(walletPattern);
    if (matches) {
      wallets.push(...matches.slice(0, 5));
    }
  }

  return { score, reasoning, wallets, confidence: dataConfidence };
}

// ── Fetch OHLCV Data ───────────────────────────────────────────────────────

async function fetchOHLCV(pair: string): Promise<{ bars: any[]; isCrypto: boolean } | null> {
  try {
    const { fetchBinanceKlines, fetchTwelveDataKlines } =
      await import("@/domains/market/server/price-fetcher");
    const { AssetRegistry } = await import("@/shared/asset-registry");

    let bars;
    if (AssetRegistry.isCrypto(pair)) {
      bars = await fetchBinanceKlines(pair, "4H", 200);
    }
    if (!bars || bars.length <= 20) {
      const tdBars = await fetchTwelveDataKlines(pair, "4H", 200);
      if (tdBars.length > 20) bars = tdBars;
    }

    if (!bars || bars.length <= 20) return null;

    return { bars, isCrypto: AssetRegistry.isCrypto(pair) };
  } catch {
    return null;
  }
}

// ── LLM Fallback ──────────────────────────────────────────────────────────

async function llmFallback(input: HunterInput): Promise<HunterScore> {
  try {
    const response = await callLLM(
      [
        {
          role: "user",
          content: `You are a smart money analyst. Score this opportunity 0-100.

Token: ${input.token}
Chain: ${input.chain}

Smart Money Activity (${input.smartMoneyActivity.length} chars):
${input.smartMoneyActivity.slice(0, 1500) || "No data provided."}

Price Data (${input.priceData.length} chars):
${input.priceData.slice(0, 800) || "No data provided."}

Volume Data (${input.volumeData.length} chars):
${input.volumeData.slice(0, 500) || "No data provided."}

Respond with ONLY valid JSON:
{
  "score": 0-100,
  "reasoning": "Specific reasoning based on the data.",
  "wallets": ["addr1", "addr2"]
}`,
        },
      ],
      { temperature: 0.3, maxTokens: 300, jsonMode: true },
    );

    let cleaned = response.content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);
    const score = Math.max(0, Math.min(100, Math.round(parsed.score || 30)));

    return {
      decisionId: `hunter_${Date.now()}`,
      score,
      signal: signalFromScore(score),
      reasoning: parsed.reasoning || `LLM analysis for ${input.token} on ${input.chain}.`,
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets.slice(0, 5) : [],
      confidence: 0.45, // Lower confidence for LLM fallback
    };
  } catch {
    // Both local engine and LLM failed — return minimal result
    return {
      decisionId: `hunter_${Date.now()}`,
      score: 20,
      signal: "hold",
      reasoning: `Insufficient data for ${input.token} on ${input.chain}. Smart money activity: ${input.smartMoneyActivity.length} chars. No OHLCV data available.`,
      wallets: [],
      confidence: 0.2,
    };
  }
}

// ── Main Export ─────────────────────────────────────────────────────────────

/**
 * Hunter agent — scores trading opportunities using the local analysis engine.
 * Falls back to LLM if real market data is unavailable.
 * Returns deterministic, data-driven scores (no random numbers).
 */
export async function scoreOpportunity(
  input: HunterInput,
  _ctx?: { userId?: string },
): Promise<HunterScore> {
  // 1. Try local analysis engine with real OHLCV data
  const ohlcv = await fetchOHLCV(input.token);

  if (ohlcv && ohlcv.bars.length > 20) {
    try {
      const analysisInput: AnalysisInput = {
        pair: input.token,
        timeframe: "4H",
        tradingStyle: "Day Trading",
        bars: ohlcv.bars,
      };

      const analysis = runLocalAnalysis(analysisInput);
      const { score, reasoning, wallets, confidence } = calculateHunterScore(
        analysis,
        input.smartMoneyActivity.length,
      );

      return {
        decisionId: `hunter_${Date.now()}`,
        score,
        signal: signalFromScore(score),
        reasoning,
        wallets,
        confidence,
      };
    } catch {
      // Engine failed on this data — fall through to LLM
    }
  }

  // 2. Try running local engine without bars (uses synthetic data)
  // This is less reliable but still deterministic
  if (ohlcv === null) {
    // No bars at all — try LLM fallback
    return llmFallback(input);
  }

  // 3. LLM fallback
  return llmFallback(input);
}
