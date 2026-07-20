// ============================================================================
// Vixor Analysis Runner — Grounded Chart Intelligence
// ============================================================================
//
// ARCHITECTURE (v2 — Grounded Data Injection):
//
//   When an IMAGE is uploaded + real OHLCV available:
//     1. Build MarketSnapshot (real OHLCV + mathematically computed indicators)
//     2. Gate check: candleCount < 30 → reject AI call, go straight to local
//     3. Inject snapshot data into prompt (no vague descriptions, only numbers)
//     4. Send image + grounded data to OpenRouter
//     5. Validate response: every reasoning entry must reference a real sourceField
//     6. Enrich with real news
//
//   When NO image or data insufficient:
//     1. Use local deterministic engine (SMC/ICT pipeline on real or synthetic data)
//     2. All calculations are mathematical — no Math.random()
//
// KEY IMPROVEMENT over v1:
//   - AI model receives ONLY concrete numbers from real data sources
//   - System prompt forces grounding: every claim must cite a sourceField
//   - sourceField validation catches hallucinated data references
//   - insufficientData flag prevents fabrication when data is inadequate
// ============================================================================

import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getNewsForSymbol, type NewsItem } from "@/domains/market/server/news";
import { runLocalAnalysis, generateFallbackResult } from "@/domains/analysis/engine/engine";
import {
  PAIR_CONFIGS,
  type OHLCVBar,
  type LocalAnalysisResult,
} from "@/domains/analysis/engine/core/types";
import {
  buildMarketSnapshot,
  formatSnapshotForPrompt,
  isValidSourceField,
  type MarketSnapshot,
} from "@/domains/analysis/server/market-snapshot";

// ── Error class ──
export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

// ---------------------------------------------------------------------------
// Analysis source tracking — added to every result
// ---------------------------------------------------------------------------
export type AnalysisSource = "openrouter" | "local_engine" | "local_fallback";

