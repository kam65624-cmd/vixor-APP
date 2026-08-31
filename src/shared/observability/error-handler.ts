// ============================================================================
// VIXOR Observability — Structured Error Handler
// ============================================================================
//
// Centralized error handling with classification, structured logging,
// Sentry reporting (when configured), and error sanitization.
//
// Usage:
//   try {
//     await riskyOperation();
//   } catch (err) {
//     handleCaughtError(err, { component: 'TradeForm', action: 'submit' });
//   }
// ============================================================================

import { DomainError } from "@/shared/errors";
import { log } from "@/shared/structured-logger";
import { captureException } from "@/shared/sentry";
import { sanitizeErrorMessage } from "@/shared/security/sanitize";

// ── Error classification ───────────────────────────────────────────────────

/** Categories used for structured error classification. */
type ClassifiedCategory = "domain" | "validation" | "network" | "timeout" | "unknown";

/** Classified error result. */
interface ClassifiedError {
  category: ClassifiedCategory;
  severity: "low" | "medium" | "high" | "critical";
  sanitizedMessage: string;
  shouldReport: boolean;
}

/**
 * Classify an error into a structured category.
 *
 * - DomainError → 'domain' (use its category)
 * - Error with network keywords → 'network'
 * - Error with timeout keywords → 'timeout'
 * - Everything else → 'unknown'
 */
function classifyError(error: unknown): ClassifiedError {
  // DomainError: use its built-in category
  if (error instanceof DomainError) {
    const highSeverityCategories = ["database_error", "provider_error", "internal"];
    return {
      category: "domain",
      severity: highSeverityCategories.includes(error.category) ? "high" : "low",
      sanitizedMessage: error.message,
      shouldReport: highSeverityCategories.includes(error.category),
    };
  }

  // Standard Error: inspect message
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.constructor?.name || "Error";

    // Network errors
    if (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      name === "TypeError"
    ) {
      return {
        category: "network",
        severity: "medium",
        sanitizedMessage: sanitizeErrorMessage(error),
        shouldReport: false,
      };
    }

    // Timeout errors
    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("abort")) {
      return {
        category: "timeout",
        severity: "medium",
        sanitizedMessage: sanitizeErrorMessage(error),
        shouldReport: false,
      };
    }

    // Unknown Error — might be critical
    return {
      category: "unknown",
      severity: "high",
      sanitizedMessage: sanitizeErrorMessage(error),
      shouldReport: true,
    };
  }

  // Non-Error thrown value
  return {
    category: "unknown",
    severity: "high",
    sanitizedMessage: sanitizeErrorMessage(error),
    shouldReport: true,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Context metadata for handleCaughtError. */
export type ErrorContext = {
  component?: string;
  action?: string;
  userId?: string;
  route?: string;
  [key: string]: unknown;
};

/**
 * Handle a caught error with proper classification and reporting.
 *
 * 1. Classifies the error (DomainError, network, timeout, unknown).
 * 2. Logs via the structured logger.
 * 3. Reports to Sentry for 5xx-equivalent / high-severity errors.
 * 4. Sanitizes the message — never exposes internal details.
 * 5. Never throws — safe to use in catch blocks.
 */
export function handleCaughtError(error: unknown, context: ErrorContext): void {
  const classified = classifyError(error);

  // Build structured log context
  const logCtx: Record<string, unknown> = {
    ...context,
    errorCategory: classified.category,
    severity: classified.severity,
    sanitizedMessage: classified.sanitizedMessage,
  };

  // Log at appropriate level
  if (classified.severity === "critical" || classified.severity === "high") {
    log.error("Caught error", logCtx);
  } else if (classified.severity === "medium") {
    log.warn("Caught error", logCtx);
  } else {
    log.info("Caught error", logCtx);
  }

  // Report to Sentry for high-severity / shouldReport errors
  if (classified.shouldReport) {
    try {
      captureException(error, {
        context: logCtx,
        severity: classified.severity,
      });
    } catch {
      // Sentry reporting should never throw
    }
  }
}

/**
 * Create an error boundary fallback component data.
 *
 * Returns a safe, user-friendly error description — never exposes
 * internal implementation details.
 */
export function createErrorFallback(error: Error): {
  title: string;
  message: string;
  icon: string;
} {
  if (error instanceof DomainError) {
    // Domain errors have safe messages already
    switch (error.category) {
      case "validation":
        return { title: "Invalid Input", message: error.message, icon: "alert-circle" };
      case "not_found":
        return { title: "Not Found", message: error.message, icon: "search-x" };
      case "unauthorized":
        return { title: "Sign In Required", message: error.message, icon: "lock" };
      case "forbidden":
        return { title: "Access Denied", message: error.message, icon: "shield-x" };
      case "conflict":
        return { title: "Conflict", message: error.message, icon: "alert-triangle" };
      case "provider_error":
        return {
          title: "Service Unavailable",
          message: "An external service is temporarily unavailable. Please try again.",
          icon: "cloud-off",
        };
      case "database_error":
      case "internal":
        return {
          title: "Something Went Wrong",
          message: "An unexpected error occurred. Our team has been notified.",
          icon: "bug",
        };
    }
  }

  // Generic fallback — never expose internals
  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try refreshing the page.",
    icon: "alert-triangle",
  };
}
