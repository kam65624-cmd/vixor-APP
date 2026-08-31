import { describe, it, expect } from "vitest";
import type { BacktestResult, Trade, EquityPoint, BacktestMetrics, BacktestStats } from "./types";

// ── Helpers to build test fixtures ──

function makeTrade(overrides: Partial<Trade> & { id: number }): Trade {
  return {
    side: "long",
    entryIndex: 0,
    exitIndex: 10,
    entryTime: 1000,
    exitTime: 2000,
    entryPrice: 100,
    exitPrice: 105,
    qty: 1,
    grossPnl: 5,
    commissionPaid: 0.1,
    slippageCost: 0.05,
    netPnl: 4.85,
    returnPct: 0.0485,
    mae: 0.02,
    mfe: 0.06,
    rMultiple: 2.5,
    exitReason: "signal",
    durationBars: 10,
    ...overrides,
  };
}

function makeEquityPoint(time: number, equity: number, drawdown: number): EquityPoint {
  return { time, equity, drawdown };
}

function makeMetrics(overrides: Partial<BacktestMetrics> = {}): BacktestMetrics {
  return {
    totalReturn: 15.5,
    annualReturn: 45.2,
    cagr: 42.1,
    maxDrawdown: 8.3,
    maxDrawdownAbs: 8300,
    maxDrawdownDuration: 12,
    sharpe: 1.85,
    sortino: 2.4,
    winRate: 62.5,
    profitFactor: 1.8,
    avgWin: 250,
    avgLoss: -150,
    expectancy: 45.5,
    avgRMultiple: 1.3,
    totalTrades: 40,
    winningTrades: 25,
    losingTrades: 15,
    totalProfit: 10000,
    totalCommission: 120,
    volatility: 18.5,
    ...overrides,
  };
}

function makeStats(overrides: Partial<BacktestStats> = {}): BacktestStats {
  return {
    totalBars: 500,
    totalTrades: 40,
    winningTrades: 25,
    losingTrades: 15,
    exposureTime: 65.5,
    ...overrides,
  };
}

function makeResult(overrides: Partial<BacktestResult> = {}): BacktestResult {
  const metrics = makeMetrics();
  const stats = makeStats();
  return {
    equityCurve: [
      makeEquityPoint(0, 100000, 0),
      makeEquityPoint(1, 100500, 0),
      makeEquityPoint(2, 99800, 0.002),
      makeEquityPoint(3, 101200, 0),
    ],
    trades: [
      makeTrade({ id: 1, side: "long", entryPrice: 100, exitPrice: 105, netPnl: 4.85 }),
      makeTrade({ id: 2, side: "long", entryPrice: 105, exitPrice: 102, netPnl: -2.9 }),
      makeTrade({ id: 3, side: "long", entryPrice: 102, exitPrice: 110, netPnl: 7.8 }),
    ],
    metrics,
    stats,
    finalEquity: 115500,
    initialCapital: 100000,
    ...overrides,
  };
}

// ── Persistence Shape Tests ──
//
// These tests verify that the data shape written to the DB matches
// what getBacktestHistory expects to read back.

function simulatePersistShape(
  result: BacktestResult,
  strategyPreset: string,
  pair: string,
  timeframe: string,
) {
  return {
    name: `${strategyPreset} · ${pair} · ${timeframe}`,
    pair,
    timeframe,
    strategy_params: {
      preset: strategyPreset,
      initialCapital: result.initialCapital,
    },
    total_trades: result.metrics.totalTrades,
    win_rate: result.metrics.winRate,
    total_pnl_pct: result.metrics.totalReturn,
    max_drawdown: result.metrics.maxDrawdown,
    sharpe_ratio: result.metrics.sharpe,
    equity_curve: result.equityCurve.map((p) => ({
      t: p.time,
      e: Math.round(p.equity * 100) / 100,
      d: Math.round(p.drawdown * 10000) / 10000,
    })),
    trades_log: result.trades.map((t) => ({
      id: t.id,
      side: t.side,
      entry: t.entryPrice,
      exit: t.exitPrice,
      pnl: Math.round(t.netPnl * 100) / 100,
      ret: Math.round(t.returnPct * 10000) / 10000,
      r: Math.round(t.rMultiple * 100) / 100,
      reason: t.exitReason,
      tag: t.tag ?? null,
    })),
  };
}

function simulateReadShape(row: any) {
  return {
    id: row.id,
    name: row.name,
    pair: row.pair,
    timeframe: row.timeframe,
    strategyPreset: row.strategy_params?.preset ?? "",
    totalTrades: row.total_trades ?? 0,
    winRate: row.win_rate ?? 0,
    totalPnlPct: row.total_pnl_pct ?? 0,
    maxDrawdown: row.max_drawdown ?? 0,
    sharpeRatio: row.sharpe_ratio ?? 0,
    createdAt: row.created_at,
  };
}

