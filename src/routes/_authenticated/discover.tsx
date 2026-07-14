import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useRef, useEffect, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, StatsRow, EmptyState, SkeletonRow } from "@/components/vixor/PageLayout";
import { RefreshCw, SlidersHorizontal, ChevronUp, X, Link2 } from "lucide-react";
import { withAlpha, blendWithCard } from "@/shared/color-utils";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh";
import { PullIndicator } from "@/components/vixor/PullIndicator";
import {
  useDiscoverLivePrices,
  type LivePriceOverlay,
} from "@/shared/market-data/use-discover-live-prices";
import {
  getLiveForexDiscoverData,
  FOREX_TOTAL_COUNT,
  FOREX_MAJOR_COUNT,
  FOREX_MINOR_COUNT,
  type ForexPair,
} from "./-discover-forex-data";

// ── Route definition with typed search params ───────────────────────────────

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: DiscoverPage,
  validateSearch: (search) => ({
    category: (search.category as string) || "ALL",
    sortBy: (search.sortBy as string) || "trending",
    search: (search.search as string) || "",
    minLiquidity: search.minLiquidity as string | undefined,
    minVolume: search.minVolume as string | undefined,
    honeypotOnly: search.honeypotOnly === "true",
    smartMoneyMin: search.smartMoneyMin as string | undefined,
  }),
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
  chainId?: string;
  marketCap: number;
  discoveryScore: number;
  socialScore: number;
  liquidityScore: number;
  isHoneypot?: boolean;
  logoUrl?: string;
  sparkline?: number[];
  category?: string;
  address?: string;
  pairAddress?: string;
  dexUrl?: string;
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
  categoryCounts?: Record<string, number>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { key: "ALL", label: "All" },
  { key: "MEME", label: "Meme" },
  { key: "CRYPTO", label: "Crypto" },
  { key: "FOREX", label: "Forex" },
] as const;

const SORT_OPTIONS = [
  { key: "trending", label: "Trending" },
  { key: "volume", label: "Volume" },
  { key: "change", label: "24h %" },
  { key: "liquidity", label: "Liquidity" },
  { key: "smart", label: "Smart Money" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];
type CategoryKey = (typeof CATEGORY_TABS)[number]["key"];

// ── Gold accent colour (static RGBA for Safari compat) ───────────────────
const GOLD_COLOR = "#D4A843";
const GOLD_BG = "rgba(212,168,67,0.12)";
const GOLD_BORDER = "rgba(212,168,67,0.25)";

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

function fmtTimeAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

// ── Inline SVG Sparkline ────────────────────────────────────────────────────

function SparklineSVG({
  data,
  width = 56,
  height = 20,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const isUp = data.length >= 2 && data[data.length - 1] >= data[0];
  const strokeColor = color || (isUp ? "var(--color-bullish)" : "var(--color-bearish)");

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`spark-grad-${isUp ? "up" : "dn"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill={`url(#spark-grad-${isUp ? "up" : "dn"})`}
      />
      {/* Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Smart Money Bar ──────────────────────────────────────────────────────────

// ── Forex formatters ────────────────────────────────────────────────────────

function fmtForexPrice(p: number | null): string {
  if (p === null) return "—";
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(5);
}

// ── Forex Section Header ────────────────────────────────────────────────────

function ForexSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div
      style={{
        padding: "10px 12px 4px",
        fontSize: "9px",
        fontWeight: 700,
        color: "var(--color-muted-foreground)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span
        style={{
          width: "2px",
          height: "10px",
          borderRadius: "1px",
          background: "var(--color-primary)",
          display: "inline-block",
        }}
      />
      {title}
      <span style={{ fontSize: "8px", color: "var(--color-muted-foreground)", opacity: 0.7 }}>
        ({count})
      </span>
    </div>
  );
}

// ── Forex Pair Row ──────────────────────────────────────────────────────────

function ForexPairRow({ item, onClick }: { item: ForexPair; onClick: () => void }) {
  const changeVal = item.change24h ?? 0;
  const hasChange = item.change24h !== null;
  const isUp = hasChange && changeVal >= 0;
  const color = !hasChange
    ? "var(--color-muted-foreground)"
    : isUp
      ? "var(--color-bullish)"
      : "var(--color-bearish)";
  const isGold = item.type === "gold";
  const accentColor = isGold ? GOLD_COLOR : color;
  const badgeBg = isGold ? GOLD_BG : "rgba(163,163,163,0.15)";
  const badgeColor = isGold ? GOLD_COLOR : "var(--color-muted-foreground)";
  const hasSparkline = item.sparkline && item.sparkline.length >= 2;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background 0.12s",
        ...(isGold
          ? {
              background: "linear-gradient(90deg, rgba(212,168,67,0.04) 0%, transparent 60%)",
            }
          : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isGold
          ? "linear-gradient(90deg, rgba(212,168,67,0.08) 0%, var(--color-card-hover) 60%)"
          : "var(--color-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isGold
          ? "linear-gradient(90deg, rgba(212,168,67,0.04) 0%, transparent 60%)"
          : "transparent";
      }}
    >
      {/* Left: Pair info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: isGold ? "10px" : "50%",
            background: isGold ? GOLD_BG : blendWithCard(accentColor, 0.12),
            border: `1px solid ${isGold ? GOLD_BORDER : withAlpha(accentColor, 0.2)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isGold ? "14px" : "10px",
            fontWeight: 800,
            color: accentColor,
            flexShrink: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {isGold ? " Au " : item.pair.slice(0, 3)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: isGold ? GOLD_COLOR : "var(--color-foreground)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {isGold ? "Gold" : item.pair}
            </span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: "3px",
                background: badgeBg,
                color: badgeColor,
              }}
            >
              {item.badge}
            </span>
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "140px",
              marginTop: "1px",
            }}
          >
            {item.name}
          </div>
        </div>
      </div>

      {/* Center: Sparkline */}
      {hasSparkline && (
        <div style={{ flexShrink: 0, margin: "0 12px", opacity: 0.85 }}>
          <SparklineSVG data={item.sparkline!} color={isGold ? GOLD_COLOR : undefined} />
        </div>
      )}

      {/* Right: Price + Change + Volume */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: isGold ? GOLD_COLOR : "var(--color-foreground)",
          }}
        >
          {fmtForexPrice(item.price)}
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color,
          }}
        >
          {hasChange ? fmtPct(changeVal) : "—"}
        </span>
        <div
          style={{
            fontSize: "8px",
            color: "var(--color-muted-foreground)",
            marginTop: "2px",
          }}
        >
          OTC
        </div>
      </div>
    </div>
  );
}

