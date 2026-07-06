import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  PageLayout,
  StatsRow,
  PageSectionTitle,
  PageScrollArea,
  DataRow,
  LabelValue,
  PageBadge,
  SkeletonRow,
} from "@/components/vixor/PageLayout";
import { getWalletData } from "@/shared/data";

export const Route = createFileRoute("/_authenticated/activity-web3")({
  head: () => ({ meta: [{ title: "Activity — Vixor" }] }),
  component: ActivityPage,
});

type Txn = {
  id: string;
  pair: string | null;
  type: string;
  amount: number;
  price: number | null;
  pnl: number | null;
  status: string | null;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ActivityPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getWalletData>> | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    getWalletData()
      .then(setData)
      .catch(() => console.warn("[Activity] Failed to load wallet data"))
      .finally(() => setLoading(false));
  }, []);

  const txns: Txn[] = (data?.recentTransactions || []) as Txn[];
  const tokens = data?.tokens || [];
  const totalPnl = data?.totalPnl ?? 0;

  const statusColor = (s: string | null) => {
    if (s === "closed") return "var(--color-bullish)";
    if (s === "open") return "var(--color-info)";
    return "var(--color-muted-foreground)";
  };

  return (
    <PageLayout
      title="On-Chain Activity"
      badge="SOLANA"
      badgeColor="var(--color-primary)"
      loading={loading}
    >
      {/* Stats */}
      <StatsRow
        stats={[
          { label: "Tokens", value: String(tokens.length), color: "var(--color-primary)" },
          { label: "Transactions", value: String(txns.length) },
          {
            label: "PnL",
            value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`,
            color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
          },
          {
            label: "Active",
            value: String(data?.activeTrades ?? 0),
            color: "var(--color-info)",
          },
        ]}
      />

      <PageScrollArea>
        {/* Token Holdings */}
        {tokens.length > 0 && (
          <>
            <PageSectionTitle title="Token Holdings" count={tokens.length} />
            {tokens.map((t) => (
              <DataRow key={t.symbol}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--color-foreground)",
                      }}
                    >
                      {t.symbol}
                    </span>
                    <PageBadge
                      label={t.tradeCount + " trades"}
                      color="var(--color-muted-foreground)"
                      small
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      color: t.pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                    }}
                  >
                    {t.pnl >= 0 ? "+" : ""}
                    {t.pnl.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "4px 12px",
                  }}
                >
                  <LabelValue label="Value" value={`$${t.totalValue.toFixed(2)}`} mono />
                  <LabelValue label="Amount" value={t.amount.toFixed(4)} mono />
                  <LabelValue
                    label="Avg Entry"
                    value={`$${(t.totalEntry / t.amount).toFixed(2)}`}
                    mono
                  />
                </div>
              </DataRow>
            ))}
          </>
        )}

        {/* Recent Transactions */}
        <PageSectionTitle title="Recent Transactions" count={txns.length} />
        {loading && !data ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : txns.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--color-muted-foreground)",
            }}
          >
            No transactions yet. Start trading to see your activity here.
          </div>
        ) : (
          txns.map((tx) => (
            <DataRow key={tx.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <PageBadge
                    label={tx.type}
                    color={tx.type === "BUY" ? "var(--color-bullish)" : "var(--color-bearish)"}
                    small
                  />
                  <span
                    style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}
                  >
                    {tx.pair || "Unknown"}
                  </span>
                </div>
                <PageBadge label={tx.status || "unknown"} color={statusColor(tx.status)} small />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "4px 12px",
                }}
              >
                <LabelValue label="Price" value={tx.price ? `$${tx.price.toFixed(2)}` : "—"} mono />
                <LabelValue label="Qty" value={String(tx.amount)} mono />
                {tx.pnl != null && (
                  <LabelValue
                    label="PnL"
                    value={`${tx.pnl >= 0 ? "+" : ""}${tx.pnl.toFixed(2)}`}
                    valueColor={tx.pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"}
                    mono
                  />
                )}
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "12px",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {timeAgo(tx.createdAt)}
                </span>
              </div>
            </DataRow>
          ))
        )}
      </PageScrollArea>
    </PageLayout>
  );
}
