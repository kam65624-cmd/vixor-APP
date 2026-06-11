// ============================================================================
// Vixor Chart Intelligence — Vision Pipeline
// ============================================================================
//
// Uses z-ai-web-dev-sdk VLM to extract ChartContext from a screenshot image
// BEFORE any analysis runs. No external API keys required.
//
// This is the CORE of the Chart Intelligence Layer.
// Without this, the system is "blind" and hallucinates.
//
// Flow:
//   Image bytes → z-ai VLM → ChartExtractionResult → Validate → Analyze
// ============================================================================

import {
  type ChartContext,
  type ChartExtractionResult,
  type ChartPlatform,
  type ChartSource,
  successfulExtraction,
  failedExtraction,
} from "./chart-context";

// ── Extract ChartContext from an image using z-ai-web-dev-sdk VLM ──
export async function extractChartContext(
  imageBytes: Uint8Array,
  mimeType: string,
  source: ChartSource = "external_screenshot",
): Promise<ChartExtractionResult> {
  try {
    console.log("[ChartVision] Starting vision extraction using z-ai VLM...");

    const ZAI = await import("z-ai-web-dev-sdk");
    const zai = await ZAI.default.create();

    // Convert image bytes to base64 for z-ai VLM
    const base64Image = Buffer.from(imageBytes).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `You are a specialized chart analysis vision system for the Vixor trading platform. Your ONLY job is to extract factual, observable data from trading chart screenshots.

CRITICAL RULES:
1. NEVER guess or fabricate data. If you cannot clearly see something, return null.
2. NEVER use your general knowledge about current market prices. Only report what's VISIBLE in the image.
3. Symbol detection: Look for text labels like "XAUUSD", "BTCUSDT", "EURUSD" typically in the top-left corner of the chart.
4. Timeframe detection: Look for text like "1m", "5m", "15m", "1H", "4H", "1D" usually near the symbol.
5. Price detection: Look at the price axis (usually right side) for the current price level.
6. Platform detection: TradingView has a distinctive dark theme. MT5 has its own layout. Binance has its web interface.
7. If the image is NOT a trading chart, say so explicitly.

Extract the following from the chart image and respond in this EXACT JSON format (no other text):
{
  "isChart": true/false,
  "platform": "tradingview" | "mt5" | "mt4" | "binance" | "exness" | "bybit" | "unknown",
  "symbol": "the trading pair or null if not visible",
  "symbolConfidence": 0.0-1.0,
  "timeframe": "the timeframe or null if not visible",
  "timeframeConfidence": 0.0-1.0,
  "currentPrice": the price number or null,
  "priceConfidence": 0.0-1.0,
  "visualTrend": "bullish" | "bearish" | "sideways" | "unknown",
  "indicators": ["list of visible indicators"],
  "notes": ["any notable observations"]
}

Confidence scoring:
- 0.9-1.0: Text is clearly readable and unambiguous
- 0.7-0.9: Text is readable but could have slight ambiguity
- 0.5-0.7: Text is partially visible or blurry
- 0.0-0.5: Cannot clearly read, mostly guessing

Be especially careful with price values — a wrong price is worse than no price.`;

    const response = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            { type: "text" as const, text: prompt },
            { type: "image_url" as const, image_url: { url: dataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return failedExtraction("Vision model returned no content.", { source });
    }

    // Parse the JSON response from the vision model
    let parsed: any;
    try {
      // Try to extract JSON from the response (may be wrapped in markdown code block)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return failedExtraction("Vision model did not return valid JSON.", { source });
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.warn("[ChartVision] Failed to parse vision response:", content.slice(0, 200));
      return failedExtraction("Failed to parse vision model output.", { source });
    }

    console.log("[ChartVision] Vision extraction complete:", {
      isChart: parsed.isChart,
      symbol: parsed.symbol,
      timeframe: parsed.timeframe,
      price: parsed.currentPrice,
      symbolConf: parsed.symbolConfidence,
      timeframeConf: parsed.timeframeConfidence,
      priceConf: parsed.priceConfidence,
    });

    // Validate: Is this even a chart?
    if (!parsed.isChart) {
      return failedExtraction(
        "The uploaded image does not appear to be a trading chart. Please upload a screenshot of a chart from TradingView, MT5, Binance, or similar platforms.",
        { source, platform: parsed.platform as ChartPlatform ?? null },
      );
    }

    // Normalize the symbol (e.g., "XAUUSD" → "XAU/USD", "BTCUSDT" → "BTC/USDT")
    const normalizedSymbol = normalizeSymbol(parsed.symbol);

    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(parsed);

    // Build ChartContext
    const context: ChartContext = {
      symbol: normalizedSymbol,
      timeframe: parsed.timeframe ? normalizeTimeframe(parsed.timeframe) : null,
      currentPrice: parsed.currentPrice ?? null,
      source,
      confidence: overallConfidence,
      platform: (parsed.platform as ChartPlatform) ?? null,
      visibleIndicators: parsed.indicators ?? [],
      extractionNotes: parsed.notes ?? [],
    };

    return successfulExtraction(context, content);
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
function calculateOverallConfidence(extraction: any): number {
  // Weight: symbol is most important (50%), timeframe (25%), price (25%)
  const symbolWeight = 0.5;
  const timeframeWeight = 0.25;
  const priceWeight = 0.25;

  // If symbol is missing, confidence is very low regardless
  if (!extraction.symbol) {
    return (extraction.symbolConfidence ?? 0) * 0.3; // Max 0.3 if no symbol
  }

  let confidence = (extraction.symbolConfidence ?? 0.5) * symbolWeight;

  if (extraction.timeframe) {
    confidence += (extraction.timeframeConfidence ?? 0.5) * timeframeWeight;
  } else {
    confidence += 0.1 * timeframeWeight; // Small credit for seeing a chart
  }

  if (extraction.currentPrice) {
    confidence += (extraction.priceConfidence ?? 0.5) * priceWeight;
  } else {
    confidence += 0.1 * priceWeight; // Small credit
  }

  return Math.min(confidence, 1.0);
}
