// ============================================================================
// VIXOR DexScreener Client — Free DEX Data (60 req/min)
// ============================================================================
// Uses DexScreener's free public API for Solana/memecoin data.
// No API key required.
// ============================================================================

const BASE_URL = 'https://api.dexscreener.com';

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

/** Search DEX pairs by token name or address */
export async function searchPairs(query: string): Promise<DexScreenerPair[]> {
  const resp = await fetch(`${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`);
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.pairs ?? [];
}

/** Get a specific pair by chain + address */
export async function getPair(chainId: string, pairAddress: string): Promise<DexScreenerPair | null> {
  const resp = await fetch(`${BASE_URL}/latest/dex/pairs/${chainId}/${pairAddress}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.pair ?? null;
}

/** Get token pairs for a specific token */
export async function getTokenPairs(chainId: string, tokenAddress: string): Promise<DexScreenerPair[]> {
  const resp = await fetch(`${BASE_URL}/token-pairs/v1/${chainId}/${tokenAddress}`);
  if (!resp.ok) return [];
  return await resp.json();
}

/** Get trending metas (memecoin categories) */
export async function getTrendingMetas(): Promise<unknown[]> {
  const resp = await fetch(`${BASE_URL}/metas/trending/v1`);
  if (!resp.ok) return [];
  return await resp.json();
}

/** Get latest token profiles */
export async function getLatestTokenProfiles(): Promise<DexScreenerToken[]> {
  const resp = await fetch(`${BASE_URL}/token-profiles/latest/v1`);
  if (!resp.ok) return [];
  return await resp.json();
}
