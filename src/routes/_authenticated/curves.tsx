import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getBondingCurveData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  LabelValue,
  MiniBar,
  THEME,
} from "@/components/vixor/PageLayout";
import { formatCompact } from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/curves")({
  head: () => ({
    meta: [{ title: "Bonding Curves \u2014 Vixor" }],
  }),
  component: CurvesPage,
});

const TABS = ["All Pairs", "Accumulating"] as const;

function CurvesPage() {
  const fetchCurvesData = useStableServerFn(getBondingCurveData);
  const [activeTab, setActiveTab] = useState<string>("All Pairs");

  const query = useQuery({
    queryKey: ["bonding-curve-data"],
    queryFn: () => fetchCurvesData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const pairs = query.data?.pairs ?? [];
  const accumulating = query.data?.accumulating ?? [];
  const stats = query.data?.stats ?? {
    accumulatingCount: 0,
    uniquePairs: 0,
    mostTradedPair: "\u2014",
    mostTradedVolume: 0,
  };

  const displayPairs =
    activeTab === "Accumulating" ? accumulating : pairs;

  return (
    <PageLayout
      title="Bonding Curves"
      badge="ACCUMULATION TRACKER"
      badgeColor={THEME.green}
      description="Trade distribution analysis \u2014 spot accumulation patterns across pairs"
      tabs={[...TABS]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabCounts={{
        "All Pairs": pairs.length,
        Accumulating: accumulating.length,
      }}
      loading={isLoading}
      loadingColor={THEME.green}
    >
      <StatsRow
        stats={[
          {
            label: "Accumulating",
            value: String(stats.accumulatingCount),
            color: THEME.green,
          },
          {
            label: "Unique Pairs",
            value: String(stats.uniquePairs),
            color: THEME.accent,
          },
          {
            label: "Most Traded",
            value: stats.mostTradedPair,
            color: THEME.amber,
            sub: formatCompact(stats.mostTradedVolume),
          },
        ]}
      />
      <ScrollArea>
        {displayPairs.length > 0 ? (
          displayPairs.map((pair: any) => (
            <CurveCard key={pair.pair} pair={pair} />
          ))
        ) : (
          <EmptyState
            icon="📈"
            title={
              pairs.length === 0
                ? "No trade data yet"
                : "No accumulation signals"
            }
            message={
              pairs.length === 0
                ? "Start trading to see accumulation patterns."
                : "No pairs showing accumulation signals right now."
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const CurveCard = memo(function CurveCard({ pair }: { pair: any }) {
  const isAccumulating = pair.buyCount > pair.sellCount;
  const totalTrades = pair.buyCount + pair.sellCount;
  const buyPct =
    totalTrades > 0 ? (pair.buyCount / totalTrades) * 100 : 50;

  return (
    <DataRow leftAccent={isAccumulating ? THEME.green : undefined}>
      {/* Top row */}
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
            gap: "8px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: THEME.text,
            }}
          >
            {pair.pair}
          </span>
          {isAccumulating && (
            <Badge label="ACCUMULATING" color={THEME.green} small />
          )}
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color: isAccumulating ? THEME.green : THEME.red,
          }}
        >
          {(pair.ratio || 0).toFixed(1)}x
        </span>
      </div>
      {/* Buy/Sell bar */}
      <MiniBar leftPct={buyPct} />
      {/* Bottom row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "6px",
        }}
      >
        <LabelValue
          label="Buy"
          value={String(pair.buyCount)}
          valueColor={THEME.green}
        />
        <LabelValue
          label="Sell"
          value={String(pair.sellCount)}
          valueColor={THEME.red}
        />
        <LabelValue
          label="Vol"
          value={formatCompact(pair.totalVolume)}
          mono
        />
      </div>
    </DataRow>
  );
});