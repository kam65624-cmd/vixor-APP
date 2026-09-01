// ============================================================================
// Shield — Server Functions
// ============================================================================
//
// All server functions for the SHIELD domain:
//   - scanToken: GoPlus + RugCheck + Trust Score + DB save
//   - getScanHistory: paginated scans from DB
//   - getAlerts: alerts from DB with filters
//   - markAlertRead: update alert status
//   - getWatchlist: user's token watchlist
//   - addToWatchlist: add token to watchlist
//   - removeFromWatchlist: remove token from watchlist
//   - getUserSettings: load user settings
//   - upsertUserSettings: save user settings
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { fetchGoPlusSecurity, CHAIN_IDS } from "./goplus-client";
import { fetchRugCheckReport } from "./rugcheck-client";
import { fetchBirdeyeTokenOverview } from "@/domains/hunt/birdeye-client";
import { fetchTokenPairs } from "@/domains/discover/dexscreener-client";
import { calculateEvmTrustScore, calculateSolanaTrustScore } from "./trust-score";
import type { MarketContext } from "./trust-score";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScanTokenResult {
  ok: boolean;
  scanId: string | null;
  error: string | null;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  chain: string;
  trustScore: {
    score: number;
    level: string;
    verdict: string;
    honeypot: boolean;
    factors: Array<{
      name: string;
      status: string;
      weight: number;
      score: number;
      detail: string;
    }>;
  };
  market: {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    liquidity: number;
    holders: number;
  };
  security: {
    isHoneypot: boolean;
    buyTax: number;
    sellTax: number;
    isMintable: boolean;
    isProxy: boolean;
    ownershipRenounced: boolean;
    lpBurned: boolean;
    top10HolderPct: number;
    risks: string[];
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildMarketContext(tokenAddress: string, chain: string): Promise<MarketContext> {
  // Try Birdeye first, then DexScreener
  const [birdeye, dexPairs] = await Promise.all([
    fetchBirdeyeTokenOverview(tokenAddress, chain).catch(() => null),
    fetchTokenPairs(chain.toLowerCase() === "solana" ? "solana" : chain, tokenAddress).catch(
      () => [],
    ),
  ]);

  const dex = dexPairs?.[0];

  return {
    price: birdeye?.price ?? parseFloat(dex?.priceUsd ?? "0") ?? 0,
    liquidity: birdeye?.liquidity ?? dex?.liquidity?.usd ?? 0,
    volume24h: birdeye?.volume24h ?? dex?.volume?.h24 ?? 0,
    marketCap: birdeye?.marketCap ?? dex?.marketCap ?? 0,
    holders: birdeye?.holder ?? 0,
    hasWebsite: !!birdeye?.extensions?.website,
    hasTwitter: !!birdeye?.extensions?.twitter,
    ageDays: 0, // Age not directly available from these APIs
  };
}

// ── Server Functions ──────────────────────────────────────────────────────────

/** Scan a token: fetch security data + calculate trust score + save to DB */
export const scanToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ address: z.string().min(10), chain: z.string() }))
  .handler(async ({ data, context }): Promise<ScanTokenResult> => {
    const { address, chain } = data;
    const { supabase, userId } = context;
    const isSolana = chain.toLowerCase() === "solana" || chain.toLowerCase() === "sol";

    let tokenName = "Unknown";
    let tokenSymbol = "???";
    let trustScoreResult;
    let securitySummary: ScanTokenResult["security"] = {
      isHoneypot: false,
      buyTax: 0,
      sellTax: 0,
      isMintable: false,
      isProxy: false,
      ownershipRenounced: true,
      lpBurned: false,
      top10HolderPct: 0,
      risks: [],
    };

    // Build market context (runs in parallel with security check)
    const marketCtxPromise = buildMarketContext(address, chain);

    if (isSolana) {
      // Solana: use RugCheck
      const rugResult = await fetchRugCheckReport(address);
      const market = await marketCtxPromise;

      if (!rugResult.success || !rugResult.data) {
        return {
          ok: false,
          scanId: null,
          error: rugResult.error || "Failed to fetch RugCheck data",
          tokenName,
          tokenSymbol,
          tokenAddress: address,
          chain,
          trustScore: {
            score: 0,
            level: "critical",
            verdict: "Unable to scan",
            honeypot: false,
            factors: [],
          },
          market: {
            price: market.price,
            priceChange24h: 0,
            volume24h: market.volume24h,
            marketCap: market.marketCap,
            liquidity: market.liquidity,
            holders: market.holders,
          },
          security: securitySummary,
        };
      }

      const report = rugResult.data;
      tokenName = report.tokenMeta?.name || "Unknown";
      tokenSymbol = report.tokenMeta?.symbol || "???";
      trustScoreResult = calculateSolanaTrustScore(report, market);

      securitySummary = {
        isHoneypot: report.rugged,
        buyTax: 0, // Solana doesn't have buy/sell tax in same way
        sellTax: 0,
        isMintable: report.token?.mintAuthority !== null,
        isProxy: false,
        ownershipRenounced: !report.tokenMeta?.mutable,
        lpBurned: false,
        top10HolderPct: 0,
        risks: (report.risks || [])
          .filter((r) => r.level === "danger" || r.level === "warn")
          .map((r) => r.name),
      };

      // Save to DB
      const { data: savedScan } = await (supabase.from as any)("contract_scans")
        .insert({
          user_id: userId,
          contract_address: address,
          chain: "solana",
          token_name: tokenName,
          token_symbol: tokenSymbol,
          is_honeypot: report.rugged,
          is_mintable: securitySummary.isMintable,
          risk_score: 100 - trustScoreResult.score,
          verdict:
            trustScoreResult.level === "safe"
              ? "SAFE"
              : trustScoreResult.level === "low"
                ? "CAUTION"
                : trustScoreResult.level === "medium"
                  ? "SUSPICIOUS"
                  : "DANGER",
          verdict_reasons: trustScoreResult.factors
            .filter((f) => f.status === "fail")
            .map((f) => ({ name: f.name, detail: f.detail })),
          rugcheck_data: report as unknown as Record<string, unknown>,
        })
        .select("id")
        .single();

      return {
        ok: true,
        scanId: (savedScan as any)?.id ?? null,
        error: null,
        tokenName,
        tokenSymbol,
        tokenAddress: address,
        chain,
        trustScore: {
          score: trustScoreResult.score,
          level: trustScoreResult.level,
          verdict: trustScoreResult.verdict,
          honeypot: trustScoreResult.honeypot,
          factors: trustScoreResult.factors,
        },
        market: {
          price: market.price,
          priceChange24h: 0,
          volume24h: market.volume24h,
          marketCap: market.marketCap,
          liquidity: market.liquidity,
          holders: market.holders,
        },
        security: securitySummary,
      };
    } else {
      // EVM chains: use GoPlus
      const chainId = CHAIN_IDS[chain.toLowerCase()];
      if (!chainId) {
        return {
          ok: false,
          scanId: null,
          error: `Unsupported chain: ${chain}`,
          tokenName,
          tokenSymbol,
          tokenAddress: address,
          chain,
          trustScore: {
            score: 0,
            level: "critical",
            verdict: "Unsupported chain",
            honeypot: false,
            factors: [],
          },
          market: {
            price: 0,
            priceChange24h: 0,
            volume24h: 0,
            marketCap: 0,
            liquidity: 0,
            holders: 0,
          },
          security: securitySummary,
        };
      }

      const [goplusResult, market] = await Promise.all([
        fetchGoPlusSecurity(chain, address),
        marketCtxPromise,
      ]);

      if (!goplusResult.success || !goplusResult.data) {
        return {
          ok: false,
          scanId: null,
          error: goplusResult.error || "Failed to fetch GoPlus data",
          tokenName,
          tokenSymbol,
          tokenAddress: address,
          chain,
          trustScore: {
            score: 0,
            level: "critical",
            verdict: "Unable to scan",
            honeypot: false,
            factors: [],
          },
          market: {
            price: market.price,
            priceChange24h: 0,
            volume24h: market.volume24h,
            marketCap: market.marketCap,
            liquidity: market.liquidity,
            holders: market.holders,
          },
          security: securitySummary,
        };
      }

      const sec = goplusResult.data;
      tokenName = sec.token_name || "Unknown";
      tokenSymbol = sec.token_symbol || "???";
      trustScoreResult = calculateEvmTrustScore(sec, market);

      const buyTax = parseFloat(sec.buy_tax || "0") * 100;
      const sellTax = parseFloat(sec.sell_tax || "0") * 100;

      securitySummary = {
        isHoneypot: sec.is_honeypot === "1",
        buyTax,
        sellTax,
        isMintable: sec.is_mintable === "1",
        isProxy: sec.is_proxy === "1",
        ownershipRenounced: sec.can_take_back_ownership === "0",
        lpBurned: false,
        top10HolderPct: 0,
        risks: [
          sec.is_honeypot === "1" && "Honeypot",
          sec.is_mintable === "1" && "Mintable",
          sec.hidden_owner === "1" && "Hidden Owner",
          sec.transfer_pausable === "1" && "Transfer Pausable",
        ].filter(Boolean) as string[],
      };

      // Save to DB
      const { data: savedScan } = await (supabase.from as any)("contract_scans")
        .insert({
          user_id: userId,
          contract_address: address,
          chain: chain.toLowerCase(),
          token_name: tokenName,
          token_symbol: tokenSymbol,
          is_honeypot: sec.is_honeypot === "1",
          is_mintable: sec.is_mintable === "1",
          is_proxy: sec.is_proxy === "1",
          buy_tax: buyTax,
          sell_tax: sellTax,
          is_blacklistable: sec.is_blacklisted === "1",
          risk_score: 100 - trustScoreResult.score,
          verdict:
            trustScoreResult.level === "safe"
              ? "SAFE"
              : trustScoreResult.level === "low"
                ? "CAUTION"
                : trustScoreResult.level === "medium"
                  ? "SUSPICIOUS"
                  : "DANGER",
          verdict_reasons: trustScoreResult.factors
            .filter((f) => f.status === "fail")
            .map((f) => ({ name: f.name, detail: f.detail })),
          goplus_data: sec as unknown as Record<string, unknown>,
        })
        .select("id")
        .single();

      return {
        ok: true,
        scanId: (savedScan as any)?.id ?? null,
        error: null,
        tokenName,
        tokenSymbol,
        tokenAddress: address,
        chain,
        trustScore: {
          score: trustScoreResult.score,
          level: trustScoreResult.level,
          verdict: trustScoreResult.verdict,
          honeypot: trustScoreResult.honeypot,
          factors: trustScoreResult.factors,
        },
        market: {
          price: market.price,
          priceChange24h: 0,
          volume24h: market.volume24h,
          marketCap: market.marketCap,
          liquidity: market.liquidity,
          holders: market.holders,
        },
        security: securitySummary,
      };
    }
  });

