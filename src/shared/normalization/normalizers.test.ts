// ============================================================================
// VIXOR V2 — Normalizers — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  normalizePair,
  normalizeBinanceTicker,
  normalizeFinnhubQuote,
  normalizeDexScreenerToken,
  normalizeTwelveDataQuote,
  normalizeBinanceOrderBook,
  normalizeBinanceKline,
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

describe("normalizeTwelveDataQuote", () => {
  it("normalizes a valid TwelveData forex quote", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "1.0875",
      high: "1.0900",
      low: "1.0800",
      volume: "150000",
      percent_change: "0.23",
      timestamp: 1723350000,
      currency: "USD",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("EUR/USD");
      expect(result.data.price).toBe(1.0875);
      expect(result.data.high24h).toBe(1.09);
      expect(result.data.low24h).toBe(1.08);
      expect(result.data.volume24h).toBe(150000);
      expect(result.data.change24hPct).toBe(0.23);
      expect(result.data.source).toBe("twelvedata");
      expect(result.data.timestamp).toBe("2024-08-11T04:20:00.000Z");
    }
  });

  it("normalizes a stock quote", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "AAPL",
      close: "150.25",
      high: "152.00",
      low: "148.00",
      volume: "50000000",
      percent_change: "1.01",
      timestamp: 1723320600,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("AAPL");
      expect(result.data.price).toBe(150.25);
      expect(result.data.change24hPct).toBe(1.01);
      expect(result.data.source).toBe("twelvedata");
    }
  });

  it("returns error for missing symbol", () => {
    const result = normalizeTwelveDataQuote({ close: "1.0875" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MISSING_FIELD");
      expect(result.source).toBe("twelvedata");
    }
  });

  it("returns error for missing close", () => {
    const result = normalizeTwelveDataQuote({ symbol: "EUR/USD" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MISSING_FIELD");
    }
  });

  it("returns error for invalid close price", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "-5",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_FAILED");
    }
  });

  it("returns error for zero close price", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "0",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_FAILED");
    }
  });

  it("falls back to price when high/low are missing", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "1.0875",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.high24h).toBe(1.0875);
      expect(result.data.low24h).toBe(1.0875);
    }
  });

  it("defaults change24hPct to 0 when percent_change is missing", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "1.0875",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.change24hPct).toBe(0);
    }
  });

  it("defaults timestamp to now when missing", () => {
    const before = new Date();
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "1.0875",
    });
    const after = new Date();

    expect(result.ok).toBe(true);
    if (result.ok) {
      const ts = new Date(result.data.timestamp).getTime();
      expect(ts).toBeGreaterThanOrEqual(before.getTime() - 1);
      expect(ts).toBeLessThanOrEqual(after.getTime() + 1);
    }
  });

  it("sets bid and ask to null", () => {
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "1.0875",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bid).toBeNull();
      expect(result.data.ask).toBeNull();
      expect(result.data.quoteVolume24h).toBeNull();
    }
  });

  it("includes normalizedAt in success response", () => {
    const before = new Date();
    const result = normalizeTwelveDataQuote({
      symbol: "EUR/USD",
      close: "1.0875",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const ts = new Date(result.normalizedAt).getTime();
      expect(ts).toBeGreaterThanOrEqual(before.getTime() - 1);
    }
  });
});

