// ============================================================================
// VIXOR V2 — Market Data Gateway — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketDataGateway } from "./market-data-gateway";

// Mock the market functions module at the top level
const mockGetMarketPrices = vi.fn();
vi.mock("@/domains/market/functions", () => ({
  getMarketPrices: (...args: unknown[]) => mockGetMarketPrices(...args),
}));

describe("MarketDataGateway", () => {
  let gateway: MarketDataGateway;

  beforeEach(() => {
    vi.clearAllMocks();
    // Construct directly (constructor is accessible; singleton is only via getInstance)
    gateway = new MarketDataGateway(30_000);
  });

  describe("cache hit returns cached data", () => {
    it("returns cached quote within TTL", async () => {
      mockGetMarketPrices.mockResolvedValue([
        {
          symbol: "BTCUSDT",
          pair: "BTC/USDT",
          price: 65000,
          change24h: 2.5,
          source: "binance",
          timestamp: Date.now(),
        },
      ]);

      // First call fetches and caches
      const quote1 = await gateway.getQuote("BTC/USDT");
      expect(quote1.price).toBe(65000);

      // Second call should return cached data (no additional fetch)
      const quote2 = await gateway.getQuote("BTC/USDT");
      expect(quote2.price).toBe(65000);
      // getMarketPrices should be called only once (first call)
      expect(mockGetMarketPrices).toHaveBeenCalledTimes(1);
    });
  });

  describe("cache miss fetches and normalizes", () => {
    it("fetches from server and normalizes on cache miss", async () => {
      mockGetMarketPrices.mockResolvedValue([
        {
          symbol: "ETHUSDT",
          pair: "ETH/USDT",
          price: 3500,
          change24h: 1.2,
          high24h: 3600,
          low24h: 3400,
          volume24h: 50000,
          source: "binance",
          timestamp: Date.now(),
        },
      ]);

      const quote = await gateway.getQuote("ETH/USDT");

      expect(quote.pair).toBe("ETH/USDT");
      expect(quote.price).toBe(3500);
      expect(quote.change24hPct).toBe(1.2);
      expect(quote.high24h).toBe(3600);
      expect(quote.low24h).toBe(3400);
      expect(quote.volume24h).toBe(50000);
      expect(quote.source).toBe("binance");
    });
  });

  describe("TTL expiration", () => {
    it("expires cache after TTL and refetches", async () => {
      mockGetMarketPrices.mockResolvedValue([
        {
          symbol: "SOLUSDT",
          pair: "SOL/USDT",
          price: 150,
          source: "binance",
          timestamp: Date.now(),
        },
      ]);

      // Create gateway with 1ms TTL for immediate expiration
      const ttlGateway = new MarketDataGateway(1);

      const quote = await ttlGateway.getQuote("SOL/USDT");
      expect(quote.price).toBe(150);

      // Wait for TTL to expire
      await new Promise((r) => setTimeout(r, 10));

      // Next call should fetch again (cache expired)
      const quote2 = await ttlGateway.getQuote("SOL/USDT");
      expect(quote2.price).toBe(150);
      expect(mockGetMarketPrices).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearCache", () => {
    it("clears all cached entries", async () => {
      mockGetMarketPrices.mockResolvedValue([
        {
          symbol: "BTCUSDT",
          pair: "BTC/USDT",
          price: 65000,
          source: "binance",
          timestamp: Date.now(),
        },
      ]);

      await gateway.getQuote("BTC/USDT");

      // Verify cached
      expect(gateway.getCachedPrice("BTC/USDT")).toBe(65000);

      // Clear
      gateway.clearCache();

      // Verify empty
      expect(gateway.getCachedPrice("BTC/USDT")).toBeUndefined();
    });
  });

  describe("getCachedPrice", () => {
    it("returns price for cached pair", async () => {
      mockGetMarketPrices.mockResolvedValue([
        {
          symbol: "BTCUSDT",
          pair: "BTC/USDT",
          price: 65000,
          source: "binance",
          timestamp: Date.now(),
        },
      ]);

      await gateway.getQuote("BTC/USDT");
      expect(gateway.getCachedPrice("BTC/USDT")).toBe(65000);
    });

    it("returns undefined for non-cached pair", () => {
      expect(gateway.getCachedPrice("UNKNOWN/PAIR")).toBeUndefined();
    });
  });

  describe("getQuotes (batch)", () => {
    it("fetches multiple quotes at once", async () => {
      mockGetMarketPrices.mockResolvedValue([
        {
          pair: "BTC/USDT",
          price: 65000,
          change24h: 2.5,
          source: "binance",
          timestamp: Date.now(),
        },
        {
          pair: "ETH/USDT",
          price: 3500,
          change24h: 1.2,
          source: "binance",
          timestamp: Date.now(),
        },
      ]);

      const quotes = await gateway.getQuotes(["BTC/USDT", "ETH/USDT"]);

      expect(quotes.size).toBe(2);
      expect(quotes.get("BTC/USDT")?.price).toBe(65000);
      expect(quotes.get("ETH/USDT")?.price).toBe(3500);
    });
  });
});
