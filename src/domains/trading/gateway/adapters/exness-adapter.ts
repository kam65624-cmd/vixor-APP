// ============================================================================
// Exness Exchange Adapter — Forex broker via MT4/MT5 bridge
// ============================================================================
//
// Implements ExchangeAdapter for Exness, a major Forex/CFD broker.
// This adapter communicates with the Exness REST API, which bridges to
// MetaTrader 4 (MT4) and MetaTrader 5 (MT5) backends.
//
// MT4/MT5 Bridge Concept:
// ────────────────────────
// Exness provides a REST API that sits on top of their MT4/MT5
// infrastructure. When you place a trade through the Exness API, it is
// routed to the appropriate MT4 or MT5 server based on your account type.
//
// Key differences between MT4 and MT5 accounts:
//   - MT4: Hedging only, 4-digit/5-digit quotes, limited order types
//   - MT5: Hedging & netting, 6-digit quotes, more order types, depth of market
//
// The `passphrase` field in credentials is reused to specify the MT type
// ("mt4" or "mt5") so the adapter can handle protocol differences.
//
// Supported pairs (forex):
//   XAUUSD, EURUSD, GBPUSD, USDJPY, GBPJPY, AUDUSD, USDCAD, NZDUSD
//
// API: Exness REST API v1
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

// ── Exness API constants ──

const EXNESS_BASE_URL = "https://api.exness.com";

/** Supported forex pairs for Exness */
export const EXNESS_PAIRS = [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "GBPJPY",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
] as const;

/** Exness MT type */
export type ExnessMtType = "mt4" | "mt5";

// ── Helpers ──

/**
 * Map our OrderType to Exness order command values.
 *
 * Exness uses: MARKET_BUY, MARKET_SELL, LIMIT_BUY, LIMIT_SELL,
 *              STOP_BUY, STOP_SELL, etc.
 */
function mapOrderType(type: string, side: string): string {
  const sideUpper = side.toUpperCase();
  switch (type) {
    case "market":
      return `MARKET_${sideUpper}`;
    case "limit":
      return `LIMIT_${sideUpper}`;
    case "stop_loss":
      return sideUpper === "BUY" ? "STOP_BUY" : "STOP_SELL";
    case "take_profit":
      return sideUpper === "BUY" ? "LIMIT_BUY" : "LIMIT_SELL";
    default:
      return `MARKET_${sideUpper}`;
  }
}

/**
 * Map Exness order status to our OrderResult status.
 */
function mapExnessStatus(status: string): OrderResult["status"] {
  const map: Record<string, OrderResult["status"]> = {
    filled: "filled",
    FILLED: "filled",
    pending: "pending",
    PENDING: "pending",
    canceled: "canceled",
    CANCELED: "canceled",
    rejected: "rejected",
    REJECTED: "rejected",
    open: "pending",
    OPEN: "pending",
    partial: "filled",
    PARTIAL: "filled",
  };
  return map[status] ?? "pending";
}

/**
 * Build HTTP headers for Exness API requests.
 */
function buildHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ── Exness Adapter ──

/**
 * Exness broker adapter via MT4/MT5 bridge.
 *
 * Connects to the Exness REST API and maps Forex/CFD trading operations
 * to the standard ExchangeAdapter interface.
 *
 * Credentials:
 *   - accessToken (apiKey): Exness API access token
 *   - accountId (apiSecret): Exness trading account ID
 *   - passphrase: "mt4" or "mt5" — the MetaTrader account type
 */
export class ExnessAdapter implements ExchangeAdapter {
  readonly name = "Exness";
  readonly id = "exness";

  private accessToken = "";
  private accountId = "";
  private mtType: ExnessMtType = "mt5";
  private connected = false;

  constructor(credentials?: Record<string, string>) {
    if (credentials) {
      this.accessToken = credentials.accessToken ?? credentials.apiKey ?? "";
      this.accountId = credentials.accountId ?? credentials.apiSecret ?? "";
      this.mtType = (credentials.passphrase as ExnessMtType) || "mt5";
      if (this.accessToken && this.accountId) {
        this.connected = true;
      }
    }
  }

  // ── Internal: API helpers ──

