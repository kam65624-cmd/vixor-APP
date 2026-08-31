// ============================================================================
// Market Domain — Types
// ============================================================================

export interface MarketNewsItem {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: string;
  time: number;
  image: string;
}

export interface MarketPriceItem {
  symbol: string;
  pair: string;
  price: number;
  change24h?: number;
  source: string;
  timestamp: number;
}

export interface PriceResult {
  symbol: string;
  pair: string;
  price: number;
  change24h?: number;
  source: string;
  timestamp: number;
}

export interface KlineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: "high" | "medium" | "low";
  date: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  source: string;
}

export interface OHLCVData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
}
