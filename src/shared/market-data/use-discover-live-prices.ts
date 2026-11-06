// ============================================================================
// VIXOR useDiscoverLivePrices — REAL-TIME price overlay for Discover
// ============================================================================
// Binance-listed tokens use WebSocket; DEX/meme tokens use batched polling.
// Prices update in-place with no visible refresh for the user.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BinanceWS, type LivePrice } from "./binance-ws";
import { useCentralMarketStream } from "./use-central-market-stream";

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
]);

function toBinanceSymbol(tokenSymbol: string): string | null {
  const clean = tokenSymbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (BINANCE_SYMBOLS.has(clean)) return `${clean}USDT`;
  return null;
}

export interface LivePriceOverlay {
  [tokenKey: string]: {
    price: number;
    change24h: number;
    timestamp: number;
    volume24h?: number;
    marketCap?: number;
    liquidity?: number;
  };
}

export function getLivePriceKey(token: {
  symbol: string;
  chainId?: string;
  address?: string;
  pairAddress?: string;
}): string {
  if (token.chainId && token.address) return `${token.chainId}:${token.address}`;
  if (token.chainId && token.pairAddress) return `${token.chainId}:pair:${token.pairAddress}`;
  return `symbol:${token.symbol.toUpperCase()}`;
}

interface UseDiscoverLivePricesOptions {
  tokens: Array<{
    symbol: string;
    chain?: string;
    chainId?: string;
    address?: string;
    pairAddress?: string;
  }>;
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
  const centralCollectorEnabled = Boolean(import.meta.env.VITE_MARKET_COLLECTOR_URL);

  const [overlay, setOverlay] = useState<LivePriceOverlay>({});
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [pollingError, setPollingError] = useState<unknown>(null);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  const centralTokenMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const token of tokens) {
      if (token.chainId === "solana" && token.address) {
        map.set(token.address, getLivePriceKey(token));
      }
    }
    return map;
  }, [tokens]);

  useCentralMarketStream({
    addresses: [...centralTokenMap.keys()],
    enabled: enabled && centralCollectorEnabled,
    onSnapshot: (snapshot) => {
      const tokenKey = centralTokenMap.get(snapshot.address);
      if (!tokenKey || snapshot.price <= 0) return;
      setOverlay((prev) => ({
        ...prev,
        [tokenKey]: {
          price: snapshot.price,
          change24h: snapshot.change24h,
          timestamp: snapshot.updatedAt,
        },
      }));
      setLastUpdate(snapshot.updatedAt);
      setPollingError(null);
    },
    onStale: (address) => {
      const tokenKey = centralTokenMap.get(address);
      if (!tokenKey) return;
      setOverlay((prev) => {
        if (!(tokenKey in prev)) return prev;
        const next = { ...prev };
        delete next[tokenKey];
        return next;
      });
    },
  });

  // Separate tokens into Binance WS and DEX WS
  const { wsSymbols, wsSymbolMap, dexPairs, dexSymbolMap } = useMemo(() => {
    const wsSymbols: string[] = [];
    const wsSymbolMap = new Map<string, string>(); // binanceSymbol → discoverSymbol
    const dexPairs: Array<{ chainId: string; pairAddress: string }> = [];
    const dexSymbolMap = new Map<string, string>(); // "chainId:pairAddress" → overlay key

    for (const token of tokens) {
      const binanceSym = toBinanceSymbol(token.symbol);
      const liveKey = getLivePriceKey(token);
      if (binanceSym && !token.pairAddress) {
        wsSymbols.push(binanceSym);
        wsSymbolMap.set(binanceSym, liveKey);
      } else if (
        token.chainId &&
        token.pairAddress &&
        !(token.chainId === "solana" && token.address)
      ) {
        const key = `${token.chainId}:${token.pairAddress}`;
        dexPairs.push({ chainId: token.chainId, pairAddress: token.pairAddress });
        dexSymbolMap.set(key, liveKey);
      }
    }

    return { wsSymbols, wsSymbolMap, dexPairs, dexSymbolMap };
  }, [tokens]);

  // ── Binance WebSocket ──
  useEffect(() => {
    if (!enabled || wsSymbols.length === 0) return;

    const ws = BinanceWS.getInstance();
    const unsub = ws.subscribe(wsSymbols, (updatedPrices: Map<string, LivePrice>) => {
      setOverlay((prev) => {
        const next = { ...prev };
        for (const [binanceSymbol, livePrice] of updatedPrices) {
          const discoverSymbol = wsSymbolMap.get(binanceSymbol);
          if (discoverSymbol && livePrice.price > 0) {
            next[discoverSymbol] = {
              price: livePrice.price,
              change24h: livePrice.change24h,
              timestamp: livePrice.timestamp,
              volume24h: livePrice.quoteVolume24h,
            };
            setLastUpdate(livePrice.timestamp);
          }
        }
        return next;
      });
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, wsSymbols.join(",")]);

  // ── DexScreener batched polling ──
  // DexScreener does not expose a stable documented public browser WS. Use its
  // batched token endpoint so DEX rows keep moving even when WS/CSP/network
  // conditions differ between desktop and Telegram WebView.
  useEffect(() => {
    if (!enabled || dexPairs.length === 0) return;
    let cancelled = false;
    let requestInFlight = false;
    let controller: AbortController | null = null;
    const update = async () => {
      if (cancelled || document.hidden || requestInFlight) return;
      requestInFlight = true;
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      const byChain = new Map<string, string[]>();
      for (const pair of dexPairs) {
        const list = byChain.get(pair.chainId) ?? [];
        list.push(pair.pairAddress);
        byChain.set(pair.chainId, list);
      }
      let requestError: unknown = null;
      const results = await Promise.all(
        [...byChain.entries()].map(async ([chainId, pairAddresses]) => {
          const response = await fetch(
            `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddresses.join(",")}`,
            { signal: requestController.signal },
          );
          if (!response.ok) throw new Error(`DexScreener ${response.status}`);
          const json = await response.json();
          return Array.isArray(json.pairs) ? json.pairs : [];
        }),
      ).catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          requestError = error;
        }
        return [] as any[];
      });
      if (cancelled) return;
      if (requestError) {
        setPollingError(requestError);
        requestInFlight = false;
        return;
      }
      setPollingError(null);
      setLastUpdate(Date.now());
      setOverlay((prev) => {
        const next = { ...prev };
        for (const pair of results.flat()) {
          const key = dexSymbolMap.get(`${pair.chainId}:${pair.pairAddress}`);
          const price = Number(pair.priceUsd);
          if (!key || !Number.isFinite(price) || price <= 0) continue;
          next[key] = {
            price,
            change24h: Number(pair.priceChange?.h24 ?? 0),
            timestamp: Date.now(),
            volume24h: Number(pair.volume?.h24 ?? 0),
            marketCap: Number(pair.marketCap ?? pair.fdv ?? 0),
            liquidity: Number(pair.liquidity?.usd ?? 0),
          };
        }
        return next;
      });
      requestInFlight = false;
    };
    void update();
    const timer = window.setInterval(update, 3000);
    const onVisibility = () => {
      if (!document.hidden) void update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      controller?.abort();
      requestInFlight = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [centralCollectorEnabled, enabled, dexPairs, dexSymbolMap]);

  const getLivePrice = useCallback(
    (symbol: string): { price: number; change24h: number; timestamp: number } | undefined => {
      return overlayRef.current[symbol];
    },
    [],
  );

  return { overlay, getLivePrice, lastUpdate, error: pollingError };
}