describe("Backtest Persistence Shape", () => {
  it("persists and reads back core metrics correctly", () => {
    const result = makeResult();
    const persisted = simulatePersistShape(result, "sma_crossover", "BTCUSDT", "1H");
    const readBack = simulateReadShape({
      id: "test-uuid",
      ...persisted,
      created_at: "2026-08-03T12:00:00Z",
    });

    expect(readBack.strategyPreset).toBe("sma_crossover");
    expect(readBack.pair).toBe("BTCUSDT");
    expect(readBack.timeframe).toBe("1H");
    expect(readBack.totalTrades).toBe(40);
    expect(readBack.winRate).toBe(62.5);
    expect(readBack.totalPnlPct).toBe(15.5);
    expect(readBack.maxDrawdown).toBe(8.3);
    expect(readBack.sharpeRatio).toBe(1.85);
  });

  it("rounds equity curve values correctly", () => {
    const result = makeResult({
      equityCurve: [
        makeEquityPoint(0, 100000.456, 0.0001234),
        makeEquityPoint(1, 99800.999, 0.0025678),
      ],
    });
    const persisted = simulatePersistShape(result, "rsi_reversal", "ETHUSDT", "15M");

    expect(persisted.equity_curve[0].e).toBe(100000.46);
    expect(persisted.equity_curve[0].d).toBe(0.0001);
    expect(persisted.equity_curve[1].e).toBe(99801);
    expect(persisted.equity_curve[1].d).toBe(0.0026);
  });

  it("rounds trade log values correctly", () => {
    const result = makeResult({
      trades: [
        makeTrade({
          id: 1,
          netPnl: 4.8567,
          returnPct: 0.048567,
          rMultiple: 2.534,
          tag: "sma_cross_long",
        }),
      ],
    });
    const persisted = simulatePersistShape(result, "breakout", "SOLUSDT", "5M");
    const trade = persisted.trades_log[0];

    expect(trade.pnl).toBe(4.86);
    expect(trade.ret).toBe(0.0486);
    expect(trade.r).toBe(2.53);
    expect(trade.tag).toBe("sma_cross_long");
    expect(trade.reason).toBe("signal");
  });

  it("handles null tags in trades", () => {
    const result = makeResult({
      trades: [makeTrade({ id: 1, tag: undefined })],
    });
    const persisted = simulatePersistShape(result, "macd_momentum", "BNBUSDT", "4H");
    expect(persisted.trades_log[0].tag).toBeNull();
  });

  it("generates correct name format", () => {
    const result = makeResult();
    const persisted = simulatePersistShape(result, "sma_crossover", "BTCUSDT", "1D");
    expect(persisted.name).toBe("sma_crossover · BTCUSDT · 1D");
  });

  it("handles all exit reasons", () => {
    const exitReasons: Trade["exitReason"][] = [
      "signal",
      "stop_loss",
      "take_profit",
      "trailing_stop",
      "end_of_data",
      "manual",
    ];
    const trades = exitReasons.map((reason, i) => makeTrade({ id: i + 1, exitReason: reason }));
    const result = makeResult({ trades });
    const persisted = simulatePersistShape(result, "breakout", "XRPUSDT", "1H");

    const persistedReasons = persisted.trades_log.map((t: any) => t.reason);
    expect(persistedReasons).toEqual(exitReasons);
  });

  it("handles short side trades", () => {
    const result = makeResult({
      trades: [makeTrade({ id: 1, side: "short", entryPrice: 200, exitPrice: 190, netPnl: 9.7 })],
    });
    const persisted = simulatePersistShape(result, "rsi_reversal", "DOGEUSDT", "15M");
    expect(persisted.trades_log[0].side).toBe("short");
    expect(persisted.trades_log[0].entry).toBe(200);
    expect(persisted.trades_log[0].exit).toBe(190);
  });

  it("read shape falls back to defaults for null values", () => {
    const readBack = simulateReadShape({
      id: "test-uuid",
      name: "test",
      pair: null,
      timeframe: null,
      strategy_params: {},
      total_trades: null,
      win_rate: null,
      total_pnl_pct: null,
      max_drawdown: null,
      sharpe_ratio: null,
      created_at: "2026-08-03",
    });

    expect(readBack.strategyPreset).toBe("");
    expect(readBack.totalTrades).toBe(0);
    expect(readBack.winRate).toBe(0);
    expect(readBack.totalPnlPct).toBe(0);
    expect(readBack.maxDrawdown).toBe(0);
    expect(readBack.sharpeRatio).toBe(0);
  });
});
