// ============================================================================
// VIXOR Signal Transition Engine — Unit Tests
// ============================================================================
// Covers: legal/illegal transitions, BUY/SELL symmetry, boundary prices,
// TP ordering, terminal states, non-price transitions, WAIT direction,
// invalid inputs, SL priority over TP.
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateSignalTransition,
  isTerminalStatus,
  TRANSITION_TERMINAL_STATUSES,
} from "./transition-engine";
import type { SignalTransitionRequest } from "./transition-engine";

// ── Test Helpers ──────────────────────────────────────────────────────────────

const NOW = "2026-08-09T12:00:00.000Z";

function makeRequest(overrides: Partial<SignalTransitionRequest> = {}): SignalTransitionRequest {
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

// ── Terminal Status Set ───────────────────────────────────────────────────────

describe("TRANSITION_TERMINAL_STATUSES", () => {
  it("includes tp3_hit, sl_hit, invalidated, expired, cancelled", () => {
    expect(TRANSITION_TERMINAL_STATUSES.has("tp3_hit")).toBe(true);
    expect(TRANSITION_TERMINAL_STATUSES.has("sl_hit")).toBe(true);
    expect(TRANSITION_TERMINAL_STATUSES.has("invalidated")).toBe(true);
    expect(TRANSITION_TERMINAL_STATUSES.has("expired")).toBe(true);
    expect(TRANSITION_TERMINAL_STATUSES.has("cancelled")).toBe(true);
  });

  it("does NOT include tp1_hit or tp2_hit (they are intermediate)", () => {
    expect(TRANSITION_TERMINAL_STATUSES.has("tp1_hit")).toBe(false);
    expect(TRANSITION_TERMINAL_STATUSES.has("tp2_hit")).toBe(false);
    expect(TRANSITION_TERMINAL_STATUSES.has("pending")).toBe(false);
    expect(TRANSITION_TERMINAL_STATUSES.has("active")).toBe(false);
  });
});

describe("isTerminalStatus", () => {
  it("returns true for terminal states", () => {
    expect(isTerminalStatus("tp3_hit")).toBe(true);
    expect(isTerminalStatus("sl_hit")).toBe(true);
    expect(isTerminalStatus("invalidated")).toBe(true);
    expect(isTerminalStatus("expired")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
  });

  it("returns false for intermediate states", () => {
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("active")).toBe(false);
    expect(isTerminalStatus("tp1_hit")).toBe(false);
    expect(isTerminalStatus("tp2_hit")).toBe(false);
  });
});

// ── BUY Entry ─────────────────────────────────────────────────────────────────

describe("BUY Entry", () => {
  it("allows pending → active when price drops to entry", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: 100,
        observedPrice: 99,
      }),
    );
    expect(result).toEqual({
      allowed: true,
      from: "pending",
      to: "active",
      event: "ENTRY_REACHED",
      price: 99,
    });
  });

  it("allows pending → active at exact entry price", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: 100,
        observedPrice: 100,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("active");
    expect(result.event).toBe("ENTRY_REACHED");
    expect(result.price).toBe(100);
  });

  it("denies entry when price is above entry", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: 100,
        observedPrice: 101,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.to).toBeNull();
    expect(result.reason).toContain("ENTRY_NOT_REACHED");
  });

  it("denies entry when entryPrice is null", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: null,
        observedPrice: 95,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("MISSING_ENTRY_PRICE");
  });
});

// ── SELL Entry ────────────────────────────────────────────────────────────────

describe("SELL Entry", () => {
  it("allows pending → active when price rises to entry", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "SELL",
        entryPrice: 100,
        observedPrice: 101,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("active");
    expect(result.event).toBe("ENTRY_REACHED");
  });

  it("allows pending → active at exact entry price", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "SELL",
        entryPrice: 100,
        observedPrice: 100,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("active");
  });

  it("denies entry when price is below entry", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "SELL",
        entryPrice: 100,
        observedPrice: 99,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("ENTRY_NOT_REACHED");
  });
});

// ── BUY Stop Loss ─────────────────────────────────────────────────────────────

