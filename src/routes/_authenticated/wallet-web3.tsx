import { memo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getWalletData } from "@/shared/data";
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  LabelValue,
  SectionTitle,
  ProfileCard,
  THEME,
} from "@/components/vixor/PageLayout";
import {
  formatCurrency,
  formatPnL,
  formatNumber,
  formatQuantity,
  formatPrice,
} from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/wallet-web3")({
  component: WalletWeb3Page,
});

const TOKEN_COLORS = [
  THEME.green,
  THEME.accent,
  THEME.purple,
  THEME.amber,
  THEME.pink,
];

const TokenCard = memo(function TokenCard({
  token,
}: {
  token: {
    symbol: string;
    amount: number;
    totalValue: number;
    pnl: number;
    totalEntry: number;
    lastPrice: number;
    tradeCount: number;
  };
}) {
  const colorIdx =
    token.symbol.charCodeAt(0) % TOKEN_COLORS.length;
  const avatarColor = TOKEN_COLORS[colorIdx];

  const pnlColor = token.pnl >= 0 ? THEME.green : THEME.red;

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: avatar + symbol + trade count */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: avatarColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#000",
            }}
          >
            {token.symbol.charAt(0)}
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: THEME.text,
              }}
            >
              {token.symbol}
            </div>
            <div
              style={{
                fontSize: 11,
                color: THEME.textMuted,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {token.tradeCount} trades
            </div>
          </div>
        </div>

        {/* Right: amount | value | pnl | price */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>Amount</div>
            <div style={{ fontSize: 13, color: THEME.text, fontWeight: 500 }}>
              {formatQuantity(token.amount)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>Value</div>
            <div style={{ fontSize: 13, color: THEME.text, fontWeight: 500 }}>
              {formatCurrency(token.totalValue)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>PnL</div>
            <div style={{ fontSize: 13, color: pnlColor, fontWeight: 600 }}>
              {formatPnL(token.pnl)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>Price</div>
            <div style={{ fontSize: 13, color: THEME.text, fontWeight: 500 }}>
              {formatPrice(token.lastPrice)}
            </div>
          </div>
        </div>
      </div>
    </DataRow>
  );
});

const TxnCard = memo(function TxnCard({
  txn,
}: {
  txn: {
    id: string;
    type: "BUY" | "SELL";
    pair: string;
    amount: number;
    price: number;
    pnl: number;
  };
}) {
  const isBuy = txn.type === "BUY";

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left: badge + pair */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge
            label={txn.type}
            color={isBuy ? THEME.green : THEME.red}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: THEME.text,
            }}
          >
            {txn.pair}
          </span>
        </div>

        {/* Right: amount | price | pnl */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>Amount</div>
            <div style={{ fontSize: 13, color: THEME.text, fontWeight: 500 }}>
              {formatQuantity(txn.amount)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>Price</div>
            <div style={{ fontSize: 13, color: THEME.text, fontWeight: 500 }}>
              {formatPrice(txn.price)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted }}>PnL</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: txn.pnl >= 0 ? THEME.green : THEME.red,
              }}
            >
              {formatPnL(txn.pnl)}
            </div>
          </div>
        </div>
      </div>
    </DataRow>
  );
});

function WalletWeb3Page() {
  const getFn = useStableServerFn(getWalletData);

  const { data, isLoading } = useQuery({
    queryKey: ["walletData"],
    queryFn: getFn,
    staleTime: 30_000,
  });

  const [activeTab, setActiveTab] = useState("Holdings");

  const profile = data?.profile ?? null;
  const totalPortfolioValue = data?.totalPortfolioValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const tokens = data?.tokens ?? [];
  const activeTrades = data?.activeTrades ?? 0;
  const totalTrades = data?.totalTrades ?? 0;
  const recentTransactions = data?.recentTransactions ?? [];

  const stats = [
    {
      label: "Portfolio Value",
      value: formatCurrency(totalPortfolioValue),
      color: THEME.text,
    },
    {
      label: "Total PnL",
      value: formatPnL(totalPnl),
      color: totalPnl >= 0 ? THEME.green : THEME.red,
    },
    {
      label: "Tokens Traded",
      value: formatNumber(tokens.length),
      color: THEME.accent,
    },
    {
      label: "Active Trades",
      value: `${activeTrades}/${totalTrades}`,
      color: THEME.amber,
    },
  ];

  return (
    <PageLayout
      title="Wallet"
      badge="WEB3"
      badgeColor={THEME.accent}
      description="Web3 portfolio holdings and transaction history"
      tabs={["Holdings", "Transactions"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={isLoading}
    >
      {profile && (
        <ProfileCard
          displayName={profile.display_name ?? undefined}
          username={profile.username ?? undefined}
          xp={profile.xp ?? undefined}
          streak={profile.streak_days ?? undefined}

        />
      )}

      <StatsRow stats={stats} />

      {activeTab === "Holdings" && (
        <>
          <SectionTitle title="Token Holdings" count={tokens.length} />
          <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
            {tokens.length === 0 ? (
              <EmptyState icon="💰" title="No Holdings" message="No token holdings found. Connect a wallet to see your portfolio." />
            ) : (
              tokens.map((t) => <TokenCard key={t.symbol} token={t} />)
            )}
          </ScrollArea>
        </>
      )}

      {activeTab === "Transactions" && (
        <>
          <SectionTitle title="Recent Transactions" count={recentTransactions.length} />
          <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
            {recentTransactions.length === 0 ? (
              <EmptyState icon="📋" title="No Transactions" message="No transaction history found. Start trading to see your activity." />
            ) : (
              recentTransactions.map((tx: any) => <TxnCard key={tx.id} txn={tx} />)
            )}
          </ScrollArea>
        </>
      )}
    </PageLayout>
  );
}