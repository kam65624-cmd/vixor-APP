import { createFileRoute } from "@tanstack/react-router";
import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/perpetuals")({
  head: () => ({ meta: [{ title: "Perpetuals \u2014 Vixor" }] }),
  component: PerpetualsPage,
});
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  DataRowTwoLine,
  LabelValue,
  THEME,
} from "@/components/vixor/PageLayout";
import {
  formatCurrency,
  formatPnL,
  formatRMultiple,
  formatPercent,
  formatPrice,
  formatQuantity,
} from "@/shared/utils/formatters";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getPerpetualsData } from "@/shared/data";

const TABS = ["Open Positions", "Recent Closed"] as const;
type Tab = (typeof TABS)[number];

const OpenPositionCard = memo(function OpenPositionCard({
  position,
}: {
  position: any;
}) {
  const isLong = position.direction === "LONG";
  const dirColor = isLong ? THEME.green : THEME.red;
  const pnl = position.pnl || 0;
  const pnlColor = pnl >= 0 ? THEME.green : THEME.red;

  return (
    <DataRowTwoLine>
      {/* Top line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Badge label={position.direction} color={dirColor} small />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: THEME.text,
            }}
          >
            {position.pair}
          </span>
          <Badge label="OPEN" color={THEME.blue} small />
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color: pnlColor,
          }}
        >
          {pnl >= 0 ? "+" : ""}
          {pnl.toFixed(2)}
        </span>
      </div>

      {/* Bottom line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          width: "100%",
          marginTop: "4px",
        }}
      >
        <LabelValue
          label="Entry"
          value={formatPrice(position.entryPrice)}
        />
        <LabelValue
          label="Qty"
          value={formatQuantity(position.quantity)}
        />
        <LabelValue
          label="R"
          value={formatRMultiple(position.rMultiple || 0)}
        />
        {position.stopLoss != null && (
          <LabelValue
            label="SL"
            value={formatPrice(position.stopLoss)}
          />
        )}
        {position.takeProfit != null && (
          <LabelValue
            label="TP"
            value={formatPrice(position.takeProfit)}
          />
        )}
      </div>
    </DataRowTwoLine>
  );
});

const ClosedTradeCard = memo(function ClosedTradeCard({
  trade,
}: {
  trade: any;
}) {
  const isLong = trade.direction === "LONG";
  const dirColor = isLong ? THEME.green : THEME.red;
  const pnl = trade.pnl || 0;
  const pnlColor = pnl >= 0 ? THEME.green : THEME.red;
  const rMult = trade.rMultiple || 0;

  const statusColors: Record<string, string> = {
    closed: THEME.green,
    win: THEME.green,
    loss: THEME.red,
    breakeven: THEME.amber,
  };
  const statusColor = statusColors[trade.status] || THEME.textMuted;

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "4px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: THEME.text,
            }}
          >
            {trade.pair}
          </span>
          <Badge label={trade.direction} color={dirColor} small />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color: THEME.textSecondary,
          }}
        >
          <span>
            {formatPrice(trade.entryPrice)} → {formatPrice(trade.exitPrice)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: pnlColor,
            }}
          >
            {pnl >= 0 ? "+" : ""}
            {pnl.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: rMult >= 0 ? THEME.green : THEME.red,
            }}
          >
            {formatRMultiple(rMult)}
          </span>
          <Badge
            label={(trade.status || "closed").toUpperCase()}
            color={statusColor}
            small
          />
        </div>
      </div>
    </DataRow>
  );
});

function PerpetualsPage() {
  const [tab, setTab] = useState<Tab>("Open Positions");
  const getStableData = useStableServerFn(getPerpetualsData);

  const { data, isLoading } = useQuery({
    queryKey: ["perpetuals"],
    queryFn: () => getStableData(),
    staleTime: 30_000,
  });

  const openPositions = data?.openPositions ?? [];
  const closedPerformance = data?.closedPerformance ?? [];
  const stats = data?.stats;

  const isOpen = tab === "Open Positions";
  const items = isOpen ? openPositions : closedPerformance;

  const totalUnrealized = stats?.totalUnrealizedPnl || 0;
  const totalRealized = stats?.totalRealizedPnl || 0;

  return (
    <PageLayout
      title="Perpetuals"
      badge="FUTURES"
      badgeColor={THEME.purple}
      description="Open positions and closed trade performance"
      tabs={TABS as unknown as string[]}
      activeTab={tab}
      onTabChange={(t: string) => setTab(t as Tab)}
      loading={isLoading}
    >
      <StatsRow
        stats={[
          {
            label: "Open",
            value: stats?.openCount ?? 0,
            mono: true,
          },
          {
            label: "Unrealized PnL",
            value: `${totalUnrealized >= 0 ? "+" : ""}${totalUnrealized.toFixed(2)}`,
            mono: true,
            color: totalUnrealized >= 0 ? THEME.green : THEME.red,
          },
          {
            label: "Realized PnL",
            value: `${totalRealized >= 0 ? "+" : ""}${totalRealized.toFixed(2)}`,
            mono: true,
            color: totalRealized >= 0 ? THEME.green : THEME.red,
          },
          {
            label: "Win Rate",
            value: stats?.winRate != null ? `${stats.winRate}%` : "—",
            mono: true,
          },
        ]}
      />

      <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
        {items.length === 0 ? (
          <EmptyState
            message={
              isOpen
                ? "No open positions"
                : "No closed trades"
            }
          />
        ) : isOpen ? (
          items.map((pos: any) => (
            <OpenPositionCard key={pos.id} position={pos} />
          ))
        ) : (
          items.map((trade: any) => (
            <ClosedTradeCard key={trade.id} trade={trade} />
          ))
        )}
      </ScrollArea>
    </PageLayout>
  );
}