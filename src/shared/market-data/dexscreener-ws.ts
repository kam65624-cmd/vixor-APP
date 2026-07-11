// ============================================================================
// VIXOR DexScreener WebSocket — Client-Side Live DEX Price Streaming
// ============================================================================
// Connects to wss://ws.dexscreener.com for real-time DEX pair updates.
// Mirrors BinanceWS pattern for consistent integration.
// ============================================================================

export interface DexPrice {
  /** Key: "chainId:pairAddress" */
  key: string;
  chainId: string;
  pairAddress: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
  marketCap: number;
  timestamp: number;
}

type PriceCallback = (prices: Map<string, DexPrice>) => void;
type StatusCallback = (status: "connecting" | "connected" | "disconnected" | "error") => void;

const DEX_WS_URL = "wss://ws.dexscreener.com";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * DexScreenerWS — Singleton WebSocket for real-time DEX pair updates.
 *
 * Usage:
 *   const ws = DexScreenerWS.getInstance();
 *   const unsub = ws.subscribe(
 *     [{ chainId: "solana", pairAddress: "0x..." }],
 *     (prices) => { ... }
 *   );
 *   // later: unsub();
 */
export class DexScreenerWS {
  private static instance: DexScreenerWS | null = null;
  private ws: WebSocket | null = null;
  private pairs = new Map<string, { chainId: string; pairAddress: string }>();
  private priceCallbacks = new Set<PriceCallback>();
  private statusCallbacks = new Set<StatusCallback>();
  private prices = new Map<string, DexPrice>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = RECONNECT_DELAY_MS;
  private isDestroyed = false;
  private status: "connecting" | "connected" | "disconnected" | "error" = "disconnected";
  private subscribedPairs = new Set<string>(); // tracks what server knows

  private constructor() {}

  static getInstance(): DexScreenerWS {
    if (!DexScreenerWS.instance) {
      DexScreenerWS.instance = new DexScreenerWS();
    }
    return DexScreenerWS.instance;
  }

  /**
   * Subscribe to live price updates for DEX pairs.
   * @param tokens - Array of { chainId, pairAddress }
   * @param onPrices - Callback with full price map on every update
   * @param onStatus - Optional status callback
   * @returns Unsubscribe function
   */
  subscribe(
    tokens: Array<{ chainId: string; pairAddress: string }>,
    onPrices: PriceCallback,
    onStatus?: StatusCallback,
  ): () => void {
    if (onPrices) this.priceCallbacks.add(onPrices);
    if (onStatus) {
      this.statusCallbacks.add(onStatus);
      onStatus(this.status);
    }

    let hasNew = false;
    for (const t of tokens) {
      const key = `${t.chainId}:${t.pairAddress}`;
      if (!this.pairs.has(key)) {
        this.pairs.set(key, t);
        hasNew = true;
      }
    }

    if (hasNew || !this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe();
    }

    return () => {
      this.priceCallbacks.delete(onPrices);
      if (onStatus) this.statusCallbacks.delete(onStatus);
      if (this.priceCallbacks.size === 0) {
        this.close();
      }
    };
  }

  /** Get current cached prices */
  getPrices(): Map<string, DexPrice> {
    return this.prices;
  }

  /** Get price for a specific chainId:pairAddress key */
  getPrice(key: string): DexPrice | undefined {
    return this.prices.get(key);
  }

  /** Close connection and cleanup */
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.subscribedPairs.clear();
    if (this.priceCallbacks.size === 0) {
      this.pairs.clear();
    }
    this.setStatus("disconnected");
  }

  private connect(): void {
    if (this.isDestroyed) return;
    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(DEX_WS_URL);

      this.ws.onopen = () => {
        this.reconnectDelay = RECONNECT_DELAY_MS;
        this.setStatus("connected");
        this.sendSubscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.channel === "pairs" && msg.event === "updated" && msg.data) {
            this.handlePairUpdate(msg.data);
          }
        } catch {
          // Ignore malformed
        }
      };

      this.ws.onerror = () => {
        this.setStatus("error");
      };

      this.ws.onclose = () => {
        this.setStatus("disconnected");
        this.subscribedPairs.clear();
        this.scheduleReconnect();
      };
    } catch {
      this.setStatus("error");
      this.scheduleReconnect();
    }
  }

  private handlePairUpdate(data: Record<string, unknown>): void {
    const chainId = data.chainId as string;
    const pairAddress = data.pairAddress as string;
    if (!chainId || !pairAddress) return;

    const priceUsd = data.priceUsd != null ? parseFloat(String(data.priceUsd)) : 0;
    if (priceUsd <= 0) return;

    const key = `${chainId}:${pairAddress}`;
    const priceChange = data.priceChange as Record<string, number> | null;
    const volume = data.volume as Record<string, number> | null;
    const liquidity = data.liquidity as { usd?: number | null } | null;

    const dexPrice: DexPrice = {
      key,
      chainId,
      pairAddress,
      price: priceUsd,
      change24h: priceChange?.h24 ?? 0,
      volume24h: volume?.h24 ?? 0,
      liquidity: liquidity?.usd ?? 0,
      fdv: (data.fdv as number) ?? 0,
      marketCap: (data.marketCap as number) ?? 0,
      timestamp: Date.now(),
    };

    this.prices.set(key, dexPrice);
    this.notifyPriceCallbacks();
  }

  private sendSubscribe(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    // Find pairs not yet subscribed on server
    const newPairs: string[] = [];
    for (const [key] of this.pairs) {
      if (!this.subscribedPairs.has(key)) {
        newPairs.push(key);
      }
    }

    if (newPairs.length === 0) return;

    this.ws.send(
      JSON.stringify({
        channel: "pairs",
        event: "subscribe",
        payload: { pairs: newPairs },
      }),
    );

    for (const key of newPairs) {
      this.subscribedPairs.add(key);
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.priceCallbacks.size === 0) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, MAX_RECONNECT_DELAY_MS);
  }

  private setStatus(status: "connecting" | "connected" | "disconnected" | "error"): void {
    this.status = status;
    for (const cb of this.statusCallbacks) {
      try {
        cb(status);
      } catch {
        /* ignore */
      }
    }
  }

  private notifyPriceCallbacks(): void {
    for (const cb of this.priceCallbacks) {
      try {
        cb(this.prices);
      } catch {
        /* ignore */
      }
    }
  }

  /** Destroy singleton */
  destroy(): void {
    this.isDestroyed = true;
    this.close();
    DexScreenerWS.instance = null;
  }
}
