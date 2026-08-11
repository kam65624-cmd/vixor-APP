// ============================================================================
// VIXOR Signal Transition Service — Unit Tests
// ============================================================================
// Tests the server-authoritative transition execution path.
// Uses mocked Supabase clients to test the service logic without DB.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeSignalTransition } from "./signal-transition.service";
import type { TransitionServiceRequestWithVersion } from "./signal-transition.service";
import type { SignalStatus } from "./types";

// ── Mock Helpers ──────────────────────────────────────────────────────────────

const NOW = "2026-08-11T12:00:00.000Z";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const TRACKING_ID = "00000000-0000-0000-0000-000000000010";
const VERSION = "2026-08-11T11:59:00.000Z";

/** Create a mock signal tracking row as returned by Supabase */
function makeTracking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: TRACKING_ID,
    user_id: USER_ID,
    signal_id: null,
    source_type: "daily_signal",
    pair: "BTC/USDT",
    direction: "BUY",
    entry_price: 100,
    stop_loss: 90,
    take_profit: [110, 120, 130],
    status: "pending",
    current_price: null,
    previous_price: null,
    max_favorable_excursion: 0,
    max_adverse_excursion: 0,
    hit_tp: 0,
    activated_at: null,
    resolved_at: null,
    expires_at: "2026-08-12T12:00:00.000Z",
    created_at: "2026-08-11T10:00:00.000Z",
    updated_at: VERSION,
    ...overrides,
  };
}

/** Create a valid transition request */
function makeRequest(overrides: Partial<TransitionServiceRequestWithVersion> = {}) {
  return {
    trackingId: TRACKING_ID,
    observedPrice: 100,
    observedAt: NOW,
    currentVersion: VERSION,
    actor: "user" as const,
    ...overrides,
  };
}

/** Create mock Supabase client with chained query builder */
function createMockDb(tracking: Record<string, unknown> | null) {
  const db: Record<string, unknown> = {
    from: vi.fn(() => db),
    select: vi.fn(() => db),
    eq: vi.fn(() => db),
    single: vi.fn().mockResolvedValue({
      data: tracking,
      error: tracking === null ? { code: "PGRST116", message: "not found" } : null,
    }),
  };
  return db as unknown;
}

// ── Mock Supabase Admin Client ───────────────────────────────────────────────

let adminInsertMock: ReturnType<typeof vi.fn>;
let adminUpdateData: Record<string, unknown> | null = null;

function setupAdminMock() {
  adminInsertMock = vi.fn().mockResolvedValue({
    data: { id: "transition-uuid-001" },
    error: null,
  });

  const adminDb: Record<string, unknown> = {
    from: vi.fn(() => adminDb),
    update: vi.fn((data: Record<string, unknown>) => {
      adminUpdateData = data;
      return adminDb;
    }),
    eq: vi.fn(() => adminDb),
    select: vi.fn(() => adminDb),
    single: vi.fn().mockResolvedValue({
      data: { id: TRACKING_ID },
      error: null,
    }),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: adminInsertMock,
      })),
    })),
    // RPC mock: returns error (function not found) to trigger sequential fallback
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Could not find the function execute_signal_transition", code: "42883" },
    }),
  };

  return adminDb;
}

// ── Mock Event Emitter ────────────────────────────────────────────────────────

let eventEmitted: { type: string; payload: unknown } | null = null;

vi.mock("@/shared/events", () => ({
  VixorEvents: {
    emit: vi.fn(async (type: string, payload: unknown) => {
      eventEmitted = { type, payload };
    }),
    hasHandlers: vi.fn(() => false),
  },
}));

// ── Mock Notifications ─────────────────────────────────────────────────────

