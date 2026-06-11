// ============================================================================
// Vixor Chart Intelligence — Public API
// ============================================================================
//
// The Chart Intelligence Layer ensures that every analysis is based on
// REAL data, not hallucinated. It operates in two modes:
//
// 1. SESSION MODE (highest accuracy): When the user is viewing a chart
//    inside Vixor, the system knows the symbol, timeframe, and price
//    directly from the TradingView widget — no image needed.
//
// 2. VISION MODE (image analysis): When the user uploads a screenshot,
//    the vision pipeline extracts the chart context BEFORE any analysis.
//    If extraction fails, the system REFUSES to analyze.
//
// Golden Rule: Never hallucinate. If you can't read it, say you can't.
// ============================================================================

export {
  type ChartContext,
  type ChartExtractionResult,
  type ChartSource,
  type ChartPlatform,
  MIN_CONFIDENCE_FOR_ANALYSIS,
  successfulExtraction,
  failedExtraction,
  createSessionContext,
  formatExtractionFailureMessage,
} from "./chart-context";

export {
  extractChartContext,
  extractChartContextFromBase64,
} from "./chart-vision";

export {
  type ValidationResult,
  validateChartContext,
  validateSessionContext,
} from "./chart-validation";

export {
  type ChartSession,
  sessionToContext,
  buildChartSessionPrompt,
} from "./chart-session";
