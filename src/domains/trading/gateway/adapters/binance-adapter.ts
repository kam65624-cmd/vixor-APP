// ============================================================================
// Binance Exchange Adapter (Stub)
// ============================================================================
//
// Implements ExchangeAdapter for Binance.
// All methods currently return mock data and log calls.
//
// TODO: implement real Binance API calls
//   - REST: https://api.binance.com
//   - Testnet: https://testnet.binance.vision
//   - WebSocket: wss://stream.binance.com:9443/ws
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

// ── Binance API constants ──

const BINANCE_REST_URL = "https://api.binance.com";
const BINANCE_TESTNET_URL = "https://testnet.binance.vision";
const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws";

// ── Binance Adapter ──

/**
 * Stub adapter for Binance exchange.
 * All methods log the call and return deterministic mock data.
 */
export class BinanceAdapter implements ExchangeAdapter {
  readonly name = "Binance";
  readonly id = "binance";

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
    console.log(`[BinanceAdapter] getBalance() called`);
    // TODO: implement real Binance API call — GET /api/v3/account
    return {
      totalBalance: 10000,
      availableBalance: 8500,
      unrealizedPnl: 150,
      marginUsed: 1500,
      currency: "USDT",
    };
  }

  // ── Orders ──

  /** Place an order. Returns mock filled result. */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();
    console.log(`[BinanceAdapter] placeOrder() called`, request);
    // TODO: implement real Binance API call — POST /api/v3/order
    return {
      id: `binance-${Date.now()}`,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: request.price ?? 0,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: request.quantity * 0.001,
    };
  }

  /** Cancel an order. Returns mock success. */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();
    console.log(`[BinanceAdapter] cancelOrder(${orderId}) called`);
    // TODO: implement real Binance API call — DELETE /api/v3/order
    return true;
  }

  /** Get order status. Returns mock result. */
  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();
    console.log(`[BinanceAdapter] getOrderStatus(${orderId}) called`);
    // TODO: implement real Binance API call — GET /api/v3/order
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
    console.log(`[BinanceAdapter] getOpenPositions() called`);
    // TODO: implement real Binance API call — GET /api/v3/positionRisk (futures)
    return [];
  }

  /** Close a position. Returns mock filled result. */
  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    this.requireConnected();
    console.log(`[BinanceAdapter] closePosition(${symbol}, ${quantity}) called`);
    // TODO: implement real Binance API call
    return {
      id: `binance-close-${Date.now()}`,
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
    console.log(`[BinanceAdapter] getTicker(${symbol}) called`);
    // TODO: implement real Binance API call — GET /api/v3/ticker/bookTicker
    const basePrice = 50000; // mock BTC price
    return {
      bid: basePrice - 10,
      ask: basePrice + 10,
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
      throw new Error(`[BinanceAdapter] Not connected. Call connect() first.`);
    }
  }

  async connect(credentials: Record<string, string>): Promise<void> {
    this.credentials = credentials;
    console.log(`[BinanceAdapter] connect() called — ${BINANCE_REST_URL}`);
    // TODO: implement real Binance connectivity test — GET /api/v3/ping
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log(`[BinanceAdapter] disconnect() called`);
  }
}

// ── Factory ──

/**
 * Create a Binance adapter with optional credentials.
 *
 * @param credentials - `{ apiKey: string, apiSecret: string }`
 */
export function createBinanceAdapter(credentials?: Record<string, string>): BinanceAdapter {
  return new BinanceAdapter(credentials);
}
