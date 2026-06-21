/**
 * @module domains/discovery/clients/helius
 * @description Helius RPC client for Solana on-chain data and smart money tracking.
 * Provides smart money wallet holder counts and token holder analysis.
 * Rate limit: 120 req/min on dev tier.
 */

import type { ApiResponse } from "../types";
import { CACHE_TTL_MS } from "../constants";

/** In-memory cache for Helius responses. */
const cache = new Map<string, { data: unknown; ts: number }>();

/**
 * Gets a cached response if still valid.
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS.smartMoney) {
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
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/**
 * Resolves the Helius RPC URL from environment config.
 */
function resolveRpcUrl(rpcUrl: string, apiKey: string): string {
  if (rpcUrl) return rpcUrl;
  if (apiKey) return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  return "";
}

/**
 * Makes a JSON-RPC call to the Helius endpoint.
 */
async function heliusRpcCall<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<ApiResponse<T>> {
  const start = Date.now();
  const cacheKey = `${method}:${JSON.stringify(params)}`;

  const cached = getCached<T>(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
      cached: true,
      cacheTtl: CACHE_TTL_MS.smartMoney,
      responseTimeMs: Date.now() - start,
    };
  }

  if (!rpcUrl) {
    return { success: false, error: "Helius RPC URL not configured" };
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Helius RPC error: ${response.status}`,
        responseTimeMs: Date.now() - start,
      };
    }

    const json = (await response.json()) as { result?: T; error?: { message: string } };

    if (json.error) {
      return {
        success: false,
        error: `Helius RPC error: ${json.error.message}`,
        responseTimeMs: Date.now() - start,
      };
    }

    if (json.result !== undefined && json.result !== null) {
      setCache(cacheKey, json.result);
      return {
        success: true,
        data: json.result,
        cached: false,
        responseTimeMs: Date.now() - start,
      };
    }

    return {
      success: false,
      error: "Helius RPC returned null result",
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Helius request failed: ${message}`,
      responseTimeMs: Date.now() - start,
    };
  }
}

// ── Known Smart Money Wallets ────────────────────────────────────────────────

/**
 * Pre-configured list of known smart money wallet addresses on Solana.
 * In production, this should be stored in the database and updated periodically.
 */
const KNOWN_SMART_MONEY_WALLETS: string[] = [
  "CVz7fpVhvZd82sygW5VnB9p2vWtAZAvExNa9VDdP8sYg", // Example whale wallet
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", // Example trader wallet
];

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetches the number of known smart money wallets holding a specific token.
 *
 * Uses Helius getTokenAccounts to find holders, then cross-references
 * against the known smart money wallet list.
 *
 * @param rpcUrl - Helius RPC URL or empty if not configured.
 * @param apiKey - Helius API key (fallback for URL construction).
 * @param mintAddress - SPL token mint address to check.
 * @returns API response with smart money holder count.
 */
export async function fetchSmartMoneyHolders(
  rpcUrl: string,
  apiKey: string,
  mintAddress: string,
): Promise<ApiResponse<number>> {
  const url = resolveRpcUrl(rpcUrl, apiKey);
  if (!url) {
    // Return 0 when Helius is not configured (graceful degradation)
    return { success: true, data: 0, cached: false, responseTimeMs: 0 };
  }

  // Use getTokenLargestAccounts to get top holders
  const resp = await heliusRpcCall<{
    value: Array<{ address: string; amount: string; decimals: number }>;
  }>(url, "getTokenLargestAccounts", [mintAddress]);

  if (!resp.success || !resp.data?.value) {
    return {
      success: true,
      data: 0,
      error: resp.error,
      responseTimeMs: resp.responseTimeMs,
    };
  }

  // Count how many of the top holders are known smart money wallets
  const holderAddresses = new Set(resp.data.value.map((h) => h.address));

  const smartCount = KNOWN_SMART_MONEY_WALLETS.filter((w) => holderAddresses.has(w)).length;

  return {
    success: true,
    data: smartCount,
    cached: resp.cached,
    responseTimeMs: resp.responseTimeMs,
  };
}

/**
 * Batch-fetches smart money holder counts for multiple tokens.
 *
 * @param rpcUrl - Helius RPC URL.
 * @param apiKey - Helius API key.
 * @param mintAddresses - Array of token mint addresses.
 * @returns Map of mint address → smart money holder count.
 */
export async function batchFetchSmartMoneyHolders(
  rpcUrl: string,
  apiKey: string,
  mintAddresses: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  // Process in parallel with a concurrency limit of 5
  const batchSize = 5;
  for (let i = 0; i < mintAddresses.length; i += batchSize) {
    const batch = mintAddresses.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((addr) => fetchSmartMoneyHolders(rpcUrl, apiKey, addr)),
    );

    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.success && r.data !== undefined) {
        result.set(batch[j], r.data);
      }
    }
  }

  return result;
}

/** Export for testing. */
export { cache as heliusCache, KNOWN_SMART_MONEY_WALLETS };
