// ============================================================================
// VIXOR Discover — DexScreener Client (Zod-Validated)
// ============================================================================
//
// Fetches new token profiles and boosted tokens from DexScreener's free API.
// Builds on top of the existing rate limiter at @/shared/resilience/rate-limiter
// and reuses the same base URL pattern from @/shared/market-data/dexscreener.
//
// No API key required. 60 req/min limit.
// ============================================================================

import { z } from "zod";
import { Limiters } from "@/shared/resilience/rate-limiter";

const BASE_URL = "https://api.dexscreener.com";

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const DexLinkSchema = z.object({
  type: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  url: z.string(),
});

/**
 * Schema for /token-profiles/latest/v1 response items.
 * These are tokens that recently added profiles on DexScreener.
 */
export const DexNewTokenSchema = z.object({
  url: z.string(),
  chainId: z.string(),
  tokenAddress: z.string(),
  icon: z.string().nullable().optional(),
  header: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  links: z.array(DexLinkSchema).nullable().optional(),
});

export type DexNewToken = z.infer<typeof DexNewTokenSchema>;

/**
 * Schema for /token-boosts/latest/v1 response items.
 * These are tokens that received community boosts (activity signal).
 */
export const DexBoostedTokenSchema = z.object({
  url: z.string(),
  chainId: z.string(),
  tokenAddress: z.string(),
  icon: z.string().nullable().optional(),
  header: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  links: z.array(DexLinkSchema).nullable().optional(),
  amount: z.number().optional(),
  totalAmount: z.number().optional(),
});

export type DexBoostedToken = z.infer<typeof DexBoostedTokenSchema>;

/**
 * Schema for /token-pairs/v1/{chainId}/{tokenAddress} response items.
 * Reuses the existing DexScreenerPair shape from the shared client.
 */
const DexPairPriceSchema = z.object({
  priceUsd: z.string().nullable().optional(),
  priceChange: z
    .object({
      h24: z.number().optional(),
      h6: z.number().optional(),
      h1: z.number().optional(),
      m5: z.number().optional(),
    })
    .nullable()
    .optional(),
  volume: z
    .object({
      h24: z.number().optional(),
      h6: z.number().optional(),
      h1: z.number().optional(),
      m5: z.number().optional(),
    })
    .nullable()
    .optional(),
  liquidity: z
    .object({
      usd: z.number().nullable().optional(),
      base: z.number().optional(),
      quote: z.number().optional(),
    })
    .nullable()
    .optional(),
  fdv: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  pairAddress: z.string().optional(),
  baseToken: z
    .object({
      address: z.string(),
      name: z.string(),
      symbol: z.string(),
    })
    .nullable()
    .optional(),
  info: z
    .object({
      imageUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type DexPair = z.infer<typeof DexPairPriceSchema>;

// ── Internal fetch with rate limiting + Zod validation ─────────────────────

async function dexFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
): Promise<z.infer<T>[]> {
  await Limiters.dexscreener.wait();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.warn(`[discover:dexscreener] ${path} returned ${res.status}`);
      return [];
    }
    const raw = await res.json();
    const parsed = z.array(schema).safeParse(raw);
    if (!parsed.success) {
      console.warn(
        `[discover:dexscreener] ${path} validation failed:`,
        parsed.error.issues.slice(0, 3).map((i) => i.path.join(".")),
      );
      return [];
    }
    return parsed.data as z.infer<T>[];
  } catch (err) {
    console.warn(
      `[discover:dexscreener] ${path} failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch the latest token profiles from DexScreener.
 * These are tokens that recently created/updated their DexScreener profile.
 *
 * GET /token-profiles/latest/v1
 */
export async function fetchNewTokenProfiles(): Promise<DexNewToken[]> {
  return dexFetch("/token-profiles/latest/v1", DexNewTokenSchema);
}

/**
 * Fetch the latest boosted tokens from DexScreener.
 * Boosted tokens indicate community interest / trading activity.
 *
 * GET /token-boosts/latest/v1
 */
export async function fetchBoostedTokens(): Promise<DexBoostedToken[]> {
  return dexFetch("/token-boosts/latest/v1", DexBoostedTokenSchema);
}

/**
 * Fetch trading pairs for a specific token on a specific chain.
 * Used for getting price, volume, and liquidity data for a discovered token.
 *
 * GET /token-pairs/v1/{chainId}/{tokenAddress}
 */
export async function fetchTokenPairs(chainId: string, tokenAddress: string): Promise<DexPair[]> {
  return dexFetch(`/token-pairs/v1/${chainId}/${tokenAddress}`, DexPairPriceSchema);
}
