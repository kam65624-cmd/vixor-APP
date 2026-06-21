/**
 * @module domains/discovery/scoring
 * @description 5-stage Memecoin Discovery scoring algorithm.
 *
 * Pipeline:
 *   Stage 1 — New Pairs: Ingest from DexScreener (latest pairs)
 *   Stage 2 — Liquidity Filter: min $10K liquidity
 *   Stage 3 — Smart Money Rank: Helius smart wallet tracking (0–100)
 *   Stage 4 — Social Velocity: Twitter mentions + LunarCrush sentiment (0–100)
 *   Stage 5 — Final Score: weighted = 40% SM + 30% social + 20% liq + 10% age
 *
 * Risk classification:
 *   high  — score < 40  OR honeypot detected
 *   medium — score 40–69
 *   low  — score >= 70  AND no honeypot
 */

import type {
  RawTokenData,
  ScoredToken,
  ScoringWeights,
  DiscoveryThresholds,
  RiskLevel,
  NftBadgeState,
} from "./types";
import { DEFAULT_SCORING_WEIGHTS, DEFAULT_THRESHOLDS, RISK_THRESHOLDS, SCORING } from "./constants";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Clamps a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates the age of a token in hours from its creation timestamp.
 * Accepts ISO 8601 strings or epoch milliseconds.
 */
function tokenAgeHours(createdAt: string | number): number {
  const created = typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt;
  if (Number.isNaN(created)) return -1; // invalid date → treat as "just created" in caller
  return (Date.now() - created) / (1000 * 60 * 60);
}

/**
 * Normalizes a value using log scale with a reference value.
 * Score 0–100 where reference = ~50.
 */
function logNormalize(value: number, refValue: number): number {
  if (value <= 0) return 0;
  const raw = (Math.log(value) / Math.log(refValue)) * 50;
  return clamp(raw, SCORING.minScore, SCORING.maxScore);
}

// ── Stage 1: New Pairs (Raw Ingestion) ─────────────────────────────────────

/**
 * Stage 1 — Validate and normalize raw token data.
 * Filters out obviously invalid entries (zero price, missing address).
 *
 * @param tokens - Raw token data from DexScreener/Birdeye.
 * @returns Filtered array of valid raw tokens.
 */
export function stage1_filterNewPairs(tokens: RawTokenData[]): RawTokenData[] {
  return tokens.filter((t) => {
    if (!t.address || t.address.length < 10) return false;
    if (!t.symbol || t.symbol.trim().length === 0) return false;
    if (t.price < 0) return false;
    if (!t.chain) return false;
    return true;
  });
}

// ── Stage 2: Liquidity Filter ───────────────────────────────────────────────

/**
 * Stage 2 — Filter tokens by minimum liquidity threshold.
 * Tokens below the threshold are removed from the pipeline.
 *
 * @param tokens - Validated tokens from Stage 1.
 * @param thresholds - Discovery thresholds (uses default if not provided).
 * @returns Tokens that pass the liquidity filter.
 */
export function stage2_liquidityFilter(
  tokens: RawTokenData[],
  thresholds?: Partial<DiscoveryThresholds>,
): RawTokenData[] {
  const minLiq = thresholds?.minLiquidity ?? DEFAULT_THRESHOLDS.minLiquidity;
  const minVol = thresholds?.minVolume24h ?? DEFAULT_THRESHOLDS.minVolume24h;

  return tokens.filter((t) => t.liquidity >= minLiq && t.volume24h >= minVol);
}

// ── Stage 3: Smart Money Score ──────────────────────────────────────────────

/**
 * Stage 3 — Calculate smart money score (0–100).
 *
 * Higher score = more smart money wallets are holding.
 * Uses a log-normalized scale: 1 holder → ~20, 10 holders → ~50, 100 → ~80.
 *
 * @param holderCount - Number of known smart money wallets holding this token.
 * @returns Score from 0 to 100.
 */
export function stage3_smartMoneyScore(holderCount: number): number {
  if (holderCount <= 0) return SCORING.noDataSmartMoney;
  return clamp(
    logNormalize(holderCount, 5) * 1.2, // scale factor to boost SM importance
    SCORING.minScore,
    SCORING.maxScore,
  );
}

// ── Stage 4: Social Velocity Score ────────────────────────────────────────────

/**
 * Stage 4 — Calculate social velocity score (0–100).
 *
 * Combines mention count (volume) with sentiment (direction).
 * A token with many mentions but negative sentiment gets a lower score.
 *
 * @param mentions - Number of social mentions in the last 24 hours.
 * @param sentiment - Sentiment score (-1 to 1, where 1 = very positive).
 * @returns Score from 0 to 100.
 */
