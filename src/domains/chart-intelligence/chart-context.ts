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
// NOTE: Set to 0 so we NEVER refuse to analyze a chart.
// The vision extraction is informational — if it can't identify the symbol,
// the user can select one, or we'll use a default. The SMC/ICT engine uses
// REAL OHLCV data anyway, so the analysis is always valid.
export const MIN_CONFIDENCE_FOR_ANALYSIS = 0; // 0% — always proceed

// ── Chart source: where did the data come from? ──
export type ChartSource =
  | "tradingview_session" // Data from TradingView widget inside Vixor (highest accuracy)
  | "internal_screenshot" // Screenshot captured from inside Vixor
  | "external_screenshot" // Screenshot uploaded from external source (MT5, TradingView web, etc.)
  | "market_data_only"; // No image — pure OHLCV data analysis

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
export function successfulExtraction(
  context: ChartContext,
  rawExtraction?: string,
): ChartExtractionResult {
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
export function failedExtraction(
  reason: string,
  partial?: Partial<ChartContext>,
): ChartExtractionResult {
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
//
// REMOVED (audit §15 issue #9): This function was dead code — never called.
// The validation layer is SOFT (never blocks analysis), so there's no failure
// message to format. The "Unable to identify the asset in the image" string
// it produced was previously surfaced to users from stale DB rows and confused
// them. The current analysis pipeline never refuses on low confidence — it
// proceeds with whatever data is available and tags the result with caveats
// in `extractionNotes` instead.
//
// If a future iteration re-introduces hard refusal for very low confidence
// (e.g. < 20%), this helper can be revived — but it must NOT use the legacy
// "Unable to identify" wording, which is now considered misleading.
