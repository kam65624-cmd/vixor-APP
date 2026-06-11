// ============================================================================
// Vixor Chart Intelligence — Vision Pipeline
// ============================================================================
//
// Uses Gemini Vision (or z-ai-web-dev-sdk VLM) to extract ChartContext
// from a screenshot image BEFORE any analysis runs.
//
// This is the CORE of the Chart Intelligence Layer.
// Without this, the system is "blind" and hallucinates.
//
// Flow:
//   Image bytes → Vision Model → ChartExtractionResult → Validate → Analyze
// ============================================================================

import { generateObject } from "ai";
import { z } from "zod";
import {
  type ChartContext,
  type ChartExtractionResult,
  type ChartPlatform,
  type ChartSource,
  successfulExtraction,
  failedExtraction,
} from "./chart-context";

// ── Schema for vision model output ──
const ChartExtractionSchema = z.object({
  /** Is this image a trading chart? */
  isChart: z.boolean().describe("Whether this image contains a trading/chart view"),

  /** What platform generated this chart? */
  platform: z.enum(["tradingview", "mt5", "mt4", "binance", "exness", "bybit", "unknown"])
    .describe("The trading platform that generated this chart, based on visual cues"),

  /** Trading symbol/pair detected on the chart */
  symbol: z.string().nullable()
    .describe("The trading pair/symbol visible on the chart (e.g., 'XAUUSD', 'BTCUSDT', 'EURUSD'). NULL if not clearly visible."),

  /** Confidence in symbol detection (0.0-1.0) */
  symbolConfidence: z.number().min(0).max(1)
    .describe("How confident you are about the detected symbol. 0.0 = pure guess, 1.0 = clearly readable text"),

  /** Chart timeframe */
  timeframe: z.string().nullable()
    .describe("The chart timeframe visible on the chart (e.g., '1m', '5m', '15m', '1H', '4H', '1D'). NULL if not clearly visible."),

  /** Confidence in timeframe detection (0.0-1.0) */
  timeframeConfidence: z.number().min(0).max(1)
    .describe("How confident you are about the detected timeframe"),

  /** Current price visible on the chart */
  currentPrice: z.number().nullable()
    .describe("The current/latest price level visible on the chart. NULL if not clearly readable."),

  /** Confidence in price reading (0.0-1.0) */
  priceConfidence: z.number().min(0).max(1)
    .describe("How confident you are about the detected price"),

  /** Trend direction visible on the chart */
  visualTrend: z.enum(["bullish", "bearish", "sideways", "unknown"])
    .describe("The overall visual trend direction based on candle patterns"),

  /** Indicators visible on the chart */
  indicators: z.array(z.string())
    .describe("List of technical indicators visible on the chart (e.g., 'EMA', 'RSI', 'MACD', 'Bollinger')"),

  /** Any notable visual features */
  notes: z.array(z.string())
    .describe("Any notable features observed: candlestick patterns, support/resistance lines drawn, trendlines, etc."),
});

type VisionExtraction = z.infer<typeof ChartExtractionSchema>;