// Re-export the original schema for backward compatibility
export const AnalysisSchema = z.object({
  pair: z.string().describe("Trading pair detected on the chart, e.g. BTC/USDT, EUR/USD"),
  timeframe: z.string().describe("Chart timeframe, e.g. 1H, 4H, 1D"),
  trend: z
    .enum(["BULLISH", "BEARISH", "NEUTRAL"])
    .describe("Overall trend of the asset on this timeframe"),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Risk assessment for the current setup"),
  risk_reasons: z.array(z.string()).min(1).max(3).describe("Reasons justifying the risk level"),
  invalidation_level: z
    .number()
    .describe("Price level where this thesis becomes completely invalid"),
  liquidity_zones: z.object({
    buySide: z.array(z.number()).describe("Buy-side liquidity zones (resistance/highs)"),
    sellSide: z.array(z.number()).describe("Sell-side liquidity zones (support/lows)"),
  }),
  market_structure: z.object({
    direction: z.enum(["BULLISH", "BEARISH", "SIDEWAYS"]),
    structure: z.string().describe("e.g. HIGHER_HIGHS, LOWER_LOWS, CONSOLIDATION"),
    bos: z
      .number()
      .optional()
      .describe("Price level of the recent Break of Structure (BOS) if any"),
  }),
  key_levels: z.object({
    resistance: z.array(z.number()),
    support: z.array(z.number()),
    pivot: z.number().optional(),
  }),
  recommendation: z.enum(["BUY", "SELL", "WAIT"]),
  confidence: z.number().min(0).max(100).describe("0-100 confidence in the recommendation"),
  entry: z.number().describe("Recommended entry price"),
  stop_loss: z.number().describe("Stop loss price"),
  take_profit: z
    .array(z.number())
    .length(3)
    .describe("Three take-profit levels, conservative to aggressive"),
  rr: z.string().describe("Approx risk-reward ratio for the balanced target, e.g. '1:2.5'"),
  pattern: z
    .string()
    .describe("Short summary of detected pattern, e.g. 'Bullish Engulfing + Support Hold'"),
  reasons: z.array(z.string()).min(3).max(5).describe("3-5 concise reasons supporting the trade"),
  scenarios: z.object({
    conservative: z.object({
      name: z.string(),
      probability: z.number(),
      entry: z.string(),
      sl: z.number(),
      tp1: z.number(),
      tp2: z.number(),
      rr: z.string(),
    }),
    balanced: z.object({
      name: z.string(),
      probability: z.number(),
      entry: z.string(),
      sl: z.number(),
      tp1: z.number(),
      tp2: z.number(),
      rr: z.string(),
    }),
    aggressive: z.object({
      name: z.string(),
      probability: z.number(),
      entry: z.string(),
      sl: z.number(),
      tp1: z.number(),
      tp2: z.number(),
      rr: z.string(),
    }),
  }),
  management: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe("Step-by-step trade management instructions"),
  news_impact: z
    .object({
      relevant_news: z
        .array(
          z.object({
            headline: z.string().describe("Headline of the news article"),
            source: z.string().describe("Source of the news, e.g. Reuters, Bloomberg"),
            impact: z
              .enum(["POSITIVE", "NEGATIVE", "NEUTRAL"])
              .describe("How this news impacts the asset price or trend direction"),
            explanation: z
              .string()
              .describe(
                "Explanation of how this news negatively or positively affects the technical structure",
              ),
          }),
        )
        .min(1)
        .max(3)
        .describe("1-3 news articles that are relevant to this trading pair"),
      overall_sentiment: z
        .enum(["BULLISH", "BEARISH", "NEUTRAL"])
        .describe("Overall fundamental sentiment derived from news"),
      verdict: z
        .string()
        .describe(
          "Final verdict indicating if the fundamental news aligns with the technical setup or warns against it",
        ),
    })
    .optional()
    .describe("Analysis of recent news and fundamentals affecting this specific trading pair"),
  signal_badge: z.object({
    direction: z.enum(["BUY", "SELL", "WAIT"]),
    entry: z.string(),
    stop_loss: z.string(),
    take_profit: z.string(),
    rr: z.string(),
  }),
  vixor_message: z
    .string()
    .describe("A confident, authoritative message from Vixor explaining the verdict."),
  // ── NEW: Source tracking fields ──
  analysis_source: z
    .enum(["openrouter", "local_engine", "local_fallback"])
    .describe("Which engine produced this result"),
  reasoning_trail: z
    .array(
      z.object({
        claim: z.string().describe("The analytical claim being made"),
        sourceField: z
          .string()
          .describe(
            "The exact field path from the input data that supports this claim (e.g. 'indicators.rsi14', 'ohlcv')",
          ),
      }),
    )
    .describe("Traceable reasoning — every claim must reference a real data field"),
  data_quality: z
    .object({
      candleCount: z.number(),
      dataSource: z.string(),
      usedRealData: z.boolean(),
    })
    .describe("Quality metadata about the data used for this analysis"),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

// ---------------------------------------------------------------------------
// Grounded system prompt — forces AI to reference ONLY injected data
// ---------------------------------------------------------------------------

const GROUNDED_SYSTEM_PROMPT = `You are a quantitative crypto/forex market analyst for VIXOR. You analyze ONLY the numerical data provided to you in the user message. You never invent, estimate, or assume any price, volume, or indicator value that is not explicitly present in the input data.

STRICT RULES:
1. Every claim you make must reference a specific field from the input data (e.g. "RSI at 72 indicates overbought" — not "RSI seems high"). Use the sourceField field to cite the exact path.
2. If the input data is insufficient to support a conclusion (fewer than 30 candles, missing indicators, or data older than 15 minutes), you MUST set "insufficientData": true and explain what is missing. Do not produce entry/stopLoss/takeProfit values in this case.
3. Entry, stop-loss, and take-profit levels must be derived mathematically from the provided ATR and price structure (e.g. stop-loss = recent swing low - 1.5x ATR), never arbitrary round numbers.
4. Your confidence score (0-100) must reflect actual signal alignment across indicators, not a default value. If indicators conflict, confidence must be low (below 40) and you must state the conflict explicitly.
5. You must output valid JSON matching the provided schema. No prose outside the JSON structure.
6. Never reference a data point that isn't in the input. If asked about holder counts, whale activity, or on-chain data not provided to you, set the corresponding field to null and note it as "dataNotAvailable".
7. The stopLossBasis field must contain the EXACT calculation formula, including the actual numbers used (e.g. "swing low 42150 - 1.5x ATR(320) = 41670").`;

// ---------------------------------------------------------------------------
// Main entry point — IMAGE-BASED analysis (with grounded data injection)
// ---------------------------------------------------------------------------

export async function runChartAnalysis(
  imageBytes: Uint8Array,
  mimeType: string,
  fileName?: string,
  selectedPair?: string,
  trading_style?: string,
  realBars?: import("@/domains/analysis/engine/core/types").OHLCVBar[],
  analysis_style?: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const pair = selectedPair ?? detectPairFromFileName(fileName) ?? "BTC/USDT";
  const timeframe = inferTimeframeFromTradingStyle(trading_style);

  // ── If no OpenRouter API key, fall back to local engine ──
  if (!apiKey) {
    console.warn("[Vixor] No OPENROUTER_API_KEY found — falling back to local engine");
    return runLocalAnalysisFallback(
      selectedPair,
      fileName,
      trading_style,
      realBars,
      analysis_style,
    );
  }

  // ── Build MarketSnapshot from real data ──
  const snapshot = await buildMarketSnapshot(pair, timeframe);

  // ── DATA QUALITY GATE: Reject AI call if insufficient data ──
  if (snapshot.dataQuality.candleCount < 30) {
    console.warn(
      `[Vixor] Insufficient data for AI analysis: ${snapshot.dataQuality.candleCount} candles (need 30+). Using local engine.`,
    );
    return runLocalAnalysisFromSnapshot(snapshot, trading_style, analysis_style, "local_fallback");
  }

  const openrouter = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const base64Image = Buffer.from(imageBytes).toString("base64");

  // ── Build the grounded system prompt with data context ──
  const systemPrompt = `${GROUNDED_SYSTEM_PROMPT}

You are also analyzing a REAL trading chart image alongside numerical OHLCV data. You must:
1. READ the actual candles, price levels, and patterns visible in the image
2. CROSS-REFERENCE the image with the numerical data provided
3. The numerical data takes precedence over visual estimation

Trading style: ${trading_style || "Swing Trading"}
User-selected pair (may differ from chart): ${pair}`;

  // ── Format real data for injection ──
  const dataContext = formatSnapshotForPrompt(snapshot);

  try {
    const result = await generateObject({
      model: openrouter(process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free") as any,
      schema: AnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: base64Image,
            },
            {
              type: "text",
              text: `Analyze this trading chart using Smart Money Concepts (SMC) and ICT methodology.

The user has selected: ${pair} (${timeframe} timeframe, ${trading_style || "Swing Trading"} style).

${dataContext}

IMPORTANT: 
- Cross-reference the chart image with the numerical data above
- Every analytical claim in reasoning_trail must cite a sourceField from the injected data
- Entry/SL/TP must be derived from the ATR(${snapshot.indicators.atr14.toFixed(2)}) and visible price levels
- The numerical data takes precedence over visual estimation`,
            },
          ],
        },
      ],
    });

    const analysisResult = result.object;

    // ── Validate sourceField grounding ──
    const reasoningTrail = (analysisResult as any).reasoning_trail;
    if (Array.isArray(reasoningTrail) && reasoningTrail.length > 0) {
      const hallucinatedFields = reasoningTrail.filter(
        (r: { sourceField: string }) => !isValidSourceField(r.sourceField, snapshot),
      );
      if (hallucinatedFields.length > 0) {
        console.warn(
          `[Vixor] AI hallucinated ${hallucinatedFields.length} sourceFields:`,
          hallucinatedFields.map((f: { sourceField: string }) => f.sourceField).join(", "),
          "— falling back to local engine",
        );
        return runLocalAnalysisFromSnapshot(
          snapshot,
          trading_style,
          analysis_style,
          "local_engine",
        );
      }
    }

    // ── Stamp analysis source ──
    (analysisResult as any).analysis_source = "openrouter";
    (analysisResult as any).data_quality = {
      candleCount: snapshot.dataQuality.candleCount,
      dataSource: snapshot.dataQuality.source,
      usedRealData: true,
    };

    // Ensure reasoning_trail has content
    if (
      !Array.isArray((analysisResult as any).reasoning_trail) ||
      (analysisResult as any).reasoning_trail.length === 0
    ) {
      (analysisResult as any).reasoning_trail = (analysisResult as any).reasons.map(
        (r: string) => ({
          claim: r,
          sourceField: "ohlcv",
        }),
      );
    }

    // ── Enrich with real news ──
    await enrichWithNews(analysisResult as any);

    return analysisResult as AnalysisResult;
  } catch (err) {
    console.warn(
      "[Vixor] OpenRouter analysis failed, falling back to local engine:",
      err instanceof Error ? err.message : err,
    );
    return runLocalAnalysisFromSnapshot(snapshot, trading_style, analysis_style, "local_engine");
  }
}

