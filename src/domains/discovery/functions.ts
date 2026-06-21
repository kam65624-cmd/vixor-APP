/**
 * @module domains/discovery/functions
 * @description Core Discovery domain functions — the orchestration layer.
 * Coordinates API clients, scoring pipeline, and result aggregation.
 *
 * SECURITY: This file must only be imported from server-side code (server/api/*).
 * Import from "@/domains/discovery/server" instead of directly.
 */

import type {
  ScoredToken,
  DiscoveryFilterParams,
  DiscoveryScanResult,
  RawTokenData,
  DiscoveryChain,
} from "./types";
import { getDiscoveryConfig } from "./config";
import { fetchLatestPairs, searchTokenPairs } from "./clients/dexscreener.client";
import { fetchTrendingTokens } from "./clients/birdeye.client";
import { batchFetchSmartMoneyHolders } from "./clients/helius.client";
import { fetchTwitterMentions } from "./clients/twitter.client";
import { batchFetchSocialData } from "./clients/lunarcrush.client";
import { runDiscoveryPipeline } from "./scoring";

// ── Scan Deduplication ───────────────────────────────────────────────────────
// Prevents rapid-fire scans from exhausting external API quotas.

let _lastScanTime = 0;
const SCAN_COOLDOWN_MS = 10_000; // 10 seconds between scans

/**
 * Checks if a scan can be performed (respecting cooldown).
 * Returns the last scan result if cooldown is active.
 */
function checkScanCooldown(): { allowed: boolean; waitMs: number } {
  const now = Date.now();
  const elapsed = now - _lastScanTime;
  if (elapsed < SCAN_COOLDOWN_MS) {
    return { allowed: false, waitMs: SCAN_COOLDOWN_MS - elapsed };
  }
  return { allowed: true, waitMs: 0 };
}

/**
 * Runs a full discovery scan using all configured API clients.
 *
 * Pipeline:
 *   1. Fetch raw tokens from DexScreener (new pairs) + Birdeye (trending)
 *   2. Fetch smart money data from Helius
 *   3. Fetch social data from Twitter + LunarCrush
 *   4. Run 5-stage scoring pipeline
 *   5. Sort by discovery score, return top N tokens
 *
 * @param params - Optional filter parameters.
 * @returns Discovery scan result with scored tokens.
 */
