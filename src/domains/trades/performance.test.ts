// ============================================================================
// VIXOR Performance Dashboard — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();

vi.mock("@/shared/supabase/client.server", () => ({
  supabaseAdmin: { from: mockFrom },
}));

const { calculatePerformance } = await import("./performance");

describe("calculatePerformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return empty results
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ in: mockIn });
    mockIn.mockResolvedValue({ data: [], error: null });
  });

  it("returns empty metrics when no transitions exist", async () => {
    mockIn.mockResolvedValue({ data: [], error: null });

    const result = await calculatePerformance("user-1");

    expect(result.totalTrades).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.totalPnlPct).toBe(0);
    expect(result.bestTrade).toBeNull();
    expect(result.worstTrade).toBeNull();
  });

  it("calculates performance for BUY tp3_hit (win)", async () => {
    mockIn.mockResolvedValue({
      data: [
        {
          id: "t1",
          signal_tracking_id: "st1",
          user_id: "user-1",
          from_status: "active",
          to_status: "tp3_hit",
          observed_price: 110000,
          tp_index: 2,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "BTC/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 95000,
            take_profit: [105000, 108000, 110000],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
      ],
      error: null,
    });

    const result = await calculatePerformance("user-1");

    expect(result.totalTrades).toBe(1);
    expect(result.winRate).toBe(100);
    expect(result.totalPnlPct).toBe(10); // (110000-100000)/100000 * 100
    expect(result.bestTrade).toEqual({ pair: "BTC/USDT", pnlPct: 10 });
    expect(result.worstTrade).toEqual({ pair: "BTC/USDT", pnlPct: 10 });
    expect(result.byDirection.long.trades).toBe(1);
    expect(result.byDirection.long.winRate).toBe(100);
  });

  it("calculates performance for SELL sl_hit (loss)", async () => {
    mockIn.mockResolvedValue({
      data: [
        {
          id: "t2",
          signal_tracking_id: "st2",
          user_id: "user-1",
          from_status: "active",
          to_status: "sl_hit",
          observed_price: 3100,
          tp_index: null,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "ETH/USDT",
            direction: "SELL",
            entry_price: 3000,
            stop_loss: 3100,
            take_profit: [2900, 2800, 2700],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
      ],
      error: null,
    });

    const result = await calculatePerformance("user-1");

    expect(result.totalTrades).toBe(1);
    expect(result.winRate).toBe(0);
    expect(result.totalPnlPct).toBe(-3.33); // (3000-3100)/3000 * 100 = -3.33
    expect(result.avgLossPct).toBe(-3.33);
    expect(result.byDirection.short.trades).toBe(1);
    expect(result.byDirection.short.winRate).toBe(0);
  });

  it("calculates correct win rate across mixed results", async () => {
    mockIn.mockResolvedValue({
      data: [
        // Win: BUY tp3_hit
        {
          id: "t1",
          signal_tracking_id: "st1",
          user_id: "user-1",
          from_status: "active",
          to_status: "tp3_hit",
          observed_price: 110000,
          tp_index: 2,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "BTC/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 95000,
            take_profit: [105000, 108000, 110000],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
        // Loss: BUY sl_hit
        {
          id: "t2",
          signal_tracking_id: "st2",
          user_id: "user-1",
          from_status: "active",
          to_status: "sl_hit",
          observed_price: 95000,
          tp_index: null,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "SOL/USDT",
            direction: "BUY",
            entry_price: 200,
            stop_loss: 190,
            take_profit: [210, 220, 230],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
        // Neutral: cancelled
        {
          id: "t3",
          signal_tracking_id: "st3",
          user_id: "user-1",
          from_status: "pending",
          to_status: "cancelled",
          observed_price: null,
          tp_index: null,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "XRP/USDT",
            direction: "BUY",
            entry_price: 2,
            stop_loss: 1.9,
            take_profit: [2.1, 2.2, 2.3],
            activated_at: null,
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
      ],
      error: null,
    });

    const result = await calculatePerformance("user-1");

    expect(result.totalTrades).toBe(3);
    expect(result.winRate).toBeCloseTo(33.33, 1);
    expect(result.totalPnlPct).toBeCloseTo(10 + -5 + 0, 1); // 10% - 5% + 0%
    expect(result.byDirection.long.trades).toBe(3);
    expect(result.byDirection.long.winRate).toBeCloseTo(33.33, 1);
  });

  it("calculates avg duration from activated_at to resolved_at", async () => {
    mockIn.mockResolvedValue({
      data: [
        {
          id: "t1",
          signal_tracking_id: "st1",
          user_id: "user-1",
          from_status: "active",
          to_status: "tp3_hit",
          observed_price: 110000,
          tp_index: 2,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "BTC/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 95000,
            take_profit: [110000],
            activated_at: "2026-01-01T08:00:00Z", // 2h before resolved
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
      ],
      error: null,
    });

    const result = await calculatePerformance("user-1");
    expect(result.avgDurationHours).toBe(2);
  });

  it("calculates profit factor correctly", async () => {
    mockIn.mockResolvedValue({
      data: [
        // Win: +10%
        {
          id: "t1",
          signal_tracking_id: "st1",
          user_id: "user-1",
          from_status: "active",
          to_status: "tp3_hit",
          observed_price: 110000,
          tp_index: 2,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "BTC/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 95000,
            take_profit: [110000],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
        // Loss: -2%
        {
          id: "t2",
          signal_tracking_id: "st2",
          user_id: "user-1",
          from_status: "active",
          to_status: "sl_hit",
          observed_price: 98000,
          tp_index: null,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "BTC/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 98000,
            take_profit: [105000],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
      ],
      error: null,
    });

    const result = await calculatePerformance("user-1");
    expect(result.profitFactor).toBe(5); // 10 / 2 = 5
  });

  it("identifies best and worst trades correctly", async () => {
    mockIn.mockResolvedValue({
      data: [
        {
          id: "t1",
          signal_tracking_id: "st1",
          user_id: "user-1",
          from_status: "active",
          to_status: "tp3_hit",
          observed_price: 110000,
          tp_index: 0,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "BTC/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 95000,
            take_profit: [110000],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
        {
          id: "t2",
          signal_tracking_id: "st2",
          user_id: "user-1",
          from_status: "active",
          to_status: "sl_hit",
          observed_price: 90000,
          tp_index: null,
          created_at: "2026-01-01T10:00:00Z",
          signal_tracking: {
            pair: "ETH/USDT",
            direction: "BUY",
            entry_price: 100000,
            stop_loss: 90000,
            take_profit: [110000],
            activated_at: "2026-01-01T08:00:00Z",
            resolved_at: "2026-01-01T10:00:00Z",
            created_at: "2026-01-01T06:00:00Z",
          },
        },
      ],
      error: null,
    });

    const result = await calculatePerformance("user-1");
    expect(result.bestTrade?.pair).toBe("BTC/USDT");
    expect(result.bestTrade?.pnlPct).toBe(10);
    expect(result.worstTrade?.pair).toBe("ETH/USDT");
    expect(result.worstTrade?.pnlPct).toBe(-10);
  });
});
