// ============================================================================
// VIXOR useDiscoverLivePrices — REAL-TIME price overlay for Discover
// ============================================================================
// ALL prices are live via WebSocket — zero polling, zero API calls.
//   - Binance-listed tokens: Binance WebSocket (instant)
//   - DEX/meme tokens: DexScreener WebSocket (instant)
// Prices update in-place with no visible refresh for the user.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BinanceWS, type LivePrice } from "./binance-ws";
import { DexScreenerWS, type DexPrice } from "./dexscreener-ws";

// Tokens that trade on Binance — they get real-time WebSocket prices
const BINANCE_SYMBOLS = new Set([
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "DOT", "LINK",
  "MATIC", "UNI", "LTC", "BCH", "ATOM", "FIL", "APT", "ARB", "OP", "NEAR",
  "AAVE", "MKR", "SNX", "GRT", "INJ", "SUI", "SEI", "TIA", "JUP", "WIF",
  "PEPE", "FLOKI", "BONK", "SHIB", "RENDER", "FET", "AGIX", "OCEAN", "ICP",
  "HBAR", "ALGO", "XTZ", "FTM", "SAND", "MANA", "GALA", "AXS", "APE", "DYDX",
  "CRV", "LDO", "RPL", "CKB", "TRX", "TON", "KAS", "RUNE", "THETA", "EGLD",
  "FLOW", "XLM", "VET", "ALPHA", "ONE", "GAS",
]);

function toBinanceSymbol(tokenSymbol: string): string | null {
  const clean = tokenSymbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (BINANCE_SYMBOLS.has(clean)) return `${clean}USDT`;
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
  tokens: Array<{ symbol: string; chain?: string; chainId?: string; pairAddress?: string }>;
  enabled?: boolean;
}

/**
 * useDiscoverLivePrices — ALL WebSocket, ZERO polling.
 *
 * Binance tokens → BinanceWS (wss://stream.binance.com)
 * DEX tokens    → DexScreenerWS (wss://ws.dexscreener.com)
 */
export function useDiscoverLivePrices(options: UseDiscoverLivePricesOptions) {
  const { tokens, enabled = true } = options;

  const [overlay, setOverlay] = useState<LivePriceOverlay>({});
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  // Separate tokens into Binance WS and DEX WS
  const { wsSymbols, wsSymbolMap, dexPairs, dexSymbolMap } = useMemo(() => {
    const wsSymbols: string[] = [];
    const wsSymbolMap = new Map<string, string>(); // binanceSymbol → discoverSymbol
    const dexPairs: Array<{ chainId: string; pairAddress: string }> = [];
    const dexSymbolMap = new Map<string, string>(); // "chainId:pairAddress" → discoverSymbol

    for (const token of tokens) {
      const binanceSym = toBinanceSymbol(token.symbol);
      if (binanceSym) {
        wsSymbols.push(binanceSym);
        wsSymbolMap.set(binanceSym, token.symbol);
      } else if (token.chainId && token.pairAddress) {
        const key = `${token.chainId}:${token.pairAddress}`;
        dexPairs.push({ chainId: token.chainId, pairAddress: token.pairAddress });
        dexSymbolMap.set(key, token.symbol);
      }
    }

    return { wsSymbols, wsSymbolMap, dexPairs, dexSymbolMap };
  }, [tokens]);

  // ── Binance WebSocket ──
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
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, wsSymbols.join(",")]);

  // ── DexScreener WebSocket (REAL-TIME, not polling) ──
  useEffect(() => {
    if (!enabled || dexPairs.length === 0) return;

    const ws = DexScreenerWS.getInstance();

    const unsub = ws.subscribe(
      dexPairs,
      (updatedPrices: Map<string, DexPrice>) => {
        setOverlay((prev) => {
          const next = { ...prev };
          for (const [key, dexPrice] of updatedPrices) {
            const discoverSymbol = dexSymbolMap.get(key);
            if (discoverSymbol && dexPrice.price > 0) {
              next[discoverSymbol] = {
                price: dexPrice.price,
                change24h: dexPrice.change24h,
                timestamp: dexPrice.timestamp,
              };
            }
          }
          return next;
        });
      },
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, dexPairs.map((p) => `${p.chainId}:${p.pairAddress}`).join(",")]);

  const getLivePrice = useCallback(
    (symbol: string): { price: number; change24h: number; timestamp: number } | undefined => {
      return overlayRef.current[symbol];
    },
    [],
  );

  return { overlay, getLivePrice };
}