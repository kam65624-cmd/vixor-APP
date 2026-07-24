// ============================================================================
// VIXOR Discover — Crypto Data Server Function
// ============================================================================
//
// TanStack Start server function that fetches new + boosted tokens from
// DexScreener and enriches them with price data from the pairs endpoint.
// Uses Promise.allSettled so one failing source doesn't block the other.
//
// NO mock fallback — if DexScreener fails, the UI shows an empty state.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import {
  fetchNewTokenProfiles,
  fetchBoostedTokens,
  fetchTokenPairs,
  type DexNewToken,
  type DexBoostedToken,
  type DexPair,
} from "./dexscreener-client";

// ── Enriched types (what the UI receives) ─────────────────────────────────

export interface EnrichedToken {
  /** DexScreener chain ID (e.g. "solana", "ethereum", "base") */
  chainId: string;
  /** On-chain token address */
  tokenAddress: string;
  /** Token symbol — populated from pair data or extracted from description */
  symbol: string;
  /** Token name — populated from pair data or extracted from description */
  name: string;
  /** Token icon URL */
  icon: string | null;
  /** Token description */
  description: string | null;
  /** DexScreener URL */
  url: string;
  /** Live USD price from best pair */
  priceUsd: number | null;
  /** 24h price change % */
  change24h: number | null;
  /** 24h volume in USD */
  volume24h: number | null;
  /** Liquidity in USD from best pair */
  liquidityUsd: number | null;
  /** FDV from best pair */
  fdv: number | null;
  /** Market cap from best pair */
  marketCap: number | null;
  /** DexScreener pair address (for navigation) */
  pairAddress: string | null;
  /** Whether this token came from boosts (vs new profiles) */
  isBoosted: boolean;
  /** Boost amount (only for boosted tokens) */
  boostAmount: number | null;
  /** Total boost amount */
  totalBoostAmount: number | null;
}

export interface DiscoverCryptoResult {
  newTokens: EnrichedToken[];
  boostedTokens: EnrichedToken[];
  fetchedAt: number;
  source: "dexscreener";
}

// ── Enrichment logic ──────────────────────────────────────────────────────

/**
 * Takes a raw new/boosted token and enriches it with pair data (price, volume, etc.)
 * Falls back to partial data if pair fetch fails — never throws.
 */
async function enrichToken(
  token: DexNewToken | DexBoostedToken,
  isBoosted: boolean,
): Promise<EnrichedToken> {
  // Fetch pairs for price data
  const pairs = await fetchTokenPairs(token.chainId, token.tokenAddress);

  // Pick the best pair (highest liquidity)
  const best = pickBestPair(pairs);

  return {
    chainId: token.chainId,
    tokenAddress: token.tokenAddress,
    symbol: best?.baseToken?.symbol ?? extractSymbol(token),
    name: best?.baseToken?.name ?? extractName(token),
    icon: (token.icon ?? best?.baseToken) ? null : null,
    description: token.description ?? null,
    url: token.url,
    priceUsd: best?.priceUsd ? parseFloat(best.priceUsd) : null,
    change24h: best?.priceChange?.h24 ?? null,
    volume24h: best?.volume?.h24 ?? null,
    liquidityUsd: best?.liquidity?.usd ?? null,
    fdv: best?.fdv ?? null,
    marketCap: best?.marketCap ?? null,
    pairAddress: best?.pairAddress ?? null,
    isBoosted,
    boostAmount: isBoosted && "amount" in token ? (token.amount ?? null) : null,
    totalBoostAmount: isBoosted && "totalAmount" in token ? (token.totalAmount ?? null) : null,
  };
}

/** Pick the pair with the highest liquidity (most reliable price). */
function pickBestPair(pairs: DexPair[]): DexPair | null {
  const withLiq = pairs
    .filter((p) => p.liquidity?.usd != null && p.liquidity.usd > 0)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  return withLiq[0] ?? null;
}

/** Extract a symbol from the token URL as last resort. */
function extractSymbol(token: DexNewToken | DexBoostedToken): string {
  // URL pattern: https://dexscreener.com/{chain}/{address}
  // We don't have a symbol from the profile endpoint, so derive from address
  const addr = token.tokenAddress;
  if (addr.length > 8) {
    return addr.slice(0, 6) + "...";
  }
  return addr;
}

/** Extract a name from description or fallback. */
function extractName(token: DexNewToken | DexBoostedToken): string {
  if (token.description) {
    // Use first line of description (often the token name/tagline)
    const firstLine = token.description.split(/[\n.]/)[0].trim();
    if (firstLine.length >= 2 && firstLine.length <= 60) return firstLine;
  }
  return "Unknown Token";
}

// ── Server Function ───────────────────────────────────────────────────────

export const getDiscoverCryptoData = createServerFn({ method: "GET" }).handler(
  async (): Promise<DiscoverCryptoResult> => {
    const fetchedAt = Date.now();

    // Fetch both sources in parallel — one failing doesn't block the other
    const [newResult, boostedResult] = await Promise.allSettled([
      fetchNewTokenProfiles(),
      fetchBoostedTokens(),
    ]);

    const rawNewTokens = newResult.status === "fulfilled" ? newResult.value : [];
    const rawBoostedTokens = boostedResult.status === "fulfilled" ? boostedResult.value : [];

    // Log failures for debugging
    if (newResult.status === "rejected") {
      console.warn(
        "[discover:crypto] fetchNewTokenProfiles failed:",
        newResult.reason instanceof Error ? newResult.reason.message : newResult.reason,
      );
    }
    if (boostedResult.status === "rejected") {
      console.warn(
        "[discover:crypto] fetchBoostedTokens failed:",
        boostedResult.reason instanceof Error ? boostedResult.reason.message : boostedResult.reason,
      );
    }

    // Deduplicate: boosted tokens that also appear in new tokens
    const boostedAddresses = new Set(rawBoostedTokens.map((t) => `${t.chainId}:${t.tokenAddress}`));
    const newOnly = rawNewTokens.filter(
      (t) => !boostedAddresses.has(`${t.chainId}:${t.tokenAddress}`),
    );

    // Enrich all tokens with pair data (price, volume, etc.)
    // Limit to 20 new + 20 boosted to avoid excessive API calls
    const [enrichedNew, enrichedBoosted] = await Promise.all([
      Promise.all(newOnly.slice(0, 20).map((t) => enrichToken(t, false))),
      Promise.all(rawBoostedTokens.slice(0, 20).map((t) => enrichToken(t, true))),
    ]);

    return {
      newTokens: enrichedNew,
      boostedTokens: enrichedBoosted,
      fetchedAt,
      source: "dexscreener",
    };
  },
);
