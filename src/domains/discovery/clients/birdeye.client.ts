/**
 * @module domains/discovery/clients/birdeye
 * @description Birdeye API client for price, volume, and liquidity data.
 * Supports multi-chain token lookups and pair data retrieval.
 * Rate limit: 60 req/min on free tier.
 */

import type { RawTokenData, ApiResponse } from "../types";
import { CACHE_TTL_MS, API_RATE_LIMITS } from "../constants";

/** Birdeye API configuration. */
const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

/** In-memory cache for Birdeye responses. */
const cache = new Map<string, { data: unknown; ts: number }>();

/**
 * Gets a cached response if it hasn't expired.
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS.price) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Stores a value in the in-memory cache.
 */
function setCache(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
  // Prevent unbounded cache growth
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/**
 * Makes an authenticated request to the Birdeye API.
 */
async function birdeyeRequest<T>(
  endpoint: string,
  apiKey: string,
  params?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const start = Date.now();
  const cacheKey = `${endpoint}:${JSON.stringify(params ?? {})}`;

  // Check cache first
  const cached = getCached<T>(cacheKey);
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
    const url = new URL(`${BIRDEYE_BASE_URL}${endpoint}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-API-KEY": apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Birdeye API error: ${response.status} ${response.statusText}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const data = (await response.json()) as T;
    setCache(cacheKey, data);

    return {
      success: true,
      data,
      cached: false,
      cacheTtl: CACHE_TTL_MS.price,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Birdeye request failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetches top trending tokens from Birdeye across specified chains.
 *
 * @param apiKey - Birdeye API key.
 * @param chains - Chain short identifiers (e.g., "solana", "ethereum").
 * @param limit - Maximum tokens to return.
 * @returns API response with raw token data array.
 */
export async function fetchTrendingTokens(
  apiKey: string,
  chains: string[] = ["solana", "ethereum", "base"],
  limit: number = 50,
): Promise<ApiResponse<RawTokenData[]>> {
  if (!apiKey) {
    return { success: false, error: "Birdeye API key not configured" };
  }

  const results: RawTokenData[] = [];

  // Fetch top tokens per chain
  for (const chain of chains) {
    const resp = await birdeyeRequest<{
      success: boolean;
      data: Array<{
        address: string;
        symbol: string;
        name: string;
        price: number;
        priceChange24h: number;
        volume24h: number;
        liquidity: number;
        mc: number;
        logo: string;
      }>;
    }>(`/defi/tokenlist`, apiKey, {
      chain: chain === "ethereum" ? "eth" : chain,
      sort_by: "v24hUSD",
      sort_type: "desc",
      min_liq: "10000",
      rows: String(Math.min(limit, 20)),
    });

    if (resp.success && resp.data?.data) {
      for (const item of resp.data.data) {
        results.push({
          address: item.address,
          symbol: item.symbol,
          name: item.name,
          price: item.price ?? 0,
          change24h: item.priceChange24h ?? 0,
          volume24h: item.volume24h ?? 0,
          liquidity: item.liquidity ?? 0,
          marketCap: item.mc ?? 0,
          chain: chain as RawTokenData["chain"],
          createdAt: "",
          logoUrl: item.logo,
        });
      }
    }
  }

  return {
    success: results.length > 0,
    data: results.slice(0, limit),
    responseTimeMs: 0,
  };
}

/** Export cache for testing purposes. */
export { cache as birdeyeCache };
