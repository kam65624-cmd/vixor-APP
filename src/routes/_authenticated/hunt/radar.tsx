import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  PageScrollArea,
  PageBadge,
  StatsRow,
  DataRow,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

type TokenRadarItem = {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  price: string;
  change24h: number;
  volume: string;
  sparkline: string;
};

const MOCK_TOKENS: TokenRadarItem[] = [
  {
    id: "0xabc123def456789012345678901234567890abcd",
    name: "NeonPulse",
    symbol: "NPULSE",
    chain: "Solana",
    price: "$0.00472",
    change24h: 34.7,
    volume: "$1.2M",
    sparkline: "2,4,3,6,5,8,7,10,9,12,11,14,13,16,15,18,17,20,19,22",
  },
  {
    id: "0xdef789abc012345678901234567890abcdef0123",
    name: "GhostChain",
    symbol: "GHOST",
    chain: "ETH",
    price: "$0.0891",
    change24h: -12.3,
    volume: "$890K",
    sparkline: "18,16,17,14,15,12,13,10,11,8,9,7,8,6,7,5,6,4,5,3",
  },
  {
    id: "0x4567890abcdef1234567890abcdef1234567890",
    name: "VortexFi",
    symbol: "VTX",
    chain: "Base",
    price: "$0.00134",
    change24h: 156.2,
    volume: "$3.4M",
    sparkline: "1,2,3,4,5,6,8,10,12,14,16,18,22,25,28,32,36,40,45,50",
  },
  {
    id: "0x7890abcdef1234567890abcdef12345678abcd01",
    name: "DarkMatter",
    symbol: "DMT",
    chain: "BSC",
    price: "$0.00201",
    change24h: 8.5,
    volume: "$567K",
    sparkline: "10,11,10,12,11,13,12,14,13,15,14,16,15,17,16,18,17,19,18,20",
  },
  {
    id: "0x0123456789abcdef0123456789abcdef01234567",
    name: "QuantumLeap",
    symbol: "QLEAP",
    chain: "Solana",
    price: "$0.0312",
    change24h: -3.1,
    volume: "$2.1M",
    sparkline: "20,19,20,18,19,17,18,16,17,15,16,14,15,14,15,13,14,12,13,12",
  },
  {
    id: "0x234567890abcdef01234567890abcdef01234568",
    name: "SolarFlare",
    symbol: "SFLR",
    chain: "ETH",
    price: "$0.00783",
    change24h: 67.9,
    volume: "$4.5M",
    sparkline: "3,4,5,6,7,9,11,13,15,17,19,22,24,27,30,33,36,39,42,45",
  },
  {
    id: "0x34567890abcdef01234567890abcdef01234569",
    name: "NebulaX",
    symbol: "NBX",
    chain: "Base",
    price: "$0.000456",
    change24h: -22.4,
    volume: "$234K",
    sparkline: "30,28,29,26,27,24,25,22,23,20,21,18,19,17,18,15,16,14,15,13",
  },
  {
    id: "0x4567890abcdef01234567890abcdef0123456a0",
    name: "TitanRise",
    symbol: "TRISE",
    chain: "Solana",
    price: "$0.0156",
    change24h: 12.8,
    volume: "$1.8M",
    sparkline: "8,9,8,10,9,11,10,12,11,13,12,14,13,15,14,16,15,17,16,18",
  },
  {
    id: "0x567890abcdef01234567890abcdef0123456a1",
    name: "CryptoNinja",
    symbol: "CNINJA",
    chain: "BSC",
    price: "$0.00621",
    change24h: 89.3,
    volume: "$2.7M",
    sparkline: "2,3,4,5,7,9,11,14,17,20,23,27,31,35,40,44,49,54,59,65",
  },
  {
    id: "0x67890abcdef01234567890abcdef0123456a2",
    name: "ShadowFox",
    symbol: "SFOX",
    chain: "ETH",
    price: "$0.0298",
    change24h: -5.6,
    volume: "$780K",
    sparkline: "22,21,22,20,21,19,20,18,19,17,18,16,17,15,16,14,15,13,14,13",
  },
];

