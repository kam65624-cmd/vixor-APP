// ============================================================================
// VIXOR V2 — Normalization Layer — Public API
// ============================================================================

export type {
  AssetId,
  CanonicalQuote,
  CanonicalCandle,
  MarketSnapshot,
  Freshness,
  FreshnessCheck,
  ProviderHealthStatus,
  ProviderHealth,
  NormalizationResult,
  NormalizationError,
  NormalizationResponse,
  PriceSource,
} from "./types";

export {
  normalizePair,
  normalizeBinanceTicker,
  normalizeFinnhubQuote,
  normalizeDexScreenerToken,
  checkFreshness,
  formatFreshness,
} from "./normalizers";