/** Get user's scan history with pagination */
export const getScanHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ page: z.number().optional(), limit: z.number().optional() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data?.page ?? 0;
    const limit = data?.limit ?? 20;
    const offset = page * limit;

    const { data: scans, count } = await (supabase.from as any)("contract_scans")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      scans: scans || [],
      total: count || 0,
      page,
      hasMore: (count || 0) > offset + limit,
    };
  });

/** Get user's alerts */
export const getShieldAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      unreadOnly: z.boolean().optional(),
      severity: z.string().optional(),
      limit: z.number().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const limit = data?.limit ?? 50;

    let query = (supabase.from as any)("hunt_shield_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data?.unreadOnly) {
      query = query.eq("status", "active");
    }

    if (data?.severity) {
      query = query.eq("severity", data.severity);
    }

    const { data: alerts } = await query;
    const unreadCount = ((alerts || []) as any[]).filter((a) => a.status === "active").length;

    return { alerts: alerts || [], unreadCount };
  });

/** Mark alert as acknowledged */
export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ alertId: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await (supabase.from as any)("hunt_shield_alerts")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString() })
      .eq("id", data.alertId)
      .eq("user_id", userId);
    return { ok: true };
  });

/** Get user's watchlist */
export const getWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase.from as any)("user_watchlist")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    return { tokens: data || [] };
  });

