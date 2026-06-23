import { createFileRoute } from "@tanstack/react-router";
import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/pulse")({
  head: () => ({ meta: [{ title: "Pulse \u2014 Vixor" }] }),
  component: PulsePage,
});
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  THEME,
} from "@/components/vixor/PageLayout";
import {
  formatTimeAgo,
  formatPrice,
  formatQuantity,
} from "@/shared/utils/formatters";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getPulseData } from "@/shared/data";

const TABS = ["All", "Trades", "Signals"] as const;
type Tab = (typeof TABS)[number];

const PulseRow = memo(function PulseRow({ item }: { item: any }) {
  const isTrade = item.type === "trade";
  const typeColor = isTrade ? THEME.blue : THEME.purple;
  const actionColor =
    item.action === "BOUGHT" || item.action === "BUY"
      ? THEME.green
      : item.action === "SOLD" || item.action === "SELL"
        ? THEME.red
        : THEME.amber;

  return (
    <DataRow style={{ padding: "8px 16px", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Type dot */}
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: typeColor,
            flexShrink: 0,
          }}
        />
        {/* Badge */}
        <Badge label={isTrade ? "TRADE" : "SIGNAL"} color={typeColor} small />
        {/* Action + Pair */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: actionColor,
            flexShrink: 0,
          }}
        >
          {item.action}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: THEME.text,
            flexShrink: 0,
          }}
        >
          {item.pair}
        </span>
        {/* Details */}
        <span
          style={{
            fontSize: "10px",
            color: THEME.textSecondary,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: 1,
          }}
        >
          {isTrade ? (
            <>
              {item.price != null && formatPrice(item.price)}
              {item.quantity != null && item.price != null && " · "}
              {item.quantity != null && `${formatQuantity(item.quantity)} qty`}
              {item.pnl != null && (
                <span
                  style={{
                    color:
                      item.pnl >= 0 ? THEME.green : THEME.red,
                    marginLeft: 8,
                    fontWeight: 700,
                  }}
                >
                  {item.pnl >= 0 ? "+" : ""}
                  {item.pnl.toFixed(2)}
                </span>
              )}
            </>
          ) : (
            <>
              {item.confidence != null && (
                <span style={{ color: THEME.amber }}>
                  {item.confidence}%
                </span>
              )}
              {item.pattern && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "9px",
                    color: THEME.textMuted,
                  }}
                >
                  {item.pattern}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <span
        style={{
          fontSize: "9px",
          color: THEME.textMuted,
          flexShrink: 0,
          marginLeft: "8px",
        }}
      >
        {formatTimeAgo(item.createdAt)}
      </span>
    </DataRow>
  );
});

function PulsePage() {
  const [tab, setTab] = useState<Tab>("All");
  const getStableData = useStableServerFn(getPulseData);

  const { data, isLoading } = useQuery({
    queryKey: ["pulse"],
    queryFn: () => getStableData(),
    staleTime: 30_000,
  });

  const feed = data?.feed ?? [];
  const stats = data?.stats;

  const filtered = useMemo(() => {
    if (tab === "Trades") return feed.filter((i: any) => i.type === "trade");
    if (tab === "Signals") return feed.filter((i: any) => i.type === "signal");
    return feed;
  }, [feed, tab]);

  return (
    <PageLayout
      title="Pulse"
      badge="LIVE"
      badgeColor={THEME.green}
      description="Real-time trade signals and activity feed"
      tabs={TABS as unknown as string[]}
      activeTab={tab}
      onTabChange={(t: string) => setTab(t as Tab)}
      loading={isLoading}
    >
      <StatsRow
        stats={[
          {
            label: "Trades Today",
            value: stats?.tradesToday ?? 0,
            mono: true,
          },
          {
            label: "Signals Today",
            value: stats?.signalsToday ?? 0,
            mono: true,
          },
          {
            label: "Most Active",
            value: stats?.mostActivePair ?? "—",
          },
          {
            label: "Total Trades",
            value: stats?.totalTrades ?? 0,
            mono: true,
          },
        ]}
      />

      <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <EmptyState message="No activity yet" />
        ) : (
          filtered.map((item: any) => (
            <PulseRow key={item.id} item={item} />
          ))
        )}
      </ScrollArea>
    </PageLayout>
  );
}