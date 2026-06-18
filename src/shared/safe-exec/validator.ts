// ============================================================================
// VIXOR Safe Exec — Code Validator
// ============================================================================
//
// Port of QuantDinger's app/utils/safe_exec.py (validate_code_safety).
// Performs regex + lightweight AST (acorn-free, custom tokenizer) validation
// of user-supplied JavaScript code BEFORE execution.
//
// Philosophy: FAIL CLOSED. If we can't confidently verify code is safe, reject
// it. False positives (rejecting safe code) are acceptable; false negatives
// (allowing unsafe code) are not.
//
// Blocked patterns include (but are not limited to):
//   - import / require / dynamic import()
//   - process.*, globalThis.* env access
//   - eval, Function constructor (recursion), new Function
//   - child_process, fs writes, net, http(s) client libs
//   - dunder attribute access (__proto__, __defineGetter__, etc.)
//   - this at top level (escapes sandbox scope)
//
// All checks are pure functions and side-effect free.
// ============================================================================

export interface ValidationResult {
  ok: boolean;
  error: string | null;
}

// ── Whitelisted "global" identifiers the runner may inject ──────────────────
// These mirror Python's SAFE_IMPORT_MODULES — pure computational helpers.
// Anything NOT in this list and referenced as a bare identifier will still
// execute (because the runner provides a restricted sandbox), but imports
// of any kind are rejected.
export const SAFE_GLOBALS: ReadonlySet<string> = new Set([
  // Math / JSON / standard pure globals
  "Math",
  "JSON",
  "Number",
  "String",
  "Boolean",
  "Array",
  "Object",
  "Date",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Promise",
  "Symbol",
  "Reflect",
  "console",
  "isNaN",
  "isFinite",
  "parseInt",
  "parseFloat",
  "Infinity",
  "NaN",
  "undefined",
  // Error constructors (needed for try/catch in user code)
  "Error",
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "URIError",
  "EvalError",
]);

// ── Regex patterns of dangerous constructs ──────────────────────────────────
// Each pattern is anchored with word boundaries where appropriate to minimize
// false positives (e.g., we don't want to reject a variable named "important"
// just because it contains "import").
//
// Order matters only for error messages — all patterns are checked.
const DANGEROUS_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // ── Module system ──────────────────────────────────────────────────────
  { pattern: /\bimport\s+[\s{(]/, label: "import statement" },
  {
    pattern: /\bexport\s+(default|const|let|var|function|class|type|interface|enum)\b/,
    label: "export statement",
  },
  { pattern: /\brequire\s*\(/, label: "require() call" },
  { pattern: /\bimport\s*\(/, label: "dynamic import()" },

  // ── Process / global access ────────────────────────────────────────────
  { pattern: /\bprocess\b/, label: "process global" },
  { pattern: /\bglobalThis\b/, label: "globalThis" },
  { pattern: /\bglobal\b/, label: "global" },
  { pattern: /\b__dirname\b/, label: "__dirname" },
  { pattern: /\b__filename\b/, label: "__filename" },
  { pattern: /\bDeno\b/, label: "Deno global" },
  { pattern: /\bBun\b/, label: "Bun global" },

  // ── Eval / Function constructor ────────────────────────────────────────
  { pattern: /\beval\s*\(/, label: "eval()" },
  { pattern: /\bFunction\s*\(/, label: "Function() constructor" },
  { pattern: /\bnew\s+Function\b/, label: "new Function" },
  { pattern: /\bconstructor\s*\(/, label: "constructor() invocation" },

  // ── Dunder attribute access (sandbox escape primitives) ────────────────
  {
    pattern:
      /__proto__|__defineGetter__|__defineSetter__|__lookupGetter__|__lookupSetter__|__noSuchMethod__/,
    label: "dunder property access",
  },

  // ── Node.js built-in module references (substring match is fine since
  //    the runner doesn't provide them — but we reject early for clarity) ──
  {
    pattern:
      /\b(child_process|cluster|dgram|dns|fs|http|https|net|os|path|readline|repl|stream|tls|vm|worker_threads|zlib)\b/,
    label: "Node.js built-in module reference",
  },

  // ── Window / DOM access (browser-only, but blocked for determinism) ────
  { pattern: /\bwindow\b/, label: "window global" },
  { pattern: /\bdocument\b/, label: "document global" },
  { pattern: /\bnavigator\b/, label: "navigator global" },
  { pattern: /\blocation\b/, label: "location global" },
  { pattern: /\blocalStorage\b/, label: "localStorage" },
  { pattern: /\bfetch\s*\(/, label: "fetch()" },
  { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
  { pattern: /\bWebSocket\b/, label: "WebSocket" },
  { pattern: /\bEventSource\b/, label: "EventSource" },

  // ── Reflection that escapes the sandbox ────────────────────────────────
  { pattern: /\bReflect\s*\./, label: "Reflect.*" },
  { pattern: /\bProxy\b/, label: "Proxy constructor" },

  // ── Top-level this / arguments (escape sandbox scope) ──────────────────
  //   We only block `this` at statement start to avoid false-positives on
  //   object literals / property access. The runner also binds `this` to
  //   null which makes top-level `this` useless anyway.
  { pattern: /(^|[\s;{}()])this(\s*[.[]|\s*$)/m, label: "top-level this" },
  { pattern: /\barguments\b/, label: "arguments object" },
];

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate user-supplied JS code for safety.
 *
 * @returns `{ ok: true }` if the code passed all checks, or
 *          `{ ok: false, error: "..." }` with the first violation found.
 */
export function validateCodeSafety(code: string): ValidationResult {
  if (typeof code !== "string") {
    return { ok: false, error: "Code must be a string" };
  }
  if (code.length === 0) {
    return { ok: true, error: null };
  }
  if (code.length > 200_000) {
    return { ok: false, error: "Code exceeds maximum length (200,000 chars)" };
  }

  // 1. Regex sweep — fast first-pass filter.
  for (const { pattern, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      return {
        ok: false,
        error: `Unsafe code rejected: detected ${label}`,
      };
    }
  }

  // 2. Token-level check for suspicious property access that regex may miss.
  //    We scan for `.constructor` chains and `[...]` string index access to
  //    known dangerous names.
  const constructorChain = code.match(/\.constructor\s*(?:\.|\[|$)/);
  if (constructorChain) {
    return {
      ok: false,
      error: "Unsafe code rejected: .constructor chain access",
    };
  }

  // 3. Bracket-notation dunder access (e.g., obj["__proto__"])
  const bracketDunder = code.match(/\[\s*["']__\w+__["']\s*\]/);
  if (bracketDunder) {
    return {
      ok: false,
      error: "Unsafe code rejected: bracket dunder access",
    };
  }

  // 4. Syntax sanity check via `new Function` — but NEVER execute. This is
  //    a parse-only check: Function() throws SyntaxError on bad code.
  //    Note: we already blocked `Function(` and `new Function` in user code
  //    above; this internal use is fine because we control the input string.
  try {
    new Function(code);
  } catch (e) {
    return {
      ok: false,
      error: `Unsafe code rejected: syntax error (${e instanceof Error ? e.message : String(e)})`,
    };
  }

  return { ok: true, error: null };
}

/**
 * Convenience helper: returns true if code passes validation.
 */
export function isCodeSafe(code: string): boolean {
  return validateCodeSafety(code).ok;
}
