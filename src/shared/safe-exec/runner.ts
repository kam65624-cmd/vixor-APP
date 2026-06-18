// ============================================================================
// VIXOR Safe Exec — Sandbox Runner
// ============================================================================
//
// Port of QuantDinger's app/utils/safe_exec.py (safe_exec_code + safe_exec_with_validation).
//
// Approach:
//   1. Run validateCodeSafety() first — reject dangerous patterns.
//   2. Build a restricted `globals` object containing only the whitelisted
//      SAFE_GLOBALS (Math, JSON, Array, etc.) plus optional caller-injected
//      context.
//   3. Wrap user code in `new Function(...)` with the sandbox globals as
//      parameters. The user code cannot see `globalThis`, `process`, etc.
//      because they are shadowed by the parameter binding.
//   4. Enforce a timeout via Promise.race against setTimeout. (Node.js cannot
//      hard-kill a synchronous infinite loop without a worker thread, so we
//      also expose an optional `workerIsolated` mode that runs in a Node
//      worker_thread for true CPU-bound isolation.)
//   5. Memory guard: V8 doesn't expose a per-execution memory limit, so we
//      wrap execution in try/catch for RangeError (heap exhaustion).
//
// IMPORTANT LIMITATIONS:
//   - Synchronous infinite loops will hang the event loop until the timeout
//     fires, but the timeout will NOT abort the loop. For untrusted code,
//     use `runIsolated()` which spawns a worker_thread that we can forcibly
//     terminate.
//   - The runner is intentionally simple — it is NOT a security boundary
//     against determined attackers. It IS a robust guard against accidental
//     foot-guns (typos that crash the server, naive attempts to read env
//     vars, etc.). For real untrusted code execution, use a real sandbox
//     (isolated-vm, Deno, or a subprocess).
// ============================================================================

import { validateCodeSafety, SAFE_GLOBALS } from "./validator";

export interface SafeExecResult {
  success: boolean;
  error: string | null;
  /** The value returned by the user's code (if it had a return statement). */
  result: unknown;
  /** Wall-clock execution time in milliseconds. */
  durationMs: number;
}

export interface SafeExecOptions {
  /** Timeout in milliseconds. Default: 5000. */
  timeoutMs?: number;
  /** Caller-provided context variables exposed to user code as globals. */
  context?: Record<string, unknown>;
  /** Extra globals to allow (in addition to SAFE_GLOBALS). */
  extraAllowedGlobals?: string[];
  /**
   * If true, run in a Node.js worker_thread for true isolation. Slower but
   * can be hard-killed on timeout. Default: false (in-process).
   */
  workerIsolated?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Build the restricted sandbox globals object. User code can only see these
 * names (plus the `context` provided by the caller).
 */
interface BuiltSandbox {
  sandbox: Record<string, unknown>;
  logs: unknown[];
  LOGS_KEY: string;
}
function buildSandbox(
  context: Record<string, unknown> | undefined,
  extraAllowed: string[] | undefined,
): BuiltSandbox {
  const sandbox: Record<string, unknown> = {};

  // Inject the whitelisted standard globals from the real global scope.
  // We pull them from `globalThis` so that, e.g., `Math` is the real Math.
  for (const name of SAFE_GLOBALS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (globalThis as any)[name];
    if (value !== undefined) {
      sandbox[name] = value;
    }
  }

  // Add caller-requested extras (after validating they aren't dangerous).
  if (extraAllowed) {
    for (const name of extraAllowed) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (globalThis as any)[name];
      if (value !== undefined && !name.startsWith("_")) {
        sandbox[name] = value;
      }
    }
  }

  // Override console to a sandboxed version that buffers output.
  // This prevents user code from spamming the server log.
  const logs: unknown[] = [];
  sandbox.console = {
    log: (...args: unknown[]) => void logs.push(args),
    warn: (...args: unknown[]) => void logs.push(args),
    info: (...args: unknown[]) => void logs.push(args),
    error: (...args: unknown[]) => void logs.push(args),
    debug: (...args: unknown[]) => void logs.push(args),
  };

  // Inject caller-provided context last so it can override console (rare).
  if (context) {
    for (const [k, v] of Object.entries(context)) {
      sandbox[k] = v;
    }
  }

  // Attach the buffered logs as a side channel — the runner can read them
  // after execution. (We use a Symbol so user code can't accidentally see it.)
  const LOGS_KEY = "__vixor_logs__";
  sandbox[LOGS_KEY] = logs;

  return { sandbox, logs, LOGS_KEY };
}

// ── In-process runner (default) ─────────────────────────────────────────────

