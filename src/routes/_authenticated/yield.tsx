import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getYieldData } from "@/shared/data";
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

export const Route = createFileRoute("/_authenticated/yield")({
  component: YieldPage,
});

const YieldCard = memo(function YieldCard({
  position,
}: {
  position: {
    id: string;
    pair: string;
    direction: "long" | "short";
    yield: number;
    yieldPct: number;
    duration: number;
    entryPrice: number;
    exitPrice: number;
    rMultiple: number;
    quantity: number;
    exitDate: string;
  };
}) {
  const isLong = position.direction === "long";
  const yieldVal = position.yield;

  return (
    <DataRow>
      {/* Top row: pair + direction badge + yield value */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: THEME.text,
            }}
          >
            {position.pair}
          </span>
          <Badge
            label={position.direction.toUpperCase()}
            color={isLong ? THEME.green : THEME.red}
          />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: THEME.green,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {formatPnL(yieldVal)}
        </span>
      </div>

      {/* Middle row: LabelValues */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 6,
        }}
      >
        <LabelValue
          label="Yield"
          value={formatPercentRaw(position.yieldPct)}
          valueColor={position.yieldPct >= 0 ? THEME.green : THEME.red}
        />
        <LabelValue
          label="Dur"
          value={`${position.duration}d`}
        />
        <LabelValue
          label="Entry"
          value={formatPrice(position.entryPrice)}
        />
        <LabelValue
          label="Exit"
          value={formatPrice(position.exitPrice)}
        />
        <LabelValue
          label="R"
          value={formatRMultiple(position.rMultiple)}
          valueColor={position.rMultiple >= 0 ? THEME.green : THEME.red}
        />
        <LabelValue
          label="Qty"
          value={formatQuantity(position.quantity)}
        />
      </div>

      {/* Bottom: date */}
      <div
        style={{
          fontSize: 11,
          color: THEME.textMuted,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {formatDateFull(position.exitDate)}
      </div>
    </DataRow>
  );
});

function YieldPage() {
  const getFn = useStableServerFn(getYieldData);

  const { data, isLoading } = useQuery({
    queryKey: ["yieldData"],
    queryFn: getFn,
    staleTime: 30_000,
  });

  const positions = data?.positions ?? [];
  const totalYield = data?.totalYield ?? 0;
  const avgYield = data?.avgYield ?? 0;
  const bestTrade = data?.bestTrade ?? null;
  const yieldCount = data?.yieldCount ?? 0;
  const totalClosed = data?.totalClosed ?? 0;

  const stats = [
    {
      label: "Total Yield",
      value: formatCurrency(totalYield),
      valueColor: totalYield >= 0 ? THEME.green : THEME.red,
    },
    {
      label: "Avg Yield/Trade",
      value: formatCurrency(avgYield),
      valueColor: avgYield >= 0 ? THEME.green : THEME.red,
    },
    {
      label: "Best Yield",
      value: bestTrade ? formatCurrency(bestTrade.yield) : "$0.00",
      valueColor: THEME.green,
      sub: bestTrade?.pair ?? undefined,
    },
    {
      label: "Yield Trades",
      value: `${yieldCount}/${totalClosed}`,
      valueColor: THEME.blue,
    },
  ];

  return (
    <PageLayout
      title="Yield"
      badge="YIELD"
      badgeColor={THEME.green}
      description="Closed trade yield performance and returns"
      loading={isLoading}
    >
      <StatsRow stats={stats} />

      <SectionTitle label="Yield Positions" count={positions.length} />

      <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
        {positions.length === 0 ? (
          <EmptyState message="No yield positions yet" />
        ) : (
          positions.map((p) => <YieldCard key={p.id} position={p} />)
        )}
      </ScrollArea>
    </PageLayout>
  );
}