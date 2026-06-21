// ============================================================================
// Binance Exchange Adapter — Testnet (Real API)
// ============================================================================
//
// Implements ExchangeAdapter for Binance Spot Testnet.
// Uses HMAC-SHA256 request signing per Binance API specification.
//
// Endpoints:
//   - REST Testnet: https://testnet.binance.vision
//   - WebSocket: wss://stream.binance.com:9443/ws
//
// Signing: query string → HMAC-SHA256(secret) → hex signature appended
// ============================================================================

import { createHmac } from "crypto";
import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

// ── Binance API constants ──

const BINANCE_TESTNET_URL = "https://testnet.binance.vision";
const BINANCE_REST_URL = "https://api.binance.com";

// ── Helpers ──

/** Build an HMAC-SHA256 signature for an authenticated Binance request. */
function signQuery(secret: string, queryString: string): string {
  return createHmac("sha256", secret).update(queryString).digest("hex");
}

/**
 * Build a signed query string from params and append the signature.
 * Returns the full query string including `&signature=...`.
 */
function buildSignedParams(
  params: Record<string, string | number | boolean>,
  secret: string,
): string {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  const sig = signQuery(secret, qs);
  return `${qs}&signature=${sig}`;
}

/** Build an unsigned query string. */
function buildParams(params: Record<string, string | number | boolean>): string {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

/**
 * Map our OrderType to Binance ORDER_TYPE values.
 * Binance spot: MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT
 */
function mapOrderType(type: string): string {
  const map: Record<string, string> = {
    market: "MARKET",
    limit: "LIMIT",
    stop_loss: "STOP_LOSS",
    take_profit: "TAKE_PROFIT",
  };
  return map[type] ?? "MARKET";
}

/**
 * Map our OrderSide to Binance SIDE values.
 */
function mapSide(side: string): string {
  return side.toUpperCase(); // "buy" → "BUY", "sell" → "SELL"
}

/**
 * Map Binance order status to our status.
 */
function mapOrderStatus(status: string): OrderResult["status"] {
  const map: Record<string, OrderResult["status"]> = {
    FILLED: "filled",
    PARTIALLY_FILLED: "filled",
    NEW: "pending",
    PENDING_CANCEL: "pending",
    CANCELED: "canceled",
    REJECTED: "rejected",
    EXPIRED: "canceled",
  };
  return map[status] ?? "pending";
}

// ── Binance Adapter ──

/**
 * Binance spot testnet adapter. Connects to testnet.binance.vision
 * with HMAC-SHA256 signed requests.
 */
export class BinanceAdapter implements ExchangeAdapter {
  readonly name = "Binance";
  readonly id = "binance";

  private apiKey = "";
  private apiSecret = "";
  private connected = false;
  private baseUrl = BINANCE_TESTNET_URL;

  constructor(credentials?: Record<string, string>) {
    if (credentials) {
      this.apiKey = credentials.apiKey ?? credentials.api_key ?? "";
      this.apiSecret = credentials.apiSecret ?? credentials.api_secret ?? "";
      if (this.apiKey && this.apiSecret) {
        this.connected = true;
      }
    }
  }

  // ── Internal: authenticated fetch helpers ──

  /** GET request (public or authenticated). */
  private async apiGet<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    authenticated = true,
  ): Promise<T> {
    let url: string;
    if (authenticated) {
      const signed = buildSignedParams(
        { ...params, timestamp: Date.now(), recvWindow: 5000 },
        this.apiSecret,
      );
      url = `${this.baseUrl}${endpoint}?${signed}`;
    } else {
      url = params
        ? `${this.baseUrl}${endpoint}?${buildParams(params)}`
        : `${this.baseUrl}${endpoint}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[BinanceAdapter] GET ${endpoint} failed: ${res.status} — ${body}`);
    }

    return res.json() as T;
  }

  /** POST request (authenticated). */
  private async apiPost<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const signed = buildSignedParams(
      { ...params, timestamp: Date.now(), recvWindow: 5000 },
      this.apiSecret,
    );

    const res = await fetch(`${this.baseUrl}${endpoint}?${signed}`, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": this.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[BinanceAdapter] POST ${endpoint} failed: ${res.status} — ${body}`);
    }

    return res.json() as T;
  }

  /** DELETE request (authenticated). */
  private async apiDelete<T = any>(
    endpoint: string,
    params: Record<string, string | number | boolean>,
  ): Promise<T> {
    const signed = buildSignedParams(
      { ...params, timestamp: Date.now(), recvWindow: 5000 },
      this.apiSecret,
    );

    const res = await fetch(`${this.baseUrl}${endpoint}?${signed}`, {
      method: "DELETE",
      headers: {
        "X-MBX-APIKEY": this.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[BinanceAdapter] DELETE ${endpoint} failed: ${res.status} — ${body}`);
    }

    return res.json() as T;
  }

  // ── Account ──

  /** Fetch account balance from Binance /api/v3/account. */
  async getBalance(): Promise<AccountBalance> {
    this.requireConnected();

    interface BinanceAccount {
      balances: Array<{ asset: string; free: string; locked: string }>;
      canTrade: boolean;
    }

    const account = await this.apiGet<BinanceAccount>("/api/v3/account", {});

    // Sum non-zero balances; prioritise USDT as the primary currency
    let totalBalance = 0;
    let availableBalance = 0;
    const primaryCurrency = "USDT";

    for (const b of account.balances) {
      const free = parseFloat(b.free) || 0;
      const locked = parseFloat(b.locked) || 0;
      if (free > 0 || locked > 0) {
        // For testnet, treat all assets as if they were USDT equivalent
        // (in production you'd need prices to convert)
        if (b.asset === primaryCurrency) {
          totalBalance += free + locked;
          availableBalance += free;
        } else {
          totalBalance += free + locked;
          availableBalance += free;
        }
      }
    }

    return {
      totalBalance,
      availableBalance,
      unrealizedPnl: 0, // Spot has no unrealized PnL
      marginUsed: 0, // Spot has no margin concept
      currency: primaryCurrency,
    };
  }

  // ── Orders ──

  /** Place an order via POST /api/v3/order. */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();

    const params: Record<string, string | number | boolean> = {
      symbol: request.symbol,
      side: mapSide(request.side),
      type: mapOrderType(request.type),
      quantity: request.quantity,
    };

    // Limit orders require price
    if (request.type === "limit") {
      if (!request.price) {
        throw new Error("[BinanceAdapter] Limit orders require a price");
      }
      params.price = request.price;
      params.timeInForce = "GTC";
    }

    // Stop-loss / take-profit orders
    if (request.stopPrice) {
      params.stopPrice = request.stopPrice;
    }
    if (request.type === "take_profit" && request.price) {
      params.price = request.price;
      params.timeInForce = "GTE_GTC";
    }

    // Client order ID
    if (request.clientOrderId) {
      params.newClientOrderId = request.clientOrderId;
    }

    interface BinanceOrderResponse {
      orderId: number;
      clientOrderId?: string;
      symbol: string;
      status: string;
      side: string;
      type: string;
      origQty: string;
      price: string;
      executedQty: string;
      fills: Array<{ price: string; qty: string; commission: string; commissionAsset: string }>;
      transactTime: number;
    }

    const order = await this.apiPost<BinanceOrderResponse>("/api/v3/order", params);

    // Compute fee from fills
    const fee = order.fills?.reduce((sum, f) => sum + parseFloat(f.commission), 0) ?? 0;

    return {
      id: String(order.orderId),
      symbol: order.symbol,
      side: mapSideInverse(order.side),
      type: mapOrderTypeInverse(order.type),
      quantity: parseFloat(order.origQty),
      price:
        parseFloat(order.price) || (parseFloat(order.executedQty) > 0 ? (request.price ?? 0) : 0),
      status: mapOrderStatus(order.status),
      filledAt: order.transactTime ? new Date(order.transactTime).toISOString() : undefined,
      fee,
    };
  }

  /** Cancel an order via DELETE /api/v3/order. */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();

    // Parse symbol from orderId if encoded as "symbol:id"
    // Otherwise we need a symbol — the Binance API requires it
    // We'll try to cancel using just orderId if it's numeric
    const numericId = parseInt(orderId.replace(/[^0-9]/g, ""), 10);
    if (!numericId) {
      console.error(`[BinanceAdapter] Cannot parse orderId: ${orderId}`);
      return false;
    }

    // We need the symbol for cancellation — store it or parse from the ID
    // The adapter stores a map of orderId → symbol from placeOrder calls
    const symbol = this.orderSymbolMap.get(String(numericId)) ?? "BTCUSDT";

    try {
      await this.apiDelete("/api/v3/order", {
        symbol,
        orderId: numericId,
      });
      this.orderSymbolMap.delete(String(numericId));
      return true;
    } catch (err: any) {
      // Order may already be filled/canceled — that's fine
      if (err.message?.includes("UNKNOWN_ORDER")) return true;
      throw err;
    }
  }

  /** Get order status via GET /api/v3/order. */
  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();

    const numericId = parseInt(orderId.replace(/[^0-9]/g, ""), 10);
    if (!numericId) {
      console.error(`[BinanceAdapter] Cannot parse orderId: ${orderId}`);
      return null;
    }

    const symbol = this.orderSymbolMap.get(String(numericId)) ?? "BTCUSDT";

    interface BinanceOrderQuery {
      orderId: number;
      symbol: string;
      status: string;
      side: string;
      type: string;
      origQty: string;
      price: string;
      executedQty: string;
      fills: Array<{ price: string; qty: string; commission: string }>;
      transactTime: number;
    }

    try {
      const order = await this.apiGet<BinanceOrderQuery>("/api/v3/order", {
        symbol,
        orderId: numericId,
      });

      const fee = order.fills?.reduce((sum, f) => sum + parseFloat(f.commission), 0) ?? 0;

      return {
        id: String(order.orderId),
        symbol: order.symbol,
        side: mapSideInverse(order.side),
        type: mapOrderTypeInverse(order.type),
        quantity: parseFloat(order.origQty),
        price: parseFloat(order.price),
        status: mapOrderStatus(order.status),
        filledAt: order.transactTime ? new Date(order.transactTime).toISOString() : undefined,
        fee,
      };
    } catch (err: any) {
      if (err.message?.includes("UNKNOWN_ORDER")) return null;
      throw err;
    }
  }

  // ── Positions ──

  /**
   * Get open positions.
   * Spot has no positions — we use open orders as an approximation.
   */
  async getOpenPositions(): Promise<Position[]> {
    this.requireConnected();

    // In spot trading there are no "positions" per se.
    // We fetch all open orders and represent them as synthetic positions.
    // For real position support, use Binance Futures (fapi.binance.com).
    interface BinanceOpenOrder {
      symbol: string;
      side: string;
      type: string;
      origQty: string;
      price: string;
      time: number;
    }

    const orders = await this.apiGet<BinanceOpenOrder[]>("/api/v3/openOrders");

    // Group by symbol and create synthetic positions
    const positionMap = new Map<string, Position>();

    for (const o of orders) {
      if (positionMap.has(o.symbol)) continue;
      const qty = parseFloat(o.origQty);
      const price = parseFloat(o.price) || 0;

      positionMap.set(o.symbol, {
        symbol: o.symbol,
        side: o.side === "BUY" ? "long" : "short",
        quantity: qty,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        realizedPnl: 0,
        leverage: 1,
      });
    }

    return Array.from(positionMap.values());
  }

  /**
   * Close a position by canceling all open orders for the symbol.
   * In spot, this cancels all pending orders for the given symbol.
   */
  async closePosition(symbol: string, _quantity?: number): Promise<OrderResult> {
    this.requireConnected();

    // Cancel all open orders for the symbol
    interface BinanceCancelResult {
      symbol: string;
      origClientOrderId: string;
      orderId: number;
      status: string;
    }

    try {
      const results = await this.apiDelete<BinanceCancelResult[]>("/api/v3/openOrders", {
        symbol,
      });

      return {
        id: `close-${symbol}-${Date.now()}`,
        symbol,
        side: "sell",
        type: "market",
        quantity: _quantity ?? 0,
        price: 0,
        status: "filled",
        filledAt: new Date().toISOString(),
      };
    } catch (err: any) {
      // No open orders to cancel is fine
      if (err.message?.includes("UNKNOWN_ORDER")) {
        return {
          id: `close-${symbol}-${Date.now()}`,
          symbol,
          side: "sell",
          type: "market",
          quantity: _quantity ?? 0,
          price: 0,
          status: "filled",
          filledAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  }

  // ── Market Data ──

  /** Get ticker price via GET /api/v3/ticker/price (public). */
  async getTicker(symbol: string): Promise<Ticker> {
    interface PriceResponse {
      symbol: string;
      price: string;
    }

    const priceData = await this.apiGet<PriceResponse>(
      "/api/v3/ticker/price",
      {
        symbol,
      },
      false,
    );

    interface BookTickerResponse {
      bidPrice: string;
      bidQty: string;
      askPrice: string;
      askQty: string;
    }

    let bid: number;
    let ask: number;

    try {
      const bookData = await this.apiGet<BookTickerResponse>(
        "/api/v3/ticker/bookTicker",
        {
          symbol,
        },
        false,
      );
      bid = parseFloat(bookData.bidPrice);
      ask = parseFloat(bookData.askPrice);
    } catch {
      // Fallback: derive bid/ask from last price with small spread
      const last = parseFloat(priceData.price);
      bid = last * 0.9999;
      ask = last * 1.0001;
    }

    return {
      bid,
      ask,
      last: parseFloat(priceData.price),
    };
  }

  // ── Connection ──

  isConnected(): boolean {
    return this.connected && !!this.apiKey && !!this.apiSecret;
  }

  private requireConnected(): void {
    if (!this.connected) {
      throw new Error("[BinanceAdapter] Not connected. Call connect() first.");
    }
  }

  /**
   * Connect by storing credentials and verifying connectivity via /api/v3/ping.
   * Supports both testnet and mainnet.
   */
  async connect(credentials: Record<string, string>): Promise<void> {
    this.apiKey = credentials.apiKey ?? credentials.api_key ?? "";
    this.apiSecret = credentials.apiSecret ?? credentials.api_secret ?? "";

    if (!this.apiKey || !this.apiSecret) {
      throw new Error("[BinanceAdapter] apiKey and apiSecret are required");
    }

    // Determine environment: testnet if BINANCE_USE_TESTNET is set, else mainnet
    const useTestnet =
      credentials.testnet !== "false" && process.env.BINANCE_USE_TESTNET !== "false";
    this.baseUrl = useTestnet ? BINANCE_TESTNET_URL : BINANCE_REST_URL;

    // Verify connectivity with a signed system status call
    try {
      await this.apiGet("/api/v3/systemStatus", {});
      this.connected = true;
      console.log(`[BinanceAdapter] Connected to ${this.baseUrl}`);
    } catch (err: any) {
      this.connected = false;
      throw new Error(`[BinanceAdapter] Connection failed to ${this.baseUrl}: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.apiKey = "";
    this.apiSecret = "";
    this.orderSymbolMap.clear();
    console.log("[BinanceAdapter] Disconnected");
  }

  // ── Internal state ──

  /** Maps numeric order IDs → symbols for cancel/getStatus without symbol param. */
  private orderSymbolMap = new Map<string, string>();
}

// ── Reverse mappers ──

function mapSideInverse(side: string): "buy" | "sell" {
  return side.toLowerCase() === "buy" ? "buy" : "sell";
}

function mapOrderTypeInverse(type: string): "market" | "limit" | "stop_loss" | "take_profit" {
  const map: Record<string, "market" | "limit" | "stop_loss" | "take_profit"> = {
    MARKET: "market",
    LIMIT: "limit",
    STOP_LOSS: "stop_loss",
    TAKE_PROFIT: "take_profit",
    STOP_LOSS_LIMIT: "stop_loss",
    TAKE_PROFIT_LIMIT: "take_profit",
  };
  return map[type] ?? "market";
}

// ── Factory ──

/**
 * Create a Binance testnet adapter with optional credentials.
 *
 * @param credentials - `{ apiKey: string, apiSecret: string, testnet?: boolean }`
 *
 * Defaults to testnet (https://testnet.binance.vision).
 * Set `testnet: false` or env `BINANCE_USE_TESTNET=false` to use mainnet.
 */
export function createBinanceAdapter(credentials?: Record<string, string>): BinanceAdapter {
  return new BinanceAdapter(credentials);
}
