// ============================================================================
// Market Domain — Barrel Export
// ============================================================================

// Server functions
export * from "./functions";

// Types
export type {
  MarketNewsItem,
  MarketPriceItem,
  PriceResult,
  KlineBar,
  EconomicEvent,
  OHLCVData,
} from "./types";

// Server modules (for direct import by other server code)
export { fetchPrice, fetchPrices, fetchBinanceKlines, fetchTwelveDataKlines, POPULAR_PAIRS } from "./server/price-fetcher";
export { fetchEconomicCalendar, COUNTRY_FLAGS } from "./server/economic-calendar";
