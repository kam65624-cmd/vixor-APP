// ============================================================================
// Bybit Exchange Adapter — CCXT-Powered
// ============================================================================
//
// Implements ExchangeAdapter for Bybit via CCXT unified API.
// Replaces the previous stub implementation with real API calls.
//
// CCXT handles: HMAC signing, request building, rate limiting, error parsing.
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";
import { CcxtGenericAdapter } from "./ccxt-generic-adapter";

// ── Bybit Adapter ──

/**
 * Bybit adapter backed by CCXT.
 * Delegates all operations to CcxtGenericAdapter with exchangeId="bybit".
 */
export class BybitAdapter implements ExchangeAdapter {
  readonly name = "Bybit";
  readonly id = "bybit";

  private inner: CcxtGenericAdapter;

  constructor(credentials?: Record<string, string>) {
    this.inner = new CcxtGenericAdapter("bybit");
    if (credentials) {
      this.inner["credentials"] = credentials;
    }
  }

  async getBalance(): Promise<AccountBalance> {
    return this.inner.getBalance();
  }

  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    return this.inner.placeOrder(request);
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    return this.inner.cancelOrder(orderId);
  }

  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    return this.inner.getOrderStatus(orderId);
  }

  async getOpenPositions(): Promise<Position[]> {
    return this.inner.getOpenPositions();
  }

  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    return this.inner.closePosition(symbol, quantity);
  }

  async getTicker(symbol: string): Promise<Ticker> {
    return this.inner.getTicker(symbol);
  }

  isConnected(): boolean {
    return this.inner.isConnected();
  }

  async connect(credentials: Record<string, string>): Promise<void> {
    return this.inner.connect(credentials);
  }

  async disconnect(): Promise<void> {
    return this.inner.disconnect();
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
