// ── Types ────────────────────────────────────────────────────────────────────

export interface TokenItem {
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

export interface DiscoverResponse {
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

export function toTradingViewSymbol(symbol: string): string {
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

export function fmtPrice(p: number | null): string {
  if (p === null || p === undefined || p === 0) return "\u2014";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function fmtChange(n: number | null): string {
  if (n === null || n === undefined) return "\u2014";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtPct(n: number | undefined): string {
  if (n === undefined || n === null) return "\u2014";
  return `${n.toFixed(0)}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getChainLabel(chain: string): string {
  const c = (chain || "").toLowerCase();
  if (c.includes("sol")) return "SOL";
  if (c.includes("eth") || c.includes("ethereum")) return "ETH";
  if (c.includes("base")) return "BASE";
  if (c.includes("arb") || c.includes("arbitrum")) return "ARB";
  if (c.includes("poly") || c.includes("matic")) return "POLY";
  if (c.includes("bsc") || c.includes("bnb")) return "BSC";
  return (chain || "UNKNOWN").toUpperCase().slice(0, 6);
}

export function getRiskColor(risk?: string): string {
  if (!risk) return "var(--color-muted-foreground)";
  const r = risk.toLowerCase();
  if (r === "low") return "var(--color-bullish)";
  if (r === "medium") return "var(--color-gold)";
  if (r === "high") return "var(--color-bearish)";
  return "var(--color-muted-foreground)";
}

// ── Asset Type Detection ─────────────────────────────────────────────────────

export type AssetType = "meme" | "crypto" | "forex" | "commodity" | "unknown";

export function detectAssetType(symbol: string, chain?: string): AssetType {
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

export function getAssetTypeBadge(assetType: AssetType): { label: string; color: string } {
  switch (assetType) {
    case "meme":
      return { label: "MEME \uD83D\uDC15", color: "#F7931A" };
    case "crypto":
      return { label: "CRYPTO \u20BF", color: "var(--color-primary)" };
    case "forex":
      return { label: "FOREX \uD83D\uDCB1", color: "#A78BFA" };
    case "commodity":
      return { label: "COMMODITY \uD83C\uDFC7", color: "var(--color-gold)" };
    default:
      return { label: "TOKEN", color: "var(--color-muted-foreground)" };
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

export const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

// ── Telegram Detection ───────────────────────────────────────────────────────

/** True when running inside the Telegram in-app browser / WebView. */
export function isTelegramWebView(): boolean {
  return !!(typeof window !== "undefined" && (window as any).Telegram?.WebApp);
}
