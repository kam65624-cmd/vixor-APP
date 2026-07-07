/**
 * Forex discover data — real-time prices & sparklines from live APIs.
 *
 * `FOREX_PAIRS_CONFIG` holds static metadata (pair name, display name, type, badge).
 * `getLiveForexDiscoverData()` is a TanStack Start server function that fetches
 * real prices, 24h changes, and sparkline data for all 14 pairs.
 *
 * No hardcoded prices, no Math.random(), no faked volumes.
 */

import { createServerFn } from "@tanstack/react-start";
import { fetchPrice, fetchTwelveDataKlines } from "@/domains/market/server/price-fetcher";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ForexPair {
  /** Display name shown as the symbol — e.g. "EUR/USD" */
  pair: string;
  /** Full name for accessibility / subtitle */
  name: string;
  /** Current price (null when API fails) */
  price: number | null;
  /** 24h change in percent (null when unavailable) */
  change24h: number | null;
  /** 24h volume — always 0 for forex (no real volume data) */
  volume24h: number;
  /** "major" | "minor" | "gold" */
  type: "major" | "minor" | "gold";
  /** Chain badge shown on the row — "Forex" or "XAU" */
  badge: string;
  /** Sparkline close prices from 1h klines (empty when API fails) */
  sparkline: number[];
}

// ── Static pair config (metadata only — NO prices) ───────────────────────────

export interface ForexPairConfig {
  pair: string;
  name: string;
  type: "major" | "minor" | "gold";
  badge: string;
}

const GOLD_CONFIG: ForexPairConfig = {
  pair: "XAU/USD",
  name: "Gold (Troy Ounce)",
  type: "gold",
  badge: "XAU",
};

const MAJOR_CONFIGS: ForexPairConfig[] = [
  { pair: "EUR/USD", name: "Euro / US Dollar", type: "major", badge: "Forex" },
  { pair: "GBP/USD", name: "British Pound / US Dollar", type: "major", badge: "Forex" },
  { pair: "USD/JPY", name: "US Dollar / Japanese Yen", type: "major", badge: "Forex" },
  { pair: "USD/CHF", name: "US Dollar / Swiss Franc", type: "major", badge: "Forex" },
  { pair: "AUD/USD", name: "Australian Dollar / US Dollar", type: "major", badge: "Forex" },
  { pair: "NZD/USD", name: "New Zealand Dollar / US Dollar", type: "major", badge: "Forex" },
  { pair: "USD/CAD", name: "US Dollar / Canadian Dollar", type: "major", badge: "Forex" },
];

const MINOR_CONFIGS: ForexPairConfig[] = [
  { pair: "EUR/GBP", name: "Euro / British Pound", type: "minor", badge: "Forex" },
  { pair: "EUR/JPY", name: "Euro / Japanese Yen", type: "minor", badge: "Forex" },
  { pair: "GBP/JPY", name: "British Pound / Japanese Yen", type: "minor", badge: "Forex" },
  { pair: "AUD/JPY", name: "Australian Dollar / Japanese Yen", type: "minor", badge: "Forex" },
  { pair: "EUR/AUD", name: "Euro / Australian Dollar", type: "minor", badge: "Forex" },
  { pair: "GBP/AUD", name: "British Pound / Australian Dollar", type: "minor", badge: "Forex" },
];

/** All pair configs in display order: gold first, then majors, then minors */
export const FOREX_PAIRS_CONFIG: ForexPairConfig[] = [
  GOLD_CONFIG,
  ...MAJOR_CONFIGS,
  ...MINOR_CONFIGS,
];

export const FOREX_MAJOR_COUNT = MAJOR_CONFIGS.length;
export const FOREX_MINOR_COUNT = MINOR_CONFIGS.length;
export const FOREX_TOTAL_COUNT = FOREX_PAIRS_CONFIG.length;

// ── Server function: fetch live data for all pairs ───────────────────────────

/**
 * Fetches real-time prices, 24h changes, and 1h sparklines for all 14 forex pairs.
 * Uses the price-fetcher (TwelveData / Binance / fallback chain) for prices and
 * TwelveData time_series for 20-bar 1h sparklines.
 *
 * Returns ForexPair[] with null prices/changes when APIs fail — never fakes data.
 * Volume is always 0 since forex has no real volume like crypto.
 */
export const getLiveForexDiscoverData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ForexPair[]> => {
    // Fetch prices and klines in parallel for all pairs
    const pairNames = FOREX_PAIRS_CONFIG.map((c) => c.pair);

    const priceResults = await Promise.allSettled(pairNames.map((p) => fetchPrice(p)));
    const klineResults = await Promise.allSettled(
      pairNames.map((p) => fetchTwelveDataKlines(p, "1h", 20)),
    );

    return FOREX_PAIRS_CONFIG.map((config, i) => {
      // Extract price result
      const priceResult = priceResults[i].status === "fulfilled" ? priceResults[i].value : null;

      // Extract sparkline (close prices from klines, in chronological order)
      let sparkline: number[] = [];
      if (klineResults[i].status === "fulfilled" && klineResults[i].value.length >= 2) {
        sparkline = klineResults[i].value.map((bar) => bar.close);
      }

      // Determine price and change24h
      let price: number | null = null;
      let change24h: number | null = null;

      if (priceResult) {
        price = priceResult.price;

        // Use change24h from the price-fetcher if available
        if (priceResult.change24h !== undefined && priceResult.change24h !== null) {
          change24h = priceResult.change24h;
        }
        // Otherwise compute from sparkline if available
        else if (sparkline.length >= 2) {
          const first = sparkline[0];
          const last = sparkline[sparkline.length - 1];
          if (first > 0) {
            change24h = ((last - first) / first) * 100;
          }
        }
      }

      return {
        pair: config.pair,
        name: config.name,
        price,
        change24h,
        volume24h: 0,
        type: config.type,
        badge: config.badge,
        sparkline,
      };
    });
  },
);
