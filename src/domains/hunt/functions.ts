// ============================================================================
// Hunt — Server Functions
// ============================================================================
//
// Server functions for the HUNT domain:
//   - getTrendingTokens: DexScreener boosted + Birdeye trending merged
//   - getTokenDetail: DexScreener + Birdeye + GoPlus combined
//   - getWhaleWallets: user's tracked whale wallets from DB
//   - getWalletTransactions: Birdeye wallet txns
//   - trackWhale: add wallet to DB
//   - untrackWhale: remove wallet from DB
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import {
  fetchBoostedTokens,
  fetchTokenPairs,
  fetchNewTokenProfiles,
} from "@/domains/discover/dexscreener-client";
import {
  fetchBirdeyeTrending,
  fetchBirdeyeTokenOverview,
  fetchBirdeyeWalletTxns,
  fetchBirdeyeTopTraders,
} from "./birdeye-client";
import { calculateAccelerationScore } from "./acceleration";
import { classifyWallet } from "./whale-classifier";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  accelerationScore: number;
  accelerationLevel: "hot" | "warm" | "cool";
  imageUrl?: string;
  pairAddress?: string;
  source: "dexscreener" | "birdeye" | "binance";
}

// ── Trending Tokens ──────────────────────────────────────────────────────────

export const getTrendingTokens = createServerFn({ method: "GET" })
  .validator(z.object({ chain: z.string().optional(), limit: z.number().optional() }))
  .handler(async ({ data }): Promise<{ tokens: TrendingToken[] }> => {
    const chain = data?.chain || "solana";
    const limit = data?.limit || 20;

    // Fetch from DexScreener (free, no key) and Birdeye (key optional) in parallel
    const [boostedTokens, newProfiles, birdeyeTrending] = await Promise.all([
      fetchBoostedTokens().catch(() => []),
      fetchNewTokenProfiles().catch(() => []),
      fetchBirdeyeTrending(chain, limit).catch(() => []),
    ]);

    const results: TrendingToken[] = [];
    const seen = new Set<string>();

    // Process DexScreener boosted tokens
    for (const token of boostedTokens.slice(0, 30)) {
      if (seen.has(token.tokenAddress)) continue;
      seen.add(token.tokenAddress);

      // Fetch pair data for market info
      const pairs = await fetchTokenPairs(token.chainId, token.tokenAddress).catch(() => []);
      const pair = pairs[0];

      if (!pair) continue;

      const priceChange24h = pair.priceChange?.h24 ?? 0;
      const priceChange1h = pair.priceChange?.h1 ?? 0;
      const volume24h = pair.volume?.h24 ?? 0;
      const liquidity = pair.liquidity?.usd ?? 0;

      const accel = calculateAccelerationScore({
        priceChange1h,
        priceChange24h,
        volume24h,
        volumePrev24h: volume24h * 0.7, // estimate
        liquidity,
        txCount1h: 0,
        txCountPrev1h: 0,
        holderGrowthPct: 0,
      });

      results.push({
        address: token.tokenAddress,
        name: pair.baseToken?.name || "Unknown",
        symbol: pair.baseToken?.symbol || token.tokenAddress.slice(0, 6),
        chain: token.chainId,
        price: parseFloat(pair.priceUsd || "0"),
        priceChange1h,
        priceChange24h,
        volume24h,
        marketCap: pair.marketCap ?? pair.fdv ?? 0,
        liquidity,
        holders: 0,
        accelerationScore: accel.score,
        accelerationLevel: accel.level,
        imageUrl: token.icon ?? pair.info?.imageUrl ?? undefined,
        pairAddress: pair.pairAddress,
        source: "dexscreener",
      });
    }

    // Process Birdeye trending (dedup)
    for (const token of birdeyeTrending.slice(0, 20)) {
      if (seen.has(token.address)) continue;
      seen.add(token.address);

      const accel = calculateAccelerationScore({
        priceChange1h: 0,
        priceChange24h: token.priceChange24hPercent,
        volume24h: token.volume24h,
        volumePrev24h: token.volume24h * 0.7,
        liquidity: token.liquidity,
        txCount1h: 0,
        txCountPrev1h: 0,
        holderGrowthPct: 0,
      });

      results.push({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        chain,
        price: token.price,
        priceChange1h: 0,
        priceChange24h: token.priceChange24hPercent,
        volume24h: token.volume24h,
        marketCap: 0,
        liquidity: token.liquidity,
        holders: 0,
        accelerationScore: accel.score,
        accelerationLevel: accel.level,
        imageUrl: token.logoURI,
        source: "birdeye",
      });
    }

    // Sort by acceleration score descending
    results.sort((a, b) => b.accelerationScore - a.accelerationScore);

    return { tokens: results.slice(0, limit) };
  });

