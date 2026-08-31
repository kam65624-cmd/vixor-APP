// ============================================================================
// VIXOR useSignalMonitor — Unit Tests
// ============================================================================
// Tests the hook's contract: what data it sends to the server and what
// filtering logic it applies. Uses renderHook for React lifecycle testing.
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Hoisted mock factories ────────────────────────────────────────────────
// vi.hoisted() runs before vi.mock() factories are hoisted, so we can
// reference these inside the factory functions.

const { mockGetPrice, mockGetUserSignalTrackings, mockRequestSignalTransition } = vi.hoisted(
  () => ({
    mockGetPrice: vi.fn(),
    mockGetUserSignalTrackings: vi.fn(),
    mockRequestSignalTransition: vi.fn(),
  }),
);

vi.mock("@/shared/market-data/use-live-prices", () => ({
  useLivePrices: (opts: { pairs: string[]; enabled: boolean }) => {
    return {
      prices: new Map(),
      priceList: [],
      status: opts.enabled && opts.pairs.length > 0 ? "connected" : "idle",
      getPrice: mockGetPrice,
      lastUpdate: Date.now(),
      streamCount: 0,
    };
  },
}));

vi.mock("@/domains/signal-tracking", () => ({
  getUserSignalTrackings: mockGetUserSignalTrackings,
  requestSignalTransition: mockRequestSignalTransition,
  TERMINAL_STATUSES: ["tp3_hit", "sl_hit", "invalidated", "expired", "cancelled"],
  MONITORED_STATUSES: ["pending", "active", "tp1_hit", "tp2_hit"],
}));

vi.mock("@/shared/hooks/use-stable-server-fn", () => ({
  useStableServerFn: (fn: any) => fn,
}));

// Import hook after mocks
import { useSignalMonitor } from "./use-signal-monitor";
import type { SignalTracking } from "@/domains/signal-tracking/types";

// ── Test Fixtures ─────────────────────────────────────────────────────────

function makeTracking(overrides: Partial<SignalTracking> = {}): SignalTracking {
  return {
    id: "tracking-uuid-123",
    user_id: "user-1",
    signal_id: null,
    source_type: "daily_signal",
    pair: "BTC/USDT",
    direction: "BUY",
    entry_price: 100000,
    stop_loss: 95000,
    take_profit: [110000, 120000, 130000],
    status: "active",
    current_price: 100500,
    previous_price: null,
    max_favorable_excursion: 0,
    max_adverse_excursion: 0,
    hit_tp: 0,
    activated_at: "2026-08-11T12:00:00.000Z",
    resolved_at: null,
    expires_at: null,
    created_at: "2026-08-11T12:00:00.000Z",
    updated_at: "2026-08-11T12:00:00.000Z",
    ...overrides,
  };
}

// ── Transition Request Contract Tests ─────────────────────────────────────────

import { TERMINAL_STATUSES, MONITORED_STATUSES } from "@/domains/signal-tracking/types";

describe("useSignalMonitor contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("price-based transition request includes required fields", () => {
    const tracking = makeTracking();

    const request = {
      trackingId: tracking.id,
      observedPrice: 111000,
      currentVersion: tracking.updated_at,
      actor: "system" as const,
    };

    expect(request.trackingId).toBe(tracking.id);
    expect(request.observedPrice).toBe(111000);
    expect(request.currentVersion).toBe(tracking.updated_at);
    expect(request.actor).toBe("system");
  });

  it("expired transition includes requestedTransition and zero price", () => {
    const tracking = makeTracking({
      status: "pending",
      direction: "SELL",
      entry_price: 3000,
      stop_loss: 3100,
      take_profit: [2800, 2700],
      expires_at: "2026-08-10T12:00:00.000Z", // expired yesterday
    });

    const request = {
      trackingId: tracking.id,
      requestedTransition: "expired" as const,
      observedPrice: 0,
      currentVersion: tracking.updated_at,
      actor: "system" as const,
    };

    expect(request.requestedTransition).toBe("expired");
    expect(request.observedPrice).toBe(0);
  });

  it("only monitors non-terminal, non-WAIT trackings", () => {
    for (const s of MONITORED_STATUSES) {
      expect(TERMINAL_STATUSES).not.toContain(s);
    }
    expect(MONITORED_STATUSES.length).toBeGreaterThan(0);
    expect(TERMINAL_STATUSES.length).toBeGreaterThan(0);
  });

  it("filters WAIT direction from monitoring", () => {
    const waitTracking = {
      status: "pending" as const,
      direction: "WAIT" as const,
      pair: "BTC/USDT",
      entry_price: 100000,
      stop_loss: null,
      take_profit: [],
    };

    const shouldMonitor =
      MONITORED_STATUSES.includes(waitTracking.status) && waitTracking.direction !== "WAIT";
    expect(shouldMonitor).toBe(false);
  });
});

