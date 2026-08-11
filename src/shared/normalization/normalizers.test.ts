// ============================================================================
// VIXOR V2 — Normalizers — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  normalizePair,
  normalizeBinanceTicker,
  normalizeFinnhubQuote,
  normalizeDexScreenerToken,
  checkFreshness,
} from "./normalizers";

describe("normalizePair", () => {
  it('converts "BTCUSDT" to "BTC/USDT"', () => {
    expect(normalizePair("BTCUSDT")).toBe("BTC/USDT");
  });

  it('converts "ETHUSDT" to "ETH/USDT"', () => {
    expect(normalizePair("ETHUSDT")).toBe("ETH/USDT");
  });

  it('preserves "BTC/USDT" as-is', () => {
    expect(normalizePair("BTC/USDT")).toBe("BTC/USDT");
  });

  it('converts lowercase "solusdt" to "SOL/USDT"', () => {
    expect(normalizePair("solusdt")).toBe("SOL/USDT");
  });

  it('converts "BTC-USDT" to "BTC/USDT"', () => {
    expect(normalizePair("BTC-USDT")).toBe("BTC/USDT");
  });

  it('handles BTC quote asset: "SOLBTC" → "SOL/BTC"', () => {
    expect(normalizePair("SOLBTC")).toBe("SOL/BTC");
  });
});

describe("normalizeBinanceTicker", () => {
  it("normalizes a valid Binance ticker", () => {
    const result = normalizeBinanceTicker({
      s: "BTCUSDT",
      c: "65000.50",
      h: "66000",
      l: "64000",
      v: "12345.5",
      q: "800000000",
      P: "2.5",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("BTC/USDT");
      expect(result.data.price).toBe(65000.5);
      expect(result.data.high24h).toBe(66000);
      expect(result.data.low24h).toBe(64000);
      expect(result.data.volume24h).toBe(12345.5);
      expect(result.data.change24hPct).toBe(2.5);
      expect(result.data.source).toBe("binance");
    }
  });

  it("returns error for missing symbol", () => {
    const result = normalizeBinanceTicker({ c: "100" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MISSING_FIELD");
      expect(result.source).toBe("binance");
    }
  });

  it("returns error for invalid price", () => {
    const result = normalizeBinanceTicker({ s: "BTCUSDT", c: "-100" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_FAILED");
    }
  });

  it("returns error for zero price", () => {
    const result = normalizeBinanceTicker({ s: "BTCUSDT", c: "0" });
    expect(result.ok).toBe(false);
  });
});

describe("normalizeFinnhubQuote", () => {
  it("normalizes a valid Finnhub quote", () => {
    const result = normalizeFinnhubQuote({
      pair: "BTC/USD",
      price: 65000,
      high: 66000,
      low: 64000,
      open: 64000,
      change: 1000,
      changePct: 1.56,
      timestamp: 1723350000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("BTC/USD");
      expect(result.data.price).toBe(65000);
      expect(result.data.source).toBe("finnhub");
    }
  });

  it("returns error for missing pair", () => {
    const result = normalizeFinnhubQuote({ price: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MISSING_FIELD");
    }
  });
});

describe("normalizeDexScreenerToken", () => {
  it("normalizes a valid DexScreener token", () => {
    const result = normalizeDexScreenerToken({
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
      expect(result.data.change24hPct).toBe(5.2);
      expect(result.data.source).toBe("dexscreener");
    }
  });

  it("returns error for missing baseToken", () => {
    const result = normalizeDexScreenerToken({ priceUsd: "100" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MISSING_FIELD");
    }
  });
});

describe("checkFreshness", () => {
  it("returns 'fresh' for recent data", () => {
    const result = checkFreshness(new Date().toISOString(), 60);
    expect(result.status).toBe("fresh");
    expect(result.ageSeconds).toBeLessThan(30);
  });

  it("returns 'stale' for data between 50-100% of max age", () => {
    const thirtySecondsAgo = new Date(Date.now() - 35_000).toISOString();
    const result = checkFreshness(thirtySecondsAgo, 60);
    expect(result.status).toBe("stale");
  });

  it("returns 'expired' for data older than max age", () => {
    const twoMinutesAgo = new Date(Date.now() - 120_000).toISOString();
    const result = checkFreshness(twoMinutesAgo, 60);
    expect(result.status).toBe("expired");
  });

  it("uses custom maxAge", () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
    const result = checkFreshness(tenSecondsAgo, 15);
    expect(result.status).toBe("stale");
    expect(result.maxAgeSeconds).toBe(15);
  });
});
