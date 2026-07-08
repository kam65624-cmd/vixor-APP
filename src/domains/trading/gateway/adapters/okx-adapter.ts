// ============================================================================
// OKX Exchange Adapter — CCXT-Powered
// ============================================================================
//
// Implements ExchangeAdapter for OKX via CCXT unified API.
// Replaces the previous stub implementation with real API calls.
//
// CCXT handles: HMAC signing, request building, rate limiting, error parsing,
// and OKX-specific passphrase authentication.
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

// ── OKX Adapter ──

/**
 * OKX adapter backed by CCXT.
 * Delegates all operations to CcxtGenericAdapter with exchangeId="okx".
 */
export class OkxAdapter implements ExchangeAdapter {
  readonly name = "OKX";
  readonly id = "okx";

  private inner: CcxtGenericAdapter;

  constructor(credentials?: Record<string, string>) {
    this.inner = new CcxtGenericAdapter("okx");
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
 * Create an OKX adapter with optional credentials.
 *
 * @param credentials - `{ apiKey: string, apiSecret: string, passphrase: string }`
 *   OKX requires an additional passphrase compared to Binance/Bybit.
 */
export function createOkxAdapter(credentials?: Record<string, string>): OkxAdapter {
  return new OkxAdapter(credentials);
}
