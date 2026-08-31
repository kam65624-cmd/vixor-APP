// ============================================================================
// VIXOR V2 — Provider Adapter Registry — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { ProviderRegistry } from "./provider-registry";

describe("ProviderRegistry", () => {
  describe("normalize (quote)", () => {
    it("normalizes a Binance ticker via registry", () => {
      const result = ProviderRegistry.normalize("binance", "quote", {
        s: "BTCUSDT",
        c: "65000.50",
        h: "66000",
        l: "64000",
        v: "12345",
        q: "800000000",
        P: "2.5",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.pair).toBe("BTC/USDT");
        expect(result.data.price).toBe(65000.5);
        expect(result.source).toBe("binance");
      }
    });

    it("normalizes a Finnhub quote via registry", () => {
      const result = ProviderRegistry.normalize("finnhub", "quote", {
        pair: "AAPL",
        price: 150.25,
        changePct: 1.5,
        timestamp: 1723350000,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.pair).toBe("AAPL");
        expect(result.data.price).toBe(150.25);
        expect(result.source).toBe("finnhub");
      }
    });

    it("normalizes a DexScreener token via registry", () => {
      const result = ProviderRegistry.normalize("dexscreener", "quote", {
        baseToken: { symbol: "BONK" },
        quoteToken: { symbol: "SOL" },
        priceUsd: "0.000025",
        priceChange: { h24: 5.2 },
        volume: { h24: 1500000 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.pair).toBe("BONK/SOL");
        expect(result.data.price).toBe(0.000025);
        expect(result.source).toBe("dexscreener");
      }
    });

    it("normalizes a TwelveData quote via registry", () => {
      const result = ProviderRegistry.normalize("twelvedata", "quote", {
        symbol: "EUR/USD",
        close: "1.0875",
        high: "1.0900",
        low: "1.0800",
        volume: "150000",
        percent_change: "0.23",
        timestamp: 1723350000,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.pair).toBe("EUR/USD");
        expect(result.data.price).toBe(1.0875);
        expect(result.source).toBe("twelvedata");
      }
    });

    it("returns error for unregistered source", () => {
      const result = ProviderRegistry.normalize("helius" as any, "quote", {
        price: 100,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("PROVIDER_ERROR");
        expect(result.error).toContain("helius");
      }
    });

    it("returns error when Binance normalizer fails (missing fields)", () => {
      const result = ProviderRegistry.normalize("binance", "quote", {
        c: "100",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("MISSING_FIELD");
        expect(result.source).toBe("binance");
      }
    });
  });

  describe("normalize (orderbook)", () => {
    it("normalizes a Binance order book via registry", () => {
      const result = ProviderRegistry.normalize("binance", "orderbook", {
        lastUpdateId: 160,
        symbol: "BTCUSDT",
        bids: [
          ["0.0024", "10"],
          ["0.0023", "20"],
        ],
        asks: [
          ["0.0026", "100"],
          ["0.0027", "200"],
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.pair).toBe("BTC/USDT");
        expect(result.source).toBe("binance");
        expect(result.data.bids).toHaveLength(2);
        expect(result.data.asks).toHaveLength(2);
        expect(result.data.bestBid).toBe(0.0024);
        expect(result.data.bestAsk).toBe(0.0026);
        expect(result.data.spread).toBeCloseTo(0.0002);
        expect(result.data.midPrice).toBeCloseTo(0.0025);
      }
    });

    it("returns error for unregistered source with orderbook type", () => {
      const result = ProviderRegistry.normalize("finnhub", "orderbook", {});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("PROVIDER_ERROR");
        expect(result.error).toContain("orderbook");
      }
    });
  });

  describe("getRegisteredSources", () => {
    it("returns all 4 registered sources", () => {
      const sources = ProviderRegistry.getRegisteredSources();
      expect(sources).toHaveLength(4);
      expect(sources).toContain("binance");
      expect(sources).toContain("finnhub");
      expect(sources).toContain("dexscreener");
      expect(sources).toContain("twelvedata");
    });

    it("does not include unregistered sources", () => {
      const sources = ProviderRegistry.getRegisteredSources();
      expect(sources).not.toContain("helius");
      expect(sources).not.toContain("unknown");
    });
  });

  describe("isRegistered", () => {
    it("returns true for registered sources", () => {
      expect(ProviderRegistry.isRegistered("binance")).toBe(true);
      expect(ProviderRegistry.isRegistered("finnhub")).toBe(true);
      expect(ProviderRegistry.isRegistered("dexscreener")).toBe(true);
      expect(ProviderRegistry.isRegistered("twelvedata")).toBe(true);
    });

    it("returns false for unregistered sources", () => {
      expect(ProviderRegistry.isRegistered("helius" as any)).toBe(false);
      expect(ProviderRegistry.isRegistered("unknown")).toBe(false);
    });
  });
});
