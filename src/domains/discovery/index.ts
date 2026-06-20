/**
 * @module domains/discovery
 * @description Memecoin Discovery domain — barrel export.
 * Provides token discovery, scoring, and social signal aggregation.
 *
 * IMPORTANT: Server-only functions (scanDiscovery, searchTokens, getDiscoveryConfig,
 * loadDiscoveryConfig) are NOT exported here. Import them from "./server.ts" instead.
 */

export type {
  DiscoveryChain,
  RiskLevel,
  NftBadgeState,
  RawTokenData,
  ScoredToken,
  SocialSignal,
  ScoringWeights,
  DiscoveryThresholds,
  ApiResponse,
  DiscoveryFilterParams,
  DiscoveryScanResult,
  MemecoinDiscoveryRow,
  SocialSignalRow,
} from "./types";

export { invalidateDiscoveryConfig } from "./config";
export {
  runDiscoveryPipeline,
  stage1_filterNewPairs,
  stage2_liquidityFilter,
  stage3_smartMoneyScore,
  stage4_socialVelocityScore,
  stage5_combinedScore,
  calculateLiquidityScore,
  calculateAgeScore,
  classifyRisk,
  determineNftBadge,
} from "./scoring";
export {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_THRESHOLDS,
  CHAIN_META,
  ALL_CHAINS,
  RISK_THRESHOLDS,
  CACHE_TTL_MS,
  API_RATE_LIMITS,
  SCORING,
} from "./constants";
