// ============================================================================
// Trading Domain — Agent Gateway (barrel)
// ============================================================================

export type {
  OrderSide,
  OrderType,
  PositionSide,
  OrderRequest,
  OrderResult,
  Position,
  AccountBalance,
  Ticker,
  ExchangeAdapter,
  GatewayConfig,
  AccountSummary,
} from "./types";

export { AgentGateway } from "./agent-gateway";
export { getExchangeStatus, executeTrade } from "./functions";
export type { ExchangeStatus, ExecuteTradeResult } from "./functions";
