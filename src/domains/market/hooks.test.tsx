// ============================================================================
// VIXOR Market Hooks — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── Mock factories (hoisted) ──────────────────────────────────────────────

const { mockGetMarketPrices, mockGetOHLCV, mockGetMarketNews, mockGetEconomicCalendar } =
  vi.hoisted(() => ({
    mockGetMarketPrices: vi.fn(),
    mockGetOHLCV: vi.fn(),
    mockGetMarketNews: vi.fn(),
    mockGetEconomicCalendar: vi.fn(),
  }));

vi.mock("@/domains/market", () => ({
  getMarketPrices: mockGetMarketPrices,
  getOHLCV: mockGetOHLCV,
  getMarketNews: mockGetMarketNews,
  getEconomicCalendar: mockGetEconomicCalendar,
}));

vi.mock("@/shared/hooks/use-stable-server-fn", () => ({
  useStableServerFn: (fn: any) => fn,
}));

// Import hooks after mocks
import { marketKeys, useMarketPrices, useOHLCV, useMarketNews, useEconomicCalendar } from "./hooks";

// ── Test helpers ──────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("marketKeys", () => {
  it("1. prices key returns correct array", () => {
    expect(marketKeys.prices()).toEqual(["marketPrices"]);
  });

  it("2. ohlcv key includes pair and timeframe", () => {
    expect(marketKeys.ohlcv("BTC/USDT", "1H")).toEqual(["ohlcv", "BTC/USDT", "1H"]);
  });

  it("3. news key includes optional symbol", () => {
    expect(marketKeys.news()).toEqual(["marketNews", undefined]);
    expect(marketKeys.news("BTC")).toEqual(["marketNews", "BTC"]);
  });

  it("4. calendar key returns correct array", () => {
    expect(marketKeys.calendar()).toEqual(["economicCalendar"]);
  });
});

describe("useMarketPrices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("5. fetches and returns market prices", async () => {
    const prices = [
      { pair: "BTC/USDT", price: 105000, change24h: 2.5, source: "binance", timestamp: Date.now() },
    ];
    mockGetMarketPrices.mockResolvedValue(prices);

    const { result } = renderHook(() => useMarketPrices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(prices);
    expect(mockGetMarketPrices).toHaveBeenCalled();
  });
});

describe("useOHLCV", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("6. fetches OHLCV data for a pair", async () => {
    const ohlcv = {
      open: 104000,
      high: 106000,
      low: 103000,
      close: 105000,
      volume: 1000,
      source: "binance",
    };
    mockGetOHLCV.mockResolvedValue(ohlcv);

    const { result } = renderHook(() => useOHLCV("BTC/USDT", "1H"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetOHLCV).toHaveBeenCalledWith({
      data: { pair: "BTC/USDT", interval: "1H" },
    });
  });

  it("7. is disabled when pair is empty", () => {
    mockGetOHLCV.mockResolvedValue(null);

    const { result } = renderHook(() => useOHLCV("", "1H"), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetOHLCV).not.toHaveBeenCalled();
  });
});

describe("useMarketNews", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("8. fetches news with default category", async () => {
    const news = [
      {
        id: 1,
        title: "BTC breaks $100k",
        summary: "...",
        url: "",
        source: "reuters",
        time: Date.now(),
        image: "",
      },
    ];
    mockGetMarketNews.mockResolvedValue(news);

    const { result } = renderHook(() => useMarketNews(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMarketNews).toHaveBeenCalledWith({
      data: { category: "general" },
    });
  });

  it("9. passes symbol as category", async () => {
    mockGetMarketNews.mockResolvedValue([]);

    const { result } = renderHook(() => useMarketNews("crypto"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMarketNews).toHaveBeenCalledWith({
      data: { category: "crypto" },
    });
  });
});

describe("useEconomicCalendar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("10. fetches calendar with 7 day default", async () => {
    const events = [
      {
        id: "e1",
        title: "NFP",
        country: "US",
        currency: "USD",
        impact: "high",
        date: "2026-01-10",
      },
    ];
    mockGetEconomicCalendar.mockResolvedValue(events);

    const { result } = renderHook(() => useEconomicCalendar(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetEconomicCalendar).toHaveBeenCalledWith({
      data: { days: 7 },
    });
  });
});
