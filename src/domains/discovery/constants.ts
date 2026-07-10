/**
 * @module domains/discovery/constants
 * @description Constants used across the Discovery domain.
 * Includes scoring weights, thresholds, chain metadata, and default values.
 * Separated from config to prevent circular dependencies.
 */

import type { ScoringWeights, DiscoveryThresholds, DiscoveryChain } from "./types";

// ── Scoring Weights ─────────────────────────────────────────────────────────

/** Default scoring weights: 40% SM + 30% social + 20% liq + 10% age. */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  smartMoney: 0.4,
  social: 0.3,
  liquidity: 0.2,
  age: 0.1,
};

// ── Discovery Thresholds ────────────────────────────────────────────────────

/** Default thresholds for the 5-stage discovery pipeline. */
export const DEFAULT_THRESHOLDS: DiscoveryThresholds = {
  /** Stage 2: minimum $1K liquidity to pass liquidity filter (relaxed for coverage). */
  minLiquidity: 1_000,
  /** Minimum $100 24h volume (relaxed — frontend filters handle stricter thresholds). */
  minVolume24h: 100,
  /** Max 72 hours to be considered a "new pair". */
  maxNewAgeHours: 72,
  /** Minimum combined score for "trending" status. */
  minTrendingScore: 50,
  /** At least 3 smart money holders for high-confidence signals. */
  minSmartMoneyHolders: 3,
};

// ── Chain Metadata ──────────────────────────────────────────────────────────

/** Chain display names and short identifiers. */
export const CHAIN_META: Record<DiscoveryChain, { label: string; short: string; color: string }> = {
  solana: { label: "Solana", short: "SOL", color: "#9945FF" },
  ethereum: { label: "Ethereum", short: "ETH", color: "#627EEA" },
  base: { label: "Base", short: "BASE", color: "#0052FF" },
  arbitrum: { label: "Arbitrum", short: "ARB", color: "#28A0F0" },
  polygon: { label: "Polygon", short: "POL", color: "#8247E5" },
  bsc: { label: "BNB Chain", short: "BSC", color: "#F3BA2F" },
  avalanche: { label: "Avalanche", short: "AVAX", color: "#E84142" },
};

/** All supported chains as an array. */
export const ALL_CHAINS: DiscoveryChain[] = ["solana", "ethereum", "base", "arbitrum", "polygon", "bsc", "avalanche"];

// ── Risk Thresholds ──────────────────────────────────────────────────────────

/** Score thresholds for risk level assignment. */
export const RISK_THRESHOLDS = {
  /** Score >= 70 is low risk. */
  low: 70,
  /** Score >= 40 is medium risk, below 40 is high risk. */
  medium: 40,
} as const;

// ── Cache TTL ────────────────────────────────────────────────────────────────

/** Cache TTL values in milliseconds. */
export const CACHE_TTL_MS = {
  /** Price data: 30 seconds. */
  price: 30_000,
  /** Social data: 5 minutes. */
  social: 300_000,
  /** Smart money data: 2 minutes. */
  smartMoney: 120_000,
  /** Full discovery result: 30 seconds. */
  discovery: 30_000,
} as const;

// ── API Rate Limits ─────────────────────────────────────────────────────────

/** Per-minute rate limits for external APIs (conservative). */
export const API_RATE_LIMITS = {
  /** Birdeye: 60 req/min on free tier. */
  birdeye: 60,
  /** Helius: 120 req/min on dev tier. */
  helius: 120,
  /** Twitter v2: 300 req/min on basic tier. */
  twitter: 300,
  /** LunarCrush: 30 req/min on free tier. */
  lunarcrush: 30,
  /** DexScreener: 300 req/min (undocumented). */
  dexscreener: 300,
} as const;

// ── Scoring Constants ────────────────────────────────────────────────────────

/** Scoring helper values. */
export const SCORING = {
  /** Maximum score for any individual metric. */
  maxScore: 100,
  /** Minimum score for any individual metric. */
  minScore: 0,
  /** Score given to tokens without smart money data (neutral baseline). */
  noDataSmartMoney: 30,
  /** Score given to tokens without social data (neutral baseline). */
  noDataSocial: 25,
  /** Score given to tokens without age data. */
  noDataAge: 50,
  /** Log base for normalizing large numbers (ln). */
  logBase: Math.E,
  /** Reference liquidity for normalization ($1M). */
  refLiquidity: 1_000_000,
  /** Reference volume for normalization ($100K). */
  refVolume: 100_000,
} as const;
