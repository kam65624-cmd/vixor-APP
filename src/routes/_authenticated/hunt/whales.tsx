import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getWhaleWallets, trackWhale, untrackWhale } from "@/domains/hunt/functions";
import {
  PageLayout,
  PageScrollArea,
  PageSectionTitle,
  StatsRow,
  DataRow,
  Badge,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

type TradeType = "BUY" | "SELL" | "TRANSFER";

type WhaleTrade = {
  id: string;
  tradeType: TradeType;
  whaleAddress: string;
  whaleLabel: string;
  tokenName: string;
  tokenSymbol: string;
  amount: string;
  usdValue: string;
  txHash: string;
  timeAgo: string;
  isLarge: boolean;
};

const TRADE_TYPE_FILTERS = ["All", "Buys", "Sells", "Transfers"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function tradeTypeColor(type: TradeType): string {
  switch (type) {
    case "BUY":
      return "var(--color-bullish)";
    case "SELL":
      return "var(--color-bearish)";
    case "TRANSFER":
      return "var(--color-info)";
  }
}

function tradeTypeLabel(type: TradeType): string {
  return type;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function filterCategory(tradeType: TradeType): string {
  switch (tradeType) {
    case "BUY":
      return "Buys";
    case "SELL":
      return "Sells";
    case "TRANSFER":
      return "Transfers";
  }
}

function parseUsdToNumber(usd: string): number {
  return parseFloat(usd.replace(/[$,]/g, "")) || 0;
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/hunt/whales")({
  head: () => ({
    meta: [{ title: "Whale Tracker — HUNT" }],
  }),
  component: WhaleTrackerPage,
});

function WhaleTrackerPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [trackAddress, setTrackAddress] = useState("");
  const queryClient = useQueryClient();
  const stableWallets = useStableServerFn(getWhaleWallets);
  const stableTrack = useStableServerFn(trackWhale);
  const stableUntrack = useStableServerFn(untrackWhale);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["whale-wallets"],
    queryFn: () => stableWallets(),
    staleTime: 60_000,
  });

  const trackMutation = useMutation({
    mutationFn: (input: { walletAddress: string; chain: string; label?: string }) =>
      stableTrack({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whale-wallets"] }),
  });

  const untrackMutation = useMutation({
    mutationFn: (input: { walletAddress: string; chain: string }) => stableUntrack({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whale-wallets"] }),
  });

  const handleTrackSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (trackAddress) {
        trackMutation.mutate({ walletAddress: trackAddress, chain: "solana" });
        setTrackAddress("");
      }
    },
    [trackAddress, trackMutation],
  );

  const whales = data?.wallets ?? [];

  const whalesTracked = whales.length;
  const trades24h = 0;
  const totalVolume = "$636,890";
  const avgTradeSize = "$63,689";

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const handleCopyHash = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, []);

  const handleWhaleClick = useCallback((address: string) => {
    window.open(`https://etherscan.io/address/${address}`, "_blank");
  }, []);

  return (
    <PageLayout
      title="Whale Tracker"
      badge="WHALE"
      badgeColor="var(--char-vix)"
      loadingColor="var(--char-vix)"
    >
      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Trade Type Filter Tabs ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 16px",
          borderBottom: "1px solid var(--color-border)",
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {TRADE_TYPE_FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilterChange(filter)}
              aria-label={`Filter by ${filter}`}
              aria-pressed={isActive}
              style={{
                minHeight: "44px",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                color: isActive ? "var(--color-background)" : "var(--color-muted-foreground)",
                background: isActive ? "var(--char-vix)" : "transparent",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "var(--char-vix-dim)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* ── Stats Row ── */}
      <StatsRow
        stats={[
          {
            label: "Whales Tracked",
            value: String(whalesTracked),
            color: "var(--color-foreground)",
          },
          {
            label: "24h Trades",
            value: String(trades24h),
            color: "var(--char-vix)",
          },
          {
            label: "Total Volume",
            value: totalVolume,
            color: "var(--color-bullish)",
          },
          {
            label: "Avg Trade Size",
            value: avgTradeSize,
            color: "var(--color-info)",
          },
        ]}
      />

      <PageScrollArea>
        {/* ── Track Form ── */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <form onSubmit={handleTrackSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              value={trackAddress}
              onChange={(e) => setTrackAddress(e.target.value)}
              placeholder="Enter wallet address to track"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-foreground)",
              }}
            />
            <button
              type="submit"
              disabled={trackMutation.isPending}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "var(--char-vix)",
                color: "var(--color-background)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {trackMutation.isPending ? "Tracking..." : "Track Whale"}
            </button>
          </form>
        </div>

        {/* ── Whale Trade List ── */}
        <PageSectionTitle title="Tracked Whales" count={whales.length} />

        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading whales...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>
            Failed to load: {(error as Error).message}
          </div>
        )}
        {!isLoading && whales.length === 0 && (
          <div
            style={{ padding: "40px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            No whales tracked
          </div>
        )}

        {!isLoading &&
          whales.map((wallet: any, i: number) => (
            <DataRow
              key={wallet.id}
              leftAccent="var(--char-vix)"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <div
                    style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-foreground)" }}
                  >
                    {wallet.label ?? truncateAddress(wallet.wallet_address)}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-muted-foreground)",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      marginTop: "4px",
                    }}
                  >
                    <span>{truncateAddress(wallet.wallet_address)}</span>
                    <Badge label={wallet.chain} color="var(--color-info)" small />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    untrackMutation.mutate({
                      walletAddress: wallet.wallet_address,
                      chain: wallet.chain,
                    })
                  }
                  disabled={untrackMutation.isPending}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-bearish)",
                    background: "transparent",
                    color: "var(--color-bearish)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Untrack
                </button>
              </div>
            </DataRow>
          ))}

        {/* ── VIX micro-moment ── */}
        <div
          style={{
            textAlign: "center",
            padding: "12px 16px 32px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--char-vix)",
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}
        >
          VIX TRACKING {whalesTracked} WHALE WALLETS
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}
