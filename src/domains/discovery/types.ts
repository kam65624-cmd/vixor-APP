/**
 * @module domains/discovery/types
 * @description Type definitions for the Memecoin Discovery domain.
 * Covers token data, social signals, scoring, and API client responses.
 */

// ── Token Core ───────────────────────────────────────────────────────────────

/** Supported blockchain networks for token discovery. */
export type DiscoveryChain = "solana" | "ethereum" | "base" | "arbitrum" | "polygon";

/** Risk level assigned by VIXOR AI to a discovered token. */
export type RiskLevel = "low" | "medium" | "high";

/** NFT badge state for token verification. */
export type NftBadgeState = "none" | "nft" | "collection" | "verified";

/** Raw token data from any source API before scoring. */
export interface RawTokenData {
  /** Token mint address or contract address. */
  address: string;
  /** Token symbol (e.g., "PEPE", "DOGE"). */
  symbol: string;
  /** Full token name. */
  name: string;
  /** Current price in USD. */
  price: number;
  /** 24-hour price change percentage. */
  change24h: number;
  /** 24-hour trading volume in USD. */
  volume24h: number;
  /** Total liquidity in USD across all DEX pairs. */
  liquidity: number;
  /** Market capitalization in USD. */
  marketCap: number;
  /** Blockchain network. */
  chain: DiscoveryChain;
  /** Token creation timestamp (ISO 8601 or epoch ms). */
  createdAt: string | number;
  /** DexScreener pair URL or identifier. */
  pairIdentifier?: string;
  /** Token logo URL. */
  logoUrl?: string;
  /** Decimals for the token. */
  decimals?: number;
}

/** Enriched token data after all scoring stages. */
export interface ScoredToken extends RawTokenData {
  /** Unique discovery ID (UUID). */
  id?: string;
  /** Combined VIXOR discovery score (0–100). */
  discoveryScore: number;
  /** Smart money score (0–100). */
  smartMoneyScore: number;
  /** Social velocity score (0–100). */
  socialScore: number;
  /** Liquidity health score (0–100). */
  liquidityScore: number;
  /** Age score based on token maturity (0–100). */
  ageScore: number;
  /** VIXOR AI risk assessment. */
  riskLevel: RiskLevel;
  /** NFT badge state. */
  nftBadge: NftBadgeState;
  /** Number of smart money holders. */
  smartMoneyHolders?: number;
  /** Social mentions count (24h). */
  socialMentions?: number;
  /** Social sentiment (-1 to 1). */
  socialSentiment?: number;
  /** Liquidity lock percentage (0–100). */
  liquidityLockedPct?: number;
  /** Is honeypot detected. */
  isHoneypot?: boolean;
  /** Top holder concentration percentage. */
  topHolderPct?: number;
  /** Last scan timestamp (ISO 8601). */
  scannedAt?: string;
}

// ── Social Signals ───────────────────────────────────────────────────────────

/** Social signal from any social source. */
export interface SocialSignal {
  /** Source platform. */
  source: "twitter" | "telegram" | "reddit" | "lunarcrush";
  /** Token symbol the signal is about. */
  tokenSymbol: string;
  /** Mention count in the period. */
  mentions: number;
  /** Sentiment score (-1 to 1). */
  sentiment: number;
  /** Engagement metrics (likes + retweets + replies). */
  engagement: number;
  /** Influencer score (0–100, higher = more influential accounts mentioned). */
  influencerScore: number;
  /** Time window start (ISO 8601). */
  windowStart: string;
  /** Time window end (ISO 8601). */
  windowEnd: string;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

/** Scoring weights for the 5-stage algorithm. */
export interface ScoringWeights {
  /** Weight for smart money score (default 0.40). */
  smartMoney: number;
  /** Weight for social velocity score (default 0.30). */
  social: number;
  /** Weight for liquidity health score (default 0.20). */
  liquidity: number;
  /** Weight for token age score (default 0.10). */
  age: number;
}

/** Thresholds for filtering tokens at each stage. */
export interface DiscoveryThresholds {
  /** Minimum liquidity in USD to pass Stage 2 (default $10,000). */
  minLiquidity: number;
  /** Minimum volume 24h in USD (default $1,000). */
  minVolume24h: number;
  /** Maximum age in hours to be considered "new" (default 72). */
  maxNewAgeHours: number;
  /** Minimum score to appear in "trending" (default 50). */
  minTrendingScore: number;
  /** Minimum smart money holders for high confidence (default 3). */
  minSmartMoneyHolders: number;
}

// ── API Client Types ─────────────────────────────────────────────────────────

/** Generic API client response wrapper. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  cacheTtl?: number;
  responseTimeMs?: number;
}

/** Filter parameters for discovery queries. */
export interface DiscoveryFilterParams {
  chains?: DiscoveryChain[];
  minLiquidity?: number;
  maxLiquidity?: number;
  minVolume24h?: number;
  minMarketCap?: number;
  sortBy?: "trending" | "volume" | "change" | "liquidity" | "smart";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  search?: string;
}

/** Result from a discovery scan. */
export interface DiscoveryScanResult {
  tokens: ScoredToken[];
  totalFound: number;
  filteredOut: number;
  scanDurationMs: number;
  scanTimestamp: string;
}

// ── Cached Discovery Record (DB) ───────────────────────────────────────────

/** Shape of a memecoin_discoveries row. */
export interface MemecoinDiscoveryRow {
  id: string;
  user_id?: string;
  token_address: string;
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  liquidity: number;
  market_cap: number;
  discovery_score: number;
  smart_money_score: number;
  social_score: number;
  liquidity_score: number;
  age_score: number;
  risk_level: string;
  nft_badge: string;
  raw_data: Record<string, unknown>;
  scanned_at: string;
  created_at: string;
  updated_at: string;
}

/** Shape of a social_signals row. */
export interface SocialSignalRow {
  id: string;
  token_symbol: string;
  source: string;
  mentions: number;
  sentiment: number;
  engagement: number;
  influencer_score: number;
  window_start: string;
  window_end: string;
  created_at: string;
}
