// ============================================================================
// VIXOR Discovery API Route
// ============================================================================
// GET /api/discover?sortBy=trending&sortOrder=desc&limit=50&search=...
//
// Bridges the Discover page frontend to the domains/discovery backend.
// Calls scanDiscovery() from the discovery domain and returns tokens
// in the format expected by the frontend (DiscoverResponse).
// ============================================================================

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { scanDiscovery, searchTokens } from "@/domains/discovery/server";

/** Query parameters accepted by the discovery endpoint. */
interface DiscoverQueryParams {
  sortBy?: "trending" | "volume" | "change" | "liquidity" | "smart";
  sortOrder?: "asc" | "desc";
  limit?: string;
  offset?: string;
  search?: string;
  chains?: string;
  minLiquidity?: string;
  minVolume24h?: string;
  minMarketCap?: string;
}

export const APIRoute = createAPIFileRoute({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const params: DiscoverQueryParams = {
      sortBy: (url.searchParams.get("sortBy") as DiscoverQueryParams["sortBy"]) || "trending",
      sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      limit: url.searchParams.get("limit") || "50",
      offset: url.searchParams.get("offset") || "0",
      search: url.searchParams.get("search") || undefined,
      chains: url.searchParams.get("chains") || undefined,
      minLiquidity: url.searchParams.get("minLiquidity") || undefined,
      minVolume24h: url.searchParams.get("minVolume24h") || undefined,
      minMarketCap: url.searchParams.get("minMarketCap") || undefined,
    };

    try {
      // ── Search mode: use searchTokens() for direct symbol/name lookups ──
      if (params.search && params.search.trim()) {
        const tokens = await searchTokens(params.search.trim());
        if (tokens.length === 0) {
          return Response.json({
            success: true,
            data: [],
            total: 0,
            source: "dexscreener:search",
            message: `No results for "${params.search}"`,
          });
        }

        return Response.json({
          success: true,
          data: tokens.map(scoredTokenToResponse),
          total: tokens.length,
          scanDurationMs: 0,
          source: "dexscreener:search",
        });
      }

      // ── Full scan mode: run the discovery pipeline ──
      const chainFilter = params.chains
        ? params.chains.split(",").map((c) => c.trim().toLowerCase())
        : undefined;

      const result = await scanDiscovery({
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        limit: Math.min(parseInt(params.limit || "50", 10) || 50, 200),
        offset: parseInt(params.offset || "0", 10) || 0,
        chains: chainFilter as any,
        minLiquidity: params.minLiquidity ? parseFloat(params.minLiquidity) : undefined,
        minVolume24h: params.minVolume24h ? parseFloat(params.minVolume24h) : undefined,
        minMarketCap: params.minMarketCap ? parseFloat(params.minMarketCap) : undefined,
      });

      // Map ScoredToken[] to the frontend's TokenItem shape
      const data = result.tokens.map(scoredTokenToResponse);

      return Response.json({
        success: true,
        data,
        total: result.totalFound,
        filteredOut: result.filteredOut,
        scanDurationMs: result.scanDurationMs,
        source: "discovery:pipeline",
        error: result.error || undefined,
      });
    } catch (err) {
      console.error("[Discover API]", err);
      const message = err instanceof Error ? err.message : "Unknown error";

      return Response.json(
        {
          success: false,
          data: [],
          total: 0,
          error: message,
        },
        { status: 500 },
      );
    }
  },
});

// ── Mapper: ScoredToken → TokenItem (frontend shape) ──────────────────────

function scoredTokenToResponse(token: any) {
  return {
    symbol: token.symbol,
    name: token.name,
    price: token.price ?? null,
    change24h: token.change24h ?? null,
    volume24h: token.volume24h ?? 0,
    liquidity: token.liquidity ?? 0,
    smartMoneyPct: token.smartMoneyScore ?? undefined,
    risk: token.riskLevel ?? undefined,
    chain: token.chain ?? "unknown",
    marketCap: token.marketCap ?? 0,
    discoveryScore: token.discoveryScore ?? 0,
    socialScore: token.socialScore ?? 0,
    liquidityScore: token.liquidityScore ?? 0,
    isHoneypot: token.isHoneypot ?? false,
  };
}