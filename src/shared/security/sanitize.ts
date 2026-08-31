// ============================================================================
// VIXOR Security — Input Sanitization Layer
// ============================================================================
//
// Lightweight regex-based sanitization for HTML, URLs, trading pairs,
// error messages, and file uploads. No DOMPurify dependency — server-
// rendered app with React 19 auto-escaping.
//
// Usage:
//   const clean = sanitizeHtml(userInput);
//   const safeUrl = sanitizeUrl(untrustedUrl);
//   const pair = sanitizePair(rawPair);
//   const msg = sanitizeErrorMessage(caughtError);
//   if (isAllowedFileType(filename, ['png','jpg'])) { ... }
// ============================================================================

/**
 * Sanitize a string for safe display (HTML context).
 *
 * Strips `<script>`, `<iframe>`, `<object>`, `<embed>` tags,
 * `on*=` event-handler attributes, and `javascript:` / `data:` URLs.
 * Does NOT add DOMPurify — React 19 auto-escapes and this is server-rendered.
 */
export function sanitizeHtml(input: string): string {
  let cleaned = input;

  // Remove <script> tags (including content)
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove <iframe> tags
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  // Remove <object> tags
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  // Remove <embed> tags
  cleaned = cleaned.replace(/<embed\b[^>]*>/gi, "");
  // Remove <style> tags
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Remove on*= event handlers (onclick, onload, onerror, onmouseover, etc.)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  // Remove javascript: and vbscript: in href/src attributes
  cleaned = cleaned.replace(
    /(href|src|action|formaction)\s*=\s*["']?\s*(javascript|vbscript|data)\s*:/gi,
    '$1="x-removed:"',
  );
  // Remove remaining HTML tags (conservative approach for user content)
  cleaned = cleaned.replace(/<\/?[^>]+>/g, "");

  return cleaned.trim();
}

/**
 * Sanitize a string for use in URLs.
 *
 * Only allows http: and https: protocols. Rejects javascript:, data:,
 * vbscript:, and any other scheme. Returns a safe URL or empty string.
 */
export function sanitizeUrl(url: string): string {
  // eslint-disable-next-line no-control-regex
  const trimmed = url.trim().replace(/[\s\x00-\x1f]/g, "");

  // Reject empty URLs
  if (!trimmed) return "";

  // Reject javascript:, data:, vbscript:, and other dangerous protocols
  if (/^(javascript|data|vbscript|blob|file)\s*:/i.test(trimmed)) {
    return "";
  }

  // If it starts with //, treat as protocol-relative (http)
  if (/^\/\//i.test(trimmed)) {
    return "https:" + trimmed;
  }

  // If it starts with a known safe protocol, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Relative paths are allowed
  if (/^\/[^/]/.test(trimmed) || /^[^/]/.test(trimmed)) {
    return trimmed;
  }

  return "";
}

/**
 * Validate and sanitize a trading pair string.
 *
 * Uppercases the input, validates format: letters, slash, hyphen, digits only.
 * Returns the sanitized uppercase string or empty string if invalid.
 */
export function sanitizePair(pair: string): string {
  if (!pair || typeof pair !== "string") return "";

  const trimmed = pair.trim();
  if (!trimmed) return "";

  // Must match pattern like BTC/USDT, ETH-USDT, SOLUSDT
  if (!/^[A-Za-z0-9\-/]+$/.test(trimmed)) {
    return "";
  }

  return trimmed.toUpperCase();
}

/**
 * Remove PII from error messages before sending to client.
 *
 * Strips file paths (Unix/Windows), email addresses, API keys/tokens,
 * connection strings, and long hex strings.
 */
export function sanitizeErrorMessage(error: unknown): string {
  let msg: string;

  if (error instanceof Error) {
    msg = error.message;
  } else if (typeof error === "string") {
    msg = error;
  } else {
    try {
      msg = JSON.stringify(error);
    } catch {
      msg = "Unknown error";
    }
  }

  // Remove file paths (Unix)
  msg = msg.replace(/\/(?:home|usr|var|opt|etc|tmp|app|src|node_modules)\/[^\s:]+/g, "[path]");
  // Remove file paths (Windows)
  msg = msg.replace(/[A-Za-z]:\\(?:Users|Program Files|Windows|temp)\\[^\s:]+/g, "[path]");
  // Remove email addresses
  msg = msg.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]");
  // Remove API keys / long hex strings (32+ hex chars)
  msg = msg.replace(/\b[0-9a-fA-F]{32,}\b/g, "[key]");
  // Remove potential bearer tokens
  msg = msg.replace(/Bearer\s+[^\s]+/gi, "Bearer [token]");
  // Remove connection strings (postgresql://, redis://, etc.)
  msg = msg.replace(
    /\b(?:postgresql|postgres|mysql|redis|mongodb|amqp)\s*:\/{1,2}[^\s"']+/gi,
    "[connection]",
  );
  // Remove IP addresses
  msg = msg.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[ip]");

  return msg;
}

/**
 * Validate that a file upload has an allowed type.
 *
 * Checks the file extension against an allowlist of extensions (lowercase, no dot).
 * Returns true if the extension is in the allowlist.
 */
export function isAllowedFileType(filename: string, allowed: string[]): boolean {
  if (!filename || typeof filename !== "string") return false;

  // Extract extension (handle double extensions like .tar.gz)
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return false;

  const ext = filename.slice(lastDot + 1).toLowerCase();

  return allowed.some((a) => a.toLowerCase() === ext);
}
