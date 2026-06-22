import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getBondingCurveData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/curves")({
  head: () => ({ meta: [{ title: "Bonding Curves — Vixor" }] }),
  component: CurvesPage,
});

const TABS = ["All Pairs", "Accumulating"] as const;

function formatValue(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

function CurvesPage() {
  const fetchCurvesData = useStableServerFn(getBondingCurveData);
  const [activeTab, setActiveTab] = useState<string>("All Pairs");

  const query = useQuery({
    queryKey: ["bonding-curve-data"],
    queryFn: () => fetchCurvesData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const pairs = query.data?.pairs ?? [];
  const accumulating = query.data?.accumulating ?? [];
  const stats = query.data?.stats ?? {
    accumulatingCount: 0,
    uniquePairs: 0,
    mostTradedPair: "—",
    mostTradedVolume: 0,
  };

  const displayPairs = activeTab === "Accumulating" ? accumulating : pairs;

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h1 className="text-lg font-bold">Bonding Curves</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}>ACCUMULATION TRACKER</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          Trade distribution analysis — spot accumulation patterns across pairs
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#22C55E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Accumulating</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#22C55E" }}>{stats.accumulatingCount}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Unique Pairs</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#3B82F6" }}>{stats.uniquePairs}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Most Traded</div>
              <div className="text-sm font-bold" style={{ color: "#F59E0B" }}>{stats.mostTradedPair}</div>
              <div className="text-[9px] font-mono" style={{ color: "#7B8BA8" }}>{formatValue(stats.mostTradedVolume)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px",
                border: "none", cursor: "pointer",
                color: activeTab === t ? "#fff" : "#7B8BA8",
                background: activeTab === t ? "rgba(34,197,94,0.15)" : "transparent",
              }}>{t} ({activeTab === "Accumulating" ? accumulating.length : pairs.length})</button>
            ))}
          </div>

          {/* Pairs List */}
          <div className="px-4 py-2 overflow-y-auto space-y-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
            {displayPairs.length > 0 ? (
              displayPairs.map((pair: any) => (
                <AccumulationCard key={pair.pair} pair={pair} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                <span style={{ fontSize: "24px" }}>📈</span>
                <p style={{ fontSize: "12px", color: "#7B8BA8" }}>
                  {pairs.length === 0
                    ? "No trade data yet. Start trading to see accumulation patterns."
                    : "No pairs showing accumulation signals."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const AccumulationCard = memo(function AccumulationCard({ pair }: { pair: any }) {
  const isAccumulating = pair.buyCount > pair.sellCount;
  const ratio = pair.ratio || 0;
  const totalTrades = pair.buyCount + pair.sellCount;

  // Calculate bar widths for visual ratio display
  const buyPct = totalTrades > 0 ? (pair.buyCount / totalTrades) * 100 : 50;

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "#161b2e",
        border: `1px solid ${isAccumulating ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)"}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold">{pair.pair}</span>
          {isAccumulating && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
              ACCUMULATING
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold font-mono" style={{ color: isAccumulating ? "#22C55E" : "#EF4444" }}>
          {ratio.toFixed(1)}x
        </span>
      </div>

      {/* Buy/Sell ratio bar */}
      <div className="flex items-center gap-2 mb-2" style={{ height: "6px", borderRadius: "3px", overflow: "hidden", background: "#1e2438" }}>
        <div style={{ width: `${buyPct}%`, background: "#22C55E", borderRadius: "3px 0 0 3px", transition: "width 0.3s" }} />
        <div style={{ width: `${100 - buyPct}%`, background: "#EF4444", borderRadius: "0 3px 3px 0", transition: "width 0.3s" }} />
      </div>

      <div className="flex items-center justify-between text-[10px]" style={{ color: "#7B8BA8" }}>
        <div className="flex items-center gap-3">
          <span>Buy: <span style={{ color: "#22C55E", fontWeight: 700 }}>{pair.buyCount}</span></span>
          <span>Sell: <span style={{ color: "#EF4444", fontWeight: 700 }}>{pair.sellCount}</span></span>
        </div>
        <span className="font-mono">Vol: {formatValue(pair.totalVolume)}</span>
      </div>
    </div>
  );
});