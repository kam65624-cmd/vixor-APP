import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, EmptyState, SkeletonRow } from "@/components/vixor/PageLayout";
import { CharacterGuide } from "@/components/characters/CharacterGuide";
import { RefreshCw, X } from "lucide-react";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { PullIndicator } from "@/components/vixor/PullIndicator";
import { useDiscoverLivePrices } from "@/shared/market-data/use-discover-live-prices";
import {
  CATEGORY_TABS,
  SORT_OPTIONS,
  GOLD_BG,
  fmtCompact,
  fmtPrice,
  type TokenItem,
  type SortKey,
  type CategoryKey,
} from "./constants";
import { TokenRow } from "./TokenRow";
import { FilterPanel } from "./FilterPanel";

// ── Main Page ────────────────────────────────────────────────────────────────

export function DiscoverPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/discover" });

  // Local filter state (for the filter panel UI — before applying)
  const [filterState, setFilterState] = useState({
    minLiquidity: search.minLiquidity || "",
    minVolume: search.minVolume || "",
    honeypotOnly: search.honeypotOnly || false,
    smartMoneyMin: search.smartMoneyMin ? parseInt(search.smartMoneyMin, 10) : 0,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState(search.search || "");
  const [sortBy, setSortBy] = useState<SortKey>(search.sortBy as SortKey);
  // S1-3/S1-4 (TASK 38): fail closed — a crafted ?category=FOREX deep link
  // falls back to ALL; FOREX is no longer a valid discovery category.
  const DISCOVERY_CATEGORY_KEYS: readonly string[] = ["ALL", "MEME", "CRYPTO"];
  const initialCategory = DISCOVERY_CATEGORY_KEYS.includes(search.category as string)
    ? (search.category as CategoryKey)
    : "ALL";
  const [category, setCategory] = useState<CategoryKey>(initialCategory);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", sortBy);
    params.set("sortOrder", "desc");
    params.set("limit", "50");
    if (category && category !== "ALL") params.set("category", category);
    if (search.search?.trim()) params.set("search", search.search.trim());
    if (search.minLiquidity) params.set("minLiquidity", search.minLiquidity);
    if (search.minVolume) params.set("minVolume24h", search.minVolume);
    if (search.honeypotOnly) params.set("honeypotOnly", "true");
    if (search.smartMoneyMin) params.set("smartMoneyMin", search.smartMoneyMin);
    return params.toString();
  }, [sortBy, category, search]);

  // Stage 1 scope boundary (TASK 37 + S1-4, TASK 38): VIXOR discovery is
  // Crypto-only. The forex/"Markets" mode was fully removed — there is no
  // forex query, no forex rows and no Markets surface left in this module.

  // ── DexScreener New + Boosted tokens (real-time discover feed via client CORS) ──
  const isSearching = Boolean(search.search?.trim());
  const {
    data: cryptoData,
    isLoading: cryptoLoading,
    error: cryptoError,
    refetch: cryptoRefetch,
  } = useQuery({
    queryKey: ["discover-crypto", "dexscreener"],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.dexscreener.com/token-boosts/latest/v1");
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];

        const enriched = await Promise.allSettled(
          data.slice(0, 20).map(async (t: any) => {
            try {
              const pairRes = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${t.tokenAddress}`,
              );
              if (!pairRes.ok) return null;
              const pairJson = await pairRes.json();
              const bestPair = pairJson.pairs?.[0];
              return {
                symbol: bestPair?.baseToken?.symbol || t.tokenAddress?.slice(0, 6) || "TOKEN",
                name: bestPair?.baseToken?.name || t.description?.slice(0, 30) || "DEX Token",
                priceUsd: bestPair?.priceUsd ? parseFloat(bestPair.priceUsd) : null,
                change24h: bestPair?.priceChange?.h24 ?? null,
                volume24h: bestPair?.volume?.h24 ?? 0,
                liquidityUsd: bestPair?.liquidity?.usd ?? 0,
                chainId: t.chainId || bestPair?.chainId || "solana",
                tokenAddress: t.tokenAddress || "",
                pairAddress: bestPair?.pairAddress || null,
                url: t.url || bestPair?.url || "",
                icon: t.icon || bestPair?.info?.imageUrl || null,
                marketCap: bestPair?.marketCap ?? 0,
                isBoosted: true,
                boostAmount: t.amount || 0,
              };
            } catch {
              return null;
            }
          }),
        );
        return enriched
          .filter(
            (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null,
          )
          .map((r) => r.value);
      } catch {
        return [];
      }
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled: !isSearching,
  });

  // Merge new + boosted tokens into a flat list for the main view
  const dexTokens = useMemo<TokenItem[]>(() => {
    if (!cryptoData || !Array.isArray(cryptoData)) return [];
    return cryptoData.map((t: any) => ({
      symbol: t.symbol,
      name: t.name,
      price: t.priceUsd,
      change24h: t.change24h,
      volume24h: t.volume24h ?? 0,
      liquidity: t.liquidityUsd ?? 0,
      chain: (t.chainId || "SOL").charAt(0).toUpperCase() + (t.chainId || "SOL").slice(1),
      chainId: t.chainId,
      marketCap: t.marketCap ?? 0,
      discoveryScore: t.isBoosted ? 80 + (t.boostAmount ?? 0) : 50,
      socialScore: 0,
      liquidityScore: 0,
      logoUrl: t.icon ?? undefined,
      address: t.tokenAddress,
      pairAddress: t.pairAddress ?? undefined,
      dexUrl: t.url,
      category: t.isBoosted ? "TRENDING" : "NEW",
    }));
  }, [cryptoData]);

  // ── Direct client-side search via DexScreener public CORS API ──
  const {
    data: searchResults,
    isLoading: legacyLoading,
    error: legacyError,
    refetch: legacyRefetch,
  } = useQuery({
    queryKey: ["discover-search", search.search],
    queryFn: async () => {
      const q = search.search?.trim();
      if (!q) return [];
      try {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.pairs || !Array.isArray(data.pairs)) return [];
        return data.pairs.slice(0, 25).map((p: any) => ({
          symbol: p.baseToken?.symbol || "UNKNOWN",
          name: p.baseToken?.name || p.baseToken?.symbol || "Unknown Token",
          priceUsd: p.priceUsd ? parseFloat(p.priceUsd) : null,
          change24h: p.priceChange?.h24 ?? null,
          volume24h: p.volume?.h24 ?? 0,
          liquidityUsd: p.liquidity?.usd ?? 0,
          chainId: p.chainId || "solana",
          tokenAddress: p.baseToken?.address || "",
          pairAddress: p.pairAddress || null,
          url: p.url || `https://dexscreener.com/${p.chainId}/${p.pairAddress}`,
          icon: p.info?.imageUrl || null,
          marketCap: p.marketCap ?? 0,
        }));
      } catch {
        return [];
      }
    },
    enabled: isSearching,
    staleTime: 30_000,
  });

  const searchTokens = useMemo<TokenItem[]>(() => {
    if (!searchResults) return [];
    return searchResults.map((t: any) => ({
      symbol: t.symbol,
      name: t.name,
      price: t.priceUsd,
      change24h: t.change24h,
      volume24h: t.volume24h ?? 0,
      liquidity: t.liquidityUsd ?? 0,
      chain: (t.chainId || "SOL").charAt(0).toUpperCase() + (t.chainId || "SOL").slice(1),
      chainId: t.chainId,
      marketCap: t.marketCap ?? 0,
      discoveryScore: 75,
      socialScore: 0,
      liquidityScore: 0,
      logoUrl: t.icon ?? undefined,
      address: t.tokenAddress,
      pairAddress: t.pairAddress ?? undefined,
      dexUrl: t.url,
      category: "DEX",
    }));
  }, [searchResults]);

  // Use searchTokens when searching, fallback to dexTokens for live discover feed
  const tokens = useMemo(() => {
    if (isSearching) return searchTokens;
    return dexTokens;
  }, [isSearching, searchTokens, dexTokens]);

  const effectiveLoading = isSearching ? legacyLoading : cryptoLoading;
  const effectiveError = isSearching ? legacyError : cryptoError;
  const effectiveRefetch = isSearching ? legacyRefetch : cryptoRefetch;

  // ── Live Price Overlay (Binance WS + DexScreener polling) ──
  const liveTokens = useMemo(
    () =>
      tokens.map((t) => ({
        symbol: t.symbol,
        chainId: t.chainId,
        chain: t.chain,
        pairAddress: t.pairAddress,
      })),
    [tokens],
  );
  const { overlay: liveOverlay } = useDiscoverLivePrices({
    tokens: liveTokens,
    enabled: tokens.length > 0,
  });

  const stats = useMemo(() => {
    const bullish = tokens.filter((t) => (t.change24h ?? 0) > 0).length;
    const bearish = tokens.filter((t) => (t.change24h ?? 0) < 0).length;
    const totalVol = tokens.reduce((sum, t) => sum + t.volume24h, 0);
    return [
      {
        label: "Tokens",
        value: String(tokens.length),
        color: "var(--color-primary)",
        icon: "🔍",
      },
      {
        label: "Bullish",
        value: String(bullish),
        color: "var(--color-bullish)",
        icon: "🟢",
      },
      {
        label: "Bearish",
        value: String(bearish),
        color: "var(--color-bearish)",
        icon: "🔴",
      },
      {
        label: "Total Vol",
        value: fmtCompact(totalVol),
        color: "var(--color-info)",
        icon: "📊",
      },
    ];
  }, [tokens]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      ALL: tokens.length,
      MEME: tokens.filter((t) => t.category === "MEME" || t.chain === "sol" || t.chain === "eth")
        .length,
      CRYPTO: tokens.filter(
        (t) =>
          t.category === "CRYPTO" || ["eth", "btc", "sol", "bnb"].includes(t.symbol.toLowerCase()),
      ).length,
    };
  }, [tokens]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    navigate({
      to: "/discover",
      search: (prev: any) => ({
        ...prev,
        search: searchInput,
        sortBy,
        category,
      }),
    });
  }, [searchInput, sortBy, category, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handleSortBy = useCallback(
    (key: SortKey) => {
      setSortBy(key);
      navigate({
        to: "/discover",
        search: (prev: any) => ({ ...prev, sortBy: key }),
      });
    },
    [navigate],
  );

  const handleCategoryChange = useCallback(
    (cat: CategoryKey) => {
      setCategory(cat);
      navigate({
        to: "/discover",
        search: (prev: any) => ({ ...prev, category: cat }),
      });
    },
    [navigate],
  );

  const handleFilterChange = useCallback((key: string, value: string | number | boolean) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    navigate({
      to: "/discover",
      search: {
        ...search,
        sortBy: search.sortBy as any,
        category: search.category as any,
        minLiquidity: filterState.minLiquidity || undefined,
        minVolume: filterState.minVolume || undefined,
        honeypotOnly: filterState.honeypotOnly,
        smartMoneyMin:
          filterState.smartMoneyMin > 0 ? String(filterState.smartMoneyMin) : undefined,
      } as any,
    });
    setFiltersOpen(false);
  }, [filterState, search, navigate]);

  const handleResetFilters = useCallback(() => {
    setFilterState({
      minLiquidity: "",
      minVolume: "",
      honeypotOnly: false,
      smartMoneyMin: 0,
    });
    navigate({
      to: "/discover",
      search: {
        ...search,
        sortBy: search.sortBy as any,
        category: search.category as any,
        minLiquidity: undefined,
        minVolume: undefined,
        honeypotOnly: false,
        smartMoneyMin: undefined,
      } as any,
    });
  }, [search, navigate]);

  const handleTokenClick = useCallback(
    (token: TokenItem) => {
      navigate({
        to: "/token/$symbol",
        params: { symbol: token.symbol },
        search: {
          chain: token.chainId || token.chain.toLowerCase(),
          price: token.price != null ? String(token.price) : undefined,
          change24h: token.change24h != null ? String(token.change24h) : undefined,
          name: token.name,
          dexUrl: token.dexUrl,
          pairAddress: token.pairAddress,
        },
      } as any);
    },
    [navigate],
  );

  const handleManualRefresh = useCallback(() => {
    effectiveRefetch();
  }, [effectiveRefetch]);

  // Pull-to-refresh
  const pullToRefresh = usePullToRefresh(() => effectiveRefetch());

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      title="Discover"
      badge="ON-CHAIN"
      badgeColor="var(--color-bullish)"
      loading={effectiveLoading}
      loadingColor="var(--color-bullish)"
      banner={<CharacterGuide character="moxi" compact className="mx-4 mt-3" />}
    >
      {/* ── Workspace Switcher Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 6px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-sans)",
          }}
        >
          Market Mode
        </span>

        {/* Switcher pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "2px",
            gap: "2px",
          }}
        >
          <button
            onClick={() => handleCategoryChange("ALL")}
            style={{
              padding: "4px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.18s ease",
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "11px" }}>⚡</span>
            On-Chain
          </button>
          {/* Stage 1 scope boundary (TASK 37): the "Markets" (forex/gold)
              discovery mode was removed — VIXOR is Crypto-only. */}
        </div>
      </div>

      {/* ── Compact Stats Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 14px 10px",
          flexShrink: 0,
          flexWrap: "nowrap",
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: s.color,
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
              }}
            >
              {s.value}
            </span>
            <span
              style={{ fontSize: "10px", color: "var(--color-muted-foreground)", fontWeight: 500 }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Category Sub-Tabs (On-Chain mode — S1-4: the forex mode was removed) */}
      {
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            padding: "0 10px 8px",
            overflowX: "auto",
            flexShrink: 0,
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = category === tab.key;
            const count = categoryCounts[tab.key as keyof typeof categoryCounts];
            return (
              <button
                key={tab.key}
                onClick={() => handleCategoryChange(tab.key)}
                style={{
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 500,
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: isActive ? "1px solid var(--color-primary)" : "1px solid transparent",
                  cursor: "pointer",
                  background: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive
                    ? "var(--color-primary-foreground)"
                    : "var(--color-muted-foreground)",
                  transition: "all var(--transition-fast)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "0 5px",
                    borderRadius: "6px",
                    background: isActive ? "rgba(0,0,0,0.18)" : "var(--color-card)",
                    color: isActive
                      ? "var(--color-primary-foreground)"
                      : "var(--color-muted-foreground)",
                    fontFamily: "var(--font-mono)",
                    lineHeight: "18px",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Live indicator + refresh button */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-bullish)",
                display: "inline-block",
                animation: "vixor-pulse 1.8s ease-in-out infinite",
                boxShadow: "0 0 6px var(--color-bullish)",
                flexShrink: 0,
              }}
              aria-label="Live data"
            />
            <span
              style={{
                fontSize: "9px",
                color: "var(--color-bullish)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}
            >
              LIVE
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={effectiveLoading}
              aria-label="Refresh data"
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-muted-foreground)",
                cursor: effectiveLoading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "all var(--transition-fast)",
                flexShrink: 0,
              }}
            >
              <RefreshCw
                size={12}
                style={{
                  animation: effectiveLoading ? "spin 0.7s linear infinite" : undefined,
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          </div>
        </div>
      }

      {/* Search + Sort Bar */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "6px 8px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            padding: "0 8px",
          }}
        >
          <span
            style={{ fontSize: "12px", color: "var(--color-muted-foreground)", marginRight: "6px" }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-foreground)",
              fontSize: "11px",
              padding: "8px 0",
              fontFamily: "var(--font-sans)",
            }}
          />
          {search.search && (
            <button
              onClick={() => {
                setSearchInput("");
                navigate({
                  to: "/discover",
                  search: (prev: any) => ({ ...prev, search: "" }),
                });
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-muted-foreground)",
                cursor: "pointer",
                fontSize: "14px",
                padding: "0 2px",
                lineHeight: 1,
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Pills */}
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: "3px",
            flexShrink: 0,
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSortBy(opt.key)}
              style={{
                fontSize: "9px",
                fontWeight: sortBy === opt.key ? 700 : 500,
                padding: "5px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background: sortBy === opt.key ? "var(--color-primary)" : "var(--color-card)",
                color:
                  sortBy === opt.key
                    ? "var(--color-primary-foreground)"
                    : "var(--color-muted-foreground)",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-sans)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filterState}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
      />

      {/* Error state — subtle, not alarming (crypto only) */}
      {cryptoError && (
        <EmptyState
          icon="📡"
          title="Unable to Load"
          message="Token scan is temporarily unavailable. Pull down to retry."
        />
      )}

      {/* List area */}
      <div
        ref={pullToRefresh.containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
        className="scrollbar-hide"
        {...pullToRefresh.pullHandlers}
      >
        {/* Pull-to-refresh indicator */}
        <div style={pullToRefresh.pullIndicatorStyle}>
          <PullIndicator
            distance={pullToRefresh.pullDistance}
            isRefreshing={pullToRefresh.isRefreshing}
          />
        </div>

        {/* ── CRYPTO TOKEN LIST ── */}
        {
          <div style={{ padding: "4px 0" }}>
            {/* Top Movers / Trending Section — DexScreener live data */}
            {!effectiveLoading && dexTokens.length > 0 && (
              <div style={{ padding: "12px 14px 8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px" }}>⚡</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      {isSearching ? "Top Movers" : "New & Trending"}
                    </span>
                  </div>
                </div>
                <div
                  className="scrollbar-hide"
                  style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}
                >
                  {[...tokens]
                    .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
                    .slice(0, 8)
                    .map((t) => {
                      const isUp = (t.change24h ?? 0) >= 0;
                      const col = isUp ? "var(--color-bullish)" : "var(--color-bearish)";
                      const isNew = t.category === "NEW";
                      return (
                        <button
                          key={t.symbol + t.chain}
                          onClick={() => handleTokenClick(t)}
                          style={{
                            flexShrink: 0,
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "var(--color-card)",
                            border: `1px solid ${isUp ? "color-mix(in srgb, var(--color-bullish) 25%, transparent)" : "color-mix(in srgb, var(--color-bearish) 25%, transparent)"}`,
                            cursor: "pointer",
                            textAlign: "left",
                            minWidth: "100px",
                            backdropFilter: "blur(8px)",
                            transition: "all var(--transition-fast)",
                            boxShadow: "var(--shadow-card)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "var(--shadow-elevated)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "var(--shadow-card)";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "var(--color-foreground)",
                              }}
                            >
                              {t.symbol}
                            </div>
                            {isNew && (
                              <span
                                style={{
                                  fontSize: "7px",
                                  fontWeight: 700,
                                  color: "var(--color-gold)",
                                  background: GOLD_BG,
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                  lineHeight: 1,
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: col,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {isUp ? "+" : ""}
                            {(t.change24h ?? 0).toFixed(2)}%
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-muted-foreground)",
                              fontFamily: "var(--font-mono)",
                              marginTop: "2px",
                            }}
                          >
                            {fmtPrice(t.price)}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Divider */}
            {!effectiveLoading && tokens.length > 0 && (
              <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />
            )}

            {effectiveLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ padding: "6px 12px" }}>
                    <SkeletonRow />
                  </div>
                ))
              : tokens.length > 0
                ? tokens.map((token) => (
                    <TokenRow
                      key={token.symbol + token.chain}
                      token={token}
                      onClick={() => handleTokenClick(token)}
                      livePrice={liveOverlay[token.symbol]}
                    />
                  ))
                : !effectiveError &&
                  tokens.length === 0 && (
                    <EmptyState
                      icon={cryptoError ? "⚠" : "🔍"}
                      title={cryptoError ? "Connection Error" : "No Tokens Found"}
                      message={
                        isSearching
                          ? `No results for "${search.search}". Try a different search term.`
                          : "No new tokens right now, monitoring for new listings..."
                      }
                      action={
                        cryptoError
                          ? {
                              label: "Retry",
                              onClick: () => effectiveRefetch(),
                            }
                          : undefined
                      }
                    />
                  )}
          </div>
        }

        {/* Footer info */}
        {tokens.length > 0 && (
          <div
            style={{
              padding: "8px 12px",
              textAlign: "center",
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              borderTop: "1px solid var(--color-border)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {isSearching
              ? `Found ${tokens.length} tokens via DexScreener`
              : `${tokens.length} live tokens via DexScreener`}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
