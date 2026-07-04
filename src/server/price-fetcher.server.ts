// Backward-compatible re-export — actual code moved to @/domains/market/server/price-fetcher
export { fetchPrice, fetchPrices, fetchBinanceKlines, fetchTwelveDataKlines, POPULAR_PAIRS } from "@/domains/market/server/price-fetcher";
export type { PriceResult, KlineBar } from "@/domains/market/server/price-fetcher";
