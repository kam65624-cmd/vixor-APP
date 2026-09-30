// ============================================================================
// Hunt — Birdeye API Client
// ============================================================================
//
// Birdeye: Requires API key (BIRDEYE_API_KEY). Free tier: 1000 req/day.
// Supports Solana, Ethereum, BSC, Base, Arbitrum.
//
// Docs: https://docs.birdeye.so/reference
//
// Endpoints covered:
//   - Token overview, price, OHLCV, trending
//   - Wallet transactions, top traders, wallet identity
//   - Smart Money token list, money flow, token fees
//
// Graceful degradation: If no API key, returns empty results.
// Rate limiting: integrated via shared rate-limiter.ts (Phase 4.2).
// ============================================================================
import { birdeyeLimiter } from "@/shared/utils/rate-limiter";

const BIRDEYE_BASE = "https://public-api.birdeye.so";

// Birdeye chain IDs
export const BIRDEYE_CHAINS: Record<string, string> = {
  solana: "solana",
  sol: "solana",
  ethereum: "ethereum",
  eth: "ethereum",
  bsc: "bsc",
  bnb: "bsc",
  base: "base",
  arbitrum: "arbitrum",
  arb: "arbitrum",
};

function getBirdeyeHeaders(): Record<string, string> {
  const apiKey = process.env.BIRDEYE_API_KEY || "";
  return {
    Accept: "application/json",
    "X-API-KEY": apiKey,
  };
}

function hasBirdeyeKey(): boolean {
  return !!process.env.BIRDEYE_API_KEY;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BirdeyeTokenOverview {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  priceChange24hPercent: number;
  priceChange1hPercent: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holder: number;
  logoURI: string;
  extensions: {
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  mc: number;
}

export interface BirdeyeTrendingToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24hPercent: number;
  volume24h: number;
  liquidity: number;
  logoURI: string;
  rank: number;
}

export interface BirdeyeOHLCV {
  unixTime: number;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface BirdeyeWalletTx {
  txHash: string;
  blockUnixTime: number;
  source: string;
  txType: string;
  from: { address: string; amount: number; uiAmount: number; symbol: string; decimals: number };
  to: { address: string; amount: number; uiAmount: number; symbol: string; decimals: number };
  tokenAddress: string;
  owner: string;
  side: "buy" | "sell";
  priceUsd: number;
  volumeUsd: number;
}

// ── Token Overview ──────────────────────────────────────────────────────────

export async function fetchBirdeyeTokenOverview(
  tokenAddress: string,
  chain: string = "solana",
): Promise<BirdeyeTokenOverview | null> {
  if (!hasBirdeyeKey()) return null;

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return null;

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";

  try {
    const res = await fetch(`${BIRDEYE_BASE}/defi/token_overview?address=${tokenAddress}`, {
      signal: AbortSignal.timeout(10_000),
      headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data as BirdeyeTokenOverview;
  } catch {
    return null;
  }
}

// ── Trending Tokens ─────────────────────────────────────────────────────────

export async function fetchBirdeyeTrending(
  chain: string = "solana",
  limit: number = 20,
): Promise<BirdeyeTrendingToken[]> {
  if (!hasBirdeyeKey()) return [];

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return [];

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/trending_tokens?chain=${birdeyeChain}&sort_by=volume24hUSD&sort_type=desc&offset=0&limit=${limit}`,
      {
        signal: AbortSignal.timeout(10_000),
        headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
      },
    );

    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.tokens || []) as BirdeyeTrendingToken[];
  } catch {
    return [];
  }
}

// ── Token Price ──────────────────────────────────────────────────────────────

export async function fetchBirdeyePrice(
  tokenAddress: string,
  chain: string = "solana",
): Promise<{ price: number; liquidity: number } | null> {
  if (!hasBirdeyeKey()) return null;

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return null;

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/price?address=${tokenAddress}&check_liquidity=true`,
      {
        signal: AbortSignal.timeout(8_000),
        headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
      },
    );

    if (!res.ok) return null;
    const json = await res.json();
    return {
      price: json.data?.value || 0,
      liquidity: json.data?.liquidity || 0,
    };
  } catch {
    return null;
  }
}

// ── OHLCV Data ──────────────────────────────────────────────────────────────

/**
 * Fetch OHLCV candle data from Birdeye.
 * type: 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 8H, 12H, 1D, 3D, 1W, 1M
 */
export async function fetchBirdeyeOHLCV(
  tokenAddress: string,
  chain: string = "solana",
  timeType: string = "1H",
  limit: number = 100,
): Promise<BirdeyeOHLCV[]> {
  if (!hasBirdeyeKey()) return [];

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return [];

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - limit * getSecondsPerCandle(timeType);

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/ohlcv?address=${tokenAddress}&type=${timeType}&time_from=${startTime}&time_to=${endTime}`,
      {
        signal: AbortSignal.timeout(10_000),
        headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
      },
    );

    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.items || []) as BirdeyeOHLCV[];
  } catch {
    return [];
  }
}

function getSecondsPerCandle(timeType: string): number {
  const map: Record<string, number> = {
    "1m": 60,
    "3m": 180,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1H": 3600,
    "2H": 7200,
    "4H": 14400,
    "6H": 21600,
    "8H": 28800,
    "12H": 43200,
    "1D": 86400,
    "3D": 259200,
    "1W": 604800,
    "1M": 2592000,
  };
  return map[timeType] || 3600;
}

// ── Wallet Transactions ──────────────────────────────────────────────────────

export async function fetchBirdeyeWalletTxns(
  walletAddress: string,
  chain: string = "solana",
  limit: number = 20,
): Promise<BirdeyeWalletTx[]> {
  if (!hasBirdeyeKey()) return [];

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return [];

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/v1/wallet/tx_list?wallet=${walletAddress}&limit=${limit}`,
      {
        signal: AbortSignal.timeout(10_000),
        headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
      },
    );

    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.solana || json.data?.items || []) as BirdeyeWalletTx[];
  } catch {
    return [];
  }
}

