// ============================================================================
// OKX Exchange Adapter (Stub)
// ============================================================================
//
// Implements ExchangeAdapter for OKX.
// All methods currently return mock data and log calls.
//
// TODO: implement real OKX API calls
//   - REST: https://www.okx.com/api/v5
//   - Demo: https://www.okx.com/api/v5 (with x-simulated-trading header)
//   - WebSocket: wss://ws.okx.com:8443/ws/v5/public
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

// ── OKX API constants ──

const OKX_REST_URL = "https://www.okx.com/api/v5";
const OKX_DEMO_REST_URL = "https://www.okx.com/api/v5"; // Same URL, different header
const OKX_WS_URL = "wss://ws.okx.com:8443/ws/v5/public";

// ── OKX Adapter ──

/**
 * Stub adapter for OKX exchange.
 * All methods log the call and return deterministic mock data.
 */
export class OkxAdapter implements ExchangeAdapter {
  readonly name = "OKX";
  readonly id = "okx";

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
    console.log(`[OkxAdapter] getBalance() called`);
    // TODO: implement real OKX API call — GET /api/v5/account/balance
    return {
      totalBalance: 10000,
      availableBalance: 9000,
      unrealizedPnl: 200,
      marginUsed: 1000,
      currency: "USDT",
    };
  }

  // ── Orders ──

  /** Place an order. Returns mock filled result. */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();
    console.log(`[OkxAdapter] placeOrder() called`, request);
    // TODO: implement real OKX API call — POST /api/v5/trade/order
    return {
      id: `okx-${Date.now()}`,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: request.price ?? 0,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: request.quantity * 0.0008,
    };
  }

  /** Cancel an order. Returns mock success. */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();
    console.log(`[OkxAdapter] cancelOrder(${orderId}) called`);
    // TODO: implement real OKX API call — POST /api/v5/trade/cancel-order
    return true;
  }

  /** Get order status. Returns mock result. */
  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();
    console.log(`[OkxAdapter] getOrderStatus(${orderId}) called`);
    // TODO: implement real OKX API call — GET /api/v5/trade/order
    return {
      id: orderId,
      symbol: "BTC-USDT",
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
    console.log(`[OkxAdapter] getOpenPositions() called`);
    // TODO: implement real OKX API call — GET /api/v5/account/positions
    return [];
  }

  /** Close a position. Returns mock filled result. */
  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    this.requireConnected();
    console.log(`[OkxAdapter] closePosition(${symbol}, ${quantity}) called`);
    // TODO: implement real OKX API call
    return {
      id: `okx-close-${Date.now()}`,
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
    console.log(`[OkxAdapter] getTicker(${symbol}) called`);
    // TODO: implement real OKX API call — GET /api/v5/market/ticker
    const basePrice = 50000;
    return {
      bid: basePrice - 7,
      ask: basePrice + 7,
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
      throw new Error(`[OkxAdapter] Not connected. Call connect() first.`);
    }
  }

  async connect(credentials: Record<string, string>): Promise<void> {
    this.credentials = credentials;
    console.log(`[OkxAdapter] connect() called — ${OKX_REST_URL}`);
    // TODO: implement real OKX connectivity test — GET /api/v5/public/time
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log(`[OkxAdapter] disconnect() called`);
  }
}

// ── Factory ──

/**
 * Create an OKX adapter with optional credentials.
 *
 * @param credentials - `{ apiKey: string, secret: string, passphrase: string }`
 *   OKX requires an additional passphrase compared to Binance/Bybit.
 */
export function createOkxAdapter(credentials?: Record<string, string>): OkxAdapter {
  return new OkxAdapter(credentials);
}
