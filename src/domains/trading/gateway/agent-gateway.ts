// ============================================================================
// Trading Domain — Agent Gateway
// ============================================================================
//
// The Agent Gateway abstracts exchange connectivity so that trading strategies
// can place orders without knowing which exchange they're hitting. It supports:
//
//   • Primary / fallback routing
//   • Dry-run (paper trading) mode
//   • Structured logging of every operation
//   • Account summary across all connected adapters
//
// Usage:
//   const gateway = new AgentGateway([binanceAdapter, bybitAdapter], config);
//   await gateway.connectAll();
//   const result = await gateway.placeOrder({ symbol: "BTCUSDT", ... });
// ============================================================================

import type {
  ExchangeAdapter,
  GatewayConfig,
  OrderRequest,
  OrderResult,
  Position,
  AccountBalance,
  AccountSummary,
  Ticker,
} from "./types";

// ── Structured log entry ──

interface GatewayLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  action: string;
  exchange?: string;
  dryRun: boolean;
  details: Record<string, unknown>;
}

// ── Agent Gateway ──

/**
 * Central router that sits between trading strategies and exchange adapters.
 * Strategies talk to the gateway; the gateway picks the right adapter and
 * handles fallback / dry-run logic.
 */
export class AgentGateway {
  private readonly adapters: Map<string, ExchangeAdapter>;
  private readonly config: GatewayConfig;
  private readonly logs: GatewayLogEntry[];

  constructor(adapters: ExchangeAdapter[], config: GatewayConfig) {
    this.adapters = new Map(adapters.map((a) => [a.id, a]));
    this.config = config;
    this.logs = [];
  }

  // ── Connection lifecycle ──

