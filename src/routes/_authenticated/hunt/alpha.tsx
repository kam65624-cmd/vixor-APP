import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getTrendingTokens } from "@/domains/hunt/functions";
import type { TrendingToken } from "@/domains/hunt/functions";
import {
  PageLayout,
  PageScrollArea,
  PageBadge,
  PageSectionTitle,
  StatsRow,
  DataRow,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

type SignalType = "volume" | "whale" | "social" | "momentum";
type SignalCategory = "Volume" | "Whale" | "Social" | "On-Chain";

type HotToken = {
  rank: number;
  name: string;
  symbol: string;
  address: string;
  signalCount: number;
  totalReturn: number;
  sparkline: string;
};

type AlphaSignal = {
  id: string;
  type: SignalType;
  category: SignalCategory;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  description: string;
  confidence: number;
  potentialReturn: number;
  timeDetected: string;
};

const CATEGORY_FILTERS = ["All", "Volume", "Whale", "Social", "On-Chain"] as const;

const MOCK_HOT_TOKENS: HotToken[] = [
  {
    rank: 1,
    name: "NeonPulse",
    symbol: "NPULSE",
    address: "0xabc123def456789012345678901234567890abcd",
    signalCount: 14,
    totalReturn: 156.2,
    sparkline: "2,4,3,6,5,8,7,10,9,12,11,14,13,16,15,18,17,20,19,22",
  },
  {
    rank: 2,
    name: "VortexFi",
    symbol: "VTX",
    address: "0x4567890abcdef1234567890abcdef1234567890",
    signalCount: 11,
    totalReturn: 89.7,
    sparkline: "1,2,3,4,5,6,8,10,12,14,16,18,22,25,28,32,36,40,45,50",
  },
  {
    rank: 3,
    name: "SolarFlare",
    symbol: "SFLR",
    address: "0x234567890abcdef01234567890abcdef01234568",
    signalCount: 9,
    totalReturn: 67.9,
    sparkline: "3,4,5,6,7,9,11,13,15,17,19,22,24,27,30,33,36,39,42,45",
  },
];

const MOCK_SIGNALS: AlphaSignal[] = [
  {
    id: "sig01",
    type: "volume",
    category: "Volume",
    tokenName: "NeonPulse",
    tokenSymbol: "NPULSE",
    tokenAddress: "0xabc123def456789012345678901234567890abcd",
    description:
      "Trading volume surged 340% in the last 15 minutes with increasing buy pressure on DEX.",
    confidence: 87,
    potentialReturn: 24.5,
    timeDetected: "2m ago",
  },
  {
    id: "sig02",
    type: "whale",
    category: "Whale",
    tokenName: "VortexFi",
    tokenSymbol: "VTX",
    tokenAddress: "0x4567890abcdef1234567890abcdef1234567890",
    description:
      "Three known whale wallets accumulated 2.4M tokens in the past hour from multiple DEX pools.",
    confidence: 91,
    potentialReturn: 18.3,
    timeDetected: "5m ago",
  },
  {
    id: "sig03",
    type: "social",
    category: "Social",
    tokenName: "CryptoNinja",
    tokenSymbol: "CNINJA",
    tokenAddress: "0x567890abcdef01234567890abcdef0123456a1",
    description:
      "Mentions spiked 520% across platforms with 89% positive sentiment in the last 30 minutes.",
    confidence: 72,
    potentialReturn: 15.8,
    timeDetected: "8m ago",
  },
  {
    id: "sig04",
    type: "momentum",
    category: "On-Chain",
    tokenName: "SolarFlare",
    tokenSymbol: "SFLR",
    tokenAddress: "0x234567890abcdef01234567890abcdef01234568",
    description: "On-chain momentum score reached 94 with 12 new holders in the last 10 minutes.",
    confidence: 85,
    potentialReturn: 31.2,
    timeDetected: "12m ago",
  },
  {
    id: "sig05",
    type: "volume",
    category: "Volume",
    tokenName: "TitanRise",
    tokenSymbol: "TRISE",
    tokenAddress: "0x4567890abcdef01234567890abcdef01234569",
    description:
      "Unusual volume spike detected: 180% above 24h average with strong bid-ask balance.",
    confidence: 78,
    potentialReturn: 12.4,
    timeDetected: "15m ago",
  },
  {
    id: "sig06",
    type: "whale",
    category: "Whale",
    tokenName: "NeonPulse",
    tokenSymbol: "NPULSE",
    tokenAddress: "0xabc123def456789012345678901234567890abcd",
    description:
      "Smart money wallet moved 500K USDC into NPULSE pool, matching historical accumulation pattern.",
    confidence: 94,
    potentialReturn: 28.7,
    timeDetected: "18m ago",
  },
  {
    id: "sig07",
    type: "social",
    category: "Social",
    tokenName: "VortexFi",
    tokenSymbol: "VTX",
    tokenAddress: "0x4567890abcdef1234567890abcdef1234567890",
    description:
      "Viral tweet thread from top KOL reached 45K impressions with 78% engagement rate.",
    confidence: 68,
    potentialReturn: 11.2,
    timeDetected: "22m ago",
  },
  {
    id: "sig08",
    type: "momentum",
    category: "On-Chain",
    tokenName: "GhostChain",
    tokenSymbol: "GHOST",
    tokenAddress: "0xdef789abc012345678901234567890abcdef0123",
    description:
      "On-chain transaction velocity doubled as 8 new active wallets appeared in 5 minutes.",
    confidence: 63,
    potentialReturn: 9.8,
    timeDetected: "25m ago",
  },
  {
    id: "sig09",
    type: "volume",
    category: "Volume",
    tokenName: "DarkMatter",
    tokenSymbol: "DMT",
    tokenAddress: "0x7890abcdef1234567890abcdef12345678abcd01",
    description:
      "Volume breakout on 5-minute chart with 4 consecutive green candles and expanding range.",
    confidence: 81,
    potentialReturn: 16.5,
    timeDetected: "30m ago",
  },
  {
    id: "sig10",
    type: "whale",
    category: "Whale",
    tokenName: "QuantumLeap",
    tokenSymbol: "QLEAP",
    tokenAddress: "0x0123456789abcdef0123456789abcdef01234567",
    description:
      "Whale cluster detected: 4 coordinated buys totaling 1.2M tokens within 2 minutes.",
    confidence: 89,
    potentialReturn: 22.1,
    timeDetected: "35m ago",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function signalTypeIcon(type: SignalType): string {
  switch (type) {
    case "volume":
      return "&#x1F4C8;";
    case "whale":
      return "&#x1F40B;";
    case "social":
      return "&#x1F4E2;";
    case "momentum":
      return "&#x26A1;";
  }
}

function signalTypeLabel(type: SignalType): string {
  switch (type) {
    case "volume":
      return "VOL";
    case "whale":
      return "WHL";
    case "social":
      return "SOC";
    case "momentum":
      return "MOM";
  }
}

function signalTypeColor(type: SignalType): string {
  switch (type) {
    case "volume":
      return "var(--color-bullish)";
    case "whale":
      return "var(--char-vix)";
    case "social":
      return "var(--color-info)";
    case "momentum":
      return "var(--color-primary)";
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

function formatReturn(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/hunt/alpha")({
  head: () => ({
    meta: [{ title: "Alpha Signals — HUNT" }],
  }),
  component: AlphaSignalsPage,
});

function AlphaSignalsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedChain, setSelectedChain] = useState("solana");
  const stableTrending = useStableServerFn(getTrendingTokens);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["trending-tokens", selectedChain],
    queryFn: () => stableTrending({ data: { chain: selectedChain, limit: 20 } }),
    staleTime: 60_000,
  });

  const tokens = data?.tokens ?? [];

  const filteredSignals = MOCK_SIGNALS.filter((s) => {
    if (activeCategory === "All") return true;
    return s.category === activeCategory;
  });

  const accuracy = 78.4;
  const avgReturn = 19.1;
  const signalsToday = MOCK_SIGNALS.length;

  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
  }, []);

  const handleSignalClick = useCallback(
    (address: string) => {
      navigate({
        to: "/hunt/token/$address",
        params: { address },
      });
    },
    [navigate],
  );

  const handleHotTokenClick = useCallback(
    (address: string) => {
      navigate({
        to: "/hunt/token/$address",
        params: { address },
      });
    },
    [navigate],
  );

  return (
    <PageLayout
      title="Alpha Signals"
      badge="EARLY"
      badgeColor="var(--char-vix)"
      loadingColor="var(--char-vix)"
    >
      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Category Filter Tabs ── */}
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
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              aria-label={`Filter by ${cat}`}
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
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Stats Row ── */}
      <StatsRow
        stats={[
          {
            label: "Active Signals",
            value: String(MOCK_SIGNALS.length),
            color: "var(--char-vix)",
          },
          {
            label: "Accuracy",
            value: `${accuracy}%`,
            color: "var(--color-foreground)",
          },
          {
            label: "Avg Return",
            value: formatReturn(avgReturn),
            color: "var(--color-bullish)",
          },
          {
            label: "Today",
            value: String(signalsToday),
            color: "var(--color-info)",
          },
        ]}
      />

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
        {["solana", "ethereum", "bsc", "base"].map((chain) => {
          const isActive = selectedChain === chain;
          return (
            <button
              key={chain}
              type="button"
              onClick={() => setSelectedChain(chain)}
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
              }}
            >
              {chain.charAt(0).toUpperCase() + chain.slice(1)}
            </button>
          );
        })}
      </div>

      <PageScrollArea>
        {/* ── Hot Tokens Section ── */}
        <PageSectionTitle title="Hot Tokens" count={tokens.length} />

        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading tokens...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>
            Failed to load: {(error as Error).message}
          </div>
        )}
        {!isLoading && tokens.length === 0 && (
          <div
            style={{ padding: "40px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            No trending tokens found
          </div>
        )}

        {!isLoading &&
          tokens.map((token, index) => {
            const levelColors = {
              hot: "var(--color-bearish)",
              warm: "orange",
              cool: "var(--color-bullish)",
            } as Record<string, string>;
            return (
              <DataRow
                key={token.address}
                onClick={() => handleHotTokenClick(token.address)}
                leftAccent="var(--char-vix-border)"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "var(--char-vix-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "var(--char-vix)",
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                  >
                    #{index + 1}
                  </div>

                  {/* Token info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "4px",
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
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <PageBadge
                        label={token.accelerationLevel.toUpperCase()}
                        color={levelColors[token.accelerationLevel]}
                        small
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-bullish)",
                        }}
                      >
                        Score: {token.accelerationScore}
                      </span>
                    </div>
                  </div>
                </div>
              </DataRow>
            );
          })}

        {/* ── Signal List Section ── */}
        <PageSectionTitle title="Alpha Signals" count={filteredSignals.length} />

        {filteredSignals.length === 0 ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
              fontSize: "13px",
            }}
          >
            No signals in this category.
          </div>
        ) : (
          filteredSignals.map((signal, i) => (
            <AlphaSignalRow
              key={signal.id}
              signal={signal}
              index={i}
              onClick={() => handleSignalClick(signal.tokenAddress)}
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
          VIX DETECTED {MOCK_SIGNALS.length} ALPHA SIGNALS — {accuracy}% ACCURACY THIS WEEK
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Alpha Signal Row ───────────────────────────────────────────────────────

interface AlphaSignalRowProps {
  signal: AlphaSignal;
  index: number;
  onClick: () => void;
}

const AlphaSignalRow = memo(function AlphaSignalRow({
  signal,
  index,
  onClick,
}: AlphaSignalRowProps) {
  const typeColor = signalTypeColor(signal.type);
  const typeIcon = signalTypeIcon(signal.type);
  const typeLabel = signalTypeLabel(signal.type);

  return (
    <DataRow
      onClick={onClick}
      leftAccent="var(--char-vix-border)"
      style={{
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      {/* Top line: type badge + token name + time */}
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
            aria-hidden="true"
            style={{
              fontSize: "12px",
              lineHeight: 1,
            }}
            dangerouslySetInnerHTML={{ __html: typeIcon }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: typeColor,
              background: `${typeColor}14`,
              padding: "1px 6px",
              borderRadius: "4px",
              letterSpacing: "0.04em",
            }}
          >
            {typeLabel}
          </span>
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
            {signal.tokenName}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
            }}
          >
            ${signal.tokenSymbol}
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
          {signal.timeDetected}
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-muted-foreground)",
          lineHeight: 1.5,
          marginBottom: "8px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {signal.description}
      </div>

      {/* Confidence bar + potential return */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
              whiteSpace: "nowrap",
            }}
          >
            Confidence
          </span>
          <div
            style={{
              flex: 1,
              height: "4px",
              background: "var(--color-border)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${signal.confidence}%`,
                height: "100%",
                background: "var(--char-vix)",
                borderRadius: "2px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: "var(--char-vix)",
              flexShrink: 0,
            }}
          >
            {signal.confidence}%
          </span>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-bullish)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {formatReturn(signal.potentialReturn)}
        </span>
      </div>
    </DataRow>
  );
});
