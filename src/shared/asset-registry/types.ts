// ============================================================================
// VIXOR Asset Master Registry — Single Source of Truth for All Trading Assets
// ============================================================================
//
// This module is the ONLY place where asset definitions live.
// All domains (market, analysis, trading, copilot, etc.) MUST reference
// assets through this registry — never hardcode pairs or symbols elsewhere.
//
// Architecture Rules:
//   1. Every tradable asset is defined ONCE here
//   2. All symbol mappings (Binance, TwelveData, TradingView, etc.) live here
//   3. Pair configs (decimals, pip size, volatility) live here
//   4. Categories and classifications live here
//   5. UI display info (icons, labels) lives here
//
// Usage:
//   import { AssetRegistry } from "@/shared/asset-registry";
//   const asset = AssetRegistry.get("BTC/USDT");
//   const binanceSymbol = asset.symbols.binance; // "BTCUSDT"
// ============================================================================

// ── Asset Category ──────────────────────────────────────────────────────────

export type AssetCategory = "crypto" | "forex" | "commodity" | "index" | "stock";

// ── Data Source Mapping ─────────────────────────────────────────────────────

export interface AssetSymbolMappings {
  /** Binance API symbol (e.g., "BTCUSDT" for crypto pairs) */
  binance?: string;
  /** TwelveData API symbol (e.g., "XAU/USD", "EUR/USD") */
  twelveData?: string;
  /** Finnhub forex symbol (e.g., "EURUSD") */
  finnhub?: string;
  /** TradingView chart symbol (e.g., "BINANCE:BTCUSDT") */
  tradingView?: string;
  /** Exchange rate API base/quote pair (derived from pair) */
  exchangeRate?: { base: string; quote: string };
}

// ── Asset Configuration ─────────────────────────────────────────────────────

export interface AssetConfig {
  /** Minimum price increment (pip size) */
  pipSize: number;
  /** Number of decimal places for display */
  decimals: number;
  /** Typical daily volatility as a fraction (e.g., 0.03 = 3%) */
  volatility: number;
  /** Typical daily ATR as a fraction of price */
  typicalRange: number;
  /** Approximate base price (used only for synthetic data generation) */
  basePrice: number;
}

// ── Full Asset Definition ───────────────────────────────────────────────────

export interface AssetDefinition {
  /** Canonical pair name (e.g., "BTC/USDT", "XAU/USD", "EUR/USD") */
  pair: string;
  /** Human-readable name (e.g., "Bitcoin", "Gold", "Euro / US Dollar") */
  name: string;
  /** Short label for UI (e.g., "BTC", "Gold", "EUR") */
  label: string;
  /** Display icon/emoji */
  icon: string;
  /** Asset category */
  category: AssetCategory;
  /** Base currency (e.g., "BTC", "XAU", "EUR") */
  base: string;
  /** Quote currency (e.g., "USDT", "USD", "JPY") */
  quote: string;
  /** Symbol mappings for various data sources */
  symbols: AssetSymbolMappings;
  /** Trading/display configuration */
  config: AssetConfig;
  /** Is this asset currently active/tradable? */
  active: boolean;
  /** Is this a popular pair shown in quick-select lists? */
  popular: boolean;
  /** Sort priority (lower = shown first) */
  priority: number;
}

// ── Timeframe Registry ──────────────────────────────────────────────────────

export interface TimeframeDefinition {
  /** Internal key (e.g., "1H", "4H", "1D") */
  key: string;
  /** Human-readable label */
  label: string;
  /** Binance API interval value */
  binanceInterval: string;
  /** TwelveData API interval value */
  twelveDataInterval: string;
  /** Duration in seconds */
  seconds: number;
  /** Is this a popular timeframe shown in quick-select? */
  popular: boolean;
}

export const TIMEFRAMES: TimeframeDefinition[] = [
  { key: "1M", label: "1 Min", binanceInterval: "1m", twelveDataInterval: "1min", seconds: 60, popular: false },
  { key: "5M", label: "5 Min", binanceInterval: "5m", twelveDataInterval: "5min", seconds: 300, popular: false },
  { key: "15M", label: "15 Min", binanceInterval: "15m", twelveDataInterval: "15min", seconds: 900, popular: true },
  { key: "30M", label: "30 Min", binanceInterval: "30m", twelveDataInterval: "30min", seconds: 1800, popular: false },
  { key: "1H", label: "1 Hour", binanceInterval: "1h", twelveDataInterval: "1h", seconds: 3600, popular: true },
  { key: "4H", label: "4 Hour", binanceInterval: "4h", twelveDataInterval: "4h", seconds: 14400, popular: true },
  { key: "1D", label: "1 Day", binanceInterval: "1d", twelveDataInterval: "1day", seconds: 86400, popular: true },
  { key: "1W", label: "1 Week", binanceInterval: "1w", twelveDataInterval: "1week", seconds: 604800, popular: false },
];

