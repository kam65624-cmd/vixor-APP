"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTrades, getTradeStats, getEquityCurve } from "@/domains/trades/functions";
import type { Trade, TradeStats, EquityCurvePoint } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Vixor Terminal" }] }),
  component: Portfolio,
});

function formatPrice(price: number): string {
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  if (price < 100) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function Portfolio() {
  const [tab, setTab] = useState<"overview" | "holdings" | "analytics">("overview");

  const fetchTrades = useStableServerFn(listTrades);
  const fetchStats = useStableServerFn(getTradeStats);
  const fetchCurve = useStableServerFn(getEquityCurve);

  const { data: tradesData } = useQuery({
    queryKey: ["portfolio-trades"],
    queryFn: () => fetchTrades({ data: { limit: 50 } }),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ["trade-stats"],
    queryFn: () => fetchStats({}),
    refetchInterval: 60000,
  });

  const { data: curveData } = useQuery({
    queryKey: ["equity-curve"],
    queryFn: () => fetchCurve({}),
    refetchInterval: 60000,
  });

  // Extract arrays from paginated responses
  const trades = tradesData && typeof tradesData === "object" && "items" in tradesData
    ? (tradesData as { items: Trade[] }).items
    : Array.isArray(tradesData) ? tradesData as Trade[] : undefined;
  const curve = curveData && typeof curveData === "object" && "items" in curveData
    ? (curveData as { items: EquityCurvePoint[] }).items
    : Array.isArray(curveData) ? curveData as EquityCurvePoint[] : undefined;

  return (
    <div className="w-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💼</span>
            <h1 className="text-lg font-bold">Portfolio</h1>
          </div>
          <div className="flex items-center gap-1">
            {(["overview", "holdings", "analytics"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 rounded text-[10px] font-semibold capitalize transition-colors"
                style={{
                  background: tab === t ? "rgba(59,130,246,0.15)" : "transparent",
                  color: tab === t ? "#60A5FA" : "#7B8BA8",
                  border: tab === t ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "overview" && <OverviewTab stats={stats} curve={curve} trades={trades} />}
      {tab === "holdings" && <HoldingsTab trades={trades} />}
      {tab === "analytics" && <AnalyticsTab stats={stats} />}
    </div>
  );
}

function OverviewTab({ stats, curve, trades }: { stats?: TradeStats; curve?: EquityCurvePoint[]; trades?: Trade[] }) {
  const pnl = stats?.totalPnl ?? 0;
  const isPositive = pnl >= 0;
  const bestPnl = stats?.bestTrade?.pnl ?? 0;

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total PnL", value: `${isPositive ? "+" : ""}${formatLargeNum(Math.abs(pnl))}`, color: isPositive ? "#22C55E" : "#EF4444", sub: `${stats?.totalTrades ?? 0} trades` },
          { label: "Win Rate", value: `${(stats?.winRate ?? 0).toFixed(1)}%`, color: "#3B82F6", sub: `${stats?.winCount ?? 0}W / ${stats?.lossCount ?? 0}L` },
          { label: "Profit Factor", value: (stats?.profitFactor ?? 0).toFixed(2), color: "#F59E0B", sub: "Avg win vs avg loss" },
          { label: "Best Trade", value: formatLargeNum(Math.abs(bestPnl)), color: "#22C55E", sub: stats?.bestTrade?.pair ?? "—" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2.5 rounded-lg" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[9px] font-medium" style={{ color: "#4A5568" }}>{s.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="rounded-lg" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[11px] font-bold">📈 Equity Curve</span>
          <div className="flex items-center gap-1">
            {["1W", "1M", "3M", "ALL"].map((tf) => (
              <span key={tf} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ color: "#4A5568" }}>{tf}</span>
            ))}
          </div>
        </div>
        <div className="h-48 flex items-center justify-center">
          {curve && curve.length > 0 ? (
            <div className="w-full h-full px-3 py-2">
              <div className="flex items-end gap-px h-full">
                {curve.slice(-30).map((point, i) => {
                  const maxVal = Math.max(...curve.map((p) => p.cumulative_pnl));
                  const minVal = Math.min(...curve.map((p) => p.cumulative_pnl));
                  const range = maxVal - minVal || 1;
                  const height = ((point.cumulative_pnl - minVal) / range) * 100;
                  return (
                    <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
                      height: `${Math.max(height, 2)}%`,
                      background: point.cumulative_pnl >= (curve[i - 1]?.cumulative_pnl ?? point.cumulative_pnl)
                        ? "rgba(34,197,94,0.6)"
                        : "rgba(239,68,68,0.6)",
                      minWidth: "2px",
                    }} />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-1">📈</div>
              <span className="text-[10px]" style={{ color: "#4A5568" }}>Equity curve will appear after your first trades</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[11px] font-bold">📋 Recent Trades</span>
        </div>
        {trades && trades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left px-3 py-1.5">Pair</th>
                  <th className="text-left px-2 py-1.5">Side</th>
                  <th className="text-right px-2 py-1.5">Entry</th>
                  <th className="text-right px-2 py-1.5">Exit</th>
                  <th className="text-right px-2 py-1.5">PnL</th>
                  <th className="text-right px-2 py-1.5">R</th>
                  <th className="text-right px-3 py-1.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 10).map((trade) => {
                  const pos = (trade.pnl ?? 0) >= 0;
                  return (
                    <tr key={trade.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td className="px-3 py-2 font-bold">{trade.pair}</td>
                      <td className="px-2 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{
                          background: trade.direction === "long" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                          color: trade.direction === "long" ? "#22C55E" : "#EF4444",
                        }}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono" style={{ color: "#7B8BA8" }}>
                        {trade.entry_price ? formatPrice(trade.entry_price) : "—"}
                      </td>
                      <td className="px-2 py-2 text-right font-mono" style={{ color: "#7B8BA8" }}>
                        {trade.exit_price ? formatPrice(trade.exit_price) : "—"}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold" style={{ color: pos ? "#22C55E" : "#EF4444" }}>
                        {pos ? "+" : ""}{formatLargeNum(Math.abs(trade.pnl ?? 0))}
                      </td>
                      <td className="px-2 py-2 text-right font-mono" style={{ color: trade.r_multiple && trade.r_multiple > 0 ? "#22C55E" : "#4A5568" }}>
                        {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: "#4A5568" }}>
                        {trade.exit_date ? new Date(trade.exit_date).toLocaleDateString() : trade.entry_date ? new Date(trade.entry_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <span className="text-2xl mb-2">📋</span>
            <span className="text-[11px]" style={{ color: "#7B8BA8" }}>No trades yet. Start trading to see your performance.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HoldingsTab({ trades }: { trades?: Trade[] }) {
  const holdings = useMemo(() => {
    if (!trades) return [];
    const map = new Map<string, { pair: string; pnl: number; count: number; lastDir: string }>();
    for (const t of trades) {
      const existing = map.get(t.pair) || { pair: t.pair, pnl: 0, count: 0, lastDir: t.direction };
      existing.pnl += t.pnl ?? 0;
      existing.count += 1;
      existing.lastDir = t.direction;
      map.set(t.pair, existing);
    }
    return Array.from(map.values()).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
  }, [trades]);

  return (
    <div className="px-4 py-3 space-y-2">
      {holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-2xl mb-2">🎒</span>
          <span className="text-[11px]" style={{ color: "#7B8BA8" }}>No holdings data yet</span>
        </div>
      ) : (
        holdings.map((h) => {
          const isPos = h.pnl >= 0;
          return (
            <div key={h.pair} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full" style={{ width: "32px", height: "32px", background: "rgba(59,130,246,0.12)", fontSize: "10px", fontWeight: 800, color: "#60A5FA" }}>
                  {h.pair.slice(0, 2)}
                </div>
                <div>
                  <div className="text-[12px] font-bold">{h.pair}</div>
                  <div className="text-[9px]" style={{ color: "#4A5568" }}>{h.count} trades · last: {h.lastDir}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-mono font-bold" style={{ color: isPos ? "#22C55E" : "#EF4444" }}>
                  {isPos ? "+" : ""}{formatLargeNum(Math.abs(h.pnl))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function AnalyticsTab({ stats }: { stats?: TradeStats }) {
  const metrics = [
    { label: "Total Trades", value: stats?.totalTrades ?? 0, color: "#F0F4FC" },
    { label: "Winning Trades", value: stats?.winCount ?? 0, color: "#22C55E" },
    { label: "Losing Trades", value: stats?.lossCount ?? 0, color: "#EF4444" },
    { label: "Avg PnL", value: formatLargeNum(Math.abs(stats?.avgPnl ?? 0)), color: (stats?.avgPnl ?? 0) >= 0 ? "#22C55E" : "#EF4444" },
    { label: "Max Drawdown", value: `${(stats?.maxDrawdown ?? 0).toFixed(1)}%`, color: "#EF4444" },
    { label: "Avg R-Multiple", value: (stats?.avgRMultiple ?? 0).toFixed(2), color: "#3B82F6" },
    { label: "Avg Holding", value: stats?.avgHoldingTimeHours ? `${stats.avgHoldingTimeHours.toFixed(1)}h` : "—", color: "#F0F4FC" },
    { label: "Closed Trades", value: stats?.closedTrades ?? 0, color: "#7B8BA8" },
  ];

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="px-3 py-2.5 rounded-lg" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[9px]" style={{ color: "#4A5568" }}>{m.label}</div>
            <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Win Rate Bar */}
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold">Win Rate Distribution</span>
          <span className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{(stats?.winRate ?? 0).toFixed(1)}%</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex" style={{ background: "rgba(239,68,68,0.2)" }}>
          <div className="h-full rounded-full" style={{ width: `${stats?.winRate ?? 0}%`, background: "rgba(34,197,94,0.5)" }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px]" style={{ color: "#22C55E" }}>Wins: {stats?.winCount ?? 0}</span>
          <span className="text-[9px]" style={{ color: "#EF4444" }}>Losses: {stats?.lossCount ?? 0}</span>
        </div>
      </div>

      {/* Win Rate by Direction */}
      {stats?.winRateByDirection && stats.winRateByDirection.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[11px] font-bold block mb-2">By Direction</span>
          <div className="space-y-2">
            {stats.winRateByDirection.map((d) => (
              <div key={d.direction} className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "#7B8BA8" }}>{d.direction}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px]" style={{ color: "#4A5568" }}>{d.count} trades</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: d.winRate > 50 ? "#22C55E" : "#EF4444" }}>{d.winRate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
