// ============================================================================
// VIXOR hit_tp ↔ status Invariant — Unit & Service Tests
// ============================================================================
// Task A4: Prove that the normalizeHitTp function and the DB trigger
// guarantee the canonical mapping, and that the service self-repairs
// corrupt state transparently.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeHitTp, STATUS_TO_HIT_TP } from "./signal-transition.service";
import { evaluateSignalTransition } from "./transition-engine";
import type { SignalTransitionRequest } from "./transition-engine";
import type { SignalStatus } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────────

const NOW = "2026-08-24T12:00:00.000Z";

function makeEngineRequest(
  overrides: Partial<SignalTransitionRequest> = {},
): SignalTransitionRequest {
  return {
    currentState: "pending",
    direction: "BUY",
    entryPrice: 100,
    stopLoss: 90,
    takeProfit: [110, 120, 130],
    hitTp: 0,
    observedPrice: 100,
    observedAt: NOW,
    ...overrides,
  };
}

// ── 1. normalizeHitTp: canonical mapping ──────────────────────────────────────

describe("normalizeHitTp", () => {
  // Valid combinations — should return the same value (no repair needed)

  it("pending + hit_tp=0 → 0 (no repair)", () => {
    expect(normalizeHitTp("pending", 0)).toBe(0);
  });

  it("active + hit_tp=0 → 0 (no repair)", () => {
    expect(normalizeHitTp("active", 0)).toBe(0);
  });

  it("tp1_hit + hit_tp=1 → 1 (no repair)", () => {
    expect(normalizeHitTp("tp1_hit", 1)).toBe(1);
  });

  it("tp2_hit + hit_tp=2 → 2 (no repair)", () => {
    expect(normalizeHitTp("tp2_hit", 2)).toBe(2);
  });

  it("tp3_hit + hit_tp=3 → 3 (no repair)", () => {
    expect(normalizeHitTp("tp3_hit", 3)).toBe(3);
  });

  it("sl_hit + hit_tp=0 → 0 (no repair)", () => {
    expect(normalizeHitTp("sl_hit", 0)).toBe(0);
  });

  it("expired + hit_tp=0 → 0 (no repair)", () => {
    expect(normalizeHitTp("expired", 0)).toBe(0);
  });

  it("cancelled + hit_tp=0 → 0 (no repair)", () => {
    expect(normalizeHitTp("cancelled", 0)).toBe(0);
  });

  it("invalidated + hit_tp=0 → 0 (no repair)", () => {
    expect(normalizeHitTp("invalidated", 0)).toBe(0);
  });

  // Invalid combinations — should repair to correct value

  it("tp1_hit + hit_tp=0 → repairs to 1", () => {
    expect(normalizeHitTp("tp1_hit", 0)).toBe(1);
  });

  it("tp1_hit + hit_tp=2 → repairs to 1", () => {
    expect(normalizeHitTp("tp1_hit", 2)).toBe(1);
  });

  it("tp1_hit + hit_tp=3 → repairs to 1", () => {
    expect(normalizeHitTp("tp1_hit", 3)).toBe(1);
  });

  it("tp2_hit + hit_tp=0 → repairs to 2", () => {
    expect(normalizeHitTp("tp2_hit", 0)).toBe(2);
  });

  it("tp2_hit + hit_tp=1 → repairs to 2", () => {
    expect(normalizeHitTp("tp2_hit", 1)).toBe(2);
  });

  it("tp2_hit + hit_tp=3 → repairs to 2", () => {
    expect(normalizeHitTp("tp2_hit", 3)).toBe(2);
  });

  it("tp3_hit + hit_tp=0 → repairs to 3", () => {
    expect(normalizeHitTp("tp3_hit", 0)).toBe(3);
  });

  it("tp3_hit + hit_tp=1 → repairs to 3", () => {
    expect(normalizeHitTp("tp3_hit", 1)).toBe(3);
  });

  it("tp3_hit + hit_tp=2 → repairs to 3", () => {
    expect(normalizeHitTp("tp3_hit", 2)).toBe(3);
  });

  it("active + hit_tp=1 → repairs to 0", () => {
    expect(normalizeHitTp("active", 1)).toBe(0);
  });

  it("active + hit_tp=2 → repairs to 0", () => {
    expect(normalizeHitTp("active", 2)).toBe(0);
  });

  it("active + hit_tp=3 → repairs to 0", () => {
    expect(normalizeHitTp("active", 3)).toBe(0);
  });

  it("pending + hit_tp=1 → repairs to 0", () => {
    expect(normalizeHitTp("pending", 1)).toBe(0);
  });

  it("pending + hit_tp=2 → repairs to 0", () => {
    expect(normalizeHitTp("pending", 2)).toBe(0);
  });

  it("pending + hit_tp=3 → repairs to 0", () => {
    expect(normalizeHitTp("pending", 3)).toBe(0);
  });

  it("sl_hit + hit_tp=1 → repairs to 0", () => {
    expect(normalizeHitTp("sl_hit", 1)).toBe(0);
  });

  it("sl_hit + hit_tp=2 → repairs to 0", () => {
    expect(normalizeHitTp("sl_hit", 2)).toBe(0);
  });

  it("sl_hit + hit_tp=3 → repairs to 0", () => {
    expect(normalizeHitTp("sl_hit", 3)).toBe(0);
  });

  it("expired + hit_tp=1 → repairs to 0", () => {
    expect(normalizeHitTp("expired", 1)).toBe(0);
  });

  it("cancelled + hit_tp=3 → repairs to 0", () => {
    expect(normalizeHitTp("cancelled", 3)).toBe(0);
  });

  it("invalidated + hit_tp=2 → repairs to 0", () => {
    expect(normalizeHitTp("invalidated", 2)).toBe(0);
  });

  // Edge cases

  it("unknown status + any hit_tp → defaults to 0", () => {
    expect(normalizeHitTp("unknown_future_status", 5)).toBe(0);
  });

  it("negative hit_tp → normalizes to correct value", () => {
    expect(normalizeHitTp("tp1_hit", -1)).toBe(1);
    expect(normalizeHitTp("pending", -5)).toBe(0);
  });
});

