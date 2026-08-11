// ============================================================================
// VIXOR Observability — Structured Error Handler Tests
// ============================================================================

import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleCaughtError, createErrorFallback } from "./error-handler";
import {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ProviderError,
} from "@/shared/errors";

// Mock structured logger and sentry (hoisted so vi.mock can reference them)
const { mockLog, mockCapture } = vi.hoisted(() => ({
  mockLog: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  mockCapture: vi.fn(),
}));

vi.mock("@/shared/structured-logger", () => ({
  log: mockLog,
}));

vi.mock("@/shared/sentry", () => ({
  captureException: mockCapture,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleCaughtError", () => {
  it("1. logs DomainError at info level (low severity)", () => {
    const err = new ValidationError("field", "Invalid value");
    handleCaughtError(err, { component: "Form" });

    expect(mockLog.info).toHaveBeenCalledWith(
      "Caught error",
      expect.objectContaining({
        component: "Form",
        errorCategory: "domain",
        severity: "low",
      }),
    );
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("2. logs ProviderError at error level (high severity) and reports", () => {
    const err = new ProviderError("binance", "Rate limited");
    handleCaughtError(err, { component: "API" });

    expect(mockLog.error).toHaveBeenCalledWith(
      "Caught error",
      expect.objectContaining({
        errorCategory: "domain",
        severity: "high",
      }),
    );
    expect(mockCapture).toHaveBeenCalledWith(err, expect.objectContaining({ severity: "high" }));
  });

  it("3. logs internal DomainError and reports to Sentry", () => {
    const err = new DomainError("internal", "Something broke");
    handleCaughtError(err, { action: "save" });

    expect(mockLog.error).toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalled();
  });

  it("4. logs network errors at warn level without reporting", () => {
    const err = new TypeError("Failed to fetch");
    handleCaughtError(err, { component: "Fetch" });

    expect(mockLog.warn).toHaveBeenCalledWith(
      "Caught error",
      expect.objectContaining({
        errorCategory: "network",
        severity: "medium",
      }),
    );
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("5. logs timeout errors at warn level without reporting", () => {
    const err = new Error("Request timed out");
    handleCaughtError(err, { component: "Request" });

    expect(mockLog.warn).toHaveBeenCalledWith(
      "Caught error",
      expect.objectContaining({
        errorCategory: "timeout",
      }),
    );
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("6. logs unknown errors at error level and reports", () => {
    const err = new Error("Unexpected crash");
    handleCaughtError(err, { component: "App" });

    expect(mockLog.error).toHaveBeenCalledWith(
      "Caught error",
      expect.objectContaining({
        errorCategory: "unknown",
        severity: "high",
      }),
    );
    expect(mockCapture).toHaveBeenCalled();
  });

  it("7. sanitizes error messages containing PII", () => {
    const err = new Error("Failed for user@test.com at /home/user/src/app.ts");
    handleCaughtError(err, { component: "Service" });

    const logCall = mockLog.error.mock.calls[0];
    const sanitizedMessage = logCall[1].sanitizedMessage;
    expect(sanitizedMessage).not.toContain("user@test.com");
    expect(sanitizedMessage).not.toContain("/home/user/src/app.ts");
    expect(sanitizedMessage).toContain("[email]");
    expect(sanitizedMessage).toContain("[path]");
  });

  it("8. handles non-Error thrown values", () => {
    handleCaughtError("string error", { action: "parse" });

    expect(mockLog.error).toHaveBeenCalledWith(
      "Caught error",
      expect.objectContaining({
        errorCategory: "unknown",
      }),
    );
    expect(mockCapture).toHaveBeenCalled();
  });

  it("9. never throws even if Sentry fails", () => {
    mockCapture.mockImplementationOnce(() => {
      throw new Error("Sentry down");
    });

    expect(() => {
      handleCaughtError(new Error("test"), { component: "Safe" });
    }).not.toThrow();

    // Still logged
    expect(mockLog.error).toHaveBeenCalled();
  });

  it("10. includes all context fields in log", () => {
    handleCaughtError(new Error("test"), {
      component: "TradeForm",
      action: "submit",
      userId: "u-123",
      route: "/trades",
    });

    const logCtx = mockLog.error.mock.calls[0][1];
    expect(logCtx.component).toBe("TradeForm");
    expect(logCtx.action).toBe("submit");
    expect(logCtx.userId).toBe("u-123");
    expect(logCtx.route).toBe("/trades");
  });
});

describe("createErrorFallback", () => {
  it("1. returns validation fallback for ValidationError", () => {
    const err = new ValidationError("price", "Must be positive");
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Invalid Input");
    expect(fallback.message).toBe("Must be positive");
    expect(fallback.icon).toBe("alert-circle");
  });

  it("2. returns not-found fallback for NotFoundError", () => {
    const err = new NotFoundError("Trade", "123");
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Not Found");
    expect(fallback.icon).toBe("search-x");
  });

  it("3. returns unauthorized fallback for UnauthorizedError", () => {
    const err = new UnauthorizedError();
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Sign In Required");
    expect(fallback.icon).toBe("lock");
  });

  it("4. returns forbidden fallback for ForbiddenError", () => {
    const err = new ForbiddenError();
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Access Denied");
    expect(fallback.icon).toBe("shield-x");
  });

  it("5. returns conflict fallback for ConflictError", () => {
    const err = new ConflictError("Duplicate");
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Conflict");
    expect(fallback.icon).toBe("alert-triangle");
  });

  it("6. returns provider fallback for ProviderError with safe message", () => {
    const err = new ProviderError("binance", "Rate limited");
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Service Unavailable");
    expect(fallback.message).not.toContain("binance");
    expect(fallback.icon).toBe("cloud-off");
  });

  it("7. returns generic fallback for unknown errors", () => {
    const err = new Error("DB password=secret");
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Something Went Wrong");
    expect(fallback.message).not.toContain("secret");
    expect(fallback.message).not.toContain("DB password");
    expect(fallback.icon).toBe("alert-triangle");
  });

  it("8. returns internal fallback for database_error DomainError", () => {
    const err = new DomainError("database_error", "Connection lost");
    const fallback = createErrorFallback(err);
    expect(fallback.title).toBe("Something Went Wrong");
    expect(fallback.message).toContain("notified");
    expect(fallback.icon).toBe("bug");
  });
});
