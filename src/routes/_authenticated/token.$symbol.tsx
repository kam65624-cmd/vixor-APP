import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout, 
  StatsRow,
  DataRow,
  Badge,
  ScrollArea,
  EmptyState,
  SectionTitle,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/token/$symbol")({
  head: () => ({ meta: [{ title: "Token — Vixor" }] }),
  component: TokenPage,
});

function TokenPage() {
  const { symbol } = useParams({ from: "/_authenticated/token/$symbol" });
  const fetchTrades = useStableServerFn(getTradeHistory);

  const query = useQuery({
    queryKey: ["token-trades", symbol],
    queryFn: () => fetchTrades({ data: { limit: 100 } }),
    staleTime: 15_000,
  });

  const allTrades = query.data?.trades ?? [];
  const tokenTrades = allTrades.filter((t) => t.pair?.toUpperCase().includes(symbol.toUpperCase()));

  const closedTrades = tokenTrades.filter((t) => t.status === "closed" && t.pnl != null);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const winRate =
    closedTrades.length > 0
      ? Math.round(
          (closedTrades.filter((t) => (t.pnl || 0) > 0).length / closedTrades.length) * 100,
        )
      : 0;

  return (
    <PageLayout
      title={symbol.toUpperCase()}
      badge="TOKEN"
      badgeColor={"var(--color-primary)"}
      loading={query.isLoading}
      loadingColor={"var(--color-bullish)"}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 16px",
          borderBottom: `1px solid ${"var(--color-border)"}`,
          background: "var(--color-muted)",
          flexShrink: 0,
        }}
      >
        <Link
          to="/discover"
          style={{
            color: "var(--color-primary)",
            fontSize: "11px",
            textDecoration: "none",
          }}
        >
          Discover
        </Link>
        <span style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>/</span>
      </div>

      <StatsRow
        stats={[
          {
            label: "Your Trades",
            value: String(tokenTrades.length),
            color: "var(--color-foreground)",
          },
          {
            label: "Total PnL",
            value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`,
            color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
          },
          {
            label: "Win Rate",
            value: `${winRate}%`,
            color: "var(--color-bullish)",
          },
          {
            label: "Closed",
            value: String(closedTrades.length),
            color: "var(--color-foreground)",
          },
        ]}
      />

      {/* Chart Placeholder */}
      <div
        style={{
          height: "200px",
          background: "var(--color-background)",
          position: "relative",
          borderBottom: `1px solid ${"var(--color-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "24px" }}>📈</span>
        <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
          Chart requires OHLCV data feed
        </span>
        <Badge label="COMING SOON" color={"var(--color-neutral-wait)"} />
      </div>

      <SectionTitle title={`Your Trades for ${symbol.toUpperCase()}`} count={tokenTrades.length} />

      <ScrollArea>
        {tokenTrades.length > 0 ? (
          tokenTrades.map((trade) => <TokenTradeRow key={trade.id} trade={trade} />)
        ) : (
          <EmptyState
            icon="📊"
            title="No trades found"
            message={
              allTrades.length === 0
                ? "No trades yet. Go to Trade Desk to log your first trade."
                : `No trades found for ${symbol.toUpperCase()}. This token may be tracked under a different pair name.`
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const TokenTradeRow = memo(function TokenTradeRow({ trade }: { trade: any }) {
  const isPos = (trade.pnl || 0) >= 0;
  const isLong = trade.direction === "long";
  const fmtPrice = (n: number) => (n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2));

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div style={{ width: "50px" }}>
          <Badge
            label={(trade.direction || "").toUpperCase()}
            color={isLong ? "var(--color-bullish)" : "var(--color-bearish)"}
            small
          />
        </div>
        <div style={{ width: "80px", textAlign: "right", color: "var(--color-foreground)" }}>
          {fmtPrice(trade.entry_price)}
        </div>
        <div style={{ width: "80px", textAlign: "right", color: "var(--color-muted-foreground)" }}>
          {trade.exit_price ? fmtPrice(trade.exit_price) : "—"}
        </div>
        <div style={{ width: "60px", textAlign: "right", color: "var(--color-muted-foreground)" }}>
          {trade.quantity ?? "—"}
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            fontWeight: 700,
            color: isPos ? "var(--color-bullish)" : "var(--color-bearish)",
          }}
        >
          {trade.pnl != null ? (isPos ? "+" : "") + trade.pnl.toFixed(2) : "—"}
        </div>
        <div
          style={{
            width: "50px",
            textAlign: "right",
            color: trade.r_multiple && trade.r_multiple > 0 ? "var(--color-bullish)" : "var(--color-muted-foreground)",
          }}
        >
          {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "right",
            color: "var(--color-muted-foreground)",
            fontSize: "10px",
          }}
        >
          {new Date(trade.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </DataRow>
  );
});
