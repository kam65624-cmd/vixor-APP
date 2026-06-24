import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useState } from "react";
import { getPortfolioData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout, 
  StatsRow,
  SectionTitle,
  DataRowTwoLine,
  DataRow,
  LabelValue,
  EmptyState,
  SkeletonRow,
  ScrollArea,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/bags")({
  head: () => ({ meta: [{ title: "Bags — Vixor Terminal" }] }),
  component: BagsPage,
});

function BagsPage() {
  const navigate = useNavigate();
  const fetchPortfolio = useStableServerFn(getPortfolioData);

  const portfolioQuery = useQuery({
    queryKey: ["portfolio-data"],
    queryFn: () => fetchPortfolio({}),
    staleTime: 30_000,
  });

  const data = portfolioQuery.data;
  const isLoading = portfolioQuery.isLoading;
  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;

  const hasData = holdings.length > 0;

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(2)}K`
        : `$${n.toFixed(2)}`;
  const pnlFmt = (n: number) =>
    n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;

  const pnlColor = totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)";
  const pnlPctColor = totalPnlPct >= 0 ? "var(--color-bullish)" : "var(--color-bearish)";

  return (
    <PageLayout
      title="My Bags"
      badge="PORTFOLIO"
      loading={isLoading}
      description={
        hasData
          ? `${holdings.length} holdings from ${tradeCount} trades`
          : "Portfolio data from your trades"
      }
    >
      {hasData ? (
        <>
          <StatsRow
            stats={[
              {
                label: "Portfolio Value",
                value: fmt(totalValue),
              },
              {
                label: "Total PnL",
                value: pnlFmt(totalPnl),
                color: pnlColor,
              },
              {
                label: "Total Return",
                value: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(1)}%`,
                color: pnlPctColor,
              },
            ]}
          />

          <SectionTitle title="Holdings" count={holdings.length} />

          <ScrollArea>
            {holdings.map((bag) => (
              <BagRow key={bag.symbol} bag={bag} />
            ))}
          </ScrollArea>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            alignItems: "center",
          }}
        >
          <EmptyState
            icon="🎒"
            title="No bags yet"
            message="Start trading to see your portfolio holdings here."
          />
          <ActionButton
            label="Go to Trade Desk"
            onClick={() => navigate({ to: "/trade-desk" })}
          />
        </div>
      )}
    </PageLayout>
  );
}

/* ── Small action button for empty state ─────────────────────────────────── */

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        padding: "10px 24px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        background: hovered
          ? `${"var(--color-bullish)"}28`
          : `color-mix(in oklab, var(--color-bullish) 10%, transparent)`,
        color: "var(--color-primary)",
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: "background 0.15s ease",
        marginBottom: "32px",
      }}
    >
      {label}
    </button>
  );
}

/* ── Bag row ──────────────────────────────────────────────────────────────── */

interface BagData {
  symbol: string;
  name: string;
  chain: string;
  amount: number;
  avgEntry: number;
  pnl: number;
  value: number;
  pnlPct: number;
}

const BagRow = memo(function BagRow({ bag }: { bag: BagData }) {
  const isPos = bag.pnlPct >= 0;
  const color = isPos ? "var(--color-bullish)" : "var(--color-bearish)";

  const fmtPrice = (n: number) =>
    n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2);

  return (
    <DataRowTwoLine
      leftAccent={color}
      topContent={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* Left: avatar + symbol + chain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: `color-mix(in oklab, var(--color-bullish) 10%, transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 800,
                color,
                flexShrink: 0,
              }}
            >
              {bag.symbol.slice(0, 2)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                  }}
                >
                  {bag.symbol}
                </span>
                <span
                  style={{ fontSize: "9px", color: "var(--color-muted-foreground)" }}
                >
                  {bag.chain}
                </span>
              </div>
            </div>
          </div>

          {/* Right: current value */}
          <div style={{ flexShrink: 0 }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-foreground)",
              }}
            >
              ${bag.value.toFixed(2)}
            </span>
          </div>
        </div>
      }
      bottomContent={
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <LabelValue
              label="Tokens"
              value={bag.amount.toFixed(4)}
              mono
            />
            <LabelValue
              label="Avg"
              value={fmtPrice(bag.avgEntry)}
              mono
            />
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 700,
              color,
              whiteSpace: "nowrap",
            }}
          >
            {bag.pnl >= 0 ? "+" : ""}
            {bag.pnl.toFixed(2)} ({isPos ? "+" : ""}
            {bag.pnlPct.toFixed(1)}%)
          </span>
        </>
      }
    />
  );
});