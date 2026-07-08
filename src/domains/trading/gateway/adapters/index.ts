// ============================================================================
// Trading Domain — Exchange Adapters (barrel)
// ============================================================================

export { BinanceAdapter, createBinanceAdapter } from "./binance-adapter";
export { BybitAdapter, createBybitAdapter } from "./bybit-adapter";
export { OkxAdapter, createOkxAdapter } from "./okx-adapter";
export { DummyAdapter, createDummyAdapter } from "./dummy-adapter";
export { ExnessAdapter, createExnessAdapter, EXNESS_PAIRS } from "./exness-adapter";
export type { ExnessMtType } from "./exness-adapter";
export {
  CcxtGenericAdapter,
  createCcxtAdapter,
  CCXT_SUPPORTED_EXCHANGES,
} from "./ccxt-generic-adapter";