export function stage4_socialVelocityScore(mentions: number, sentiment: number): number {
  if (mentions <= 0) return SCORING.noDataSocial;

  const volumeScore = logNormalize(mentions, 50);
  const sentimentMultiplier = 0.5 + (sentiment + 1) / 4; // maps -1→0.0, 0→0.5, 1→1.0
  const raw = volumeScore * sentimentMultiplier;

  return clamp(raw, SCORING.minScore, SCORING.maxScore);
}

// ── Stage 5: Combined Score ─────────────────────────────────────────────────

/**
 * Stage 5 — Calculate the final discovery score.
 *
 * Formula: score = (smartMoney * w.SM) + (social * w.social) + (liquidity * w.liq) + (age * w.age)
 * Default weights: 40% SM + 30% social + 20% liq + 10% age
 *
 * @param smartMoneyScore - Score from Stage 3 (0–100).
 * @param socialScore - Score from Stage 4 (0–100).
 * @param liquidityScore - Liquidity health score (0–100).
 * @param ageScore - Token age score (0–100, newer = higher).
 * @param weights - Scoring weights (uses default if not provided).
 * @returns Combined discovery score (0–100).
 */
export function stage5_combinedScore(
  smartMoneyScore: number,
  socialScore: number,
  liquidityScore: number,
  ageScore: number,
  weights?: Partial<ScoringWeights>,
): number {
  const w = { ...DEFAULT_SCORING_WEIGHTS, ...weights };

  // Validate weights sum to 1.0 (allow small floating point tolerance)
  const total = w.smartMoney + w.social + w.liquidity + w.age;
  const normalized =
    Math.abs(total - 1.0) < 0.01
      ? w
      : {
          smartMoney: w.smartMoney / total,
          social: w.social / total,
          liquidity: w.liquidity / total,
          age: w.age / total,
        };

  const score =
    smartMoneyScore * normalized.smartMoney +
    socialScore * normalized.social +
    liquidityScore * normalized.liquidity +
    ageScore * normalized.age;

  return Math.round(clamp(score, SCORING.minScore, SCORING.maxScore));
}

// ── Liquidity Health Score ───────────────────────────────────────────────────

/**
 * Calculates liquidity health score (0–100).
 *
 * Factors: total liquidity (log-normalized) + lock percentage + top holder concentration.
 * High concentration = lower score (centralization risk).
 *
 * @param liquidity - Total liquidity in USD.
 * @param lockedPct - Percentage of liquidity that is locked (0–100).
 * @param topHolderPct - Percentage held by top 10 holders (0–100).
 * @returns Liquidity health score from 0 to 100.
 */
export function calculateLiquidityScore(
  liquidity: number,
  lockedPct: number = 0,
  topHolderPct: number = 50,
): number {
  const liquidityValue = logNormalize(liquidity, SCORING.refLiquidity);
  const lockBonus = (lockedPct / 100) * 20; // up to +20 for full lock
  const concentrationPenalty = topHolderPct > 80 ? (topHolderPct - 80) * 1.5 : 0; // penalize > 80%

  return clamp(
    liquidityValue + lockBonus - concentrationPenalty,
    SCORING.minScore,
    SCORING.maxScore,
  );
}

// ── Age Score ────────────────────────────────────────────────────────────────

/**
 * Calculates age score (0–100).
 *
 * Newer tokens score higher (they are fresh opportunities).
 * Max score at 0 hours, decays linearly to 0 at maxAgeHours.
 *
 * @param createdAt - Token creation timestamp (ISO string or epoch ms).
 * @param maxAgeHours - Maximum age in hours for scoring (default 72).
 * @returns Age score from 0 to 100.
 */
export function calculateAgeScore(
  createdAt: string | number,
  maxAgeHours: number = DEFAULT_THRESHOLDS.maxNewAgeHours,
): number {
  const age = tokenAgeHours(createdAt);
  if (age <= 0) return SCORING.maxScore; // just created
  if (age >= maxAgeHours) return 0; // too old to be "new"
  return Math.round(((maxAgeHours - age) / maxAgeHours) * SCORING.maxScore);
}

// ── Risk Classification ─────────────────────────────────────────────────────

/**
 * Classifies a token's risk level based on discovery score and safety flags.
 *
 * @param discoveryScore - Combined discovery score (0–100).
 * @param isHoneypot - Whether the token is flagged as a honeypot.
 * @param topHolderPct - Top holder concentration (0–100).
 * @returns Risk level: "low", "medium", or "high".
 */