// ── Token Detail ─────────────────────────────────────────────────────────────

export const getTokenDetail = createServerFn({ method: "GET" })
  .validator(z.object({ address: z.string(), chain: z.string() }))
  .handler(async ({ data }) => {
    const { address, chain } = data;

    const [birdeye, dexPairs] = await Promise.all([
      fetchBirdeyeTokenOverview(address, chain).catch(() => null),
      fetchTokenPairs(chain, address).catch(() => []),
    ]);

    const dex = dexPairs[0];

    return {
      address,
      chain,
      name: birdeye?.name ?? dex?.baseToken?.name ?? "Unknown",
      symbol: birdeye?.symbol ?? dex?.baseToken?.symbol ?? "???",
      price: birdeye?.price ?? parseFloat(dex?.priceUsd || "0"),
      priceChange24h: birdeye?.priceChange24hPercent ?? dex?.priceChange?.h24 ?? 0,
      priceChange1h: birdeye?.priceChange1hPercent ?? dex?.priceChange?.h1 ?? 0,
      volume24h: birdeye?.volume24h ?? dex?.volume?.h24 ?? 0,
      marketCap: birdeye?.marketCap ?? dex?.marketCap ?? 0,
      liquidity: birdeye?.liquidity ?? dex?.liquidity?.usd ?? 0,
      holders: birdeye?.holder ?? 0,
      imageUrl: birdeye?.logoURI ?? dex?.info?.imageUrl,
      website: birdeye?.extensions?.website,
      twitter: birdeye?.extensions?.twitter,
      pairAddress: dex?.pairAddress,
      dexId: undefined as string | undefined,
    };
  });

// ── Whale Wallets ─────────────────────────────────────────────────────────────

export const getWhaleWallets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: wallets } = await (supabase.from as any)("whale_wallets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { wallets: wallets || [] };
  });

/** Get recent transactions for a tracked wallet */
export const getWalletTransactions = createServerFn({ method: "GET" })
  .validator(z.object({ walletAddress: z.string(), chain: z.string() }))
  .handler(async ({ data }) => {
    const txns = await fetchBirdeyeWalletTxns(data.walletAddress, data.chain, 20).catch(() => []);
    const classified = classifyWallet({
      address: data.walletAddress,
      txns: txns.map((t) => ({
        type: t.side === "buy" ? "buy" : "sell",
        valueUsd: t.volumeUsd,
        timestamp: t.blockUnixTime * 1000,
      })),
      totalPnl: 0,
      winRate: 0,
      totalTrades: txns.length,
    });

    return {
      txns,
      classification: classified,
    };
  });

/** Add a wallet to whale tracker */
export const trackWhale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      walletAddress: z.string(),
      chain: z.string(),
      label: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase.from as any)("whale_wallets").upsert(
      {
        user_id: userId,
        wallet_address: data.walletAddress,
        chain: data.chain,
        label: data.label,
      },
      { onConflict: "user_id,wallet_address,chain" },
    );
    return { ok: !error, error: error?.message ?? null };
  });

/** Remove a whale wallet from tracker */
export const untrackWhale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ walletAddress: z.string(), chain: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await (supabase.from as any)("whale_wallets")
      .delete()
      .eq("user_id", userId)
      .eq("wallet_address", data.walletAddress)
      .eq("chain", data.chain);
    return { ok: true };
  });

/** Fetch top traders for a specific token */
export const getTopTraders = createServerFn({ method: "GET" })
  .validator(z.object({ tokenAddress: z.string(), chain: z.string() }))
  .handler(async ({ data }) => {
    const traders = await fetchBirdeyeTopTraders(data.tokenAddress, data.chain).catch(() => []);
    return { traders };
  });
