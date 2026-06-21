/**
 * @module domains/discovery/clients/dexscreener
 * @description DexScreener API client for new pairs and token data.
 * Primary source for Stage 1 (new pairs) of the discovery pipeline.
 * Provides token pair data across multiple DEXs and chains.
 * Rate limit: 300 req/min (undocumented, use conservatively).
 */

import type { RawTokenData, ApiResponse } from "../types";
import { CACHE_TTL_MS } from "../constants";

/** In-memory cache for DexScreener responses. */
const cache = new Map<string, { data: unknown; ts: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS.price) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/**
 * Maps DexScreener chain IDs to Discovery chain types.
 */
function mapChain(chainId: string): RawTokenData["chain"] | null {
  const mapping: Record<string, RawTokenData["chain"]> = {
    solana: "solana",
    ethereum: "ethereum",
    base: "base",
    arbitrum: "arbitrum",
    polygon: "polygon",
    avalanche: "polygon", // mapped to polygon for simplicity
    bsc: "ethereum", // mapped to ethereum ecosystem
  };
  return mapping[chainId] ?? null;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetches the latest token pairs from DexScreener (new pairs).
 * This is the primary source for Stage 1 of the discovery pipeline.
 *
 * @param apiUrl - DexScreener API base URL.
 * @param chains - Optional chain filter.
 * @param limit - Maximum pairs to return (default 50).
 * @returns API response with raw token data.
 */
export async function fetchLatestPairs(
  apiUrl: string = "https://api.dexscreener.com/latest",
  chains?: string[],
  limit: number = 50,
): Promise<ApiResponse<RawTokenData[]>> {
  const start = Date.now();
  const cacheKey = `dexscreener:latest:${chains?.join(",") ?? "all"}:${limit}`;

  const cached = getCached<RawTokenData[]>(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
      cached: true,
      cacheTtl: CACHE_TTL_MS.price,
      responseTimeMs: Date.now() - start,
    };
  }

  try {
    const url = `${apiUrl}/dex/tokens/new-pairs`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `DexScreener API error: ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const json = (await response.json()) as {
      pairs?: Array<{
        chainId: string;
        dexId: string;
        url: string;
        pairAddress: string;
        baseToken: {
          address: string;
          symbol: string;
          name: string;
        };
        quoteToken: {
          address: string;
          symbol: string;
        };
        priceNative: string;
        priceUsd: string;
        txns: {
          m5: { buys: number; sells: number };
          h1: { buys: number; sells: number };
          h6: { buys: number; sells: number };
          h24: { buys: number; sells: number };
        };
        volume: {
          m5: number;
          h1: number;
          h6: number;
          h24: number;
        };
        liquidity: {
          usd: number;
          base: number;
          quote: number;
        };
        fdv: number;
        pairCreatedAt: number;
        info?: { imageUrl?: string };
      }>;
    };

    const pairs = json.pairs ?? [];
    const results: RawTokenData[] = [];

    for (const pair of pairs) {
      const chain = mapChain(pair.chainId);

      // Skip unknown chains or if chain filter doesn't match
      if (!chain) continue;
      if (chains && chains.length > 0 && !chains.includes(chain)) continue;

      results.push({
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        price: parseFloat(pair.priceUsd) || 0,
        change24h: 0, // DexScreener new pairs don't have 24h change
        volume24h: pair.volume?.h24 ?? 0,
        liquidity: pair.liquidity?.usd ?? 0,
        marketCap: pair.fdv ?? 0,
        chain,
        createdAt: pair.pairCreatedAt || 0,
        pairIdentifier: pair.pairAddress,
        logoUrl: pair.info?.imageUrl,
      });

      if (results.length >= limit) break;
    }

    setCache(cacheKey, results);

    return {
      success: results.length > 0,
      data: results,
      cached: false,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `DexScreener request failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

/**
 * Searches for a specific token by symbol across DexScreener.
 *
 * @param apiUrl - DexScreener API base URL.
 * @param query - Search query (token symbol or name).
 * @returns API response with matching token data.
 */
export async function searchTokenPairs(
  apiUrl: string = "https://api.dexscreener.com/latest",
  query: string,
): Promise<ApiResponse<RawTokenData[]>> {
  const start = Date.now();

  try {
    const url = `${apiUrl}/dex/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `DexScreener search error: ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const json = (await response.json()) as {
      pairs?: Array<{
        chainId: string;
        baseToken: { address: string; symbol: string; name: string };
        priceUsd: string;
        volume: { h24: number };
        liquidity: { usd: number };
        fdv: number;
        pairCreatedAt: number;
        info?: { imageUrl?: string };
      }>;
    };

    const results: RawTokenData[] = (json.pairs ?? [])
      .filter((p) => mapChain(p.chainId) !== null)
      .slice(0, 20)
      .map((p) => ({
        address: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        price: parseFloat(p.priceUsd) || 0,
        change24h: 0,
        volume24h: p.volume?.h24 ?? 0,
        liquidity: p.liquidity?.usd ?? 0,
        marketCap: p.fdv ?? 0,
        chain: mapChain(p.chainId)!,
        createdAt: p.pairCreatedAt || 0,
        logoUrl: p.info?.imageUrl,
      }));

    return {
      success: results.length > 0,
      data: results,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `DexScreener search failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

/** Export cache for testing. */
export { cache as dexscreenerCache };
