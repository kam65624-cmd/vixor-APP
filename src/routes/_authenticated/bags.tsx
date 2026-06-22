import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getPortfolioData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/bags")({
  head: () => ({ meta: [{ title: "Bags — Vixor Terminal" }] }),
  component: BagsPage,
});

function BagsPage() {
  const navigate = useNavigate();
  const fetchPortfolio = useStableServerFn(getPortfolioData);

  const portfolioQuery = useQuery({
    queryKey: ["portfolio-data"],
    queryFn: () => fetchPortfolio({}),
    staleTime: 30_000,
  });

  const data = portfolioQuery.data;
  const isLoading = portfolioQuery.isLoading;
  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;

  const hasData = holdings.length > 0;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(2)}K` : `$${n.toFixed(2)}`;
  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎒</span>
          <h1 className="text-lg font-bold">My Bags</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          {hasData
            ? `${holdings.length} holdings from ${tradeCount} trades`
            : "Portfolio data from your trades"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : hasData ? (
        <>
          {/* Total Value */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Portfolio Value</div>
              <div className="text-xl font-bold font-mono">{fmt(totalValue)}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total PnL</div>
              <div className="text-lg font-bold font-mono" style={{ color: totalPnl >= 0 ? "#22C55E" : "#EF4444" }}>{pnlFmt(totalPnl)}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total Return</div>
              <div className="text-lg font-bold font-mono" style={{ color: totalPnlPct >= 0 ? "#22C55E" : "#EF4444" }}>{totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%</div>
            </div>
          </div>

          {/* Holdings List */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[11px] font-bold">{holdings.length} Holdings</span>
          </div>

          <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
            {holdings.map((bag) => (
              <BagCard key={bag.symbol} bag={bag} />
            ))}
          </div>
        </>
      ) : (
        <div className="px-4 py-2 flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#7B8BA8" }}>🎒</span>
          <p style={{ fontSize: "11px", color: "#7B8BA8", textAlign: "center" }}>
            No trades yet. Start trading to see your bags here.
          </p>
          <button
            onClick={() => navigate({ to: "/trade-desk" })}
            style={{
              padding: "10px 24px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "rgba(59,130,246,0.12)", color: "#60A5FA",
              fontSize: "11px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif",
            }}>
            Go to Trade Desk
          </button>
        </div>
      )}
    </div>
  );
}

interface BagData {
  symbol: string;
  name: string;
  chain: string;
  amount: number;
  avgEntry: number;
  pnl: number;
  value: number;
  pnlPct: number;
}

const BagCard = memo(function BagCard({ bag }: { bag: BagData }) {
  const isPos = bag.pnlPct >= 0;
  const color = isPos ? "#22C55E" : "#EF4444";
  const totalVal = bag.value;
  const allocPct = 0; // would need totalValue passed in

  const fmtPrice = (n: number) =>
    n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2);

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
      style={{
        background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.1s", cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2438"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#161b2e"; }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(59,130,246,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 800, color, flexShrink: 0,
          }}>
          {bag.symbol.slice(0, 2)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-bold">{bag.symbol}</span>
            <span className="text-[9px]" style={{ color: "#4A5568" }}>{bag.chain}</span>
          </div>
          <div className="text-[9px]" style={{ color: "#7B8BA8" }}>
            {bag.amount.toFixed(4)} tokens · avg {fmtPrice(bag.avgEntry)}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[12px] font-bold font-mono">${totalVal.toFixed(2)}</div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-mono font-bold" style={{ color }}>
            {bag.pnl >= 0 ? "+" : ""}{bag.pnl.toFixed(2)}
          </span>
          <span className="text-[9px] font-mono font-bold" style={{ color }}>
            {isPos ? "+" : ""}{bag.pnlPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
});