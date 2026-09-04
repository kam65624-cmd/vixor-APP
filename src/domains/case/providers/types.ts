// ============================================================================
// VIXOR V2 — Provider Result and Error Model
// ============================================================================
//
// Unified result shape for all case-domain providers.
// All providers (Discovery, TokenIntelligence, Evidence, SecurityScan, Outcome)
// return ProviderResult<T> so the UI can handle success, partial, empty,
// failed, unsupported, and loading states consistently.
//
// IMPORTANT: A failed or partial provider response must NEVER be coerced
// into a "safe" risk status by the UI or domain logic.
// ============================================================================

// ── Provider Status ────────────────────────────────────────────────────────

export const PROVIDER_STATUSES = [
  "success",
  "partial",
  "empty",
  "failed",
  "unsupported",
  "loading",
] as const;

export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

// ── Provider Error Codes ───────────────────────────────────────────────────

export const PROVIDER_ERROR_CODES = [
  "NETWORK_ERROR",
  "TIMEOUT",
  "RATE_LIMITED",
  "UNAUTHORIZED",
  "UNSUPPORTED_NETWORK",
  "INVALID_TARGET",
  "NO_DATA",
  "UPSTREAM_ERROR",
  "UNKNOWN_ERROR",
] as const;

export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];

// ── Provider Error (serializable, safe for client) ────────────────────────
//
// Must NOT contain API keys, tokens, private keys, environment values,
// or user-sensitive data.
//
export interface ProviderError {
  code: ProviderErrorCode;
  message: string;
  retryable: boolean;
  provider: string;
}

// ── Provider Warning ───────────────────────────────────────────────────────

export interface ProviderWarning {
  code: ProviderErrorCode | string;
  message: string;
  provider: string;
}

// ── Provider Result ────────────────────────────────────────────────────────

export interface ProviderResult<T> {
  data: T | null;
  status: ProviderStatus;
  source: string;
  fetchedAt: string;
  warnings?: ProviderWarning[];
  error?: ProviderError;
}

// ── Helper constructors ───────────────────────────────────────────────────

export function successResult<T>(data: T, source: string): ProviderResult<T> {
  return {
    data,
    status: "success",
    source,
    fetchedAt: new Date().toISOString(),
  };
}

export function partialResult<T>(
  data: T,
  source: string,
  warnings: ProviderWarning[],
): ProviderResult<T> {
  return {
    data,
    status: "partial",
    source,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}

export function emptyResult<T>(source: string): ProviderResult<T> {
  return {
    data: null,
    status: "empty",
    source,
    fetchedAt: new Date().toISOString(),
  };
}

export function failedResult<T>(source: string, error: ProviderError): ProviderResult<T> {
  return {
    data: null,
    status: "failed",
    source,
    fetchedAt: new Date().toISOString(),
    error,
  };
}

export function unsupportedResult<T>(source: string, reason: string): ProviderResult<T> {
  return {
    data: null,
    status: "unsupported",
    source,
    fetchedAt: new Date().toISOString(),
    error: {
      code: "UNSUPPORTED_NETWORK",
      message: reason,
      retryable: false,
      provider: source,
    },
  };
}

export function loadingResult<T>(source: string): ProviderResult<T> {
  return {
    data: null,
    status: "loading",
    source,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Type guards ────────────────────────────────────────────────────────────

export function isSuccess<T>(r: ProviderResult<T>): boolean {
  return r.status === "success";
}

export function isFailed<T>(r: ProviderResult<T>): boolean {
  return r.status === "failed" || r.status === "unsupported";
}

export function isPartial<T>(r: ProviderResult<T>): boolean {
  return r.status === "partial";
}

export function isEmpty<T>(r: ProviderResult<T>): boolean {
  return r.status === "empty";
}