// ── Extract ChartContext from an image using Gemini Vision ──
export async function extractChartContext(
  imageBytes: Uint8Array,
  mimeType: string,
  source: ChartSource = "external_screenshot",
): Promise<ChartExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[ChartVision] No GEMINI_API_KEY — cannot extract chart context from image");
    return failedExtraction(
      "Vision model not available (no API key). Cannot analyze chart image.",
      { source },
    );
  }

  try {
    console.log("[ChartVision] Starting vision extraction...");

    const { google } = await import("@ai-sdk/google");

    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: ChartExtractionSchema,
      messages: [
        {
          role: "system",
          content: VISION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the trading context from this chart image. Be precise — only report what you can actually SEE in the image. If something is not clearly visible, return null for that field and set confidence accordingly. NEVER guess or fabricate data.",
            },
            { type: "image", image: imageBytes },
          ],
        },
      ],
    });

    console.log("[ChartVision] Vision extraction complete:", {
      isChart: object.isChart,
      symbol: object.symbol,
      timeframe: object.timeframe,
      price: object.currentPrice,
      symbolConf: object.symbolConfidence,
      timeframeConf: object.timeframeConfidence,
      priceConf: object.priceConfidence,
    });

    // Validate: Is this even a chart?
    if (!object.isChart) {
      return failedExtraction(
        "The uploaded image does not appear to be a trading chart. Please upload a screenshot of a chart from TradingView, MT5, Binance, or similar platforms.",
        { source, platform: object.platform as ChartPlatform ?? null },
      );
    }

    // Normalize the symbol (e.g., "XAUUSD" → "XAU/USD", "BTCUSDT" → "BTC/USDT")
    const normalizedSymbol = normalizeSymbol(object.symbol);

    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(object);

    // Build ChartContext
    const context: ChartContext = {
      symbol: normalizedSymbol,
      timeframe: object.timeframe ? normalizeTimeframe(object.timeframe) : null,
      currentPrice: object.currentPrice,
      source,
      confidence: overallConfidence,
      platform: (object.platform as ChartPlatform) ?? null,
      visibleIndicators: object.indicators ?? [],
      extractionNotes: object.notes ?? [],
    };

    return successfulExtraction(context, JSON.stringify(object));
  } catch (err) {
    console.error("[ChartVision] Vision extraction failed:", err instanceof Error ? err.message : String(err));
    return failedExtraction(
      `Vision extraction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      { source },
    );
  }
}

// ── Extract ChartContext from a base64 data URL ──
export async function extractChartContextFromBase64(
  base64DataUrl: string,
  source: ChartSource = "external_screenshot",
): Promise<ChartExtractionResult> {
  const b64 = base64DataUrl.includes(",") ? base64DataUrl.split(",")[1] : base64DataUrl;
  const bytes = Uint8Array.from(Buffer.from(b64, "base64"));
  const mimeType = base64DataUrl.includes("image/png") ? "image/png" : "image/jpeg";
  return extractChartContext(bytes, mimeType, source);
}

// ── Normalize symbol formats ──
function normalizeSymbol(symbol: string | null): string | null {
  if (!symbol) return null;
  const s = symbol.toUpperCase().replace(/[\s\-_]/g, "");

  // Known patterns
  const symbolMap: Record<string, string> = {
    "XAUUSD": "XAU/USD",
    "XAUUSDT": "XAU/USD",
    "GOLD": "XAU/USD",
    "BTCUSDT": "BTC/USDT",
    "BTCUSD": "BTC/USD",
    "BITCOIN": "BTC/USD",
    "ETHUSDT": "ETH/USDT",
    "ETHUSD": "ETH/USD",
    "ETHEREUM": "ETH/USDT",
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "GBPJPY": "GBP/JPY",
    "USDJPY": "USD/JPY",
    "AUDUSD": "AUD/USD",
    "NZDUSD": "NZD/USD",
    "USDCAD": "USD/CAD",
    "USDCHF": "USD/CHF",
    "SOLUSDT": "SOL/USDT",
    "SOLUSD": "SOL/USDT",
    "SOLANA": "SOL/USDT",
    "AAPL": "AAPL",
    "TSLA": "TSLA",
    "SPX500": "SPX500",
    "US100": "NASDAQ",
    "NDX": "NASDAQ",
    "NASDAQ": "NASDAQ",
  };

  return symbolMap[s] ?? null;
}

// ── Normalize timeframe formats ──
function normalizeTimeframe(tf: string | null): string | null {
  if (!tf) return null;
  const t = tf.toUpperCase().replace(/\s/g, "");

  const tfMap: Record<string, string> = {
    "1M": "1M",
    "1MIN": "1M",
    "MIN1": "1M",
    "5M": "5M",
    "5MIN": "5M",
    "MIN5": "5M",
    "15M": "15M",
    "15MIN": "15M",
    "MIN15": "15M",
    "30M": "30M",
    "30MIN": "30M",
    "MIN30": "30M",
    "1H": "1H",
    "H1": "1H",
    "HR1": "1H",
    "60M": "1H",
    "4H": "4H",
    "H4": "4H",
    "HR4": "4H",
    "240M": "4H",
    "1D": "1D",
    "D1": "1D",
    "DAY": "1D",
    "DAILY": "1D",
    "1W": "1W",
    "W1": "1W",
    "WEEKLY": "1W",
  };

  return tfMap[t] ?? t;
}

// ── Calculate overall confidence from individual confidences ──
function calculateOverallConfidence(extraction: VisionExtraction): number {
  // Weight: symbol is most important (50%), timeframe (25%), price (25%)
  const symbolWeight = 0.5;
  const timeframeWeight = 0.25;
  const priceWeight = 0.25;

  // If symbol is missing, confidence is very low regardless
  if (!extraction.symbol) {
    return extraction.symbolConfidence * 0.3; // Max 0.3 if no symbol
  }

  let confidence = extraction.symbolConfidence * symbolWeight;

  if (extraction.timeframe) {
    confidence += extraction.timeframeConfidence * timeframeWeight;
  } else {
    confidence += 0.1 * timeframeWeight; // Small credit for seeing a chart
  }

  if (extraction.currentPrice) {
    confidence += extraction.priceConfidence * priceWeight;
  } else {
    confidence += 0.1 * priceWeight; // Small credit
  }

  return Math.min(confidence, 1.0);
}

// ── Vision System Prompt ──
const VISION_SYSTEM_PROMPT = `You are a specialized chart analysis vision system for the Vixor trading platform. Your ONLY job is to extract factual, observable data from trading chart screenshots.

CRITICAL RULES:
1. NEVER guess or fabricate data. If you cannot clearly see something, return null.
2. NEVER use your general knowledge about current market prices. Only report what's VISIBLE in the image.
3. Symbol detection: Look for text labels like "XAUUSD", "BTCUSDT", "EURUSD" typically in the top-left corner of the chart.
4. Timeframe detection: Look for text like "1m", "5m", "15m", "1H", "4H", "1D" usually near the symbol.
5. Price detection: Look at the price axis (usually right side) for the current price level.
6. Platform detection: TradingView has a distinctive dark theme with specific toolbar icons. MT5 has its own layout. Binance has its web interface style.
7. Indicator detection: Look for indicator names in the chart (RSI, MACD, EMA, etc.) or visual overlays.
8. Confidence scoring:
   - 0.9-1.0: Text is clearly readable and unambiguous
   - 0.7-0.9: Text is readable but could have slight ambiguity
   - 0.5-0.7: Text is partially visible or blurry
   - 0.0-0.5: Cannot clearly read the text, mostly guessing
9. If the image is NOT a trading chart (e.g., a photo, meme, document), set isChart=false.
10. Be especially careful with price values — a wrong price is worse than no price.`;
