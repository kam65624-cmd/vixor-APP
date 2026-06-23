import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/token/$symbol")({
  head: () => ({ meta: [{ title: "Token — Vixor" }] }),
  component: TokenPage,
});

function TokenPage() {
  const { symbol } = useParams({ from: "/_authenticated/token/$symbol" });
  const fetchTrades = useStableServerFn(getTradeHistory);

  const query = useQuery({
    queryKey: ["token-trades", symbol],
    queryFn: () => fetchTrades({ data: { limit: 100 } }),
    staleTime: 15_000,
  });

  const allTrades = query.data?.trades ?? [];
  const tokenTrades = allTrades.filter((t) => t.pair?.toUpperCase().includes(symbol.toUpperCase()));

  const closedTrades = tokenTrades.filter((t) => t.status === "closed" && t.pnl != null);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const winRate = closedTrades.length > 0 ? Math.round((closedTrades.filter((t) => (t.pnl || 0) > 0).length / closedTrades.length) * 100) : 0;

  return (
    <div style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Link to="/discover" style={{ color: "#34D399", fontSize: "11px" }}>Discover</Link>
          <span style={{ color: "#6B7280", fontSize: "11px" }}>/</span>
          <span className="text-lg font-bold">{symbol.toUpperCase()}</span>
        </div>
      </div>

      {/* Token Stats */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#1E1E1E" }}>
          <div className="text-[9px]" style={{ color: "#6B7280" }}>Your Trades</div>
          <div className="text-lg font-bold font-mono">{tokenTrades.length}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#1E1E1E" }}>
          <div className="text-[9px]" style={{ color: "#6B7280" }}>Total PnL</div>
          <div className="text-lg font-bold font-mono" style={{ color: totalPnl >= 0 ? "#22C55E" : "#EF4444" }}>
            {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#1E1E1E" }}>
          <div className="text-[9px]" style={{ color: "#6B7280" }}>Win Rate</div>
          <div className="text-lg font-bold font-mono" style={{ color: "#10B981" }}>{winRate}%</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#1E1E1E" }}>
          <div className="text-[9px]" style={{ color: "#6B7280" }}>Closed</div>
          <div className="text-lg font-bold font-mono">{closedTrades.length}</div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div style={{ height: "280px", background: "#0c101e", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>&#128200;</span>
          <span style={{ fontSize: "11px", color: "#6B7280" }}>Chart requires OHLCV data feed</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>COMING SOON</span>
        </div>
      </div>

      {/* Trade History */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-bold">Your Trades for {symbol.toUpperCase()}</span>
      </div>

      <div className="overflow-y-auto px-4" style={{ maxHeight: "calc(100vh - 480px)" }}>
        {tokenTrades.length > 0 ? tokenTrades.map((trade) => (
          <TokenTradeRow key={trade.id} trade={trade} />
        )) : (
          <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
            <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
              {allTrades.length === 0
                ? "No trades yet. Go to Trade Desk to log your first trade."
                : `No trades found for ${symbol.toUpperCase()}. This token may be tracked under a different pair name.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const TokenTradeRow = memo(function TokenTradeRow({ trade }: { trade: any }) {
  const isPos = (trade.pnl || 0) >= 0;
  const isLong = trade.direction === "long";
  const fmtPrice = (n: number) => n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2);

  return (
    <div className="flex items-center px-0 py-2 text-[11px] font-mono" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <div style={{ width: "50px" }}>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{
          background: isLong ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          color: isLong ? "#22C55E" : "#EF4444",
        }}>{(trade.direction || "").toUpperCase()}</span>
      </div>
      <div style={{ width: "80px", textAlign: "right" }}>{fmtPrice(trade.entry_price)}</div>
      <div style={{ width: "80px", textAlign: "right", color: "#9CA3AF" }}>{trade.exit_price ? fmtPrice(trade.exit_price) : "—"}</div>
      <div style={{ width: "60px", textAlign: "right", color: "#9CA3AF" }}>{trade.quantity ?? "—"}</div>
      <div style={{ width: "80px", textAlign: "right", fontWeight: 700, color: isPos ? "#22C55E" : "#EF4444" }}>
        {trade.pnl != null ? (isPos ? "+" : "") + trade.pnl.toFixed(2) : "—"}
      </div>
      <div style={{ width: "50px", textAlign: "right", color: trade.r_multiple && trade.r_multiple > 0 ? "#22C55E" : "#6B7280" }}>
        {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
      </div>
      <div style={{ flex: 1, textAlign: "right", color: "#6B7280", fontSize: "10px" }}>
        {new Date(trade.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
});