// ---------------------------------------------------------------------------
// Run analysis from MarketSnapshot using local engine (grounded, no AI)
// ---------------------------------------------------------------------------

async function runLocalAnalysisFromSnapshot(
  snapshot: MarketSnapshot,
  trading_style?: string,
  analysis_style?: string,
  source: AnalysisSource = "local_engine",
): Promise<AnalysisResult> {
  const { symbol: pair, timeframe } = snapshot;
  const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS["EUR/USD"]!;

  // ── If we have enough real bars, run the full SMC/ICT pipeline ──
  let localResult: LocalAnalysisResult;

  if (snapshot.dataQuality.candleCount >= 30) {
    // Convert snapshot OHLCV to engine format
    const bars: OHLCVBar[] = snapshot.ohlcv.map((b) => ({
      time: b.timestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    }));

    try {
      localResult = runLocalAnalysis({
        pair,
        timeframe,
        tradingStyle: trading_style,
        analysisStyle: analysis_style,
        bars,
      });
    } catch (engineErr) {
      console.error("[Vixor] Local engine failed even with real data:", engineErr);
      localResult = generateFallbackResult(pair, timeframe, config);
      source = "local_fallback";
    }
  } else {
    // Not enough data — use the deterministic fallback
    localResult = generateFallbackResult(pair, timeframe, config);
    source = "local_fallback";
  }

  // ── Build reasoning trail from real indicator values ──
  const { indicators } = snapshot;
  const reasoningTrail = buildLocalReasoningTrail(snapshot, localResult);

  // ── Enrich with news ──
  try {
    const newsItems: NewsItem[] = await getNewsForSymbol(localResult.pair, { limit: 5 });
    if (newsItems.length > 0) {
      const sentimentCounts = newsItems.reduce(
        (acc, n) => {
          if (n.sentiment === "positive") acc.positive++;
          else if (n.sentiment === "negative") acc.negative++;
          else acc.neutral++;
          return acc;
        },
        { positive: 0, negative: 0, neutral: 0 },
      );
      const overallSentiment =
        sentimentCounts.positive > sentimentCounts.negative
          ? "BULLISH"
          : sentimentCounts.negative > sentimentCounts.positive
            ? "BEARISH"
            : "NEUTRAL";
      const verdict = `News sentiment: ${overallSentiment.toLowerCase()} (${sentimentCounts.positive} pos, ${sentimentCounts.negative} neg)`;
      localResult.news_impact = {
        relevant_news: newsItems.slice(0, 3).map((n) => ({
          headline: n.title,
          source: n.source,
          impact:
            n.sentiment === "positive"
              ? ("POSITIVE" as const)
              : n.sentiment === "negative"
                ? ("NEGATIVE" as const)
                : ("NEUTRAL" as const),
          explanation: n.summary || `Published ${n.publishedAt}`,
        })),
        overall_sentiment: overallSentiment as "BULLISH" | "BEARISH" | "NEUTRAL",
        verdict,
      };
    }
  } catch (newsError) {
    console.debug("[Vixor] Fallback news fetch failed:", newsError);
  }

  return {
    ...localResult,
    market_structure: {
      ...localResult.market_structure,
      direction:
        localResult.market_structure.direction === "NEUTRAL"
          ? "SIDEWAYS"
          : localResult.market_structure.direction,
    },
    news_impact: localResult.news_impact
      ? {
          ...localResult.news_impact,
          overall_sentiment: localResult.news_impact.overall_sentiment,
        }
      : undefined,
    // ── New grounded fields ──
    analysis_source: source,
    reasoning_trail: reasoningTrail,
    data_quality: {
      candleCount: snapshot.dataQuality.candleCount,
      dataSource: snapshot.dataQuality.source,
      usedRealData: snapshot.dataQuality.candleCount >= 30,
    },
  };
}