// ── Smart Money Token List ───────────────────────────────────────────────────

export interface BirdeyeSmartMoneyToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24hPercent: number;
  volume24h: number;
  liquidity: number;
  logoURI: string;
  smartTradersNo: number;
  smartMoneyInflow: number;
  smartMoneyOutflow: number;
  smartMoneyNetFlow: number;
  traderStyle: string;
}

/**
 * Fetch tokens ranked by smart money activity (Solana only).
 * trader_style: all | sniper | degen | whale | institutional
 * sort_by: smart_traders_no | smart_money_inflow | smart_money_outflow | smart_money_net_flow
 */
export async function fetchBirdeyeSmartMoneyTokens(
  chain: string = "solana",
  options: {
    interval?: "1h" | "4h" | "1d" | "7d";
    traderStyle?: "all" | "sniper" | "degen" | "whale" | "institutional";
    sortBy?:
      "smart_traders_no" | "smart_money_inflow" | "smart_money_outflow" | "smart_money_net_flow";
    sortType?: "desc" | "asc";
    limit?: number;
  } = {},
): Promise<BirdeyeSmartMoneyToken[]> {
  if (!hasBirdeyeKey()) return [];

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return [];

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";
  const {
    interval = "1d",
    traderStyle = "all",
    sortBy = "smart_traders_no",
    sortType = "desc",
    limit = 20,
  } = options;

  try {
    const url = `${BIRDEYE_BASE}/smart-money/v1/token/list?interval=${interval}&trader_style=${traderStyle}&sort_by=${sortBy}&sort_type=${sortType}&limit=${limit}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
    });

    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.tokens || json.data || []) as BirdeyeSmartMoneyToken[];
  } catch {
    return [];
  }
}

// ── Token Money Flow ───────────────────────────────────────────────────────

export interface BirdeyeMoneyFlow {
  tokenAddress: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  smartMoneyInflow: number;
  smartMoneyOutflow: number;
  smartMoneyNetFlow: number;
  smartTradersNo: number;
  frames: Record<string, { inflow: number; outflow: number; netFlow: number }>;
}

/**
 * Fetch money flow data for a specific token (Solana only).
 */
export async function fetchBirdeyeTokenMoneyFlow(
  tokenAddress: string,
  options: {
    wallets?: string[];
    walletTags?: ("kol" | "whale" | "program")[];
    frames?: ("1m" | "5m" | "30m" | "1h" | "2h" | "4h" | "8h" | "24h")[];
  } = {},
): Promise<BirdeyeMoneyFlow | null> {
  if (!hasBirdeyeKey()) return null;

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return null;

  const { wallets = [], walletTags = [], frames = ["1h", "4h", "24h"] } = options;

  try {
    const res = await fetch(`${BIRDEYE_BASE}/defi/v3/token/money-flow`, {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        ...getBirdeyeHeaders(),
        "Content-Type": "application/json",
        "x-chain": "solana",
      },
      body: JSON.stringify({
        token_address: tokenAddress,
        wallets: wallets.length > 0 ? wallets : undefined,
        wallet_tags: walletTags.length > 0 ? walletTags : undefined,
        frames,
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data as BirdeyeMoneyFlow;
  } catch {
    return null;
  }
}

// ── Wallet Identity ─────────────────────────────────────────────────────────

export interface BirdeyeWalletIdentity {
  address: string;
  type: "wallet" | "exchange" | "protocol" | "token" | "program" | "unknown";
  entity?: string;
  label: string;
  category: string;
  tags: string[];
  domains: string[];
  domainsTotal: number;
}

/**
 * Resolve a wallet address or .sol domain to its identity.
 */
export async function fetchBirdeyeWalletIdentity(
  address: string,
): Promise<BirdeyeWalletIdentity | null> {
  if (!hasBirdeyeKey()) return null;

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return null;

  try {
    const url = `${BIRDEYE_BASE}/identity/v1/single?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      headers: getBirdeyeHeaders(),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data || {};
    return {
      address: d.address || address,
      type: d.type || "unknown",
      entity: d.entity,
      label: d.label || address.slice(0, 8),
      category: d.category || "",
      tags: d.tags || [],
      domains: d.domains || [],
      domainsTotal: d.domains_total || 0,
    };
  } catch {
    return null;
  }
}