function SmartMoneyBar({ pct }: { pct?: number }) {
  if (pct === undefined || pct === null) return null;
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 50
      ? "var(--color-bullish)"
      : clamped >= 25
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "1px" }}>
      <div
        style={{
          width: "40px",
          height: "2.5px",
          borderRadius: "2px",
          background: "var(--color-border)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: color,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "7px",
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          color,
          lineHeight: 1,
        }}
      >
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

// ── NEW Badge ─────────────────────────────────────────────────────────────────

function NewBadge() {
  return (
    <span
      style={{
        fontSize: "7px",
        fontWeight: 800,
        padding: "1px 4px",
        borderRadius: "3px",
        background: "var(--color-bullish)",
        color: "#04150D",
        letterSpacing: "0.04em",
        lineHeight: 1,
        animation: "pulse-dot 2s ease-in-out infinite",
      }}
    >
      NEW
    </span>
  );
}

// ── Token Row Component ──────────────────────────────────────────────────────

function TokenRow({
  token,
  onClick,
  livePrice,
}: {
  token: TokenItem;
  onClick: () => void;
  livePrice?: LivePriceOverlay[string];
}) {
  // Use live price if available, otherwise fall back to API price
  const displayPrice = livePrice?.price ?? token.price;
  const displayChange = livePrice?.change24h ?? token.change24h;
  const isUp = (displayChange ?? 0) >= 0;
  const color = isUp ? "var(--color-bullish)" : "var(--color-bearish)";
  const [imgError, setImgError] = useState(false);
  const prevPriceRef = useRef<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);

  // Flash effect when live price changes
  useEffect(() => {
    if (livePrice && prevPriceRef.current !== null && livePrice.price !== prevPriceRef.current) {
      const flash = livePrice.price > prevPriceRef.current ? "up" : "down";
      setPriceFlash(flash);
      const timer = setTimeout(() => setPriceFlash(null), 400);
      return () => clearTimeout(timer);
    }
    if (livePrice) prevPriceRef.current = livePrice.price;
  }, [livePrice]);
  const hasLogo = token.logoUrl && !imgError;
  const isNew = token.discoveryScore > 80;
  const hasSparkline = token.sparkline && token.sparkline.length >= 2;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(124,155,196,0.06)";
        e.currentTarget.style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      {/* Left: Token info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: hasLogo ? "var(--color-card)" : blendWithCard(color, 0.15),
            border: `1.5px solid ${withAlpha(color, 0.3)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 800,
            color,
            flexShrink: 0,
            letterSpacing: "-0.02em",
            overflow: "hidden",
            boxShadow: `0 0 12px ${withAlpha(color, 0.15)}`,
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
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {token.symbol}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: "4px",
                background: "rgba(163,163,163,0.12)",
                color: "var(--color-muted-foreground)",
              }}
            >
              {token.chain}
            </span>
            {token.isHoneypot && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                ⚠ HONEYPOT
              </span>
            )}
            {isNew && <NewBadge />}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-muted-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "150px",
              marginTop: "2px",
            }}
          >
            {token.name}
          </div>
          {/* Smart Money Bar */}
          {token.smartMoneyPct !== undefined && token.smartMoneyPct !== null && (
            <SmartMoneyBar pct={token.smartMoneyPct} />
          )}
        </div>
      </div>

      {/* Center: Sparkline */}
      {hasSparkline && (
        <div style={{ flexShrink: 0, margin: "0 12px", opacity: 0.85 }}>
          <SparklineSVG data={token.sparkline!} />
        </div>
      )}

      {/* Right: Price + Change + Volume */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--color-foreground)",
          }}
        >
          <span
            style={{
              color:
                priceFlash === "up"
                  ? "var(--color-bullish)"
                  : priceFlash === "down"
                    ? "var(--color-bearish)"
                    : "var(--color-foreground)",
              transition: "color 0.3s ease",
            }}
          >
            {fmtPrice(displayPrice)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: "flex-end",
            marginTop: "3px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color,
              background: `${color}18`,
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {fmtPct(displayChange)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "flex-end",
            marginTop: "3px",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
            Vol {fmtCompact(token.volume24h)}
          </span>
          {token.marketCap > 0 && (
            <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
              MC {fmtCompact(token.marketCap)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Filter Panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  isOpen,
  onToggle,
}: {
  filters: {
    minLiquidity: string;
    minVolume: string;
    honeypotOnly: boolean;
    smartMoneyMin: number;
  };
  onChange: (key: string, value: string | number | boolean) => void;
  onApply: () => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const inputStyle: CSSProperties = {
    flex: 1,
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    padding: "7px 10px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "var(--color-foreground)",
    outline: "none",
    minWidth: 0,
  };

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Filter toggle button */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "10px",
          fontWeight: 600,
          padding: "5px 10px",
          borderRadius: "5px",
          border: "1px solid var(--color-border)",
          cursor: "pointer",
          background: isOpen ? "var(--color-primary)" : "var(--color-card)",
          color: isOpen ? "#000" : "var(--color-muted-foreground)",
          transition: "all 0.15s ease",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <SlidersHorizontal size={11} />
        Filters
        <ChevronUp
          size={11}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
        {(filters.minLiquidity ||
          filters.minVolume ||
          filters.honeypotOnly ||
          filters.smartMoneyMin > 0) && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isOpen ? "#000" : "var(--color-bullish)",
            }}
          />
        )}
      </button>

      {/* Expandable panel */}
      {isOpen && (
        <div
          style={{
            marginTop: "6px",
            padding: "10px 12px",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Row 1: Min Liquidity + Min Volume */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Min Liquidity ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={filters.minLiquidity}
                onChange={(e) => onChange("minLiquidity", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Min Volume ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={filters.minVolume}
                onChange={(e) => onChange("minVolume", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 2: Honeypot toggle + Smart Money slider */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            {/* Honeypot Only toggle */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Honeypot Only
              </label>
              <button
                onClick={() => onChange("honeypotOnly", !filters.honeypotOnly)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${filters.honeypotOnly ? "var(--color-bearish)" : "var(--color-border)"}`,
                  background: filters.honeypotOnly
                    ? "rgba(246, 70, 93, 0.15)"
                    : "var(--color-card)",
                  color: filters.honeypotOnly
                    ? "var(--color-bearish)"
                    : "var(--color-muted-foreground)",
                  fontSize: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                {filters.honeypotOnly ? "ON" : "OFF"}
              </button>
            </div>

            {/* Smart Money slider */}
            <div style={{ flex: 2 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span>Smart Money &gt;</span>
                <span
                  style={{
                    color: "var(--color-foreground)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {filters.smartMoneyMin}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.smartMoneyMin}
                onChange={(e) => onChange("smartMoneyMin", parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  height: "4px",
                  WebkitAppearance: "none",
                  appearance: "none",
                  background: `linear-gradient(to right, var(--color-bullish) 0%, var(--color-bullish) ${filters.smartMoneyMin}%, var(--color-border) ${filters.smartMoneyMin}%, var(--color-border) 100%)`,
                  borderRadius: "2px",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              onClick={onReset}
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "5px",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                background: "transparent",
                color: "var(--color-muted-foreground)",
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: "all 0.12s ease",
              }}
            >
              Reset
            </button>
            <button
              onClick={onApply}
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "6px 18px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                background: "var(--color-primary)",
                color: "#000",
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: "all 0.12s ease",
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function DiscoverPage() {
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
  const [category, setCategory] = useState<CategoryKey>(search.category as CategoryKey);

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

  const isForexMode = category === "FOREX";

  const {
    data: resp,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<DiscoverResponse>({
    queryKey: [
      "discover",
      sortBy,
      search.search,
      category,
      search.minLiquidity,
      search.minVolume,
      search.honeypotOnly,
      search.smartMoneyMin,
    ],
    queryFn: async () => {
      const res = await fetch(`/api/discover?${queryParams}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 5_000,
    staleTime: 3_000,
    enabled: !isForexMode,
  });

  const tokens = useMemo(() => {
    if (!resp?.data) return [];
    return resp.data;
  }, [resp]);

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
    enabled: !isForexMode && tokens.length > 0,
  });

  const stats = useMemo(() => {
    if (isForexMode) {
      const forexItems = forexQuery.data ?? [];
      const bullish = forexItems.filter((p) => (p.change24h ?? 0) > 0).length;
      const bearish = forexItems.filter((p) => (p.change24h ?? 0) < 0).length;
      return [
        {
          label: "Pairs",
          value: String(FOREX_TOTAL_COUNT),
          color: GOLD_COLOR,
          icon: "💱",
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
          label: "Live",
          value: "API",
          color: "var(--color-info)",
          icon: "📊",
        },
      ];
    }
    const bullish = tokens.filter((t) => (t.change24h ?? 0) > 0).length;
    const bearish = tokens.filter((t) => (t.change24h ?? 0) < 0).length;
    const totalVol = tokens.reduce((sum, t) => sum + t.volume24h, 0);
    return [
      {
        label: "Tokens",
        value: String(resp?.total ?? tokens.length),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, resp, isForexMode]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const base = resp?.categoryCounts || {};
    return {
      ALL: resp?.total ?? tokens.length,
      MEME:
        base.MEME ??
        tokens.filter((t) => t.category === "MEME" || t.chain === "sol" || t.chain === "eth")
          .length,
      CRYPTO:
        base.CRYPTO ??
        tokens.filter(
          (t) =>
            t.category === "CRYPTO" ||
            ["eth", "btc", "sol", "bnb"].includes(t.symbol.toLowerCase()),
        ).length,
      FOREX: FOREX_TOTAL_COUNT,
    };
  }, [resp, tokens]);

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

  // Forex pair click — show "connect broker" toast via Telegram WebApp
  const [brokerToast, setBrokerToast] = useState<string | null>(null);
  const brokerToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleForexClick = useCallback(
    (pair: ForexPair) => {
      navigate({ to: "/token/$symbol", params: { symbol: pair.pair } } as any);
    },
    [navigate],
  );

  // Live forex data query (prices, change24h, sparklines from real APIs)
  const fetchForexDiscover = useStableServerFn(getLiveForexDiscoverData);
  const forexQuery = useQuery({
    queryKey: ["live-forex-discover-data"],
    queryFn: () => fetchForexDiscover(),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Sorted forex pairs (live data from server)
  const sortedForexPairs = useMemo(() => {
    if (!forexQuery.data) return [];
    const pairs = [...forexQuery.data];
    switch (sortBy) {
      case "change":
        pairs.sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
        break;
      default:
        // "trending" / "volume" — gold first (default order from server)
        break;
    }
    // Apply search filter
    if (search.search?.trim()) {
      const q = search.search.trim().toLowerCase();
      return pairs.filter(
        (p) =>
          p.pair.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.badge.toLowerCase().includes(q),
      );
    }
    return pairs;
  }, [sortBy, search.search, forexQuery.data]);

  const handleManualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Pull-to-refresh
  const pullToRefresh = usePullToRefresh(() => refetch());

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      title="Discover"
      badge="LIVE"
      badgeColor="var(--color-bullish)"
      loading={isLoading}
      loadingColor="var(--color-bullish)"
    >
      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Category Tabs */}
      <div
        className="scrollbar-hide"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          padding: "8px 10px",
          overflowX: "auto",
          flexShrink: 0,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = category === tab.key;
          const count = categoryCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => handleCategoryChange(tab.key)}
              style={{
                fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                padding: "6px 14px",
                borderRadius: "8px",
                border: isActive ? "1px solid var(--color-primary)" : "1px solid transparent",
                cursor: "pointer",
                background: isActive ? "var(--color-primary)" : "transparent",
                color: isActive
                  ? "var(--color-primary-foreground)"
                  : "var(--color-muted-foreground)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "0 5px",
                  borderRadius: "8px",
                  background: isActive ? "rgba(0,0,0,0.18)" : "var(--color-card)",
                  color: isActive
                    ? "var(--color-primary-foreground)"
                    : "var(--color-muted-foreground)",
                  fontFamily: "'JetBrains Mono', monospace",
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

        {/* Live indicator + last updated (hidden in forex — static data) */}
        {!isForexMode && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            {/* Pulsing green dot */}
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
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: "nowrap",
              }}
            >
              LIVE
            </span>

            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefetching}
              aria-label="Refresh data"
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-muted-foreground)",
                cursor: isRefetching ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <RefreshCw
                size={12}
                style={{
                  animation: isRefetching ? "spin 0.7s linear infinite" : undefined,
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          </div>
        )}
        {isForexMode && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <span
              style={{
                fontSize: "9px",
                color: GOLD_COLOR,
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: GOLD_COLOR,
                  display: "inline-block",
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              />
              Mock data
            </span>
          </div>
        )}
      </div>

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
            placeholder={isForexMode ? "Search pairs..." : "Search tokens..."}
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

        {/* Sort Pills — show relevant subset for forex */}
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: "3px",
            flexShrink: 0,
          }}
        >
          {(isForexMode
            ? SORT_OPTIONS.filter(
                (o) => o.key === "trending" || o.key === "volume" || o.key === "change",
              )
            : SORT_OPTIONS
          ).map((opt) => (
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
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel — hidden in forex mode */}
      {!isForexMode && (
        <FilterPanel
          filters={filterState}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen((v) => !v)}
        />
      )}

      {/* Error state — subtle, not alarming (crypto only) */}
      {error && !isForexMode && (
        <EmptyState
          icon="📡"
          title="Unable to Load"
          message="Token scan is temporarily unavailable. Pull down to retry."
        />
      )}

      {/* List area — forex or crypto */}
      <div
        ref={isForexMode ? undefined : pullToRefresh.containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
        className="scrollbar-hide"
        {...(isForexMode ? {} : pullToRefresh.pullHandlers)}
      >
        {/* Pull-to-refresh indicator (crypto only) */}
        {!isForexMode && (
          <div style={pullToRefresh.pullIndicatorStyle}>
            <PullIndicator
              distance={pullToRefresh.pullDistance}
              isRefreshing={pullToRefresh.isRefreshing}
            />
          </div>
        )}

        {/* ── FOREX LIST ── */}
        {isForexMode && (
          <div style={{ padding: "4px 0" }}>
            {/* Broker toast notification */}
            {brokerToast && (
              <div
                style={{
                  margin: "6px 12px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--color-card)",
                  border: `1px solid var(--color-border)`,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  animation: "vixor-fade-in 0.2s ease",
                }}
              >
                <Link2 size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-foreground)",
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {brokerToast} — Connect Broker
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "var(--color-muted-foreground)",
                      marginTop: "1px",
                    }}
                  >
                    Link a forex broker to trade {brokerToast} with live charts.
                  </div>
                </div>
              </div>
            )}

            {forexQuery.isLoading ? (
              Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{ padding: "6px 12px" }}>
                  <SkeletonRow />
                </div>
              ))
            ) : sortedForexPairs.length === 0 ? (
              <EmptyState
                icon="💱"
                title="No Pairs Found"
                message={
                  search.search
                    ? `No forex pairs matching "${search.search}".`
                    : "No forex pairs available."
                }
              />
            ) : (
              <>
                {/* Gold section */}
                <ForexSectionHeader title="Precious Metals" count={1} />
                {sortedForexPairs
                  .filter((p) => p.type === "gold")
                  .map((pair) => (
                    <ForexPairRow
                      key={pair.pair}
                      item={pair}
                      onClick={() => handleForexClick(pair)}
                    />
                  ))}

                {/* Major pairs section */}
                {sortedForexPairs.some((p) => p.type === "major") && (
                  <>
                    <ForexSectionHeader title="Major Pairs" count={FOREX_MAJOR_COUNT} />
                    {sortedForexPairs
                      .filter((p) => p.type === "major")
                      .map((pair) => (
                        <ForexPairRow
                          key={pair.pair}
                          item={pair}
                          onClick={() => handleForexClick(pair)}
                        />
                      ))}
                  </>
                )}

                {/* Minor / Cross pairs section */}
                {sortedForexPairs.some((p) => p.type === "minor") && (
                  <>
                    <ForexSectionHeader title="Minor / Cross Pairs" count={FOREX_MINOR_COUNT} />
                    {sortedForexPairs
                      .filter((p) => p.type === "minor")
                      .map((pair) => (
                        <ForexPairRow
                          key={pair.pair}
                          item={pair}
                          onClick={() => handleForexClick(pair)}
                        />
                      ))}
                  </>
                )}

                {/* Footer */}
                <div
                  style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    fontSize: "9px",
                    color: "var(--color-muted-foreground)",
                    borderTop: "1px solid var(--color-border)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {FOREX_TOTAL_COUNT} pairs · Live data via TwelveData
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CRYPTO TOKEN LIST ── */}
        {!isForexMode && (
          <div style={{ padding: "4px 0" }}>
            {/* Top Movers Section */}
            {!isLoading && tokens.length > 0 && (
              <div style={{ padding: "12px 14px 8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
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
                    Top Movers
                  </span>
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
                      return (
                        <button
                          key={t.symbol + t.chain}
                          onClick={() => handleTokenClick(t)}
                          style={{
                            flexShrink: 0,
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: "var(--color-card)",
                            border: `1px solid ${isUp ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
                            cursor: "pointer",
                            textAlign: "left",
                            minWidth: "100px",
                            backdropFilter: "blur(8px)",
                            transition: "all 0.15s ease",
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
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 800,
                              color: "var(--color-foreground)",
                              marginBottom: "4px",
                            }}
                          >
                            {t.symbol}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: col,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {isUp ? "+" : ""}
                            {(t.change24h ?? 0).toFixed(2)}%
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-muted-foreground)",
                              fontFamily: "'JetBrains Mono', monospace",
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
            {!isLoading && tokens.length > 0 && (
              <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />
            )}

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
                      onClick={() => handleTokenClick(token)}
                      livePrice={liveOverlay[token.symbol]}
                    />
                  ))
                : !error &&
                  tokens.length === 0 && (
                    <EmptyState
                      icon="🔍"
                      title="No Tokens Found"
                      message={
                        search.search
                          ? `No results for "${search.search}". Try a different search term.`
                          : "Token scan is in progress. Check back in a moment."
                      }
                    />
                  )}
          </div>
        )}

        {/* Footer info (crypto only) */}
        {!isForexMode && resp?.scanDurationMs && tokens.length > 0 && (
          <div
            style={{
              padding: "8px 12px",
              textAlign: "center",
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              borderTop: "1px solid var(--color-border)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Scanned {resp.total} tokens in {(resp.scanDurationMs / 1000).toFixed(1)}s
            {resp.filteredOut !== undefined && resp.filteredOut > 0 && (
              <span> · {resp.filteredOut} filtered out</span>
            )}
            {resp.source && <span> · via {resp.source}</span>}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
