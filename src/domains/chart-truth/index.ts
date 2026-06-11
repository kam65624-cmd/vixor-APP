// ============================================================================
// Vixor Chart Truth — Public API
// ============================================================================
//
// The Chart Truth Layer (P1.6) validates vision-extracted data against
// real market prices. It runs AFTER chart validation (confidence check)
// and BEFORE pair determination in the analysis pipeline.
//
// Key principle: This layer NEVER blocks analysis. It only warns.
// Even if the truth score is "unreliable", the analysis proceeds —
// because the local engine uses REAL OHLCV data, not the vision price.
//
// The truth layer's job is to flag when vision extraction might be wrong,
// so downstream consumers (copilot, debate engine, risk governor) can
// factor this into their decisions.
// ============================================================================

export { type TruthValidationResult, type TruthStatus } from "./types";
export { validateChartTruth } from "./market-truth.service";
export { reconcilePrice } from "./price-reconciler";
export { calculateTruthScore } from "./truth-score.engine";