export function classifyRisk(
  discoveryScore: number,
  isHoneypot: boolean = false,
  topHolderPct: number = 50,
): RiskLevel {
  // Automatic high risk for honeypots
  if (isHoneypot) return "high";

  // High concentration is always at least "medium"
  if (topHolderPct > 90 && discoveryScore < RISK_THRESHOLDS.low) {
    return "high";
  }

  if (discoveryScore >= RISK_THRESHOLDS.low) return "low";
  if (discoveryScore >= RISK_THRESHOLDS.medium) return "medium";
  return "high";
}

// ── NFT Badge ────────────────────────────────────────────────────────────────

/**
 * Determines NFT badge state based on available metadata.
 *
 * @param hasNft - Token has associated NFT collection.
 * @param isVerified - Collection is verified by the platform.
 * @returns NFT badge state.
 */
export function determineNftBadge(
  hasNft: boolean = false,
  isVerified: boolean = false,
): NftBadgeState {
  if (isVerified) return "verified";
  if (hasNft) return "collection";
  return "none";
}

// ── Full Pipeline ────────────────────────────────────────────────────────────

/**
 * Runs the complete 5-stage discovery pipeline on a batch of raw tokens.
 *
 * @param rawTokens - Raw token data from DexScreener/Birdeye APIs.
 * @param smartMoneyMap - Map of token address → smart money holder count.
 * @param socialMap - Map of token symbol → { mentions, sentiment }.
 * @param options - Optional overrides for thresholds, weights, and safety data.
 * @returns Scored tokens sorted by discovery score (descending).
 */
export function runDiscoveryPipeline(
  rawTokens: RawTokenData[],
  smartMoneyMap: Map<string, number> = new Map(),
  socialMap: Map<string, { mentions: number; sentiment: number }> = new Map(),
  options?: {
    thresholds?: Partial<DiscoveryThresholds>;
    weights?: Partial<ScoringWeights>;
    honeypotSet?: Set<string>;
    topHolderMap?: Map<string, number>;
    lockedLiqMap?: Map<string, number>;
    nftMap?: Map<string, { hasNft: boolean; isVerified: boolean }>;
  },
): ScoredToken[] {
  // Stage 1: Filter invalid data
  const validTokens = stage1_filterNewPairs(rawTokens);

  // Stage 2: Liquidity filter
  const liquidTokens = stage2_liquidityFilter(validTokens, options?.thresholds);

  // Stages 3–5: Score each token
  const scored: ScoredToken[] = liquidTokens.map((token) => {
    // Stage 3: Smart Money
    const smHolders = smartMoneyMap.get(token.address) ?? 0;
    const smScore = stage3_smartMoneyScore(smHolders);

    // Stage 4: Social Velocity
    const social = socialMap.get(token.symbol) ?? {
      mentions: 0,
      sentiment: 0,
    };
    const socialScore = stage4_socialVelocityScore(social.mentions, social.sentiment);

    // Liquidity Health Score
    const lockedPct = options?.lockedLiqMap?.get(token.address) ?? 0;
    const topHolderPct = options?.topHolderMap?.get(token.address) ?? 50;
    const liqScore = calculateLiquidityScore(token.liquidity, lockedPct, topHolderPct);

    // Age Score
    const maxAge = options?.thresholds?.maxNewAgeHours;
    const ageScore = calculateAgeScore(token.createdAt, maxAge);

    // Stage 5: Combined Score
    const discoveryScore = stage5_combinedScore(
      smScore,
      socialScore,
      liqScore,
      ageScore,
      options?.weights,
    );

    // Risk + NFT Badge
    const isHoneypot = options?.honeypotSet?.has(token.address) ?? false;
    const riskLevel = classifyRisk(discoveryScore, isHoneypot, topHolderPct);
    const nftMeta = options?.nftMap?.get(token.address) ?? {
      hasNft: false,
      isVerified: false,
    };
    const nftBadge = determineNftBadge(nftMeta.hasNft, nftMeta.isVerified);

    return {
      ...token,
      discoveryScore,
      smartMoneyScore: smScore,
      socialScore,
      liquidityScore: liqScore,
      ageScore,
      riskLevel,
      nftBadge,
      smartMoneyHolders: smHolders,
      socialMentions: social.mentions,
      socialSentiment: social.sentiment,
      liquidityLockedPct: lockedPct,
      isHoneypot,
      topHolderPct,
      scannedAt: new Date().toISOString(),
    };
  });

  // Sort by discovery score descending
  scored.sort((a, b) => b.discoveryScore - a.discoveryScore);

  return scored;
}
