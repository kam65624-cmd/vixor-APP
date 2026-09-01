import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  PageScrollArea,
  PageSectionTitle,
  StatsRow,
  DataRow,
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

const MOCK_TRADES: WhaleTrade[] = [
  {
    id: "wt01",
    tradeType: "BUY",
    whaleAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    whaleLabel: "Whale Alpha",
    tokenName: "NeonPulse",
    tokenSymbol: "NPULSE",
    amount: "4,200,000",
    usdValue: "$198,240",
    txHash: "0xabc123def456789012345678901234567890abcdef1234567890abcdef123456",
    timeAgo: "1m ago",
    isLarge: true,
  },
  {
    id: "wt02",
    tradeType: "SELL",
    whaleAddress: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
    whaleLabel: "Dark Wallet",
    tokenName: "GhostChain",
    tokenSymbol: "GHOST",
    amount: "1,850,000",
    usdValue: "$164,835",
    txHash: "0xdef789abc012345678901234567890abcdef012345678901234567890abcd",
    timeAgo: "3m ago",
    isLarge: false,
  },
  {
    id: "wt03",
    tradeType: "BUY",
    whaleAddress: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    whaleLabel: "Accumulator",
    tokenName: "VortexFi",
    tokenSymbol: "VTX",
    amount: "8,750,000",
    usdValue: "$117,188",
    txHash: "0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    timeAgo: "5m ago",
    isLarge: false,
  },
  {
    id: "wt04",
    tradeType: "TRANSFER",
    whaleAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    whaleLabel: "Bridge Wallet",
    tokenName: "SolarFlare",
    tokenSymbol: "SFLR",
    amount: "12,000,000",
    usdValue: "$93,960",
    txHash: "0x7890abcdef1234567890abcdef12345678abcd0123456789abcdef01234567",
    timeAgo: "7m ago",
    isLarge: false,
  },
  {
    id: "wt05",
    tradeType: "BUY",
    whaleAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    whaleLabel: "Smart Money",
    tokenName: "TitanRise",
    tokenSymbol: "TRISE",
    amount: "2,100,000",
    usdValue: "$32,760",
    txHash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    timeAgo: "10m ago",
    isLarge: false,
  },
  {
    id: "wt06",
    tradeType: "SELL",
    whaleAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    whaleLabel: "Early Holder",
    tokenName: "CryptoNinja",
    tokenSymbol: "CNINJA",
    amount: "950,000",
    usdValue: "$5,899",
    txHash: "0x234567890abcdef01234567890abcdef01234567890abcdef01234567890abcde",
    timeAgo: "14m ago",
    isLarge: false,
  },
  {
    id: "wt07",
    tradeType: "TRANSFER",
    whaleAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    whaleLabel: "Vault Transfer",
    tokenName: "DarkMatter",
    tokenSymbol: "DMT",
    amount: "5,600,000",
    usdValue: "$11,256",
    txHash: "0x34567890abcdef01234567890abcdef01234567890abcdef01234567890abcdef",
    timeAgo: "18m ago",
    isLarge: false,
  },
  {
    id: "wt08",
    tradeType: "BUY",
    whaleAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    whaleLabel: "鲸鱼 Trader",
    tokenName: "QuantumLeap",
    tokenSymbol: "QLEAP",
    amount: "3,400,000",
    usdValue: "$106,080",
    txHash: "0x456789abcdef0123456789abcdef01234567abcdef0123456789abcdef012345",
    timeAgo: "22m ago",
    isLarge: false,
  },
  {
    id: "wt09",
    tradeType: "SELL",
    whaleAddress: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    whaleLabel: "Profit Taker",
    tokenName: "NeonPulse",
    tokenSymbol: "NPULSE",
    amount: "1,200,000",
    usdValue: "$56,640",
    txHash: "0x567890abcdef01234567890abcdef012345678abcdef01234567890abcdef0123",
    timeAgo: "28m ago",
    isLarge: false,
  },
  {
    id: "wt10",
    tradeType: "BUY",
    whaleAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    whaleLabel: "Diamond Hands",
    tokenName: "NebulaX",
    tokenSymbol: "NBX",
    amount: "22,000,000",
    usdValue: "$10,032",
    txHash: "0x67890abcdef01234567890abcdef0123456789abcdef01234567890abcdef0123",
    timeAgo: "33m ago",
    isLarge: false,
  },
];

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

  const filteredTrades = MOCK_TRADES.filter((t) => {
    if (activeFilter === "All") return true;
    return filterCategory(t.tradeType) === activeFilter;
  });

  const whalesTracked = 847;
  const trades24h = MOCK_TRADES.length;
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
                color: isActive
                  ? "var(--color-background)"
                  : "var(--color-muted-foreground)",
                background: isActive
                  ? "var(--char-vix)"
                  : "transparent",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--char-vix-dim)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
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
        {/* ── Whale Trade List ── */}
        <PageSectionTitle
          title="Recent Whale Activity"
          count={filteredTrades.length}
        />

        {filteredTrades.length === 0 ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
              fontSize: "13px",
            }}
          >
            No whale trades in this category.
          </div>
        ) : (
          filteredTrades.map((trade, i) => (
            <WhaleTradeRow
              key={trade.id}
              trade={trade}
              index={i}
              onCopyHash={handleCopyHash}
              onWhaleClick={handleWhaleClick}
            />
          ))
        )}

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
          VIX TRACKING {whalesTracked} WHALE WALLETS — {trades24h} TRADES MONITORED TODAY
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Whale Trade Row ────────────────────────────────────────────────────────

