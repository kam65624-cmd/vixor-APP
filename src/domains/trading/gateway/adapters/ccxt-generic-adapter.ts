// ============================================================================
// CCXT Generic Exchange Adapter
// ============================================================================
//
// A single generic adapter that wraps CCXT's unified API for any supported
// exchange. Eliminates per-exchange HMAC signing, request building, and error
// parsing. Currently used for OKX and Bybit; can replace Binance too.
//
// CCXT is imported server-side only (heavy all-in-one bundle).
// ============================================================================

import type {
  ExchangeAdapter,
  AccountBalance,
  OrderRequest,
  OrderResult,
  Position,
  Ticker,
} from "../types";

// ── CCXT dynamic import (server-only) ──
//
// We use a lazy require to avoid pulling CCXT into the client bundle.
// CCXT is only ever used inside TanStack Start server functions.

type CcxtExchange = {
  id: string;
  markets?: Record<string, any>;
  loadMarkets(): Promise<any>;
  fetchBalance(params?: Record<string, unknown>): Promise<any>;
  createOrder(
    symbol: string,
    type: string,
    side: string,
    amount: number,
    price?: number,
    params?: Record<string, unknown>,
  ): Promise<any>;
  cancelOrder(id: string, symbol?: string, params?: Record<string, unknown>): Promise<any>;
  fetchOrder(id: string, symbol?: string, params?: Record<string, unknown>): Promise<any>;
  fetchPositions?(symbols?: string[]): Promise<any[]>;
  fetchTicker(symbol: string): Promise<any>;
  close: () => void;
  urls?: any;
};

async function getCcxt(): Promise<
  Record<string, new (config?: Record<string, string>) => CcxtExchange>
> {
  // Dynamic import — CCXT is server-only
  const ccxt = await import("ccxt");
  return ccxt as any;
}

// ── Order type / side mapping ──

const ORDER_TYPE_MAP: Record<string, string> = {
  market: "market",
  limit: "limit",
  stop_loss: "stop_loss",
  take_profit: "take_profit",
};

const SIDE_MAP: Record<string, string> = {
  buy: "buy",
  sell: "sell",
};

const STATUS_MAP: Record<string, OrderResult["status"]> = {
  open: "pending",
  pending: "pending",
  partially_filled: "filled",
  filled: "filled",
  closed: "filled",
  canceled: "canceled",
  cancelled: "canceled",
  rejected: "rejected",
  expired: "canceled",
};

// ── CCXT Generic Adapter ──

/**
 * Generic adapter wrapping any CCXT-supported exchange.
 *
 * Usage:
 *   const adapter = await createCcxtAdapter("okx", { apiKey, apiSecret, password: passphrase });
 *   const balance = await adapter.getBalance();
 */
export class CcxtGenericAdapter implements ExchangeAdapter {
  readonly name: string;
  readonly id: string;

  private exchange: CcxtExchange | null = null;
  private credentials: Record<string, string> = {};
  private _connected = false;
  private readonly ccxtExchangeId: string;

  constructor(ccxtExchangeId: string) {
    this.ccxtExchangeId = ccxtExchangeId;
    this.id = ccxtExchangeId;
    this.name = ccxtExchangeId.charAt(0).toUpperCase() + ccxtExchangeId.slice(1);
  }

  // ── Account ──

  async getBalance(): Promise<AccountBalance> {
    this.requireConnected();
    const balance = await this.exchange!.fetchBalance({ type: "spot" });

    // CCXT returns { USDT: { free, used, total }, BTC: { ... }, ... }
    const total = (balance.total as Record<string, number>) ?? {};
    const free = (balance.free as Record<string, number>) ?? {};
    const used = (balance.used as Record<string, number>) ?? {};

    // Sum all non-zero balances (prioritize USDT display)
    let totalBalance = 0;
    let availableBalance = 0;
    let marginUsed = 0;
    let currency = "USDT";

    for (const [asset, val] of Object.entries(total)) {
      if (val > 0) {
        totalBalance += val;
        availableBalance += free[asset] ?? 0;
        marginUsed += used[asset] ?? 0;
        if (asset === "USDT") currency = "USDT";
      }
    }

    // Try to get unrealized PnL from futures positions if available
    let unrealizedPnl = 0;
    if (this.exchange!.fetchPositions) {
      try {
        const positions = await this.exchange!.fetchPositions();
        for (const p of positions) {
          unrealizedPnl += (p.unrealizedPnl as number) ?? 0;
        }
      } catch {
        // Positions not supported or no futures account — ignore
      }
    }

    return { totalBalance, availableBalance, unrealizedPnl, marginUsed, currency };
  }