  /**
   * Connect all registered adapters using the provided credentials map.
   * Keys in the credentials map should match adapter ids.
   */
  async connectAll(credentials: Record<string, Record<string, string>>): Promise<void> {
    for (const [id, adapter] of this.adapters) {
      const creds = credentials[id];
      if (!creds) {
        this.log("warn", "connect", id, { message: "No credentials provided, skipping" });
        continue;
      }
      try {
        await adapter.connect(creds);
        this.log("info", "connect", id, { connected: true });
      } catch (err) {
        this.log("error", "connect", id, {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /** Disconnect every adapter. */
  async disconnectAll(): Promise<void> {
    for (const [id, adapter] of this.adapters) {
      try {
        await adapter.disconnect();
        this.log("info", "disconnect", id, {});
      } catch {
        // Best-effort disconnect
      }
    }
  }

  // ── Order routing ──

  /**
   * Place an order through the gateway. Routes to the primary exchange;
   * if that fails and a fallback is configured, tries the fallback.
   * In dry-run mode the order is logged but not sent to any exchange.
   */
  async placeOrder(request: OrderRequest): Promise<OrderResult> {
    this.log("info", "placeOrder", undefined, { request });

    if (this.config.dryRun) {
      return this.dryRunOrder(request);
    }

    return this.routeOrder(request);
  }

  /**
   * Cancel an order on the exchange it was placed on.
   * Requires the exchange id to be passed explicitly.
   */
  async cancelOrder(orderId: string, exchangeId?: string): Promise<boolean> {
    this.log("info", "cancelOrder", exchangeId, { orderId });

    if (this.config.dryRun) {
      this.log("info", "cancelOrder", undefined, { dryRun: true, orderId, canceled: true });
      return true;
    }

    const adapter = exchangeId
      ? this.adapters.get(exchangeId)
      : this.getAdapter(this.config.primaryExchange);

    if (!adapter) throw new Error(`Adapter not found: ${exchangeId ?? this.config.primaryExchange}`);

    return adapter.cancelOrder(orderId);
  }

  // ── Positions ──

  /** Get open positions from the primary (or specified) adapter. */
  async getOpenPositions(exchangeId?: string): Promise<Position[]> {
    const adapterId = exchangeId ?? this.config.primaryExchange;
    const adapter = this.getAdapter(adapterId);
    if (!adapter) throw new Error(`Adapter not found: ${adapterId}`);
    return adapter.getOpenPositions();
  }

  /** Close all open positions across the primary adapter. */
  async closeAllPositions(): Promise<OrderResult[]> {
    this.log("info", "closeAllPositions", undefined, {});

    if (this.config.dryRun) {
      this.log("info", "closeAllPositions", undefined, { dryRun: true, closed: 0 });
      return [];
    }

    const adapter = this.getAdapter(this.config.primaryExchange);
    if (!adapter) throw new Error(`Primary adapter not found: ${this.config.primaryExchange}`);

    const positions = await adapter.getOpenPositions();
    const results: OrderResult[] = [];

    for (const pos of positions) {
      try {
        const result = await adapter.closePosition(pos.symbol, pos.quantity);
        results.push(result);
        this.log("info", "closePosition", adapter.id, {
          symbol: pos.symbol,
          quantity: pos.quantity,
          status: result.status,
        });
      } catch (err) {
        this.log("error", "closePosition", adapter.id, {
          symbol: pos.symbol,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
  }

  // ── Account ──

  /** Get the account balance from the primary adapter. */
  async getBalance(exchangeId?: string): Promise<AccountBalance> {
    const adapterId = exchangeId ?? this.config.primaryExchange;
    const adapter = this.getAdapter(adapterId);
    if (!adapter) throw new Error(`Adapter not found: ${adapterId}`);
    return adapter.getBalance();
  }

  /**
   * Composite summary: balance + positions + total unrealised P&L.
   * Useful for strategy risk checks before placing an order.
   */
  async getAccountSummary(): Promise<AccountSummary> {
    const adapter = this.getAdapter(this.config.primaryExchange);
    if (!adapter) {
      return {
        balance: { totalBalance: 0, availableBalance: 0, unrealizedPnl: 0, marginUsed: 0, currency: "USD" },
        positions: [],
        totalUnrealizedPnl: 0,
        connectedExchanges: [],
      };
    }

    const [balance, positions] = await Promise.all([
      adapter.getBalance(),
      adapter.getOpenPositions(),
    ]);

    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

    return {
      balance,
      positions,
      totalUnrealizedPnl,
      connectedExchanges: this.getConnectedExchangeIds(),
    };
  }

  // ── Market data ──

  /** Get the current ticker from the primary adapter. */
  async getTicker(symbol: string, exchangeId?: string): Promise<Ticker> {
    const adapterId = exchangeId ?? this.config.primaryExchange;
    const adapter = this.getAdapter(adapterId);
    if (!adapter) throw new Error(`Adapter not found: ${adapterId}`);
    return adapter.getTicker(symbol);
  }

  // ── Status ──

  /** True when the primary adapter (or fallback) is connected. */
  isReady(): boolean {
    if (this.getAdapter(this.config.primaryExchange)?.isConnected()) return true;
    if (this.config.fallbackExchange && this.getAdapter(this.config.fallbackExchange)?.isConnected()) {
      return true;
    }
    return false;
  }

  /** List ids of all currently connected adapters. */
  getConnectedExchangeIds(): string[] {
    return Array.from(this.adapters.values())
      .filter((a) => a.isConnected())
      .map((a) => a.id);
  }

  /** Return the full log history (useful for audit / debugging). */
  getLogs(): GatewayLogEntry[] {
    return [...this.logs];
  }

  // ── Private helpers ──

  /** Resolve an adapter by its id string. */
  private getAdapter(id: string): ExchangeAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Route an order to the primary exchange; fall back on failure.
   * If both fail, throws the last error.
   */
  private async routeOrder(request: OrderRequest): Promise<OrderResult> {
    // ── Primary attempt ──
    const primary = this.getAdapter(this.config.primaryExchange);
    if (!primary?.isConnected()) {
      // Try fallback immediately if primary is down
      return this.tryFallback(request, new Error("Primary adapter not connected"));
    }

    try {
      const result = await primary.placeOrder(request);
      this.log("info", "routeOrder", primary.id, { orderId: result.id, status: result.status });
      return result;
    } catch (primaryErr) {
      this.log("warn", "routeOrder", primary.id, {
        message: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
      });
      return this.tryFallback(
        request,
        primaryErr instanceof Error ? primaryErr : new Error(String(primaryErr)),
      );
    }
  }

  /** Attempt to send the order to the fallback exchange. */
  private async tryFallback(request: OrderRequest, primaryError: Error): Promise<OrderResult> {
    if (!this.config.fallbackExchange) {
      throw primaryError;
    }

    const fallback = this.getAdapter(this.config.fallbackExchange);
    if (!fallback?.isConnected()) {
      throw new Error(
        `Both primary (${this.config.primaryExchange}) and fallback (${this.config.fallbackExchange}) failed. Last error: ${primaryError.message}`,
      );
    }

    try {
      const result = await fallback.placeOrder(request);
      this.log("info", "routeOrder", fallback.id, {
        orderId: result.id,
        status: result.status,
        fallback: true,
      });
      return result;
    } catch (fallbackErr) {
      throw new Error(
        `Both primary and fallback failed. Primary: ${primaryError.message} | Fallback: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`,
      );
    }
  }

  /** Simulate an order without hitting any real exchange. */
  private dryRunOrder(request: OrderRequest): OrderResult {
    const id = request.clientOrderId ?? `dry-${Date.now()}`;
    const price = request.price ?? 0;

    const result: OrderResult = {
      id,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      quantity: request.quantity,
      price,
      status: "filled",
      filledAt: new Date().toISOString(),
      fee: 0,
    };

    this.log("info", "dryRunOrder", undefined, { ...result, dryRun: true });
    return result;
  }

  /** Append a structured log entry. */
  private log(
    level: GatewayLogEntry["level"],
    action: string,
    exchange: string | undefined,
    details: Record<string, unknown>,
  ): void {
    const entry: GatewayLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      exchange,
      dryRun: this.config.dryRun,
      details,
    };
    this.logs.push(entry);

    // Also emit to console for server-side visibility
    const prefix = `[AgentGateway${exchange ? `:${exchange}` : ""}]`;
    if (level === "error") {
      console.error(prefix, action, details);
    } else if (level === "warn") {
      console.warn(prefix, action, details);
    } else {
      console.log(prefix, action, details);
    }
  }
}
