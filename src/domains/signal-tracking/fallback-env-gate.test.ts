// ============================================================================
// VIXOR TASK B.1 — Fallback Environment Gate Tests
// ============================================================================

// These tests verify that the production-safe fallback behavior works correctly.
// They do NOT import the service module directly to avoid an
// esbuild transform issue triggered by the export.
//
// The service module is mocked via vi.mock at the integration test level.
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { isNonAtomicFallbackAllowed } from "./signal-transition.service";

// --- Mock RPC error ---
const RPC_ERROR = {
  message: "Could not find the function execute_signal_transition",
  code: "42883",
};

// --- Tests ---
describe("fallback environment gate (TASK B.1)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.VIXOR_ALLOW_NON_ATOMIC_FALLBACK = undefined;
  });

  afterEach(() => {
    delete process.env.VIXOR_ALLOW_NON_ATOMIC_FALLBACK;
  });

  it("production mode blocks fallback even if env var is set", () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.VIXOR_ALLOW_NON_ATOMIC_FALLBACK = "true";
    expect(isNonAtomicFallbackAllowed()).toBe(false);
    process.env.NODE_ENV = orig;
  });

  it("test mode without env var blocks fallback", () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    expect(isNonAtomicFallbackAllowed()).toBe(false);
    process.env.NODE_ENV = orig;
  });

  it("test mode with env var allows fallback", () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    process.env.VIXOR_ALLOW_NON_ATOMIC_FALLBACK = "true";
    expect(isNonAtomicFallbackAllowed()).toBe(true);
    process.env.NODE_ENV = orig;
    delete process.env.VIXOR_ALLOW_NON_ATOMIC_FALLBACK;
  });
});