describe("BUY Stop Loss", () => {
  it("allows active → sl_hit when price drops to SL", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "active", direction: "BUY", stopLoss: 90, observedPrice: 89 }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
    expect(result.event).toBe("SL_HIT");
    expect(result.price).toBe(89);
  });

  it("allows sl_hit at exact SL price", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "active", direction: "BUY", stopLoss: 90, observedPrice: 90 }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });

  it("denies SL when price is above SL", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "active", direction: "BUY", stopLoss: 90, observedPrice: 95 }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("NO_TRIGGER");
  });

  it("allows sl_hit from tp1_hit state", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp1_hit",
        direction: "BUY",
        stopLoss: 90,
        observedPrice: 89,
        hitTp: 1,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
    expect(result.event).toBe("SL_HIT");
  });

  it("allows sl_hit from tp2_hit state", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp2_hit",
        direction: "BUY",
        stopLoss: 90,
        observedPrice: 89,
        hitTp: 2,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });
});

// ── SELL Stop Loss ────────────────────────────────────────────────────────────

describe("SELL Stop Loss", () => {
  it("allows active → sl_hit when price rises to SL", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "active", direction: "SELL", stopLoss: 110, observedPrice: 111 }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
    expect(result.event).toBe("SL_HIT");
  });

  it("allows sl_hit at exact SL price", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "active", direction: "SELL", stopLoss: 110, observedPrice: 110 }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });

  it("denies SL when price is below SL", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "SELL",
        entryPrice: 100,
        stopLoss: 110,
        takeProfit: [80, 70, 60],
        hitTp: 0,
        observedPrice: 105,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("NO_TRIGGER");
  });
});

// ── BUY Take Profit ───────────────────────────────────────────────────────────

describe("BUY Take Profit", () => {
  it("allows active → tp1_hit when price rises to TP1", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 0,
        observedPrice: 111,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp1_hit");
    expect(result.event).toBe("TP1_HIT");
    expect(result.price).toBe(111);
    expect(result.tpIndex).toBe(0);
  });

  it("allows tp1_hit → tp2_hit when price reaches TP2", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp1_hit",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 1,
        observedPrice: 121,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp2_hit");
    expect(result.event).toBe("TP2_HIT");
    expect(result.tpIndex).toBe(1);
  });

  it("allows tp2_hit → tp3_hit when price reaches TP3", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp2_hit",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 2,
        observedPrice: 131,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp3_hit");
    expect(result.event).toBe("TP3_HIT");
    expect(result.tpIndex).toBe(2);
  });

  it("allows TP at exact TP price", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 0,
        observedPrice: 110,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp1_hit");
  });

  it("denies TP when price has not reached TP level", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 0,
        observedPrice: 105,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("NO_TRIGGER");
  });
});

// ── SELL Take Profit ──────────────────────────────────────────────────────────

describe("SELL Take Profit", () => {
  it("allows active → tp1_hit when price drops to TP1", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "SELL",
        takeProfit: [90, 80, 70],
        hitTp: 0,
        observedPrice: 89,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp1_hit");
    expect(result.event).toBe("TP1_HIT");
    expect(result.tpIndex).toBe(0);
  });

  it("allows tp1_hit → tp2_hit when price drops to TP2", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp1_hit",
        direction: "SELL",
        takeProfit: [90, 80, 70],
        hitTp: 1,
        observedPrice: 79,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp2_hit");
    expect(result.event).toBe("TP2_HIT");
    expect(result.tpIndex).toBe(1);
  });

  it("allows tp2_hit → tp3_hit when price drops to TP3", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp2_hit",
        direction: "SELL",
        takeProfit: [90, 80, 70],
        hitTp: 2,
        observedPrice: 69,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp3_hit");
    expect(result.event).toBe("TP3_HIT");
    expect(result.tpIndex).toBe(2);
  });

  it("denies TP when price has not reached TP level", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "SELL",
        entryPrice: 100,
        stopLoss: 120,
        takeProfit: [90, 80, 70],
        hitTp: 0,
        observedPrice: 95,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("NO_TRIGGER");
  });
});

// ── TP Sequential Ordering ────────────────────────────────────────────────────