// ── 2. STATUS_TO_HIT_TP mapping completeness ──────────────────────────────────

describe("STATUS_TO_HIT_TP mapping", () => {
  const ALL_STATUSES: SignalStatus[] = [
    "pending",
    "active",
    "tp1_hit",
    "tp2_hit",
    "tp3_hit",
    "sl_hit",
    "invalidated",
    "expired",
    "cancelled",
  ];

  it("only tp1_hit, tp2_hit, tp3_hit have non-zero values", () => {
    for (const status of ALL_STATUSES) {
      const val = STATUS_TO_HIT_TP[status] ?? 0;
      if (status.startsWith("tp")) {
        expect(val).toBeGreaterThan(0);
      } else {
        expect(val).toBe(0);
      }
    }
  });

  it("tp1_hit=1, tp2_hit=2, tp3_hit=3 exactly", () => {
    expect(STATUS_TO_HIT_TP["tp1_hit"]).toBe(1);
    expect(STATUS_TO_HIT_TP["tp2_hit"]).toBe(2);
    expect(STATUS_TO_HIT_TP["tp3_hit"]).toBe(3);
  });
});

// ── 3. Engine behavior with corrupt hit_tp (pre-normalization scenario) ─────
// These tests prove that WITHOUT normalization, a corrupt hit_tp causes
// incorrect engine behavior. With normalization, the engine always gets
// the correct cursor.

describe("Engine correctness with corrupt hit_tp", () => {
  it("CORRUPT: tp1_hit + hit_tp=0 causes engine to check TP1 again (denied by matrix)", () => {
    // If hit_tp=0 while status=tp1_hit, the engine thinks next TP is index 0 (TP1)
    // and the transition matrix would try tp1_hit → tp1_hit which is NOT in the matrix
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: "tp1_hit",
        hitTp: 0, // CORRUPT: should be 1
        observedPrice: 121, // would hit TP2
      }),
    );

    // The engine tries to check TP1 (index 0) since hitTp=0
    // TP1=110, price=121 → TP1 would trigger
    // But transition matrix: tp1_hit → tp1_hit is NOT allowed
    // So the engine returns ILLEGAL_TRANSITION
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("ILLEGAL_TRANSITION");
  });

  it("NORMALIZED: tp1_hit + hit_tp=1 (correct) allows tp2_hit", () => {
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: "tp1_hit",
        hitTp: 1, // CORRECT
        observedPrice: 121, // hits TP2=120
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp2_hit");
    expect(result.event).toBe("TP2_HIT");
  });

  it("CORRUPT: tp2_hit + hit_tp=0 causes backward TP check (denied)", () => {
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: "tp2_hit",
        hitTp: 0, // CORRUPT: should be 2
        observedPrice: 131, // would hit TP3
      }),
    );

    // Engine checks TP1 (index 0) → transition matrix: tp2_hit → tp1_hit NOT allowed
    expect(result.allowed).toBe(false);
  });

  it("NORMALIZED: tp2_hit + hit_tp=2 (correct) allows tp3_hit", () => {
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: "tp2_hit",
        hitTp: 2, // CORRECT
        observedPrice: 131, // hits TP3=130
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp3_hit");
  });
});

