// ============================================================================
// Vixor Chart Intelligence — Chart Context
// ============================================================================
//
// Core types for the Chart Intelligence Layer.
// Every analysis MUST produce a ChartContext before proceeding.
// If confidence < MIN_CONFIDENCE, the system REFUSES to analyze.
//
// Golden Rule: Never hallucinate. Only report what's extracted from the image
// or from real market data. If extraction fails, say so explicitly.
// ============================================================================

// ── Minimum confidence threshold to allow analysis ──
export const MIN_CONFIDENCE_FOR_ANALYSIS = 0.8; // 80%

// ── Chart source: where did the data come from? ──
export type ChartSource =
  | "tradingview_session"  // Data from TradingView widget inside Vixor (highest accuracy)
  | "internal_screenshot"  // Screenshot captured from inside Vixor
  | "external_screenshot"  // Screenshot uploaded from external source (MT5, TradingView web, etc.)
  | "market_data_only";    // No image — pure OHLCV data analysis

// ── The core Chart Context — produced BEFORE any analysis ──
export interface ChartContext {
  /** What trading pair / symbol is shown (e.g. "XAU/USD", "BTC/USDT") */
  symbol: string | null;

  /** Chart timeframe (e.g. "1M", "5M", "15M", "1H", "4H", "1D") */
  timeframe: string | null;

  /** Current price visible on the chart (if readable) */
  currentPrice: number | null;

  /** Where did this context come from? */
  source: ChartSource;

  /** Overall confidence in the extraction (0.0 to 1.0) */
  confidence: number;

  /** Which platform generated the chart image? */
  platform: ChartPlatform | null;

  /** Indicators visible on the chart (e.g. ["EMA50", "RSI", "MACD"]) */
  visibleIndicators: string[];

  /** Any notes about extraction difficulties */
  extractionNotes: string[];
}

// ── Chart platform detection ──
export type ChartPlatform =
  | "tradingview"
  | "mt5"
  | "mt4"
  | "binance"
  | "exness"
  | "bybit"
  | "unknown";

// ── Extraction result — either success with context, or failure ──
export interface ChartExtractionResult {
  /** Whether extraction succeeded with sufficient confidence */
  success: boolean;

  /** The extracted context (null if failed) */
  context: ChartContext | null;

  /** Human-readable reason for failure (if success=false) */
  failureReason: string | null;

  /** Raw vision model response for debugging */
  rawExtraction: string | null;
}

// ── Helper: Create a successful extraction result ──
export function successfulExtraction(context: ChartContext, rawExtraction?: string): ChartExtractionResult {
  return {
    success: context.confidence >= MIN_CONFIDENCE_FOR_ANALYSIS,
    context,
    failureReason:
      context.confidence < MIN_CONFIDENCE_FOR_ANALYSIS
        ? `Extraction confidence too low (${(context.confidence * 100).toFixed(0)}%). Minimum required: ${(MIN_CONFIDENCE_FOR_ANALYSIS * 100).toFixed(0)}%.`
        : null,
    rawExtraction: rawExtraction ?? null,
  };
}

// ── Helper: Create a failed extraction result ──
export function failedExtraction(reason: string, partial?: Partial<ChartContext>): ChartExtractionResult {
  return {
    success: false,
    context: partial
      ? {
          symbol: null,
          timeframe: null,
          currentPrice: null,
          source: partial.source ?? "external_screenshot",
          confidence: 0,
          platform: null,
          visibleIndicators: [],
          extractionNotes: [reason],
        }
      : null,
    failureReason: reason,
    rawExtraction: null,
  };
}

// ── Helper: Create ChartContext from TradingView session (highest accuracy) ──
export function createSessionContext(params: {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  visibleIndicators?: string[];
}): ChartContext {
  return {
    symbol: params.symbol,
    timeframe: params.timeframe,
    currentPrice: params.currentPrice,
    source: "tradingview_session",
    confidence: 1.0, // 100% — data comes directly from the widget
    platform: "tradingview",
    visibleIndicators: params.visibleIndicators ?? [],
    extractionNotes: [],
  };
}

// ── Helper: Format a user-friendly message when extraction fails ──
export function formatExtractionFailureMessage(result: ChartExtractionResult, lang: "en" | "ar" = "en"): string {
  if (lang === "ar") {
    if (!result.context?.symbol) {
      return "لم أتمكن من تحديد الأصل الموجود في الصورة بدقة كافية. الرجاء رفع لقطة أوضح تظهر رمز الأصل (مثل XAUUSD أو BTCUSDT) بوضوح.";
    }
    if (!result.context?.timeframe) {
      return `تم التعرف على ${result.context.symbol} لكن لم أتمكن من تحديد الفريم الزمني. الرجاء رفع لقطة يظهر فيها الفريم (مثل H1 أو 15M).`;
    }
    return `لم أتمكن من استخراج بيانات كافية من الصورة (الثقة: ${(result.context?.confidence ?? 0) * 100}%). الرجاء رفع لقطة أوضح.`;
  }

  if (!result.context?.symbol) {
    return "Unable to identify the asset in the image with sufficient accuracy. Please upload a clearer screenshot that shows the symbol (e.g., XAUUSD or BTCUSDT) clearly.";
  }
  if (!result.context?.timeframe) {
    return `Detected ${result.context.symbol} but could not determine the timeframe. Please upload a screenshot where the timeframe (e.g., H1, 15M) is visible.`;
  }
  return `Unable to extract sufficient data from the image (confidence: ${(result.context?.confidence ?? 0) * 100}%). Please upload a clearer screenshot.`;
}
