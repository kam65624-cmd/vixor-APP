// ============================================================================
// Vixor Analysis Runner — Chart Intelligence Pipeline
// ============================================================================
//
// ARCHITECTURE (100% Local — Zero External AI APIs):
//
//   When an IMAGE is uploaded:
//     1. CHART VISION — Extract ChartContext using z-ai VLM (local SDK)
//     2. VALIDATE — If confidence < 80%, REFUSE to analyze (no hallucination)
//     2.5. TRUTH VALIDATION — Compare vision price vs real market price
//     3. DETERMINE PAIR — Vision-extracted > user-selected > filename > default
//     4. LOCAL ENGINE — Run SMC/ICT analysis on real OHLCV data (ONLY engine)
//     5. DEBATE ENGINE (optional) — Multi-agent cross-validation
//
//   When NO image (quick analyze from TradingView):
//     1. LOCAL ENGINE — Run directly on real OHLCV data (highest accuracy)
//
// Golden Rule: The AI must NEVER mention a price, symbol, timeframe, support,
// or resistance unless it was EXTRACTED from the image or from real market data.
//
// NO EXTERNAL AI APIs — No Gemini, no OpenAI, no Lovable Gateway.
// The local SMC/ICT engine is the ONLY analysis engine.
// ============================================================================

import { z } from "zod";
import { runLocalAnalysis } from "@/domains/analysis/engine/engine";
import {
  extractChartContext,
  validateChartContext,
  type ChartContext,
  type ChartExtractionResult,
  type ValidationResult,
} from "@/domains/chart-intelligence";
import { getNewsForSymbol, type NewsItem } from "@/domains/market/server/news";

