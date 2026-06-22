import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memo } from "react";
import { getPortfolioData, getTradeHistory, getJournalEntries } from "@/shared/data";
import { cn } from "@/shared/utils";

export const Route = createFileRoute("/_authenticated/pnl")({
  head: () => ({ meta: [{ title: "PnL — Vixor Terminal" }] }),
  component: PnLPage,
});

interface TradeEntry {
  id: string;
  token: string;
  chain: string;
  type: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: string;
  pnl: string;
  pnlPct: number;
  duration: string;
  timestamp: string;
}

function PnLPage() {
  const navigate = useNavigate();
  const { holdings, totalValue, totalPnl, totalPnlPct, isLoading } = useQuery({
    queryKey: ["portfolio-data", userId: "me"],
    queryFn: getPortfolioData,
  });
  const trades = useQuery({
    queryKey: ["trade-history", userId: "me"],
    queryFn: getTradeHistory,
  });

  if (isLoading) {
    return (
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
          </div>
          <p style={{ fontSize: "14px", color: "#7B8BA8", marginBottom: "8px" }}>Loading trade data...</p>
        </div>
    );
  }

  const hasData = holdings && holdings.length > 0 || trades.length > 0;
  const winRate = trades.length > 0 ? Math.round((trades.filter(t => parseFloat(t.pnl) > 0).length / trades.length) * 100) : 0;
  const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const avgWin = totalPnl > 0 ? totalPnl / trades.filter(t => parseFloat(t.pnl) > 0).length : 0;
  const profitFactor = totalPnl > 0 && totalPnl < 0 ? Math.abs(totalPnl) / Math.abs(trades.reduce((s, t) => s + (t.pnl || 0), 0)) : 0;

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h1 className="text-lg font-bold">PnL Tracker</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          {hasData ? `Trading data from ${trades.length} real trades` : "Connect your wallet to see real data"}
        </p>
      </div>

      {/* Stats Grid */}
      {!isLoading && hasData && (
        <>
          <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total PnL</div>
              <div className="text-lg font-bold font-mono">{`$${totalPnl}`}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Win Rate</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#3B82F6" }}>{winRate}%</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Profit Factor</div>
              <div className="text-lg font-bold font-mono">{profitFactor}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#22C55E" }}>Best Trade</div>
              <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{PNL_STATS.bestTrade}</div>
            </div>
          </div>
        </div>
      )}

      {/* Trade History */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-bold">Recent Trades</span>
        <span className="text-[10px]" style={{ color: "#4A5568" }}>Last 30 days</span>
      </div>

      {/* Table Header */}
      <div className="px-4 py-1.5 flex items-center text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ width: "80px" }}>Token</div>
        <div style={{ width: "50px" }}>Type</div>
        <div style={{ width: "70px" }} className="text-right">Entry</div>
        <div style={{ width: "50px" }} className="text-right">Exit</div>
        <div style={{ width: "70px" }} className="text-right">Size</div>
        <div style={{ width: "60px" }} className="text-right">PnL</div>
        <div style={{ width: "70px" }} className="text-right">Duration</div>
      </div>

      <div className="overflow-y-auto px-4" style={{ maxHeight: "calc(100vh - 340px)" }}>
        {TRADE_HISTORY.map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
      </div>
    </div>
    </div>
  );
}

const TradeRow = memo(function TradeRow({ trade }: { trade: TradeEntry }) {
  const isPositive = trade.pnlPct >= 0;
  const color = isPositive ? "#22C55E" : "#EF4444";
  return (
    <div
      className="flex items-center px-0 py-2 text-[11px] font-mono"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
    >
      <div style={{ width: "80px" }}>
        <span className="font-bold">{trade.token}</span>
        <span className="text-[9px]" style={{ color: "#4A5568" }}>{trade.chain}</span>
      </div>
      <div style={{ width: "50px" }}>
        <span className="text-[9px] px-1 rounded" style={{ background: trade.type === "long" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color }}>{trade.type.toUpperCase()}</span>
      </div>
      <div style={{ width: "70px" }} className="text-right">{trade.entryPrice.toFixed(trade.entryPrice < 0.001 ? 10 : 4)}</div>
      <div style={{ width: "70px" }} className="text-right">{trade.exitPrice.toFixed(trade.exitPrice < 0.001 ? 10 : 4)}</div>
      <div style={{ width: "60px" }} className="text-right font-bold" style={{ color }}>{trade.pnl}</div>
      <div style={{ width: "70px" }} className="text-right font-bold" style={{ color }}>{isPositive ? "+" : ""}{trade.pnlPct}%</div>
      <div style={{ width: "70px" }} className="text-right" style={{ color: "#4A5568" }}>{trade.duration}</div>
    </div>
  );
});