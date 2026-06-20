"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Droplets,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Filter,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────────────────────────

interface DiscoverToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  smartMoneyPct: number;
  risk: "low" | "medium" | "high";
  chain: string;
  marketCap: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_TOKENS: DiscoverToken[] = [
  {
    symbol: "PEPE",
    name: "Pepe",
    price: 0.00001234,
    change24h: 15.3,
    volume24h: 89_400_000,
    liquidity: 120_000_000,
    smartMoneyPct: 42,
    risk: "medium",
    chain: "Ethereum",
    marketCap: 5_200_000_000,
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.1245,
    change24h: -3.2,
    volume24h: 1_200_000_000,
    liquidity: 8_500_000_000,
    smartMoneyPct: 28,
    risk: "low",
    chain: "Ethereum",
    marketCap: 18_000_000_000,
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    price: 0.00002456,
    change24h: 8.7,
    volume24h: 560_000_000,
    liquidity: 3_200_000_000,
    smartMoneyPct: 35,
    risk: "low",
    chain: "Ethereum",
    marketCap: 14_500_000_000,
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    price: 2.45,
    change24h: 22.1,
    volume24h: 340_000_000,
    liquidity: 180_000_000,
    smartMoneyPct: 55,
    risk: "high",
    chain: "Solana",
    marketCap: 2_400_000_000,
  },
  {
    symbol: "BONK",
    name: "Bonk",
    price: 0.0000289,
    change24h: -1.5,
    volume24h: 210_000_000,
    liquidity: 95_000_000,
    smartMoneyPct: 18,
    risk: "medium",
    chain: "Solana",
    marketCap: 1_900_000_000,
  },
  {
    symbol: "TURBO",
    name: "Turbo",
    price: 0.0089,
    change24h: 45.6,
    volume24h: 78_000_000,
    liquidity: 42_000_000,
    smartMoneyPct: 62,
    risk: "high",
    chain: "Ethereum",
    marketCap: 580_000_000,
  },
  {
    symbol: "MOG",
    name: "Mog Coin",
    price: 0.0000023,
    change24h: 5.2,
    volume24h: 45_000_000,
    liquidity: 38_000_000,
    smartMoneyPct: 31,
    risk: "medium",
    chain: "Ethereum",
    marketCap: 890_000_000,
  },
  {
    symbol: "BRETT",
    name: "Brett",
    price: 0.156,
    change24h: -7.8,
    volume24h: 120_000_000,
    liquidity: 65_000_000,
    smartMoneyPct: 48,
    risk: "high",
    chain: "Base",
    marketCap: 1_500_000_000,
  },
  {
    symbol: "FLOKI",
    name: "Floki Inu",
    price: 0.000178,
    change24h: 12.4,
    volume24h: 290_000_000,
    liquidity: 150_000_000,
    smartMoneyPct: 22,
    risk: "low",
    chain: "Ethereum",
    marketCap: 1_700_000_000,
  },
  {
    symbol: "POPCAT",
    name: "Popcat",
    price: 1.23,
    change24h: 33.7,
    volume24h: 95_000_000,
    liquidity: 28_000_000,
    smartMoneyPct: 71,
    risk: "high",
    chain: "Solana",
    marketCap: 1_200_000_000,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  if (price < 100) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor Web3 Terminal" }] }),
  component: DiscoverPage,
});

// ── Skeleton Card ──────────────────────────────────────────────────────────

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 space-y-3 animate-pulse"
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="size-9 rounded-full"
            style={{ backgroundColor: "var(--ws-surface-hover)" }}
          />
          <div className="space-y-1">
            <div
              className="h-3.5 w-16 rounded"
              style={{ backgroundColor: "var(--ws-surface-hover)" }}
            />
            <div
              className="h-2.5 w-10 rounded"
              style={{ backgroundColor: "var(--ws-surface-hover)" }}
            />
          </div>
        </div>
        <div className="h-5 w-14 rounded" style={{ backgroundColor: "var(--ws-surface-hover)" }} />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--ws-surface-hover)" }} />
        <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--ws-surface-hover)" }} />
        <div className="h-3 w-16 rounded" style={{ backgroundColor: "var(--ws-surface-hover)" }} />
      </div>
    </div>
  );
});

