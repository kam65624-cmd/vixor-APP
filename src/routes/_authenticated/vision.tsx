import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getRecentAnalyses } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/vision")({
  head: () => ({ meta: [{ title: "Vision — Vixor" }] }),
  component: VisionPage,
});

function VisionPage() {
  const fetchAnalyses = useStableServerFn(getRecentAnalyses);

  const query = useQuery({
    queryKey: ["recent-analyses"],
    queryFn: () => fetchAnalyses({}),
    staleTime: 60_000,
  });

  const analyses = query.data?.analyses ?? [];
  const isLoading = query.isLoading;

  const completed = analyses.filter((a) => a.status === "complete");
  const buySignals = completed.filter((a) => a.recommendation === "BUY");
  const sellSignals = completed.filter((a) => a.recommendation === "SELL");
  const avgConfidence = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + (a.confidence || 0), 0) / completed.length)
    : 0;

  const overviewCards = [
    { label: "Total Analyses", value: String(analyses.length), color: "#10B981" },
    { label: "BUY Signals", value: String(buySignals.length), color: "#22C55E" },
    { label: "SELL Signals", value: String(sellSignals.length), color: "#EF4444" },
    { label: "Avg Confidence", value: `${avgConfidence}%`, color: "#F59E0B" },
  ];

  return (
    <div style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>AI Vision</h1>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>AI Analysis</span>
      </div>
      <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px", marginBottom: "20px" }}>
        Overview of your AI-powered analyses, patterns detected, and market insights
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {overviewCards.map((c) => (
              <div key={c.label} style={{ background: "#1E1E1E", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{c.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Recent Analyses */}
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Analyses</div>
          <div style={{ background: "#1E1E1E", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div className="flex items-center px-4 py-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6B7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: "15%" }}>Pair</div>
              <div style={{ width: "12%" }}>Status</div>
              <div style={{ width: "12%" }}>Signal</div>
              <div style={{ width: "10%" }} className="text-right">Confidence</div>
              <div style={{ width: "12%" }}>Pattern</div>
              <div style={{ width: "12%" }}>Trend</div>
              <div style={{ flex: 1, paddingLeft: 16 }}>Reasons</div>
              <div style={{ width: "12%" }} className="text-right">Date</div>
            </div>
            {completed.length > 0 ? completed.slice(0, 20).map((a) => (
              <AnalysisRow key={a.id} analysis={a} />
            )) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                {analyses.length === 0
                  ? "No analyses yet. Go to Analyze to run your first AI analysis."
                  : `${analyses.filter((a) => a.status === "processing" || a.status === "queued").length} analyses in progress...`}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const AnalysisRow = memo(function AnalysisRow({ analysis }: { analysis: any }) {
  const recColor = analysis.recommendation === "BUY" ? "#22C55E" : analysis.recommendation === "SELL" ? "#EF4444" : "#F59E0B";
  const riskColor = analysis.risk_level === "low" ? "#22C55E" : analysis.risk_level === "medium" ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex items-center px-4 py-3 text-[11px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: "15%", fontWeight: 700 }}>{analysis.pair || "—"}</div>
      <div style={{ width: "12%" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>{analysis.status}</span>
      </div>
      <div style={{ width: "12%" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${recColor}15`, color: recColor }}>{analysis.recommendation || "—"}</span>
      </div>
      <div style={{ width: "10%", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#F59E0B" }}>{analysis.confidence ?? 0}%</div>
      <div style={{ width: "12%", color: "#9CA3AF" }}>{analysis.pattern || "—"}</div>
      <div style={{ width: "12%", color: "#9CA3AF" }}>{analysis.trend || "—"}</div>
      <div style={{ flex: 1, paddingLeft: 16, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {analysis.reasons?.slice(0, 2).join(" · ") || "—"}
      </div>
      <div style={{ width: "12%", textAlign: "right", color: "#6B7280", fontSize: "10px" }}>
        {new Date(analysis.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
});