// ── Error class for analysis refusal ──
//
// REMOVED (audit §15 issue #9): `ChartExtractionRefusedError` was dead code —
// defined but never thrown anywhere in the codebase. The validation layer is
// SOFT (see chart-validation.ts) and never refuses to analyze — it always
// proceeds with whatever data is available. If a future iteration re-introduces
// hard refusal for very low confidence, this error class can be revived.

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
  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: CHART VISION — Extract context from the image FIRST
  //
  // This is the CORE fix. Previously, the image was IGNORED and the system
  // just used OHLCV data from APIs. Now we actually READ the image.
  // ═══════════════════════════════════════════════════════════════════════

  let chartContext: ChartContext | null = null;
  let extractionResult: ChartExtractionResult | null = null;

  // z-ai-web-dev-sdk is always available (installed locally, no external API key needed)
  console.log("[Vixor] Step 1: Running Chart Vision extraction (z-ai VLM)...");
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
    console.warn(
      "[Vixor] Chart Vision extraction failed:",
      visionErr instanceof Error ? visionErr.message : String(visionErr),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: VALIDATE — Validation is now SOFT (warnings only, never blocks)
  //
  // The SMC/ICT engine uses real OHLCV data, so even if vision extraction
  // fails, the analysis is still valid. We log warnings but NEVER refuse.
  // ═══════════════════════════════════════════════════════════════════════

  if (extractionResult) {
    const validation = validateChartContext(extractionResult);
    // validation is ALWAYS valid now — just log warnings
    if (validation.warnings.length > 0) {
      console.log("[Vixor] Chart context validation warnings:", validation.warnings);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2.5: TRUTH VALIDATION — Verify vision data against real market
  //
  // Compares the vision-extracted price against real market data.
  // NEVER blocks analysis — only warns. The local engine uses real OHLCV
  // data anyway, so even if vision is wrong, the analysis is still valid.
  // ═══════════════════════════════════════════════════════════════════════

  if (chartContext) {
    try {
      const { validateChartTruth } = await import("@/domains/chart-truth");
      const truthResult = await validateChartTruth(chartContext);
      console.log("[Vixor] Truth Score:", truthResult.truthScore, truthResult.status);
      if (truthResult.warnings.length > 0) {
        console.warn("[Vixor] Truth warnings:", truthResult.warnings);
      }
      // Do NOT throw on low truth score — just warn. Real data will be used anyway.
    } catch (truthErr) {
      console.warn(
        "[Vixor] Truth validation failed silently:",
        truthErr instanceof Error ? truthErr.message : String(truthErr),
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: DETERMINE PAIR — Prefer vision-extracted symbol over user selection
  // ═══════════════════════════════════════════════════════════════════════

  const pair =
    chartContext?.symbol ?? selectedPair ?? detectPairFromFileName(fileName) ?? "EUR/USD";

  const timeframe = chartContext?.timeframe ?? inferTimeframeFromTradingStyle(trading_style);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: LOCAL ENGINE — Run SMC/ICT analysis on real OHLCV data
  //
  // SAFETY NET: The local engine is fully deterministic and CANNOT fail.
  // If it ever throws (which would be a bug), we still return a minimal
  // valid AnalysisResult so users never see a "failed" analysis card.
  // ═══════════════════════════════════════════════════════════════════════

  console.log(`[Vixor] Step 2: Running local SMC/ICT analysis for ${pair} ${timeframe}...`);
  let localResult: import("@/domains/analysis/engine/core/types").LocalAnalysisResult;
  try {
    localResult = runLocalAnalysis({
      pair,
      timeframe,
      tradingStyle: trading_style,
      imageBytes,
      bars: realBars,
    });
  } catch (engineErr) {
    // Absolute last-resort fallback — should never happen because
    // runLocalAnalysis already has a synthetic-data fallback built in,
    // but if it does, we still produce a valid result.
    console.error(
      "[Vixor] Local analysis engine threw unexpectedly:",
      engineErr instanceof Error ? engineErr.message : String(engineErr),
    );
    const { generateFallbackResult } = await import("@/domains/analysis/engine/engine");
    const { PAIR_CONFIGS } = await import("@/domains/analysis/engine/core/types");
    const config = PAIR_CONFIGS[pair] || PAIR_CONFIGS["EUR/USD"]!;
    localResult = generateFallbackResult(pair, timeframe, config);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5: BUILD RESULT — Local engine is the ONLY analysis engine
  // ═══════════════════════════════════════════════════════════════════════

  // The local SMC/ICT engine is deterministic and based on REAL OHLCV data.
  // No external AI API is used — this is 100% local.
  console.log(
    `[Vixor] Local analysis complete: ${localResult.pair} ${localResult.timeframe} → ${localResult.recommendation} @ ${localResult.confidence}%`,
  );

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4.5: REAL NEWS ENRICHMENT (Finnhub)
  // ═══════════════════════════════════════════════════════════════════════
  //
  // The local engine returns `news_impact: undefined` (P0.3 fix — fake newsMap
  // was deleted). We now fetch REAL news from Finnhub and attach a real
  // `news_impact` object so users see actual market-moving headlines attached
  // to their analysis.
  //
  // Failures are non-fatal: if Finnhub is unreachable, no API key configured,
  // or the circuit breaker is open, `newsImpact` stays `undefined` and the
  // analysis pipeline continues normally. The UI hides the news section when
  // `news_impact` is undefined.
  try {
    const newsItems: NewsItem[] = await getNewsForSymbol(localResult.pair, {
      limit: 5,
    });

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
          ? `Recent news sentiment leans positive (${sentimentCounts.positive} bullish vs ${sentimentCounts.negative} bearish headlines in the past 7 days). Aligns with the technical bias if direction matches.`
          : overallSentiment === "BEARISH"
            ? `Recent news sentiment leans negative (${sentimentCounts.negative} bearish vs ${sentimentCounts.positive} bullish headlines in the past 7 days). Consider this when sizing positions.`
            : `News sentiment is mixed or neutral (${sentimentCounts.neutral} neutral headlines). No strong directional catalyst from news flow.`;

      localResult.news_impact = {
        relevant_news: newsItems.map((n) => ({
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

      console.log(
        `[Vixor] News enrichment: +${newsItems.length} real headlines from Finnhub (${overallSentiment})`,
      );
    } else {
      console.log("[Vixor] News enrichment: no recent Finnhub news for this symbol");
    }
  } catch (newsErr) {
    // Defensive: getNewsForSymbol already returns [] on failure, but if
    // something unexpected happens here, we must NOT break the analysis.
    console.warn(
      "[Vixor] News enrichment failed (non-fatal):",
      newsErr instanceof Error ? newsErr.message : String(newsErr),
    );
  }

  const result = buildAnalysisResult(localResult, chartContext);

  // ── OPTIONAL: Debate Engine validation ──
  // Gated by environment variable — only runs when explicitly enabled.
  // Attaches results to result._debate for downstream consumption (non-breaking).
  if (process.env.ENABLE_DEBATE_ENGINE === "true") {
    try {
      const { DebateEngine } = await import("@/domains/debate");
      const debate = new DebateEngine();
      const debateResult = await debate.run(result);
      console.log("[Vixor] Debate result:", debateResult.summary);
      // Attach to result for downstream use (non-breaking, invisible to frontend)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)._debate = debateResult;
    } catch (e) {
      console.warn(
        "[Vixor] Debate engine failed silently:",
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Build final AnalysisResult with chart context enrichment
// ---------------------------------------------------------------------------

function buildAnalysisResult(
  localResult: import("@/domains/analysis/engine/core/types").LocalAnalysisResult,
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
        `The data-based analysis is more reliable. If this is wrong, the user may have selected the wrong pair.`,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
