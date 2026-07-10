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
  PriceResolver,
  getSourceConfidence,
  binanceWsToCandidate,
  serverPriceToCandidate,
  type PriceSource,
  type ResolvedPrice,
} from "./price-resolver";
export {
  fetchFinnhubQuote,
  fetchFinnhubQuotes,
  getFinnhubQuoteCacheStats,
  type FinnhubQuote,
} from "./finnhub-quotes";
export {
  getSolanaBalance,
  getTokenAccounts,
  getFullTokenBalances,
  getBlockHeight,
  getHealth,
  type SolanaBalance,
  type SplTokenBalance,
  type HeliusTokenAccounts,
} from "./helius-rpc";
export {
  getNativeBalance,
  getErc20Balance,
  getGasPrice,
  getBlockNumber,
  getChainConfigs,
  type EvmChain,
  type EvmNativeBalance,
  type Erc20TokenBalance,
  type EvmChainConfig,
} from "./alchemy-rpc";
