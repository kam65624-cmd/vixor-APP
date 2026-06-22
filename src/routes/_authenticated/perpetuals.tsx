import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getPerpetualsData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/perpetuals")({
  head: () => ({ meta: [{ title: "Perpetuals — Vixor" }] }),
  component: PerpetualsPage,
});

const TABS = ["Open Positions", "Recent Closed"] as const;

function formatValue(val: number): string {
  const abs = Math.abs(val);
  const prefix = val >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(2)}K`;
  return `${prefix}$${abs.toFixed(2)}`;
}

function PerpetualsPage() {
  const fetchPerpsData = useStableServerFn(getPerpetualsData);
  const [activeTab, setActiveTab] = useState<string>("Open Positions");

  const query = useQuery({
    queryKey: ["perpetuals-data"],
    queryFn: () => fetchPerpsData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const openPositions = query.data?.openPositions ?? [];
  const closedPerformance = query.data?.closedPerformance ?? [];
  const stats = query.data?.stats ?? {
    openCount: 0,
    totalUnrealizedPnl: 0,
    totalRealizedPnl: 0,
    bestPair: "—",
    bestPairPnl: 0,
    winRate: 0,
    totalClosed: 0,
  };

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h1 className="text-lg font-bold">Perpetuals</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>POSITIONS TRACKER</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          Track open positions and closed trade performance
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Open Positions</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#3B82F6" }}>{stats.openCount}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Unrealized PnL</div>
              <div className="text-lg font-bold font-mono" style={{ color: stats.totalUnrealizedPnl >= 0 ? "#22C55E" : "#EF4444" }}>
                {formatValue(stats.totalUnrealizedPnl)}
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Best Pair</div>
              <div className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{stats.bestPair}</div>
              <div className="text-[9px] font-mono" style={{ color: stats.bestPairPnl >= 0 ? "#22C55E" : "#EF4444" }}>
                {formatValue(stats.bestPairPnl)}
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Win Rate</div>
              <div className="text-lg font-bold font-mono" style={{ color: stats.winRate >= 50 ? "#22C55E" : "#F59E0B" }}>
                {stats.winRate}%
              </div>
              <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{stats.totalClosed} closed</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px",
                border: "none", cursor: "pointer",
                color: activeTab === t ? "#fff" : "#7B8BA8",
                background: activeTab === t ? "rgba(59,130,246,0.15)" : "transparent",
              }}>{t} ({activeTab === "Open Positions" ? openPositions.length : closedPerformance.length})</button>
            ))}
          </div>

          {/* Positions List */}
          <div className="px-4 py-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {activeTab === "Open Positions" ? (
              openPositions.length > 0 ? (
                <div className="space-y-2">
                  {openPositions.map((pos: any) => (
                    <PositionCard key={pos.id} position={pos} isOpen />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                  <span style={{ fontSize: "24px" }}>💰</span>
                  <p style={{ fontSize: "12px", color: "#7B8BA8" }}>No open positions. Open a trade to start tracking.</p>
                </div>
              )
            ) : (
              closedPerformance.length > 0 ? (
                <div className="space-y-1">
                  {/* Table Header */}
                  <div className="flex items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-t-lg" style={{ color: "#4A5568", background: "#161b2e", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width: "18%" }}>Pair</div>
                    <div style={{ width: "10%" }}>Dir</div>
                    <div style={{ width: "16%" }} className="text-right">Entry</div>
                    <div style={{ width: "16%" }} className="text-right">Exit</div>
                    <div style={{ width: "20%" }} className="text-right">PnL</div>
                    <div style={{ width: "10%" }} className="text-right">R-Mult</div>
                    <div style={{ width: "10%" }} className="text-right">Status</div>
                  </div>
                  {closedPerformance.map((trade: any) => (
                    <ClosedTradeRow key={trade.id} trade={trade} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                  <span style={{ fontSize: "24px" }}>📊</span>
                  <p style={{ fontSize: "12px", color: "#7B8BA8" }}>No closed trades yet. Complete a trade to see performance here.</p>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

const PositionCard = memo(function PositionCard({ position, isOpen }: { position: any; isOpen: boolean }) {
  const isLong = position.direction === "LONG";
  const dirColor = isLong ? "#22C55E" : "#EF4444";
  const pnl = position.pnl || 0;
  const pnlColor = pnl >= 0 ? "#22C55E" : "#EF4444";

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "#161b2e",
        border: `1px solid ${pnlColor}18`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${dirColor}20`, color: dirColor }}
          >
            {position.direction}
          </span>
          <span className="text-[13px] font-bold">{position.pair}</span>
          {isOpen && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>
              OPEN
            </span>
          )}
        </div>
        <span className="text-[12px] font-bold font-mono" style={{ color: pnlColor }}>
          {formatValue(pnl)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: "#7B8BA8" }}>
        <div className="flex items-center gap-4">
          <span>Entry: <span style={{ color: "#F0F4FC" }}>${position.entryPrice.toFixed(2)}</span></span>
          <span>Qty: <span style={{ color: "#F0F4FC" }}>{position.quantity}</span></span>
        </div>
        <div className="flex items-center gap-3">
          {position.rMultiple !== 0 && (
            <span>R: <span style={{ color: position.rMultiple >= 0 ? "#22C55E" : "#EF4444", fontWeight: 700 }}>
              {position.rMultiple >= 0 ? "+" : ""}{position.rMultiple.toFixed(1)}
            </span></span>
          )}
          {position.stopLoss != null && (
            <span>SL: <span style={{ color: "#EF4444" }}>${position.stopLoss}</span></span>
          )}
          {position.takeProfit != null && (
            <span>TP: <span style={{ color: "#22C55E" }}>${position.takeProfit}</span></span>
          )}
        </div>
      </div>
    </div>
  );
});

const ClosedTradeRow = memo(function ClosedTradeRow({ trade }: { trade: any }) {
  const isLong = trade.direction === "LONG";
  const dirColor = isLong ? "#22C55E" : "#EF4444";
  const pnl = trade.pnl || 0;
  const pnlColor = pnl >= 0 ? "#22C55E" : "#EF4444";
  const rMult = trade.rMultiple || 0;

  const statusColors: Record<string, string> = {
    closed: "#22C55E",
    win: "#22C55E",
    loss: "#EF4444",
    breakeven: "#F59E0B",
  };
  const statusColor = statusColors[trade.status] || "#4A5568";

  return (
    <div className="flex items-center px-3 py-2 text-[11px]" style={{ background: "#161b2e", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: "18%", fontWeight: 700 }}>{trade.pair}</div>
      <div style={{ width: "10%" }}>
        <span className="text-[8px] font-bold" style={{ color: dirColor }}>{trade.direction}</span>
      </div>
      <div style={{ width: "16%", textAlign: "right", fontFamily: "monospace", color: "#7B8BA8" }}>${trade.entryPrice.toFixed(2)}</div>
      <div style={{ width: "16%", textAlign: "right", fontFamily: "monospace", color: "#7B8BA8" }}>${trade.exitPrice.toFixed(2)}</div>
      <div style={{ width: "20%", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: pnlColor }}>
        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
      </div>
      <div style={{ width: "10%", textAlign: "right", fontFamily: "monospace", color: rMult >= 0 ? "#22C55E" : "#EF4444" }}>
        {rMult >= 0 ? "+" : ""}{rMult.toFixed(1)}
      </div>
      <div style={{ width: "10%", textAlign: "right" }}>
        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: `${statusColor}18`, color: statusColor }}>
          {trade.status || "closed"}
        </span>
      </div>
    </div>
  );
});