describe("normalizeBinanceOrderBook", () => {
  it("normalizes a full Binance depth payload", () => {
    const result = normalizeBinanceOrderBook({
      lastUpdateId: 160,
      symbol: "BNBUSDT",
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
      expect(result.data.pair).toBe("BNB/USDT");
      expect(result.data.bids).toHaveLength(2);
      expect(result.data.asks).toHaveLength(2);
      expect(result.data.bids[0].price).toBe(0.0024);
      expect(result.data.bids[0].quantity).toBe(10);
      expect(result.data.bestBid).toBe(0.0024);
      expect(result.data.bestAsk).toBe(0.0026);
      expect(result.data.spread).toBeCloseTo(0.0002);
      expect(result.data.midPrice).toBeCloseTo(0.0025);
      expect(result.data.source).toBe("binance");
      expect(result.normalizedAt).toBeDefined();
    }
  });

  it("returns error when no bids, asks, or pairOverride provided", () => {
    const result = normalizeBinanceOrderBook({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("MISSING_FIELD");
      expect(result.source).toBe("binance");
    }
  });

  it("works with pairOverride when no symbol in payload", () => {
    const result = normalizeBinanceOrderBook(
      { bids: [["100", "1"]], asks: [["101", "2"]] },
      "BTCUSDT",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("BTC/USDT");
      expect(result.data.bestBid).toBe(100);
      expect(result.data.bestAsk).toBe(101);
    }
  });

  it("sets bestBid/bestAsk/spread/midPrice to null for empty book", () => {
    const result = normalizeBinanceOrderBook({ bids: [["100", "5"]] }, "ETHUSDT");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bestBid).toBe(100);
      expect(result.data.bestAsk).toBeNull();
      expect(result.data.spread).toBeNull();
      expect(result.data.midPrice).toBeNull();
    }
  });

  it("handles single bid and single ask correctly", () => {
    const result = normalizeBinanceOrderBook({
      symbol: "BTCUSDT",
      bids: [["65000.50", "0.5"]],
      asks: [["65001.00", "1.2"]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bestBid).toBe(65000.5);
      expect(result.data.bestAsk).toBe(65001.0);
      expect(result.data.spread).toBeCloseTo(0.5);
      expect(result.data.midPrice).toBeCloseTo(65000.75);
    }
  });
});

describe("normalizeBinanceKline", () => {
  it("normalizes a full Binance kline array", () => {
    const result = normalizeBinanceKline(
      [
        "1499040000000",
        "0.01634000",
        "0.80000000",
        "0.01565800",
        "0.01577100",
        "148976.11427815",
        1499644799999,
        "2434.19055334",
        308,
      ],
      "BTCUSDT",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("BTC/USDT");
      expect(result.data.openTime).toBe("2017-07-03T00:00:00.000Z");
      expect(result.data.open).toBe(0.01634);
      expect(result.data.high).toBe(0.8);
      expect(result.data.low).toBe(0.015658);
      expect(result.data.close).toBe(0.015771);
      expect(result.data.volume).toBe(148976.11427815);
      expect(result.data.quoteVolume).toBe(2434.19055334);
      expect(result.data.source).toBe("binance");
      expect(result.normalizedAt).toBeDefined();
    }
  });

  it("returns error for non-array payload", () => {
    const result = normalizeBinanceKline("not an array", "BTCUSDT");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_PAYLOAD");
      expect(result.source).toBe("binance");
    }
  });

  it("returns error for array with fewer than 6 elements", () => {
    const result = normalizeBinanceKline(["1000", "1", "2"], "BTCUSDT");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_PAYLOAD");
    }
  });

  it("returns error for kline with NaN values", () => {
    const result = normalizeBinanceKline(
      ["1499040000000", "not_a_number", "2", "1", "1.5", "100"],
      "BTCUSDT",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_FAILED");
    }
  });

  it("sets quoteVolume to null when fewer than 8 elements", () => {
    const result = normalizeBinanceKline(
      ["1499040000000", "100", "110", "90", "105", "500", 1499644799999],
      "ETHUSDT",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("ETH/USDT");
      expect(result.data.open).toBe(100);
      expect(result.data.high).toBe(110);
      expect(result.data.low).toBe(90);
      expect(result.data.close).toBe(105);
      expect(result.data.volume).toBe(500);
      expect(result.data.quoteVolume).toBeNull();
    }
  });

  it("normalizes pair correctly via normalizePair", () => {
    const result = normalizeBinanceKline(
      ["1499040000000", "1.0875", "1.09", "1.08", "1.0875", "150000", 1499644799999, "163125"],
      "EURUSDT",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pair).toBe("EUR/USDT");
    }
  });
});
