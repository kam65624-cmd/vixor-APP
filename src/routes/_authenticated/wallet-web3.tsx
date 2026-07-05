import { memo, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@/domains/wallet/adapter/WalletProvider";
import { WalletProviderSelector } from "@/domains/wallet/adapter/WalletProviderSelector";
import { WalletConnectButton, WalletIcon, truncateAddress } from "@/domains/wallet/adapter/WalletConnectButton";
import { EVM_CHAINS } from "@/domains/wallet/types";
import type { TokenBalance } from "@/domains/wallet/types";
import { getPhantomSolBalance, getPhantomTokenBalances } from "@/domains/wallet/adapters/phantom-adapter";
import { getEvmNativeBalance } from "@/domains/wallet/adapters/metamask-adapter";
import { PageLayout, StatsRow, ScrollArea, PageBadge as Badge, SectionTitle, PageEmptyState as EmptyState } from "@/components/vixor/PageLayout";
import { formatCurrency, formatNumber } from "@/shared/utils/formatters";
import { LiveDot } from "@/components/vixor/LiveDot";
import { MiniSparkline } from "@/components/vixor/MiniSparkline";

export const Route = createFileRoute("/_authenticated/wallet-web3")({
  component: WalletWeb3Page,
});

// ── Token Card (OpenSea Collection style) ──

const TokenCard = memo(function TokenCard({
  token,
  chainLabel,
}: {
  token: TokenBalance;
  chainLabel: string;
}) {
  const verifiedIcon = token.isVerified ? (
    <span className="text-[var(--info)] text-xs" title="Verified token" aria-label="Verified">✓</span>
  ) : token.isHoneypot ? (
    <span className="text-[var(--bearish)] text-xs" title="Potential honeypot" aria-label="Warning">⚠</span>
  ) : null;

  return (
    <div className="rounded-xl border border-[var(--border)] p-3 hover:border-[var(--border-hover)] transition-colors">
      {/* Token header */}
      <div className="flex items-start gap-2.5 mb-2.5">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="h-9 w-9 rounded-full bg-[var(--surface-2)]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs font-bold text-[var(--accent)]">
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {token.symbol}
            </span>
            {verifiedIcon}
          </div>
          <div className="truncate text-[11px] text-[var(--text-tertiary)]">
            {token.name || token.symbol}
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="font-mono text-base font-medium text-[var(--text-primary)]">
        {token.balanceFormatted}
      </div>

      {/* Value row */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-[var(--text-secondary)]">
          {token.valueUsd ? formatCurrency(token.valueUsd) : `— ${chainLabel}`}
        </span>
      </div>
    </div>
  );
});

// ── Wallet Page ──

function WalletWeb3Page() {
  const { wallet, loading } = useWallet();
  const [activeTab, setActiveTab] = useState("Holdings");
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [nativeBalance, setNativeBalance] = useState<number | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);

  const isConnected = wallet?.status === "connected";

  // Fetch balances when wallet connects
  const refreshBalances = useCallback(async () => {
    if (!wallet?.address || !isConnected) return;
    setTokensLoading(true);

    try {
      if (wallet.chain === "solana") {
        const [sol, tokenBals] = await Promise.all([
          getPhantomSolBalance(wallet.address),
          getPhantomTokenBalances(wallet.address),
        ]);
        setNativeBalance(sol);
        setTokens(tokenBals);
      } else if (wallet.chain === "evm") {
        const chainId = wallet.evmChainId || "0x1";
        const bal = await getEvmNativeBalance(wallet.address, chainId);
        setNativeBalance(bal);
        setTokens([]); // EVM tokens require Alchemy — shown as empty for now
      }
    } catch (err) {
      console.error("[Wallet] Failed to fetch balances:", err);
    } finally {
      setTokensLoading(false);
    }
  }, [wallet?.address, wallet?.chain, wallet?.evmChainId, isConnected]);

  // Auto-fetch on connect
  const handleConnect = useCallback(() => {
    // Small delay to ensure wallet state is updated
    setTimeout(refreshBalances, 500);
  }, [refreshBalances]);

  // Native token symbol
  const nativeSymbol = wallet?.chain === "solana"
    ? "SOL"
    : wallet?.evmChainId
      ? EVM_CHAINS[wallet.evmChainId]?.nativeSymbol ?? "ETH"
      : "ETH";

  const chainLabel = wallet?.chain === "solana"
    ? "Solana"
    : wallet?.evmChainId
      ? EVM_CHAINS[wallet.evmChainId]?.label ?? "Ethereum"
      : "Ethereum";

  const totalValue = tokens.reduce((sum, t) => sum + (t.valueUsd ?? 0), 0);
  const unverifiedCount = tokens.filter(t => !t.isVerified).length;

  const stats = isConnected
    ? [
        { label: nativeSymbol + " Balance", value: nativeBalance !== null ? nativeBalance.toFixed(4) : "—" },
        { label: "Tokens", value: String(tokens.length), sub: `${tokens.filter(t => t.isVerified).length} verified` },
        { label: "Chain", value: chainLabel },
        { label: "Portfolio", value: totalValue > 0 ? formatCurrency(totalValue) : "—" },
      ]
    : [
        { label: "Status", value: "Disconnected" },
        { label: "Tokens", value: "0" },
        { label: "Chain", value: "—" },
        { label: "Portfolio", value: "$0.00" },
      ];

  // Top action bar (outside PageLayout since it doesn't support actions prop)
  const actionBar = (
    <div className="flex items-center justify-end gap-2 px-4 py-2">
      {isConnected ? (
        <>
          <WalletConnectButton onConnect={handleConnect} />
          <button
            onClick={refreshBalances}
            disabled={tokensLoading}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--border-hover)] min-h-[44px] transition-colors"
            aria-label="Refresh balances"
          >
            {tokensLoading ? (
              <div className="size-3.5 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin" />
            ) : (
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            )}
          </button>
        </>
      ) : (
        <WalletProviderSelector />
      )}
    </div>
  );

  return (
    <>
      {actionBar}
      <PageLayout
        title="Wallet"
        badge="WEB3"
        badgeColor="var(--accent)"
        description="Multi-chain wallet — Solana + EVM"
        tabs={["Holdings", "Transactions"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={false}
    >
      {/* Unverified tokens warning */}
      {isConnected && unverifiedCount > 0 && (
        <div className="mx-4 mt-2 rounded-lg border border-[var(--neutral-wait)]/40 bg-[var(--neutral-wait)]/10 p-3">
          <div className="flex items-center gap-2 text-[var(--neutral-wait)]">
            <span className="text-sm">⚠</span>
            <span className="text-xs font-semibold">
              {unverifiedCount} unverified token{unverifiedCount > 1 ? "s" : ""} detected
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Always DYOR. Unverified tokens may be honeypots or scams. Verify before trading.
          </p>
        </div>
      )}

      <StatsRow stats={stats} />

      {activeTab === "Holdings" && (
        <>
          {!isConnected ? (
            <EmptyState
              icon="💳"
              title="No Wallet Connected"
              message="Connect Phantom (Solana) or MetaMask (ETH, Polygon, Avalanche) to view your portfolio."
            />
          ) : tokensLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
              <span className="ml-3 text-sm text-[var(--text-secondary)]">Loading balances...</span>
            </div>
          ) : tokens.length === 0 ? (
            <EmptyState
              icon="💎"
              title="No Tokens Found"
              message={`This ${chainLabel} wallet has no SPL/ERC-20 token balances.`}
            />
          ) : (
            <>
              <SectionTitle title="Token Holdings" count={tokens.length} />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {tokens.map((token) => (
                  <TokenCard key={token.mint} token={token} chainLabel={chainLabel} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "Transactions" && (
        <>
          <SectionTitle title="Recent Transactions" count={0} />
          <EmptyState
            icon="📋"
            title="No Transactions"
            message="Transaction history will appear here after swaps, transfers, or trades."
          />
        </>
      )}
    </PageLayout>
    </>
  );
}