import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import type { Tables } from "@/shared/supabase/types";
import {
  PageLayout,
  THEME,
  StatsRow,
  SectionTitle,
  DataRow,
  Badge,
  EmptyState,
  ScrollArea,
  TableHeader,
} from "@/components/vixor/PageLayout";

type Trade = Tables<"trades">;

export const Route = createFileRoute("/_authenticated/pnl")({
  head: () => ({ meta: [{ title: "PnL — Vixor Terminal" }] }),
  component: PnLPage,
});

// ── Column definitions (shared between TableHeader and TradeRow) ─────────
const COLUMNS = [
  { label: "Pair", width: "80px", align: "left" as const },
  { label: "Side", width: "50px", align: "left" as const },
  { label: "Entry", width: "75px", align: "right" as const },
  { label: "Exit", width: "75px", align: "right" as const },
  { label: "Qty", width: "55px", align: "right" as const },
  { label: "PnL", width: "75px", align: "right" as const },
  { label: "R", width: "55px", align: "right" as const },
  { label: "Duration", width: "65px", align: "right" as const },
];

function PnLPage() {
  const navigate = useNavigate();
  const fetchTrades = useStableServerFn(getTradeHistory);

  const tradesQuery = useQuery({
    queryKey: ["trade-history-pnl"],
    queryFn: () => fetchTrades({ data: { limit: 100 } }),
    staleTime: 15_000,
  });

  const isLoading = tradesQuery.isLoading;
  const trades: Trade[] = tradesQuery.data?.trades ?? [];

  const closedTrades = trades.filter((t) => t.status === "closed" && t.pnl !== null);
  const openTrades = trades.filter((t) => t.status === "open");

  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
  const losses = closedTrades.filter((t) => (t.pnl || 0) < 0).length;
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
  const avgWin = wins > 0 ? closedTrades.filter((t) => (t.pnl || 0) > 0).reduce((s, t) => s + (t.pnl || 0), 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(closedTrades.filter((t) => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0) / losses) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  const bestTrade = closedTrades.length > 0 ? closedTrades.reduce((best, t) => (t.pnl || 0) > (best.pnl || 0) ? t : best) : null;

  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const fmtDuration = (entry: string, exit?: string | null) => {
    if (!exit) return "—";
    const ms = new Date(exit).getTime() - new Date(entry).getTime();
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const fmtPrice = (n: number) =>
    n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2);

  const description = closedTrades.length > 0
    ? `${closedTrades.length} closed trades · ${openTrades.length} open`
    : "No trades yet";

  const statsItems = closedTrades.length > 0
    ? [
        {
          label: "Total PnL",
          value: pnlFmt(totalPnl),
          color: totalPnl >= 0 ? THEME.green : THEME.red,
        },
        {
          label: "Win Rate",
          value: `${winRate}%`,
          color: THEME.accentDeep,
          sub: `${wins}W / ${losses}L`,
        },
        {
          label: "Profit Factor",
          value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2),
        },
        {
          label: "Best Trade",
          value: bestTrade ? bestTrade.pair : "—",
          color: bestTrade ? THEME.green : THEME.textMuted,
          sub: bestTrade ? pnlFmt(bestTrade.pnl || 0) : undefined,
        },
      ]
    : [];

  return (
    <PageLayout
      title="PnL Tracker"
      badge="TRADE HISTORY"
      description={description}
      loading={isLoading}
      loadingColor={THEME.green}
    >
      {statsItems.length > 0 && <StatsRow stats={statsItems} />}

      <SectionTitle title="Recent Trades" count={trades.length} />

      <TableHeader columns={COLUMNS} />

      <ScrollArea>
        {trades.length > 0 ? (
          trades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              pnlFmt={pnlFmt}
              fmtPrice={fmtPrice}
              fmtDate={fmtDate}
              fmtDuration={fmtDuration}
            />
          ))
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <EmptyState
              icon="📊"
              title="No trades recorded yet"
              message="Start tracking your performance by logging your first trade."
            />
            <button
              onClick={() => navigate({ to: "/trade-desk" })}
              style={{
                marginBottom: "24px",
                padding: "8px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: `${THEME.green}1F`,
                color: THEME.accent,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              Log a Trade
            </button>
          </div>
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const TradeRow = memo(function TradeRow({
  trade,
  pnlFmt,
  fmtPrice,
  fmtDate,
  fmtDuration,
}: {
  trade: Trade;
  pnlFmt: (n: number) => string;
  fmtPrice: (n: number) => string;
  fmtDate: (d: string) => string;
  fmtDuration: (e: string, x?: string | null) => string;
}) {
  const isPositive = (trade.pnl || 0) >= 0;
  const pnlColor = isPositive ? THEME.green : THEME.red;
  const isLong = trade.direction === "long";
  const rColor = trade.r_multiple && trade.r_multiple > 0 ? THEME.green : THEME.textMuted;

  return (
    <DataRow style={{ padding: "8px 16px" }}>
      <div
        className="scrollbar-hide"
        style={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          gap: 0,
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {/* Pair */}
        <div style={{ width: "80px", minWidth: "80px", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, color: THEME.text }}>{trade.pair}</span>
        </div>

        {/* Side */}
        <div style={{ width: "50px", minWidth: "50px", flexShrink: 0 }}>
          <Badge
            label={trade.direction.toUpperCase()}
            color={isLong ? THEME.green : THEME.red}
            small
          />
        </div>

        {/* Entry */}
        <div style={{ width: "75px", minWidth: "75px", flexShrink: 0, textAlign: "right", color: THEME.text }}>
          {fmtPrice(trade.entry_price)}
        </div>

        {/* Exit */}
        <div style={{ width: "75px", minWidth: "75px", flexShrink: 0, textAlign: "right", color: THEME.text }}>
          {trade.exit_price ? fmtPrice(trade.exit_price) : "—"}
        </div>

        {/* Qty */}
        <div style={{ width: "55px", minWidth: "55px", flexShrink: 0, textAlign: "right", color: THEME.textSecondary }}>
          {trade.quantity ?? "—"}
        </div>

        {/* PnL */}
        <div style={{ width: "75px", minWidth: "75px", flexShrink: 0, textAlign: "right", fontWeight: 700, color: pnlColor }}>
          {trade.pnl !== null ? pnlFmt(trade.pnl) : "—"}
        </div>

        {/* R Multiple */}
        <div style={{ width: "55px", minWidth: "55px", flexShrink: 0, textAlign: "right", color: rColor }}>
          {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
        </div>

        {/* Duration */}
        <div style={{ width: "65px", minWidth: "65px", flexShrink: 0, textAlign: "right", color: THEME.textMuted }}>
          {fmtDuration(trade.entry_date, trade.exit_date)}
        </div>
      </div>
    </DataRow>
  );
});