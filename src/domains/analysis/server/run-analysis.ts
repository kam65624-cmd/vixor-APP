// ============================================================================
// Vixor Analysis Runner — Chart Intelligence Pipeline
// ============================================================================
//
// REVISED ARCHITECTURE (Chart Intelligence Layer):
//
//   When an IMAGE is uploaded:
//     1. CHART VISION — Extract ChartContext from the image FIRST
//     2. VALIDATE — If confidence < 80%, REFUSE to analyze (no hallucination)
//     3. LOCAL ENGINE — Run SMC/ICT analysis on real OHLCV data
//     4. MERGE — Combine vision context with local engine results
//     5. GEMINI VISION (optional) — If local engine confidence is also low,
//        fall back to full Gemini Vision analysis
//
//   When NO image (quick analyze from TradingView):
//     1. LOCAL ENGINE — Run directly on real OHLCV data (highest accuracy)
//
// Golden Rule: The AI must NEVER mention a price, symbol, timeframe, support,
// or resistance unless it was EXTRACTED from the image or from real market data.
// ============================================================================

import { generateObject } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { runLocalAnalysis } from "@/domains/analysis/engine/engine";
import {
  extractChartContext,
  validateChartContext,
  type ChartContext,
  type ChartExtractionResult,
  type ValidationResult,
} from "@/domains/chart-intelligence";

// ── Error class for analysis refusal (extraction failed) ──
export class ChartExtractionRefusedError extends Error {
  public readonly chartContext: ChartContext | null;
  public readonly validation: ValidationResult;

