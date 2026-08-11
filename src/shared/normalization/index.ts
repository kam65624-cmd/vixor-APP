// ============================================================================
// VIXOR V2 — Normalization Layer — Public API
// ============================================================================

export type {
  AssetId,
  CanonicalQuote,
  CanonicalCandle,
  CanonicalOrderBook,
  OrderBookEntry,
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
  normalizeBinanceOrderBook,
  normalizeBinanceKline,
  normalizeFinnhubQuote,
  normalizeDexScreenerToken,
  normalizeTwelveDataQuote,
  checkFreshness,
  formatFreshness,
} from "./normalizers";

export { ProviderRegistry } from "./provider-registry";
