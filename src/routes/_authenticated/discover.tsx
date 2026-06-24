import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PageLayout,
  StatsRow,
  EmptyState,
  SkeletonRow,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: DiscoverPage,
});

// ── Types ────────────────────────────────────────────────────────────────────

interface TokenItem {
  symbol: string;
  name: string;
  price: number | null;
  change24h: number | null;
  volume24h: number;
  liquidity: number;
  smartMoneyPct?: number;
  risk?: string;
  chain: string;
  marketCap: number;
  discoveryScore: number;
  socialScore: number;
  liquidityScore: number;
  isHoneypot?: boolean;
  logoUrl?: string;
}

interface DiscoverResponse {
  success: boolean;
  data: TokenItem[];
  total: number;
  filteredOut?: number;
  scanDurationMs?: number;
  source?: string;
  message?: string;
  error?: string;
}

// ── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: "trending", label: "Trending" },
  { key: "volume", label: "Volume" },
  { key: "change", label: "24h %" },
  { key: "liquidity", label: "Liquidity" },
  { key: "smart", label: "Smart Money" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtPrice(p: number | null): string {
  if (p === null || p === undefined || p === 0) return "—";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

function fmtCompact(p: number): string {
  if (p >= 1_000_000_000) return `$${(p / 1_000_000_000).toFixed(2)}B`;
  if (p >= 1_000_000) return `$${(p / 1_000_000).toFixed(2)}M`;
  if (p >= 1_000) return `$${(p / 1_000).toFixed(1)}K`;
  return `$${p.toFixed(0)}`;
}

function fmtPct(p: number | null): string {
  if (p === null || p === undefined) return "—";
  const sign = p >= 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}

// ── Token Row Component ──────────────────────────────────────────────────────

function TokenRow({ token, onClick }: { token: TokenItem; onClick: () => void }) {
  const isUp = (token.change24h ?? 0) >= 0;
  const color = isUp ? "var(--color-bullish)" : "var(--color-bearish)";
  const [imgError, setImgError] = useState(false);
  const hasLogo = token.logoUrl && !imgError;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-card-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Left: Token info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: hasLogo ? "var(--color-card)" : `color-mix(in oklab, ${color} 12%, var(--color-card))`,
            border: `1px solid color-mix(in oklab, ${color} 20%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 800,
            color,
            flexShrink: 0,
            letterSpacing: "-0.02em",
            overflow: "hidden",
          }}
        >
          {hasLogo ? (
            <img
              src={token.logoUrl}
              alt={token.symbol}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            token.symbol.slice(0, 2).toUpperCase()
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-foreground)" }}>
              {token.symbol}
            </span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: "3px",
                background: "color-mix(in oklab, var(--color-muted-foreground) 15%, transparent)",
                color: "var(--color-muted-foreground)",
              }}
            >
              {token.chain}
            </span>
            {token.isHoneypot && (
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: "3px",
                  background: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                HONEYPOT
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "140px",
            }}
          >
            {token.name}
          </div>
        </div>
      </div>

      {/* Right: Price + Change + Volume + MCap */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--color-foreground)",
          }}
        >
          {fmtPrice(token.price)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color,
            }}
          >
            {fmtPct(token.change24h)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginTop: "2px" }}>
          <span style={{ fontSize: "8px", color: "var(--color-muted-foreground)" }}>
            Vol {fmtCompact(token.volume24h)}
          </span>
          {token.marketCap > 0 && (
            <span style={{ fontSize: "8px", color: "var(--color-muted-foreground)" }}>
              MC {fmtCompact(token.marketCap)}
            </span>
          )}
          {token.liquidity > 0 && (
            <span style={{ fontSize: "8px", color: "var(--color-info)" }}>
              Liq {fmtCompact(token.liquidity)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function DiscoverPage() {
  const [sortBy, setSortBy] = useState<SortKey>("trending");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", sortBy);
    params.set("sortOrder", "desc");
    params.set("limit", "50");
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [sortBy, search]);

  const { data: resp, isLoading, error, refetch } = useQuery<DiscoverResponse>({
    queryKey: ["discover", sortBy, search],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${queryParams}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const tokens = useMemo(() => {
    if (!resp?.data) return [];
    return resp.data;
  }, [resp]);

  const stats = useMemo(() => {
    const bullish = tokens.filter((t) => (t.change24h ?? 0) > 0).length;
    const bearish = tokens.filter((t) => (t.change24h ?? 0) < 0).length;
    const totalVol = tokens.reduce((sum, t) => sum + t.volume24h, 0);
    return [
      { label: "Tokens", value: String(resp?.total ?? tokens.length), color: "var(--color-primary)", icon: "🔍" },
      { label: "Bullish", value: String(bullish), color: "var(--color-bullish)", icon: "🟢" },
      { label: "Bearish", value: String(bearish), color: "var(--color-bearish)", icon: "🔴" },
      { label: "Total Vol", value: fmtCompact(totalVol), color: "var(--color-info)", icon: "📊" },
    ];
  }, [tokens, resp]);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
  }, [searchInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  return (
    <PageLayout
      title="Discover"
      badge="LIVE"
      badgeColor="var(--color-bullish)"
      description="Real-time token discovery with volume, smart money tracking, and DEX screener data."
      loading={isLoading}
      loadingColor="var(--color-bullish)"
    >
      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Search + Sort Bar */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "6px 8px",
          alignItems: "center",
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
          <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)", marginRight: "6px" }}>
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
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setSearchInput("");
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
            >
              ×
            </button>
          )}
        </div>

        {/* Sort Pills */}
        <div
          style={{
            display: "flex",
            gap: "3px",
            flexShrink: 0,
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                fontSize: "9px",
                fontWeight: sortBy === opt.key ? 700 : 500,
                padding: "5px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background:
                  sortBy === opt.key
                    ? "var(--color-primary)"
                    : "var(--color-card)",
                color:
                  sortBy === opt.key
                    ? "#000"
                    : "var(--color-muted-foreground)",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "color-mix(in oklab, var(--color-bearish) 8%, transparent)",
            borderRadius: "6px",
            margin: "0 8px",
          }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-bearish)" }}>
            {resp?.error || "Failed to load tokens. Tap to retry."}
          </span>
          <button
            onClick={() => refetch()}
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--color-bearish)",
              background: "none",
              border: "1px solid var(--color-bearish)",
              borderRadius: "4px",
              padding: "3px 10px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Token List */}
      <div style={{ padding: "4px 0" }}>
        {isLoading
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
                  onClick={() => {}}
                />
              ))
            : !error && (
                <EmptyState
                  icon="🔍"
                  title="No Tokens Found"
                  message={
                    search
                      ? `No results for "${search}". Try a different search term.`
                      : "Token scan is in progress. Check back in a moment."
                  }
                />
              )}
      </div>

      {/* Footer info */}
      {resp?.scanDurationMs && tokens.length > 0 && (
        <div
          style={{
            padding: "8px 12px",
            textAlign: "center",
            fontSize: "9px",
            color: "var(--color-muted-foreground)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          Scanned {resp.total} tokens in {(resp.scanDurationMs / 1000).toFixed(1)}s
          {resp.filteredOut !== undefined && resp.filteredOut > 0 && (
            <span> · {resp.filteredOut} filtered out</span>
          )}
          {resp.source && <span> · via {resp.source}</span>}
        </div>
      )}
    </PageLayout>
  );
}