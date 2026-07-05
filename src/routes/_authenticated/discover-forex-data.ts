/**
 * Static mock data for Forex pairs & Gold on the Discover page.
 *
 * These are placeholder prices and changes — to be replaced by a real
 * forex API feed once broker integration is live.
 *
 * `type` field distinguishes "major", "minor", and "gold" so the UI can
 * render section headers and gold highlighting.
 */

export interface ForexPair {
  /** Display name shown as the symbol — e.g. "EUR/USD" */
  pair: string;
  /** Full name for accessibility / subtitle */
  name: string;
  /** Current price (mock) */
  price: number;
  /** 24h change in percent (mock) */
  change24h: number;
  /** 24h volume in USD (mock) */
  volume24h: number;
  /** "major" | "minor" | "gold" */
  type: "major" | "minor" | "gold";
  /** Chain badge shown on the row — "Forex" or "XAU" */
  badge: string;
  /** Small sparkline data (20 points, mock) */
  sparkline: number[];
}

// ── Helper: generate a pseudo-random sparkline around a base price ──────────

function makeSparkline(base: number, volatility: number, trend: number): number[] {
  const pts: number[] = [];
  let p = base * (1 - trend * 0.003);
  for (let i = 0; i < 20; i++) {
    p += (Math.random() - 0.48 + trend * 0.0004) * volatility;
    pts.push(p);
  }
  // Ensure the last point ends close to the base price
  pts[pts.length - 1] = base;
  return pts;
}

// ── Major Pairs ──────────────────────────────────────────────────────────────

const majors: ForexPair[] = [
  {
    pair: "EUR/USD",
    name: "Euro / US Dollar",
    price: 1.0847,
    change24h: 0.12,
    volume24h: 185_300_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(1.0847, 0.0008, 1),
  },
  {
    pair: "GBP/USD",
    name: "British Pound / US Dollar",
    price: 1.2715,
    change24h: -0.23,
    volume24h: 98_700_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(1.2715, 0.001, -1),
  },
  {
    pair: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    price: 154.32,
    change24h: 0.45,
    volume24h: 142_100_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(154.32, 0.15, 1),
  },
  {
    pair: "USD/CHF",
    name: "US Dollar / Swiss Franc",
    price: 0.8823,
    change24h: -0.08,
    volume24h: 54_200_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(0.8823, 0.0006, -1),
  },
  {
    pair: "AUD/USD",
    name: "Australian Dollar / US Dollar",
    price: 0.6538,
    change24h: 0.31,
    volume24h: 47_600_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(0.6538, 0.0005, 1),
  },
  {
    pair: "NZD/USD",
    name: "New Zealand Dollar / US Dollar",
    price: 0.5912,
    change24h: -0.15,
    volume24h: 18_900_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(0.5912, 0.0004, -1),
  },
  {
    pair: "USD/CAD",
    name: "US Dollar / Canadian Dollar",
    price: 1.3654,
    change24h: 0.07,
    volume24h: 62_800_000_000,
    type: "major",
    badge: "Forex",
    sparkline: makeSparkline(1.3654, 0.0008, 1),
  },
];

// ── Minor / Cross Pairs ─────────────────────────────────────────────────────

const minors: ForexPair[] = [
  {
    pair: "EUR/GBP",
    name: "Euro / British Pound",
    price: 0.8532,
    change24h: 0.34,
    volume24h: 32_100_000_000,
    type: "minor",
    badge: "Forex",
    sparkline: makeSparkline(0.8532, 0.0004, 1),
  },
  {
    pair: "EUR/JPY",
    name: "Euro / Japanese Yen",
    price: 167.48,
    change24h: 0.56,
    volume24h: 41_500_000_000,
    type: "minor",
    badge: "Forex",
    sparkline: makeSparkline(167.48, 0.12, 1),
  },
  {
    pair: "GBP/JPY",
    name: "British Pound / Japanese Yen",
    price: 196.27,
    change24h: -0.42,
    volume24h: 28_700_000_000,
    type: "minor",
    badge: "Forex",
    sparkline: makeSparkline(196.27, 0.2, -1),
  },
  {
    pair: "AUD/JPY",
    name: "Australian Dollar / Japanese Yen",
    price: 100.83,
    change24h: 0.78,
    volume24h: 19_400_000_000,
    type: "minor",
    badge: "Forex",
    sparkline: makeSparkline(100.83, 0.1, 1),
  },
  {
    pair: "EUR/AUD",
    name: "Euro / Australian Dollar",
    price: 1.6593,
    change24h: -0.19,
    volume24h: 15_200_000_000,
    type: "minor",
    badge: "Forex",
    sparkline: makeSparkline(1.6593, 0.001, -1),
  },
  {
    pair: "GBP/AUD",
    name: "British Pound / Australian Dollar",
    price: 1.9448,
    change24h: -0.52,
    volume24h: 12_800_000_000,
    type: "minor",
    badge: "Forex",
    sparkline: makeSparkline(1.9448, 0.0012, -1),
  },
];

// ── Gold (XAU/USD) ──────────────────────────────────────────────────────────

const gold: ForexPair = {
  pair: "XAU/USD",
  name: "Gold (Troy Ounce)",
  price: 2658.43,
  change24h: 0.87,
  volume24h: 223_600_000_000,
  type: "gold",
  badge: "XAU",
  sparkline: makeSparkline(2658.43, 3.5, 1),
};

// ── Combined & Exported ─────────────────────────────────────────────────────

/** All forex items in display order: gold first, then majors, then minors */
export const FOREX_PAIRS: ForexPair[] = [gold, ...majors, ...minors];

export const FOREX_MAJOR_COUNT = majors.length;
export const FOREX_MINOR_COUNT = minors.length;
export const FOREX_TOTAL_COUNT = FOREX_PAIRS.length;