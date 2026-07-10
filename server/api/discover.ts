/**
 * @module server/api/discover
 * @description GET endpoint for memecoin discovery results.
 * Returns scored tokens based on filter parameters.
 * Falls back to direct DexScreener fetch if the discovery pipeline returns empty.
 */

import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { scanDiscovery, searchTokens } from "@/domains/discovery/functions";
import { getDiscoveryConfig } from "@/domains/discovery/config";
import { cache } from "@/shared/cache";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight } from "./_security";

/** Query parameter schema for GET /api/discover. */
const DISCOVER_CACHE_TTL = 60_000;

const discoverQuerySchema = z.object({
  chain: z
    .string()
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined)),
  minLiquidity: z
    .string()
    .optional()
    .default("0")
    .transform((v) => parseInt(v, 10) || 0),
  minVolume: z
    .string()
    .optional()
    .default("0")
    .transform((v) => parseInt(v, 10) || 0),
  minMarketCap: z
    .string()
    .optional()
    .default("0")
    .transform((v) => parseInt(v, 10) || 0),
  sortBy: z
    .enum(["trending", "volume", "change", "liquidity", "smart"])
    .optional()
    .default("trending"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z
    .string()
    .optional()
    .default("50")
    .transform((v) => {
      const n = parseInt(v, 10);
      return Math.min(Math.max(n, 1), 200);
    }),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform((v) => Math.max(parseInt(v, 10) || 0, 0)),
  search: z.string().optional(),
});

// ── Direct DexScreener fallback (no API keys needed) ────────────────────────

interface DexPair {
  chainId: string;
  pairAddress: string;
  baseToken: { address: string; symbol: string; name: string };
  priceUsd: string | null;
  priceChange?: { h24: number } | null;
  volume?: { h24: number } | null;
  liquidity?: { usd: number | null; base: number; quote: number } | null;
  fdv: number | null;
  marketCap: number | null;
  info?: { imageUrl?: string | null };
  pairCreatedAt?: number;
  txns?: Record<string, { buys: number; sells: number }>;
}

const CHAIN_MAP: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  bsc: "BSC",
  avalanche: "Avalanche",
};

/**
 * Fetch tokens directly from DexScreener as a fast fallback.
 * Single request, no API keys required.
 */
