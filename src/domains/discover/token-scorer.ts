// ============================================================================
// VIXOR Discover — Token Scorer
// ============================================================================
//
// Scores and ranks discovered tokens based on liquidity, volume, momentum,
// and safety flags. Produces a 0-100 overall score with sub-scores.
//
// Pure functions — no side effects, no API calls.
// ============================================================================

import type { EnrichedToken } from "./discover-crypto-data";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TokenScore {
  token: EnrichedToken;
  overallScore: number; // 0-100
  liquidityScore: number;
  volumeScore: number;
  momentumScore: number;
  safetyFlags: string[];
}

export interface RankOptions {
  minScore?: number; // default: 30
  minLiquidityUsd?: number; // default: 10000
  maxResults?: number; // default: 20
}

// ── Liquidity scoring (0-40) ───────────────────────────────────────────────

function scoreLiquidity(liquidityUsd: number | null): number {
  const liq = liquidityUsd ?? 0;
  if (liq < 5_000) return 0;
  if (liq < 50_000) return 10;
  if (liq < 500_000) return 20;
  if (liq <= 5_000_000) return 30;
  return 40;
}

// ── Volume scoring (0-30) ──────────────────────────────────────────────────

function scoreVolume(volume24h: number | null): number {
  const vol = volume24h ?? 0;
  if (vol < 1_000) return 0;
  if (vol < 100_000) return 10;
  if (vol <= 1_000_000) return 20;
  return 30;
}

// ── Momentum scoring (0-30) ────────────────────────────────────────────────

function scoreMomentum(change24h: number | null): number {
  const change = change24h ?? 0;
  if (change > 50) return 30;
  if (change > 20) return 25;
  if (change > 10) return 20;
  if (change > 5) return 15;
  if (change > 0) return 10;
  return 5;
}

// ── Safety flags ────────────────────────────────────────────────────────────

function detectSafetyFlags(token: EnrichedToken): string[] {
  const flags: string[] = [];

  // Low liquidity: <$10k
  if ((token.liquidityUsd ?? 0) < 10_000) {
    flags.push("low_liquidity");
  }

  // New token: pair has very recent creation (we can't detect age directly,
  // but a token with zero history and no market cap is suspicious)
  // We flag tokens with no market cap data and very low liquidity
  if ((token.marketCap ?? 0) === 0 && (token.liquidityUsd ?? 0) < 50_000) {
    flags.push("new_token");
  }

  // High FDV-to-liquidity ratio: > 20x
  const liq = token.liquidityUsd ?? 0;
  const fdv = token.fdv ?? 0;
  if (liq > 0 && fdv > 0) {
    const ratio = fdv / liq;
    if (ratio > 20) {
      flags.push("high_fdv");
    }
  }

  return flags;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Score a discovered token based on multiple quality dimensions.
 * Scores 0-100, higher is better.
 */
export function scoreToken(token: EnrichedToken): TokenScore {
  const liquidityScore = scoreLiquidity(token.liquidityUsd);
  const volumeScore = scoreVolume(token.volume24h);
  const momentumScore = scoreMomentum(token.change24h);
  const safetyFlags = detectSafetyFlags(token);

  const overallScore = Math.min(liquidityScore + volumeScore + momentumScore, 100);

  return {
    token,
    overallScore,
    liquidityScore,
    volumeScore,
    momentumScore,
    safetyFlags,
  };
}

/**
 * Filter and rank tokens by minimum score threshold.
 * Returns tokens sorted by overallScore descending.
 */
export function rankTokens(tokens: EnrichedToken[], options?: RankOptions): TokenScore[] {
  const minScore = options?.minScore ?? 30;
  const minLiquidity = options?.minLiquidityUsd ?? 10_000;
  const maxResults = options?.maxResults ?? 20;

  const scored = tokens
    .map((token) => scoreToken(token))
    .filter((s) => s.overallScore >= minScore)
    .filter((s) => (s.token.liquidityUsd ?? 0) >= minLiquidity)
    .sort((a, b) => b.overallScore - a.overallScore);

  return scored.slice(0, maxResults);
}