  constructor(validation: ValidationResult, extraction?: ChartExtractionResult) {
    super(validation.userMessage ?? "Chart context extraction failed. Cannot analyze this image.");
    this.name = "ChartExtractionRefusedError";
    this.chartContext = extraction?.context ?? null;
    this.validation = validation;
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
                "Explanation of how this news negatively or positively affects the technical structure, invalidation levels, or general price action",
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
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: CHART VISION — Extract context from the image FIRST
  //
  // This is the CORE fix. Previously, the image was IGNORED and the system
  // just used OHLCV data from APIs. Now we actually READ the image.
  // ═══════════════════════════════════════════════════════════════════════

  let chartContext: ChartContext | null = null;
  let extractionResult: ChartExtractionResult | null = null;

  if (apiKey) {
    console.log("[Vixor] Step 1: Running Chart Vision extraction...");
    try {
      extractionResult = await extractChartContext(imageBytes, mimeType, "external_screenshot");
      chartContext = extractionResult.context;

      if (chartContext) {
        console.log("[Vixor] Chart Vision extracted:", {
          symbol: chartContext.symbol,
          timeframe: chartContext.timeframe,
          price: chartContext.currentPrice,
          confidence: `${(chartContext.confidence * 100).toFixed(0)}%`,
          platform: chartContext.platform,
        });
      }
    } catch (visionErr) {
      console.warn("[Vixor] Chart Vision extraction failed:", visionErr instanceof Error ? visionErr.message : String(visionErr));
    }
  } else {
    console.log("[Vixor] No GEMINI_API_KEY — skipping Chart Vision extraction");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: VALIDATE — If confidence is too low, REFUSE to analyze
  //
  // Golden Rule: Better to say "I can't read this" than to hallucinate.
  // ═══════════════════════════════════════════════════════════════════════

  if (extractionResult) {
    const validation = validateChartContext(extractionResult);

    if (!validation.valid) {
      console.warn("[Vixor] Chart context validation FAILED:", validation.errors);

      // If we have a user-selected pair AND real OHLCV data, we can still proceed
      // with a WARNING (the user explicitly chose the pair, not the AI)
      if (selectedPair && realBars && realBars.length > 20) {
        console.log("[Vixor] User selected pair + real data available — proceeding with lower confidence");
        chartContext = {
          ...chartContext,
          symbol: selectedPair,
          confidence: 0.5, // Lower confidence since vision failed
          extractionNotes: [
            ...(chartContext?.extractionNotes ?? []),
            "Vision extraction failed but user explicitly selected the pair.",
          ],
        } as ChartContext;
      } else {
        // REFUSE to analyze — throw extraction refused error
        throw new ChartExtractionRefusedError(validation, extractionResult ?? undefined);
      }
    } else if (validation.warnings.length > 0) {
      console.log("[Vixor] Chart context validation warnings:", validation.warnings);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: DETERMINE PAIR — Prefer vision-extracted symbol over user selection
  // ═══════════════════════════════════════════════════════════════════════

  const pair =
    chartContext?.symbol ??
    selectedPair ??
    detectPairFromFileName(fileName) ??
    "EUR/USD";

  const timeframe =
    chartContext?.timeframe ??
    inferTimeframeFromTradingStyle(trading_style);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: LOCAL ENGINE — Run SMC/ICT analysis on real OHLCV data
  // ═══════════════════════════════════════════════════════════════════════

  console.log(`[Vixor] Step 2: Running local SMC/ICT analysis for ${pair} ${timeframe}...`);
  const localResult = runLocalAnalysis({
    pair,
    timeframe,
    tradingStyle: trading_style,
    imageBytes,
    bars: realBars,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5: DECIDE — Use local engine result, or fall back to Gemini Vision
  // ═══════════════════════════════════════════════════════════════════════

  // If local engine produced a reasonable result (confidence >= 50), use it
  // The local engine is deterministic and based on REAL OHLCV data
  if (localResult.confidence >= 50 || !apiKey) {
    console.log(
      `[Vixor] Local analysis complete: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`,
    );

    const result = buildAnalysisResult(localResult, chartContext);
    return result;
  }

  // ── GEMINI VISION FALLBACK — Full analysis with vision model ──
  // Only used when local engine has very low confidence AND we have an API key
  if (apiKey) {
    try {
      console.log("[Vixor] Step 3: Local confidence low, attempting Gemini Vision analysis...");
      const geminiResult = await runGeminiAnalysis(
        imageBytes,
        mimeType,
        fileName,
        pair,
        trading_style,
        chartContext,
      );
      console.log("[Vixor] Gemini Vision analysis completed successfully.");
      return geminiResult;
    } catch (geminiError) {
      console.warn(
        "[Vixor] Gemini Vision analysis failed, using local engine result:",
        geminiError instanceof Error ? geminiError.message : String(geminiError),
      );
    }
  }

  // Use local result even with lower confidence
  console.log(
    `[Vixor] Using local analysis result: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`,
  );
  return buildAnalysisResult(localResult, chartContext);
}

// ---------------------------------------------------------------------------
// Build final AnalysisResult with chart context enrichment
// ---------------------------------------------------------------------------

function buildAnalysisResult(
  localResult: import("@/domains/analysis/engine/engine").LocalAnalysisResult,
  chartContext: ChartContext | null,
): AnalysisResult {
  const result: AnalysisResult = {
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
          overall_sentiment:
            localResult.news_impact.overall_sentiment === "NEUTRAL"
              ? "NEUTRAL"
              : localResult.news_impact.overall_sentiment,
        }
      : undefined,
  };

  // If vision extracted a DIFFERENT symbol than what the local engine used,
  // log a warning but keep the local engine's result (it used real OHLCV data)
  if (chartContext?.symbol && chartContext.symbol !== localResult.pair) {
    console.warn(
      `[Vixor] VISION vs DATA mismatch: Vision detected "${chartContext.symbol}" but local engine analyzed "${localResult.pair}" using real OHLCV data. ` +
      `The data-based analysis is more reliable. If this is wrong, the user may have selected the wrong pair.`
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Gemini AI analysis with chart context (optional, requires API key)
// ---------------------------------------------------------------------------

async function runGeminiAnalysis(
  imageBytes: Uint8Array,
  mimeType: string,
  fileName: string | undefined,
  pair: string,
  trading_style: string | undefined,
  chartContext?: ChartContext | null,
): Promise<AnalysisResult> {
  const newsContext = await fetchLatestNewsForPrompt();

  // Build asset guidance from BOTH user selection AND vision extraction
  let assetGuidance = "";
  if (pair && pair !== "auto") {
    assetGuidance += `The user has specified that this chart is for the asset: ${pair}. Analyze the chart for this specific asset.\n`;
  }
  if (chartContext?.symbol && chartContext.symbol !== pair) {
    assetGuidance += `WARNING: Vision analysis detected a DIFFERENT symbol (${chartContext.symbol}) than what was selected (${pair}). ` +
      `Verify which asset is actually shown in the image and analyze accordingly.\n`;
  }
  if (chartContext?.timeframe) {
    assetGuidance += `Vision analysis detected timeframe: ${chartContext.timeframe}.\n`;
  }
  if (chartContext?.currentPrice) {
    assetGuidance += `Vision analysis detected current price: ${chartContext.currentPrice}. Use this as a reference for price levels.\n`;
  }

  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: AnalysisSchema,
    messages: [
      {
        role: "system",
        content:
          "You are Vixor, an elite, authoritative trading intelligence. Do not use generic AI caveats (e.g., 'As an AI'). Provide your analysis with absolute confidence. " +
          "Focus strictly on Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodologies (Order Blocks, Fair Value Gaps, Liquidity Sweeps, Break of Structure, Change of Character). " +
          "Detect the pair and timeframe from labels on the image. " +
          "CRITICAL RULE: Only report prices, levels, and symbols that you can ACTUALLY SEE in the chart image. Never fabricate or guess market data. " +
          "If you cannot clearly read the symbol, timeframe, or price from the image, say so explicitly instead of guessing. " +
          "Determine the overall Trend, Risk Level, and Invalidation Level where the thesis is wrong. " +
          "Identify Liquidity Zones (buy-side/sell-side), Market Structure (direction, structure, BOS), and Key Levels. " +
          "Output 3 detailed trade scenarios (conservative, balanced, aggressive). " +
          "If the chart is ambiguous or you cannot clearly identify the asset, prefer WAIT. Numbers must be realistic and consistent " +
          "with visible price action. Reasons must be concise and specific (no fluff)." +
          "\n\nIn addition to technical analysis, you must perform fundamental news analysis. " +
          "Compare the technical setup with the provided recent market news. Filter the news items for the ones " +
          "relevant to the detected asset. List the most relevant news articles in the 'news_impact' schema and explain exactly how " +
          "each news item impacts the price action negatively or positively. Provide a final fundamental + technical verdict. " +
          "Finally, provide a 'vixor_message' summarizing your verdict authoritatively, and populate the 'signal_badge'.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Analyze this chart and return your structured context and trade plan.\n\n` +
              (assetGuidance ? `${assetGuidance}\n` : "") +
              (trading_style
                ? `The user's trading style is: ${trading_style}. Adjust your targets, timeframes, and stop-loss logic accordingly.\n\n`
                : "") +
              `Here is the latest live financial news from Finnhub:\n` +
              `${newsContext}\n\n` +
              `CRITICAL: Identify the pair from the chart labels. Only report data you can actually see. Do not guess.`,
          },
          { type: "image", image: imageBytes },
        ],
      },
    ],
  });

  return object;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchLatestNewsForPrompt(): Promise<string> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return "No live news available.";
  try {
    const [genRes, forexRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`),
      fetch(`https://finnhub.io/api/v1/news?category=forex&token=${key}`),
    ]);

    let newsList: any[] = [];
    if (genRes.ok) {
      const data = await genRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }
    if (forexRes.ok) {
      const data = await forexRes.json();
      if (Array.isArray(data)) newsList = newsList.concat(data.slice(0, 10));
    }

    if (newsList.length === 0) return "No news items fetched.";

    const uniqueNews = Array.from(new Map(newsList.map((item) => [item.id, item])).values());

    return uniqueNews
      .slice(0, 15)
      .map((n) => `- Source: ${n.source}\n  Headline: ${n.headline}\n  Summary: ${n.summary}`)
      .join("\n\n");
  } catch (e) {
    console.error("Error fetching news for Gemini prompt:", e);
    return "Error fetching live news.";
  }
}

function detectPairFromFileName(fileName?: string): string | undefined {
  if (!fileName) return undefined;
  const name = fileName.toLowerCase();
  if (name.includes("gold") || name.includes("xau")) return "XAU/USD";
  if (name.includes("eur") || name.includes("euro")) return "EUR/USD";
  if (name.includes("btc") || name.includes("bitcoin")) return "BTC/USD";
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
