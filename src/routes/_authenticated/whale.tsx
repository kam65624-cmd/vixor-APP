import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getWhaleData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRowTwoLine,
  LabelValue,
  THEME,
} from "@/components/vixor/PageLayout";
import {
  formatCompact,
  formatTimeAgo,
  formatPrice,
  formatQuantity,
} from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/whale")({
  head: () => ({
    meta: [{ title: "Whale Alerts \u2014 Vixor" }],
  }),
  component: WhalePage,
});

function WhalePage() {
  const fetchWhaleData = useStableServerFn(getWhaleData);
  const query = useQuery({
    queryKey: ["whale-data"],
    queryFn: () => fetchWhaleData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const whaleTrades = query.data?.whaleTrades ?? [];
  const stats = query.data?.stats ?? {
    volume24h: 0,
    largeTradeCount: 0,
    biggestTrade: 0,
    biggestPair: "\u2014",
  };

  return (
    <PageLayout
      title="Whale Alerts"
      badge="WHALE TRACKER"
      badgeColor={THEME.purple}
      description="Largest trades sorted by value \u2014 spot whale-like activity"
      loading={isLoading}
      loadingColor={THEME.purple}
    >
      <StatsRow
        stats={[
          {
            label: "24h Volume",
            value: formatCompact(stats.volume24h),
            color: THEME.accent,
          },
          {
            label: "Large Trades",
            value: String(stats.largeTradeCount),
            color: THEME.amber,
          },
          {
            label: "Biggest Trade",
            value: formatCompact(stats.biggestTrade),
            color: THEME.green,
            sub: stats.biggestPair,
          },
        ]}
      />
      <ScrollArea>
        {whaleTrades.length > 0 ? (
          whaleTrades.map((trade: any, index: number) => (
            <WhaleCard key={trade.id} trade={trade} index={index} />
          ))
        ) : (
          <EmptyState
            icon="🐋"
            title="No whale activity"
            message="No trades yet. Start trading to see whale activity."
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const WhaleCard = memo(function WhaleCard({
  trade,
  index,
}: {
  trade: any;
  index: number;
}) {
  const isLong = trade.direction === "long";
  const dirColor = isLong ? THEME.green : THEME.red;
  const value =
    trade.tradeValue || (trade.quantity || 1) * (trade.entry_price || 0);

  return (
    <DataRowTwoLine
      leftAccent={dirColor}
      topContent={
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              minWidth: 0,
              flex: 1,
            }}
          >
            <Badge label={isLong ? "LONG" : "SHORT"} color={dirColor} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: THEME.text,
              }}
            >
              {trade.pair || "\u2014"}
            </span>
            {index === 0 && <Badge label="BIGGEST" color={THEME.amber} small />}
          </div>
          <span
            style={{
              fontSize: "9px",
              color: THEME.textMuted,
              flexShrink: 0,
              marginLeft: "8px",
            }}
          >
            {formatTimeAgo(trade.created_at)}
          </span>
        </>
      }
      bottomContent={
        <>
          <LabelValue
            label="Size"
            value={formatQuantity(trade.quantity || 0)}
            mono
          />
          <LabelValue
            label="Price"
            value={formatPrice(trade.entry_price || 0)}
            mono
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: dirColor,
            }}
          >
            {formatCompact(value)}
          </span>
        </>
      }
    />
  );
});