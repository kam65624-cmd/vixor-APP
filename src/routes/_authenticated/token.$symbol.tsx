import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getTradeHistory, getRecentAnalyses, getWatchlistData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  StatsRow,
  DataRow,
  Badge,
  ScrollArea,
  EmptyState,
  SectionTitle,
} from "@/components/vixor/PageLayout";

// ── Route Definition ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/token/$symbol")({
  head: () => ({ meta: [{ title: "Token — Vixor" }] }),
  component: TokenPage,
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
}

// ── TradingView Symbol Mapping ───────────────────────────────────────────────

const TV_SYMBOL_MAP: Record<string, string> = {
  "BTC/USDT": "BINANCE:BTCUSDT",
  "ETH/USDT": "BINANCE:ETHUSDT",
  "XAU/USD": "OANDA:XAUUSD",
  "EUR/USD": "FX:EURUSD",
  "GBP/JPY": "FX:GBPJPY",
  "SOL/USDT": "BINANCE:SOLUSDT",
  "BTC/USD": "BITSTAMP:BTCUSD",
  "ETH/USD": "BITSTAMP:ETHUSD",
  "GBP/USD": "FX:GBPUSD",
  "USD/JPY": "FX:USDJPY",
  "AUD/USD": "FX:AUDUSD",
  "NZD/USD": "FX:NZDUSD",
  "USD/CAD": "FX:USDCAD",
  "USD/CHF": "FX:USDCHF",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  SPX500: "SP:SPX",
  NASDAQ: "NASDAQ:NDX",
};

