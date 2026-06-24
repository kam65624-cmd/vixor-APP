// ============================================================================
// VIXOR Binance WebSocket Client — Client-Side Live Price Streaming
// ============================================================================
// Connects directly to Binance's public WebSocket (no API key needed).
// Used by useLivePrices hook for real-time crypto price updates.
// Works on Vercel since the WS connection is client-side.
// ============================================================================

export interface BinanceTickerPayload {
  /** Stream name, e.g. "btcusdt@ticker" */
  s: string;        // Symbol, e.g. "BTCUSDT"
  c: string;        // Last price
  o: string;        // Open price
  h: string;        // 24h High
  l: string;        // 24h Low
  v: string;        // 24h Volume (base asset)
  q: string;        // 24h Quote volume (USDT)
  P: string;        // 24h Price change percent
  p: string;        // 24h Price change absolute
  E: number;        // Event timestamp (ms)
}

export interface LivePrice {
  pair: string;           // Canonical pair, e.g. "BTC/USDT"
  symbol: string;         // Binance symbol, e.g. "BTCUSDT"
  price: number;          // Current price
  change24h: number;      // 24h price change percent
  high24h: number;        // 24h high
  low24h: number;         // 24h low
  volume24h: number;      // 24h volume (base)
  quoteVolume24h: number; // 24h volume in USDT
  open24h: number;        // 24h open price
  timestamp: number;      // Last update timestamp
}

type PriceCallback = (prices: Map<string, LivePrice>) => void;
type StatusCallback = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/stream';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;
const PING_INTERVAL_MS = 30000;

/**
 * BinanceWS — Singleton WebSocket manager for Binance live ticker streams.
 * 
 * Usage:
 *   const ws = BinanceWS.getInstance();
 *   ws.subscribe(['BTCUSDT', 'ETHUSDT'], (prices) => { ... });
 *   ws.unsubscribe();
 */
export class BinanceWS {
  private static instance: BinanceWS | null = null;
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, boolean>();
  private priceCallbacks = new Set<PriceCallback>();
  private statusCallbacks = new Set<StatusCallback>();
  private prices = new Map<string, LivePrice>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = RECONNECT_DELAY_MS;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;
  private status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  private constructor() {}

  static getInstance(): BinanceWS {
    if (!BinanceWS.instance) {
      BinanceWS.instance = new BinanceWS();
    }
    return BinanceWS.instance;
  }

  /**
   * Subscribe to live price streams for given Binance symbols.
   * Callbacks receive the full price map on every update.
   */
  subscribe(symbols: string[], onPrices: PriceCallback, onStatus?: StatusCallback): () => void {
    if (onPrices) this.priceCallbacks.add(onPrices);
    if (onStatus) {
      this.statusCallbacks.add(onStatus);
      // Immediately report current status
      onStatus(this.status);
    }

    // Add new symbols
    let hasNew = false;
    for (const sym of symbols) {
      if (!this.subscriptions.has(sym)) {
        this.subscriptions.set(sym, true);
        hasNew = true;
      }
    }

    if (hasNew || !this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      // Send subscribe message for new symbols
      this.sendSubscribe();
    }

    // Return unsubscribe function
    return () => {
      this.priceCallbacks.delete(onPrices);
      if (onStatus) this.statusCallbacks.delete(onStatus);
    };
  }

  /** Get current cached prices (synchronous) */
  getPrices(): Map<string, LivePrice> {
    return this.prices;
  }

  /** Get current price for a single symbol */
  getPrice(symbol: string): LivePrice | undefined {
    return this.prices.get(symbol);
  }

  /** Unsubscribe all listeners and close connection */
  unsubscribe(): void {
    this.priceCallbacks.clear();
    this.statusCallbacks.clear();
    this.close();
  }

  private connect(): void {
    if (this.isDestroyed) return;

    this.setStatus('connecting');

    const streams = Array.from(this.subscriptions.keys())
      .map(s => `${s.toLowerCase()}@ticker`)
      .join('/');

    const url = `${BINANCE_WS_BASE}?streams=${streams}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectDelay = RECONNECT_DELAY_MS;
        this.setStatus('connected');
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.data) {
            this.handleTicker(msg.data as BinanceTickerPayload);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onerror = () => {
        this.setStatus('error');
      };

      this.ws.onclose = () => {
        this.stopPing();
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    } catch {
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private handleTicker(data: BinanceTickerPayload): void {
    const symbol = data.s;
    const price: LivePrice = {
      pair: this.symbolToPair(symbol),
      symbol,
      price: parseFloat(data.c),
      change24h: parseFloat(data.P),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      volume24h: parseFloat(data.v),
      quoteVolume24h: parseFloat(data.q),
      open24h: parseFloat(data.o),
      timestamp: data.E,
    };

    this.prices.set(symbol, price);
    this.notifyPriceCallbacks();
  }

  private sendSubscribe(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const streams = Array.from(this.subscriptions.keys())
      .map(s => `${s.toLowerCase()}@ticker`);

    this.ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now(),
    }));
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.priceCallbacks.size === 0) return;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, MAX_RECONNECT_DELAY_MS);
  }

  private close(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.setStatus('disconnected');
  }

  private setStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.status = status;
    for (const cb of this.statusCallbacks) {
      try { cb(status); } catch { /* ignore */ }
    }
  }

  private notifyPriceCallbacks(): void {
    for (const cb of this.priceCallbacks) {
      try { cb(this.prices); } catch { /* ignore */ }
    }
  }

  private symbolToPair(symbol: string): string {
    // BTCUSDT → BTC/USDT, PEPEUSDT → PEPE/USDT, WIFUSDT → WIF/USDT
    const usdtIndex = symbol.lastIndexOf('USDT');
    if (usdtIndex > 0) {
      return `${symbol.slice(0, usdtIndex)}/USDT`;
    }
    return symbol;
  }

  /** Destroy singleton instance */
  destroy(): void {
    this.isDestroyed = true;
    this.close();
    BinanceWS.instance = null;
  }
}