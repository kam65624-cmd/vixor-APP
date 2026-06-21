/**
 * @module server/api/discover/scan
 * @description POST endpoint to trigger a fresh discovery scan.
 * Used by the frontend to force a rescan beyond the 30s polling interval.
 *
 * Body parameters:
 *   chains - Optional chain filter
 *   forceRefresh - Force bypass of cache
 */

import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { scanDiscovery } from "@/domains/discovery/functions";
import { getDiscoveryConfig } from "@/domains/discovery/config";

/** Request body schema for POST /api/discover/scan. */
const scanBodySchema = z.object({
  chains: z.array(z.string()).optional(),
  forceRefresh: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(200).optional().default(50),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const params = scanBodySchema.parse(body ?? {});

    const config = getDiscoveryConfig();
    if (!config.DISCOVERY_ENABLED) {
      return {
        success: false,
        error: "Discovery module is currently disabled",
      };
    }

    const result = await scanDiscovery({
      chains: params.chains as
        | Array<"solana" | "ethereum" | "base" | "arbitrum" | "polygon">
        | undefined,
      limit: params.limit,
    });

    return {
      success: true,
      tokens: result.tokens.map((t) => ({
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
        nftBadge: t.nftBadge,
      })),
      totalFound: result.totalFound,
      filteredOut: result.filteredOut,
      scanDurationMs: result.scanDurationMs,
      scanTimestamp: result.scanTimestamp,
    };
  } catch (err) {
    console.error("[discover/scan] Error:", err instanceof Error ? err.message : err);
    return {
      success: false,
      error: "Internal server error",
    };
  }
});
