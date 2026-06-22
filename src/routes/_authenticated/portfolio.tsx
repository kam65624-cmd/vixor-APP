import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getPortfolioData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Vixor" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const navigate = useNavigate();
  const fetchPortfolio = useStableServerFn(getPortfolioData);
  const [activeTab, setActiveTab] = useState<"holdings" | "history">("holdings");

  const query = useQuery({
    queryKey: ["portfolio-data-page"],
    queryFn: () => fetchPortfolio({}),
    staleTime: 30_000,
  });

  const data = query.data;
  const isLoading = query.isLoading;
  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(2)}K` : `$${n.toFixed(2)}`;

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <span style={{ fontSize: "18px" }}>\uD83D\uDCBC</span>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Portfolio</h1>
      </div>
      <p style={{ fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" }}>
        Derived from your {tradeCount} recorded trades
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Portfolio Value */}
          <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Portfolio Value</div>
                <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "monospace", marginTop: "4px" }}>{fmt(totalValue)}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "monospace", color: totalPnl >= 0 ? "#22C55E" : "#EF4444", marginTop: "4px" }}>
                  {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%)
                </div>
              </div>
            </div>
            {/* Allocation bar */}
            {holdings.length > 0 && (
              <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", marginTop: "16px" }}>
                {holdings.map((h, i) => {
                  const pct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                  if (pct < 1) return null;
                  const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E", "#EF4444", "#06B6D4"];
                  return (
                    <div key={h.symbol} style={{ width: `${pct}%`, background: colors[i % colors.length], borderRadius: i === 0 ? "3px 0 0 3px" : i === holdings.length - 1 ? "0 3px 3px 0" : undefined }} title={`${h.symbol}: ${pct.toFixed(1)}%`} />
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "#161b2e", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
            {(["holdings", "history"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                fontSize: "12px", fontWeight: 600, padding: "8px 16px", borderRadius: "8px", border: "none",
                cursor: "pointer", color: activeTab === t ? "#F0F4FC" : "#7B8BA8",
                background: activeTab === t ? "#1e2438" : "transparent",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>{t === "holdings" ? "Holdings" : "History"}</button>
            ))}
          </div>

          {activeTab === "holdings" ? (
            <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div className="flex items-center px-4 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "20%" }}>Token</div>
                <div style={{ width: "15%" }} className="text-right">Amount</div>
                <div style={{ width: "15%" }} className="text-right">Avg Entry</div>
                <div style={{ width: "15%" }} className="text-right">Value</div>
                <div style={{ width: "15%" }} className="text-right">PnL</div>
                <div style={{ width: "10%" }} className="text-right">PnL %</div>
                <div style={{ width: "10%" }} className="text-right">Alloc</div>
              </div>
              {holdings.length > 0 ? holdings.map((h) => (
                <HoldingRow key={h.symbol} holding={h} totalValue={totalValue} />
              )) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#7B8BA8", fontSize: 13 }}>
                  No trades yet. <span style={{ color: "#60A5FA", cursor: "pointer" }} onClick={() => navigate({ to: "/trade-desk" })}>Start trading →</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ padding: "40px", textAlign: "center", color: "#7B8BA8", fontSize: 13 }}>
                View your full trade history on the <span style={{ color: "#60A5FA", cursor: "pointer" }} onClick={() => navigate({ to: "/pnl" })}>PnL Tracker</span> page.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const HoldingRow = memo(function HoldingRow({ holding, totalValue }: { holding: any; totalValue: number }) {
  const isPos = holding.pnlPct >= 0;
  const color = isPos ? "#22C55E" : "#EF4444";
  const alloc = totalValue > 0 ? ((holding.value / totalValue) * 100).toFixed(1) : "0";
  const fmtPrice = (n: number) => n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2);

  return (
    <div className="flex items-center px-4 py-3 text-[11px] font-mono" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: "20%", fontWeight: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: isPos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color, flexShrink: 0 }}>
            {holding.symbol.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{holding.symbol}</div>
            <div style={{ fontSize: "9px", color: "#4A5568" }}>{holding.chain}</div>
          </div>
        </div>
      </div>
      <div style={{ width: "15%", textAlign: "right" }}>{holding.amount.toFixed(4)}</div>
      <div style={{ width: "15%", textAlign: "right", color: "#7B8BA8" }}>${fmtPrice(holding.avgEntry)}</div>
      <div style={{ width: "15%", textAlign: "right", fontWeight: 600 }}>${holding.value.toFixed(2)}</div>
      <div style={{ width: "15%", textAlign: "right", fontWeight: 700, color }}>
        {holding.pnl >= 0 ? "+" : ""}{holding.pnl.toFixed(2)}
      </div>
      <div style={{ width: "10%", textAlign: "right", fontWeight: 700, color }}>
        {isPos ? "+" : ""}{holding.pnlPct.toFixed(1)}%
      </div>
      <div style={{ width: "10%", textAlign: "right", color: "#7B8BA8" }}>{alloc}%</div>
    </div>
  );
});