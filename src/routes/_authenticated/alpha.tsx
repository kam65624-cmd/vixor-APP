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
    meta: [{ title: "Trending Board — HUNT" }],
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
      title="Trending Board"
      badge="WHAT'S HOT"
      badgeColor={"var(--color-bearish)"}
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
          filteredFeed.map((item: any) => <AlphaCard key={item.id} item={item} />)
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
    <div
      className="animate-slide-up"
      style={{
        margin: "0 16px 10px",
        padding: "16px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${badgeColor}22`,
        borderLeft: `3px solid ${badgeColor}`,
        borderRadius: "14px",
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "12px",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            flex: 1,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "3px 10px",
              borderRadius: "8px",
              background: `${badgeColor}18`,
              border: `1px solid ${badgeColor}40`,
              fontSize: "11px",
              fontWeight: 800,
              color: badgeColor,
              letterSpacing: "0.06em",
            }}
          >
            {isSignal ? "SIGNAL" : "ANALYSIS"}
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {item.pair || "\u2014"}
          </span>
          {item.timeframe && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.05)",
                color: "var(--color-muted-foreground)",
              }}
            >
              {item.timeframe}
            </span>
          )}
          {item.pattern && (
            <div style={{ width: "100%", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "rgba(245,166,35,0.1)",
                  color: "var(--color-neutral-wait)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  display: "inline-block",
                  lineHeight: 1.4,
                }}
              >
                {item.pattern}
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2px",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: confidenceColor,
              textShadow: `0 0 12px ${confidenceColor}40`,
              lineHeight: 1,
            }}
          >
            {formatPercentRaw(confidencePct)}
          </span>
          <span
            style={{
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              letterSpacing: "0.04em",
            }}
          >
            CONFIDENCE
          </span>
        </div>
      </div>

      {/* Confidence progress bar */}
      <div style={{ marginBottom: "16px" }}>
        <ProgressBar value={confidencePct} color={confidenceColor} />
      </div>

      {/* Price grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {item.entry !== undefined && item.entry !== null && (
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.03)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-muted-foreground)",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              ENTRY
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatPrice(item.entry)}
            </div>
          </div>
        )}
        {item.stopLoss !== undefined && item.stopLoss !== null && (
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(251,70,103,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-bearish)",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              STOP LOSS
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bearish)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatPrice(item.stopLoss)}
            </div>
          </div>
        )}
        {item.takeProfit !== undefined && item.takeProfit !== null && (
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(34,211,166,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-bullish)",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              TAKE PROFIT
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bullish)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {formatTP(item.takeProfit)}
            </div>
          </div>
        )}
      </div>

      {/* Footer row: Reasons & Time */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: "4px",
        }}
      >
        {/* Reasons (if present) */}
        {item.reasons && item.reasons.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              flex: 1,
            }}
          >
            {item.reasons.map(
              (reason: string, i: number) =>
                reason && (
                  <span
                    key={i}
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    {reason}
                  </span>
                ),
            )}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {item.created_at && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-muted-foreground)",
              marginLeft: "12px",
              flexShrink: 0,
            }}
          >
            {formatTimeAgo(item.created_at)}
          </span>
        )}
      </div>
    </div>
  );
});
