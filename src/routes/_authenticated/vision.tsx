import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getRecentAnalyses } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  THEME,
  StatsRow,
  DataRow,
  Badge,
  ScrollArea,
  EmptyState,
} from "@/components/vixor/PageLayout";

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
  const avgConfidence =
    completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + (a.confidence || 0), 0) / completed.length)
      : 0;

  return (
    <PageLayout
      title="AI Vision"
      badge="AI ANALYSIS"
      badgeColor={THEME.purple}
      description="Overview of your AI-powered analyses, patterns detected, and market insights"
      loading={isLoading}
      loadingColor={THEME.purple}
    >
      <StatsRow
        stats={[
          { label: "Total Analyses", value: String(analyses.length), color: THEME.green },
          { label: "BUY Signals", value: String(buySignals.length), color: THEME.green },
          { label: "SELL Signals", value: String(sellSignals.length), color: THEME.red },
          { label: "Avg Confidence", value: `${avgConfidence}%`, color: THEME.amber },
        ]}
      />

      {/* Table header — matches AnalysisRow column widths exactly */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          height: "32px",
          background: THEME.tabBarBg,
          borderBottom: `1px solid ${THEME.border}`,
          flexShrink: 0,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {[
          { label: "Pair", w: "15%" },
          { label: "Status", w: "12%" },
          { label: "Signal", w: "12%" },
          { label: "Confidence", w: "10%", align: "right" as const },
          { label: "Pattern", w: "12%" },
          { label: "Trend", w: "12%" },
          { label: "Reasons", w: "15%", pl: 16 },
          { label: "Date", w: "12%", align: "right" as const },
        ].map((col) => (
          <div
            key={col.label}
            style={{
              width: col.w,
              minWidth: col.w,
              fontSize: "9px",
              fontWeight: 700,
              color: THEME.textMuted,
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
              textAlign: col.align || "left",
              paddingLeft: col.pl,
              flexShrink: 0,
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      <ScrollArea>
        {completed.length > 0 ? (
          completed.slice(0, 20).map((a) => <AnalysisRow key={a.id} analysis={a} />)
        ) : (
          <EmptyState
            icon="🔍"
            title={analyses.length === 0 ? "No analyses yet" : "Analyses in progress"}
            message={
              analyses.length === 0
                ? "Go to Analyze to run your first AI analysis."
                : `${analyses.filter((a) => a.status === "processing" || a.status === "queued").length} analyses currently processing...`
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const AnalysisRow = memo(function AnalysisRow({ analysis }: { analysis: any }) {
  const recColor =
    analysis.recommendation === "BUY"
      ? THEME.green
      : analysis.recommendation === "SELL"
        ? THEME.red
        : THEME.amber;

  return (
    <DataRow>
      <div style={{ display: "flex", alignItems: "center", fontSize: "11px" }}>
        <div
          style={{
            width: "15%",
            fontWeight: 700,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {analysis.pair || "—"}
        </div>
        <div style={{ width: "12%" }}>
          <Badge label={analysis.status} color={THEME.green} small />
        </div>
        <div style={{ width: "12%" }}>
          <Badge label={analysis.recommendation || "—"} color={recColor} small />
        </div>
        <div
          style={{
            width: "10%",
            textAlign: "right",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontWeight: 700,
            color: THEME.amber,
          }}
        >
          {analysis.confidence ?? 0}%
        </div>
        <div style={{ width: "12%", color: THEME.textSecondary }}>{analysis.pattern || "—"}</div>
        <div style={{ width: "12%", color: THEME.textSecondary }}>{analysis.trend || "—"}</div>
        <div
          style={{
            flex: 1,
            paddingLeft: 16,
            color: THEME.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {analysis.reasons?.slice(0, 2).join(" · ") || "—"}
        </div>
        <div
          style={{
            width: "12%",
            textAlign: "right",
            color: THEME.textMuted,
            fontSize: "10px",
          }}
        >
          {new Date(analysis.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </DataRow>
  );
});
