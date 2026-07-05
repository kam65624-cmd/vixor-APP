// ============================================================================
// VIXOR useLivePrices — React Hook for Real-Time Crypto Prices
// ============================================================================
// Uses Binance WebSocket (client-side, no API key) for crypto pairs.
// Falls back to REST polling via getMarketPrices for non-crypto pairs.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BinanceWS, type LivePrice } from "./binance-ws";
import { AssetRegistry } from "@/shared/asset-registry";

export type FeedStatus = "idle" | "connecting" | "connected" | "disconnected" | "error" | "polling";

export interface UseLivePricesOptions {
  /** Which pairs to track. Defaults to all popular crypto assets. */
  pairs?: string[];
  /** Enable/disable the feed. Default: true. */
  enabled?: boolean;
  /** REST poll interval in ms for non-WS pairs (TwelveData/Finnhub). Default: 30000. */
  pollInterval?: number;
}

export interface UseLivePricesReturn {
  /** Map of Binance symbol → LivePrice */
  prices: Map<string, LivePrice>;
  /** Array of all live prices */
  priceList: LivePrice[];
  /** Current connection status */
  status: FeedStatus;
  /** Get price for a specific canonical pair, e.g. "BTC/USDT" */
  getPrice: (pair: string) => LivePrice | undefined;
  /** Last updated timestamp */
  lastUpdate: number;
  /** Number of connected streams */
  streamCount: number;
}

/**
 * useLivePrices — Primary hook for real-time price data.
 *
 * For crypto pairs with Binance symbols: streams via WebSocket (instant).
 * For forex/commodities: polls via REST (requires API keys on server).
 *
 * @example
 * ```tsx
 * const { prices, status, getPrice } = useLivePrices({
 *   pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
 * });
 *
 * const btcPrice = getPrice('BTC/USDT');
 * if (btcPrice) {
 *   console.log(`BTC: $${btcPrice.price} (${btcPrice.change24h}%)`);
 * }
 * ```
 */
export function useLivePrices(options: UseLivePricesOptions = {}): UseLivePricesReturn {
  const { pairs: requestedPairs, enabled = true, pollInterval = 30000 } = options;

  // Resolve pairs: use provided, or default to popular crypto
  const pairs = useMemo(() => {
    if (requestedPairs) return requestedPairs;
    return AssetRegistry.popular()
      .filter(
        (a: { active: boolean; category: string; symbols: { binance?: string } }) =>
          a.active && a.category === "crypto" && a.symbols.binance,
      )
      .map((a: { pair: string }) => a.pair);
  }, [requestedPairs]);

  // Separate crypto (WS) from non-crypto (polling)
  const { wsSymbols, wsPairMap, nonCryptoPairs } = useMemo(() => {
    const wsSymbols: string[] = [];
    const wsPairMap = new Map<string, string>(); // binanceSymbol → canonicalPair
    const nonCryptoPairs: string[] = [];

    for (const pair of pairs) {
      const asset = AssetRegistry.get(pair);
      if (asset?.symbols.binance && asset.category === "crypto") {
        wsSymbols.push(asset.symbols.binance);
        wsPairMap.set(asset.symbols.binance, pair);
      } else {
        nonCryptoPairs.push(pair);
      }
    }

    return { wsSymbols, wsPairMap, nonCryptoPairs };
  }, [pairs]);

  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [lastUpdate, setLastUpdate] = useState(0);
  const pricesRef = useRef(prices);
  pricesRef.current = prices;

  // WebSocket connection
  useEffect(() => {
    if (!enabled || wsSymbols.length === 0) return;

    const ws = BinanceWS.getInstance();

    const unsubPrices = ws.subscribe(
      wsSymbols,
      (updatedPrices) => {
        setPrices(new Map(updatedPrices));
        setLastUpdate(Date.now());
      },
      (wsStatus) => {
        switch (wsStatus) {
          case "connecting":
            setStatus("connecting");
            break;
          case "connected":
            setStatus("connected");
            break;
          case "disconnected":
            setStatus("disconnected");
            break;
          case "error":
            setStatus("error");
            break;
        }
      },
    );

    return () => {
      unsubPrices();
      // Don't destroy singleton — other components might be using it
    };
  }, [enabled, wsSymbols.join(",")]);

  // REST polling for non-crypto pairs (forex, gold, etc.)
  useEffect(() => {
    if (!enabled || nonCryptoPairs.length === 0) return;

    let active = true;
    const fetchPrices = async () => {
      try {
        // Use existing server function for non-crypto prices
        const { getMarketPrices } = await import("@/domains/market/functions");
        const result = await getMarketPrices();
        if (!active || !result) return;

        setPrices((prev) => {
          const next = new Map(prev);
          for (const [pair, data] of Object.entries(result)) {
            if (typeof data === "object" && data !== null && "price" in data) {
              const d = data as {
                price: number;
                change24h?: number;
                high24h?: number;
                low24h?: number;
                volume24h?: number;
              };
              const asset = AssetRegistry.get(pair);
              const symbol = asset?.symbols.binance || pair.replace("/", "");
              next.set(symbol, {
                pair,
                symbol,
                price: d.price,
                change24h: d.change24h ?? 0,
                high24h: d.high24h ?? 0,
                low24h: d.low24h ?? 0,
                volume24h: d.volume24h ?? 0,
                quoteVolume24h: 0,
                open24h: 0,
                timestamp: Date.now(),
              });
            }
          }
          return next;
        });
        setLastUpdate(Date.now());
        if (status === "idle") setStatus("polling");
      } catch {
        // Silently fail — REST polls are best-effort
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, pollInterval);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [enabled, nonCryptoPairs.join(","), pollInterval, status]);

  const getPrice = useCallback((pair: string): LivePrice | undefined => {
    const asset = AssetRegistry.get(pair);
    const symbol = asset?.symbols.binance || pair.replace("/", "");
    return pricesRef.current.get(symbol);
  }, []);

  const priceList = useMemo(() => Array.from(prices.values()), [prices]);
  const streamCount = prices.size;

  return { prices, priceList, status, getPrice, lastUpdate, streamCount };
}

export { type LivePrice } from "./binance-ws";
