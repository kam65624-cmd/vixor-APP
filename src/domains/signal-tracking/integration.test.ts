// ============================================================================
// VIXOR Signal Tracking — Integration Tests
// ============================================================================
//
// Tests the FULL signal pipeline: service layer + transition engine +
// domain events + notifications + audit trail.  Supabase is mocked but
// the real service + engine + event orchestrator code runs end-to-end.
//
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeSignalTransition } from "./signal-transition.service";
import type { TransitionServiceRequestWithVersion } from "./signal-transition.service";
import type { SignalStatus } from "./types";
import { evaluateSignalTransition } from "./transition-engine";
import type { SignalTransitionRequest } from "./transition-engine";
import { VixorEvents } from "@/shared/events";

// ── Constants ──────────────────────────────────────────────────────────────

const NOW = "2026-08-15T12:00:00.000Z";
const USER_ID = "00000000-0000-0000-0000-000000000001";
const TRACKING_ID = "00000000-0000-0000-0000-000000000010";
const VERSION = "2026-08-15T11:59:00.000Z";

// ── Mock Helpers ──────────────────────────────────────────────────────────────

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
    expires_at: "2026-08-16T12:00:00.000Z",
    created_at: "2026-08-15T10:00:00.000Z",
    updated_at: VERSION,
    ...overrides,
  };
}

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

// ── Captured side-effects ──────────────────────────────────────────────────

let capturedEvents: Array<{ type: string; payload: unknown }> = [];
let capturedNotifications: Array<{
  userId: string;
  title: string;
  body: string;
  severity: string;
}> = [];
let auditInsertData: Record<string, unknown> | null = null;
let signalUpdateData: Record<string, unknown> | null = null;

// ── Mock Setup ──────────────────────────────────────────────────────────────

vi.mock("@/shared/events", () => {
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  return {
    VixorEvents: {
      emit: vi.fn(async (type: string, payload: unknown) => {
        capturedEvents.push({ type, payload });
      }),
      on: vi.fn((type: string, handler: (p: unknown) => void) => {
        if (!handlers.has(type)) handlers.set(type, new Set());
        handlers.get(type)!.add(handler);
      }),
      off: vi.fn(),
      hasHandlers: vi.fn((type: string) => (handlers.get(type)?.size ?? 0) > 0),
      setEnabled: vi.fn(),
      setPersistence: vi.fn(),
      handlerCounts: vi.fn(() => ({})),
    },
  };
});

vi.mock("@/shared/notifications", () => ({
  notificationRouter: {
    send: vi.fn(async (n: { userId: string; title: string; body: string; severity: string }) => {
      capturedNotifications.push(n);
      return [{ channel: "in-app", ok: true, durationMs: 0 }];
    }),
  },
}));

let adminInsertMock: ReturnType<typeof vi.fn>;
let adminUpdateMock: ReturnType<typeof vi.fn>;
let adminDb: Record<string, unknown>;

function setupAdminMock() {
  adminInsertMock = vi.fn().mockResolvedValue({
    data: { id: "transition-uuid-int-001" },
    error: null,
  });

  adminUpdateMock = vi.fn((data: Record<string, unknown>) => {
    signalUpdateData = data;
    return adminDb;
  });

  adminDb = {
    from: vi.fn(() => adminDb),
    update: adminUpdateMock,
    eq: vi.fn(() => adminDb),
    select: vi.fn(() => adminDb),
    single: vi.fn().mockResolvedValue({
      data: { id: TRACKING_ID },
      error: null,
    }),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => {
          // Capture insert data
          const insertCalls = adminDb.insert as ReturnType<typeof vi.fn>;
          if (insertCalls.mock.calls.length > 0) {
            auditInsertData = insertCalls.mock.calls[
              insertCalls.mock.calls.length - 1
            ]?.[0] as Record<string, unknown>;
          }
          return { data: { id: "transition-uuid-int-001" }, error: null };
        }),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Could not find the function execute_signal_transition", code: "42883" },
    }),
  };
}

vi.mock("@/shared/supabase/client.server", () => ({
  get supabaseAdmin() {
    return adminDb;
  },
}));

// ── Test Suite ──────────────────────────────────────────────────────────────

