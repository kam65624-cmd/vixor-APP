import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getAlphaData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  LabelValue,
  ProgressBar, 
} from "@/components/vixor/PageLayout";
import {
  formatCompact,
  formatPercentRaw,
  formatPrice,
  formatTimeAgo,
} from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/alpha")({
  head: () => ({
    meta: [{ title: "Alpha Feed \u2014 Vixor" }],
  }),
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
    highestConfidencePair: "\u2014",
    signalCount: 0,
    analysisCount: 0,
  };

  const filteredFeed = alphaFeed.filter((item: any) => {
    if (activeTab === "Signals") return item.source === "signal";
    if (activeTab === "Analyses") return item.source === "analysis";
    return true;
  });

  return (
    <PageLayout
      title="Alpha Feed"
      badge="ALPHA INTEL"
      badgeColor={"var(--color-bearish)"}
      description="AI-generated signals & pattern analyses across all traded pairs"
      tabs={[...TABS]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabCounts={{
        All: alphaFeed.length,
        Signals: stats.signalCount,
        Analyses: stats.analysisCount,
      }}
      loading={isLoading}
      loadingColor={"var(--color-bearish)"}
    >
      <StatsRow
        stats={[
          {
            label: "Active Signals",
            value: String(stats.activeBuySignals),
            color: "var(--color-bullish)",
          },
          {
            label: "Avg Confidence",
            value: formatPercentRaw(stats.avgConfidence),
            color: "var(--color-primary)",
          },
          {
            label: "Top Confidence",
            value: formatPercentRaw(stats.highestConfidence),
            color: "var(--color-bearish)",
            sub: stats.highestConfidencePair ?? undefined,
          },
        ]}
      />
      <ScrollArea>
        {filteredFeed.length > 0 ? (
          filteredFeed.map((item: any) => (
            <AlphaCard key={item.id} item={item} />
          ))
        ) : (
          <EmptyState
            icon="🧠"
            title={
              alphaFeed.length === 0
                ? "No alpha data yet"
                : activeTab === "Signals"
                  ? "No signals found"
                  : "No analyses found"
            }
            message={
              alphaFeed.length === 0
                ? "Alpha signals and analyses will appear as patterns are detected."
                : "No items match this filter. Try a different tab."
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

function formatTP(tp: number | number[] | undefined): string {
  if (tp === undefined || tp === null) return "\u2014";
  if (Array.isArray(tp)) {
    return tp.length > 0 ? tp.map((v) => formatPrice(v)).join(" / ") : "\u2014";
  }
  return formatPrice(tp);
}

const AlphaCard = memo(function AlphaCard({ item }: { item: any }) {
  const isSignal = item.source === "signal";
  const badgeColor = isSignal ? "var(--color-primary)" : "var(--color-info)";
  const confidencePct = item.confidence || 0;
  const confidenceColor =
    confidencePct >= 80
      ? "var(--color-bullish)"
      : confidencePct >= 60
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";

  return (
    <DataRow leftAccent={badgeColor}>
      {/* Top row: type badge, pair, timeframe, confidence */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <Badge
            label={isSignal ? "SIGNAL" : "ANALYSIS"}
            color={badgeColor}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--color-foreground)",
            }}
          >
            {item.pair || "\u2014"}
          </span>
          {item.timeframe && (
            <Badge label={item.timeframe} color={"var(--color-muted-foreground)"} small />
          )}
          {item.pattern && (
            <Badge label={item.pattern} color={"var(--color-neutral-wait)"} small />
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: confidenceColor,
            }}
          >
            {formatPercentRaw(confidencePct)}
          </span>
        </div>
      </div>

      {/* Confidence progress bar */}
      <ProgressBar
        value={confidencePct}
        color={confidenceColor}
      />

      {/* Bottom row: entry, SL, TP */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {item.entry !== undefined && item.entry !== null && (
          <LabelValue
            label="Entry"
            value={formatPrice(item.entry)}
            mono
          />
        )}
        {item.stopLoss !== undefined && item.stopLoss !== null && (
          <LabelValue
            label="SL"
            value={formatPrice(item.stopLoss)}
            mono
            valueColor={"var(--color-bearish)"}
          />
        )}
        {item.takeProfit !== undefined && item.takeProfit !== null && (
          <LabelValue
            label="TP"
            value={formatTP(item.takeProfit)}
            mono
            valueColor={"var(--color-bullish)"}
          />
        )}
        {item.created_at && (
          <span
            style={{
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {formatTimeAgo(item.created_at)}
          </span>
        )}
      </div>

      {/* Reasons (if present) */}
      {item.reasons && item.reasons.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginTop: "8px",
          }}
        >
          {item.reasons.map(
            (reason: string, i: number) =>
              reason && (
                <Badge
                  key={i}
                  label={reason}
                  color={"var(--color-muted-foreground)"}
                  small
                />
              )
          )}
        </div>
      )}
    </DataRow>
  );
});