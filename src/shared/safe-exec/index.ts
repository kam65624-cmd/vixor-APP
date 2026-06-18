// ============================================================================
// VIXOR Safe Exec — Public API
// ============================================================================
//
// Barrel export for the safe-exec module: sandboxed execution of user-supplied
// JavaScript code (e.g., user-defined strategy scripts).
//
// Usage:
//   import { safeExec, validateCodeSafety } from "@/shared/safe-exec";
//
//   const result = await safeExec("return 1 + 2", { timeoutMs: 1000 });
//   if (result.success) {
//     console.log("Result:", result.result);
//   } else {
//     console.error("Failed:", result.error);
//   }
// ============================================================================

export { safeExec, safeExecSync, validateCodeSafety, isCodeSafe } from "./runner";

export type { SafeExecResult, SafeExecOptions, ValidationResult } from "./runner";

export { SAFE_GLOBALS } from "./validator";
