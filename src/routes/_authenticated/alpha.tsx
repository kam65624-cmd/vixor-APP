import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getAlphaData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/alpha")({
  head: () => ({ meta: [{ title: "Alpha Signals — Vixor" }] }),
  component: AlphaPage,
});

const TABS = ["All", "Signals", "Analyses"] as const;

function AlphaPage() {
  const fetchAlphaData = useStableServerFn(getAlphaData);
  const [activeTab, setActiveTab] = useState<string>("All");

  const query = useQuery({
    queryKey: ["alpha-data"],
    queryFn: () => fetchAlphaData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const alphaFeed = query.data?.alphaFeed ?? [];
  const stats = query.data?.stats ?? {
    activeBuySignals: 0,
    avgConfidence: 0,
    highestConfidence: 0,
    highestConfidencePair: "—",
    signalCount: 0,
    analysisCount: 0,
  };

  const filteredFeed = activeTab === "All"
    ? alphaFeed
    : alphaFeed.filter((item: any) => item.source === (activeTab === "Signals" ? "signal" : "analysis"));

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h1 className="text-lg font-bold">Alpha Signals</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#FBBF24" }}>ALPHA FEED</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          High-confidence BUY signals from AI analysis — confidence &gt; 70%
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#F59E0B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Active BUY</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#22C55E" }}>{stats.activeBuySignals}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Avg Confidence</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#F59E0B" }}>{stats.avgConfidence}%</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Highest</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#EC4899" }}>{stats.highestConfidence}%</div>
              <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{stats.highestConfidencePair}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Sources</div>
              <div className="text-[11px] font-bold" style={{ color: "#3B82F6" }}>{stats.signalCount} sig</div>
              <div className="text-[11px] font-bold" style={{ color: "#8B5CF6" }}>{stats.analysisCount} ana</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px",
                border: "none", cursor: "pointer",
                color: activeTab === t ? "#fff" : "#7B8BA8",
                background: activeTab === t ? "rgba(245,158,11,0.15)" : "transparent",
              }}>{t} ({activeTab === "All" ? alphaFeed.length : activeTab === "Signals" ? stats.signalCount : stats.analysisCount})</button>
            ))}
          </div>

          {/* Alpha Feed */}
          <div className="px-4 py-2 overflow-y-auto space-y-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {filteredFeed.length > 0 ? (
              filteredFeed.map((item: any) => (
                <AlphaCard key={`${item.source}-${item.id}`} item={item} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                <span style={{ fontSize: "24px" }}>⚡</span>
                <p style={{ fontSize: "12px", color: "#7B8BA8" }}>
                  {alphaFeed.length === 0
                    ? "No high-confidence BUY signals yet. Run analyses to generate alpha signals."
                    : "No signals match this filter."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const AlphaCard = memo(function AlphaCard({ item }: { item: any }) {
  const isSignal = item.source === "signal";
  const sourceColor = isSignal ? "#3B82F6" : "#8B5CF6";
  const sourceLabel = isSignal ? "SIGNAL" : "ANALYSIS";

  // Confidence color: higher = more green
  const confColor = item.confidence >= 90 ? "#22C55E" : item.confidence >= 80 ? "#F59E0B" : "#EC4899";

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "#161b2e",
        border: `1px solid ${confColor}18`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${sourceColor}20`, color: sourceColor }}
          >
            {sourceLabel}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
            BUY
          </span>
          <span className="text-[13px] font-bold">{item.pair || "—"}</span>
          {item.timeframe && (
            <span className="text-[9px]" style={{ color: "#4A5568" }}>{item.timeframe}</span>
          )}
        </div>
        <span className="text-[12px] font-bold font-mono" style={{ color: confColor }}>
          {item.confidence}%
        </span>
      </div>

      {item.pattern && (
        <div className="mb-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.12)", color: "#A78BFA" }}>
            {item.pattern}
          </span>
        </div>
      )}

      {/* Entry / SL / TP */}
      <div className="flex items-center gap-4 text-[10px] font-mono mb-1.5" style={{ color: "#7B8BA8" }}>
        {item.entry != null && <span>Entry: <span style={{ color: "#F0F4FC" }}>${item.entry}</span></span>}
        {item.stopLoss != null && <span>SL: <span style={{ color: "#EF4444" }}>${item.stopLoss}</span></span>}
        {item.takeProfit != null && (
          <span>TP: <span style={{ color: "#22C55E" }}>
            {Array.isArray(item.takeProfit) ? item.takeProfit.map((t: number) => `$${t}`).join(", ") : `$${item.takeProfit}`}
          </span></span>
        )}
      </div>

      {/* Reasons */}
      {item.reasons && item.reasons.length > 0 && (
        <div className="text-[10px]" style={{ color: "#4A5568", lineHeight: 1.5 }}>
          {item.reasons.slice(0, 2).join(" · ")}
        </div>
      )}
    </div>
  );
});