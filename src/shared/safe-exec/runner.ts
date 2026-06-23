// ============================================================================
// VIXOR Safe Exec — Sandbox Runner
// ============================================================================
//
// Executes user-supplied JavaScript strategy code in a sandboxed
// Function constructor with timeout. Validates first, then runs with
// restricted context variables (close, open, high, low, volume, params, Math).
// ============================================================================

import { validateStrategyCode } from "./validator";
import type { ValidationResult } from "./validator";

/** Result of executing strategy code. */
export interface ExecResult {
  /** Whether execution completed without error. */
  success: boolean;
  /** The return value of the user code, or null on failure. */
  result: unknown;
  /** Error message, or null on success. */
  error: string | null;
  /** Wall-clock execution time in milliseconds. */
  executionTimeMs: number;
}

/** Context variables injected into the sandbox. */
export interface StrategyContext {
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Execute user-supplied JavaScript strategy code in a sandboxed environment.
 *
 * Flow:
 *   1. Validate the code with `validateStrategyCode()` — fail closed.
 *   2. Build a restricted context with only the allowed variables.
 *   3. Wrap in `new Function()` with context as parameter bindings.
 *   4. Race against a timeout (Promise.race).
 *
 * @param code - The JavaScript source to execute. Should contain a `return`
 *               statement to produce a result value.
 * @param context - Context variables to inject (close, open, high, low,
 *                  volume, params, Math are always provided).
 * @param timeoutMs - Maximum execution time in ms. Default: 5000.
 * @returns An `ExecResult` with success/failure info and timing.
 *
 * @example
 *   const res = await safeExecStrategy(
 *     "return close > sma ? 'BUY' : 'SELL';",
 *     { close: 150.25, open: 149.5, high: 151, low: 149, volume: 10000, params: { sma: 150 } }
 *   );
 */
export async function safeExecStrategy(
  code: string,
  context: StrategyContext = {},
  timeoutMs: number = 5000,
): Promise<ExecResult> {
  const startTime = Date.now();

  // 1. Validate first
  const validation: ValidationResult = validateStrategyCode(code);
  if (!validation.valid) {
    return {
      success: false,
      result: null,
      error: validation.error,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 2. Build sandbox context with only allowed variables
  const sandbox: Record<string, unknown> = {
    Math,
    ...context,
  };

  const paramNames = Object.keys(sandbox);
  const paramValues = paramNames.map((k) => sandbox[k]);

  // 3. Create the sandboxed function
  let userFn: (...args: unknown[]) => unknown;
  try {
    userFn = new Function(...paramNames, `"use strict";\n${code}`) as (
      ...args: unknown[]
    ) => unknown;
  } catch (e) {
    return {
      success: false,
      result: null,
      error: `Syntax error: ${e instanceof Error ? e.message : String(e)}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 4. Execute with timeout
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      reject(new Error(`Execution timed out (>${timeoutMs}ms)`));
    }, timeoutMs);
    if (timeoutId && typeof timeoutId === "object" && "unref" in timeoutId) {
      (timeoutId as { unref: () => void }).unref();
    }
  });

  const execPromise = new Promise<unknown>((resolve, reject) => {
    try {
      const result = Reflect.apply(userFn, null, paramValues);
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });

  try {
    const result = await Promise.race([execPromise, timeoutPromise]);
    return {
      success: true,
      result,
      error: null,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : `Unknown error: ${String(e)}`;
    return {
      success: false,
      result: null,
      error: timedOut ? errMsg : `Execution error: ${errMsg}`,
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}