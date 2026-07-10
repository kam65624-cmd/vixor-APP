// ============================================================================
// Dummy Exchange Adapter (Test / Demo)
// ============================================================================
//
// A fully deterministic test adapter that requires no credentials or
// network access. All market orders fill at the price given in the request.
// The account always has a mock $10,000 balance and zero open positions.
//
// Use this adapter for:
//   • Unit tests
//   • Strategy development / dry-run demos
//   • CI pipelines that need a trading adapter
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

/** Mock ticker prices keyed by symbol for deterministic responses. */
const MOCK_PRICES: Record<string, number> = {
  BTCUSDT: 50000,
  ETHUSDT: 3000,
  SOLUSDT: 150,
  XAUUSD: 2350,
  EURUSD: 1.085,
  GBPUSD: 1.27,
};

/** Default spread applied to bid/ask around the last price (in bps). */
const SPREAD_BPS = 10;

// ── Dummy Adapter ──

/**
 * Test adapter that returns deterministic mock data.
 * No credentials required — useful for testing and demos.
 */
export class DummyAdapter implements ExchangeAdapter {
  readonly name = "Dummy (Test)";
  readonly id = "dummy";

  private connected = false;

  constructor() {
    // No credentials needed
  }

  // ── Account ──

  /** Returns a mock $10,000 USDT account. */
  async getBalance(): Promise<AccountBalance> {
    this.requireConnected();
    return {
      totalBalance: 10_000,
      availableBalance: 10_000,
      unrealizedPnl: 0,
      marginUsed: 0,
      currency: "USDT",
    };
  }

  // ── Orders ──

  /**
   * Fills every order immediately at the requested price (or at the mock
   * ticker price for market orders). All orders receive a "filled" status.
   */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();

    const fillPrice = request.price ?? MOCK_PRICES[request.symbol] ?? 0;
    const id = request.clientOrderId ?? `dummy-${Date.now()}`;

    const result: OrderResult = {
      id,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: fillPrice,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: 0, // No fees in test mode
    };

    return result;
  }

  /** Always returns true (cancel succeeds). */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();
    return true;
  }

  /** Returns a mock filled order result. */
  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();
    return {
      id: orderId,
      symbol: "BTCUSDT",
      side: "buy",
      type: "market",
      quantity: 0.01,
      price: 50000,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: 0,
    };
  }

  // ── Positions ──

  /** Always returns empty array — no positions in test mode. */
  async getOpenPositions(): Promise<Position[]> {
    this.requireConnected();
    return [];
  }

  /** Returns a mock close result. */
  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    this.requireConnected();
    const fillPrice = MOCK_PRICES[symbol] ?? 0;
    return {
      id: `dummy-close-${Date.now()}`,
      symbol,
      side: "sell",
      type: "market",
      quantity: quantity ?? 0,
      price: fillPrice,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: 0,
    };
  }

  // ── Market Data ──

  /**
   * Returns a deterministic ticker with a fixed spread around the mock price.
   * Unknown symbols default to a price of 100.
   */
  async getTicker(symbol: string): Promise<Ticker> {
    const last = MOCK_PRICES[symbol] ?? 100;
    const halfSpread = last * (SPREAD_BPS / 2 / 10_000);

    return {
      bid: last - halfSpread,
      ask: last + halfSpread,
      last,
    };
  }

  // ── Connection ──

  isConnected(): boolean {
    return this.connected;
  }

  /** Throws if the adapter is not connected. */
  private requireConnected(): void {
    if (!this.connected) {
      throw new Error(`[DummyAdapter] Not connected. Call connect() first.`);
    }
  }

  /** No-op connect — always succeeds. */
  async connect(_credentials: Record<string, string>): Promise<void> {
    this.connected = true;
  }

  /** No-op disconnect. */
  async disconnect(): Promise<void> {
    this.connected = false;
    // disconnected
  }
}

// ── Factory ──

/**
 * Create a Dummy adapter. No credentials needed.
 * Ideal for tests, demos, and CI environments.
 */
export function createDummyAdapter(): DummyAdapter {
  return new DummyAdapter();
}
