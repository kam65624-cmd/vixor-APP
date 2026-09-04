import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getTrendingTokens } from "@/domains/hunt/functions";
import {
  PageLayout,
  PageScrollArea,
  PageBadge,
  StatsRow,
  DataRow,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

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

  const stableTrending = useStableServerFn(getTrendingTokens);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "trending-tokens-radar",
      activeChain === "All" ? "solana" : activeChain.toLowerCase(),
    ],
    queryFn: () =>
      stableTrending({
        data: { chain: activeChain === "All" ? "solana" : activeChain.toLowerCase(), limit: 50 },
      }),
    staleTime: 60_000,
  });

  const tokens = data?.tokens ?? [];

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

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
              (e.target as HTMLInputElement).style.borderColor = "var(--char-vix)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--color-border)";
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
        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading radar...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>
            Failed to load: {(error as Error).message}
          </div>
        )}

        {!isLoading && filteredTokens.length === 0 ? (
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
          !isLoading &&
          filteredTokens.map((token, index) => {
            const isPositive = token.priceChange24h >= 0;
            const cColor = changeColor(token.priceChange24h);
            const cText = changeText(token.priceChange24h);
            const cChain = chainColor(token.chain);
            return (
              <DataRow
                key={token.address}
                onClick={() => handleTokenClick(token.address)}
                leftAccent="var(--char-vix-border)"
                style={{
                  animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
                }}
              >
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
                    <PageBadge label={token.chain} color={cChain} small />
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    ${token.price.toFixed(6)}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: cColor,
                      background: isPositive ? "var(--color-bullish)14" : "var(--color-bearish)14",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {cText}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                    Score{" "}
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-foreground)",
                      }}
                    >
                      {token.accelerationScore}
                    </span>
                  </span>
                </div>
              </DataRow>
            );
          })
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
          SCANNED 1,247 TOKENS ACROSS 4 CHAINS IN 0.8s
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}
