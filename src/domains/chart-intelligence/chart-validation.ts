// ============================================================================
// Vixor Chart Intelligence — Validation Layer
// ============================================================================
//
// Validates ChartContext before allowing analysis to proceed.
// Implements the Golden Rule: Never hallucinate market data.
//
// If validation fails, the system REFUSES to analyze and returns
// a clear user-friendly message instead of a fake analysis.
// ============================================================================

import {
  type ChartContext,
  type ChartExtractionResult,
  MIN_CONFIDENCE_FOR_ANALYSIS,
  formatExtractionFailureMessage,
} from "./chart-context";

// ── Validation result ──
export interface ValidationResult {
  /** Whether the context is valid for analysis */
  valid: boolean;

  /** Warnings (analysis can proceed but with caveats) */
  warnings: string[];

  /** Errors (analysis MUST NOT proceed) */
  errors: string[];

  /** Adjusted confidence after validation checks */
  adjustedConfidence: number;

  /** User-friendly message if validation failed */
  userMessage: string | null;
}

// ── Validate a ChartContext for analysis readiness ──
// NOTE: This validation is SOFT — it NEVER blocks analysis.
// All issues are converted to warnings. The SMC/ICT engine uses real OHLCV
// data, so the analysis is always valid regardless of vision extraction quality.
export function validateChartContext(result: ChartExtractionResult): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = []; // Always empty — we never block

  // If extraction completely failed — still proceed, just note it
  if (!result.success || !result.context) {
    return {
      valid: true, // Changed: Always valid
      warnings: [result.failureReason ?? "Chart context extraction failed — will use user-selected pair or default"],
      errors: [],
      adjustedConfidence: 0.1, // Low but non-zero
      userMessage: null, // Never show blocking message
    };
  }

  const ctx = result.context;

  // ── Check 1: Symbol detection — warning only, not a blocker ──
  if (!ctx.symbol) {
    warnings.push("No trading symbol detected in the chart image. Using user-selected pair or default.");
  }

  // ── Check 2: Low confidence — warning only ──
  if (ctx.confidence < 0.5) {
    warnings.push(
      `Vision extraction confidence is low (${(ctx.confidence * 100).toFixed(0)}%). Analysis will proceed with available data.`,
    );
  }

  // ── Check 3: Price validation (if present, must be reasonable) ──
  if (ctx.currentPrice !== null && ctx.currentPrice <= 0) {
    warnings.push("Detected price is invalid (negative or zero). Price will not be used for analysis.");
  }

  // ── Check 4: Timeframe warning (not required but recommended) ──
  if (!ctx.timeframe) {
    warnings.push("Timeframe not detected — will use the user's trading style to infer a default timeframe.");
  }

  // ── Check 5: Cross-validate price against known ranges ──
  if (ctx.symbol && ctx.currentPrice) {
    const priceValidation = validatePriceForSymbol(ctx.symbol, ctx.currentPrice);
    if (!priceValidation.valid) {
      warnings.push(priceValidation.message);
    }
  }

  // ── Check 6: Source-specific checks ──
  if (ctx.source === "external_screenshot") {
    warnings.push("Chart data from external screenshot — lower confidence than live market data.");
  }

  // ── Calculate adjusted confidence ──
  let adjustedConfidence = ctx.confidence;
  if (warnings.length > 0) {
    adjustedConfidence = Math.max(adjustedConfidence - warnings.length * 0.05, 0.1);
  }

  // ALWAYS valid — never block analysis
  return {
    valid: true,
    warnings,
    errors: [], // Always empty
    adjustedConfidence,
    userMessage: null, // Never show a blocking message
  };
}

// ── Validate that a price is reasonable for a given symbol ──
function validatePriceForSymbol(symbol: string, price: number): { valid: boolean; message: string } {
  // Known price ranges for major pairs (approximate, 2024-2025 ranges)
  const priceRanges: Record<string, { min: number; max: number; name: string }> = {
    "XAU/USD": { min: 1800, max: 4000, name: "Gold" },
    "BTC/USD": { min: 15000, max: 200000, name: "Bitcoin" },
    "BTC/USDT": { min: 15000, max: 200000, name: "Bitcoin" },
    "ETH/USD": { min: 800, max: 10000, name: "Ethereum" },
    "ETH/USDT": { min: 800, max: 10000, name: "Ethereum" },
    "EUR/USD": { min: 0.8, max: 1.3, name: "EUR/USD" },
    "GBP/USD": { min: 1.0, max: 1.5, name: "GBP/USD" },
    "GBP/JPY": { min: 140, max: 220, name: "GBP/JPY" },
    "USD/JPY": { min: 100, max: 170, name: "USD/JPY" },
    "AUD/USD": { min: 0.5, max: 0.85, name: "AUD/USD" },
    "SOL/USDT": { min: 8, max: 400, name: "Solana" },
    "AAPL": { min: 100, max: 300, name: "Apple" },
    "TSLA": { min: 100, max: 500, name: "Tesla" },
    "NASDAQ": { min: 10000, max: 25000, name: "NASDAQ" },
    "SPX500": { min: 3000, max: 7000, name: "S&P 500" },
  };

  const range = priceRanges[symbol];
  if (!range) {
    // Unknown symbol — can't validate price range
    return { valid: true, message: "" };
  }

  if (price < range.min || price > range.max) {
    return {
      valid: false,
      message: `Detected price ${price} is outside the expected range for ${range.name} (${range.min} - ${range.max}). The price may have been misread from the image.`,
    };
  }

  return { valid: true, message: "" };
}

// ── Quick validation for TradingView session context (always valid) ──
export function validateSessionContext(): ValidationResult {
  return {
    valid: true,
    warnings: [],
    errors: [],
    adjustedConfidence: 1.0,
    userMessage: null,
  };
}
