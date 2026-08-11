// ============================================================================
// VIXOR Event Consumers — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { VixorEvents } from "./orchestrator";
import { registerEventConsumers, isEventConsumersRegistered } from "./consumers";

describe("Event Consumers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerEventConsumers", () => {
    it("registers consumers and is idempotent", () => {
      // First call
      registerEventConsumers();
      expect(isEventConsumersRegistered()).toBe(true);

      // Verify handler counts
      const counts = VixorEvents.handlerCounts();
      expect(counts["signal.transition.completed"]).toBe(1);
      expect(counts["alert.triggered"]).toBe(1);

      // Second call — should not duplicate
      const countsBefore = VixorEvents.handlerCounts();
      registerEventConsumers();
      const countsAfter = VixorEvents.handlerCounts();
      expect(countsBefore["signal.transition.completed"]).toBe(
        countsAfter["signal.transition.completed"],
      );
    });

    it("signal.transition.completed handler logs structured output", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("signal.transition.completed", {
        trackingId: "test-tracking-id",
        userId: "test-user",
        pair: "BTC/USDT",
        direction: "BUY",
        fromStatus: "active",
        toStatus: "tp1_hit",
        eventType: "TP1_HIT",
        price: 115000,
        tpIndex: 0,
        serverReceivedAt: "2026-08-11T12:00:00.000Z",
        actor: "system",
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        String(call[0]).includes("[SignalTransition]"),
      );
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("BTC/USDT");
      expect(String(logCall![0])).toContain("active → tp1_hit");
      expect(String(logCall![0])).toContain("TP1");
    });

    it("logs TERMINAL marker for terminal transitions", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("signal.transition.completed", {
        trackingId: "test-tracking-id",
        userId: "test-user",
        pair: "ETH/USDT",
        direction: "SELL",
        fromStatus: "active",
        toStatus: "sl_hit",
        eventType: "SL_HIT",
        price: 3200,
        tpIndex: null,
        serverReceivedAt: "2026-08-11T12:00:00.000Z",
        actor: "user",
      });

      const terminalLog = consoleSpy.mock.calls.find((call) =>
        String(call[0]).includes("TERMINAL"),
      );
      expect(terminalLog).toBeDefined();
      expect(String(terminalLog![0])).toContain("sl_hit");
    });

    it("alert.triggered handler logs alert details", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("alert.triggered", {
        alertId: "alert-1",
        userId: "user-1",
        pair: "SOL/USDT",
        condition: "price_above",
        targetPrice: 200,
        currentPrice: 205,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[Alert]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("SOL/USDT");
      expect(String(logCall![0])).toContain("price_above");
    });
  });
});