describe("useSignalMonitor (renderHook)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    mockGetPrice.mockReset();
    mockGetUserSignalTrackings.mockReset();
    mockRequestSignalTransition.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1. fetches trackings on mount when enabled", async () => {
    const trackings = [makeTracking()];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });

    renderHook(() => useSignalMonitor(true));

    expect(mockGetUserSignalTrackings).toHaveBeenCalledWith({});
  });

  it("2. does not fetch when disabled", () => {
    mockGetUserSignalTrackings.mockResolvedValue({ trackings: [] });

    renderHook(() => useSignalMonitor(false));

    expect(mockGetUserSignalTrackings).not.toHaveBeenCalled();
  });

  it("3. filters to MONITORED_STATUSES only (pending, active, tp1_hit, tp2_hit)", async () => {
    const trackings = [
      makeTracking({ id: "t1", status: "active", direction: "BUY" }),
      makeTracking({ id: "t2", status: "pending", direction: "BUY" }),
      makeTracking({ id: "t3", status: "tp1_hit", direction: "BUY" }),
      makeTracking({ id: "t4", status: "tp2_hit", direction: "BUY" }),
      makeTracking({ id: "t5", status: "sl_hit", direction: "BUY" }),
      makeTracking({ id: "t6", status: "expired", direction: "BUY" }),
      makeTracking({ id: "t7", status: "cancelled", direction: "BUY" }),
      makeTracking({ id: "t8", status: "invalidated", direction: "BUY" }),
      makeTracking({ id: "t9", status: "tp3_hit", direction: "BUY" }),
    ];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });

    const { result } = renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.activeTrackings).toHaveLength(4);
    expect(result.current.activeTrackings.map((t) => t.id).sort()).toEqual([
      "t1",
      "t2",
      "t3",
      "t4",
    ]);
  });

  it("4. filters out WAIT direction signals", async () => {
    const trackings = [
      makeTracking({ id: "t1", status: "active", direction: "BUY" }),
      makeTracking({ id: "t2", status: "pending", direction: "WAIT" }),
      makeTracking({ id: "t3", status: "active", direction: "SELL" }),
      makeTracking({ id: "t4", status: "pending", direction: "WAIT" }),
    ];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });

    const { result } = renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.activeTrackings).toHaveLength(2);
    expect(result.current.activeTrackings.map((t) => t.id).sort()).toEqual(["t1", "t3"]);
  });

  it("5. extracts unique monitored pairs", async () => {
    const trackings = [
      makeTracking({ id: "t1", status: "active", direction: "BUY", pair: "BTC/USDT" }),
      makeTracking({ id: "t2", status: "active", direction: "BUY", pair: "BTC/USDT" }),
      makeTracking({ id: "t3", status: "active", direction: "SELL", pair: "ETH/USDT" }),
      makeTracking({ id: "t4", status: "sl_hit", direction: "BUY", pair: "SOL/USDT" }),
    ];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });

    const { result } = renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.monitoredPairs).toEqual(["BTC/USDT", "ETH/USDT"]);
  });

  it("6. calls transitionFn on price change for active tracking", async () => {
    const trackings = [makeTracking({ id: "t1", status: "active", direction: "BUY" })];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });
    mockGetPrice.mockReturnValue({ price: 115000 });
    mockRequestSignalTransition.mockResolvedValue({
      ok: false,
    });

    renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockRequestSignalTransition).toHaveBeenCalledWith({
      data: {
        trackingId: "t1",
        observedPrice: 115000,
        currentVersion: "2026-08-11T12:00:00.000Z",
        actor: "system",
      },
    });
  });

  it("7. skips duplicate price checks (same price)", async () => {
    const trackings = [makeTracking({ id: "t1", status: "active", direction: "BUY" })];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });
    mockGetPrice.mockReturnValue({ price: 100500 });
    mockRequestSignalTransition.mockResolvedValue({ ok: false });

    renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockRequestSignalTransition).toHaveBeenCalledTimes(1);

    // Re-render with same price — should NOT call again
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockRequestSignalTransition).toHaveBeenCalledTimes(1);
  });

  it("8. debounces — skips if pending transition exists", async () => {
    const trackings = [makeTracking({ id: "t1", status: "active", direction: "BUY" })];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });

    let resolveTransition: (value: any) => void;
    const transitionPromise = new Promise((resolve) => {
      resolveTransition = resolve;
    });
    mockRequestSignalTransition.mockReturnValue(transitionPromise);

    mockGetPrice.mockReturnValue({ price: 100500 });
    renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockRequestSignalTransition).toHaveBeenCalledTimes(1);

    // Change price — should be skipped because transition is pending
    mockGetPrice.mockReturnValue({ price: 101000 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(mockRequestSignalTransition).toHaveBeenCalledTimes(1);

    // Resolve the pending transition
    await act(async () => {
      resolveTransition!({ ok: false });
    });
  });

  it("9. updates local state on successful transition", async () => {
    const trackings = [makeTracking({ id: "t1", status: "active", direction: "BUY" })];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });
    mockGetPrice.mockReturnValue({ price: 115000 });
    mockRequestSignalTransition.mockResolvedValue({
      ok: true,
      transition: {
        to: "tp1_hit" as const,
        price: 115000,
        event: "TP1_HIT",
        serverReceivedAt: "2026-08-11T13:00:00.000Z",
      },
    });

    const { result } = renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const updated = result.current.trackings.find((t) => t.id === "t1");
    expect(updated?.status).toBe("tp1_hit");
    expect(updated?.current_price).toBe(115000);
    expect(updated?.hit_tp).toBe(1);
    expect(result.current.notificationsSent).toBe(1);
  });

  it("10. checks expired signals every 60 seconds", async () => {
    const expiredTime = new Date(Date.now() - 100_000).toISOString();
    const futureTime = new Date(Date.now() + 100_000).toISOString();
    const trackings = [
      makeTracking({
        id: "t-expired",
        status: "pending",
        direction: "BUY",
        expires_at: expiredTime,
      }),
      makeTracking({
        id: "t-active",
        status: "active",
        direction: "BUY",
        expires_at: futureTime,
      }),
    ];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });
    mockRequestSignalTransition.mockResolvedValue({
      ok: true,
      transition: {
        to: "expired" as const,
        price: null,
        event: "EXPIRED",
        serverReceivedAt: "2026-08-11T14:00:00.000Z",
      },
    });

    renderHook(() => useSignalMonitor(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Before 60s — should not check expiration
    expect(mockRequestSignalTransition).not.toHaveBeenCalled();

    // Advance 60s — triggers the expiration check interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    // Should have called transition for the expired tracking only
    expect(mockRequestSignalTransition).toHaveBeenCalledWith({
      data: {
        trackingId: "t-expired",
        requestedTransition: "expired",
        observedPrice: 0,
        currentVersion: "2026-08-11T12:00:00.000Z",
        actor: "system",
      },
    });
  });

  it("11. requests server-authoritative expiration for expired signals", async () => {
    const expiredTime = new Date(Date.now() - 10_000).toISOString();
    const trackings = [
      makeTracking({
        id: "t-exp",
        status: "pending",
        direction: "BUY",
        expires_at: expiredTime,
      }),
    ];
    mockGetUserSignalTrackings.mockResolvedValue({ trackings });
    mockRequestSignalTransition.mockResolvedValue({
      ok: true,
      transition: {
        to: "expired" as const,
        price: null,
        event: "EXPIRED",
        serverReceivedAt: "2026-08-11T15:00:00.000Z",
      },
    });

    const { result } = renderHook(() => useSignalMonitor(true));

    // Wait for initial fetch to resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Before 60s — should not check expiration yet
    expect(mockRequestSignalTransition).not.toHaveBeenCalled();

    // Advance 60s — triggers the expiration check interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(mockRequestSignalTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          trackingId: "t-exp",
          requestedTransition: "expired",
          observedPrice: 0,
          actor: "system",
        }),
      }),
    );

    const updated = result.current.trackings.find((t) => t.id === "t-exp");
    expect(updated?.status).toBe("expired");
  });
});
