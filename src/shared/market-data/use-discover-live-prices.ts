// ============================================================================
// VIXOR useDiscoverLivePrices — Silent real-time price overlay for Discover
// ============================================================================
// Merges live Binance WS + DexScreener polling prices into discover tokens.
// Prices update in-place with zero visible refresh for the user.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BinanceWS, type LivePrice } from "./binance-ws";
import { getPair } from "./dexscreener";

// Tokens that trade on Binance — they get real-time WebSocket prices
const BINANCE_SYMBOLS = new Set([
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "DOT",
  "LINK",
  "MATIC",
  "UNI",
  "LTC",
  "BCH",
  "ATOM",
  "FIL",
  "APT",
  "ARB",
  "OP",
  "NEAR",
  "AAVE",
  "MKR",
  "SNX",
  "GRT",
  "INJ",
  "SUI",
  "SEI",
  "TIA",
  "JUP",
  "WIF",
  "PEPE",
  "FLOKI",
  "BONK",
  "SHIB",
  "RENDER",
  "FET",
  "AGIX",
  "OCEAN",
  "ICP",
  "HBAR",
  "ALGO",
  "XTZ",
  "FTM",
  "SAND",
  "MANA",
  "GALA",
  "AXS",
  "APE",
  "DYDX",
  "CRV",
  "LDO",
  "RPL",
  "CKB",
  "TRX",
  "TON",
  "KAS",
  "RUNE",
  "THETA",
  "EGLD",
  "FLOW",
  "XLM",
  "VET",
  "ALPHA",
  "ONE",
  "GAS",
  "FTM",
]);

/** Check if a token symbol has a Binance USDT pair */
function toBinanceSymbol(tokenSymbol: string): string | null {
  const clean = tokenSymbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (BINANCE_SYMBOLS.has(clean)) {
    return `${clean}USDT`;
  }
  return null;
}

export interface LivePriceOverlay {
  [tokenSymbol: string]: {
    price: number;
    change24h: number;
    timestamp: number;
  };
}

interface UseDiscoverLivePricesOptions {
  /** Array of token symbols currently visible on discover */
  tokens: Array<{ symbol: string; chain?: string; chainId?: string; pairAddress?: string }>;
  /** Enable/disable live updates. Default: true */
  enabled?: boolean;
  /** DexScreener poll interval for non-Binance tokens (ms). Default: 10000 */
  dexPollInterval?: number;
}

/**
 * useDiscoverLivePrices — Returns a price overlay map keyed by token symbol.
 * Merge into your token list to show live prices silently.
 *
 * - Binance-listed tokens: real-time WebSocket (instant, no API calls)
 * - DEX/meme tokens: DexScreener REST polling (10s interval)
 * - Prices update in-place with no visible refresh
 */
export function useDiscoverLivePrices(options: UseDiscoverLivePricesOptions) {
  const { tokens, enabled = true, dexPollInterval = 10_000 } = options;

  const [overlay, setOverlay] = useState<LivePriceOverlay>({});
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  // Separate tokens into Binance (WS) and DEX (polling)
  const { wsSymbols, wsSymbolMap, dexTokens } = useMemo(() => {
    const wsSymbols: string[] = [];
    const wsSymbolMap = new Map<string, string>(); // binanceSymbol → discoverTokenSymbol
    const dexTokens: Array<{
      symbol: string;
      chain?: string;
      chainId?: string;
      pairAddress?: string;
    }> = [];

    for (const token of tokens) {
      const binanceSym = toBinanceSymbol(token.symbol);
      if (binanceSym) {
        wsSymbols.push(binanceSym);
        wsSymbolMap.set(binanceSym, token.symbol);
      } else if (token.chainId && token.pairAddress) {
        dexTokens.push(token);
      }
    }

    return { wsSymbols, wsSymbolMap, dexTokens };
  }, [tokens]);

  // ── Binance WebSocket for listed tokens ──
  useEffect(() => {
    if (!enabled || wsSymbols.length === 0) return;

    const ws = BinanceWS.getInstance();

    const unsub = ws.subscribe(
      wsSymbols,
      (updatedPrices: Map<string, LivePrice>) => {
        setOverlay((prev) => {
          const next = { ...prev };
          for (const [binanceSymbol, livePrice] of updatedPrices) {
            const discoverSymbol = wsSymbolMap.get(binanceSymbol);
            if (discoverSymbol && livePrice.price > 0) {
              next[discoverSymbol] = {
                price: livePrice.price,
                change24h: livePrice.change24h,
                timestamp: livePrice.timestamp,
              };
            }
          }
          return next;
        });
      },
      undefined, // no status callback needed
    );

    return () => {
      unsub();
    };
  }, [enabled, wsSymbols.join(",")]);

  // ── DexScreener polling for DEX/meme tokens ──
  useEffect(() => {
    if (!enabled || dexTokens.length === 0) return;

    let active = true;

    const fetchDexPrices = async () => {
      // Fetch in parallel with concurrency limit of 5
      const batchSize = 5;
      const updates: LivePriceOverlay = {};

      for (let i = 0; i < dexTokens.length; i += batchSize) {
        if (!active) break;
        const batch = dexTokens.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (token) => {
            if (!token.chainId || !token.pairAddress) return null;
            const result = await getTokenPrice(token.chainId, token.pairAddress);
            if (result?.priceUsd) {
              return {
                symbol: token.symbol,
                price: result.priceUsd,
                change24h: result.change24h ?? 0,
              };
            }
            return null;
          }),
        );

        for (const r of results) {
          if (r.status === "fulfilled" && r.value) {
            updates[r.value.symbol] = {
              price: r.value.price,
              change24h: r.value.change24h,
              timestamp: Date.now(),
            };
          }
        }
      }

      if (active && Object.keys(updates).length > 0) {
        setOverlay((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchDexPrices();
    const interval = setInterval(fetchDexPrices, dexPollInterval);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [enabled, dexTokens.length, dexPollInterval]);

  /**
   * Get live price for a specific token symbol.
   * Returns undefined if no live price is available yet.
   */
  const getLivePrice = useCallback(
    (symbol: string): { price: number; change24h: number; timestamp: number } | undefined => {
      return overlayRef.current[symbol];
    },
    [],
  );

  return { overlay, getLivePrice };
}