/** Add token to watchlist */
export const addToWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      tokenAddress: z.string(),
      tokenName: z.string().optional(),
      tokenSymbol: z.string().optional(),
      chain: z.string(),
      imageUrl: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase.from as any)("user_watchlist").upsert(
      {
        user_id: userId,
        token_address: data.tokenAddress,
        token_name: data.tokenName,
        token_symbol: data.tokenSymbol,
        chain: data.chain,
        image_url: data.imageUrl,
        notes: data.notes,
      },
      { onConflict: "user_id,token_address,chain" },
    );
    return { ok: !error, error: error?.message ?? null };
  });

/** Remove token from watchlist */
export const removeFromWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ tokenAddress: z.string(), chain: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await (supabase.from as any)("user_watchlist")
      .delete()
      .eq("user_id", userId)
      .eq("token_address", data.tokenAddress)
      .eq("chain", data.chain);
    return { ok: true };
  });

/** Get user settings */
export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase.from as any)("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    // Return defaults if no settings row yet
    return (
      data ?? {
        default_chain: "solana",
        default_currency: "usd",
        alert_sound_enabled: true,
        alert_push_enabled: true,
        alert_telegram_enabled: false,
        scan_auto_save: true,
        compact_mode: false,
        language: "en",
        timezone: "UTC",
      }
    );
  });

/** Upsert user settings */
export const upsertUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      default_chain: z.string().optional(),
      default_currency: z.string().optional(),
      alert_sound_enabled: z.boolean().optional(),
      alert_push_enabled: z.boolean().optional(),
      alert_telegram_enabled: z.boolean().optional(),
      scan_auto_save: z.boolean().optional(),
      compact_mode: z.boolean().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase.from as any)("user_settings").upsert(
      { user_id: userId, ...data },
      { onConflict: "user_id" },
    );
    return { ok: !error };
  });