function toTradingViewSymbol(symbol: string): string {
  // Try direct map first
  if (TV_SYMBOL_MAP[symbol]) return TV_SYMBOL_MAP[symbol];

  // If symbol contains "/" (like BTC/USDT), convert to BINANCE format
  if (symbol.includes("/")) {
    const parts = symbol.toUpperCase().split("/");
    if (parts.length === 2) {
      // Try common exchanges
      const formatted = parts.join("");
      return `BINANCE:${formatted}`;
    }
  }

  // For meme coins / standalone symbols, try DEX format with USDT
  const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!upper.includes("/")) {
    return `BINANCE:${upper}USDT`;
  }

  return symbol;
}

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtPrice(p: number | null): string {
  if (p === null || p === undefined || p === 0) return "—";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtChange(n: number | null): string {
  if (n === null || n === undefined) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtPct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(0)}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getChainLabel(chain: string): string {
  const c = (chain || "").toLowerCase();
  if (c.includes("sol")) return "SOL";
  if (c.includes("eth") || c.includes("ethereum")) return "ETH";
  if (c.includes("base")) return "BASE";
  if (c.includes("arb") || c.includes("arbitrum")) return "ARB";
  if (c.includes("poly") || c.includes("matic")) return "POLY";
  if (c.includes("bsc") || c.includes("bnb")) return "BSC";
  return (chain || "UNKNOWN").toUpperCase().slice(0, 6);
}

function getRiskColor(risk?: string): string {
  if (!risk) return "var(--color-muted-foreground)";
  const r = risk.toLowerCase();
  if (r === "low") return "var(--color-bullish)";
  if (r === "medium") return "#F0B90B";
  if (r === "high") return "var(--color-bearish)";
  return "var(--color-muted-foreground)";
}

// ── Asset Type Detection ─────────────────────────────────────────────────────

type AssetType = "meme" | "crypto" | "forex" | "commodity" | "unknown";

function detectAssetType(symbol: string, chain?: string): AssetType {
  const s = symbol.toUpperCase();
  // Forex pairs contain "/"
  if (s.includes("/")) return "forex";
  // Commodities
  if (["XAU", "XAG", "XPT", "OIL", "WTI", "BRENT", "GOLD", "SILVER"].some(c => s.includes(c))) return "commodity";
  // Meme coins (common meme tokens)
  const memeTokens = ["BONK", "WIF", "PEPE", "DOGE", "SHIB", "FLOKI", "BOME", "MEME", "TURBO", "MOG", "BRETT", "SPX", "GIGA", "POPCAT", "MEW", "NEIRO", "BUBBA"];
  if (memeTokens.includes(s)) return "meme";
  // Chain-specific meme detection
  if (chain && ["solana", "base", "eth"].includes(chain.toLowerCase())) {
    const majorCrypto = ["BTC", "ETH", "SOL", "USDT", "USDC", "BNB", "XRP", "ADA", "AVAX", "DOT", "LINK", "MATIC", "UNI"];
    if (!majorCrypto.includes(s)) return "meme";
  }
  return "crypto";
}

function getAssetTypeBadge(assetType: AssetType): { label: string; color: string } {
  switch (assetType) {
    case "meme": return { label: "MEME 🐕", color: "#F7931A" };
    case "crypto": return { label: "CRYPTO ₿", color: "#7C9BC4" };
    case "forex": return { label: "FOREX 💱", color: "#A78BFA" };
    case "commodity": return { label: "COMMODITY 🥇", color: "#F0B90B" };
    default: return { label: "TOKEN", color: "var(--color-muted-foreground)" };
  }
}

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

// ── TradingView Chart Component ──────────────────────────────────────────────

const TradingViewMiniChart = memo(function TradingViewMiniChart({
  symbol,
  height,
}: {
  symbol: string;
  height: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"]'
    );
    if (existingScript) {
      setScriptLoaded(true);
    } else {
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => setHasError(true);
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const widgetId = `tv_mini_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.id = widgetId;
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);
    container.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";

    const tvSymbol = toTradingViewSymbol(symbol);

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: "240",
      timezone: "Etc/UTC",
      theme: "dark" as const,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: "rgba(11, 13, 16, 1)",
      gridColor: "rgba(255, 255, 255, 0.03)",
      withdateranges: true,
      details: false,
      hotlist: false,
      calendar: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
    };

    script.textContent = JSON.stringify(config);
    script.onerror = () => setHasError(true);
    widgetContainer.appendChild(script);

    return () => {
      if (container && widgetContainer.parentNode === container) {
        container.innerHTML = "";
      }
    };
  }, [scriptLoaded, symbol]);

  if (hasError) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-background)",
          borderBottom: `1px solid var(--color-border)`,
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
          Chart unavailable
        </span>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-background)",
          borderBottom: `1px solid var(--color-border)`,
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height, borderBottom: `1px solid var(--color-border)` }}
    />
  );
});

// ── Main Page Component ──────────────────────────────────────────────────────

function TokenPage() {
  const { symbol } = useParams({ from: "/_authenticated/token/$symbol" });
  const navigate = useNavigate();

  const fetchTrades = useStableServerFn(getTradeHistory);
  const fetchAnalyses = useStableServerFn(getRecentAnalyses);
  const fetchWatchlist = useStableServerFn(getWatchlistData);

  // ── Data Queries ──

  const tradesQuery = useQuery({
    queryKey: ["token-trades", symbol],
    queryFn: () => fetchTrades({ data: { limit: 100 } }),
    staleTime: 15_000,
  });

  const analysesQuery = useQuery({
    queryKey: ["token-analyses", symbol],
    queryFn: () => fetchAnalyses(),
    staleTime: 30_000,
  });

  const watchlistQuery = useQuery({
    queryKey: ["token-watchlist", symbol],
    queryFn: () => fetchWatchlist(),
    staleTime: 30_000,
  });

  // Fetch discovery data via the API route
  const discoveryQuery = useQuery<DiscoverResponse>({
    queryKey: ["token-discovery", symbol],
    queryFn: async () => {
      const params = new URLSearchParams({ search: symbol, limit: "5" });
      const res = await fetch(`/api/discover?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  // ── Derived Data ──

  const allTrades = tradesQuery.data?.trades ?? [];
  const tokenTrades = allTrades.filter((t: any) =>
    t.pair?.toUpperCase().includes(symbol.toUpperCase())
  );
  const closedTrades = tokenTrades.filter(
    (t: any) => t.status === "closed" && t.pnl != null
  );
  const totalPnl = closedTrades.reduce(
    (s: number, t: any) => s + (t.pnl || 0),
    0
  );
  const winRate =
    closedTrades.length > 0
      ? Math.round(
          (closedTrades.filter((t: any) => (t.pnl || 0) > 0).length /
            closedTrades.length) *
            100
        )
      : 0;

  // Find matching discovery token
  const tokenData = useMemo(() => {
    if (!discoveryQuery.data?.data?.length) return null;
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return (
      discoveryQuery.data.data.find(
        (t) => t.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "") === upper
      ) || discoveryQuery.data.data[0] || null
    );
  }, [discoveryQuery.data, symbol]);

  // Filter analyses that mention this symbol
  const relatedAnalyses = useMemo(() => {
    const analyses = analysesQuery.data?.analyses ?? [];
    if (!analyses.length) return [];
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return analyses.filter((a: any) => {
      const pair = (a.pair || "").toUpperCase().replace(/[^A-Z0-9/]/g, "");
      return pair.includes(upper) || pair.includes(symbol.toUpperCase());
    });
  }, [analysesQuery.data, symbol]);

  // Check if token is in watchlist
  const isWatched = useMemo(() => {
    const items = watchlistQuery.data?.watchlistItems ?? [];
    return items.some(
      (item: any) =>
        item.pair?.toUpperCase().replace(/[^A-Z0-9]/g, "") ===
        symbol.toUpperCase().replace(/[^A-Z0-9]/g, "")
    );
  }, [watchlistQuery.data, symbol]);

  // Detect asset type
  const assetType = useMemo(
    () => detectAssetType(symbol, tokenData?.chain),
    [symbol, tokenData?.chain]
  );
  const assetBadge = getAssetTypeBadge(assetType);

  // ── Quick Trade State ──

  const [direction, setDirection] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState("100");
  const [leverage, setLeverage] = useState(5);

  const entryPrice = tokenData?.price ?? 0;
  const numericAmount = parseFloat(amount) || 0;
  const estimatedTokens =
    entryPrice > 0 ? (numericAmount * leverage) / entryPrice : 0;
  const slDistance = direction === "long" ? 0.02 : 0.02;
  const slPrice =
    direction === "long"
      ? entryPrice * (1 - slDistance)
      : entryPrice * (1 + slDistance);

  // ── Loading state ──

  const isInitialLoading =
    tradesQuery.isLoading || discoveryQuery.isLoading;

  return (
    <PageLayout
      title={tokenData?.name || symbol.toUpperCase()}
      badge={assetBadge.label}
      badgeColor={assetBadge.color}
      loading={isInitialLoading}
      loadingColor={"var(--color-bullish)"}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-muted)",
          flexShrink: 0,
        }}
      >
        <Link
          to="/discover"
          search={{ category: "ALL", sortBy: "trending", search: "", minLiquidity: undefined, minVolume: undefined, honeypotOnly: false, smartMoneyMin: undefined }}
          style={{
            color: "var(--color-primary)",
            fontSize: "11px",
            textDecoration: "none",
          }}
        >
          Discover
        </Link>
        <span
          style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}
        >
          /
        </span>
        <span
          style={{ color: "var(--color-foreground)", fontSize: "11px", fontWeight: 600 }}
        >
          {symbol.toUpperCase()}
        </span>
      </div>

      <PageScrollArea>
        {/* ════════════════════════════════════════════════════════════════════
            1. TOKEN HEADER
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "16px",
            borderBottom: `1px solid var(--color-border)`,
            background: "var(--color-card)",
          }}
        >
          {/* Top row: Name + actions */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--color-foreground)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tokenData?.name || symbol.toUpperCase()}
                </h2>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  }}
                >
                  ${symbol.toUpperCase()}
                </span>
                <Badge
                  label={getChainLabel(tokenData?.chain ?? "")}
                  color={"var(--color-primary)"}
                  small
                />
                <Badge
                  label={assetBadge.label}
                  color={assetBadge.color}
                  small
                />
                {tokenData?.risk && (
                  <Badge
                    label={`${tokenData.risk.toUpperCase()} RISK`}
                    color={getRiskColor(tokenData.risk)}
                    small
                  />
                )}
              </div>

              {/* Price + 24h change */}
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color: "var(--color-foreground)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {fmtPrice(tokenData?.price ?? null)}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color:
                      (tokenData?.change24h ?? 0) >= 0
                        ? "var(--color-bullish)"
                        : "var(--color-bearish)",
                    marginLeft: "10px",
                  }}
                >
                  {fmtChange(tokenData?.change24h ?? null)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexShrink: 0,
                marginTop: "2px",
              }}
            >
              {/* Watchlist toggle */}
              <button
                onClick={() => {
                  // Toggle watchlist state (optimistic)
                  if (!isWatched) {
                    navigate({
                      to: "/trackers",
                    });
                  }
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: `1px solid var(--color-border)`,
                  background: isWatched
                    ? "rgba(14,203,129,0.12)"
                    : "var(--color-card)",
                  color: isWatched
                    ? "var(--color-bullish)"
                    : "var(--color-muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontSize: "16px",
                }}
                title={isWatched ? "In Watchlist" : "Add to Watchlist"}
              >
                {isWatched ? "★" : "☆"}
              </button>
              {/* Share button */}
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/token/${symbol}`
                    );
                  }
                }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: `1px solid var(--color-border)`,
                  background: "var(--color-card)",
                  color: "var(--color-muted-foreground)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontSize: "14px",
                }}
                title="Copy link"
              >
                ↗
              </button>
            </div>
          </div>

          {/* Market stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              background: "var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
              marginTop: "14px",
            }}
          >
            <MarketStat
              label="Market Cap"
              value={fmtCompact(tokenData?.marketCap ?? 0)}
            />
            <MarketStat
              label="24h Volume"
              value={fmtCompact(tokenData?.volume24h ?? 0)}
            />
            <MarketStat
              label="Liquidity"
              value={fmtCompact(tokenData?.liquidity ?? 0)}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            2. TRADINGVIEW CHART
        ════════════════════════════════════════════════════════════════════ */}
        <TradingViewMiniChart
          symbol={symbol}
          height={
            typeof window !== "undefined" && window.innerWidth < 768
              ? "300px"
              : "400px"
          }
        />

        {/* ════════════════════════════════════════════════════════════════════
            3. QUICK TRADE PANEL
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "16px",
            borderBottom: `1px solid var(--color-border)`,
            background: "var(--color-card)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Quick Trade
          </div>

          {/* Direction toggle */}
          <div
            style={{
              display: "flex",
              gap: "1px",
              background: "var(--color-border)",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >
            {(["long", "short"] as const).map((dir) => {
              const isActive = direction === dir;
              const isBull = dir === "long";
              return (
                <button
                  key={dir}
                  onClick={() => setDirection(dir)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "13px",
                    letterSpacing: "0.04em",
                    background: isActive
                      ? isBull
                        ? "var(--color-bullish)"
                        : "var(--color-bearish)"
                      : "var(--color-card)",
                    color: isActive
                      ? "#000"
                      : isBull
                        ? "var(--color-bullish)"
                        : "var(--color-bearish)",
                    transition: "all 0.12s",
                  }}
                >
                  {dir === "long" ? "▲ LONG" : "▼ SHORT"}
                </button>
              );
            })}
          </div>

          {/* Amount input */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
                marginBottom: "4px",
              }}
            >
              Amount (USD)
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="10"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: `1px solid var(--color-border)`,
                background: "var(--color-background)",
                color: "var(--color-foreground)",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Leverage selector */}
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
                marginBottom: "6px",
              }}
            >
              Leverage
            </div>
            <div
              style={{
                display: "flex",
                gap: "4px",
                flexWrap: "wrap",
              }}
            >
              {LEVERAGE_OPTIONS.map((lev) => (
                <button
                  key={lev}
                  onClick={() => setLeverage(lev)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: `1px solid ${
                      leverage === lev ? "var(--color-primary)" : "var(--color-border)"
                    }`,
                    background:
                      leverage === lev
                        ? "rgba(124,155,196,0.15)"
                        : "var(--color-card)",
                    color:
                      leverage === lev
                        ? "var(--color-primary)"
                        : "var(--color-muted-foreground)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    transition: "all 0.12s",
                  }}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick calculations */}
          <div
            style={{
              background: "var(--color-background)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "14px",
              border: `1px solid var(--color-border)`,
            }}
          >
            <QuickCalcRow
              label="Entry Price"
              value={fmtPrice(entryPrice)}
              mono
            />
            <QuickCalcRow
              label="Est. Tokens"
              value={
                estimatedTokens > 0
                  ? estimatedTokens < 1
                    ? estimatedTokens.toFixed(6)
                    : estimatedTokens < 1000
                      ? estimatedTokens.toFixed(2)
                      : estimatedTokens.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })
                  : "—"
              }
              mono
            />
            <QuickCalcRow
              label="Suggested SL"
              value={fmtPrice(slPrice)}
              mono
              valueColor="var(--color-bearish)"
            />
            <QuickCalcRow
              label="Position Size"
              value={fmtCompact(numericAmount * leverage)}
              mono
              valueColor="var(--color-primary)"
            />
          </div>

          {/* Execute button */}
          <button
            onClick={() => {
              navigate({
                to: "/trade-desk",
              });
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.04em",
              background:
                direction === "long"
                  ? "var(--color-bullish)"
                  : "var(--color-bearish)",
              color: "#000",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = "1";
            }}
          >
            EXECUTE {direction.toUpperCase()} ON TRADE DESK →
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            4. KEY METRICS GRID
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "16px",
            borderBottom: `1px solid var(--color-border)`,
            background: "var(--color-card)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Key Metrics
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {/* Price Changes card */}
            <MetricCard>
              <MetricCardLabel>Price Change</MetricCardLabel>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "6px",
                }}
              >
                <MetricPill label="1h" value="—" />
                <MetricPill
                  label="24h"
                  value={fmtChange(tokenData?.change24h ?? null)}
                  color={
                    (tokenData?.change24h ?? 0) >= 0
                      ? "var(--color-bullish)"
                      : "var(--color-bearish)"
                  }
                />
                <MetricPill label="7d" value="—" />
              </div>
            </MetricCard>

            {/* Vol/MCap ratio */}
            <MetricCard>
              <MetricCardLabel>Vol / Market Cap</MetricCardLabel>
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color: "var(--color-info)",
                  }}
                >
                  {tokenData?.marketCap && tokenData.marketCap > 0
                    ? ((tokenData.volume24h / tokenData.marketCap) * 100).toFixed(
                        1
                      ) + "%"
                    : "—"}
                </span>
              </div>
            </MetricCard>

            {/* Smart Money Score */}
            <MetricCard>
              <MetricCardLabel>Smart Money Score</MetricCardLabel>
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color:
                      (tokenData?.smartMoneyPct ?? 0) >= 50
                        ? "var(--color-bullish)"
                        : (tokenData?.smartMoneyPct ?? 0) >= 25
                          ? "#F0B90B"
                          : "var(--color-bearish)",
                  }}
                >
                  {fmtPct(tokenData?.smartMoneyPct)}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-muted-foreground)",
                      marginLeft: "2px",
                    }}
                  >
                    /100
                  </span>
                </span>
              </div>
            </MetricCard>

            {/* Discovery Score */}
            <MetricCard>
              <MetricCardLabel>Discovery Score</MetricCardLabel>
              <div style={{ marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color:
                      (tokenData?.discoveryScore ?? 0) >= 60
                        ? "var(--color-bullish)"
                        : (tokenData?.discoveryScore ?? 0) >= 30
                          ? "#F0B90B"
                          : "var(--color-muted-foreground)",
                  }}
                >
                  {tokenData?.discoveryScore ?? "—"}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-muted-foreground)",
                      marginLeft: "2px",
                    }}
                  >
                    /100
                  </span>
                </span>
              </div>
            </MetricCard>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            4b. ASSET-TYPE-SPECIFIC SECTIONS
        ════════════════════════════════════════════════════════════════════ */}
        {assetType === "meme" && (
          <MemeSections tokenData={tokenData} />
        )}
        {assetType === "crypto" && (
          <CryptoSections tokenData={tokenData} />
        )}
        {assetType === "forex" && (
          <ForexSections symbol={symbol} />
        )}
        {assetType === "commodity" && (
          <CommoditySections tokenData={tokenData} symbol={symbol} />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            5. RELATED ANALYSES
        ════════════════════════════════════════════════════════════════════ */}
        <SectionTitle
          title="Related Analyses"
          count={relatedAnalyses.length}
        />

        {relatedAnalyses.length > 0 ? (
          relatedAnalyses.slice(0, 5).map((a: any) => (
            <DataRow
              key={a.id}
              onClick={() => {
                navigate({ to: "/analysis/$id", params: { id: a.id } });
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
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
                  <Badge
                    label={
                      (a.recommendation || "N/A").toUpperCase()
                    }
                    color={
                      (a.recommendation || "").toLowerCase() === "buy" ||
                      (a.recommendation || "").toLowerCase() === "long" ||
                      (a.recommendation || "").toLowerCase() === "bullish"
                        ? "var(--color-bullish)"
                        : (a.recommendation || "").toLowerCase() === "sell" ||
                            (a.recommendation || "").toLowerCase() === "short" ||
                            (a.recommendation || "").toLowerCase() === "bearish"
                          ? "var(--color-bearish)"
                          : "var(--color-primary)"
                    }
                    small
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.pair || symbol.toUpperCase()}
                  </span>
                  {a.confidence != null && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        color: "var(--color-primary)",
                      }}
                    >
                      {a.confidence}%
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-muted-foreground)",
                    flexShrink: 0,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  }}
                >
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </DataRow>
          ))
        ) : (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
              fontSize: "12px",
              borderBottom: `1px solid var(--color-border)`,
            }}
          >
            No analyses for {symbol.toUpperCase()} yet
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            6. USER TRADES
        ════════════════════════════════════════════════════════════════════ */}
        <StatsRow
          stats={[
            {
              label: "Your Trades",
              value: String(tokenTrades.length),
              color: "var(--color-foreground)",
            },
            {
              label: "Total PnL",
              value: `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`,
              color:
                totalPnl >= 0
                  ? "var(--color-bullish)"
                  : "var(--color-bearish)",
            },
            {
              label: "Win Rate",
              value: `${winRate}%`,
              color: "var(--color-bullish)",
            },
            {
              label: "Closed",
              value: String(closedTrades.length),
              color: "var(--color-foreground)",
            },
          ]}
        />

        <SectionTitle
          title={`Your Trades for ${symbol.toUpperCase()}`}
          count={tokenTrades.length}
        />

        {tokenTrades.length > 0 ? (
          tokenTrades.map((trade: any) => (
            <TokenTradeRow key={trade.id} trade={trade} />
          ))
        ) : (
          <EmptyState
            icon="📊"
            title="No trades found"
            message={
              allTrades.length === 0
                ? "No trades yet. Go to Trade Desk to log your first trade."
                : `No trades found for ${symbol.toUpperCase()}. This token may be tracked under a different pair name.`
            }
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            7. AI ANALYSIS CTA
        ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: "20px 16px",
            background: "var(--color-card)",
            borderTop: `1px solid var(--color-border)`,
          }}
        >
          <button
            onClick={() => {
              navigate({
                to: "/analyze",
                search: { screenshot: undefined, pair: symbol },
              });
            }}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: `1px solid var(--color-primary)`,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.04em",
              background:
                "rgba(124,155,196,0.10)",
              color: "var(--color-primary)",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background =
                "rgba(124,155,196,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background =
                "rgba(124,155,196,0.10)";
            }}
          >
            <span style={{ fontSize: "16px" }}>⚡</span>
            ANALYZE {symbol.toUpperCase()}
          </button>
        </div>

        {/* Bottom spacer for scroll padding */}
        <div style={{ height: "24px" }} />
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Sub-Components ───────────────────────────────────────────────────────────

// ── Forex Session Indicator ──────────────────────────────────────────────────

function ForexSessionIndicator() {
  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNow(d.getUTCHours() * 60 + d.getUTCMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const sessions = [
    { name: "Tokyo", start: 0, end: 540, color: "#F0B90B" },
    { name: "London", start: 480, end: 1020, color: "#7C9BC4" },
    { name: "New York", start: 780, end: 1320, color: "#0ECB81" },
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {sessions.map((s) => {
        const isActive = now >= s.start && now < s.end;
        const minsUntil = now < s.start ? s.start - now : now >= s.end ? (1440 - now) + s.start : 0;
        const status = isActive ? "active" : minsUntil <= 120 ? "upcoming" : "closed";
        const dotColor = status === "active" ? s.color : status === "upcoming" ? "#F0B90B" : "var(--color-muted-foreground)";
        return (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 600,
              color: status === "active" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: dotColor,
                boxShadow: status === "active" ? `0 0 6px ${dotColor}` : "none",
                flexShrink: 0,
              }}
            />
            {s.name}
            {status === "active" && (
              <span style={{ color: s.color, fontSize: "10px" }}>(LIVE)</span>
            )}
            {status === "upcoming" && (
              <span style={{ fontSize: "10px" }}>({Math.floor(minsUntil / 60)}h)</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Gauge Bar Component ─────────────────────────────────────────────────────

function GaugeBar({ value, max = 100, color, label }: { value: number; max?: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>{label}</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color,
          }}
        >
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          borderRadius: "3px",
          background: "var(--color-background)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "3px",
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Meme-Specific Sections ──────────────────────────────────────────────────

function MemeSections({ tokenData }: { tokenData: TokenItem | null }) {
  const socialScore = tokenData?.socialScore ?? 0;
  const volume = tokenData?.volume24h ?? 0;
  const smartMoneyPct = tokenData?.smartMoneyPct ?? 0;
  const liquidity = tokenData?.liquidity ?? 0;
  const isHoneypot = tokenData?.isHoneypot ?? false;

  // Calculate hype level from social + volume
  const hypeRaw = Math.min(Math.round(socialScore * 0.6 + Math.min(volume / 100000, 40) * 0.4), 100);
  const hypeLevel =
    hypeRaw >= 80 ? { label: "FRENZY", color: "#F6465D" } :
    hypeRaw >= 60 ? { label: "HIGH", color: "#F7931A" } :
    hypeRaw >= 40 ? { label: "MODERATE", color: "#F0B90B" } :
    hypeRaw >= 20 ? { label: "LOW", color: "#7C9BC4" } :
    { label: "DORMANT", color: "var(--color-muted-foreground)" };

  return (
    <>
      {/* Community Sentiment */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "14px",
          }}
        >
          🐕 Community Sentiment
        </div>

        {/* Social Score Bar */}
        <GaugeBar
          value={socialScore}
          color={socialScore >= 60 ? "var(--color-bullish)" : socialScore >= 30 ? "#F0B90B" : "var(--color-bearish)"}
          label="Social Score"
        />

        {/* Hype Level */}
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Hype Level</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: hypeLevel.color,
              }}
            >
              {hypeLevel.label} ({hypeRaw})
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              background: "var(--color-background)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${hypeRaw}%`,
                height: "100%",
                borderRadius: "3px",
                background: `linear-gradient(90deg, #7C9BC4, ${hypeLevel.color})`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Smart Money Gauge */}
        <div style={{ marginTop: "14px" }}>
          <GaugeBar
            value={smartMoneyPct}
            color={smartMoneyPct >= 50 ? "var(--color-bullish)" : smartMoneyPct >= 25 ? "#F0B90B" : "var(--color-bearish)"}
            label="Smart Money % (est.)"
          />
        </div>
      </div>

      {/* Risk Flags */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          ⚠️ Risk Flags
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {isHoneypot && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(246,70,93,0.12)",
                border: `1px solid rgba(246,70,93,0.25)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>🚫</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-bearish)" }}>HONEYPOT DETECTED</div>
                <div style={{ fontSize: "10px", color: "var(--color-muted-foreground)", marginTop: "2px" }}>You may not be able to sell this token</div>
              </div>
            </div>
          )}

          {liquidity > 0 && liquidity < 50000 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(240,185,11,0.12)",
                border: `1px solid rgba(240,185,11,0.25)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>💧</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#F0B90B" }}>LOW LIQUIDITY</div>
                <div style={{ fontSize: "10px", color: "var(--color-muted-foreground)", marginTop: "2px" }}>
                  Only {fmtCompact(liquidity)} — high slippage risk
                </div>
              </div>
            </div>
          )}

          {!isHoneypot && liquidity >= 50000 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(14,203,129,0.08)",
                border: `1px solid rgba(14,203,129,0.20)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>✓</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-bullish)" }}>NO MAJOR FLAGS</div>
                <div style={{ fontSize: "10px", color: "var(--color-muted-foreground)", marginTop: "2px" }}>
                  Always DYOR before trading meme tokens
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Crypto-Specific Sections ────────────────────────────────────────────────

function CryptoSections({ tokenData }: { tokenData: TokenItem | null }) {
  // Simulated on-chain data (labeled as estimated)
  const volume = tokenData?.volume24h ?? 0;
  const dexVol = Math.round(volume * 0.62);
  const cexVol = Math.round(volume * 0.38);
  const holderCount = tokenData?.marketCap
    ? Math.round(tokenData.marketCap * 0.001 + 500)
    : 1200 + Math.round(Math.random() * 500);
  const whaleTxCount = Math.max(1, Math.round(volume / 5000000));

  return (
    <div
      style={{
        padding: "16px",
        borderBottom: `1px solid var(--color-border)`,
        background: "var(--color-card)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "14px",
        }}
      >
        ⛓️ On-Chain Metrics <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(est.)</span>
      </div>

      {/* Holder Count */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <MetricCard>
          <MetricCardLabel>Holders</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-foreground)",
              }}
            >
              {holderCount.toLocaleString()}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>DEX Vol</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-primary)",
              }}
            >
              {fmtCompact(dexVol)}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>CEX Vol</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "#F0B90B",
              }}
            >
              {fmtCompact(cexVol)}
            </span>
          </div>
        </MetricCard>
      </div>

      {/* DEX vs CEX comparison bar */}
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            marginBottom: "4px",
          }}
        >
          <span>DEX {volume > 0 ? Math.round((dexVol / volume) * 100) : 0}%</span>
          <span>CEX {volume > 0 ? Math.round((cexVol / volume) * 100) : 0}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "4px",
            background: "var(--color-background)",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${volume > 0 ? (dexVol / volume) * 100 : 50}%`,
              height: "100%",
              background: "var(--color-primary)",
            }}
          />
          <div
            style={{
              width: `${volume > 0 ? (cexVol / volume) * 100 : 50}%`,
              height: "100%",
              background: "#F0B90B",
            }}
          />
        </div>
      </div>

      {/* Whale Activity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--color-background)",
          border: `1px solid var(--color-border)`,
        }}
      >
        <span style={{ fontSize: "16px" }}>🐋</span>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Whale Activity (24h)</div>
          <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: "var(--color-foreground)", marginTop: "2px" }}>
            {whaleTxCount} large tx{whaleTxCount !== 1 ? "s" : ""} detected
            <span style={{ fontSize: "10px", color: "var(--color-muted-foreground)", marginLeft: "6px" }}>(simulated)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Forex-Specific Sections ─────────────────────────────────────────────────

function ForexSections({ symbol }: { symbol: string }) {
  const pair = symbol.toUpperCase();

  // Simulated economic events
  const events = [
    { time: "14:30", currency: "USD", event: "Non-Farm Payrolls", impact: "high" as const, forecast: "180K", previous: "175K" },
    { time: "10:00", currency: "EUR", event: "CPI Flash Estimate", impact: "high" as const, forecast: "2.4%", previous: "2.6%" },
    { time: "19:00", currency: "GBP", event: "BoE Interest Rate Decision", impact: "medium" as const, forecast: "5.25%", previous: "5.25%" },
  ];

  // Simulated currency strength (0-100)
  const strengthData: Record<string, number> = {
    USD: 72, EUR: 65, GBP: 58, JPY: 45, AUD: 51, NZD: 48, CAD: 54, CHF: 61,
  };

  const impactStyle = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high": return { bg: "rgba(246,70,93,0.15)", border: "var(--color-bearish)", color: "var(--color-bearish)" };
      case "medium": return { bg: "rgba(240,185,11,0.15)", border: "#F0B90B", color: "#F0B90B" };
      default: return { bg: "rgba(14,203,129,0.15)", border: "var(--color-bullish)", color: "var(--color-bullish)" };
    }
  };

  // Extract base/quote from pair like "EUR/USD"
  const currencies = pair.split("/");
  const base = currencies[0] || "";
  const quote = currencies[1] || "";

  return (
    <>
      {/* Session Indicator */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          🌍 Market Sessions
        </div>
        <ForexSessionIndicator />
      </div>

      {/* Economic Calendar */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          📅 Economic Calendar <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(simulated)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {events.map((evt, i) => {
            const imp = impactStyle(evt.impact);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--color-background)",
                  border: `1px solid var(--color-border)`,
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color: "var(--color-foreground)",
                    width: "40px",
                    flexShrink: 0,
                  }}
                >
                  {evt.time}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    width: "28px",
                    flexShrink: 0,
                  }}
                >
                  {evt.currency}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {evt.event}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-muted-foreground)", marginTop: "1px" }}>
                    Fcst: {evt.forecast} · Prev: {evt.previous}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: imp.bg,
                    color: imp.color,
                    border: `1px solid ${imp.border}`,
                    flexShrink: 0,
                  }}
                >
                  {evt.impact}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currency Strength Meter */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          💪 Currency Strength <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(simulated)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Object.entries(strengthData)
            .sort((a, b) => b[1] - a[1])
            .map(([cur, str]) => {
              const isRelevant = cur === base || cur === quote;
              return (
                <div
                  key={cur}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: isRelevant ? "6px 8px" : "4px 8px",
                    borderRadius: "6px",
                    background: isRelevant ? "rgba(124,155,196,0.10)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isRelevant ? "var(--color-primary)" : "var(--color-muted-foreground)",
                      width: "28px",
                      flexShrink: 0,
                    }}
                  >
                    {cur}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      borderRadius: "3px",
                      background: "var(--color-background)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${str}%`,
                        height: "100%",
                        borderRadius: "3px",
                        background: str >= 65
                          ? "var(--color-bullish)"
                          : str >= 50
                            ? "#F0B90B"
                            : "var(--color-bearish)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      color: "var(--color-foreground)",
                      width: "24px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {str}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

// ── Commodity-Specific Sections ─────────────────────────────────────────────

function CommoditySections({ tokenData, symbol }: { tokenData: TokenItem | null; symbol: string }) {
  const s = symbol.toUpperCase();
  const price = tokenData?.price ?? 0;

  // Determine correlation target based on symbol
  const correlationTarget = s.includes("XAU") || s.includes("GOLD") ? "DXY" : s.includes("XAG") || s.includes("SILVER") ? "XAU" : "US10Y";
  const correlationValue = s.includes("XAU") || s.includes("GOLD") ? -0.87 : s.includes("XAG") ? 0.92 : -0.45;

  // Simulated key levels based on price
  const resistance = price > 0 ? +(price * 1.035).toFixed(2) : 0;
  const support = price > 0 ? +(price * 0.965).toFixed(2) : 0;
  const pivot = price > 0 ? +(price * 1.0).toFixed(2) : 0;

  // Determine session
  const hour = new Date().getUTCHours();
  const session =
    hour >= 0 && hour < 6 ? "Asian Session" :
    hour >= 6 && hour < 14 ? "London Session" :
    hour >= 14 && hour < 21 ? "New York Session" :
    "After-Hours (Low Liquidity)";

  const sessionColor =
    hour >= 6 && hour < 21 ? "var(--color-bullish)" : "var(--color-bearish)";

  return (
    <div
      style={{
        padding: "16px",
        borderBottom: `1px solid var(--color-border)`,
        background: "var(--color-card)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "14px",
        }}
      >
        🏭 Commodity Insights
      </div>

      {/* Current Session */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--color-background)",
          border: `1px solid var(--color-border)`,
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "14px" }}>🕐</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Current Session</div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: sessionColor, marginTop: "2px" }}>
            {session}
          </div>
        </div>
      </div>

      {/* Correlation Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--color-background)",
          border: `1px solid var(--color-border)`,
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "14px" }}>🔗</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>Correlation <span style={{ fontSize: "9px", opacity: 0.6 }}>(est.)</span></div>
          <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace", marginTop: "2px", color: "var(--color-foreground)" }}>
            {s} ↔ {correlationTarget}:{" "}
            <span
              style={{
                color: correlationValue < 0 ? "var(--color-bearish)" : "var(--color-bullish)",
              }}
            >
              {correlationValue > 0 ? "+" : ""}{correlationValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Key Levels */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        Key Levels <span style={{ fontSize: "9px", opacity: 0.6, fontWeight: 500 }}>(est.)</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
        }}
      >
        <MetricCard>
          <MetricCardLabel>Resistance</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-bearish)",
              }}
            >
              {resistance > 0 ? fmtPrice(resistance) : "—"}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>Pivot</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-primary)",
              }}
            >
              {pivot > 0 ? fmtPrice(pivot) : "—"}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>Support</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: "var(--color-bullish)",
              }}
            >
              {support > 0 ? fmtPrice(support) : "—"}
            </span>
          </div>
        </MetricCard>
      </div>
    </div>
  );
}

function MarketStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: "var(--color-background)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          color: "var(--color-foreground)",
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function QuickCalcRow({
  label,
  value,
  mono = false,
  valueColor,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: `1px solid rgba(124,155,196,0.04)`,
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: "var(--color-muted-foreground)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: mono
            ? "'JetBrains Mono', ui-monospace, monospace"
            : undefined,
          color: valueColor || "var(--color-foreground)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MetricCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-background)",
        borderRadius: "8px",
        padding: "12px",
        border: `1px solid var(--color-border)`,
      }}
    >
      {children}
    </div>
  );
}

function MetricCardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--color-muted-foreground)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </div>
  );
}

function MetricPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          color: color || "var(--color-foreground)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "10px",
          color: "var(--color-muted-foreground)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PageScrollArea({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="scrollbar-hide"
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}

// ── Trade Row Component (kept from original) ─────────────────────────────────

const TokenTradeRow = memo(function TokenTradeRow({
  trade,
}: {
  trade: any;
}) {
  const isPos = (trade.pnl || 0) >= 0;
  const isLong = trade.direction === "long";
  const fmtPrice = (n: number) =>
    n < 0.001
      ? n.toFixed(8)
      : n < 1
        ? n.toFixed(6)
        : n.toFixed(2);

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div style={{ width: "50px" }}>
          <Badge
            label={(trade.direction || "").toUpperCase()}
            color={isLong ? "var(--color-bullish)" : "var(--color-bearish)"}
            small
          />
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            color: "var(--color-foreground)",
          }}
        >
          {fmtPrice(trade.entry_price)}
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            color: "var(--color-muted-foreground)",
          }}
        >
          {trade.exit_price ? fmtPrice(trade.exit_price) : "—"}
        </div>
        <div
          style={{
            width: "60px",
            textAlign: "right",
            color: "var(--color-muted-foreground)",
          }}
        >
          {trade.quantity ?? "—"}
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            fontWeight: 700,
            color: isPos ? "var(--color-bullish)" : "var(--color-bearish)",
          }}
        >
          {trade.pnl != null
            ? (isPos ? "+" : "") + trade.pnl.toFixed(2)
            : "—"}
        </div>
        <div
          style={{
            width: "50px",
            textAlign: "right",
            color:
              trade.r_multiple && trade.r_multiple > 0
                ? "var(--color-bullish)"
                : "var(--color-muted-foreground)",
          }}
        >
          {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "right",
            color: "var(--color-muted-foreground)",
            fontSize: "10px",
          }}
        >
          {new Date(trade.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </DataRow>
  );
});