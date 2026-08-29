// ── Live Forex Prices ─────────────────────────────────────────────
// Uses Frankfurter API (free, no key, ECB rates) for real-time forex prices.

type ForexPriceItem = {
  pair: string;
  name: string;
  price: number;
  type: "major" | "minor" | "gold";
  badge: string;
};

const FOREX_PAIR_CONFIG: Array<{
  pair: string;
  name: string;
  from: string;
  to: string;
  type: "major" | "minor" | "gold";
  badge: string;
}> = [
  {
    pair: "XAU/USD",
    name: "Gold (Troy Ounce)",
    from: "XAU",
    to: "USD",
    type: "gold",
    badge: "XAU",
  },
  {
    pair: "EUR/USD",
    name: "Euro / US Dollar",
    from: "EUR",
    to: "USD",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "GBP/USD",
    name: "British Pound / US Dollar",
    from: "GBP",
    to: "USD",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    from: "USD",
    to: "JPY",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "USD/CHF",
    name: "US Dollar / Swiss Franc",
    from: "USD",
    to: "CHF",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "AUD/USD",
    name: "Australian Dollar / US Dollar",
    from: "AUD",
    to: "USD",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "NZD/USD",
    name: "New Zealand Dollar / US Dollar",
    from: "NZD",
    to: "USD",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "USD/CAD",
    name: "US Dollar / Canadian Dollar",
    from: "USD",
    to: "CAD",
    type: "major",
    badge: "Forex",
  },
  {
    pair: "EUR/GBP",
    name: "Euro / British Pound",
    from: "EUR",
    to: "GBP",
    type: "minor",
    badge: "Forex",
  },
  {
    pair: "EUR/JPY",
    name: "Euro / Japanese Yen",
    from: "EUR",
    to: "JPY",
    type: "minor",
    badge: "Forex",
  },
  {
    pair: "GBP/JPY",
    name: "British Pound / Japanese Yen",
    from: "GBP",
    to: "JPY",
    type: "minor",
    badge: "Forex",
  },
  {
    pair: "AUD/JPY",
    name: "Australian Dollar / Japanese Yen",
    from: "AUD",
    to: "JPY",
    type: "minor",
    badge: "Forex",
  },
  {
    pair: "EUR/AUD",
    name: "Euro / Australian Dollar",
    from: "EUR",
    to: "AUD",
    type: "minor",
    badge: "Forex",
  },
  {
    pair: "GBP/AUD",
    name: "British Pound / Australian Dollar",
    from: "GBP",
    to: "AUD",
    type: "minor",
    badge: "Forex",
  },
];