// ── Token Card ─────────────────────────────────────────────────────────────

interface TokenCardProps {
  token: DiscoverToken;
}

const TokenCard = memo(function TokenCard({ token }: TokenCardProps) {
  const isPositive = token.change24h >= 0;
  const changeColor = isPositive ? "var(--ws-bullish)" : "var(--ws-bearish)";
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  const riskConfig = {
    low: {
      label: "Low Risk",
      color: "var(--ws-bullish)",
      Icon: ShieldCheck,
      bg: "rgba(34,197,94,0.1)",
    },
    medium: {
      label: "Medium",
      color: "var(--ws-warning)",
      Icon: ShieldAlert,
      bg: "rgba(245,158,11,0.1)",
    },
    high: {
      label: "High Risk",
      color: "var(--ws-bearish)",
      Icon: ShieldX,
      bg: "rgba(239,68,68,0.1)",
    },
  } as const;

  const risk = riskConfig[token.risk];
  const RiskIcon = risk.Icon;

  return (
    <div
      className="group cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: "var(--ws-accent-dim, rgba(59,130,246,0.12))",
                color: "var(--ws-accent)",
              }}
            >
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--ws-text-primary)" }}>
                {token.symbol}
              </div>
              <div className="text-[11px]" style={{ color: "var(--ws-text-secondary)" }}>
                {token.name}
              </div>
            </div>
          </div>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{
              backgroundColor: risk.bg,
              color: risk.color,
              border: `1px solid ${risk.color}22`,
            }}
          >
            <RiskIcon className="size-3" />
            {risk.label}
          </div>
        </div>

        {/* Price & Change */}
        <div>
          <div
            className="text-lg font-bold"
            style={{
              color: "var(--ws-text-primary)",
              fontFamily: "var(--ws-mono-font-family, monospace)",
            }}
          >
            {formatPrice(token.price)}
          </div>
          <div
            className="flex items-center gap-1 text-xs font-semibold mt-0.5"
            style={{ color: changeColor }}
          >
            <ChangeIcon className="size-3" />
            {isPositive ? "+" : ""}
            {token.change24h.toFixed(1)}%
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <BarChart3
              className="size-3"
              style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
            />
            <span style={{ color: "var(--ws-text-secondary)" }}>Vol</span>
            <span
              className="font-semibold ml-auto"
              style={{
                color: "var(--ws-text-primary)",
                fontFamily: "var(--ws-mono-font-family, monospace)",
              }}
            >
              {formatLargeNum(token.volume24h)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Droplets
              className="size-3"
              style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
            />
            <span style={{ color: "var(--ws-text-secondary)" }}>Liq</span>
            <span
              className="font-semibold ml-auto"
              style={{
                color: "var(--ws-text-primary)",
                fontFamily: "var(--ws-mono-font-family, monospace)",
              }}
            >
              {formatLargeNum(token.liquidity)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Flame
              className="size-3"
              style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
            />
            <span style={{ color: "var(--ws-text-secondary)" }}>Smart $</span>
            <span
              className="font-semibold ml-auto"
              style={{
                color: "var(--ws-accent)",
                fontFamily: "var(--ws-mono-font-family, monospace)",
              }}
            >
              {token.smartMoneyPct}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span style={{ color: "var(--ws-text-secondary)" }}>MCap</span>
            <span
              className="font-semibold ml-auto"
              style={{
                color: "var(--ws-text-primary)",
                fontFamily: "var(--ws-mono-font-family, monospace)",
              }}
            >
              {formatLargeNum(token.marketCap)}
            </span>
          </div>
        </div>

        {/* Chain Badge */}
        <div className="pt-1 border-t" style={{ borderColor: "var(--ws-border)" }}>
          <span
            className="inline-block text-[10px] font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: "var(--ws-surface-hover)",
              color: "var(--ws-text-secondary)",
            }}
          >
            {token.chain}
          </span>
        </div>
      </div>
    </div>
  );
});

// ── Filter Sidebar ─────────────────────────────────────────────────────────

