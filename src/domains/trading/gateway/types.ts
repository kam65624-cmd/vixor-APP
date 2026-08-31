// ============================================================================
// Trading Domain — Agent Gateway Types
// ============================================================================
//
// Defines the abstraction layer between trading strategies and exchange
// connectivity. Strategies interact with the gateway; the gateway routes
// orders to the appropriate exchange adapter.
// ============================================================================

// ── Enumerations ──

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop_loss" | "take_profit";
export type PositionSide = "long" | "short";

// ── Order Types ──

/** Request to place an order on an exchange. */
export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  /** Required for limit orders. */
  price?: number;
  /** Required for stop-loss / stop orders. */
  stopPrice?: number;
  /** Optional take-profit price attached to the order. */
  takeProfit?: number;
  /** Optional stop-loss price attached to the order. */
  stopLoss?: number;
  /** Client-provided order ID for idempotency. */
  clientOrderId?: string;
}

/** Result returned after an order is placed or queried. */
export interface OrderResult {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  status: "filled" | "pending" | "rejected" | "canceled";
  /** ISO timestamp when the order was filled. */
  filledAt?: string;
  /** Trading fee in quote currency. */
  fee?: number;
}

// ── Position Types ──

/** An open position on an exchange. */
export interface Position {
  symbol: string;
  side: PositionSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  leverage: number;
}

// ── Account Types ──

/** Account balance and margin summary. */
export interface AccountBalance {
  totalBalance: number;
  availableBalance: number;
  unrealizedPnl: number;
  marginUsed: number;
  currency: string;
}

// ── Ticker ──

/** Best bid/ask/last prices for a symbol. */
export interface Ticker {
  bid: number;
  ask: number;
  last: number;
}

// ── Exchange Adapter Interface ──

/**
 * Contract that every exchange adapter must implement.
 * The Agent Gateway routes calls to the appropriate adapter based on config.
 */
export interface ExchangeAdapter {
  /** Human-readable adapter name (e.g. "Binance"). */
  readonly name: string;
  /** Unique adapter identifier (e.g. "binance"). */
  readonly id: string;

  // ── Account ──

  /** Fetch the current account balance and margin info. */
  getBalance(): Promise<AccountBalance>;

  // ── Orders ──

  /** Place a new order on the exchange. */
  placeOrder(request: OrderRequest): Promise<OrderResult>;
  /** Cancel an existing order by its exchange ID. */
  cancelOrder(orderId: string): Promise<boolean>;
  /** Get the current status of an existing order. */
  getOrderStatus(orderId: string): Promise<OrderResult | null>;

  // ── Positions ──

  /** Get all currently open positions. */
  getOpenPositions(): Promise<Position[]>;
  /** Close a position (or partially close if quantity is specified). */
  closePosition(symbol: string, quantity?: number): Promise<OrderResult>;

  // ── Market Data ──

  /** Get the current ticker (bid/ask/last) for a symbol. */
  getTicker(symbol: string): Promise<Ticker>;

  // ── Connection ──

  /** Whether the adapter is currently connected. */
  isConnected(): boolean;
  /** Establish a connection using the provided credentials. */
  connect(credentials: Record<string, string>): Promise<void>;
  /** Tear down the connection. */
  disconnect(): Promise<void>;
}

// ── Gateway Configuration ──

/** Configuration for the Agent Gateway. */
export interface GatewayConfig {
  /** Adapter id of the primary exchange to route orders to. */
  primaryExchange: string;
  /** Optional fallback adapter id if the primary fails. */
  fallbackExchange?: string;
  /** Maximum acceptable slippage in basis points. */
  maxSlippageBps: number;
  /** When true, orders are simulated without hitting real exchanges. */
  dryRun: boolean;
}

// ── Gateway Summary (returned by getAccountSummary) ──

/** Combined view of account state across all connected adapters. */
export interface AccountSummary {
  balance: AccountBalance;
  positions: Position[];
  totalUnrealizedPnl: number;
  connectedExchanges: string[];
}
