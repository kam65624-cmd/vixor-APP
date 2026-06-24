// ============================================================================
// VIXOR DexScreener Client — Free DEX Data (60 req/min)
// ============================================================================
// Uses DexScreener's free public API for Solana/memecoin data.
// No API key required. Rate limited + LRU cached.
// ============================================================================

import { Limiters } from "@/shared/resilience/rate-limiter";
import { LRUCache } from "@/shared/resilience/lru-cache";

const BASE_URL = "https://api.dexscreener.com";
const CACHE_TTL_MS = 30_000; // 30 seconds
const CACHE_CAPACITY = 200;

// ── Types ───────────────────────────────────────────────────────────────────

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string | null; name: string | null; symbol: string | null };
  priceNative: string;
  priceUsd: string | null;
  txns: Record<string, { buys: number; sells: number }>;
  volume: Record<string, number>;
  priceChange: Record<string, number> | null;
  liquidity: { usd: number | null; base: number; quote: number } | null;
  fdv: number | null;
  marketCap: number | null;
  info?: {
    imageUrl?: string | null;
    websites?: { url: string }[] | null;
    socials?: { platform: string; handle: string }[] | null;
  };
}

export interface DexScreenerToken {
  chainId: string;
  tokenAddress: string;
  icon?: string;
  description?: string;
}

// ── Cache Singletons ────────────────────────────────────────────────────────

const searchCache = new LRUCache<string, DexScreenerPair[]>({
  capacity: CACHE_CAPACITY,
  defaultTtlMs: CACHE_TTL_MS,
  name: "dexscreener-search",
});

const pairCache = new LRUCache<string, DexScreenerPair | null>({
  capacity: CACHE_CAPACITY,
  defaultTtlMs: CACHE_TTL_MS,
  name: "dexscreener-pair",
});

// ── Internal fetch with rate limiting ───────────────────────────────────────

async function dexFetch<T>(path: string): Promise<T | null> {
  await Limiters.dexscreener.wait();
  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch (err) {
    console.warn(
      `[DexScreener] ${path} failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Search DEX pairs by token name or address. Rate limited + cached 30s. */
export async function searchPairs(query: string): Promise<DexScreenerPair[]> {
  const cached = searchCache.get(query);
  if (cached) return cached;

  const data = await dexFetch<{ pairs?: DexScreenerPair[] }>(
    `/latest/dex/search?q=${encodeURIComponent(query)}`,
  );
  const pairs = data?.pairs ?? [];
  searchCache.set(query, pairs);
  return pairs;
}

/** Get a specific pair by chain + address. Rate limited + cached 30s. */
export async function getPair(chainId: string, pairAddress: string): Promise<DexScreenerPair | null> {
  const key = `${chainId}:${pairAddress}`;
  const cached = pairCache.get(key);
  if (cached !== undefined) return cached;

  const data = await dexFetch<{ pair?: DexScreenerPair }>(
    `/latest/dex/pairs/${chainId}/${pairAddress}`,
  );
  const pair = data?.pair ?? null;
  pairCache.set(key, pair);
  return pair;
}

/** Get token pairs for a specific token. Rate limited + cached 30s. */
export async function getTokenPairs(chainId: string, tokenAddress: string): Promise<DexScreenerPair[]> {
  return dexFetch<DexScreenerPair[]>(
    `/token-pairs/v1/${chainId}/${tokenAddress}`,
  ) ?? [];
}

/** Get trending metas (memecoin categories). Rate limited. */
export async function getTrendingMetas(): Promise<unknown[]> {
  return dexFetch<unknown[]>("/metas/trending/v1") ?? [];
}

/** Get latest token profiles. Rate limited. */
export async function getLatestTokenProfiles(): Promise<DexScreenerToken[]> {
  return dexFetch<DexScreenerToken[]>("/token-profiles/latest/v1") ?? [];
}

/** Get boosted tokens (top traders signal). Rate limited. */
export async function getTopBoosts(chainId?: string): Promise<unknown[]> {
  const path = chainId
    ? `/token-boosts/top/v1/${chainId}`
    : "/token-boosts/latest/v1";
  return dexFetch<unknown[]>(path) ?? [];
}

/**
 * Get a single token's price from DexScreener (best pair by liquidity).
 * Useful as a fallback for memecoins not on Binance.
 */
export async function getTokenPrice(
  chainId: string,
  tokenAddress: string,
): Promise<{ priceUsd: number | null; change24h: number | null; volume24h: number | null } | null> {
  const pairs = await getTokenPairs(chainId, tokenAddress);
  if (pairs.length === 0) return null;

  // Sort by liquidity (highest first) and pick the best
  const sorted = pairs.filter((p) => p.liquidity?.usd && p.priceUsd)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));

  if (sorted.length === 0) return null;
  const best = sorted[0];

  return {
    priceUsd: best.priceUsd ? parseFloat(best.priceUsd) : null,
    change24h: best.priceChange?.["h24"] ?? null,
    volume24h: best.volume?.["h24"] ?? null,
  };
}