// ── Token Fees ─────────────────────────────────────────────────────────────

export interface BirdeyeTokenFee {
  interval: string;
  fees: number;
  revenue: number;
  uniqueTokens: number;
  uniqueWallets: number;
}

/**
 * Fetch fee data for a token across multiple timeframes (Solana only).
 * intervals: alltime, 24h, 8h, 4h, 2h, 1h, 30m, 15m, 5m, 1m (max 3 per request)
 */
export async function fetchBirdeyeTokenFees(
  tokenAddress: string,
  intervals: Array<"alltime" | "24h" | "8h" | "4h" | "2h" | "1h" | "30m" | "15m" | "5m" | "1m"> = [
    "24h",
    "4h",
    "1h",
  ],
): Promise<BirdeyeTokenFee[]> {
  if (!hasBirdeyeKey()) return [];

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return [];

  const intervalStr = intervals.slice(0, 3).join(",");

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/v3/token/fee/single?address=${tokenAddress}&interval=${intervalStr}`,
      {
        signal: AbortSignal.timeout(10_000),
        headers: { ...getBirdeyeHeaders(), "x-chain": "solana" },
      },
    );

    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []) as BirdeyeTokenFee[];
  } catch {
    return [];
  }
}

// ── Top Traders ──────────────────────────────────────────────────────────────

export async function fetchBirdeyeTopTraders(
  tokenAddress: string,
  chain: string = "solana",
): Promise<Array<{ address: string; pnl: number; volume: number; tradeCount: number }>> {
  if (!hasBirdeyeKey()) return [];

  const limiter = birdeyeLimiter(process.env.BIRDEYE_API_KEY || "");
  if (!limiter.tryRecord()) return [];

  const birdeyeChain = BIRDEYE_CHAINS[chain.toLowerCase()] || "solana";

  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/token_top_traders?address=${tokenAddress}&sort_by=PnL&sort_type=desc&offset=0&limit=10`,
      {
        signal: AbortSignal.timeout(10_000),
        headers: { ...getBirdeyeHeaders(), "x-chain": birdeyeChain },
      },
    );

    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data?.items || [];
    return items.map((item: Record<string, unknown>) => ({
      address: item.address as string,
      pnl: (item.pnl as number) || 0,
      volume: (item.volume as number) || 0,
      tradeCount: (item.tradeCount as number) || 0,
    }));
  } catch {
    return [];
  }
}