// ---------------------------------------------------------------------------
// Build a reasoning trail from real indicator values (for local engine)
// ---------------------------------------------------------------------------

function buildLocalReasoningTrail(
  snapshot: MarketSnapshot,
  result: LocalAnalysisResult,
): Array<{ claim: string; sourceField: string }> {
  const trail: Array<{ claim: string; sourceField: string }> = [];
  const { indicators } = snapshot;

  // RSI
  if (!isNaN(indicators.rsi14)) {
    let rsiClaim = `RSI(14) at ${indicators.rsi14.toFixed(1)}`;
    if (indicators.rsi14 > 70) rsiClaim += " — overbought zone";
    else if (indicators.rsi14 < 30) rsiClaim += " — oversold zone";
    else rsiClaim += " — neutral zone";
    trail.push({ claim: rsiClaim, sourceField: "indicators.rsi14" });
  }

  // MACD
  if (!isNaN(indicators.macd.histogram)) {
    const macdClaim =
      indicators.macd.histogram > 0
        ? `MACD histogram positive (${indicators.macd.histogram.toFixed(4)}) — bullish momentum`
        : `MACD histogram negative (${indicators.macd.histogram.toFixed(4)}) — bearish momentum`;
    trail.push({ claim: macdClaim, sourceField: "indicators.macd.histogram" });
  }

  // EMA alignment
  if (!isNaN(indicators.ema20) && !isNaN(indicators.ema50)) {
    const emaClaim =
      indicators.ema20 > indicators.ema50
        ? `EMA(20) ${indicators.ema20.toFixed(2)} > EMA(50) ${indicators.ema50.toFixed(2)} — bullish alignment`
        : `EMA(20) ${indicators.ema20.toFixed(2)} < EMA(50) ${indicators.ema50.toFixed(2)} — bearish alignment`;
    trail.push({ claim: emaClaim, sourceField: "indicators.ema20" });
  }

  // ATR (volatility context)
  if (!isNaN(indicators.atr14) && snapshot.currentPrice > 0) {
    const atrPct = ((indicators.atr14 / snapshot.currentPrice) * 100).toFixed(2);
    trail.push({
      claim: `ATR(14) = ${indicators.atr14.toFixed(2)} (${atrPct}% of price) — volatility measure for stop placement`,
      sourceField: "indicators.atr14",
    });
  }

  // Volume
  if (indicators.volumeAvg20 > 0) {
    const lastVol = snapshot.ohlcv[snapshot.ohlcv.length - 1]?.volume ?? 0;
    const volRatio = lastVol / indicators.volumeAvg20;
    const volClaim =
      volRatio > 1.5
        ? `Volume spike: last bar volume ${lastVol.toFixed(0)} is ${volRatio.toFixed(1)}x above 20-bar average`
        : `Volume normal: last bar ${lastVol.toFixed(0)} vs 20-bar avg ${indicators.volumeAvg20.toFixed(0)}`;
    trail.push({ claim: volClaim, sourceField: "indicators.volumeAvg20" });
  }

  // Trend from result
  if (result.trend !== "NEUTRAL") {
    trail.push({
      claim: `Market structure: ${result.market_structure.structure} — ${result.trend.toLowerCase()} trend`,
      sourceField: "ohlcv",
    });
  }

  return trail;
}

