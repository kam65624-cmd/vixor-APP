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
  DataRowTwoLine,
  LabelValue,
  SectionTitle,
  ProgressBar,
  THEME,
} from "@/components/vixor/PageLayout";
import {
  formatCurrency,
  formatPnL,
  formatCompact,
  formatPercent,
  formatPercentRaw,
  formatNumber,
  formatQuantity,
  formatRMultiple,
  formatTimeAgo,
  formatDateShort,
  formatDateFull,
  formatRelative,
  formatPrice,
  safeDiv,
  calcPnlPercent,
} from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/predictions")({
  component: PredictionsPage,
});

const riskConfig: Record<string, { color: string }> = {
  low: { color: THEME.green },
  medium: { color: THEME.amber },
  high: { color: THEME.red },
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
    statusColor = THEME.green;
  } else if (prediction.correct === false) {
    statusLabel = "WRONG";
    statusColor = THEME.red;
  } else {
    statusLabel = "PENDING";
    statusColor = THEME.amber;
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
              color: THEME.text,
            }}
          >
            {prediction.pair}
          </span>
          <Badge
            label={prediction.predictedDirection}
            color={isBuy ? THEME.green : THEME.red}
          />
          <Badge
            label={formatPercentRaw(prediction.confidence)}
            color={THEME.blue}
          />
          {prediction.pattern && (
            <Badge label={prediction.pattern} color={THEME.purple} />
          )}
          {prediction.riskLevel && (
            <Badge
              label={prediction.riskLevel.toUpperCase()}
              color={riskConfig[prediction.riskLevel]?.color ?? THEME.textSecondary}
            />
          )}
          <Badge
            label={prediction.source === "analysis" ? "AI" : "SIGNAL"}
            color={prediction.source === "analysis" ? THEME.purple : THEME.amber}
          />
        </div>

        {/* Right group: status badge + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Badge label={statusLabel} color={statusColor} />
          <span
            style={{
              fontSize: 11,
              color: THEME.textMuted,
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
            color: THEME.textMuted,
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
      valueColor: THEME.text,
    },
    {
      label: "BUY Predictions",
      value: formatNumber(buyPredictions),
      valueColor: THEME.green,
    },
    {
      label: "SELL Predictions",
      value: formatNumber(sellPredictions),
      valueColor: THEME.red,
    },
    {
      label: "Avg Confidence",
      value: formatPercentRaw(avgConfidence),
      valueColor: THEME.blue,
    },
  ];

  return (
    <PageLayout
      title="Predictions"
      badge="AI"
      badgeColor={THEME.purple}
      description="AI-powered market predictions and signal analysis"
      loading={isLoading}
    >
      <StatsRow stats={stats} />

      <ProgressBar
        value={accuracy}
        label="Accuracy"
        labelRight={formatPercentRaw(accuracy)}
      />

      <SectionTitle label="All Predictions" count={predictions.length} />

      <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
        {predictions.length === 0 ? (
          <EmptyState message="No predictions yet" />
        ) : (
          predictions.map((p) => <PredictionCard key={p.id} prediction={p} />)
        )}
      </ScrollArea>
    </PageLayout>
  );
}