// ── Asset Definitions ───────────────────────────────────────────────────────

const ASSETS: AssetDefinition[] = [
  // ── Crypto ──────────────────────────────────────────────────────────
  {
    pair: "BTC/USDT",
    name: "Bitcoin",
    label: "BTC",
    icon: "₿",
    category: "crypto",
    base: "BTC",
    quote: "USDT",
    symbols: {
      binance: "BTCUSDT",
      twelveData: "BTC/USDT",
      tradingView: "BINANCE:BTCUSDT",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.03, typicalRange: 0.04, basePrice: 105000 },
    active: true,
    popular: true,
    priority: 1,
  },
  {
    pair: "ETH/USDT",
    name: "Ethereum",
    label: "ETH",
    icon: "Ξ",
    category: "crypto",
    base: "ETH",
    quote: "USDT",
    symbols: {
      binance: "ETHUSDT",
      twelveData: "ETH/USDT",
      tradingView: "BINANCE:ETHUSDT",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.028, typicalRange: 0.035, basePrice: 2600 },
    active: true,
    popular: true,
    priority: 2,
  },
  {
    pair: "SOL/USDT",
    name: "Solana",
    label: "SOL",
    icon: "◎",
    category: "crypto",
    base: "SOL",
    quote: "USDT",
    symbols: {
      binance: "SOLUSDT",
      twelveData: "SOL/USDT",
      tradingView: "BINANCE:SOLUSDT",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.04, typicalRange: 0.05, basePrice: 170 },
    active: true,
    popular: true,
    priority: 3,
  },
  {
    pair: "BNB/USDT",
    name: "Binance Coin",
    label: "BNB",
    icon: "◆",
    category: "crypto",
    base: "BNB",
    quote: "USDT",
    symbols: {
      binance: "BNBUSDT",
      twelveData: "BNB/USDT",
      tradingView: "BINANCE:BNBUSDT",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.025, typicalRange: 0.03, basePrice: 650 },
    active: true,
    popular: false,
    priority: 10,
  },
  {
    pair: "XRP/USDT",
    name: "Ripple",
    label: "XRP",
    icon: "✕",
    category: "crypto",
    base: "XRP",
    quote: "USDT",
    symbols: {
      binance: "XRPUSDT",
      twelveData: "XRP/USDT",
      tradingView: "BINANCE:XRPUSDT",
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.025, typicalRange: 0.03, basePrice: 2.4 },
    active: true,
    popular: false,
    priority: 11,
  },
  {
    pair: "ADA/USDT",
    name: "Cardano",
    label: "ADA",
    icon: "₳",
    category: "crypto",
    base: "ADA",
    quote: "USDT",
    symbols: {
      binance: "ADAUSDT",
      twelveData: "ADA/USDT",
      tradingView: "BINANCE:ADAUSDT",
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.028, typicalRange: 0.035, basePrice: 0.75 },
    active: true,
    popular: false,
    priority: 12,
  },
  {
    pair: "DOGE/USDT",
    name: "Dogecoin",
    label: "DOGE",
    icon: "Ð",
    category: "crypto",
    base: "DOGE",
    quote: "USDT",
    symbols: {
      binance: "DOGEUSDT",
      twelveData: "DOGE/USDT",
      tradingView: "BINANCE:DOGEUSDT",
    },
    config: { pipSize: 0.00001, decimals: 5, volatility: 0.04, typicalRange: 0.05, basePrice: 0.22 },
    active: true,
    popular: false,
    priority: 13,
  },
  {
    pair: "AVAX/USDT",
    name: "Avalanche",
    label: "AVAX",
    icon: "▲",
    category: "crypto",
    base: "AVAX",
    quote: "USDT",
    symbols: {
      binance: "AVAXUSDT",
      twelveData: "AVAX/USDT",
      tradingView: "BINANCE:AVAXUSDT",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.035, typicalRange: 0.045, basePrice: 35 },
    active: true,
    popular: false,
    priority: 14,
  },
  {
    pair: "DOT/USDT",
    name: "Polkadot",
    label: "DOT",
    icon: "●",
    category: "crypto",
    base: "DOT",
    quote: "USDT",
    symbols: {
      binance: "DOTUSDT",
      twelveData: "DOT/USDT",
      tradingView: "BINANCE:DOTUSDT",
    },
    config: { pipSize: 0.001, decimals: 3, volatility: 0.03, typicalRange: 0.04, basePrice: 4.5 },
    active: true,
    popular: false,
    priority: 15,
  },

  // ── Commodities ──────────────────────────────────────────────────────
  {
    pair: "XAU/USD",
    name: "Gold",
    label: "Gold",
    icon: "Au",
    category: "commodity",
    base: "XAU",
    quote: "USD",
    symbols: {
      twelveData: "XAU/USD",
      finnhub: "OANDA:XAU_USD",
      tradingView: "OANDA:XAUUSD",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.012, typicalRange: 0.015, basePrice: 3300 },
    active: true,
    popular: true,
    priority: 4,
  },

  // ── Forex Majors ─────────────────────────────────────────────────────
  {
    pair: "EUR/USD",
    name: "Euro / US Dollar",
    label: "EUR",
    icon: "€",
    category: "forex",
    base: "EUR",
    quote: "USD",
    symbols: {
      twelveData: "EUR/USD",
      finnhub: "EURUSD",
      tradingView: "FX:EURUSD",
      exchangeRate: { base: "EUR", quote: "USD" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.005, typicalRange: 0.008, basePrice: 1.13 },
    active: true,
    popular: true,
    priority: 5,
  },
  {
    pair: "GBP/USD",
    name: "British Pound / US Dollar",
    label: "GBP",
    icon: "£",
    category: "forex",
    base: "GBP",
    quote: "USD",
    symbols: {
      twelveData: "GBP/USD",
      finnhub: "GBPUSD",
      tradingView: "FX:GBPUSD",
      exchangeRate: { base: "GBP", quote: "USD" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.006, typicalRange: 0.009, basePrice: 1.34 },
    active: true,
    popular: false,
    priority: 20,
  },
  {
    pair: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    label: "JPY",
    icon: "¥",
    category: "forex",
    base: "USD",
    quote: "JPY",
    symbols: {
      twelveData: "USD/JPY",
      finnhub: "USDJPY",
      tradingView: "FX:USDJPY",
      exchangeRate: { base: "USD", quote: "JPY" },
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.007, typicalRange: 0.01, basePrice: 145 },
    active: true,
    popular: false,
    priority: 21,
  },
  {
    pair: "GBP/JPY",
    name: "British Pound / Japanese Yen",
    label: "GBP/JPY",
    icon: "£",
    category: "forex",
    base: "GBP",
    quote: "JPY",
    symbols: {
      twelveData: "GBP/JPY",
      finnhub: "GBPJPY",
      tradingView: "FX:GBPJPY",
      exchangeRate: { base: "GBP", quote: "JPY" },
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.008, typicalRange: 0.012, basePrice: 195 },
    active: true,
    popular: true,
    priority: 6,
  },
  {
    pair: "AUD/USD",
    name: "Australian Dollar / US Dollar",
    label: "AUD",
    icon: "A$",
    category: "forex",
    base: "AUD",
    quote: "USD",
    symbols: {
      twelveData: "AUD/USD",
      finnhub: "AUDUSD",
      tradingView: "FX:AUDUSD",
      exchangeRate: { base: "AUD", quote: "USD" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.006, typicalRange: 0.009, basePrice: 0.65 },
    active: true,
    popular: false,
    priority: 22,
  },
  {
    pair: "NZD/USD",
    name: "New Zealand Dollar / US Dollar",
    label: "NZD",
    icon: "NZ$",
    category: "forex",
    base: "NZD",
    quote: "USD",
    symbols: {
      twelveData: "NZD/USD",
      finnhub: "NZDUSD",
      tradingView: "FX:NZDUSD",
      exchangeRate: { base: "NZD", quote: "USD" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.006, typicalRange: 0.009, basePrice: 0.60 },
    active: true,
    popular: false,
    priority: 23,
  },
  {
    pair: "USD/CAD",
    name: "US Dollar / Canadian Dollar",
    label: "CAD",
    icon: "C$",
    category: "forex",
    base: "USD",
    quote: "CAD",
    symbols: {
      twelveData: "USD/CAD",
      finnhub: "USDCAD",
      tradingView: "FX:USDCAD",
      exchangeRate: { base: "USD", quote: "CAD" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.005, typicalRange: 0.007, basePrice: 1.37 },
    active: true,
    popular: false,
    priority: 24,
  },
  {
    pair: "USD/CHF",
    name: "US Dollar / Swiss Franc",
    label: "CHF",
    icon: "Fr",
    category: "forex",
    base: "USD",
    quote: "CHF",
    symbols: {
      twelveData: "USD/CHF",
      finnhub: "USDCHF",
      tradingView: "FX:USDCHF",
      exchangeRate: { base: "USD", quote: "CHF" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.005, typicalRange: 0.007, basePrice: 0.82 },
    active: true,
    popular: false,
    priority: 25,
  },
  {
    pair: "EUR/GBP",
    name: "Euro / British Pound",
    label: "EUR/GBP",
    icon: "€/£",
    category: "forex",
    base: "EUR",
    quote: "GBP",
    symbols: {
      twelveData: "EUR/GBP",
      finnhub: "EURGBP",
      tradingView: "FX:EURGBP",
      exchangeRate: { base: "EUR", quote: "GBP" },
    },
    config: { pipSize: 0.0001, decimals: 4, volatility: 0.004, typicalRange: 0.006, basePrice: 0.84 },
    active: true,
    popular: false,
    priority: 26,
  },
  {
    pair: "EUR/JPY",
    name: "Euro / Japanese Yen",
    label: "EUR/JPY",
    icon: "€/¥",
    category: "forex",
    base: "EUR",
    quote: "JPY",
    symbols: {
      twelveData: "EUR/JPY",
      finnhub: "EURJPY",
      tradingView: "FX:EURJPY",
      exchangeRate: { base: "EUR", quote: "JPY" },
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.007, typicalRange: 0.01, basePrice: 164 },
    active: true,
    popular: false,
    priority: 27,
  },

  // ── Indices ──────────────────────────────────────────────────────────
  {
    pair: "NASDAQ",
    name: "NASDAQ Composite",
    label: "NASDAQ",
    icon: "📊",
    category: "index",
    base: "NASDAQ",
    quote: "USD",
    symbols: {
      twelveData: "NDX",
      tradingView: "NASDAQ:NDX",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.012, typicalRange: 0.018, basePrice: 18500 },
    active: true,
    popular: false,
    priority: 30,
  },

  // ── Stocks ───────────────────────────────────────────────────────────
  {
    pair: "AAPL",
    name: "Apple Inc.",
    label: "AAPL",
    icon: "🍎",
    category: "stock",
    base: "AAPL",
    quote: "USD",
    symbols: {
      twelveData: "AAPL",
      tradingView: "NASDAQ:AAPL",
    },
    config: { pipSize: 0.01, decimals: 2, volatility: 0.015, typicalRange: 0.02, basePrice: 195 },
    active: true,
    popular: false,
    priority: 40,
  },
];

// ── Asset Registry Class ────────────────────────────────────────────────────

class AssetRegistryClass {
  private readonly assetsByPair: Map<string, AssetDefinition>;
  private readonly assetsByCategory: Map<AssetCategory, AssetDefinition[]>;

  constructor() {
    this.assetsByPair = new Map(ASSETS.map((a) => [a.pair, a]));
    this.assetsByCategory = new Map();

    // Build category index
    for (const asset of ASSETS) {
      const list = this.assetsByCategory.get(asset.category) || [];
      list.push(asset);
      this.assetsByCategory.set(asset.category, list);
    }
  }

  // ── Lookup Methods ────────────────────────────────────────────────────

  /** Get a single asset by pair name. Throws if not found. */
  get(pair: string): AssetDefinition {
    const asset = this.assetsByPair.get(pair);
    if (!asset) throw new Error(`[AssetRegistry] Unknown pair: "${pair}"`);
    return asset;
  }

  /** Get a single asset by pair name. Returns undefined if not found. */
  find(pair: string): AssetDefinition | undefined {
    return this.assetsByPair.get(pair);
  }

  /** Check if a pair exists in the registry */
  has(pair: string): boolean {
    return this.assetsByPair.has(pair);
  }

  // ── Filter Methods ────────────────────────────────────────────────────

  /** Get all assets, sorted by priority */
  all(): AssetDefinition[] {
    return [...ASSETS].sort((a, b) => a.priority - b.priority);
  }

  /** Get all popular pairs (for quick-select lists) */
  popular(): AssetDefinition[] {
    return ASSETS.filter((a) => a.popular && a.active).sort((a, b) => a.priority - b.priority);
  }

  /** Get all active assets */
  active(): AssetDefinition[] {
    return ASSETS.filter((a) => a.active).sort((a, b) => a.priority - b.priority);
  }

  /** Get assets by category */
  byCategory(category: AssetCategory): AssetDefinition[] {
    return (this.assetsByCategory.get(category) || []).filter((a) => a.active);
  }

  // ── Convenience Methods ───────────────────────────────────────────────

  /** Get list of all pair strings */
  pairs(): string[] {
    return ASSETS.filter((a) => a.active).map((a) => a.pair);
  }

  /** Get list of popular pair strings */
  popularPairs(): string[] {
    return ASSETS.filter((a) => a.popular && a.active).map((a) => a.pair);
  }

  /** Get signal generation pairs (used by daily signal cron) */
  signalPairs(): string[] {
    return ASSETS.filter((a) => a.popular && a.active).map((a) => a.pair);
  }

  // ── Symbol Mapping Methods ────────────────────────────────────────────

  /** Get Binance symbol for a pair (e.g., "BTCUSDT") */
  binanceSymbol(pair: string): string | undefined {
    return this.find(pair)?.symbols.binance;
  }

  /** Get TwelveData symbol for a pair */
  twelveDataSymbol(pair: string): string | undefined {
    return this.find(pair)?.symbols.twelveData;
  }

  /** Get TradingView symbol for a pair (e.g., "BINANCE:BTCUSDT") */
  tradingViewSymbol(pair: string): string | undefined {
    return this.find(pair)?.symbols.tradingView;
  }

  /** Get Finnhub symbol for a pair */
  finnhubSymbol(pair: string): string | undefined {
    return this.find(pair)?.symbols.finnhub;
  }

  // ── Category Detection ────────────────────────────────────────────────

  /** Check if a pair is a crypto pair */
  isCrypto(pair: string): boolean {
    return this.find(pair)?.category === "crypto";
  }

  /** Check if a pair is a forex pair */
  isForex(pair: string): boolean {
    return this.find(pair)?.category === "forex";
  }

  /** Check if a pair is a commodity */
  isCommodity(pair: string): boolean {
    return this.find(pair)?.category === "commodity";
  }

  // ── Config Methods ────────────────────────────────────────────────────

  /** Get pair config (decimals, pip size, etc.) */
  config(pair: string): AssetConfig | undefined {
    return this.find(pair)?.config;
  }

  /** Get the PairConfig format expected by the analysis engine */
  pairConfig(pair: string): { basePrice: number; volatility: number; pipSize: number; decimals: number; typicalRange: number } | undefined {
    const asset = this.find(pair);
    if (!asset) return undefined;
    return {
      basePrice: asset.config.basePrice,
      volatility: asset.config.volatility,
      pipSize: asset.config.pipSize,
      decimals: asset.config.decimals,
      typicalRange: asset.config.typicalRange,
    };
  }

  // ── UI Helpers ────────────────────────────────────────────────────────

  /** Get pair options for dropdown selectors */
  pairOptions(): Array<{ value: string; label: string; icon: string; category: AssetCategory }> {
    return this.active().map((a) => ({
      value: a.pair,
      label: `${a.icon} ${a.pair}`,
      icon: a.icon,
      category: a.category,
    }));
  }

  /** Format a price with the correct number of decimals */
  formatPrice(pair: string, price: number): string {
    const asset = this.find(pair);
    const decimals = asset?.config.decimals ?? 2;
    return price.toFixed(decimals);
  }

  // ── Cache Helper ──────────────────────────────────────────────────────

  /** Get all pairs that have cached prices (for cache invalidation) */
  cacheablePairs(): string[] {
    return ASSETS.filter((a) => a.active).map((a) => a.pair);
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────

export const AssetRegistry = new AssetRegistryClass();

// ── Re-export for convenience ───────────────────────────────────────────────

/** Popular pairs in the format expected by price-fetcher.ts */
export const POPULAR_PAIRS = AssetRegistry.popular().map((a) => ({
  pair: a.pair,
  icon: a.icon,
}));

/** All known pairs for cache invalidation */
export const ALL_KNOWN_PAIRS = AssetRegistry.cacheablePairs();

/** Pair configs in the format expected by the analysis engine */
export const PAIR_CONFIGS: Record<string, AssetConfig> = Object.fromEntries(
  ASSETS.filter((a) => a.active).map((a) => [a.pair, a.config]),
);
