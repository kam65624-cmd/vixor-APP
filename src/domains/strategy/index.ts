// ============================================================================
// VIXOR Strategy Domain — Barrel Export
// ============================================================================
//
// The Strategy Domain provides runtime compilation and execution of
// user-defined trading strategies. Strategies are expressed as simple
// scripts that call indicator APIs (SMA, RSI, etc.) and order functions
// (buy, sell) via a sandboxed StrategyContext.
//
// Architecture:
//   - runtime/ → Strategy compilation, indicator parsing, execution engine
// ============================================================================

export {
  StrategyRuntime,
  IndicatorParamsParser,
  type CompileOptions,
  type IndicatorParam,
  type ParamType,
} from "./runtime";

export type {
  CompiledStrategy,
  IndicatorAPI,
  IndicatorOpts,
  IndicatorResult,
  RunConfig,
  StrategyContext,
  StrategyRunResult,
} from "./runtime";
