/**
 * @module server/api/discover
 * @description GET endpoint for memecoin discovery results.
 * Returns scored tokens based on filter parameters.
 *
 * Query parameters:
 *   chain - Filter by chain (solana, ethereum, base, arbitrum, polygon)
 *   minLiquidity - Minimum liquidity in USD
 *   minVolume - Minimum 24h volume in USD
 *   minMarketCap - Minimum market cap in USD
 *   sortBy - Sort field (trending, volume, change, liquidity, smart)
 *   sortOrder - Sort direction (asc, desc)
 *   limit - Max results (default 50)
 *   offset - Pagination offset (default 0)
 *   search - Search by symbol or name
 */

import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { scanDiscovery, searchTokens } from "@/domains/discovery/functions";
import { getDiscoveryConfig } from "@/domains/discovery/config";

/** Query parameter schema for GET /api/discover. */
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
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc"),
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

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = discoverQuerySchema.parse(query);

    // If search query provided, use search instead of scan
    if (params.search && params.search.trim().length > 0) {
      const tokens = await searchTokens(params.search);
      return {
        success: true,
        data: tokens,
        total: tokens.length,
        source: "search",
      };
    }

    // Full discovery scan
    const config = getDiscoveryConfig();
    if (!config.DISCOVERY_ENABLED) {
      return {
        success: true,
        data: [],
        total: 0,
        message: "Discovery module is currently disabled",
      };
    }

    const result = await scanDiscovery({
      chains: params.chain ? [params.chain as "solana" | "ethereum" | "base" | "arbitrum" | "polygon"] : undefined,
      minLiquidity: params.minLiquidity || undefined,
      minVolume24h: params.minVolume || undefined,
      minMarketCap: params.minMarketCap || undefined,
      sortBy: params.sortBy as "trending" | "volume" | "change" | "liquidity" | "smart",
      sortOrder: params.sortOrder as "asc" | "desc",
      limit: params.limit,
      offset: params.offset,
    });

    // Transform scored tokens to client-friendly format
    const clientTokens = result.tokens.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      price: t.price,
      change24h: t.change24h,
      volume24h: t.volume24h,
      liquidity: t.liquidity,
      smartMoneyPct: t.smartMoneyScore,
      risk: t.riskLevel,
      chain: t.chain.charAt(0).toUpperCase() + t.chain.slice(1),
      marketCap: t.marketCap,
      discoveryScore: t.discoveryScore,
      socialScore: t.socialScore,
      liquidityScore: t.liquidityScore,
      ageScore: t.ageScore,
      nftBadge: t.nftBadge,
      isHoneypot: t.isHoneypot ?? false,
      socialMentions: t.socialMentions ?? 0,
      socialSentiment: t.socialSentiment ?? 0,
      topHolderPct: t.topHolderPct ?? 0,
      scannedAt: t.scannedAt,
    }));

    return {
      success: true,
      data: clientTokens,
      total: result.totalFound,
      filteredOut: result.filteredOut,
      scanDurationMs: result.scanDurationMs,
      source: "discovery-pipeline",
    };
  } catch (err) {
    // Log real error server-side, return generic message to client
    console.error("[discover] Error:", err instanceof Error ? err.message : err);
    return {
      success: false,
      error: "Internal server error",
      data: [],
      total: 0,
    };
  }
});
