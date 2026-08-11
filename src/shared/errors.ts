// ============================================================================
// VIXOR V2 — Domain Error Types (Phase 2: Error Model Foundation)
// ============================================================================
//
// Minimal error classification for domain and API errors.
// Does NOT expose internal implementation details to clients.
//
// Usage: throw new DomainError('not_found', 'Trade not found')
//        throw new ValidationError('entry_price', 'Entry price must be positive')
//
// ============================================================================

/** Error categories that determine HTTP response status and client behavior */
export type ErrorCategory =
  | "validation"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "provider_error"
  | "database_error"
  | "internal";

/** Map from error category to HTTP status code */
export const ERROR_STATUS_MAP: Record<ErrorCategory, number> = {
  validation: 400,
  not_found: 404,
  unauthorized: 401,
  forbidden: 403,
  conflict: 409,
  provider_error: 502,
  database_error: 500,
  internal: 500,
} as const;

/**
 * Domain error — the base error class for all VIXOR server-side errors.
 * Carries a structured category and safe message (no internals leaked).
 */
export class DomainError extends Error {
  readonly category: ErrorCategory;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(category: ErrorCategory, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "DomainError";
    this.category = category;
    this.statusCode = ERROR_STATUS_MAP[category];
    this.details = details;
  }
}

/**
 * Validation error — for input that fails schema or business rules.
 * `field` identifies which input field failed.
 */
export class ValidationError extends DomainError {
  readonly field: string;

  constructor(field: string, message: string) {
    super("validation", message, { field });
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Not found error — requested resource does not exist.
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super("not_found", msg, { resource, id });
    this.name = "NotFoundError";
  }
}

/**
 * Authorization error — caller is not authenticated.
 */
export class UnauthorizedError extends DomainError {
  constructor(message = "Authentication required") {
    super("unauthorized", message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden error — caller is authenticated but lacks permission.
 */
export class ForbiddenError extends DomainError {
  constructor(message = "You do not have permission for this action") {
    super("forbidden", message);
    this.name = "ForbiddenError";
  }
}

/**
 * Conflict error — the operation conflicts with existing state.
 */
export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("conflict", message, details);
    this.name = "ConflictError";
  }
}

/**
 * Provider error — an external data source or API failed.
 */
export class ProviderError extends DomainError {
  readonly provider: string;

  constructor(provider: string, message: string) {
    super("provider_error", `Provider '${provider}' failed: ${message}`, {
      provider,
    });
    this.name = "ProviderError";
    this.provider = provider;
  }
}

/**
 * Utility: categorize a Supabase error into a DomainError.
 * Prevents leaking database error details to clients.
 */
export function fromSupabaseError(
  error: { code?: string; message: string; details?: string },
  context: string,
): DomainError {
  if (error.code === "23505") {
    return new ConflictError(`${context}: duplicate entry`);
  }
  if (error.code === "23503") {
    return new ValidationError("reference", `${context}: referenced resource not found`);
  }
  if (error.code === "42501") {
    return new ForbiddenError(`${context}: insufficient permissions`);
  }
  // Default: do not expose internal error details
  return new DomainError("database_error", `${context} failed`);
}
