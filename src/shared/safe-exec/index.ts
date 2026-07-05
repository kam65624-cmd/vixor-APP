// ============================================================================
// VIXOR Safe Exec — Public API
// ============================================================================
//
// Barrel export for the safe-exec module: sandboxed execution of user-supplied
// JavaScript strategy code.
//
// Usage:
//   import { safeExecStrategy, validateStrategyCode } from "@/shared/safe-exec";
//   const res = await safeExecStrategy("return close > open;", { close: 150, open: 149 });
// ============================================================================

export { validateStrategyCode } from "./validator";
export type { ValidationResult } from "./validator";

export { safeExecStrategy } from "./runner";
export type { ExecResult, StrategyContext } from "./runner";
