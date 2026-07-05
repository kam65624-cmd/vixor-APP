import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getPredictionsData } from "@/shared/data";
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  LabelValue,
  SectionTitle,
  ProgressBar, 
} from "@/components/vixor/PageLayout";
import {
  formatNumber,
  formatPercentRaw,
  formatRelative,
} from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/predictions")({
  component: PredictionsPage,
});

const riskConfig: Record<string, { color: string }> = {
  low: { color: "var(--color-bullish)" },
  medium: { color: "var(--color-neutral-wait)" },
  high: { color: "var(--color-bearish)" },
};

const PredictionCard = memo(function PredictionCard({
  prediction,
}: {
  prediction: {
    id: string;
    pair: string;
    predictedDirection: "BUY" | "SELL";
    confidence: number;
    pattern: string;
    trend: string;
    timeframe: string;
    riskLevel: "low" | "medium" | "high";
    source: "analysis" | "signal";
    reasons: string[];
    correct: boolean | null;
    createdAt: string;
  };
}) {
  const isBuy = prediction.predictedDirection === "BUY";

  let statusLabel: string;
  let statusColor: string;
  if (prediction.correct === true) {
    statusLabel = "CORRECT";
    statusColor = "var(--color-bullish)";
  } else if (prediction.correct === false) {
    statusLabel = "WRONG";
    statusColor = "var(--color-bearish)";
  } else {
    statusLabel = "PENDING";
    statusColor = "var(--color-neutral-wait)";
  }

  return (
    <DataRow>
      {/* Main row using flex — NOT table columns */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Left group: pair + badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-foreground)",
            }}
          >
            {prediction.pair}
          </span>
          <Badge
            label={prediction.predictedDirection}
            color={isBuy ? "var(--color-bullish)" : "var(--color-bearish)"}
          />
          <Badge
            label={formatPercentRaw(prediction.confidence)}
            color={"var(--color-primary)"}
          />
          {prediction.pattern && (
            <Badge label={prediction.pattern} color={"var(--color-info)"} />
          )}
          {prediction.riskLevel && (
            <Badge
              label={prediction.riskLevel.toUpperCase()}
              color={riskConfig[prediction.riskLevel]?.color ?? "var(--color-muted-foreground)"}
            />
          )}
          <Badge
            label={prediction.source === "analysis" ? "AI" : "SIGNAL"}
            color={prediction.source === "analysis" ? "var(--color-info)" : "var(--color-neutral-wait)"}
          />
        </div>

        {/* Right group: status badge + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Badge label={statusLabel} color={statusColor} />
          <span
            style={{
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              whiteSpace: "nowrap",
            }}
          >
            {formatRelative(prediction.createdAt)}
          </span>
        </div>
      </div>

      {/* Optional reasons truncated */}
      {prediction.reasons && prediction.reasons.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: "var(--color-muted-foreground)",
            marginTop: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {prediction.reasons.join(" • ")}
        </div>
      )}
    </DataRow>
  );
});

function PredictionsPage() {
  const getFn = useStableServerFn(getPredictionsData);

  const { data, isLoading } = useQuery({
    queryKey: ["predictionsData"],
    queryFn: getFn,
    staleTime: 30_000,
  });

  const predictions = data?.predictions ?? [];
  const totalPredictions = data?.totalPredictions ?? 0;
  const buyPredictions = data?.buyPredictions ?? 0;
  const sellPredictions = data?.sellPredictions ?? 0;
  const avgConfidence = data?.avgConfidence ?? 0;
  const accuracy = data?.accuracy ?? 0;

  const stats = [
    {
      label: "Total Predictions",
      value: formatNumber(totalPredictions),
      color: "var(--color-foreground)",
    },
    {
      label: "BUY Predictions",
      value: formatNumber(buyPredictions),
      color: "var(--color-bullish)",
    },
    {
      label: "SELL Predictions",
      value: formatNumber(sellPredictions),
      color: "var(--color-bearish)",
    },
    {
      label: "Avg Confidence",
      value: formatPercentRaw(avgConfidence),
      color: "var(--color-primary)",
    },
  ];

  return (
    <PageLayout
      title="Predictions"
      badge="AI"
      badgeColor={"var(--color-info)"}
      loading={isLoading}
    >
      <StatsRow stats={stats} />

      <ProgressBar
        value={accuracy}
        label="Accuracy"
        labelRight={formatPercentRaw(accuracy)}
      />

      <SectionTitle title="All Predictions" count={predictions.length} />

      <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
        {predictions.length === 0 ? (
          <EmptyState icon="🔮" title="No Predictions" message="AI predictions will appear as market patterns are detected." />
        ) : (
          predictions.map((p: any) => <PredictionCard key={p.id} prediction={p} />)
        )}
      </ScrollArea>
    </PageLayout>
  );
}