export async function scanDiscovery(params?: DiscoveryFilterParams): Promise<DiscoveryScanResult> {
  const config = getDiscoveryConfig();
  const startMs = Date.now();

  if (!config.DISCOVERY_ENABLED) {
    return {
      tokens: [],
      totalFound: 0,
      filteredOut: 0,
      scanDurationMs: Date.now() - startMs,
      scanTimestamp: new Date().toISOString(),
    };
  }

  // Rate-limit: enforce scan cooldown to protect external API quotas
  const cooldown = checkScanCooldown();
  if (!cooldown.allowed) {
    return {
      tokens: [],
      totalFound: 0,
      filteredOut: 0,
      scanDurationMs: Date.now() - startMs,
      scanTimestamp: new Date().toISOString(),
      error: `Scan cooldown active. Retry in ${Math.ceil(cooldown.waitMs / 1000)}s`,
    };
  }

  // ── Stage 1: Fetch raw tokens from multiple sources ──
  let allRawTokens: RawTokenData[] = [];

  // Source 1: DexScreener new pairs (primary for new tokens)
  try {
    const dexResult = await fetchLatestPairs(
      config.DEXSCREENER_API_URL,
      params?.chains,
      config.DISCOVERY_MAX_TOKENS,
    );
    if (dexResult.success && dexResult.data) {
      allRawTokens.push(...dexResult.data);
    }
  } catch {
    // Continue with other sources
  }

  // Source 2: Birdeye trending (for established tokens)
  try {
    const birdeyeResult = await fetchTrendingTokens(
      config.BIRDEYE_API_KEY,
      params?.chains,
      Math.min(config.DISCOVERY_MAX_TOKENS, 30),
    );
    if (birdeyeResult.success && birdeyeResult.data) {
      allRawTokens.push(...birdeyeResult.data);
    }
  } catch {
    // Continue without Birdeye data
  }

  // Deduplicate by address
  const seen = new Set<string>();
  allRawTokens = allRawTokens.filter((t) => {
    const key = `${t.chain}:${t.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const totalFound = allRawTokens.length;

  // ── Stage 3: Fetch smart money data ──
  const smartMoneyMap = await batchFetchSmartMoneyHolders(
    config.HELIUS_RPC_URL,
    config.HELIUS_API_KEY,
    allRawTokens.map((t) => t.address),
  );

  // ── Stage 4: Fetch social data ──
  // Twitter (batch — but Twitter API requires per-symbol queries)
  const socialMap = new Map<string, { mentions: number; sentiment: number }>();

  // Twitter mentions (batch with limited concurrency)
  const twitterPromises = allRawTokens.slice(0, 20).map(async (t) => {
    const result = await fetchTwitterMentions(config.TWITTER_BEARER_TOKEN, `$${t.symbol}`);
    if (result.success && result.data) {
      socialMap.set(t.symbol, {
        mentions: result.data.mentionCount,
        sentiment: result.data.avgSentiment,
      });
    }
  });

  await Promise.allSettled(twitterPromises);

  // LunarCrush social data
  const symbols = allRawTokens.slice(0, 30).map((t) => t.symbol);
  const lunarData = await batchFetchSocialData(config.LUNARCRUSH_API_KEY, symbols);
  for (const [sym, data] of lunarData) {
    const existing = socialMap.get(sym) ?? { mentions: 0, sentiment: 0 };
    socialMap.set(sym, {
      mentions: Math.max(existing.mentions, data.mentions),
      sentiment: data.galaxyScore > 50 ? 0.3 : existing.sentiment, // positive if high galaxy score
    });
  }

  // ── Run full pipeline ──
  const scored = runDiscoveryPipeline(allRawTokens, smartMoneyMap, socialMap);

  // ── Apply filters ──
  let filtered = scored;

  // Chain filter
  if (params?.chains && params.chains.length > 0) {
    const chainSet = new Set(params.chains);
    filtered = filtered.filter((t) => chainSet.has(t.chain as DiscoveryChain));
  }

  // Min liquidity
  if (params?.minLiquidity) {
    filtered = filtered.filter((t) => t.liquidity >= params.minLiquidity!);
  }

  // Min volume
  if (params?.minVolume24h) {
    filtered = filtered.filter((t) => t.volume24h >= params.minVolume24h!);
  }

  // Min market cap
  if (params?.minMarketCap) {
    filtered = filtered.filter((t) => t.marketCap >= params.minMarketCap!);
  }

  // Sort
  const sortBy = params?.sortBy ?? "trending";
  const sortOrder = params?.sortOrder ?? "desc";

  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "volume":
        comparison = a.volume24h - b.volume24h;
        break;
      case "change":
        comparison = Math.abs(b.change24h) - Math.abs(a.change24h);
        break;
      case "liquidity":
        comparison = a.liquidity - b.liquidity;
        break;
      case "smart":
        comparison = a.smartMoneyScore - b.smartMoneyScore;
        break;
      case "trending":
      default:
        comparison = a.discoveryScore - b.discoveryScore;
        break;
    }
    return sortOrder === "desc" ? comparison : -comparison;
  });

  // Limit + offset
  const offset = params?.offset ?? 0;
  const limit = params?.limit ?? config.DISCOVERY_MAX_TOKENS;
  const finalTokens = filtered.slice(offset, offset + limit);

  // Update scan timestamp for cooldown tracking
  _lastScanTime = Date.now();

  return {
    tokens: finalTokens,
    totalFound: filtered.length,
    filteredOut: totalFound - filtered.length,
    scanDurationMs: Date.now() - startMs,
    scanTimestamp: new Date().toISOString(),
  };
}

/**
 * Searches for specific tokens by query string.
 *
 * @param query - Search query (symbol or name).
 * @returns Array of scored tokens matching the query.
 */
export async function searchTokens(query: string): Promise<ScoredToken[]> {
  const config = getDiscoveryConfig();
  if (!config.DISCOVERY_ENABLED || !query.trim()) return [];

  const result = await searchTokenPairs(config.DEXSCREENER_API_URL, query);
  if (!result.success || !result.data) return [];

  // Run through scoring pipeline with empty social/SM data
  return runDiscoveryPipeline(result.data);
}
