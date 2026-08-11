// ============================================================================
// VIXOR shared/errors.ts — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ProviderError,
  fromSupabaseError,
  ERROR_STATUS_MAP,
  type ErrorCategory,
} from "./errors";

describe("DomainError", () => {
  it("1. has correct category, statusCode, message, and details", () => {
    const err = new DomainError("not_found", "Resource not found", {
      resource: "trade",
      id: "123",
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("DomainError");
    expect(err.message).toBe("Resource not found");
    expect(err.category).toBe("not_found");
    expect(err.statusCode).toBe(404);
    expect(err.details).toEqual({ resource: "trade", id: "123" });
  });

  it("10. is an instance of Error", () => {
    const err = new DomainError("internal", "something broke");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DomainError);
  });
});

describe("ValidationError", () => {
  it("2. extends DomainError and has field property", () => {
    const err = new ValidationError("entry_price", "Entry price must be positive");

    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ValidationError");
    expect(err.message).toBe("Entry price must be positive");
    expect(err.category).toBe("validation");
    expect(err.statusCode).toBe(400);
    expect(err.field).toBe("entry_price");
    expect(err.details).toEqual({ field: "entry_price" });
  });
});

describe("NotFoundError", () => {
  it("3a. with id", () => {
    const err = new NotFoundError("Trade", "trade-123");

    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("NotFoundError");
    expect(err.message).toBe("Trade not found: trade-123");
    expect(err.category).toBe("not_found");
    expect(err.statusCode).toBe(404);
    expect(err.details).toEqual({ resource: "Trade", id: "trade-123" });
  });

  it("3b. without id", () => {
    const err = new NotFoundError("Settings");

    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("NotFoundError");
    expect(err.message).toBe("Settings not found");
    expect(err.details).toEqual({ resource: "Settings", id: undefined });
  });
});

describe("UnauthorizedError", () => {
  it("4. has default message", () => {
    const err = new UnauthorizedError();

    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("UnauthorizedError");
    expect(err.message).toBe("Authentication required");
    expect(err.category).toBe("unauthorized");
    expect(err.statusCode).toBe(401);
  });

  it("4b. accepts custom message", () => {
    const err = new UnauthorizedError("Token expired");
    expect(err.message).toBe("Token expired");
  });
});

describe("ForbiddenError", () => {
  it("5. has default message", () => {
    const err = new ForbiddenError();

    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("ForbiddenError");
    expect(err.message).toBe("You do not have permission for this action");
    expect(err.category).toBe("forbidden");
    expect(err.statusCode).toBe(403);
  });

  it("5b. accepts custom message", () => {
    const err = new ForbiddenError("Admin only");
    expect(err.message).toBe("Admin only");
  });
});

describe("ConflictError", () => {
  it("6a. with details", () => {
    const err = new ConflictError("Duplicate signal", {
      pair: "BTC/USDT",
      date: "2026-08-11",
    });

    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("ConflictError");
    expect(err.message).toBe("Duplicate signal");
    expect(err.category).toBe("conflict");
    expect(err.statusCode).toBe(409);
    expect(err.details).toEqual({ pair: "BTC/USDT", date: "2026-08-11" });
  });

  it("6b. without details", () => {
    const err = new ConflictError("Already exists");

    expect(err).toBeInstanceOf(DomainError);
    expect(err.message).toBe("Already exists");
    expect(err.details).toBeUndefined();
  });
});

describe("ProviderError", () => {
  it("7. has provider property and formats message", () => {
    const err = new ProviderError("binance", "Rate limit exceeded");

    expect(err).toBeInstanceOf(DomainError);
    expect(err.name).toBe("ProviderError");
    expect(err.provider).toBe("binance");
    expect(err.message).toBe("Provider 'binance' failed: Rate limit exceeded");
    expect(err.category).toBe("provider_error");
    expect(err.statusCode).toBe(502);
    expect(err.details).toEqual({ provider: "binance" });
  });
});

describe("fromSupabaseError", () => {
  it("8a. maps PG 23505 → ConflictError", () => {
    const err = fromSupabaseError(
      { code: "23505", message: "duplicate key value", details: "Key (pair, date)" },
      "create signal",
    );

    expect(err).toBeInstanceOf(ConflictError);
    expect(err.category).toBe("conflict");
    expect(err.statusCode).toBe(409);
    expect(err.message).toContain("create signal");
    expect(err.message).toContain("duplicate");
  });

  it("8b. maps PG 23503 → ValidationError", () => {
    const err = fromSupabaseError(
      { code: "23503", message: "foreign key violation", details: "Key (user_id)" },
      "create trade",
    );

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.category).toBe("validation");
    expect(err.statusCode).toBe(400);
    expect(err.field).toBe("reference");
    expect(err.message).toContain("create trade");
  });

  it("8c. maps PG 42501 → ForbiddenError", () => {
    const err = fromSupabaseError(
      { code: "42501", message: "permission denied", details: "" },
      "delete user",
    );

    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.category).toBe("forbidden");
    expect(err.statusCode).toBe(403);
    expect(err.message).toContain("delete user");
  });

  it("8d. unknown code → DomainError with database_error", () => {
    const err = fromSupabaseError(
      { code: "XX000", message: "internal error", details: "" },
      "update settings",
    );

    expect(err).toBeInstanceOf(DomainError);
    expect(err).not.toBeInstanceOf(ConflictError);
    expect(err).not.toBeInstanceOf(ValidationError);
    expect(err).not.toBeInstanceOf(ForbiddenError);
    expect(err.category).toBe("database_error");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("update settings failed");
  });

  it("8e. no code → DomainError with database_error", () => {
    const err = fromSupabaseError({ message: "connection refused" }, "fetch data");

    expect(err).toBeInstanceOf(DomainError);
    expect(err.category).toBe("database_error");
    expect(err.message).toBe("fetch data failed");
  });
});

describe("ERROR_STATUS_MAP", () => {
  it("9. all categories have correct HTTP status codes", () => {
    const expected: Record<ErrorCategory, number> = {
      validation: 400,
      not_found: 404,
      unauthorized: 401,
      forbidden: 403,
      conflict: 409,
      provider_error: 502,
      database_error: 500,
      internal: 500,
    };

    for (const [category, expectedStatus] of Object.entries(expected)) {
      expect(ERROR_STATUS_MAP[category as ErrorCategory]).toBe(expectedStatus);
    }
  });
});
