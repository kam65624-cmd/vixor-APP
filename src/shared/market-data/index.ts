// VIXOR Market Data — Unified Data Layer
// Source hierarchy: Binance WS > DexScreener > TwelveData > Finnhub > Cache

export { BinanceWS, type BinanceTickerPayload, type LivePrice } from "./binance-ws";
export {
  useLivePrices,
  type FeedStatus,
  type UseLivePricesReturn,
  type UseLivePricesOptions,
} from "./use-live-prices";
export {
  fetchFinnhubQuote,
  fetchFinnhubQuotes,
  getFinnhubQuoteCacheStats,
  type FinnhubQuote,
} from "./finnhub-quotes";
export { MarketDataGateway } from "./market-data-gateway";
export { useCentralMarketStream } from "./use-central-market-stream";
export type { CentralMarketSnapshot } from "./use-central-market-stream";
