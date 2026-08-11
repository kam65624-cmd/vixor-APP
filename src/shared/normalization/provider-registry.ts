// ============================================================================
// VIXOR V2 — Provider Adapter Registry
// ============================================================================
//
// Maps PriceSource to its normalizer function, enabling the system to normalize
// any provider response generically.
//
// Usage:
//   const result = ProviderRegistry.normalize('binance', 'quote', rawBinancePayload);
//   if (result.ok) { console.log(result.data.pair, result.data.price); }
//
// ============================================================================

import type {
  CanonicalQuote,
  CanonicalOrderBook,
  NormalizationResponse,
  PriceSource,
} from "./types";
import {
  normalizeBinanceTicker,
  normalizeBinanceOrderBook,
  normalizeFinnhubQuote,
  normalizeDexScreenerToken,
  normalizeTwelveDataQuote,
} from "./normalizers";

/** Discriminated normalizer type for 'quote' normalization */
type QuoteNormalizer = (payload: unknown) => NormalizationResponse<CanonicalQuote>;
/** Discriminated normalizer type for 'orderbook' normalization */
type OrderBookNormalizer = (payload: unknown) => NormalizationResponse<CanonicalOrderBook>;

/** Map of source → normalizer functions by type */
interface NormalizerEntry {
  quote?: QuoteNormalizer;
  orderbook?: OrderBookNormalizer;
}

/**
 * ProviderRegistry — Static registry mapping PriceSource to normalizer functions.
 *
 * Each provider registers normalizers for specific data types (currently 'quote').
 * The registry is immutable after construction — no dynamic registration at runtime.
 */
export class ProviderRegistry {
  private static readonly registry: Map<PriceSource, NormalizerEntry> = new Map([
    [
      "binance",
      {
        quote: (payload: unknown) =>
          normalizeBinanceTicker(payload as Parameters<typeof normalizeBinanceTicker>[0]),
        orderbook: (payload: unknown) =>
          normalizeBinanceOrderBook(payload as Parameters<typeof normalizeBinanceOrderBook>[0]),
      },
    ],
    [
      "finnhub",
      {
        quote: (payload: unknown) =>
          normalizeFinnhubQuote(payload as Parameters<typeof normalizeFinnhubQuote>[0]),
      },
    ],
    [
      "dexscreener",
      {
        quote: (payload: unknown) =>
          normalizeDexScreenerToken(payload as Parameters<typeof normalizeDexScreenerToken>[0]),
      },
    ],
    [
      "twelvedata",
      {
        quote: (payload: unknown) =>
          normalizeTwelveDataQuote(payload as Parameters<typeof normalizeTwelveDataQuote>[0]),
      },
    ],
  ]);

  /**
   * Normalize a provider payload into a canonical type.
   *
   * @param source  The price source provider name
   * @param type    The data type to normalize (currently 'quote')
   * @param payload The raw provider response
   * @returns NormalizationResponse with canonical data or error
   */
  static normalize(
    source: PriceSource,
    type: "quote",
    payload: unknown,
  ): NormalizationResponse<CanonicalQuote>;
  static normalize(
    source: PriceSource,
    type: "orderbook",
    payload: unknown,
  ): NormalizationResponse<CanonicalOrderBook>;
  static normalize(
    source: PriceSource,
    type: "quote" | "orderbook",
    payload: unknown,
  ): NormalizationResponse<CanonicalQuote | CanonicalOrderBook> {
    const entry = ProviderRegistry.registry.get(source);
    if (!entry) {
      return {
        ok: false,
        error: `No normalizer registered for source: ${source}`,
        code: "PROVIDER_ERROR",
        source,
      };
    }

    const normalizer = type === "quote" ? entry.quote : entry.orderbook;
    if (!normalizer) {
      return {
        ok: false,
        error: `No ${type} normalizer registered for source: ${source}`,
        code: "PROVIDER_ERROR",
        source,
      };
    }

    return normalizer(payload);
  }

  /**
   * Get all registered price sources.
   */
  static getRegisteredSources(): PriceSource[] {
    return Array.from(ProviderRegistry.registry.keys());
  }

  /**
   * Check if a source has any normalizer registered.
   */
  static isRegistered(source: PriceSource): boolean {
    return ProviderRegistry.registry.has(source);
  }
}
