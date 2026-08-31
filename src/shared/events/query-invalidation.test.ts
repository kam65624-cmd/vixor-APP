// ============================================================================
// VIXOR Query Cache Invalidation — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { VixorEvents } from "./orchestrator";
import {
  setupQueryInvalidation,
  isQueryInvalidationSetup,
  getInvalidationMap,
} from "./query-invalidation";

describe("Query Cache Invalidation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("setupQueryInvalidation()", () => {
    it("is idempotent — calling twice does not duplicate handlers", () => {
      setupQueryInvalidation();
      const countsBefore = VixorEvents.handlerCounts();
      setupQueryInvalidation();
      const countsAfter = VixorEvents.handlerCounts();

      // Compare the keys for invalidation-related events
      const events = Object.keys(getInvalidationMap());
      for (const event of events) {
        expect(countsAfter[event]).toBe(countsBefore[event]);
      }
    });

    it("registers handlers for all 5 mapped event types", () => {
      setupQueryInvalidation();

      const counts = VixorEvents.handlerCounts();
      const map = getInvalidationMap();
      for (const eventType of Object.keys(map)) {
        // The handler count should be at least 1 (from setup)
        expect(counts[eventType]).toBeGreaterThanOrEqual(1);
      }
    });

    it("isQueryInvalidationSetup returns true after setup", () => {
      // Note: may already be true from other tests in this file
      const wasSetup = isQueryInvalidationSetup();
      setupQueryInvalidation();
      expect(isQueryInvalidationSetup()).toBe(true);
    });
  });

  describe("invalidation mapping", () => {
    it("maps signal.transition.completed to signalTrackings", () => {
      const map = getInvalidationMap();
      expect(map["signal.transition.completed"]).toContain("signalTrackings");
    });

    it("maps alert.triggered to priceAlerts", () => {
      const map = getInvalidationMap();
      expect(map["alert.triggered"]).toContain("priceAlerts");
    });

    it("maps journal.created to tradingNotes", () => {
      const map = getInvalidationMap();
      expect(map["journal.created"]).toContain("tradingNotes");
    });

    it("maps both trade.opened and trade.closed to trades", () => {
      const map = getInvalidationMap();
      expect(map["trade.opened"]).toContain("trades");
      expect(map["trade.closed"]).toContain("trades");
    });
  });

  describe("handler execution", () => {
    it("logs cache invalidation on signal.transition.completed", async () => {
      setupQueryInvalidation();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("signal.transition.completed", {
        trackingId: "t1",
        userId: "u1",
        pair: "BTC/USDT",
        direction: "BUY",
        fromStatus: "active",
        toStatus: "tp1_hit",
        eventType: "TP1_HIT",
        price: 100000,
        tpIndex: 0,
        serverReceivedAt: new Date().toISOString(),
        actor: "system",
      });

      const invalidationLogs = consoleSpy.mock.calls.filter(
        (call) =>
          String(call[0]).includes("[CacheInvalidation]") &&
          String(call[0]).includes("signalTrackings"),
      );
      expect(invalidationLogs.length).toBeGreaterThanOrEqual(1);
      expect(String(invalidationLogs[0]![0])).toContain("signal.transition.completed");

      consoleSpy.mockRestore();
    });

    it("logs cache invalidation on alert.triggered", async () => {
      setupQueryInvalidation();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("alert.triggered", {
        alertId: "a1",
        userId: "u1",
        pair: "ETH/USDT",
        condition: "price_above",
        targetPrice: 4000,
        currentPrice: 4100,
      });

      const invalidationLogs = consoleSpy.mock.calls.filter(
        (call) =>
          String(call[0]).includes("[CacheInvalidation]") &&
          String(call[0]).includes("priceAlerts"),
      );
      expect(invalidationLogs.length).toBeGreaterThanOrEqual(1);

      consoleSpy.mockRestore();
    });

    it("logs cache invalidation on trade.opened", async () => {
      setupQueryInvalidation();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("trade.opened", {
        tradeId: "tr1",
        userId: "u1",
        pair: "SOL/USDT",
        direction: "long",
        entryPrice: 150,
      });

      const invalidationLogs = consoleSpy.mock.calls.filter(
        (call) =>
          String(call[0]).includes("[CacheInvalidation]") && String(call[0]).includes("trades"),
      );
      expect(invalidationLogs.length).toBeGreaterThanOrEqual(1);

      consoleSpy.mockRestore();
    });
  });
});
