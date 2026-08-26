import { useParams, useSearch, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getTradeHistory, getRecentAnalyses, getWatchlistData } from "@/shared/data";
import { getEconomicCalendar } from "@/domains/market/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { BinanceWS, type LivePrice } from "@/shared/market-data/binance-ws";
import { DexScreenerWS } from "@/shared/market-data/dexscreener-ws";
import { DexChart } from "@/components/vixor/DexChart";
import { DexToolsButton } from "@/components/vixor/DexToolsChart";
import { TradingViewChart } from "@/components/vixor/TradingViewChart";
import {
  PageLayout,
  StatsRow,
  DataRow,
  Badge,
  ScrollArea,
  EmptyState,
  SectionTitle,
} from "@/components/vixor/PageLayout";

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
  if (r === "medium") return "var(--color-gold)";
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
  if (["XAU", "XAG", "XPT", "OIL", "WTI", "BRENT", "GOLD", "SILVER"].some((c) => s.includes(c)))
    return "commodity";
  // Meme coins (common meme tokens)
  const memeTokens = [
    "BONK",
    "WIF",
    "PEPE",
    "DOGE",
    "SHIB",
    "FLOKI",
    "BOME",
    "MEME",
    "TURBO",
    "MOG",
    "BRETT",
    "SPX",
    "GIGA",
    "POPCAT",
    "MEW",
    "NEIRO",
    "BUBBA",
  ];
  if (memeTokens.includes(s)) return "meme";
  // Chain-specific meme detection
  if (chain && ["solana", "base", "eth"].includes(chain.toLowerCase())) {
    const majorCrypto = [
      "BTC",
      "ETH",
      "SOL",
      "USDT",
      "USDC",
      "BNB",
      "XRP",
      "ADA",
      "AVAX",
      "DOT",
      "LINK",
      "MATIC",
      "UNI",
    ];
    if (!majorCrypto.includes(s)) return "meme";
  }
  return "crypto";
}

function getAssetTypeBadge(assetType: AssetType): { label: string; color: string } {
  switch (assetType) {
    case "meme":
      return { label: "MEME 🐕", color: "#F7931A" };
    case "crypto":
      return { label: "CRYPTO ₿", color: "var(--color-primary)" };
    case "forex":
      return { label: "FOREX 💱", color: "#A78BFA" };
    case "commodity":
      return { label: "COMMODITY 🥇", color: "var(--color-gold)" };
    default:
      return { label: "TOKEN", color: "var(--color-muted-foreground)" };
  }
}

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

// ── Main Page Component ──────────────────────────────────────────────────────