  // ── Orders ──

  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.requireConnected();

    const ccxtType = ORDER_TYPE_MAP[request.type] ?? "market";
    const ccxtSide = SIDE_MAP[request.side] ?? request.side;

    const params: Record<string, unknown> = {};
    if (request.stopPrice) params.stopPrice = request.stopPrice;
    if (request.takeProfit) params.takeProfitPrice = request.takeProfit;
    if (request.stopLoss) params.stopLossPrice = request.stopLoss;
    if (request.clientOrderId) params.clientOrderId = request.clientOrderId;

    // For OKX: TD mode
    if (this.ccxtExchangeId === "okx") {
      params.tdMode = "cash";
    }

    const exchange = this.exchange!;
    const order = await exchange.createOrder(
      request.symbol,
      ccxtType,
      ccxtSide,
      request.quantity,
      request.price ?? undefined,
      params,
    );

    const fee = (order.fee as { cost: number } | undefined)?.cost ?? 0;

    return {
      id: String(order.id),
      symbol: order.symbol as string,
      side: (order.side as string).toLowerCase() === "buy" ? "buy" : "sell",
      type: this.mapOrderTypeBack(order.type as string),
      quantity: parseFloat(String(order.amount)),
      price: parseFloat(String(order.price)) || request.price || 0,
      status: STATUS_MAP[order.status as string] ?? "pending",
      filledAt: order.lastTradeTimestamp
        ? new Date(order.lastTradeTimestamp).toISOString()
        : undefined,
      fee,
    };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    this.requireConnected();
    try {
      await this.exchange!.cancelOrder(orderId);
      return true;
    } catch (err: any) {
      // Order already filled/canceled is acceptable
      if (err.message?.includes("OrderNotFound") || err.message?.includes("not found")) return true;
      throw err;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult | null> {
    this.requireConnected();
    try {
      const order = await this.exchange!.fetchOrder(orderId);
      const fee = (order.fee as { cost: number } | undefined)?.cost ?? 0;

      return {
        id: String(order.id),
        symbol: order.symbol as string,
        side: (order.side as string).toLowerCase() === "buy" ? "buy" : "sell",
        type: this.mapOrderTypeBack(order.type as string),
        quantity: parseFloat(String(order.amount)),
        price: parseFloat(String(order.price)) || 0,
        status: STATUS_MAP[order.status as string] ?? "pending",
        filledAt: order.lastTradeTimestamp
          ? new Date(order.lastTradeTimestamp).toISOString()
          : undefined,
        fee,
      };
    } catch (err: any) {
      if (err.message?.includes("OrderNotFound") || err.message?.includes("not found")) return null;
      throw err;
    }
  }

  // ── Positions ──

  async getOpenPositions(): Promise<Position[]> {
    this.requireConnected();

    if (!this.exchange!.fetchPositions) {
      return []; // Spot-only exchange
    }

    try {
      const positions = await this.exchange!.fetchPositions();
      return positions
        .filter((p: any) => {
          const qty = parseFloat(String(p.contracts ?? p.info?.size ?? 0));
          return qty !== 0;
        })
        .map((p: any) => ({
          symbol: p.symbol as string,
          side: ((p.side as string) || "long").toLowerCase() as "long" | "short",
          quantity: Math.abs(parseFloat(String(p.contracts ?? p.info?.size ?? 0))),
          entryPrice: parseFloat(String(p.entryPrice ?? 0)),
          currentPrice: parseFloat(String(p.markPrice ?? p.lastPrice ?? 0)),
          unrealizedPnl: (p.unrealizedPnl as number) ?? 0,
          realizedPnl: 0,
          leverage: parseFloat(String(p.leverage ?? 1)),
        }));
    } catch {
      return [];
    }
  }

  async closePosition(symbol: string, quantity?: number): Promise<OrderResult> {
    this.requireConnected();

    // Determine opposite side by checking current positions
    const positions = await this.getOpenPositions();
    const pos = positions.find((p) => p.symbol === symbol);
    const closeSide = pos?.side === "long" ? "sell" : "buy";
    const closeQty = quantity ?? pos?.quantity ?? 0;

    return this.placeOrder({
      symbol,
      side: closeSide,
      type: "market",
      quantity: closeQty,
    });
  }

  // ── Market Data ──

  async getTicker(symbol: string): Promise<Ticker> {
    const ticker = await this.exchange!.fetchTicker(symbol);
    return {
      bid: (ticker.bid as number) ?? 0,
      ask: (ticker.ask as number) ?? 0,
      last: (ticker.last as number) ?? 0,
    };
  }

  // ── Connection ──

  isConnected(): boolean {
    return this._connected && this.exchange !== null;
  }

  private requireConnected(): void {
    if (!this._connected || !this.exchange) {
      throw new Error(`[CcxtAdapter:${this.ccxtExchangeId}] Not connected. Call connect() first.`);
    }
  }

  async connect(credentials: Record<string, string>): Promise<void> {
    this.credentials = credentials;

    const ccxt = await getCcxt();
    const ExchangeClass = ccxt[this.ccxtExchangeId];
    if (!ExchangeClass) {
      throw new Error(`[CcxtAdapter] Unknown exchange: ${this.ccxtExchangeId}`);
    }

    // Build config — CCXT uses `apiKey`, `secret`, `password` (for OKX passphrase)
    const config: Record<string, string> = {
      apiKey: credentials.apiKey ?? credentials.api_key ?? "",
      secret: credentials.apiSecret ?? credentials.api_secret ?? "",
    };
    // OKX uses `password` for passphrase
    if (credentials.passphrase) {
      config.password = credentials.passphrase;
    }

    // Testnet support for known exchanges
    if (credentials.testnet !== "false") {
      if (this.ccxtExchangeId === "bybit" && process.env.BYBIT_USE_TESTNET !== "false") {
        config.urls = { api: "https://api-testnet.bybit.com" } as any;
      }
    }

    this.exchange = new ExchangeClass(config);

    // Verify connectivity by loading markets
    try {
      await this.exchange.loadMarkets();
      this._connected = true;
      console.log(
        `[CcxtAdapter:${this.ccxtExchangeId}] Connected — ${Object.keys(this.exchange?.markets ?? {}).length} markets loaded`,
      );
    } catch (err: any) {
      this._connected = false;
      this.exchange = null;
      throw new Error(`[CcxtAdapter:${this.ccxtExchangeId}] Connection failed: ${err.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.exchange) {
      try {
        this.exchange.close();
      } catch {
        // Ignore close errors
      }
    }
    this.exchange = null;
    this._connected = false;
    console.log(`[CcxtAdapter:${this.ccxtExchangeId}] Disconnected`);
  }

  // ── Helpers ──

  /** Map CCXT order type back to our type. */
  private mapOrderTypeBack(ccxtType: string): OrderResult["type"] {
    const map: Record<string, OrderResult["type"]> = {
      market: "market",
      limit: "limit",
      stop_loss: "stop_loss",
      stop_loss_limit: "stop_loss",
      take_profit: "take_profit",
      take_profit_limit: "take_profit",
    };
    return map[ccxtType] ?? "market";
  }

  /** Get the underlying CCXT exchange instance (for advanced usage). */
  getExchangeInstance(): CcxtExchange | null {
    return this.exchange;
  }
}

// ── Factory ──

/**
 * Create a CCXT-backed adapter for any supported exchange.
 *
 * @param exchangeId - CCXT exchange ID (e.g., "binance", "okx", "bybit", "kucoin")
 * @param credentials - `{ apiKey, apiSecret, passphrase? }`
 *
 * The adapter is lazy-initialized on `connect()`.
 */
export function createCcxtAdapter(
  exchangeId: string,
  credentials?: Record<string, string>,
): CcxtGenericAdapter {
  const adapter = new CcxtGenericAdapter(exchangeId);
  if (credentials) {
    // Don't connect yet — just store credentials
    // Actual connection happens via connect() in the server function
    adapter["credentials"] = credentials;
  }
  return adapter;
}

/**
 * List of CCXT-certified exchanges that map cleanly to our adapter.
 * Add more as needed — zero additional code required per exchange.
 */
export const CCXT_SUPPORTED_EXCHANGES = [
  { id: "okx", name: "OKX", fields: ["apiKey", "apiSecret", "passphrase"] as const },
  { id: "bybit", name: "Bybit", fields: ["apiKey", "apiSecret"] as const },
  { id: "kucoin", name: "KuCoin", fields: ["apiKey", "apiSecret", "passphrase"] as const },
  { id: "bitget", name: "Bitget", fields: ["apiKey", "apiSecret", "passphrase"] as const },
  { id: "gate", name: "Gate.io", fields: ["apiKey", "apiSecret"] as const },
  { id: "hyperliquid", name: "Hyperliquid", fields: ["apiKey", "apiSecret"] as const },
] as const;
