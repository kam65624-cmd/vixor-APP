import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getPortfolioData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getPerformance } from "@/domains/trades/functions";
import { PerformancePanel } from "@/components/vixor/PerformancePanel";
import {
  PageLayout,
  StatsRow,
  SectionTitle,
  DataRowTwoLine,
  LabelValue,
  Badge,
  EmptyState,
  ScrollArea,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Vixor" }] }),
  component: PortfolioPage,
});

// ── Allocation bar colours from THEME tokens ─────────────────────────────
const ALLOC_COLORS = [
  "var(--color-bullish)",
  "var(--color-info)",
  "var(--color-bearish)",
  "var(--color-neutral-wait)",
  "var(--color-primary)",
  "var(--color-bearish)",
  "var(--color-info)",
  "var(--color-neutral-wait)",
];

// ── Page ─────────────────────────────────────────────────────────────────

function PortfolioPage() {
  const navigate = useNavigate();
  const fetchPortfolio = useStableServerFn(getPortfolioData);
  const fetchPerformance = useStableServerFn(getPerformance);
  const [activeTab, setActiveTab] = useState<"holdings" | "performance" | "history">("holdings");

  const query = useQuery({
    queryKey: ["portfolio-data-page"],
    queryFn: () => fetchPortfolio({}),
    staleTime: 30_000,
  });

  const perfQuery = useQuery({
    queryKey: ["portfolio-performance"],
    queryFn: () => fetchPerformance({}),
    staleTime: 60_000,
  });

  const data = query.data;
  const isLoading = query.isLoading;
  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(2)}K`
        : `$${n.toFixed(2)}`;

  return (
    <PageLayout
      title="Portfolio"
      badge="PORTFOLIO"
      badgeColor={"var(--color-primary)"}
      tabs={"holdings,performance,history".split(",") as any}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t as "holdings" | "performance" | "history")}
      loading={isLoading && activeTab === "holdings"}
      loadingColor={"var(--color-bullish)"}
    >
      {/* ── Holdings Tab ───────────────────────────────────────────── */}
      {activeTab === "holdings" && (
        <>
          <StatsRow
            stats={[
              {
                label: "Total Value",
                value: fmt(totalValue),
                icon: "💎",
                color: "var(--color-foreground)",
              },
              {
                label: "Total PnL",
                value: `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}`,
                color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                sub: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(1)}%`,
              },
              {
                label: "Holdings",
                value: String(holdings.length),
                icon: "📊",
                color: "var(--color-foreground)",
              },
            ]}
          />

          {/* ── Allocation bar (THEME colours) ────────────────────── */}
          {holdings.length > 0 && (
            <div
              style={{
                display: "flex",
                height: "6px",
                borderRadius: "3px",
                overflow: "hidden",
                background: "var(--color-card)",
                borderBottom: `1px solid ${"var(--color-border)"}`,
              }}
            >
              {holdings.map((h, i) => {
                const pct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
                if (pct < 1) return null;
                return (
                  <div
                    key={h.symbol}
                    style={{
                      width: `${pct}%`,
                      background: ALLOC_COLORS[i % ALLOC_COLORS.length],
                      transition: "width 0.3s ease",
                    }}
                    title={`${h.symbol}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
          )}

          <SectionTitle title="Holdings" count={holdings.length} />

          <ScrollArea>
            {holdings.length > 0 ? (
              holdings.map((h) => <HoldingRow key={h.symbol} holding={h} totalValue={totalValue} />)
            ) : (
              <LinkedEmptyState
                icon="📭"
                title="No trades yet"
                message="Start trading to see your portfolio here."
                actionLabel="Start trading →"
                onAction={() => navigate({ to: "/trade-desk" })}
              />
            )}
          </ScrollArea>
        </>
      )}

      {/* ── Performance Tab ───────────────────────────────────────── */}
      {activeTab === "performance" && (
        <ScrollArea>
          <PerformancePanel performance={perfQuery.data ?? null} isLoading={perfQuery.isLoading} />
        </ScrollArea>
      )}

      {/* ── History Tab ───────────────────────────────────────────── */}
      {activeTab === "history" && (
        <LinkedEmptyState
          icon="📋"
          title="Trade History"
          message="View your full trade history on the"
          actionLabel="PnL Tracker"
          onAction={() => navigate({ to: "/pnl" })}
        />
      )}
    </PageLayout>
  );
}

// ── Holding row (two-line card, no fixed % widths) ───────────────────────

const HoldingRow = memo(function HoldingRow({
  holding,
  totalValue,
}: {
  holding: any;
  totalValue: number;
}) {
  const isPos = holding.pnlPct >= 0;
  const pnlColor = isPos ? "var(--color-bullish)" : "var(--color-bearish)";
  const alloc = totalValue > 0 ? ((holding.value / totalValue) * 100).toFixed(1) : "0";

  const fmtPrice = (n: number) => (n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2));

  return (
    <DataRowTwoLine
      leftAccent={pnlColor}
      topContent={
        <>
          {/* Token identity */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: isPos ? `rgba(34,211,166,0.10)` : `rgba(251,70,103,0.10)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 800,
                color: pnlColor,
                flexShrink: 0,
              }}
            >
              {holding.symbol.slice(0, 2)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {holding.symbol}
              </div>
              <Badge label={holding.chain} color={"var(--color-muted-foreground)"} small />
            </div>
          </div>

          {/* PnL summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: pnlColor,
              }}
            >
              {holding.pnl >= 0 ? "+" : ""}
              {holding.pnl.toFixed(2)}
            </span>
            <Badge
              label={`${isPos ? "+" : ""}${holding.pnlPct.toFixed(1)}%`}
              color={pnlColor}
              small
            />
          </div>
        </>
      }
      bottomContent={
        <>
          <LabelValue label="Value" value={`$${holding.value.toFixed(2)}`} mono />
          <LabelValue label="Amt" value={holding.amount.toFixed(4)} mono />
          <LabelValue
            label="Entry"
            value={`$${fmtPrice(holding.avgEntry)}`}
            valueColor={"var(--color-muted-foreground)"}
            mono
          />
          <LabelValue
            label="Alloc"
            value={`${alloc}%`}
            valueColor={"var(--color-muted-foreground)"}
          />
        </>
      }
    />
  );
});

// ── Empty state with an action link (follows EmptyState styling) ─────────

function LinkedEmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionColor = "var(--color-primary)",
  onAction,
}: {
  icon: string;
  title: string;
  message: string;
  actionLabel: string;
  actionColor?: string;
  onAction: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "48px 20px",
        background: "var(--color-card)",
        flex: 1,
      }}
    >
      <span style={{ fontSize: "28px", opacity: 0.4 }}>{icon}</span>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-muted-foreground)",
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}
      >
        {message}{" "}
        <span style={{ color: actionColor, cursor: "pointer" }} onClick={onAction}>
          {actionLabel}
        </span>
      </div>
    </div>
  );
}