async function dexScreenerFallback(
  params: z.infer<typeof discoverQuerySchema>,
): Promise<Array<Record<string, unknown>>> {
  const queries = params.chain
    ? [params.chain, "trending", "meme"]
    : ["trending", "meme", "solana", "ai", "defi", "depin", "gaming", "new", "pump", "rwa"];

  const allPairs: DexPair[] = [];
  const seen = new Set<string>();

  // Fetch in parallel batches of 3 to avoid overwhelming DexScreener
  const BATCH_SIZE = 3;
  for (let i = 0; i < queries.length; i += BATCH_SIZE) {
    const batch = queries.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (q) => {
        try {
          const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`;
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(10_000),
          });
          if (!res.ok) return [];
          const json = (await res.json()) as { pairs?: DexPair[] };
          return json.pairs ?? [];
        } catch {
          return [];
        }
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        for (const pair of r.value) {
          const key = `${pair.chainId}:${pair.baseToken?.address}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const liq = pair.liquidity?.usd ?? 0;
          const price = pair.priceUsd ? parseFloat(pair.priceUsd) : 0;
          const vol = pair.volume?.h24 ?? 0;

          // Apply user filters
          if (params.minLiquidity && liq < params.minLiquidity) continue;
          if (params.minVolume && vol < params.minVolume) continue;

          // ── Quality filters: remove garbage/mock tokens ──
          // Skip tokens with no price AND negligible liquidity (dead pairs)
          if (price <= 0 && liq < 100) continue;
          // Skip tokens with suspiciously low volume (< $5) AND low liquidity
          if (vol < 5 && liq < 500) continue;
          // Skip tokens with zero or near-zero liquidity
          if (liq < 50) continue;
          // Skip if symbol looks like a test/placeholder
          const sym = (pair.baseToken?.symbol ?? "").toUpperCase();
          if (/^(TEST|MOCK|FAKE|DUMMY|EXAMPLE|UNNAMED|TOKEN)/.test(sym)) continue;
          // Skip if name is empty or too short
          const name = (pair.baseToken?.name ?? "").trim();
          if (!name || name.length < 2) continue;

          allPairs.push(pair);
        }
      }
    }

    if (allPairs.length >= params.limit * 3) break;
  }

  // Sort
  const sortField = params.sortBy;
  const sortAsc = params.sortOrder === "asc";
  allPairs.sort((a, b) => {
    let va = 0,
      vb = 0;
    switch (sortField) {
      case "volume":
        va = a.volume?.h24 ?? 0;
        vb = b.volume?.h24 ?? 0;
        break;
      case "change":
        va = a.priceChange?.h24 ?? 0;
        vb = b.priceChange?.h24 ?? 0;
        break;
      case "liquidity":
        va = a.liquidity?.usd ?? 0;
        vb = b.liquidity?.usd ?? 0;
        break;
      case "trending":
      default:
        va = (a.volume?.h24 ?? 0) + (a.liquidity?.usd ?? 0) * 0.1;
        vb = (b.volume?.h24 ?? 0) + (b.liquidity?.usd ?? 0) * 0.1;
        break;
    }
    return sortAsc ? va - vb : vb - va;
  });

  // Paginate and transform
  const page = allPairs.slice(params.offset, params.offset + params.limit);

  return page.map((pair) => {
    const liq = pair.liquidity?.usd ?? 0;
    const price = pair.priceUsd ? parseFloat(pair.priceUsd) : 0;
    const vol = pair.volume?.h24 ?? 0;
    const change = pair.priceChange?.h24 ?? 0;
    const mcap = pair.marketCap ?? pair.fdv ?? 0;
    const chainLabel = CHAIN_MAP[pair.chainId] ?? pair.chainId.toUpperCase();

    // Generate a fake discovery score based on volume + liquidity
    const score = Math.min(100, Math.round(Math.log10(vol + liq + 1) * 12));

    return {
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      price: price > 0 ? price : null,
      change24h: change,
      volume24h: vol,
      liquidity: liq,
      chain: chainLabel,
      chainId: pair.chainId,
      marketCap: mcap,
      discoveryScore: score,
      socialScore: 0,
      liquidityScore: Math.min(100, Math.round(Math.log10(liq + 1) * 10)),
      isHoneypot: false,
      logoUrl: pair.info?.imageUrl || undefined,
      address: pair.baseToken.address,
      pairAddress: pair.pairAddress,
      dexUrl: `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`,
    };
  });
}

