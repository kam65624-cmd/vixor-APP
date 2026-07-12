// ============================================================================
// Vixor Analysis Runner — Gemini Vision-Powered Chart Intelligence
// ============================================================================
//
// ARCHITECTURE:
//
//   When an IMAGE is uploaded:
//     1. Send image + context to Gemini 1.5 Flash (Vision model)
//     2. Parse structured JSON response into AnalysisResult
//     3. Enrich with real Finnhub news for the detected pair
//     4. Return the final AnalysisResult
//
//   When NO image (quick analyze from TradingView):
//     1. Fetch real OHLCV bars from Binance/TwelveData
//     2. Send OHLCV data to Gemini for SMC/ICT analysis
//     3. Return result
//
// Golden Rule: The AI READS the actual image. It sees the real candles,
// support/resistance lines, and patterns drawn on the chart.
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

// Re-export the schema for other files that import it
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
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

// ---------------------------------------------------------------------------
// Main entry point — IMAGE-BASED analysis
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

  const openrouter = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const pair = selectedPair ?? detectPairFromFileName(fileName) ?? "BTC/USDT";
  const timeframe = inferTimeframeFromTradingStyle(trading_style);

  const base64Image = Buffer.from(imageBytes).toString("base64");

  const systemPrompt = `You are Vixor, an elite AI trading analyst specializing in Smart Money Concepts (SMC) and ICT methodology.

You are analyzing a REAL trading chart image. You must:
1. READ the actual candles, price levels, and patterns visible in the image
2. Identify the EXACT trading pair shown (look for labels, title, ticker symbol on the chart)
3. Identify the timeframe shown on the chart
4. Provide analysis based ONLY on what you actually SEE in the image

CRITICAL RULES:
- Never fabricate prices. Extract REAL prices from the chart image.
- The pair in the image OVERRIDES any user-provided pair selection.
- If you see "XAUUSD" or "Gold" in the chart, the pair is "XAU/USD" — analyze GOLD.
- If you see "BTCUSDT" or "Bitcoin" in the chart, the pair is "BTC/USDT" — analyze BITCOIN.
- Provide entry, stop loss, and take profits based on the ACTUAL price levels visible.
- Look for: Order Blocks, Fair Value Gaps (FVG), Break of Structure (BOS), Change of Character (CHoCH), liquidity sweeps, imbalances.

Trading style: ${trading_style || "Swing Trading"}
User-selected pair (may differ from chart): ${pair}`;

  try {
    const result = await generateObject({
      model: openrouter("qwen/qwen2.5-vl-72b-instruct:free") as any,
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

IMPORTANT: Look at the actual chart image. Identify the REAL pair and prices shown. Provide your analysis based on what you actually see in the chart.

Provide a complete structured analysis with:
- The actual pair shown in the chart
- Realistic entry, stop loss, and 3 take profit levels based on visible chart levels
- At least 3-5 specific reasons based on what you see
- Management instructions
- A confident vixor_message`,
            },
          ],
        },
      ],
    });

    const analysisResult = result.object;

    // ── Enrich with real news ──
    try {
      const newsItems: NewsItem[] = await getNewsForSymbol(analysisResult.pair, { limit: 5 });
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

        analysisResult.news_impact = {
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

    return analysisResult;
  } catch (err) {
    console.error(
      "[Vixor] OpenRouter Vision analysis failed:",
      err instanceof Error ? err.message : err,
    );
    throw new AnalysisError(
      `OpenRouter Error: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
      "OPENROUTER_ERROR"
    );
  }
}

// ---------------------------------------------------------------------------
// Local engine fallback (when no API key or Gemini fails)
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

  let localResult: LocalAnalysisResult;
  try {
    localResult = runLocalAnalysis({
      pair,
      timeframe,
      tradingStyle: trading_style,
      analysisStyle: analysis_style,
      bars: realBars,
    });
  } catch (engineErr) {
    console.error("[Vixor] Local engine failed:", engineErr);
    const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS["EUR/USD"]!;
    localResult = generateFallbackResult(pair, timeframe, config);
  }

  // Enrich with news
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
    // Ignore news fetch failure in local fallback
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
  };
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