const CHAIN_FILTERS = ["All", "Solana", "ETH", "BSC", "Base"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function changeColor(change: number): string {
  return change >= 0 ? "var(--color-bullish)" : "var(--color-bearish)";
}

function changeText(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function chainColor(chain: string): string {
  switch (chain) {
    case "Solana":
      return "var(--char-vix)";
    case "ETH":
      return "var(--color-info)";
    case "BSC":
      return "var(--color-bullish)";
    case "Base":
      return "var(--color-primary)";
    default:
      return "var(--color-muted-foreground)";
  }
}

function buildSparklinePoints(data: string, w: number, h: number): string {
  const vals = data.split(",").map(Number);
  if (vals.length === 0) return "";
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const step = w / (vals.length - 1);
  return vals
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/hunt/radar")({
  head: () => ({
    meta: [{ title: "Token Radar — HUNT" }],
  }),
  component: TokenRadarPage,
});

function TokenRadarPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChain, setActiveChain] = useState<string>("All");

  const filteredTokens = MOCK_TOKENS.filter((t) => {
    const matchesChain =
      activeChain === "All" || t.chain === activeChain;
    const matchesSearch =
      searchQuery === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChain && matchesSearch;
  });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const handleChainChange = useCallback((chain: string) => {
    setActiveChain(chain);
  }, []);

  const handleTokenClick = useCallback(
    (tokenId: string) => {
      navigate({
        to: "/hunt/token/$address",
        params: { address: tokenId },
      });
    },
    [navigate],
  );

  return (
    <PageLayout
      title="Token Radar"
      badge="HUNT"
      badgeColor="var(--char-vix)"
      loadingColor="var(--char-vix)"
    >
      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Search Input ── */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "12px",
              fontSize: "14px",
              color: "var(--color-muted-foreground)",
              pointerEvents: "none",
            }}
          >
            &#x1F50D;
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tokens by name or symbol..."
            aria-label="Search tokens"
            style={{
              width: "100%",
              minHeight: "44px",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-foreground)",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "0 12px 0 38px",
              outline: "none",
              fontFamily: "var(--font-sans)",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "var(--char-vix)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor =
                "var(--color-border)";
            }}
          />
        </div>
      </div>

      {/* ── Chain Filter Tabs ── */}
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
        {CHAIN_FILTERS.map((chain) => {
          const isActive = activeChain === chain;
          return (
            <button
              key={chain}
              type="button"
              onClick={() => handleChainChange(chain)}
              aria-label={`Filter by ${chain}`}
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
              {chain}
            </button>
          );
        })}
      </div>

      {/* ── Stats Row ── */}
      <StatsRow
        stats={[
          {
            label: "Tokens Tracked",
            value: "1,247",
            color: "var(--color-foreground)",
          },
          {
            label: "New Today",
            value: "38",
            color: "var(--char-vix)",
          },
          {
            label: "Trending",
            value: "12",
            color: "var(--color-bullish)",
          },
          {
            label: "Watchlist",
            value: "5",
            color: "var(--color-info)",
          },
        ]}
      />

      {/* ── Token List ── */}
      <PageScrollArea>
        {filteredTokens.length === 0 ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
              fontSize: "13px",
            }}
          >
            No tokens match your search.
          </div>
        ) : (
          filteredTokens.map((token, i) => (
            <TokenRadarRow
              key={token.id}
              token={token}
              index={i}
              onClick={() => handleTokenClick(token.id)}
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
          VIX SCANNED 1,247 TOKENS ACROSS 4 CHAINS IN 0.8s
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Token Radar Row ────────────────────────────────────────────────────────

interface TokenRadarRowProps {
  token: TokenRadarItem;
  index: number;
  onClick: () => void;
}

const TokenRadarRow = memo(function TokenRadarRow({
  token,
  index,
  onClick,
}: TokenRadarRowProps) {
  const sparkPoints = buildSparklinePoints(token.sparkline, 60, 24);
  const isPositive = token.change24h >= 0;
  const cColor = changeColor(token.change24h);
  const cText = changeText(token.change24h);
  const cChain = chainColor(token.chain);

  return (
    <DataRow
      onClick={onClick}
      leftAccent="var(--char-vix-border)"
      style={{
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      {/* Top line: name + sparkline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
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
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {token.name}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
            }}
          >
            ${token.symbol}
          </span>
          <PageBadge
            label={token.chain}
            color={cChain}
            small
          />
        </div>

        {/* Sparkline SVG placeholder */}
        <svg
          width="60"
          height="24"
          viewBox="0 0 60 24"
          aria-hidden="true"
          style={{ flexShrink: 0, marginLeft: "8px" }}
        >
          <polyline
            points={sparkPoints}
            fill="none"
            stroke={cColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Bottom line: price, change, volume */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-foreground)",
          }}
        >
          {token.price}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: cColor,
            background: isPositive
              ? "var(--color-bullish)14"
              : "var(--color-bearish)14",
            padding: "2px 8px",
            borderRadius: "4px",
          }}
        >
          {cText}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
          }}
        >
          Vol{" "}
          <span
            style={{
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
            }}
          >
            {token.volume}
          </span>
        </span>
      </div>
    </DataRow>
  );
});
