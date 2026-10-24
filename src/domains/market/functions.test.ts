import { describe, expect, it, vi } from "vitest";

const { fetchBinanceKlines, fetchTwelveDataKlines, fetchPrice } = vi.hoisted(() => ({
  fetchBinanceKlines: vi.fn(),
  fetchTwelveDataKlines: vi.fn(),
  fetchPrice: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    validator() {
      return this;
    },
    handler(handler: (options: { data: unknown }) => unknown) {
      return handler;
    },
  }),
}));

vi.mock("@/domains/market/server/price-fetcher", () => ({
  fetchBinanceKlines,
  fetchTwelveDataKlines,
  fetchPrice,
}));

import { getOHLCV } from "./functions";

describe("getOHLCV", () => {
  it("returns unavailable when candle providers fail instead of inventing a bar from the spot price", async () => {
    fetchBinanceKlines.mockResolvedValue([]);
    fetchTwelveDataKlines.mockResolvedValue([]);
    fetchPrice.mockResolvedValue({
      symbol: "BINANCE:BTCUSDT",
      pair: "BTC/USDT",
      price: 100,
      source: "binance",
      timestamp: Date.now(),
    });

    const result = await getOHLCV({ data: { pair: "BTC/USDT", interval: "1H" } });

    expect(result).toBeNull();
    expect(fetchPrice).not.toHaveBeenCalled();
  });
});
