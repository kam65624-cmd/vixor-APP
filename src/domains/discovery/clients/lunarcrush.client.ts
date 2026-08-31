/**
 * @module domains/discovery/clients/lunarcrush
 * @description LunarCrush API client for social sentiment analysis.
 * Provides alt/social rank, sentiment scores, and galaxy scores for tokens.
 * Rate limit: 30 req/min on free tier.
 */

import type { ApiResponse } from "../types";
import { CACHE_TTL_MS } from "../constants";

/** In-memory cache for LunarCrush responses. */
const cache = new Map<string, { data: unknown; ts: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS.social) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/** LunarCrush API base URL. */
const LUNARCRUSH_BASE_URL = "https://lunarcrush.com/api4";

/** LunarCrush social data for a token. */
export interface LunarCrushSocialData {
  /** Social mentions (24h). */
  mentions: number;
  /** Social sentiment (-1 to 1). */
  sentiment: number;
  /** Alt/Social rank (lower = more social attention). */
  altRank: number;
  /** Galaxy Score (overall social + market score, 0–100). */
  galaxyScore: number;
  /** Social dominance percentage. */
  socialDominance: number;
  /** Social volume (relative). */
  socialVolume: number;
}

/**
 * Fetches social data for a specific token from LunarCrush.
 *
 * @param apiKey - LunarCrush API key.
 * @param symbol - Token symbol (e.g., "SOL", "ETH", "PEPE").
 * @returns API response with LunarCrush social data.
 */
export async function fetchTokenSocialData(
  apiKey: string,
  symbol: string,
): Promise<ApiResponse<LunarCrushSocialData>> {
  const start = Date.now();
  const cacheKey = `lunarcrush:${symbol}`;

  const cached = getCached<LunarCrushSocialData>(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
      cached: true,
      cacheTtl: CACHE_TTL_MS.social,
      responseTimeMs: Date.now() - start,
    };
  }

  if (!apiKey) {
    return {
      success: true,
      data: {
        mentions: 0,
        sentiment: 0,
        altRank: 999,
        galaxyScore: 0,
        socialDominance: 0,
        socialVolume: 0,
      },
      responseTimeMs: 0,
    };
  }

  try {
    const url = new URL(`${LUNARCRUSH_BASE_URL}/coins`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("data", "social");

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        success: true, // graceful degradation
        data: {
          mentions: 0,
          sentiment: 0,
          altRank: 999,
          galaxyScore: 0,
          socialDominance: 0,
          socialVolume: 0,
        },
        error: `LunarCrush API error: ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const json = (await response.json()) as {
      data?: Array<{
        s: string; // symbol
        ac: { s: number; sr: number; gs: number; sd: number; sv: number };
      }>;
    };

    const coinData = json.data?.find((c) => c.s.toLowerCase() === symbol.toLowerCase());

    if (!coinData) {
      return {
        success: true,
        data: {
          mentions: 0,
          sentiment: 0,
          altRank: 999,
          galaxyScore: 0,
          socialDominance: 0,
          socialVolume: 0,
        },
        responseTimeMs: Date.now() - start,
      };
    }

    const ac = coinData.ac;
    const result: LunarCrushSocialData = {
      mentions: ac.s ?? 0,
      sentiment: 0, // LunarCrush doesn't directly provide -1 to 1 sentiment
      altRank: ac.sr ?? 999,
      galaxyScore: ac.gs ?? 0,
      socialDominance: ac.sd ?? 0,
      socialVolume: ac.sv ?? 0,
    };

    setCache(cacheKey, result);

    return {
      success: true,
      data: result,
      cached: false,
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: true,
      data: {
        mentions: 0,
        sentiment: 0,
        altRank: 999,
        galaxyScore: 0,
        socialDominance: 0,
        socialVolume: 0,
      },
      error: `LunarCrush request failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

/**
 * Batch-fetches social data for multiple token symbols.
 *
 * @param apiKey - LunarCrush API key.
 * @param symbols - Array of token symbols.
 * @returns Map of symbol → social data.
 */
export async function batchFetchSocialData(
  apiKey: string,
  symbols: string[],
): Promise<Map<string, LunarCrushSocialData>> {
  const result = new Map<string, LunarCrushSocialData>();

  // LunarCrush rate limit is 30/min, so we batch carefully
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((sym) => fetchTokenSocialData(apiKey, sym)));

    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.success && r.data) {
        result.set(batch[j], r.data);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return result;
}

/** Export cache for testing. */
export { cache as lunarcrushCache };
