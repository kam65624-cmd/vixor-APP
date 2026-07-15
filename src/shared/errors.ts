/** Base VIXOR application error */
export class VixorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "VixorError";
  }
}

export class NotFoundError extends VixorError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends VixorError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AuthError extends VixorError {
  constructor(message = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class RateLimitError extends VixorError {
  constructor() {
    super("Too many requests", "RATE_LIMIT", 429);
    this.name = "RateLimitError";
  }
}

export class ExternalAPIError extends VixorError {
  constructor(provider: string, message?: string) {
    super(message || `${provider} API error`, "EXTERNAL_API", 502);
    this.name = "ExternalAPIError";
  }
}

export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof VixorError) throw err;
    throw new VixorError(
      err instanceof Error ? err.message : "Unknown error",
      "INTERNAL_ERROR",
      500,
    );
  }
}