describe("TP Sequential Ordering", () => {
  it("denies TP2 when still in active state (must go TP1 first)", () => {
    // Price jumped past TP1 to TP2, but engine only checks next TP in sequence
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 0, // next TP to check is TP1 (index 0)
        observedPrice: 125, // past TP1 and TP2
      }),
    );
    // Engine should trigger TP1 (the next in sequence), not TP2
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp1_hit");
    expect(result.tpIndex).toBe(0);
  });

  it("denies TP3 when in tp1_hit state (must go TP2 first)", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp1_hit",
        direction: "BUY",
        takeProfit: [110, 120, 130],
        hitTp: 1, // next TP to check is TP2 (index 1)
        observedPrice: 135, // past TP2 and TP3
      }),
    );
    // Engine should trigger TP2 (the next in sequence), not TP3
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp2_hit");
    expect(result.tpIndex).toBe(1);
  });

  it("full lifecycle: pending → active → tp1 → tp2 → tp3", () => {
    const setup = {
      direction: "BUY" as const,
      entryPrice: 100,
      stopLoss: 90,
      takeProfit: [110, 120, 130] as number[],
    };

    // Step 1: Entry
    const r1 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "pending", hitTp: 0, observedPrice: 99 }),
    );
    expect(r1.allowed).toBe(true);
    expect(r1.to).toBe("active");

    // Step 2: TP1
    const r2 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "active", hitTp: 0, observedPrice: 111 }),
    );
    expect(r2.allowed).toBe(true);
    expect(r2.to).toBe("tp1_hit");
    expect(r2.tpIndex).toBe(0);

    // Step 3: TP2
    const r3 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "tp1_hit", hitTp: 1, observedPrice: 121 }),
    );
    expect(r3.allowed).toBe(true);
    expect(r3.to).toBe("tp2_hit");
    expect(r3.tpIndex).toBe(1);

    // Step 4: TP3
    const r4 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "tp2_hit", hitTp: 2, observedPrice: 131 }),
    );
    expect(r4.allowed).toBe(true);
    expect(r4.to).toBe("tp3_hit");
    expect(r4.tpIndex).toBe(2);

    // Step 5: Terminal — no more transitions
    const r5 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "tp3_hit", hitTp: 3, observedPrice: 200 }),
    );
    expect(r5.allowed).toBe(false);
    expect(r5.reason).toContain("TERMINAL_STATE");
  });
});

// ── SL Priority Over TP ──────────────────────────────────────────────────────

describe("SL Priority Over TP", () => {
  it("BUY: SL triggers even when TP is also reachable", () => {
    // Price dropped below both SL and all TPs (impossible for BUY, but tests priority)
    // Better test: price at SL level when TP would also trigger
    // For BUY: SL=90, TP1=110. Price at 89 triggers SL, not TP.
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        stopLoss: 90,
        takeProfit: [110, 120, 130],
        hitTp: 0,
        observedPrice: 89, // below SL (90) and below entry (100)
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
    expect(result.event).toBe("SL_HIT");
  });

  it("SELL: SL triggers even when TP is also reachable", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "SELL",
        entryPrice: 100,
        stopLoss: 110,
        takeProfit: [90, 80, 70],
        hitTp: 0,
        observedPrice: 111, // above SL (110)
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
    expect(result.event).toBe("SL_HIT");
  });

  it("SL from tp1_hit takes priority over TP2", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "tp1_hit",
        direction: "BUY",
        stopLoss: 90,
        takeProfit: [110, 120, 130],
        hitTp: 1,
        observedPrice: 89,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });
});

// ── Terminal State Protection ─────────────────────────────────────────────────

describe("Terminal State Protection", () => {
  const terminalStates = ["tp3_hit", "sl_hit", "invalidated", "expired", "cancelled"] as const;

  for (const terminal of terminalStates) {
    describe(`when current state is '${terminal}'`, () => {
      it("denies price-based transitions", () => {
        const result = evaluateSignalTransition(
          makeRequest({ currentState: terminal, observedPrice: 1 }),
        );
        expect(result.allowed).toBe(false);
        expect(result.to).toBeNull();
        expect(result.reason).toContain("TERMINAL_STATE");
      });

      it("denies cancel transition", () => {
        const result = evaluateSignalTransition(
          makeRequest({ currentState: terminal, requestedTransition: "cancelled" }),
        );
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("TERMINAL_STATE");
      });

      it("denies expire transition", () => {
        const result = evaluateSignalTransition(
          makeRequest({ currentState: terminal, requestedTransition: "expired" }),
        );
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("TERMINAL_STATE");
      });

      it("denies invalidate transition", () => {
        const result = evaluateSignalTransition(
          makeRequest({ currentState: terminal, requestedTransition: "invalidated" }),
        );
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("TERMINAL_STATE");
      });
    });
  }
});