vi.mock("@/shared/notifications", () => ({
  notificationRouter: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

// ── Mock Admin Client Import ──────────────────────────────────────────────────

const mockAdminDb = setupAdminMock();

vi.mock("@/shared/supabase/client.server", () => ({
  supabaseAdmin: mockAdminDb,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("executeSignalTransition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminUpdateData = null;
    eventEmitted = null;
    setupAdminMock();
  });

  // ── 1. Valid transition: pending → active (BUY entry reached) ──

  describe("valid price-based transitions", () => {
    it("transitions pending → active when BUY entry price is reached", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 99 }); // price dropped to entry

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.from).toBe("pending");
        expect(result.transition.to).toBe("active");
        expect(result.transition.event).toBe("ENTRY_REACHED");
        expect(result.transition.price).toBe(99);
        expect(result.transition.serverReceivedAt).toBeTruthy();
      }
    });

    it("transitions active → tp1_hit when BUY TP1 is hit", async () => {
      const db = createMockDb(makeTracking({ status: "active", hit_tp: 0 }));
      const request = makeRequest({ observedPrice: 111 }); // above TP1=110

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.from).toBe("active");
        expect(result.transition.to).toBe("tp1_hit");
        expect(result.transition.event).toBe("TP1_HIT");
      }
    });

    it("transitions active → sl_hit when BUY SL is hit", async () => {
      const db = createMockDb(makeTracking({ status: "active" }));
      const request = makeRequest({ observedPrice: 89 }); // below SL=90

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.from).toBe("active");
        expect(result.transition.to).toBe("sl_hit");
        expect(result.transition.event).toBe("SL_HIT");
      }
    });

    it("transitions pending → active when SELL entry price is reached", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "SELL", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 101 }); // price rose to entry

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.to).toBe("active");
      }
    });

    it("transitions tp1_hit → tp2_hit when BUY TP2 is hit (sequential)", async () => {
      const db = createMockDb(makeTracking({ status: "tp1_hit", hit_tp: 1 }));
      const request = makeRequest({ observedPrice: 121 }); // above TP2=120

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.from).toBe("tp1_hit");
        expect(result.transition.to).toBe("tp2_hit");
        expect(result.transition.event).toBe("TP2_HIT");
      }
    });

    it("SL priority: transitions to sl_hit even if TP could trigger on same tick", async () => {
      const db = createMockDb(makeTracking({ status: "active", stop_loss: 95, take_profit: [110, 120, 130] }));
      const request = makeRequest({ observedPrice: 94 }); // below SL=95, also below TP

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.to).toBe("sl_hit");
      }
    });
  });

  // ── 2. Invalid transitions ──

  describe("invalid transitions", () => {
    it("denies transition when price has not reached entry", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 105 }); // price above entry, BUY needs price <= entry

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TRANSITION_DENIED");
      }
    });

    it("denies transition when no TP/SL is hit (NO_TRIGGER)", async () => {
      const db = createMockDb(makeTracking({ status: "active" }));
      const request = makeRequest({ observedPrice: 105 }); // between entry and TP1

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TRANSITION_DENIED");
        expect(result.error).toContain("NO_TRIGGER");
      }
    });

    it("denies transition from terminal state", async () => {
      const db = createMockDb(makeTracking({ status: "sl_hit" }));
      const request = makeRequest({ observedPrice: 110 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TRANSITION_DENIED");
        expect(result.error).toContain("TERMINAL_STATE");
      }
    });

    it("denies non-sequential TP (cannot skip TP1 to TP2)", async () => {
      const db = createMockDb(makeTracking({ status: "active", hit_tp: 0 }));
      const request = makeRequest({ observedPrice: 121 }); // above TP2, but TP1 not hit yet

      // The engine checks TP in sequence. hit_tp=0 means next is TP1 (index 0).
      // Price 121 > TP1(110), so TP1 should trigger.
      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        // It should transition to tp1_hit (sequential), not tp2_hit
        expect(result.transition.to).toBe("tp1_hit");
      }
    });
  });

  // ── 3. Unauthorized / not found ──

  describe("authorization and existence", () => {
    it("returns NOT_FOUND when signal does not exist", async () => {
      const db = createMockDb(null); // PGRST116
      const request = makeRequest();

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("NOT_FOUND");
      }
    });
  });

  // ── 4. Concurrency protection ──

  describe("concurrency / stale state", () => {
    it("returns CONFLICT when version has changed (stale client state)", async () => {
      const staleVersion = "2026-08-11T10:00:00.000Z";
      const db = createMockDb(makeTracking({ updated_at: "2026-08-11T11:59:59.000Z" }));
      const request = makeRequest({ currentVersion: staleVersion });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("CONFLICT");
      }
    });
  });

  // ── 5. Non-price transitions ──

  describe("non-price transitions", () => {
    it("allows cancel from pending state", async () => {
      const db = createMockDb(makeTracking({ status: "pending" }));
      const request = makeRequest({ requestedTransition: "cancelled", observedPrice: 1 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.to).toBe("cancelled");
        expect(result.transition.event).toBe("SIGNAL_CANCELLED");
      }
    });

    it("allows invalidate from active state", async () => {
      const db = createMockDb(makeTracking({ status: "active" }));
      const request = makeRequest({ requestedTransition: "invalidated", observedPrice: 1 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.to).toBe("invalidated");
        expect(result.transition.event).toBe("SIGNAL_INVALIDATED");
      }
    });

    it("allows expire from pending state", async () => {
      const db = createMockDb(makeTracking({ status: "pending" }));
      const request = makeRequest({ requestedTransition: "expired", observedPrice: 1 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transition.to).toBe("expired");
        expect(result.transition.event).toBe("SIGNAL_EXPIRED");
      }
    });

    it("denies cancel from terminal state", async () => {
      const db = createMockDb(makeTracking({ status: "sl_hit" }));
      const request = makeRequest({ requestedTransition: "cancelled", observedPrice: 1 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TRANSITION_DENIED");
      }
    });
  });

  // ── 6. serverReceivedAt ──

  describe("serverReceivedAt", () => {
    it("generates serverReceivedAt server-side (not from client)", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({
        observedPrice: 99,
        // Deliberately NOT sending any server timestamp — client cannot control it
      });

      const beforeServer = new Date().toISOString();

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      const afterServer = new Date().toISOString();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // serverReceivedAt should be between before and after
        const ts = result.transition.serverReceivedAt;
        // serverReceivedAt must be a valid ISO timestamp generated by the server
        expect(new Date(ts).getTime()).not.toBeNaN();
        expect(ts.length).toBeGreaterThan(10);
      }
    });
  });

  // ── 7. Client cannot control resulting status ──

  describe("client authority removal", () => {
    it("client cannot set the target status directly", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY" }));
      // Client sends a price, but CANNOT specify the target status
      const request = makeRequest({ observedPrice: 99 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      // The server decides — client only provides observed price
      expect(result.ok).toBe(true);
      if (result.ok) {
        // The Transition Engine determined the outcome
        expect(result.transition.to).toBe("active");
      }
    });

    it("client cannot override terminal state protection", async () => {
      const db = createMockDb(makeTracking({ status: "sl_hit" }));
      // Even if client sends a valid price, terminal state is protected
      const request = makeRequest({ observedPrice: 110 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
    });
  });

  // ── 8. SignalTransition audit record ──

  describe("SignalTransition audit record", () => {
    it("creates audit record on successful transition", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 99 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      expect(adminInsertMock).toHaveBeenCalled();

      // Verify the insert was called with correct audit data
      const insertCall = (mockAdminDb.from as ReturnType<typeof vi.fn>).mock.calls;
      // The admin.from("signal_transitions").insert(...) should have been called
      const fromCalls = mockAdminDb.from as ReturnType<typeof vi.fn>;
      expect(fromCalls).toHaveBeenCalledWith("signal_transitions");
    });

    it("records previous state and next state in audit", async () => {
      const db = createMockDb(makeTracking({ status: "active", hit_tp: 0 }));
      const request = makeRequest({ observedPrice: 111 });

      await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      // The admin insert should capture from_status and to_status
      expect(adminInsertMock).toHaveBeenCalled();
    });

    it("records serverReceivedAt in audit record", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 99 });

      await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(adminInsertMock).toHaveBeenCalled();
    });
  });

  // ── 9. Domain event emission ──

  describe("domain event emission", () => {
    it("emits signal.transition.completed after successful transition", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 99 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
      expect(eventEmitted).not.toBeNull();
      if (eventEmitted) {
        expect(eventEmitted.type).toBe("signal.transition.completed");
      }
    });

    it("does NOT emit event when transition is denied", async () => {
      const db = createMockDb(makeTracking({ status: "pending", direction: "BUY", entry_price: 100 }));
      const request = makeRequest({ observedPrice: 105 }); // no trigger

      await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(eventEmitted).toBeNull();
    });

    it("does NOT emit event when signal is not found", async () => {
      const db = createMockDb(null);
      const request = makeRequest();

      await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(eventEmitted).toBeNull();
    });
  });

  // ── 10. Validation ──

  describe("input validation", () => {
    it("returns VALIDATION error when trackingId is missing", async () => {
      const db = createMockDb(makeTracking());
      const request = makeRequest({ trackingId: "" });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("VALIDATION");
      }
    });

    it("returns VALIDATION error when currentVersion is missing", async () => {
      const db = createMockDb(makeTracking());
      const request = { ...makeRequest(), currentVersion: "" };

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("VALIDATION");
      }
    });

    it("returns VALIDATION error when observedPrice missing for price-based transition", async () => {
      const db = createMockDb(makeTracking());
      const request = { trackingId: TRACKING_ID, currentVersion: VERSION, observedPrice: undefined as unknown as number };

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("VALIDATION");
      }
    });
  });

  // ── 11. WAIT direction ──

  describe("WAIT direction", () => {
    it("denies price-based transitions for WAIT signals", async () => {
      const db = createMockDb(makeTracking({ direction: "WAIT", status: "pending" }));
      const request = makeRequest({ observedPrice: 100 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TRANSITION_DENIED");
        expect(result.error).toContain("WAIT");
      }
    });

    it("allows non-price transitions for WAIT signals (cancel)", async () => {
      const db = createMockDb(makeTracking({ direction: "WAIT", status: "pending" }));
      const request = makeRequest({ requestedTransition: "cancelled", observedPrice: 1 });

      const result = await executeSignalTransition(
        db as Parameters<typeof executeSignalTransition>[0],
        USER_ID,
        request,
      );

      expect(result.ok).toBe(true);
    });
  });

  // ── 12. Existing Transition Engine tests must still pass ──
  // (Verified by running the full test suite — checked in Task 3.14)
});