interface FilterSidebarProps {
  chain: string;
  onChainChange: (chain: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const FilterSidebar = memo(function FilterSidebar({
  chain,
  onChainChange,
  sortBy,
  onSortChange,
}: FilterSidebarProps) {
  const chains = ["All Chains", "Ethereum", "Solana", "Base", "Arbitrum"];
  const sortOptions = [
    { value: "trending", label: "Trending" },
    { value: "volume", label: "Volume" },
    { value: "change", label: "24h Change" },
    { value: "liquidity", label: "Liquidity" },
    { value: "smart", label: "Smart Money" },
  ];

  return (
    <div
      className="w-full lg:w-56 flex-shrink-0 space-y-4"
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: "var(--ws-border)" }}>
        <div className="flex items-center gap-2">
          <Filter className="size-4" style={{ color: "var(--ws-accent)" }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--ws-text-primary)" }}
          >
            Filters
          </span>
        </div>
      </div>

      {/* Chain Filter */}
      <div className="px-4 pb-3">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--ws-text-secondary)" }}
        >
          Chain
        </div>
        <div className="space-y-1">
          {chains.map((c) => (
            <button
              key={c}
              onClick={() => onChainChange(c)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  chain === c ? "var(--ws-accent-dim, rgba(59,130,246,0.12))" : "transparent",
                color: chain === c ? "var(--ws-accent)" : "var(--ws-text-secondary)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="px-4 pb-4">
        <div
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: "var(--ws-text-secondary)" }}
        >
          <ArrowUpDown className="size-3" />
          Sort By
        </div>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  sortBy === opt.value
                    ? "var(--ws-accent-dim, rgba(59,130,246,0.12))"
                    : "transparent",
                color: sortBy === opt.value ? "var(--ws-accent)" : "var(--ws-text-secondary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Search Bar ─────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar = memo(function SearchBar({ value, onChange }: SearchBarProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
        style={{ color: "var(--ws-text-secondary)" }}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search tokens..."
        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors placeholder:opacity-40"
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          color: "var(--ws-text-primary)",
          borderRadius: "var(--ws-radius)",
        }}
      />
    </div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────

function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [chain, setChain] = useState("All Chains");
  const [sortBy, setSortBy] = useState("trending");

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleChainChange = useCallback((c: string) => setChain(c), []);
  const handleSortChange = useCallback((s: string) => setSortBy(s), []);

  const { data: tokens, isLoading } = useQuery<DiscoverToken[]>({
    queryKey: ["discover-tokens"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/discover");
        const data = await res.json();
        return data as DiscoverToken[];
      } catch {
        return MOCK_TOKENS;
      }
    },
    refetchInterval: 30000,
  });

  // Filter & sort
  const filteredTokens = (() => {
    if (!tokens) return [];
    let result = [...tokens];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
      );
    }

    // Chain filter
    if (chain !== "All Chains") {
      result = result.filter((t) => t.chain === chain);
    }

    // Sort
    switch (sortBy) {
      case "volume":
        result.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case "change":
        result.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        break;
      case "liquidity":
        result.sort((a, b) => b.liquidity - a.liquidity);
        break;
      case "smart":
        result.sort((a, b) => b.smartMoneyPct - a.smartMoneyPct);
        break;
      default:
        // trending — default order
        break;
    }

    return result;
  })();

  return (
    <div
      className="space-y-4"
      style={{ backgroundColor: "var(--ws-bg)", color: "var(--ws-text-primary)" }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--ws-text-primary)" }}
          >
            Discover
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--ws-text-secondary)" }}>
            Real-time memecoin discovery &middot; Updates every 30s
          </p>
        </div>
        <SearchBar value={search} onChange={handleSearchChange} />
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-4">
        <FilterSidebar
          chain={chain}
          onChainChange={handleChainChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        {/* Token Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium" style={{ color: "var(--ws-text-secondary)" }}>
              {filteredTokens.length} tokens found
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
            >
              Auto-refresh: 30s
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTokens.map((token) => (
                <TokenCard key={token.symbol} token={token} />
              ))}
            </div>
          )}

          {filteredTokens.length === 0 && !isLoading && (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{
                backgroundColor: "var(--ws-surface)",
                borderRadius: "var(--ws-radius)",
                border: "1px solid var(--ws-border)",
              }}
            >
              <Search
                className="size-8 mb-3"
                style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
              />
              <p className="text-sm font-medium" style={{ color: "var(--ws-text-secondary)" }}>
                No tokens match your filters
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
              >
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