// ── Non-Price Transitions ─────────────────────────────────────────────────────

describe("Non-Price Transitions", () => {
  describe("cancel", () => {
    it("allows pending → cancelled", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "pending",
          requestedTransition: "cancelled",
          observedPrice: 105,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("cancelled");
      expect(result.event).toBe("SIGNAL_CANCELLED");
      expect(result.price).toBe(105);
    });

    it("allows active → cancelled", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "active",
          requestedTransition: "cancelled",
          observedPrice: 105,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("cancelled");
    });

    it("allows tp1_hit → cancelled", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "tp1_hit",
          hitTp: 1,
          requestedTransition: "cancelled",
          observedPrice: 115,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("cancelled");
    });

    it("allows tp2_hit → cancelled", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "tp2_hit",
          hitTp: 2,
          requestedTransition: "cancelled",
          observedPrice: 125,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("cancelled");
    });
  });

  describe("expire", () => {
    it("allows pending → expired", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "pending",
          requestedTransition: "expired",
          observedPrice: 105,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("expired");
      expect(result.event).toBe("SIGNAL_EXPIRED");
    });

    it("allows active → expired", () => {
      const result = evaluateSignalTransition(
        makeRequest({ currentState: "active", requestedTransition: "expired", observedPrice: 105 }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("expired");
    });
  });

  describe("invalidate", () => {
    it("allows pending → invalidated", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "pending",
          requestedTransition: "invalidated",
          observedPrice: 105,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("invalidated");
      expect(result.event).toBe("SIGNAL_INVALIDATED");
    });

    it("allows active → invalidated", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "active",
          requestedTransition: "invalidated",
          observedPrice: 105,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("invalidated");
    });

    it("allows tp1_hit → invalidated", () => {
      const result = evaluateSignalTransition(
        makeRequest({
          currentState: "tp1_hit",
          hitTp: 1,
          requestedTransition: "invalidated",
          observedPrice: 115,
        }),
      );
      expect(result.allowed).toBe(true);
      expect(result.to).toBe("invalidated");
    });
  });

  it("denies invalid requestedTransition value", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        requestedTransition: "tp1_hit" as any,
        observedPrice: 105,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_REQUESTED_TRANSITION");
  });
});

// ── WAIT Direction ─────────────────────────────────────────────────────────────

describe("WAIT Direction", () => {
  it("denies price-based transition", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "pending", direction: "WAIT", observedPrice: 95 }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("WAIT_DIRECTION");
  });

  it("allows cancel from WAIT", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "WAIT",
        requestedTransition: "cancelled",
        observedPrice: 95,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("cancelled");
  });

  it("allows expire from WAIT", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "WAIT",
        requestedTransition: "expired",
        observedPrice: 95,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("expired");
  });
});

// ── Invalid Inputs ────────────────────────────────────────────────────────────

