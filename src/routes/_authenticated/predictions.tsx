import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getPredictionsData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({ meta: [{ title: "Predictions — Vixor" }] }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const fetchData = useStableServerFn(getPredictionsData);

  const query = useQuery({
    queryKey: ["predictions-data"],
    queryFn: () => fetchData({}),
    staleTime: 30_000,
  });

  const d = query.data;
  const isLoading = query.isLoading;

  const stats = [
    { label: "Total Predictions", value: String(d?.totalPredictions ?? 0), color: "#3B82F6" },
    { label: "BUY Predictions", value: String(d?.buyPredictions ?? 0), color: "#22C55E" },
    { label: "SELL Predictions", value: String(d?.sellPredictions ?? 0), color: "#EF4444" },
    { label: "Avg Confidence", value: `${d?.avgConfidence ?? 0}%`, color: "#F59E0B" },
  ];

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Predictions</h1>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>PREDICTION ENGINE</span>
      </div>
      <p style={{ fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" }}>
        AI predictions and market calls from your analyses and daily signals. Track confidence levels and outcomes.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Accuracy Banner (if we have outcomes) */}
          {d && d.accuracy > 0 && (
            <div style={{ background: "#1a2035", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.15)", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" }}>Prediction Accuracy</div>
              <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${d.accuracy}%`, height: "100%", background: d.accuracy >= 50 ? "#22C55E" : "#EF4444", borderRadius: "3px", transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: "monospace", color: d.accuracy >= 50 ? "#22C55E" : "#EF4444" }}>{d.accuracy}%</div>
            </div>
          )}

          {/* Prediction Cards */}
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            All Predictions
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#4A5568", marginLeft: "8px" }}>
              ({d?.predictions?.length ?? 0})
            </span>
          </div>

          {(d?.predictions ?? []).length > 0 ? (
            <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              {/* Table Header */}
              <div className="flex items-center px-4 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "14%" }}>Pair</div>
                <div style={{ width: "10%" }}>Direction</div>
                <div style={{ width: "10%" }} className="text-right">Confidence</div>
                <div style={{ width: "10%" }}>Pattern</div>
                <div style={{ width: "10%" }}>Trend</div>
                <div style={{ width: "10%" }}>Timeframe</div>
                <div style={{ width: "8%" }}>Risk</div>
                <div style={{ width: "8%" }}>Source</div>
                <div style={{ flex: 1, paddingLeft: 16 }}>Reasons</div>
                <div style={{ width: "10%" }}>Outcome</div>
                <div style={{ width: "10%" }} className="text-right">Date</div>
              </div>
              <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                {d!.predictions.map((p: any) => (
                  <PredictionRow key={`${p.source}-${p.id}`} prediction={p} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>🎯</div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>No predictions yet</div>
              <div style={{ fontSize: "12px", color: "#7B8BA8" }}>
                Run AI analyses or check daily signals to generate predictions. Each analysis with a recommendation becomes a prediction.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const PredictionRow = memo(function PredictionRow({ prediction: p }: { prediction: any }) {
  const recColor = p.predictedDirection === "BUY" ? "#22C55E" : p.predictedDirection === "SELL" ? "#EF4444" : "#F59E0B";
  const riskColor = p.riskLevel === "low" ? "#22C55E" : p.riskLevel === "medium" ? "#F59E0B" : p.riskLevel ? "#EF4444" : "#4A5568";
  const sourceColor = p.source === "analysis" ? "#8B5CF6" : "#3B82F6";

  return (
    <div className="flex items-center px-4 py-3 text-[11px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: "14%", fontWeight: 700 }}>{p.pair}</div>
      <div style={{ width: "10%" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${recColor}15`, color: recColor }}>{p.predictedDirection}</span>
      </div>
      <div style={{ width: "10%", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#F59E0B" }}>{p.confidence}%</div>
      <div style={{ width: "10%", color: "#7B8BA8" }}>{p.pattern || "—"}</div>
      <div style={{ width: "10%", color: "#7B8BA8" }}>{p.trend || "—"}</div>
      <div style={{ width: "10%", color: "#7B8BA8" }}>{p.timeframe || "—"}</div>
      <div style={{ width: "8%" }}>
        {p.riskLevel ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${riskColor}15`, color: riskColor }}>{p.riskLevel}</span>
        ) : (
          <span style={{ color: "#4A5568" }}>—</span>
        )}
      </div>
      <div style={{ width: "8%" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${sourceColor}15`, color: sourceColor }}>{p.source === "analysis" ? "AI" : "SIGNAL"}</span>
      </div>
      <div style={{ flex: 1, paddingLeft: 16, color: "#7B8BA8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {p.reasons?.slice(0, 2).join(" · ") || "—"}
      </div>
      <div style={{ width: "10%" }}>
        {p.correct === true ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>CORRECT</span>
        ) : p.correct === false ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}>WRONG</span>
        ) : (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>PENDING</span>
        )}
      </div>
      <div style={{ width: "10%", textAlign: "right", color: "#4A5568", fontSize: "10px" }}>
        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
});