// ── Main Handler ────────────────────────────────────────────────────────────

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  // NOTE: rate limiting handled by withRateLimit wrapper below — do NOT double-limit here

  try {
    const query = getQuery(event);
    const params = discoverQuerySchema.parse(query);

    // If search query provided, use search instead of scan
    if (params.search && params.search.trim().length > 0) {
      const scoredTokens = await searchTokens(params.search);
      // Map ScoredToken fields to match the client-facing shape (same as main handler)
      const tokens = scoredTokens.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        price: t.price,
        change24h: t.change24h,
        volume24h: t.volume24h,
        liquidity: t.liquidity,
        smartMoneyPct: t.smartMoneyScore,
        risk: t.riskLevel,
        chain: t.chain.charAt(0).toUpperCase() + t.chain.slice(1),
        chainId: t.dexChainId || t.chain,
        marketCap: t.marketCap,
        discoveryScore: t.discoveryScore,
        socialScore: t.socialScore,
        liquidityScore: t.liquidityScore,
        ageScore: t.ageScore,
        nftBadge: t.nftBadge,
        isHoneypot: t.isHoneypot ?? false,
        logoUrl: t.logoUrl || undefined,
        socialMentions: t.socialMentions ?? 0,
        socialSentiment: t.socialSentiment ?? 0,
        topHolderPct: t.topHolderPct ?? 0,
        scannedAt: t.scannedAt,
        address: t.address || undefined,
        pairAddress: t.pairIdentifier || undefined,
        dexUrl: t.pairIdentifier
          ? `https://dexscreener.com/${t.dexChainId || t.chain}/${t.pairIdentifier}`
          : undefined,
      }));
      return {
        success: true,
        data: tokens,
        total: tokens.length,
        source: "search",
      };
    }

    // Check Redis cache
    const cKey = `discover:${query.chain || "all"}:${query.sortBy || "trending"}:${query.limit || "50"}`;
    const cached = await cache.get(cKey);
    if (cached) return { ...cached, cached: true };

    // ── Try full discovery pipeline first ──
    const config = getDiscoveryConfig();
    let clientTokens: Array<Record<string, unknown>> = [];
    let totalFound = 0;
    let filteredOut = 0;
    let scanDurationMs = 0;
    let source = "discovery-pipeline";

    if (config.DISCOVERY_ENABLED) {
      const startMs = Date.now();
      const result = await scanDiscovery({
        chains: params.chain
          ? [params.chain as "solana" | "ethereum" | "base" | "arbitrum" | "polygon"]
          : undefined,
        minLiquidity: params.minLiquidity || undefined,
        minVolume24h: params.minVolume || undefined,
        minMarketCap: params.minMarketCap || undefined,
        sortBy: params.sortBy as "trending" | "volume" | "change" | "liquidity" | "smart",
        sortOrder: params.sortOrder as "asc" | "desc",
        limit: params.limit,
        offset: params.offset,
      });
      scanDurationMs = Date.now() - startMs;
      totalFound = result.totalFound;
      filteredOut = result.filteredOut;

      clientTokens = result.tokens.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        price: t.price,
        change24h: t.change24h,
        volume24h: t.volume24h,
        liquidity: t.liquidity,
        smartMoneyPct: t.smartMoneyScore,
        risk: t.riskLevel,
        chain: t.chain.charAt(0).toUpperCase() + t.chain.slice(1),
        chainId: t.dexChainId || t.chain,
        marketCap: t.marketCap,
        discoveryScore: t.discoveryScore,
        socialScore: t.socialScore,
        liquidityScore: t.liquidityScore,
        ageScore: t.ageScore,
        nftBadge: t.nftBadge,
        isHoneypot: t.isHoneypot ?? false,
        logoUrl: t.logoUrl || undefined,
        socialMentions: t.socialMentions ?? 0,
        socialSentiment: t.socialSentiment ?? 0,
        topHolderPct: t.topHolderPct ?? 0,
        scannedAt: t.scannedAt,
        address: t.address || undefined,
        pairAddress: t.pairIdentifier || undefined,
        dexUrl: t.pairIdentifier
          ? `https://dexscreener.com/${t.dexChainId || t.chain}/${t.pairIdentifier}`
          : undefined,
      }));
    }

    // ── Fallback: if pipeline returned 0 tokens, use direct DexScreener ──
    if (clientTokens.length === 0) {
      console.log("[discover] Pipeline returned 0 tokens, using DexScreener fallback");
      const startMs = Date.now();
      clientTokens = await dexScreenerFallback(params);
      scanDurationMs = Date.now() - startMs;
      totalFound = clientTokens.length;
      source = "dexscreener-fallback";
    }

    const response = {
      success: true,
      data: clientTokens,
      total: totalFound,
      filteredOut,
      scanDurationMs,
      source,
    };
    // NEVER cache empty results — prevents 60s poison cache
    if (clientTokens.length > 0) {
      await cache.set(cKey, response, DISCOVER_CACHE_TTL);
    }
    return response;
  } catch (err) {
    console.error("[discover] Error:", err instanceof Error ? err.message : err);

    // Last resort: try DexScreener fallback even on error
    try {
      const query = getQuery(event);
      const params = discoverQuerySchema.parse(query);
      const fallbackTokens = await dexScreenerFallback(params);
      if (fallbackTokens.length > 0) {
        const fallbackResp = {
          success: true,
          data: fallbackTokens,
          total: fallbackTokens.length,
          source: "dexscreener-fallback-error",
        };
        // Cache non-empty fallback results for shorter TTL
        await cache.set(cKey, fallbackResp, 30_000);
        return fallbackResp;
      }
    } catch {
      // Give up
    }

    console.error("[discover] All sources returned empty");

    return {
      success: false,
      error: "Internal server error",
      data: [],
      total: 0,
    };
  }
});

export default withRateLimit(handler, { maxRequests: 120, windowSec: 60 });