describe("Invalid Inputs", () => {
  it("denies negative price", () => {
    const result = evaluateSignalTransition(makeRequest({ observedPrice: -1 }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_PRICE");
  });

  it("denies zero price", () => {
    const result = evaluateSignalTransition(makeRequest({ observedPrice: 0 }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_PRICE");
  });

  it("denies NaN price", () => {
    const result = evaluateSignalTransition(makeRequest({ observedPrice: NaN }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_PRICE");
  });

  it("denies Infinity price", () => {
    const result = evaluateSignalTransition(makeRequest({ observedPrice: Infinity }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_PRICE");
  });

  it("denies -Infinity price", () => {
    const result = evaluateSignalTransition(makeRequest({ observedPrice: -Infinity }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_PRICE");
  });

  it("denies invalid timestamp", () => {
    const result = evaluateSignalTransition(makeRequest({ observedAt: "not-a-date" }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_TIMESTAMP");
  });

  it("denies empty timestamp", () => {
    const result = evaluateSignalTransition(makeRequest({ observedAt: "" }));
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INVALID_TIMESTAMP");
  });

  it("denies null entryPrice for pending", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: null,
        observedPrice: 95,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("MISSING_ENTRY_PRICE");
  });

  it("denies zero entryPrice for pending", () => {
    const result = evaluateSignalTransition(
      makeRequest({ currentState: "pending", direction: "BUY", entryPrice: 0, observedPrice: 95 }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("MISSING_ENTRY_PRICE");
  });
});

// ── No Trigger ────────────────────────────────────────────────────────────────

describe("No Trigger", () => {
  it("returns NO_TRIGGER when price is between levels", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        stopLoss: 90,
        takeProfit: [110, 120, 130],
        hitTp: 0,
        observedPrice: 105, // between entry (100) and TP1 (110)
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("NO_TRIGGER");
    expect(result.from).toBe("active");
    expect(result.to).toBeNull();
  });

  it("returns ENTRY_NOT_REACHED for pending when price is far from entry", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: 100,
        observedPrice: 200, // way above BUY entry
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("ENTRY_NOT_REACHED");
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

describe("Edge Cases", () => {
  it("handles empty takeProfit array (only SL monitoring)", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        takeProfit: [],
        stopLoss: 90,
        hitTp: 0,
        observedPrice: 89,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });

  it("handles null takeProfit (only SL monitoring)", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        takeProfit: null,
        stopLoss: 90,
        hitTp: 0,
        observedPrice: 89,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("sl_hit");
  });

  it("handles null stopLoss (only TP monitoring)", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        stopLoss: null,
        takeProfit: [110, 120, 130],
        hitTp: 0,
        observedPrice: 111,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.to).toBe("tp1_hit");
  });

  it("handles both null SL and TP (no trigger possible)", () => {
    const result = evaluateSignalTransition(
      makeRequest({
        currentState: "active",
        direction: "BUY",
        stopLoss: null,
        takeProfit: null,
        hitTp: 0,
        observedPrice: 105,
      }),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("NO_TRIGGER");
  });

  it("decision always has 'from' set to currentState", () => {
    const states: Array<SignalTransitionRequest["currentState"]> = [
      "pending",
      "active",
      "tp1_hit",
      "tp2_hit",
    ];
    for (const state of states) {
      const result = evaluateSignalTransition(
        makeRequest({ currentState: state, observedPrice: 50 }),
      );
      expect(result.from).toBe(state);
    }
  });

  it("tpIndex is undefined for non-TP transitions", () => {
    const entry = evaluateSignalTransition(
      makeRequest({
        currentState: "pending",
        direction: "BUY",
        entryPrice: 100,
        observedPrice: 99,
      }),
    );
    expect(entry.tpIndex).toBeUndefined();

    const sl = evaluateSignalTransition(
      makeRequest({ currentState: "active", direction: "BUY", stopLoss: 90, observedPrice: 89 }),
    );
    expect(sl.tpIndex).toBeUndefined();

    const cancel = evaluateSignalTransition(
      makeRequest({ currentState: "active", requestedTransition: "cancelled", observedPrice: 105 }),
    );
    expect(cancel.tpIndex).toBeUndefined();
  });

  it("full SELL lifecycle: entry → TP1 → SL", () => {
    const setup = {
      direction: "SELL" as const,
      entryPrice: 100,
      stopLoss: 110,
      takeProfit: [90, 80, 70] as number[],
    };

    // Entry: price rises to 101
    const r1 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "pending", hitTp: 0, observedPrice: 101 }),
    );
    expect(r1.to).toBe("active");

    // TP1: price drops to 89
    const r2 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "active", hitTp: 0, observedPrice: 89 }),
    );
    expect(r2.to).toBe("tp1_hit");
    expect(r2.tpIndex).toBe(0);

    // SL: price rises to 111
    const r3 = evaluateSignalTransition(
      makeRequest({ ...setup, currentState: "tp1_hit", hitTp: 1, observedPrice: 111 }),
    );
    expect(r3.to).toBe("sl_hit");
    expect(r3.event).toBe("SL_HIT");
  });
});
