import type { QuoteRequest, QuoteResult } from "../types";
import type { ExchangeClient } from "../exchanges/types";
import { PriceFeed } from "../price-feed";
import { simulateDexQuote } from "./quote-simulator";

const VENUE_MULTIPLIERS: Record<string, number> = {
  raydium: 0.9985,
  orca: 0.999,
  meteora: 1.0005,
  phoenix: 0.9995,
};

/**
 * Simulates secondary DEX venues using price feed + venue-specific spread offsets.
 * Enables cross-DEX arbitrage detection in mock mode without live API keys.
 */
export class MockDexClient implements ExchangeClient {
  constructor(
    public readonly venue: "raydium" | "orca" | "meteora" | "phoenix",
    private readonly priceFeed: PriceFeed,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResult> {
    const multiplier = VENUE_MULTIPLIERS[this.venue] ?? 1;
    return simulateDexQuote(
      this.venue,
      request,
      this.priceFeed,
      multiplier,
      `${this.venue} pool`,
      30,
    );
  }
}

export function createMockDexClients(priceFeed: PriceFeed): ExchangeClient[] {
  return (["raydium", "orca", "meteora", "phoenix"] as const).map(
    (venue) => new MockDexClient(venue, priceFeed),
  );
}