export function TokenPage() {
  const { symbol } = useParams({ from: "/_authenticated/token/$symbol" });
  const search = useSearch({ from: "/_authenticated/token/$symbol" });
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

  // Fetch DEX token data via direct client-side DexScreener CORS search API
  const discoveryQuery = useQuery({
    queryKey: ["token-discovery", symbol],
    queryFn: async () => {
      if (!symbol?.trim()) return [];
      try {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol.trim())}`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.pairs || !Array.isArray(data.pairs)) return [];
        return data.pairs.slice(0, 10).map((p: any) => ({
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
          price: p.priceUsd ? parseFloat(p.priceUsd) : null,
          chain: p.chainId || "solana",
          liquidity: p.liquidity?.usd ?? 0,
        }));
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  // Find matching discovery token
  const tokenData = useMemo(() => {
    if (!discoveryQuery.data?.length) return null;
    const upper = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return (
      discoveryQuery.data.find(
        (t: any) => t.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "") === upper,
      ) ||
      discoveryQuery.data[0] ||
      null
    );
  }, [discoveryQuery.data, symbol]);

  // Detect asset type
  const assetType = useMemo(
    () => detectAssetType(symbol, tokenData?.chain),
    [symbol, tokenData?.chain],
  );
  const assetBadge = getAssetTypeBadge(assetType);

  const dexUrl = search.dexUrl || tokenData?.url;
  const pairAddress = search.pairAddress || tokenData?.pairAddress;
  const chainFromDiscover = search.chain || tokenData?.chainId;
  const isContractAddress = symbol.length >= 25 || /^[0-9a-zA-Z]{32,}$/.test(symbol);
  const isDexToken =
    !!(chainFromDiscover && pairAddress) || assetType === "meme" || isContractAddress;

  // ── Derived Data ──

  const allTrades = tradesQuery.data?.trades ?? [];
  const tokenTrades = allTrades.filter((t: any) =>
    t.pair?.toUpperCase().includes(symbol.toUpperCase()),
  );
  const closedTrades = tokenTrades.filter((t: any) => t.status === "closed" && t.pnl != null);
  const totalPnl = closedTrades.reduce((s: number, t: any) => s + (t.pnl || 0), 0);
  const winRate =
    closedTrades.length > 0
      ? Math.round(
          (closedTrades.filter((t: any) => (t.pnl || 0) > 0).length / closedTrades.length) * 100,
        )
      : 0;

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
        symbol.toUpperCase().replace(/[^A-Z0-9]/g, ""),
    );
  }, [watchlistQuery.data, symbol]);

  // ── Live Binance price for this token (if listed) ──
  const binanceSymbol = useMemo(() => {
    const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Check if this is a known Binance pair (crypto, not forex/commodity)
    if (assetType === "forex" || assetType === "commodity") return null;
    return `${clean}USDT`;
  }, [symbol, assetType]);

  const [liveBinancePrice, setLiveBinancePrice] = useState<LivePrice | null>(null);
  const [liveDexPrice, setLiveDexPrice] = useState<{ price: number; change24h: number } | null>(
    null,
  );

  // Binance WS for CEX tokens
  useEffect(() => {
    if (!binanceSymbol) return;
    const ws = BinanceWS.getInstance();
    const unsub = ws.subscribe(
      [binanceSymbol],
      (prices) => {
        const p = prices.get(binanceSymbol);
        if (p) setLiveBinancePrice(p);
      },
      undefined,
    );
    return () => unsub();
  }, [binanceSymbol]);

  // DexScreener WS for DEX tokens (real-time)
  useEffect(() => {
    if (!isDexToken || !chainFromDiscover || !pairAddress) return;
    const ws = DexScreenerWS.getInstance();
    const key = `${chainFromDiscover}:${pairAddress}`;
    const unsub = ws.subscribe([{ chainId: chainFromDiscover, pairAddress }], (prices) => {
      const p = prices.get(key);
      if (p && p.price > 0) setLiveDexPrice({ price: p.price, change24h: p.change24h });
    });
    return () => unsub();
  }, [isDexToken, chainFromDiscover, pairAddress]);

  // Use live price if available
  const displayPrice = liveBinancePrice?.price ?? liveDexPrice?.price ?? tokenData?.price ?? null;
  const displayChange =
    liveBinancePrice?.change24h ?? liveDexPrice?.change24h ?? tokenData?.change24h ?? null;
  const isPriceLive = !!(liveBinancePrice || liveDexPrice);

  // ── Quick Trade State ──

  const [direction, setDirection] = useState<"long" | "short">("long");
  const [amount, setAmount] = useState("100");
  const [leverage, setLeverage] = useState(5);

  const entryPrice = displayPrice ?? 0;
  const numericAmount = parseFloat(amount) || 0;
  const estimatedTokens = entryPrice > 0 ? (numericAmount * leverage) / entryPrice : 0;
  const slDistance = direction === "long" ? 0.02 : 0.02;
  const slPrice =
    direction === "long" ? entryPrice * (1 - slDistance) : entryPrice * (1 + slDistance);

  // ── Loading state ──

  const isInitialLoading = tradesQuery.isLoading || discoveryQuery.isLoading;

  // ── Forex / Commodity: show TradingView as primary view ──
  const isTraditionalAsset = assetType === "forex" || assetType === "commodity";
  const tvSymbol = toTradingViewSymbol(symbol);

  if (isTraditionalAsset) {
    return (
      <PageLayout
        title={symbol.toUpperCase()}
        badge={assetBadge.label}
        badgeColor={assetBadge.color}
      >
        <PageScrollArea>
          <div style={{ padding: 0 }}>
            <TradingViewChart symbol={tvSymbol} height="60vh" />
            {/* Basic info below chart */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-card)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "var(--color-foreground)",
                      margin: 0,
                    }}
                  >
                    {symbol.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-muted-foreground)",
                      marginTop: "4px",
                    }}
                  >
                    {assetType === "commodity" ? "Commodity · TradingView" : "Forex · TradingView"}
                  </div>
                </div>
                <Badge label={assetBadge.label} color={assetBadge.color} />
              </div>
            </div>
            {/* Trade history for this pair */}
            {tokenTrades.length > 0 && (
              <>
                <SectionTitle title="Trade History" count={tokenTrades.length} />
                {tokenTrades.slice(0, 10).map((t: any) => (
                  <DataRow key={t.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Badge
                          label={t.direction?.toUpperCase() || "N/A"}
                          color={
                            t.direction === "long" ? "var(--color-bullish)" : "var(--color-bearish)"
                          }
                          small
                        />
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {t.pair}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color:
                            (t.pnl ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                        }}
                      >
                        {(t.pnl ?? 0) >= 0 ? "+" : ""}
                        {t.pnl?.toFixed(2)}
                      </span>
                    </div>
                  </DataRow>
                ))}
              </>
            )}
          </div>
        </PageScrollArea>
      </PageLayout>
    );
  }

  // ── Meme / Crypto: fallback when discovery API returns no data ──
  if (!isInitialLoading && !tokenData && (assetType === "meme" || assetType === "crypto")) {
    return (
      <PageLayout
        title={symbol.toUpperCase()}
        badge={assetBadge.label}
        badgeColor={assetBadge.color}
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
            search={{
              category: "ALL",
              sortBy: "trending",
              search: "",
              minLiquidity: undefined,
              minVolume: undefined,
              honeypotOnly: false,
              smartMoneyMin: undefined,
            }}
            style={{
              color: "var(--color-primary)",
              fontSize: "11px",
              textDecoration: "none",
            }}
          >
            Discover
          </Link>
          <span style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>/</span>
          <span style={{ color: "var(--color-foreground)", fontSize: "11px", fontWeight: 600 }}>
            {symbol.toUpperCase()}
          </span>
        </div>

        <PageScrollArea>
          <div
            style={{
              padding: "16px",
              borderBottom: `1px solid var(--color-border)`,
              background: "var(--color-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--color-foreground)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {symbol.toUpperCase()}
                </h2>
                <Badge label={assetBadge.label} color={assetBadge.color} small />
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => {
                    if (!isWatched) {
                      navigate({ to: "/trackers" });
                    }
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: `1px solid var(--color-border)`,
                    background: isWatched
                      ? "color-mix(in srgb, var(--color-bullish) 12%, transparent)"
                      : "var(--color-card)",
                    color: isWatched ? "var(--color-bullish)" : "var(--color-muted-foreground)",
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
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/token/${symbol}`);
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
          </div>

          {pairAddress && chainFromDiscover ? (
            <DexChart
              chainId={chainFromDiscover}
              pairAddress={pairAddress}
              livePrice={liveDexPrice?.price}
              height={typeof window !== "undefined" && window.innerWidth < 768 ? "300px" : "400px"}
            />
          ) : isDexToken || isContractAddress ? (
            <div
              style={{
                width: "100%",
                height:
                  typeof window !== "undefined" && window.innerWidth < 768 ? "300px" : "400px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-card)",
                borderBottom: "1px solid var(--color-border)",
                gap: "10px",
              }}
            >
              <svg
                style={{ width: 36, height: 36, opacity: 0.3 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-muted-foreground)",
                  fontWeight: 600,
                }}
              >
                Chart data unavailable
              </div>
              {dexUrl && (
                <a
                  href={dexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "11px",
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-primary)",
                    background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                  }}
                >
                  View on DexScreener →
                </a>
              )}
              {pairAddress && chainFromDiscover && (
                <DexToolsButton chainId={chainFromDiscover} pairAddress={pairAddress} label="DEXTools" />
              )}
            </div>
          ) : (
            <TradingViewChart
              symbol={tvSymbol}
              height={typeof window !== "undefined" && window.innerWidth < 768 ? "300px" : "400px"}
            />
          )}

          <div
            style={{
              padding: "14px 16px",
              background: "var(--color-card)",
              borderBottom: `1px solid var(--color-border)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "var(--color-muted-foreground)",
                lineHeight: 1.5,
              }}
            >
              {isDexToken
                ? `Live chart · ${chainFromDiscover?.toUpperCase() ?? "DEX"}`
                : "Chart powered by TradingView."}
            </p>
            {isDexToken && dexUrl && (
              <a
                href={dexUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "10px",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Open on DexScreener →
              </a>
            )}
          </div>

          <div style={{ padding: "20px 16px", background: "var(--color-card)" }}>
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
                background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                color: "var(--color-primary)",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background =
                  "color-mix(in srgb, var(--color-primary) 18%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background =
                  "color-mix(in srgb, var(--color-primary) 10%, transparent)";
              }}
            >
              <span style={{ fontSize: "16px" }}>⚡</span>
              ANALYZE {symbol.toUpperCase()}
            </button>
          </div>

          <div style={{ height: "24px" }} />
        </PageScrollArea>
      </PageLayout>
    );
  }

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
          search={{
            category: "ALL",
            sortBy: "trending",
            search: "",
            minLiquidity: undefined,
            minVolume: undefined,
            honeypotOnly: false,
            smartMoneyMin: undefined,
          }}
          style={{
            color: "var(--color-primary)",
            fontSize: "11px",
            textDecoration: "none",
          }}
        >
          Discover
        </Link>
        <span style={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}>/</span>
        <span style={{ color: "var(--color-foreground)", fontSize: "11px", fontWeight: 600 }}>
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
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ${symbol.toUpperCase()}
                </span>
                <Badge
                  label={getChainLabel(tokenData?.chain ?? "")}
                  color={"var(--color-primary)"}
                  small
                />
                <Badge label={assetBadge.label} color={assetBadge.color} small />
                {tokenData?.risk && (
                  <Badge
                    label={`${tokenData.risk.toUpperCase()} RISK`}
                    color={getRiskColor(tokenData.risk)}
                    small
                  />
                )}
              </div>

              {/* Price + 24h change */}
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                {isPriceLive && (
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      padding: "2px 5px",
                      borderRadius: "3px",
                      background: "color-mix(in srgb, var(--color-bullish) 15%, transparent)",
                      color: "var(--color-bullish)",
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                    }}
                  >
                    LIVE
                  </span>
                )}
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-foreground)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {fmtPrice(displayPrice)}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color:
                      (displayChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                    marginLeft: "10px",
                  }}
                >
                  {fmtChange(displayChange)}
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
                    ? "color-mix(in srgb, var(--color-bullish) 12%, transparent)"
                    : "var(--color-card)",
                  color: isWatched ? "var(--color-bullish)" : "var(--color-muted-foreground)",
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
                    navigator.clipboard.writeText(`${window.location.origin}/token/${symbol}`);
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
            <MarketStat label="Market Cap" value={fmtCompact(tokenData?.marketCap ?? 0)} />
            <MarketStat label="24h Volume" value={fmtCompact(tokenData?.volume24h ?? 0)} />
            <MarketStat label="Liquidity" value={fmtCompact(tokenData?.liquidity ?? 0)} />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            2. CHART — Native DexChart for DEX, TradingView for majors
        ════════════════════════════════════════════════════════════════════ */}
        {pairAddress && chainFromDiscover ? (
          <DexChart
            chainId={chainFromDiscover}
            pairAddress={pairAddress}
            livePrice={liveDexPrice?.price}
            height={typeof window !== "undefined" && window.innerWidth < 768 ? "300px" : "400px"}
          />
        ) : isDexToken || isContractAddress ? (
          <div
            style={{
              width: "100%",
              height: typeof window !== "undefined" && window.innerWidth < 768 ? "300px" : "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-card)",
              borderBottom: "1px solid var(--color-border)",
              gap: "10px",
            }}
          >
            <svg
              style={{ width: 36, height: 36, opacity: 0.3 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
            <div
              style={{ fontSize: "12px", color: "var(--color-muted-foreground)", fontWeight: 600 }}
            >
              Chart data unavailable
            </div>
            {dexUrl && (
              <a
                href={dexUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-primary)",
                  background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                }}
              >
                View on DexScreener →
              </a>
            )}
            {pairAddress && chainFromDiscover && (
              <DexToolsButton chainId={chainFromDiscover} pairAddress={pairAddress} label="DEXTools" />
            )}
          </div>
        ) : (
          <TradingViewChart
            symbol={tvSymbol}
            height={typeof window !== "undefined" && window.innerWidth < 768 ? "300px" : "400px"}
          />
        )}

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
                fontFamily: "var(--font-mono)",
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
                        ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                        : "var(--color-card)",
                    color:
                      leverage === lev ? "var(--color-primary)" : "var(--color-muted-foreground)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
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
            <QuickCalcRow label="Entry Price" value={fmtPrice(entryPrice)} mono />
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
              background: direction === "long" ? "var(--color-bullish)" : "var(--color-bearish)",
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
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-info)",
                  }}
                >
                  {tokenData?.marketCap && tokenData.marketCap > 0
                    ? ((tokenData.volume24h / tokenData.marketCap) * 100).toFixed(1) + "%"
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
                    fontFamily: "var(--font-mono)",
                    color:
                      (tokenData?.smartMoneyPct ?? 0) >= 50
                        ? "var(--color-bullish)"
                        : (tokenData?.smartMoneyPct ?? 0) >= 25
                          ? "var(--color-gold)"
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
                    fontFamily: "var(--font-mono)",
                    color:
                      (tokenData?.discoveryScore ?? 0) >= 60
                        ? "var(--color-bullish)"
                        : (tokenData?.discoveryScore ?? 0) >= 30
                          ? "var(--color-gold)"
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
        {assetType === "meme" && <MemeSections tokenData={tokenData} />}
        {assetType === "crypto" && <CryptoSections tokenData={tokenData} />}

        {/* ════════════════════════════════════════════════════════════════════
            5. RELATED ANALYSES
        ════════════════════════════════════════════════════════════════════ */}
        <SectionTitle title="Related Analyses" count={relatedAnalyses.length} />

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
                    label={(a.recommendation || "N/A").toUpperCase()}
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
                        fontFamily: "var(--font-mono)",
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
                    fontFamily: "var(--font-mono)",
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
              color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
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
          tokenTrades.map((trade: any) => <TokenTradeRow key={trade.id} trade={trade} />)
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
              background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              color: "var(--color-primary)",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background =
                "color-mix(in srgb, var(--color-primary) 18%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background =
                "color-mix(in srgb, var(--color-primary) 10%, transparent)";
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
    { name: "Tokyo", start: 0, end: 540, color: "var(--color-gold)" },
    { name: "London", start: 480, end: 1020, color: "var(--color-primary)" },
    { name: "New York", start: 780, end: 1320, color: "var(--color-bullish)" },
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
        const minsUntil = now < s.start ? s.start - now : now >= s.end ? 1440 - now + s.start : 0;
        const status = isActive ? "active" : minsUntil <= 120 ? "upcoming" : "closed";
        const dotColor =
          status === "active"
            ? s.color
            : status === "upcoming"
              ? "var(--color-gold)"
              : "var(--color-muted-foreground)";
        return (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 600,
              color:
                status === "active" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
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

function GaugeBar({
  value,
  max = 100,
  color,
  label,
}: {
  value: number;
  max?: number;
  color: string;
  label: string;
}) {
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
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>
          {label}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
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
  const hypeRaw = Math.min(
    Math.round(socialScore * 0.6 + Math.min(volume / 100000, 40) * 0.4),
    100,
  );
  const hypeLevel =
    hypeRaw >= 80
      ? { label: "FRENZY", color: "var(--color-bearish)" }
      : hypeRaw >= 60
        ? { label: "HIGH", color: "#F7931A" }
        : hypeRaw >= 40
          ? { label: "MODERATE", color: "var(--color-gold)" }
          : hypeRaw >= 20
            ? { label: "LOW", color: "var(--color-primary)" }
            : { label: "DORMANT", color: "var(--color-muted-foreground)" };

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
          color={
            socialScore >= 60
              ? "var(--color-bullish)"
              : socialScore >= 30
                ? "var(--color-gold)"
                : "var(--color-bearish)"
          }
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
            <span
              style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
            >
              Hype Level
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
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
                background: `linear-gradient(90deg, var(--color-primary), ${hypeLevel.color})`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Smart Money Gauge */}
        <div style={{ marginTop: "14px" }}>
          <GaugeBar
            value={smartMoneyPct}
            color={
              smartMoneyPct >= 50
                ? "var(--color-bullish)"
                : smartMoneyPct >= 25
                  ? "var(--color-gold)"
                  : "var(--color-bearish)"
            }
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
                background: "var(--bearish-bg)",
                border: `1px solid color-mix(in srgb, var(--color-bearish) 25%, transparent)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>🚫</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-bearish)" }}>
                  HONEYPOT DETECTED
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
                  You may not be able to sell this token
                </div>
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
                background: "color-mix(in srgb, var(--color-gold) 0.12%, transparent)",
                border: `1px solid color-mix(in srgb, var(--color-gold) 0.25%, transparent)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>💧</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-gold)" }}>
                  LOW LIQUIDITY
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
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
                background: "var(--bullish-bg)",
                border: `1px solid var(--bullish-border)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>✓</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-bullish)" }}>
                  NO MAJOR FLAGS
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
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
  const holderCount = tokenData?.marketCap ? Math.round(tokenData.marketCap * 0.001 + 500) : 0;
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
        ⛓️ On-Chain Metrics{" "}
        <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(est.)</span>
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
                fontFamily: "var(--font-mono)",
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
                fontFamily: "var(--font-mono)",
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
                fontFamily: "var(--font-mono)",
                color: "var(--color-gold)",
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
              background: "var(--color-gold)",
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
          <div
            style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            Whale Activity (24h)
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
              marginTop: "2px",
            }}
          >
            {whaleTxCount} large tx{whaleTxCount !== 1 ? "s" : ""} detected
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-muted-foreground)",
                marginLeft: "6px",
              }}
            >
              (simulated)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Forex-Specific Sections ─────────────────────────────────────────────────