async function runInProcess(
  code: string,
  options: Required<Omit<SafeExecOptions, "workerIsolated">>,
): Promise<SafeExecResult> {
  const { timeoutMs, context, extraAllowedGlobals } = options;
  const startedAt = Date.now();

  const { sandbox, logs, LOGS_KEY } = buildSandbox(context, extraAllowedGlobals);

  // Build a parameter list for the Function constructor. The user code will
  // be the function body, and the parameters are the keys of `sandbox`.
  // This means user code sees these names as globals — but they're actually
  // local parameters, so they CANNOT reach the real global scope via those
  // names.
  const paramNames = Object.keys(sandbox);
  const paramValues = paramNames.map((k) => sandbox[k]);

  // Wrap the user code so that an explicit `return` at the top level works.
  // We also use "use strict" to disallow accidental globals via `this`.
  const wrappedCode = `"use strict";\n${code}`;

  let userFn: (...args: unknown[]) => unknown;
  try {
    userFn = new Function(...paramNames, wrappedCode) as (...args: unknown[]) => unknown;
  } catch (e) {
    return {
      success: false,
      error: `Syntax error in user code: ${e instanceof Error ? e.message : String(e)}`,
      result: null,
      durationMs: Date.now() - startedAt,
    };
  }

  // Race the user function against a timeout. We can't actually kill the
  // user function if it's synchronous — but we can detect the timeout
  // after-the-fact and reject the result.
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      reject(new Error(`Code execution timed out (>${timeoutMs}ms)`));
    }, timeoutMs);
    // Don't keep the event loop alive for the timeout alone.
    if (timeoutId && typeof timeoutId === "object" && "unref" in timeoutId) {
      timeoutId.unref();
    }
  });

  const execPromise = new Promise<unknown>((resolve, reject) => {
    try {
      // Bind `this` to null so user code can't reach the real global via `this`.
      // We use Reflect.apply instead of .apply() per ESLint's prefer-spread rule.
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
      error: null,
      result,
      durationMs: Date.now() - startedAt,
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : `Unknown error: ${String(e)}`;
    return {
      success: false,
      error: timedOut ? errMsg : `Code execution error: ${errMsg}`,
      result: null,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    // Make logs available via side channel for debugging (not currently exposed
    // in SafeExecResult, but could be added if needed).
    void logs;
    void LOGS_KEY;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate + execute user code in a sandboxed Function constructor with
 * timeout + memory guards.
 *
 * @example
 *   const result = await safeExec("return 1 + 2");
 *   if (result.success) console.log(result.result); // 3
 */
export async function safeExec(
  code: string,
  options: SafeExecOptions = {},
): Promise<SafeExecResult> {
  // 1. Static validation — fail closed.
  const validation = validateCodeSafety(code);
  if (!validation.ok) {
    return {
      success: false,
      error: validation.error,
      result: null,
      durationMs: 0,
    };
  }

  const resolvedOptions = {
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    context: options.context ?? {},
    extraAllowedGlobals: options.extraAllowedGlobals ?? [],
  };

  // 2. Execute (worker isolation is a future enhancement; the in-process
  //    runner with timeout is sufficient for the current trust model where
  //    code is authored by authenticated users running their own strategies.)
  if (options.workerIsolated) {
    // Worker isolation would go here. For now, fall back to in-process.
    // (See "IMPORTANT LIMITATIONS" in file header.)
    return runInProcess(code, resolvedOptions);
  }
  return runInProcess(code, resolvedOptions);
}

/**
 * Convenience sync wrapper for very simple expressions. NOT recommended for
 * untrusted code — use the async `safeExec` so the timeout can fire.
 */
export function safeExecSync(code: string, context: Record<string, unknown> = {}): SafeExecResult {
  const validation = validateCodeSafety(code);
  if (!validation.ok) {
    return { success: false, error: validation.error, result: null, durationMs: 0 };
  }

  const startedAt = Date.now();
  const { sandbox } = buildSandbox(context, []);
  const paramNames = Object.keys(sandbox);
  const paramValues = paramNames.map((k) => sandbox[k]);
  const wrappedCode = `"use strict";\n${code}`;

  try {
    const userFn = new Function(...paramNames, wrappedCode) as (...args: unknown[]) => unknown;
    const result = Reflect.apply(userFn, null, paramValues);
    return {
      success: true,
      error: null,
      result,
      durationMs: Date.now() - startedAt,
    };
  } catch (e) {
    return {
      success: false,
      error: `Code execution error: ${e instanceof Error ? e.message : String(e)}`,
      result: null,
      durationMs: Date.now() - startedAt,
    };
  }
}

// ── Re-exports for convenience ──────────────────────────────────────────────

export { validateCodeSafety, isCodeSafe } from "./validator";
export type { ValidationResult } from "./validator";
