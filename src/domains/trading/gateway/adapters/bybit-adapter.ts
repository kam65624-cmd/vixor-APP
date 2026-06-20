// ============================================================================
// Bybit Exchange Adapter (Stub)
// ============================================================================
//
// Implements ExchangeAdapter for Bybit.
// All methods currently return mock data and log calls.
//
// TODO: implement real Bybit API calls
//   - REST: https://api.bybit.com
//   - Testnet: https://api-testnet.bybit.com
//   - WebSocket: wss://stream.bybit.com/v5/public/spot
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

// ── Bybit API constants ──

const BYBIT_REST_URL = "https://api.bybit.com";
const BYBIT_TESTNET_URL = "https://api-testnet.bybit.com";
const BYBIT_WS_URL = "wss://stream.bybit.com/v5/public/spot";

// ── Bybit Adapter ──

/**
 * Stub adapter for Bybit exchange.
 * All methods log the call and return deterministic mock data.
 */
export class BybitAdapter implements ExchangeAdapter {
  readonly name = "Bybit";
  readonly id = "bybit";

  private credentials: Record<string, string> = {};
  private connected = false;

  constructor(credentials?: Record<string, string>) {
    if (credentials) {
      this.credentials = credentials;
    }
  }

  // ── Account ──

  /** Fetch account balance. Returns mock data. */
  async getBalance(): Promise<AccountBalance> {
    this.requireConnected();
    console.log(`[BybitAdapter] getBalance() called`);
    // TODO: implement real Bybit API call — GET /v5/account/wallet-balance
    return {
      totalBalance: 10000,
      availableBalance: 8200,
      unrealizedPnl: -80,
      marginUsed: 1800,
      currency: "USDT",
    };
  }

  // ── Orders ──

  /** Place an order. Returns mock filled result. */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();
    console.log(`[BybitAdapter] placeOrder() called`, request);
    // TODO: implement real Bybit API call — POST /v5/order/create
    return {
      id: `bybit-${Date.now()}`,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: request.price ?? 0,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: request.quantity * 0.0006,
    };
  }

  /** Cancel an order. Returns mock success. */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();
    console.log(`[BybitAdapter] cancelOrder(${orderId}) called`);
    // TODO: implement real Bybit API call — POST /v5/order/cancel
    return true;
  }

  /** Get order status. Returns mock result. */
  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();
    console.log(`[BybitAdapter] getOrderStatus(${orderId}) called`);
    // TODO: implement real Bybit API call — GET /v5/order/realtime
    return {
      id: orderId,
      symbol: "BTCUSDT",
      side: "buy",
      type: "market",
      quantity: 0,
      price: 0,
      status: "filled",
      filledAt: new Date().toISOString(),
    };
  }

  // ── Positions ──

  /** Get open positions. Returns empty array (mock). */
  async getOpenPositions(): Promise<Position[]> {
    this.requireConnected();
    console.log(`[BybitAdapter] getOpenPositions() called`);
    // TODO: implement real Bybit API call — GET /v5/position/list
    return [];
  }

  /** Close a position. Returns mock filled result. */
  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    this.requireConnected();
    console.log(`[BybitAdapter] closePosition(${symbol}, ${quantity}) called`);
    // TODO: implement real Bybit API call
    return {
      id: `bybit-close-${Date.now()}`,
      symbol,
      side: "sell",
      type: "market",
      quantity: quantity ?? 0,
      price: 0,
      status: "filled",
      filledAt: new Date().toISOString(),
    };
  }

  // ── Market Data ──

  /** Get ticker. Returns mock data. */
  async getTicker(symbol: string): Promise<Ticker> {
    console.log(`[BybitAdapter] getTicker(${symbol}) called`);
    // TODO: implement real Bybit API call — GET /v5/market/tickers
    const basePrice = 50000;
    return {
      bid: basePrice - 5,
      ask: basePrice + 5,
      last: basePrice,
    };
  }

  // ── Connection ──

  isConnected(): boolean {
    return this.connected;
  }

  /** Throws if the adapter is not connected. */
  private requireConnected(): void {
    if (!this.connected) {
      throw new Error(`[BybitAdapter] Not connected. Call connect() first.`);
    }
  }

  async connect(credentials: Record<string, string>): Promise<void> {
    this.credentials = credentials;
    console.log(`[BybitAdapter] connect() called — ${BYBIT_REST_URL}`);
    // TODO: implement real Bybit connectivity test — GET /v5/market/time
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log(`[BybitAdapter] disconnect() called`);
  }
}

// ── Factory ──

/**
 * Create a Bybit adapter with optional credentials.
 *
 * @param credentials - `{ apiKey: string, apiSecret: string }`
 */
export function createBybitAdapter(credentials?: Record<string, string>): BybitAdapter {
  return new BybitAdapter(credentials);
}