  /** GET request to Exness API. */
  private async apiGet<T = unknown>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.connected) this.requireConnected();

    let url = `${EXNESS_BASE_URL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(this.accessToken),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[ExnessAdapter] GET ${endpoint} failed: ${res.status} — ${body}`);
    }

    return res.json() as Promise<T>;
  }

  /** POST request to Exness API. */
  private async apiPost<T = unknown>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    if (!this.connected) this.requireConnected();

    const res = await fetch(`${EXNESS_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: buildHeaders(this.accessToken),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const responseText = await res.text();
      throw new Error(`[ExnessAdapter] POST ${endpoint} failed: ${res.status} — ${responseText}`);
    }

    return res.json() as Promise<T>;
  }

  /** DELETE request to Exness API. */
  private async apiDelete<T = unknown>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    if (!this.connected) this.requireConnected();

    let url = `${EXNESS_BASE_URL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString();
      url += `?${qs}`;
    }

    const res = await fetch(url, {
      method: "DELETE",
      headers: buildHeaders(this.accessToken),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`[ExnessAdapter] DELETE ${endpoint} failed: ${res.status} — ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // ── Account ──

  /**
   * Fetch account balance from Exness.
   *
   * Returns balance in the account's base currency (usually USD).
   */
  async getBalance(): Promise<AccountBalance> {
    this.requireConnected();

    interface ExnessBalanceResponse {
      balance: number;
      equity: number;
      margin: number;
      freeMargin: number;
      currency: string;
      profit: number;
    }

    let data: ExnessBalanceResponse;
    try {
      data = await this.apiGet<ExnessBalanceResponse>(`/v1/accounts/${this.accountId}/balance`);
    } catch (err: unknown) {
      // Graceful fallback if the API is unavailable
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ExnessAdapter] Balance fetch failed, returning zeroed balance: ${msg}`);
      return {
        totalBalance: 0,
        availableBalance: 0,
        unrealizedPnl: 0,
        marginUsed: 0,
        currency: "USD",
      };
    }

    return {
      totalBalance: data.balance ?? 0,
      availableBalance: data.freeMargin ?? data.balance ?? 0,
      unrealizedPnl: data.profit ?? 0,
      marginUsed: data.margin ?? 0,
      currency: data.currency ?? "USD",
    };
  }

  // ── Orders ──

  /**
   * Place a new order via the Exness API.
   *
   * Maps the standard OrderRequest to Exness trade format, handling
   * MT4/MT5 differences (e.g., digit precision).
   */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();

    // Map to Exness order format
    const command = mapOrderType(request.type, request.side);

    const body: Record<string, unknown> = {
      symbol: request.symbol,
      cmd: command,
      volume: request.quantity,
      // MT5 supports 6-digit precision; MT4 typically 5-digit
      // We send the price as-is and let the server handle rounding
      ...(request.price ? { price: request.price } : {}),
      // stopPrice is the trigger price for pending orders; stopLoss is attached SL
      // If both are set, stopPrice goes to 'price' (already above), stopLoss goes to 'sl'
      ...(request.stopLoss ? { sl: request.stopLoss } : {}),
      ...(request.stopPrice && !request.price ? { price: request.stopPrice } : {}),
      ...(request.takeProfit ? { tp: request.takeProfit } : {}),
      ...(request.clientOrderId ? { clientOrderId: request.clientOrderId } : {}),
      mtType: this.mtType,
    };

    // MT5-specific: use expiration for pending orders
    if (this.mtType === "mt5" && request.type !== "market") {
      body.expiration = Date.now() + 24 * 60 * 60 * 1000; // 24h
    }

    interface ExnessOrderResponse {
      orderId: number;
      clientOrderId?: string;
      symbol: string;
      cmd: string;
      volume: number;
      price: number;
      status: string;
      timestamp: number;
      commission?: number;
    }

    let order: ExnessOrderResponse;
    try {
      order = await this.apiPost<ExnessOrderResponse>("/v1/trade/open", body);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[ExnessAdapter] Order placement failed: ${msg}`);
    }

    // Store symbol mapping for cancel/getStatus
    this.orderSymbolMap.set(String(order.orderId), request.symbol);

    return {
      id: String(order.orderId),
      symbol: order.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price: order.price ?? request.price ?? 0,
      status: mapExnessStatus(order.status),
      filledAt: order.timestamp ? new Date(order.timestamp).toISOString() : undefined,
      fee: order.commission,
    };
  }

  /**
   * Cancel an existing pending order.
   *
   * Note: In Forex, you cancel pending orders. To close open positions,
   * use `closePosition` instead.
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();

    const symbol = this.orderSymbolMap.get(orderId) ?? "EURUSD";

    try {
      await this.apiPost("/v1/trade/cancel", {
        orderId: parseInt(orderId, 10),
        symbol,
        mtType: this.mtType,
      });
      this.orderSymbolMap.delete(orderId);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Order may already be filled or canceled
      if (msg.includes("not found") || msg.includes("already")) {
        return true;
      }
      console.error(`[ExnessAdapter] Cancel order failed: ${msg}`);
      return false;
    }
  }

  /**
   * Get the current status of an existing order.
   */
  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();

    const symbol = this.orderSymbolMap.get(orderId) ?? "EURUSD";

    interface ExnessOrderQueryResponse {
      orderId: number;
      symbol: string;
      cmd: string;
      volume: number;
      price: number;
      status: string;
      timestamp: number;
      commission?: number;
    }

    try {
      const order = await this.apiGet<ExnessOrderQueryResponse>(`/v1/trade/order`, {
        orderId,
        symbol,
      });

      return {
        id: String(order.orderId),
        symbol: order.symbol,
        side: order.cmd.toLowerCase().includes("buy") ? "buy" : "sell",
        type: order.cmd.toLowerCase().includes("limit")
          ? "limit"
          : order.cmd.toLowerCase().includes("stop")
            ? "stop_loss"
            : "market",
        quantity: order.volume,
        price: order.price,
        status: mapExnessStatus(order.status),
        filledAt: order.timestamp ? new Date(order.timestamp).toISOString() : undefined,
        fee: order.commission,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not found")) return null;
      console.error(`[ExnessAdapter] Get order status failed: ${msg}`);
      return null;
    }
  }

  // ── Positions ──

  /**
   * Get all currently open positions.
   *
   * In Forex, positions are open trades on the MT4/MT5 account.
   */
  async getOpenPositions(): Promise<Position[]> {
    this.requireConnected();

    interface ExnessPosition {
      positionId: number;
      symbol: string;
      cmd: string;
      volume: number;
      openPrice: number;
      currentPrice: number;
      profit: number;
      swap: number;
      margin: number;
      timestamp: number;
    }

    let positions: ExnessPosition[];
    try {
      positions = await this.apiGet<ExnessPosition[]>(`/v1/accounts/${this.accountId}/positions`, {
        mtType: this.mtType,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ExnessAdapter] Failed to fetch positions: ${msg}`);
      return [];
    }

    return positions.map((p) => ({
      symbol: p.symbol,
      side: p.cmd.toLowerCase().includes("buy") ? "long" : "short",
      quantity: p.volume,
      entryPrice: p.openPrice,
      currentPrice: p.currentPrice ?? p.openPrice,
      unrealizedPnl: p.profit ?? 0,
      realizedPnl: 0,
      leverage: 1, // Exness leverage is account-level, not position-level
    }));
  }

  /**
   * Close a position (or partially close if quantity is specified).
   *
   * In Forex, closing a position means placing an opposite market order.
   * For MT5, partial closes are supported. For MT4, the full position is closed.
   */
  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    this.requireConnected();

    // Determine closing side: find the position to know its direction
    let closeSide: "buy" | "sell" = "sell"; // default fallback
    try {
      const positions = await this.getOpenPositions();
      const pos = positions.find((p) => p.symbol === symbol);
      if (pos) {
        // Closing a long = sell, closing a short = buy
        closeSide = pos.side === "long" ? "sell" : "buy";
      }
    } catch {
      // If we can't determine direction, keep default
    }

    interface ExnessCloseResponse {
      positionId: number;
      symbol: string;
      volume: number;
      price: number;
      profit: number;
      status: string;
      timestamp: number;
    }

    try {
      const result = await this.apiPost<ExnessCloseResponse>("/v1/trade/close", {
        symbol,
        ...(quantity ? { volume: quantity } : {}),
        mtType: this.mtType,
      });

      return {
        id: `close-${result.positionId}-${Date.now()}`,
        symbol: result.symbol,
        side: closeSide,
        type: "market",
        quantity: result.volume ?? quantity ?? 0,
        price: result.price,
        status: mapExnessStatus(result.status),
        filledAt: result.timestamp ? new Date(result.timestamp).toISOString() : undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[ExnessAdapter] Close position failed: ${msg}`);
    }
  }

  // ── Market Data ──

  /**
   * Get the current ticker (bid/ask/last) for a symbol.
   *
   * Exness provides real-time bid/ask quotes for forex pairs.
   */
  async getTicker(symbol: string): Promise<Ticker> {
    interface ExnessTickerResponse {
      symbol: string;
      bid: number;
      ask: number;
      last?: number;
      spread: number;
      timestamp: number;
    }

    let data: ExnessTickerResponse;
    try {
      data = await this.apiGet<ExnessTickerResponse>("/v1/ticker", {
        symbol,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[ExnessAdapter] Failed to fetch ticker for ${symbol}: ${msg}`);
    }

    const mid = (data.bid + data.ask) / 2;

    return {
      bid: data.bid,
      ask: data.ask,
      last: data.last ?? mid,
    };
  }

  // ── Connection ──

  isConnected(): boolean {
    return this.connected && !!this.accessToken && !!this.accountId;
  }

  private requireConnected(): void {
    if (!this.connected) {
      throw new Error("[ExnessAdapter] Not connected. Call connect() first.");
    }
  }

  /**
   * Connect to Exness API using provided credentials.
   *
   * Validates the access token and account ID by fetching account info.
   *
   * @param credentials - `{ accessToken, accountId, passphrase: "mt4"|"mt5" }`
   */
  async connect(credentials: Record<string, string>): Promise<void> {
    this.accessToken = credentials.accessToken ?? credentials.apiKey ?? "";
    this.accountId = credentials.accountId ?? credentials.apiSecret ?? "";
    this.mtType = (credentials.passphrase as ExnessMtType) || "mt5";

    if (!this.accessToken) {
      throw new Error("[ExnessAdapter] accessToken (API Key) is required");
    }
    if (!this.accountId) {
      throw new Error("[ExnessAdapter] accountId (API Secret field) is required");
    }
    if (this.mtType !== "mt4" && this.mtType !== "mt5") {
      throw new Error(`[ExnessAdapter] Invalid MT type: "${this.mtType}". Must be "mt4" or "mt5".`);
    }

    // Validate credentials by calling the account endpoint
    try {
      interface ExnessAccountInfo {
        accountId: string;
        mtType: string;
        currency: string;
        status: string;
      }

      await this.apiGet<ExnessAccountInfo>(`/v1/accounts/${this.accountId}`);
      this.connected = true;
      console.log(
        `[ExnessAdapter] Connected (${this.mtType.toUpperCase()}) — Account: ${this.accountId}`,
      );
    } catch (err: unknown) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[ExnessAdapter] Connection failed for account ${this.accountId}: ${msg}`);
    }
  }

  /**
   * Disconnect from the Exness API.
   * Clears local credential state.
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.accessToken = "";
    this.accountId = "";
    this.orderSymbolMap.clear();
    console.log("[ExnessAdapter] Disconnected");
  }

  // ── Internal state ──

  /** Maps order IDs → symbols for cancel/getStatus without symbol param. */
  private orderSymbolMap = new Map<string, string>();
}

// ── Factory ──

/**
 * Create an Exness adapter with optional credentials.
 *
 * @param credentials - `{ accessToken, accountId, passphrase: "mt4"|"mt5" }`
 *
 * The `passphrase` field determines whether the adapter communicates
 * via the MT4 or MT5 bridge. Defaults to MT5.
 */
export function createExnessAdapter(credentials?: Record<string, string>): ExnessAdapter {
  return new ExnessAdapter(credentials);
}
