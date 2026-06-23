// ============================================================================
// VIXOR Safe Exec — Code Validator
// ============================================================================
//
// Validates user-supplied JavaScript strategy code for dangerous patterns
// using regex blacklists and a try/catch parse check (since acorn is not
// installed). Philosophy: FAIL CLOSED — false positives are acceptable.
// ============================================================================

/** Result of validating strategy code for safety. */
export interface ValidationResult {
  /** True if the code passed all safety checks. */
  valid: boolean;
  /** Human-readable error description, or null if valid. */
  error: string | null;
}

/** Dangerous patterns that are absolutely forbidden in strategy code. */
const BLACKLIST_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // Module system
  { pattern: /\bprocess\b/, label: "process global" },
  { pattern: /\brequire\s*\(/, label: "require() call" },
  { pattern: /\bimport\s*\(/, label: "dynamic import()" },
  { pattern: /\bimport\s+[\s{(]/, label: "import statement" },

  // File system
  { pattern: /\bfs\b/, label: "fs module" },

  // Code execution
  { pattern: /\beval\s*\(/, label: "eval()" },
  { pattern: /\bFunction\s*\(/, label: "Function() constructor" },

  // Network access
  { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
  { pattern: /\bfetch\s*\(/, label: "fetch()" },
  { pattern: /\bWebSocket\b/, label: "WebSocket" },

  // Prototype pollution
  { pattern: /__proto__/, label: "__proto__ access" },
  { pattern: /prototype\s*\[/, label: "prototype[ access" },

  // Node.js globals that could leak secrets or escape sandbox
  { pattern: /\bglobalThis\b/, label: "globalThis" },
  { pattern: /\bglobal\b/, label: "global" },
  { pattern: /\b__dirname\b/, label: "__dirname" },
  { pattern: /\b__filename\b/, label: "__filename" },

  // DOM access (irrelevant in server context, but blocked for safety)
  { pattern: /\bwindow\b/, label: "window global" },
  { pattern: /\bdocument\b/, label: "document global" },
  { pattern: /\bnavigator\b/, label: "navigator global" },

  // Node built-in modules (catch references by name)
  {
    pattern:
      /\b(child_process|cluster|dgram|dns|http|https|net|os|path|readline|repl|stream|tls|vm|worker_threads|zlib)\b/,
    label: "Node.js built-in module reference",
  },
];

/**
 * Validate user-supplied JavaScript strategy code for safety.
 *
 * Uses regex blacklist patterns to detect dangerous constructs, plus a
 * `new Function()` parse check to catch syntax errors. Does NOT execute
 * the code.
 *
 * @param code - The JavaScript source code to validate.
 * @returns A `ValidationResult` indicating whether the code is safe.
 *
 * @example
 *   const result = validateStrategyCode("return close > open;");
 *   if (!result.valid) console.error(result.error);
 */
export function validateStrategyCode(code: string): ValidationResult {
  if (typeof code !== "string") {
    return { valid: false, error: "Code must be a string" };
  }
  if (code.length === 0) {
    return { valid: true, error: null };
  }
  if (code.length > 200_000) {
    return { valid: false, error: "Code exceeds maximum length (200,000 chars)" };
  }

  // 1. Regex blacklist sweep
  for (const { pattern, label } of BLACKLIST_PATTERNS) {
    if (pattern.test(code)) {
      return {
        valid: false,
        error: `Unsafe code rejected: detected ${label}`,
      };
    }
  }

  // 2. Detect bracket-notation dunder access (e.g., obj["__proto__"])
  const bracketDunder = code.match(/\[\s*["']__\w+__["']\s*\]/);
  if (bracketDunder) {
    return {
      valid: false,
      error: "Unsafe code rejected: bracket dunder access",
    };
  }

  // 3. Detect .constructor chain access (sandbox escape)
  const constructorChain = code.match(/\.constructor\s*(?:\.|\[|$)/);
  if (constructorChain) {
    return {
      valid: false,
      error: "Unsafe code rejected: .constructor chain access",
    };
  }

  // 4. Syntax sanity check via new Function (parse-only, never executed)
  try {
    new Function(code);
  } catch (e) {
    return {
      valid: false,
      error: `Syntax error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  return { valid: true, error: null };
}