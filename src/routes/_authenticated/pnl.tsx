import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import type { Tables } from "@/shared/supabase/types";

type Trade = Tables<"trades">;

export const Route = createFileRoute("/_authenticated/pnl")({
  head: () => ({ meta: [{ title: "PnL — Vixor Terminal" }] }),
  component: PnLPage,
});

function PnLPage() {
  const navigate = useNavigate();
  const fetchTrades = useStableServerFn(getTradeHistory);

  const tradesQuery = useQuery({
    queryKey: ["trade-history-pnl"],
    queryFn: () => fetchTrades({ data: { limit: 100 } }),
    staleTime: 15_000,
  });

  const isLoading = tradesQuery.isLoading;
  const trades: Trade[] = tradesQuery.data?.trades ?? [];

  const closedTrades = trades.filter((t) => t.status === "closed" && t.pnl !== null);
  const openTrades = trades.filter((t) => t.status === "open");

  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
  const losses = closedTrades.filter((t) => (t.pnl || 0) < 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
  const avgWin = wins > 0 ? closedTrades.filter((t) => (t.pnl || 0) > 0).reduce((s, t) => s + (t.pnl || 0), 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(closedTrades.filter((t) => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0) / losses) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  const bestTrade = closedTrades.length > 0 ? closedTrades.reduce((best, t) => (t.pnl || 0) > (best.pnl || 0) ? t : best) : null;

  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fmtDuration = (entry: string, exit?: string | null) => {
    if (!exit) return "—";
    const ms = new Date(exit).getTime() - new Date(entry).getTime();
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const fmtPrice = (n: number) =>
    n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2);

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h1 className="text-lg font-bold">PnL Tracker</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          {closedTrades.length > 0
            ? `${closedTrades.length} closed trades · ${openTrades.length} open`
            : "No trades yet"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          {closedTrades.length > 0 && (
            <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
                <div className="text-[9px]" style={{ color: "#4A5568" }}>Total PnL</div>
                <div className="text-lg font-bold font-mono" style={{ color: totalPnl >= 0 ? "#22C55E" : "#EF4444" }}>{pnlFmt(totalPnl)}</div>
              </div>
              <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
                <div className="text-[9px]" style={{ color: "#4A5568" }}>Win Rate</div>
                <div className="text-lg font-bold font-mono" style={{ color: "#3B82F6" }}>{winRate}%</div>
                <div className="text-[9px]" style={{ color: "#4A5568" }}>{wins}W / {losses}L</div>
              </div>
              <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
                <div className="text-[9px]" style={{ color: "#4A5568" }}>Profit Factor</div>
                <div className="text-lg font-bold font-mono">{profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}</div>
              </div>
              <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
                <div className="text-[9px]" style={{ color: "#4A5568" }}>Best Trade</div>
                {bestTrade ? (
                  <>
                    <div className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{bestTrade.pair}</div>
                    <div className="text-[9px] font-mono" style={{ color: "#22C55E" }}>{pnlFmt(bestTrade.pnl || 0)}</div>
                  </>
                ) : (
                  <div className="text-[11px]" style={{ color: "#4A5568" }}>—</div>
                )}
              </div>
            </div>
          )}

          {/* Trade History Header */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[11px] font-bold">Recent Trades</span>
            <span className="text-[10px]" style={{ color: "#4A5568" }}>{trades.length} total</span>
          </div>

          {/* Table Header */}
          <div className="px-4 py-1.5 flex items-center text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: "80px" }}>Pair</div>
            <div style={{ width: "50px" }}>Side</div>
            <div style={{ width: "75px" }} className="text-right">Entry</div>
            <div style={{ width: "75px" }} className="text-right">Exit</div>
            <div style={{ width: "55px" }} className="text-right">Qty</div>
            <div style={{ width: "75px" }} className="text-right">PnL</div>
            <div style={{ width: "55px" }} className="text-right">R</div>
            <div style={{ width: "65px" }} className="text-right">Duration</div>
          </div>

          {/* Trade Rows */}
          <div className="overflow-y-auto px-4" style={{ maxHeight: "calc(100vh - 340px)" }}>
            {trades.length > 0 ? (
              trades.map((trade) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  pnlFmt={pnlFmt}
                  fmtPrice={fmtPrice}
                  fmtDate={fmtDate}
                  fmtDuration={fmtDuration}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                <p style={{ fontSize: "12px", color: "#7B8BA8" }}>No trades recorded yet</p>
                <button
                  onClick={() => navigate({ to: "/trade-desk" })}
                  style={{
                    padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                    background: "rgba(59,130,246,0.12)", color: "#60A5FA",
                    fontSize: "11px", fontWeight: 700,
                  }}>
                  Log a Trade
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const TradeRow = memo(function TradeRow({
  trade,
  pnlFmt,
  fmtPrice,
  fmtDate,
  fmtDuration,
}: {
  trade: Trade;
  pnlFmt: (n: number) => string;
  fmtPrice: (n: number) => string;
  fmtDate: (d: string) => string;
  fmtDuration: (e: string, x?: string | null) => string;
}) {
  const isPositive = (trade.pnl || 0) >= 0;
  const color = isPositive ? "#22C55E" : "#EF4444";
  const isLong = trade.direction === "long";

  return (
    <div
      className="flex items-center px-0 py-2 text-[11px] font-mono"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
    >
      <div style={{ width: "80px" }}>
        <span className="font-bold">{trade.pair}</span>
      </div>
      <div style={{ width: "50px" }}>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold"
          style={{
            background: isLong ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            color,
          }}
        >
          {trade.direction.toUpperCase()}
        </span>
      </div>
      <div style={{ width: "75px", textAlign: "right" }}>{fmtPrice(trade.entry_price)}</div>
      <div style={{ width: "75px", textAlign: "right" }}>{trade.exit_price ? fmtPrice(trade.exit_price) : "—"}</div>
      <div style={{ width: "55px", textAlign: "right", color: "#7B8BA8" }}>{trade.quantity ?? "—"}</div>
      <div style={{ width: "75px", textAlign: "right", fontWeight: 700, color }}>
        {trade.pnl !== null ? pnlFmt(trade.pnl) : "—"}
      </div>
      <div style={{ width: "55px", textAlign: "right", color: trade.r_multiple && trade.r_multiple > 0 ? "#22C55E" : "#4A5568" }}>
        {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
      </div>
      <div style={{ width: "65px", textAlign: "right", color: "#4A5568" }}>
        {fmtDuration(trade.entry_date, trade.exit_date)}
      </div>
    </div>
  );
});