// ── 4. Service-level invariant: corrupt DB state is transparently repaired ─────
// These tests simulate the service receiving a row with corrupt hit_tp
// and verify that the transition still works correctly because
// normalizeHitTp repairs the value before passing to the engine.

describe("Service: transparent hit_tp repair via normalizeHitTp", () => {
  it("tp1_hit + corrupt hit_tp=0: normalizeHitTp repairs to 1 before engine call", () => {
    // Simulate what the service does: read corrupt DB row, normalize, pass to engine
    const corruptStatus = "tp1_hit" as SignalStatus;
    const corruptHitTp = 0;

    // This is exactly what the service now does at line ~246
    const normalizedHitTp = normalizeHitTp(corruptStatus, corruptHitTp);
    expect(normalizedHitTp).toBe(1);

    // With normalized value, engine works correctly
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: corruptStatus,
        hitTp: normalizedHitTp,
        observedPrice: 121, // hits TP2=120
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp2_hit");
  });

  it("active + corrupt hit_tp=2: normalizeHitTp repairs to 0 before engine call", () => {
    const corruptStatus = "active" as SignalStatus;
    const corruptHitTp = 2;

    const normalizedHitTp = normalizeHitTp(corruptStatus, corruptHitTp);
    expect(normalizedHitTp).toBe(0);

    // With normalized value, engine correctly checks TP1 (index 0)
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: corruptStatus,
        hitTp: normalizedHitTp,
        observedPrice: 111, // hits TP1=110
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp1_hit");
  });

  it("pending + corrupt hit_tp=3: normalizeHitTp repairs to 0", () => {
    const normalizedHitTp = normalizeHitTp("pending", 3);
    expect(normalizedHitTp).toBe(0);
  });
});

// ── 5. SL transition from TP states resets hit_tp to 0 ─────────────────────────

describe("SL transition resets hit_tp correctly", () => {
  it("tp1_hit → sl_hit: STATUS_TO_HIT_TP maps sl_hit to 0", () => {
    expect(STATUS_TO_HIT_TP["sl_hit"] ?? 0).toBe(0);
  });

  it("tp2_hit → sl_hit: STATUS_TO_HIT_TP maps sl_hit to 0", () => {
    expect(STATUS_TO_HIT_TP["sl_hit"] ?? 0).toBe(0);
  });

  it("active → sl_hit: engine correctly transitions without hit_tp dependency", () => {
    // hit_tp is irrelevant for SL transitions — engine checks SL first
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: "active",
        hitTp: 0, // or any value — SL check doesn't use hitTp
        observedPrice: 89, // below SL=90
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });

  it("tp1_hit → sl_hit: engine transitions correctly regardless of hit_tp", () => {
    const result = evaluateSignalTransition(
      makeEngineRequest({
        currentState: "tp1_hit",
        hitTp: 1,
        observedPrice: 89, // below SL=90
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });
});

// ── 6. Console.warn on repair (observability) ────────────────────────────────────

describe("normalizeHitTp observability", () => {
  it("logs warning when repair is needed", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    normalizeHitTp("tp1_hit", 0); // mismatch: should warn

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("hit_tp invariant repair");
    expect(warnSpy.mock.calls[0][0]).toContain("tp1_hit");
    expect(warnSpy.mock.calls[0][0]).toContain("0");
    expect(warnSpy.mock.calls[0][0]).toContain("1");

    warnSpy.mockRestore();
  });

  it("does NOT log warning when value is correct", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    normalizeHitTp("tp1_hit", 1); // no mismatch

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
