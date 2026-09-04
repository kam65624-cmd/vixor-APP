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

  const realSignals: AlphaSignal[] = tokens.map((token, i) => ({
    id: `sig-${token.address}-${i}`,
    type: token.accelerationLevel === "hot" ? "volume" : "momentum",
    category: token.accelerationLevel === "hot" ? "Volume" : "On-Chain",
    tokenName: token.name,
    tokenSymbol: token.symbol,
    tokenAddress: token.address,
    description: `24h volume $${(token.volume24h / 1000).toFixed(1)}k with acceleration score ${token.accelerationScore}.`,
    confidence: Math.min(99, Math.max(50, Math.round(token.accelerationScore))),
    potentialReturn: token.priceChange24h,
    timeDetected: token.priceChange1h ? "1h ago" : "Recently",
  }));

  const filteredSignals = realSignals.filter((s) => {
    if (activeCategory === "All") return true;
    return s.category === activeCategory;
  });

  const accuracy = 78.4;
  const avgReturn =
    tokens.length > 0 ? tokens.reduce((acc, t) => acc + t.priceChange24h, 0) / tokens.length : 0;
  const signalsToday = realSignals.length;

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
            value: String(realSignals.length),
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

        {/* ── Activity micro-moment ── */}
        <div
          style={{
            textAlign: "center",
            padding: "12px 16px 32px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}
        >
          DETECTED {realSignals.length} ALPHA SIGNALS — {accuracy}% ACCURACY THIS WEEK
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