describe("Signal Tracking Integration Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedEvents = [];
    capturedNotifications = [];
    auditInsertData = null;
    signalUpdateData = null;
    setupAdminMock();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: Full lifecycle — pending → active → tp1_hit → tp2_hit → tp3_hit
  // ─────────────────────────────────────────────────────────────────────────

  it("full lifecycle: pending → active → tp1_hit → tp2_hit → tp3_hit", async () => {
    // Step 1: pending → active (BUY entry at 100, price drops to 99)
    let tracking = makeTracking({ status: "pending", direction: "BUY", entry_price: 100 });
    let db = createMockDb(tracking);

    let result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 99 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.from).toBe("pending");
      expect(result.transition.to).toBe("active");
      expect(result.transition.event).toBe("ENTRY_REACHED");
    }

    // Step 2: active → tp1_hit (price rises to 111 > TP1=110)
    // hit_tp=0 means next TP to check is index 0 (TP1)
    tracking = makeTracking({ status: "active", hit_tp: 0 });
    db = createMockDb(tracking);
    result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 111 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("tp1_hit");
      expect(result.transition.event).toBe("TP1_HIT");
    }

    // Step 3: tp1_hit → tp2_hit (price rises to 121 > TP2=120)
    // After TP1 hit, hit_tp=1, so next to check is index 1 (TP2)
    tracking = makeTracking({ status: "tp1_hit", hit_tp: 1 });
    db = createMockDb(tracking);
    result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 121 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("tp2_hit");
      expect(result.transition.event).toBe("TP2_HIT");
    }

    // Step 4: tp2_hit → tp3_hit (price rises to 131 > TP3=130)
    // After TP2 hit, hit_tp=2, so next to check is index 2 (TP3)
    tracking = makeTracking({ status: "tp2_hit", hit_tp: 2 });
    db = createMockDb(tracking);
    result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 131 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("tp3_hit");
      expect(result.transition.event).toBe("TP3_HIT");
      // tp3_hit is terminal
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: Full lifecycle with SL — pending → active → sl_hit
  // ─────────────────────────────────────────────────────────────────────────

  it("full lifecycle with SL: pending → active → sl_hit", async () => {
    // Step 1: pending → active
    let tracking = makeTracking({ status: "pending", direction: "BUY", entry_price: 100 });
    let db = createMockDb(tracking);

    let result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 99 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("active");
    }

    // Step 2: active → sl_hit (price drops to 89 < SL=90)
    tracking = makeTracking({ status: "active" });
    db = createMockDb(tracking);
    result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 89 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("sl_hit");
      expect(result.transition.event).toBe("SL_HIT");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: Cancel flow — pending → cancelled
  // ─────────────────────────────────────────────────────────────────────────

  it("cancel flow: pending → cancelled", async () => {
    const tracking = makeTracking({ status: "pending" });
    const db = createMockDb(tracking);

    const result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ requestedTransition: "cancelled", observedPrice: 1 }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.from).toBe("pending");
      expect(result.transition.to).toBe("cancelled");
      expect(result.transition.event).toBe("SIGNAL_CANCELLED");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: Expire flow — pending → expired
  // ─────────────────────────────────────────────────────────────────────────

  it("expire flow: pending → expired", async () => {
    const tracking = makeTracking({ status: "pending" });
    const db = createMockDb(tracking);

    const result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ requestedTransition: "expired", observedPrice: 1 }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.from).toBe("pending");
      expect(result.transition.to).toBe("expired");
      expect(result.transition.event).toBe("SIGNAL_EXPIRED");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: Concurrency conflict detection
  // ─────────────────────────────────────────────────────────────────────────

  it("detects concurrency conflict when version is stale", async () => {
    // Server has a newer version than what client sends
    const tracking = makeTracking({ updated_at: "2026-08-15T12:00:01.000Z" });
    const db = createMockDb(tracking);
    const staleVersion = "2026-08-15T11:00:00.000Z";

    const result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ currentVersion: staleVersion, observedPrice: 99 }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CONFLICT");
      expect(result.error).toContain("changed");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: Domain event emission verification
  // ─────────────────────────────────────────────────────────────────────────

  it("emits domain event signal.transition.completed on successful transition", async () => {
    const tracking = makeTracking({ status: "pending", direction: "BUY", entry_price: 100 });
    const db = createMockDb(tracking);

    const result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 99 }),
    );

    expect(result.ok).toBe(true);

    // Verify event was emitted
    expect(capturedEvents.length).toBeGreaterThanOrEqual(1);
    const transitionEvent = capturedEvents.find((e) => e.type === "signal.transition.completed");
    expect(transitionEvent).toBeDefined();

    if (transitionEvent) {
      const payload = transitionEvent.payload as Record<string, unknown>;
      expect(payload.trackingId).toBe(TRACKING_ID);
      expect(payload.userId).toBe(USER_ID);
      expect(payload.pair).toBe("BTC/USDT");
      expect(payload.fromStatus).toBe("pending");
      expect(payload.toStatus).toBe("active");
      expect(payload.eventType).toBe("ENTRY_REACHED");
      expect(payload.price).toBe(99);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: Notification routing verification
  // ─────────────────────────────────────────────────────────────────────────

  it("sends notification on entry reached", async () => {
    const tracking = makeTracking({ status: "pending", direction: "BUY", entry_price: 100 });
    const db = createMockDb(tracking);

    await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 99 }),
    );

    // Entry reached → notification should be sent
    expect(capturedNotifications.length).toBeGreaterThanOrEqual(1);
    const entryNotif = capturedNotifications.find((n) => n.title.includes("Entry"));
    expect(entryNotif).toBeDefined();
    if (entryNotif) {
      expect(entryNotif.userId).toBe(USER_ID);
      expect(entryNotif.body).toContain("BTC/USDT");
      expect(entryNotif.severity).toBe("info");
    }
  });

  it("sends warning notification on SL hit", async () => {
    const tracking = makeTracking({ status: "active" });
    const db = createMockDb(tracking);

    await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 89 }),
    );

    // SL hit → warning notification
    const slNotif = capturedNotifications.find((n) => n.severity === "warning");
    expect(slNotif).toBeDefined();
    if (slNotif) {
      expect(slNotif.body).toContain("Stop Loss");
    }
  });

  it("does NOT send notification on cancel", async () => {
    const tracking = makeTracking({ status: "pending" });
    const db = createMockDb(tracking);

    await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ requestedTransition: "cancelled", observedPrice: 1 }),
    );

    // Cancel should NOT trigger a notification
    const notifs = capturedNotifications.filter((n) => n.userId === USER_ID);
    expect(notifs).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: Audit trail completeness
  // ─────────────────────────────────────────────────────────────────────────

  it("creates complete audit record on successful transition", async () => {
    const tracking = makeTracking({ status: "active", hit_tp: 0 });
    const db = createMockDb(tracking);

    const result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 111 }),
    );

    expect(result.ok).toBe(true);

    // Verify the admin insert was called (audit record creation)
    // Check that from() was called with "signal_transitions"
    const fromCalls = (adminDb.from as ReturnType<typeof vi.fn>).mock.calls;
    const signalTransitionsCall = fromCalls.find((c) => c[0] === "signal_transitions");
    expect(signalTransitionsCall).toBeDefined();
  });

  it("updates signal_tracking with correct fields on TP hit", async () => {
    const tracking = makeTracking({ status: "active", hit_tp: 0 });
    const db = createMockDb(tracking);

    await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 111 }),
    );

    // The update was called (sequential fallback path)
    expect(adminUpdateMock).toHaveBeenCalled();
    if (signalUpdateData) {
      expect(signalUpdateData.status).toBe("tp1_hit");
      expect(signalUpdateData.current_price).toBe(111);
      expect(signalUpdateData.hit_tp).toBe(1); // TP1 → hit_tp = 1
    }
  });

  it("sets resolved_at for terminal transitions", async () => {
    const tracking = makeTracking({ status: "active" });
    const db = createMockDb(tracking);

    await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 89 }),
    );

    expect(signalUpdateData).not.toBeNull();
    if (signalUpdateData) {
      // sl_hit is terminal → resolved_at should be set
      expect(signalUpdateData.resolved_at).toBeTruthy();
      expect(signalUpdateData.status).toBe("sl_hit");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test: SELL direction full lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  it("SELL direction: pending → active → tp1_hit → sl_hit", async () => {
    // SELL entry: price must rise to or above entry
    let tracking = makeTracking({
      status: "pending",
      direction: "SELL",
      entry_price: 100,
      stop_loss: 110,
      take_profit: [90, 80, 70],
    });
    let db = createMockDb(tracking);

    // Step 1: pending → active (price rises to 100)
    let result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 101 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("active");
    }

    // Step 2: active → tp1_hit (price drops to 89 < TP1=90)
    // hit_tp=0 means next TP to check is index 0 (TP1=90)
    tracking = makeTracking({
      status: "active",
      direction: "SELL",
      hit_tp: 0,
      stop_loss: 110,
      take_profit: [90, 80, 70],
    });
    db = createMockDb(tracking);
    result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 89 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("tp1_hit");
    }

    // Step 3: tp1_hit → sl_hit (price rises to 111 > SL=110)
    tracking = makeTracking({
      status: "tp1_hit",
      direction: "SELL",
      hit_tp: 1,
      stop_loss: 110,
      take_profit: [90, 80, 70],
    });
    db = createMockDb(tracking);
    result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 111 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.transition.to).toBe("sl_hit");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test: No event emitted on denied transition
  // ─────────────────────────────────────────────────────────────────────────

  it("does NOT emit event when transition is denied", async () => {
    const tracking = makeTracking({ status: "pending", direction: "BUY", entry_price: 100 });
    const db = createMockDb(tracking);

    // Price 105 does not trigger entry for BUY (needs ≤ 100)
    const result = await executeSignalTransition(
      db as Parameters<typeof executeSignalTransition>[0],
      USER_ID,
      makeRequest({ observedPrice: 105 }),
    );

    expect(result.ok).toBe(false);
    expect(capturedEvents).toHaveLength(0);
  });
});
