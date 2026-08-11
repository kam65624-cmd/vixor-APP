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
      expect(counts["analysis.created"]).toBe(1);
      expect(counts["trade.opened"]).toBe(1);
      expect(counts["trade.closed"]).toBe(1);
      expect(counts["signal.tracking.created"]).toBe(1);
      expect(counts["signal.tp_hit"]).toBe(1);
      expect(counts["signal.sl_hit"]).toBe(1);

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

    it("analysis.created handler logs structured analysis data", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("analysis.created", {
        analysisId: "analysis-1",
        pair: "BTC/USDT",
        timeframe: "1H",
        userId: "user-1",
        recommendation: "BUY",
        confidence: 85,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[Analysis]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("BTC/USDT");
      expect(String(logCall![0])).toContain("1H");
      expect(String(logCall![0])).toContain("BUY");
      expect(String(logCall![0])).toContain("85%");
      expect(String(logCall![0])).toContain("analysis-1");
    });

    it("trade.opened handler logs trade opened event", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("trade.opened", {
        tradeId: "trade-1",
        userId: "user-1",
        pair: "ETH/USDT",
        direction: "long",
        entryPrice: 3000,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[Trade]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("OPENED");
      expect(String(logCall![0])).toContain("ETH/USDT");
      expect(String(logCall![0])).toContain("LONG");
      expect(String(logCall![0])).toContain("$3000");
    });

    it("trade.closed handler logs trade closed with P&L", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("trade.closed", {
        tradeId: "trade-1",
        userId: "user-1",
        pair: "BTC/USDT",
        exitPrice: 115000,
        pnl: 1500.5,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[Trade]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("CLOSED");
      expect(String(logCall![0])).toContain("PROFIT");
      expect(String(logCall![0])).toContain("+$1500.50");
    });

    it("trade.closed handler shows LOSS for negative P&L", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("trade.closed", {
        tradeId: "trade-2",
        userId: "user-1",
        pair: "SOL/USDT",
        exitPrice: 140,
        pnl: -60.25,
      });

      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[Trade]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("LOSS");
      expect(String(logCall![0])).toContain("$-60.25");
    });

    it("signal.tracking.created handler logs new signal tracking", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("signal.tracking.created", {
        trackingId: "tracking-1",
        userId: "user-1",
        pair: "BTC/USDT",
        direction: "BUY",
        entryPrice: 100000,
        stopLoss: 95000,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) =>
        String(call[0]).includes("[SignalTracking]"),
      );
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("CREATED");
      expect(String(logCall![0])).toContain("BTC/USDT");
      expect(String(logCall![0])).toContain("BUY");
      expect(String(logCall![0])).toContain("$100000");
      expect(String(logCall![0])).toContain("SL: $95000");
    });

    it("signal.tp_hit handler logs TP hit with tpIndex", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("signal.tp_hit", {
        trackingId: "tracking-1",
        userId: "user-1",
        pair: "BTC/USDT",
        direction: "BUY",
        tpIndex: 1,
        hitTp: 2,
        currentPrice: 120000,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[SignalTP]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("TP2 HIT");
      expect(String(logCall![0])).toContain("tpIndex: 1");
      expect(String(logCall![0])).toContain("BTC/USDT");
    });

    it("signal.sl_hit handler logs SL hit", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await VixorEvents.emit("signal.sl_hit", {
        trackingId: "tracking-1",
        userId: "user-1",
        pair: "ETH/USDT",
        direction: "SELL",
        currentPrice: 3200,
        stopLoss: 3100,
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find((call) => String(call[0]).includes("[SignalSL]"));
      expect(logCall).toBeDefined();
      expect(String(logCall![0])).toContain("STOP LOSS HIT");
      expect(String(logCall![0])).toContain("ETH/USDT");
      expect(String(logCall![0])).toContain("SL was $3100");
    });

    // ── Journal Auto-Creation Tests (Task 7.2) ──────────────────────────────
    describe("journal auto-creation on terminal transitions", () => {
      it("attempts journal creation when signal reaches tp3_hit terminal state", async () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // The journal creation runs in a non-blocking void Promise.
        // When supabase/tool-registry are not available in test env,
        // it falls into the catch block and logs a warning.
        // This test verifies the consumer reaches the TERMINAL branch.
        await VixorEvents.emit("signal.transition.completed", {
          trackingId: "term-t1",
          userId: "user-j1",
          pair: "BTC/USDT",
          direction: "BUY",
          fromStatus: "tp2_hit",
          toStatus: "tp3_hit",
          eventType: "TP3_HIT",
          price: 120000,
          tpIndex: 2,
          serverReceivedAt: "2026-08-11T12:00:00.000Z",
          actor: "system",
        });

        const terminalLog = consoleSpy.mock.calls.find((call) =>
          String(call[0]).includes("TERMINAL"),
        );
        expect(terminalLog).toBeDefined();
        expect(String(terminalLog![0])).toContain("tp3_hit");
      });

      it("attempts journal creation when signal reaches sl_hit terminal state", async () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await VixorEvents.emit("signal.transition.completed", {
          trackingId: "term-t2",
          userId: "user-j2",
          pair: "ETH/USDT",
          direction: "SELL",
          fromStatus: "active",
          toStatus: "sl_hit",
          eventType: "SL_HIT",
          price: 3200,
          tpIndex: null,
          serverReceivedAt: "2026-08-11T12:00:00.000Z",
          actor: "system",
        });

        const terminalLog = consoleSpy.mock.calls.find((call) =>
          String(call[0]).includes("TERMINAL"),
        );
        expect(terminalLog).toBeDefined();
        expect(String(terminalLog![0])).toContain("sl_hit");
      });

      it("attempts journal creation when signal is cancelled (non-PL terminal)", async () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await VixorEvents.emit("signal.transition.completed", {
          trackingId: "term-t3",
          userId: "user-j3",
          pair: "SOL/USDT",
          direction: "BUY",
          fromStatus: "pending",
          toStatus: "cancelled",
          eventType: "CANCELLED",
          price: 200,
          tpIndex: null,
          serverReceivedAt: "2026-08-11T12:00:00.000Z",
          actor: "user",
        });

        const terminalLog = consoleSpy.mock.calls.find((call) =>
          String(call[0]).includes("TERMINAL"),
        );
        expect(terminalLog).toBeDefined();
        expect(String(terminalLog![0])).toContain("cancelled");
      });
    });
  });
});
