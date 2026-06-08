// Shared types. Data has moved to the backend (see vixor.functions.ts).

export type Recommendation = "BUY" | "SELL" | "WAIT";

export interface AnalysisItem {
  id: string;
  pair: string | null;
  timeframe: string | null;
  recommendation: Recommendation | null;
  confidence: number | null;
  pattern: string | null;
  status: "queued" | "processing" | "complete" | "failed";
  created_at: string;
}

export const watchlist = [
  { pair: "BTC/USDT", price: 67482.15, change: 2.34 },
  { pair: "ETH/USDT", price: 3521.88, change: -0.62 },
  { pair: "EUR/USD", price: 1.0842, change: -0.18 },
  { pair: "XAU/USD", price: 2342.6, change: 1.12 },
  { pair: "SOL/USDT", price: 168.4, change: 4.05 },
  { pair: "GBP/JPY", price: 197.34, change: 0.41 },
];
