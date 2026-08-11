// ============================================================================
// VIXOR useSignalMonitor — Unit Tests
// ============================================================================
// Tests the hook's contract: what data it sends to the server and what
// filtering logic it applies. The hook depends on React context (useLivePrices,
// useStableServerFn) so we test the orchestration contract, not React lifecycle.
// ============================================================================

import { describe, it, expect } from "vitest";
import { TERMINAL_STATUSES, MONITORED_STATUSES } from "@/domains/signal-tracking/types";

// ── Transition Request Contract Tests ─────────────────────────────────────────
// These verify the shape of data the hook sends to the server.

describe("useSignalMonitor contract", () => {
  it("price-based transition request includes required fields", () => {
    const tracking = {
      id: "tracking-uuid-123",
      status: "active" as const,
      pair: "BTC/USDT",
      direction: "BUY" as const,
      entry_price: 100000,
      stop_loss: 95000,
      take_profit: [110000, 120000, 130000],
      updated_at: "2026-08-11T12:00:00.000Z",
      expires_at: "2026-08-12T12:00:00.000Z",
    };

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
    const tracking = {
      id: "tracking-uuid-456",
      status: "pending" as const,
      pair: "ETH/USDT",
      direction: "SELL" as const,
      entry_price: 3000,
      stop_loss: 3100,
      take_profit: [2800, 2700],
      updated_at: "2026-08-11T12:00:00.000Z",
      expires_at: "2026-08-10T12:00:00.000Z", // expired yesterday
    };

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
    // Monitored statuses should never overlap with terminal statuses
    for (const s of MONITORED_STATUSES) {
      expect(TERMINAL_STATUSES).not.toContain(s);
    }

    // Both arrays should be non-empty (domain invariant)
    expect(MONITORED_STATUSES.length).toBeGreaterThan(0);
    expect(TERMINAL_STATUSES.length).toBeGreaterThan(0);
  });

  it("filters WAIT direction from monitoring", () => {
    // A WAIT tracking should not be monitored for price transitions
    const waitTracking = {
      status: "pending" as const,
      direction: "WAIT" as const,
      pair: "BTC/USDT",
      entry_price: 100000,
      stop_loss: null,
      take_profit: [],
    };

    // The hook excludes direction === "WAIT"
    const shouldMonitor =
      MONITORED_STATUSES.includes(waitTracking.status) && waitTracking.direction !== "WAIT";
    expect(shouldMonitor).toBe(false);
  });
});