function ForexSections({ symbol }: { symbol: string }) {
  const pair = symbol.toUpperCase();

  // Fetch real economic events from server API
  const fetchCalendar = useStableServerFn(async () => {
    return getEconomicCalendar({ data: { days: 7 } });
  });

  const calendarQuery = useQuery({
    queryKey: ["forex-economic-calendar"],
    queryFn: fetchCalendar,
    staleTime: 300_000, // 5 min
  });

  const events = Array.isArray(calendarQuery.data)
    ? calendarQuery.data
        .filter((e: any) => e && e.event && e.impact)
        .slice(0, 8)
        .map((e: any) => ({
          time: e.time || "",
          currency: e.currency || "USD",
          event: e.event || "Unknown",
          impact: (e.impact || "medium").toLowerCase() as "high" | "medium" | "low",
          forecast: e.forecast || "—",
          previous: e.previous || "—",
        }))
    : [];

  // Simulated currency strength (0-100)
  const strengthData: Record<string, number> = {
    USD: 72,
    EUR: 65,
    GBP: 58,
    JPY: 45,
    AUD: 51,
    NZD: 48,
    CAD: 54,
    CHF: 61,
  };

  const impactStyle = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return {
          bg: "color-mix(in srgb, var(--color-bearish) 15%, transparent)",
          border: "var(--color-bearish)",
          color: "var(--color-bearish)",
        };
      case "medium":
        return {
          bg: "color-mix(in srgb, var(--color-gold) 0.15%, transparent)",
          border: "var(--color-gold)",
          color: "var(--color-gold)",
        };
      default:
        return {
          bg: "color-mix(in srgb, var(--color-bullish) 15%, transparent)",
          border: "var(--color-bullish)",
          color: "var(--color-bullish)",
        };
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
          📅 Economic Calendar{" "}
          {events.length === 0 && (
            <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(no data)</span>
          )}
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
                    fontFamily: "var(--font-mono)",
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
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {evt.event}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-muted-foreground)",
                      marginTop: "1px",
                    }}
                  >
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
          💪 Currency Strength{" "}
          <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(simulated)</span>
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
                    background: isRelevant
                      ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                      : "transparent",
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
                        background:
                          str >= 65
                            ? "var(--color-bullish)"
                            : str >= 50
                              ? "var(--color-gold)"
                              : "var(--color-bearish)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
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
  const correlationTarget =
    s.includes("XAU") || s.includes("GOLD")
      ? "DXY"
      : s.includes("XAG") || s.includes("SILVER")
        ? "XAU"
        : "US10Y";
  const correlationValue =
    s.includes("XAU") || s.includes("GOLD") ? -0.87 : s.includes("XAG") ? 0.92 : -0.45;

  // Simulated key levels based on price
  const resistance = price > 0 ? +(price * 1.035).toFixed(2) : 0;
  const support = price > 0 ? +(price * 0.965).toFixed(2) : 0;
  const pivot = price > 0 ? +(price * 1.0).toFixed(2) : 0;

  // Determine session
  const hour = new Date().getUTCHours();
  const session =
    hour >= 0 && hour < 6
      ? "Asian Session"
      : hour >= 6 && hour < 14
        ? "London Session"
        : hour >= 14 && hour < 21
          ? "New York Session"
          : "After-Hours (Low Liquidity)";

  const sessionColor = hour >= 6 && hour < 21 ? "var(--color-bullish)" : "var(--color-bearish)";

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
          <div
            style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            Current Session
          </div>
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
          <div
            style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            Correlation <span style={{ fontSize: "9px", opacity: 0.6 }}>(est.)</span>
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              marginTop: "2px",
              color: "var(--color-foreground)",
            }}
          >
            {s} ↔ {correlationTarget}:{" "}
            <span
              style={{
                color: correlationValue < 0 ? "var(--color-bearish)" : "var(--color-bullish)",
              }}
            >
              {correlationValue > 0 ? "+" : ""}
              {correlationValue.toFixed(2)}
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
                fontFamily: "var(--font-mono)",
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
                fontFamily: "var(--font-mono)",
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
                fontFamily: "var(--font-mono)",
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
          fontFamily: "var(--font-mono)",
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
        borderBottom: `1px solid color-mix(in srgb, var(--color-primary) 4%, transparent)`,
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
          fontFamily: mono ? "var(--font-mono)" : undefined,
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

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
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
          fontFamily: "var(--font-mono)",
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

const TokenTradeRow = memo(function TokenTradeRow({ trade }: { trade: any }) {
  const isPos = (trade.pnl || 0) >= 0;
  const isLong = trade.direction === "long";
  const fmtPrice = (n: number) => (n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2));

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
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
          {trade.pnl != null ? (isPos ? "+" : "") + trade.pnl.toFixed(2) : "—"}
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
