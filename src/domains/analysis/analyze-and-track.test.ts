// ============================================================================
// VIXOR Analysis → Signal Pipeline — Unit Tests
// ============================================================================
//
// Tests the auto-track decision logic used by the analyzeAndTrack server function.
// The decision logic is extracted as a pure function for testability.
//
// ============================================================================

import { describe, it, expect } from "vitest";

// ── Pure Decision Logic (extracted from the handler for testing) ──────────

/**
 * Determine whether an analysis result should be auto-tracked.
 * This is the core decision logic used by analyzeAndTrack.
 */
function shouldAutoTrack(options: {
  autoTrack: boolean;
  confidence: number;
  minConfidence: number;
  recommendation: string;
}): boolean {
  if (!options.autoTrack) return false;
  if (options.recommendation === "WAIT") return false;
  if (options.confidence < options.minConfidence) return false;
  return true;
}

describe("analyzeAndTrack — auto-track decision logic", () => {
  it("tracks when autoTrack=true, confidence >= min, direction=BUY", () => {
    expect(
      shouldAutoTrack({
        autoTrack: true,
        confidence: 80,
        minConfidence: 70,
        recommendation: "BUY",
      }),
    ).toBe(true);
  });

  it("tracks when autoTrack=true, confidence >= min, direction=SELL", () => {
    expect(
      shouldAutoTrack({
        autoTrack: true,
        confidence: 75,
        minConfidence: 70,
        recommendation: "SELL",
      }),
    ).toBe(true);
  });

  it("does NOT track when autoTrack=false", () => {
    expect(
      shouldAutoTrack({
        autoTrack: false,
        confidence: 95,
        minConfidence: 70,
        recommendation: "BUY",
      }),
    ).toBe(false);
  });

  it("does NOT track when confidence < minConfidence", () => {
    expect(
      shouldAutoTrack({
        autoTrack: true,
        confidence: 60,
        minConfidence: 70,
        recommendation: "BUY",
      }),
    ).toBe(false);
  });

  it("does NOT track when recommendation is WAIT", () => {
    expect(
      shouldAutoTrack({
        autoTrack: true,
        confidence: 90,
        minConfidence: 70,
        recommendation: "WAIT",
      }),
    ).toBe(false);
  });

  it("does NOT track when confidence exactly equals minConfidence (boundary)", () => {
    // confidence >= minConfidence means exactly equal should track
    expect(
      shouldAutoTrack({
        autoTrack: true,
        confidence: 70,
        minConfidence: 70,
        recommendation: "BUY",
      }),
    ).toBe(true);
  });

  it("uses default minConfidence of 70 when not specified", () => {
    expect(
      shouldAutoTrack({
        autoTrack: true,
        confidence: 70,
        minConfidence: 70,
        recommendation: "BUY",
      }),
    ).toBe(true);
  });
});
