import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getKlines, getRecentBars, getMultiTimeframeBars, resolveSymbol, BINANCE_REST_URL } from "./binance-klines";

/**
 * Unit tests for the Binance klines client.
 * Mocks global.fetch to verify request shape + response parsing.
 */

const sampleKline = [
  1700000000000, // openTime
  "30000.00",    // open
  "30500.00",    // high
  "29900.00",    // low
  "30250.50",    // close
  "123.45",      // volume
  1700003599999, // closeTime
  "3700000.00",  // quoteVolume
  100,           // numTrades
  "60.00",       // taker buy base
  "1800000.00",  // taker buy quote
  "0",           // ignore
];

const sampleResponse = [sampleKline, sampleKline, sampleKline];

describe("getKlines", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends correct query parameters", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse,
    });

    await getKlines({ symbol: "BTCUSDT", interval: "1h", limit: 100 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(`${BINANCE_REST_URL}/api/v3/klines`);
    expect(url).toContain("symbol=BTCUSDT");
    expect(url).toContain("interval=1h");
    expect(url).toContain("limit=100");
  });

  it("uses testnet when testnet=true", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse,
    });

    await getKlines({ symbol: "BTCUSDT", interval: "1h", testnet: true });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("testnet.binance.vision");
  });

  it("parses OHLCV bars correctly", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse,
    });

    const bars = await getKlines({ symbol: "BTCUSDT", interval: "1h" });
    expect(bars).toHaveLength(3);
    expect(bars[0]).toEqual({
      time: 1700000000000,
      open: 30000.0,
      high: 30500.0,
      low: 29900.0,
      close: 30250.5,
      volume: 123.45,
    });
  });

  it("returns empty array on HTTP error", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const bars = await getKlines({ symbol: "BTCUSDT", interval: "1h" });
    expect(bars).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    const bars = await getKlines({ symbol: "BTCUSDT", interval: "1h" });
    expect(bars).toEqual([]);
  });

  it("returns empty array on empty response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    const bars = await getKlines({ symbol: "BTCUSDT", interval: "1h" });
    expect(bars).toEqual([]);
  });

  it("uppercases symbol", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse,
    });

    await getKlines({ symbol: "btcusdt", interval: "1h" });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("symbol=BTCUSDT");
  });

  it("clamps limit to 1000 max", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleResponse,
    });

    await getKlines({ symbol: "BTCUSDT", interval: "1h", limit: 5000 });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("limit=1000");
  });
});

describe("getRecentBars", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    }) as unknown as typeof fetch;
  });

  it("returns parsed bars with default count=200", async () => {
    const bars = await getRecentBars("BTCUSDT", "1h");
    expect(bars).toHaveLength(3);
  });

  it("passes count through as limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await getRecentBars("ETHUSDT", "4h", 50);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("limit=50");
    expect(url).toContain("interval=4h");
  });
});

describe("getMultiTimeframeBars", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    }) as unknown as typeof fetch;
  });

  it("returns a record keyed by timeframe", async () => {
    const bundle = await getMultiTimeframeBars("BTCUSDT");
    expect(bundle).toHaveProperty("15m");
    expect(bundle).toHaveProperty("1h");
    expect(bundle).toHaveProperty("4h");
    expect(bundle).toHaveProperty("1d");
  });

  it("each timeframe returns parsed bars", async () => {
    const bundle = await getMultiTimeframeBars("BTCUSDT");
    expect(bundle["1h"]).toHaveLength(3);
    expect(bundle["4h"]).toHaveLength(3);
  });

  it("returns empty arrays on errors instead of throwing", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network down")) as unknown as typeof fetch;
    const bundle = await getMultiTimeframeBars("BTCUSDT");
    expect(bundle["1h"]).toEqual([]);
    expect(bundle["4h"]).toEqual([]);
  });
});

describe("resolveSymbol", () => {
  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  it("returns canonical symbol when found", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        symbols: [
          { symbol: "BTCUSDT", status: "TRADING" },
          { symbol: "ETHUSDT", status: "TRADING" },
        ],
      }),
    });

    const result = await resolveSymbol("BTC", "USDT");
    expect(result).toBe("BTCUSDT");
  });

  it("returns null when symbol not found", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ symbols: [] }),
    });

    const result = await resolveSymbol("UNKNOWN", "USDT");
    expect(result).toBeNull();
  });

  it("returns null on HTTP error", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({ ok: false });

    const result = await resolveSymbol("BTC", "USDT");
    expect(result).toBeNull();
  });
});
