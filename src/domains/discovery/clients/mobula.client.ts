/**
 * @module domains/discovery/clients/mobula
 * @description Mobula API client for market data, quotes, and historical data.
 * Primary use: enriched token metadata, real-time multi-asset quotes.
 * Rate limit: 300 req/min on free tier.
 *
 * Base URL: https://api.mobula.io/api/1
 * Auth: Authorization: <API_KEY>
 */

import type { ApiResponse } from "../types";
import { CACHE_TTL_MS } from "../constants";
import { getMobulaApiKey } from "@/shared/vault";

const MOBULA_BASE_URL = "https://api.mobula.io/api/1";

/** In-memory cache for Mobula responses. */
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
 * Makes an authenticated request to the Mobula API.
 */
async function mobulaRequest<T>(
  endpoint: string,
  params?: Record<string, string>,
  ttlMs?: number,
): Promise<ApiResponse<T>> {
  const start = Date.now();
  const apiKey = getMobulaApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: "Mobula API key not configured",
      responseTimeMs: Date.now() - start,
    };
  }

  const cacheKey = `mobula:${endpoint}:${JSON.stringify(params ?? {})}`;
  const resolvedTtl = ttlMs ?? CACHE_TTL_MS.price;

  const cached = getCached<T>(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
      cached: true,
      cacheTtl: resolvedTtl,
      responseTimeMs: Date.now() - start,
    };
  }

  try {
    const url = new URL(`${MOBULA_BASE_URL}${endpoint}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Mobula API error: ${response.status} ${response.statusText}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const data = (await response.json()) as T;
    setCache(cacheKey, data);

    return {
      success: true,
      data,
      cached: false,
      cacheTtl: resolvedTtl,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Mobula request failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ── Response Types ───────────────────────────────────────────────────────────

/** Shape of a single market data entry from Mobula. */
export interface MobulaMarketData {
  name: string;
  symbol: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  liquidity: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  logo: string;
  rank: number;
}

/** Shape of a quote entry from Mobula. */
export interface MobulaQuote {
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  logo: string;
}

/** Shape of a historical data point from Mobula. */
export interface MobulaHistoricalPoint {
  timestamp: number;
  price: number;
  volume: number;
  market_cap: number;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetches market data for tokens on a specific blockchain.
 *
 * @param blockchain - Blockchain name (e.g., "solana").
 * @param limit - Maximum results to return (default 50).
 * @returns API response with market data array.
 */
export async function fetchMarketData(
  blockchain: string = "solana",
  limit: number = 50,
): Promise<ApiResponse<MobulaMarketData[]>> {
  const resp = await mobulaRequest<{ data: MobulaMarketData[] }>(
    "/market/data",
    {
      blockchain,
      limit: String(limit),
    },
  );

  if (!resp.success || !resp.data) return resp as ApiResponse<MobulaMarketData[]>;

  return {
    ...resp,
    data: resp.data.data ?? [],
  };
}

/**
 * Fetches real-time quotes for multiple assets.
 *
 * @param assets - Comma-separated asset symbols (e.g., "SOL,USDC,BONK,WIF").
 * @returns API response with quote data.
 */
export async function fetchQuotes(
  assets: string = "SOL,USDC,BONK,WIF",
): Promise<ApiResponse<MobulaQuote[]>> {
  const resp = await mobulaRequest<{ data: MobulaQuote[] }>(
    "/market/quotes",
    {
      assets,
    },
    15_000, // slightly longer TTL for quotes
  );

  if (!resp.success || !resp.data) return resp as ApiResponse<MobulaQuote[]>;

  return {
    ...resp,
    data: resp.data.data ?? [],
  };
}

/**
 * Fetches historical price/market data for an asset.
 *
 * @param asset - Asset symbol (e.g., "SOL").
 * @param start - Start timestamp (Unix seconds or ms).
 * @param end - End timestamp (Unix seconds or ms).
 * @param interval - Optional interval (e.g., "1h", "1d").
 * @returns API response with historical data points.
 */
export async function fetchHistoricalData(
  asset: string,
  start: number,
  end: number,
  interval?: string,
): Promise<ApiResponse<MobulaHistoricalPoint[]>> {
  const params: Record<string, string> = {
    asset,
    start: String(start),
    end: String(end),
  };
  if (interval) params.interval = interval;

  const resp = await mobulaRequest<{ data: MobulaHistoricalPoint[] }>(
    "/market/historical",
    params,
    CACHE_TTL_MS.social, // historical data can be cached longer
  );

  if (!resp.success || !resp.data)
    return resp as ApiResponse<MobulaHistoricalPoint[]>;

  return {
    ...resp,
    data: resp.data.data ?? [],
  };
}

/**
 * Fetches trending tokens on a specific blockchain.
 *
 * @param blockchain - Blockchain name (e.g., "solana").
 * @param limit - Maximum results to return (default 20).
 * @returns API response with trending market data.
 */
export async function fetchTrendingTokens(
  blockchain: string = "solana",
  limit: number = 20,
): Promise<ApiResponse<MobulaMarketData[]>> {
  const resp = await mobulaRequest<{ data: MobulaMarketData[] }>(
    "/market/trending",
    {
      blockchain,
      limit: String(limit),
    },
  );

  if (!resp.success || !resp.data) return resp as ApiResponse<MobulaMarketData[]>;

  return {
    ...resp,
    data: resp.data.data ?? [],
  };
}

/** Export cache for testing purposes. */
export { cache as mobulaCache };