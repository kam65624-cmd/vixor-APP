// ============================================================================
// VIXOR Market — TanStack Query Hooks
// ============================================================================
// Provides useQuery wrappers around market data server functions.
// Uses useStableServerFn to prevent React #310 re-render loops.
// ============================================================================

import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMarketPrices, getOHLCV, getMarketNews, getEconomicCalendar } from "@/domains/market";

// ── Query Key Factory ──────────────────────────────────────────────────────

/** Query key factory for market data */
export const marketKeys = {
  prices: () => ["marketPrices"] as const,
  ohlcv: (pair: string, tf: string) => ["ohlcv", pair, tf] as const,
  news: (symbol?: string) => ["marketNews", symbol] as const,
  calendar: () => ["economicCalendar"] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Fetch market prices for popular pairs */
export function useMarketPrices() {
  const fetchPrices = useStableServerFn(getMarketPrices);

  return useQuery({
    queryKey: marketKeys.prices(),
    queryFn: fetchPrices,
    staleTime: 30_000,
  });
}

/** Fetch OHLCV data for a specific pair and timeframe */
export function useOHLCV(pair: string, timeframe: string) {
  const fetchOHLCV = useStableServerFn(getOHLCV);

  return useQuery({
    queryKey: marketKeys.ohlcv(pair, timeframe),
    queryFn: () => fetchOHLCV({ data: { pair, interval: timeframe } }),
    staleTime: 60_000,
    enabled: !!pair,
  });
}

/** Fetch market news */
export function useMarketNews(symbol?: string) {
  const fetchNews = useStableServerFn(getMarketNews);

  return useQuery({
    queryKey: marketKeys.news(symbol),
    queryFn: () => fetchNews({ data: { category: symbol ?? "general" } }),
    staleTime: 5 * 60_000,
  });
}

/** Fetch economic calendar events */
export function useEconomicCalendar() {
  const fetchCalendar = useStableServerFn(getEconomicCalendar);

  return useQuery({
    queryKey: marketKeys.calendar(),
    queryFn: () => fetchCalendar({ data: { days: 7 } }),
    staleTime: 15 * 60_000,
  });
}