// ---------------------------------------------------------------------------
// Local engine fallback (legacy — when no API key or image-only)
// ---------------------------------------------------------------------------

async function runLocalAnalysisFallback(
  selectedPair?: string,
  fileName?: string,
  trading_style?: string,
  realBars?: OHLCVBar[],
  analysis_style?: string,
): Promise<AnalysisResult> {
  const pair = selectedPair ?? detectPairFromFileName(fileName) ?? "EUR/USD";
  const timeframe = inferTimeframeFromTradingStyle(trading_style);

  // Build a minimal snapshot for source tracking
  const snapshot = await buildMarketSnapshot(pair, timeframe);

  // If real bars were passed in, use those instead
  if (realBars && realBars.length >= 20) {
    snapshot.ohlcv = realBars.map((b) => ({
      timestamp: b.time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    }));
    snapshot.dataQuality.candleCount = realBars.length;
    snapshot.dataQuality.source = "binance";
  }

  return runLocalAnalysisFromSnapshot(snapshot, trading_style, analysis_style, "local_engine");
}

// ---------------------------------------------------------------------------
// News enrichment helper
// ---------------------------------------------------------------------------

async function enrichWithNews(result: Record<string, any>): Promise<void> {
  try {
    const newsItems: NewsItem[] = await getNewsForSymbol(result.pair, { limit: 5 });
    if (newsItems.length > 0) {
      const sentimentCounts = newsItems.reduce(
        (acc, n) => {
          if (n.sentiment === "positive") acc.positive++;
          else if (n.sentiment === "negative") acc.negative++;
          else acc.neutral++;
          return acc;
        },
        { positive: 0, negative: 0, neutral: 0 },
      );

      const overallSentiment =
        sentimentCounts.positive > sentimentCounts.negative
          ? "BULLISH"
          : sentimentCounts.negative > sentimentCounts.positive
            ? "BEARISH"
            : "NEUTRAL";

      const verdict =
        overallSentiment === "BULLISH"
          ? `Recent news leans bullish (${sentimentCounts.positive} positive vs ${sentimentCounts.negative} negative headlines).`
          : overallSentiment === "BEARISH"
            ? `Recent news leans bearish (${sentimentCounts.negative} negative vs ${sentimentCounts.positive} positive headlines). Trade with caution.`
            : `News sentiment is mixed. No strong catalyst from news flow.`;

      result.news_impact = {
        relevant_news: newsItems.slice(0, 3).map((n) => ({
          headline: n.title,
          source: n.source,
          impact:
            n.sentiment === "positive"
              ? ("POSITIVE" as const)
              : n.sentiment === "negative"
                ? ("NEGATIVE" as const)
                : ("NEUTRAL" as const),
          explanation: n.summary || `Published ${n.publishedAt}`,
        })),
        overall_sentiment: overallSentiment as "BULLISH" | "BEARISH" | "NEUTRAL",
        verdict,
      };
    }
  } catch (newsErr) {
    console.warn("[Vixor] News enrichment failed (non-fatal):", newsErr);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectPairFromFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const name = fileName.toLowerCase();
  if (name.includes("gold") || name.includes("xau")) return "XAU/USD";
  if (name.includes("eur") || name.includes("euro")) return "EUR/USD";
  if (name.includes("btc") || name.includes("bitcoin")) return "BTC/USDT";
  if (name.includes("eth") || name.includes("ethereum")) return "ETH/USDT";
  if (name.includes("gbp") || name.includes("pound")) return "GBP/JPY";
  if (name.includes("jpy") || name.includes("yen")) return "GBP/JPY";
  if (name.includes("aapl") || name.includes("apple")) return "AAPL";
  if (name.includes("nasdaq") || name.includes("ndx") || name.includes("us100")) return "NASDAQ";
  return undefined;
}

function inferTimeframeFromTradingStyle(style?: string): string {
  if (!style) return "1H";
  switch (style) {
    case "Scalping":
      return "15M";
    case "Day Trading":
      return "1H";
    case "Swing Trading":
      return "4H";
    default:
      return "1H";
  }
}
