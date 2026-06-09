// ============================================================================
// Vixor Local Analysis Engine — Core Type Definitions
// ============================================================================

// OHLCV bar data
export interface OHLCVBar {
  time: number; // unix timestamp or index
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Market structure types
export type TrendDirection = "BULLISH" | "BEARISH" | "NEUTRAL";
export type MarketStructureType =
  | "HIGHER_HIGHS"
  | "HIGHER_LOW"
  | "LOWER_HIGHS"
  | "LOWER_LOW"
  | "CONSOLIDATION";
export type RecommendationType = "BUY" | "SELL" | "WAIT";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

// Pivot/swing point
export interface SwingPoint {
  index: number;
  price: number;
  type: "HIGH" | "LOW";
  // For SMC classification
  structure?: "HH" | "HL" | "LH" | "LL"; // Higher High, Higher Low, Lower High, Lower Low
}

// Break of Structure event
export interface BOSEvent {
  index: number;
  price: number;
  type: "BOS" | "CHoCH"; // Break of Structure or Change of Character
  direction: TrendDirection;
  fromSwing: SwingPoint;
  toSwing: SwingPoint;
}

// Order Block
export interface OrderBlock {
  startIndex: number;
  endIndex: number;
  high: number;
  low: number;
  type: "BULLISH" | "BEARISH";
  mitigated: boolean;
  mitigatedIndex?: number;
  strength: number; // 0-100
}

// Fair Value Gap
export interface FairValueGap {
  index: number;
  top: number;
  bottom: number;
  type: "BULLISH" | "BEARISH";
  filled: boolean;
  filledIndex?: number;
  size: number; // top - bottom
}

// Liquidity zone
export interface LiquidityZone {
  price: number;
  type: "BUY_SIDE" | "SELL_SIDE"; // BSL = resistance highs, SSL = support lows
  strength: number; // number of touches
  swingPoints: SwingPoint[];
}

// Support/Resistance level
export interface SRLevel {
  price: number;
  type: "SUPPORT" | "RESISTANCE" | "PIVOT";
  strength: number;
  touches: number;
  lastIndex: number;
}

// Candlestick pattern
export interface CandlePattern {
  name: string;
  index: number;
  type: "BULLISH" | "BEARISH" | "NEUTRAL";
  reliability: number; // 0-100
  description: string;
}

// Chart formation (multi-candle)
export interface ChartFormation {
  name: string;
  startIndex: number;
  endIndex: number;
  type: "BULLISH" | "BEARISH";
  reliability: number;
  targetPrice?: number;
  stopPrice?: number;
}

// Full analysis result (matches the AnalysisSchema from run-analysis.server.ts)
export interface LocalAnalysisResult {
  pair: string;
  timeframe: string;
  trend: TrendDirection;
  risk_level: RiskLevel;
  risk_reasons: string[];
  invalidation_level: number;
  liquidity_zones: {
    buySide: number[];
    sellSide: number[];
  };
  market_structure: {
    direction: TrendDirection;
    structure: string;
    bos?: number;
  };
  key_levels: {
    resistance: number[];
    support: number[];
    pivot?: number;
  };
  recommendation: RecommendationType;
  confidence: number;
  entry: number;
  stop_loss: number;
  take_profit: number[];
  rr: string;
  pattern: string;
  reasons: string[];
  scenarios: {
    conservative: {
      name: string;
      probability: number;
      entry: string;
      sl: number;
      tp1: number;
      tp2: number;
      rr: string;
    };
    balanced: {
      name: string;
      probability: number;
      entry: string;
      sl: number;
      tp1: number;
      tp2: number;
      rr: string;
    };
    aggressive: {
      name: string;
      probability: number;
      entry: string;
      sl: number;
      tp1: number;
      tp2: number;
      rr: string;
    };
  };
  management: string[];
  news_impact: {
    relevant_news: Array<{
      headline: string;
      source: string;
      impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
      explanation: string;
    }>;
    overall_sentiment: TrendDirection;
    verdict: string;
  };
  signal_badge: {
    direction: RecommendationType;
    entry: string;
    stop_loss: string;
    take_profit: string;
    rr: string;
  };
  vixor_message: string;
}

// Data generation config
export interface PairConfig {
  basePrice: number;
  volatility: number; // daily % volatility
  pipSize: number; // minimum price increment
  decimals: number; // decimal places for display
  typicalRange: number; // typical daily ATR as % of price
}

export const PAIR_CONFIGS: Record<string, PairConfig> = {
  "XAU/USD": {
    basePrice: 3300,
    volatility: 0.012,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.015,
  },
  "EUR/USD": {
    basePrice: 1.13,
    volatility: 0.005,
    pipSize: 0.0001,
    decimals: 4,
    typicalRange: 0.008,
  },
  "GBP/USD": {
    basePrice: 1.34,
    volatility: 0.006,
    pipSize: 0.0001,
    decimals: 4,
    typicalRange: 0.009,
  },
  "USD/JPY": {
    basePrice: 145,
    volatility: 0.007,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.01,
  },
  "GBP/JPY": {
    basePrice: 195,
    volatility: 0.008,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.012,
  },
  "BTC/USD": {
    basePrice: 105000,
    volatility: 0.03,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.04,
  },
  "ETH/USDT": {
    basePrice: 2600,
    volatility: 0.028,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.035,
  },
  "SOL/USDT": {
    basePrice: 170,
    volatility: 0.04,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.05,
  },
  AAPL: {
    basePrice: 195,
    volatility: 0.015,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.02,
  },
  NASDAQ: {
    basePrice: 18500,
    volatility: 0.012,
    pipSize: 0.01,
    decimals: 2,
    typicalRange: 0.018,
  },
};

// Market structure analysis result
export interface MarketStructureResult {
  direction: "BULLISH" | "BEARISH" | "SIDEWAYS";
  structure: string; // e.g. "HIGHER_HIGHS", "LOWER_LOWS", "CONSOLIDATION"
  swingPoints: SwingPoint[];
  bosEvents: BOSEvent[];
  lastBOS?: {
    price: number;
    type: "BOS" | "CHoCH";
    direction: "BULLISH" | "BEARISH";
  };
}