interface WhaleTradeRowProps {
  trade: WhaleTrade;
  index: number;
  onCopyHash: (hash: string) => void;
  onWhaleClick: (address: string) => void;
}

const WhaleTradeRow = memo(function WhaleTradeRow({
  trade,
  index,
  onCopyHash,
  onWhaleClick,
}: WhaleTradeRowProps) {
  const tColor = tradeTypeColor(trade.tradeType);
  const tLabel = tradeTypeLabel(trade.tradeType);
  const shortAddr = truncateAddress(trade.whaleAddress);
  const shortHash = truncateHash(trade.txHash);
  const isTop = index === 0 && trade.isLarge;

  return (
    <DataRow
      leftAccent={tColor}
      style={{
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
        borderRight: isTop ? "2px solid var(--char-vix)" : undefined,
        borderTop: isTop ? "1px solid var(--char-vix-glow)" : undefined,
        borderBottom: isTop
          ? "1px solid var(--char-vix-glow)"
          : "1px solid var(--color-border)",
      }}
    >
      {/* Top line: trade type badge + whale address + token + time */}
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
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: tColor,
              background: `${tColor}14`,
              padding: "2px 8px",
              borderRadius: "4px",
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {tLabel}
          </span>
          {isTop && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--char-vix)",
                background: "var(--char-vix-dim)",
                padding: "1px 6px",
                borderRadius: "4px",
                flexShrink: 0,
              }}
            >
              LARGE
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWhaleClick(trade.whaleAddress);
            }}
            aria-label={`View wallet ${shortAddr} on explorer`}
            style={{
              minHeight: "44px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: "var(--color-info)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textUnderlineOffset: "2px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.textDecorationStyle =
                "solid";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.textDecorationStyle =
                "dotted";
            }}
          >
            {shortAddr}
          </button>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
            }}
          >
            {trade.tokenName}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
            }}
          >
            ${trade.tokenSymbol}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-muted-foreground)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          {trade.timeAgo}
        </span>
      </div>

      {/* Middle line: whale label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "6px",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: "12px",
            lineHeight: 1,
          }}
          dangerouslySetInnerHTML={{ __html: "&#x1F40B;" }}
        />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
          }}
        >
          {trade.whaleLabel}
        </span>
      </div>

      {/* Bottom line: amount + USD value + tx hash */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
          }}
        >
          Amount{" "}
          <span
            style={{
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
            }}
          >
            {trade.amount}
          </span>
        </span>
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
          }}
        >
          Value{" "}
          <span
            style={{
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: tColor,
            }}
          >
            {trade.usdValue}
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyHash(trade.txHash);
          }}
          aria-label={`Copy transaction hash`}
          style={{
            minHeight: "44px",
            fontSize: "11px",
            fontWeight: 500,
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted-foreground)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "var(--color-foreground)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "var(--color-muted-foreground)";
          }}
        >
          <span aria-hidden="true" style={{ fontSize: "11px" }}>
            &#x1F4CB;
          </span>
          {shortHash}
        </button>
      </div>
    </DataRow>
  );
});
