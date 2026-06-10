// ============================================================================
// Trading Domain — Types
// ============================================================================

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  pair: string;
  condition: "above" | "below" | "crosses_up" | "crosses_down";
  target_price: number;
  current_price: number | null;
  note: string | null;
  timeframe: string;
  status: "active" | "triggered" | "cancelled";
  created_at: string;
  triggered_at?: string;
}

export interface DailySignal {
  id: string;
  pair: string;
  timeframe: string;
  recommendation: string;
  confidence: number;
  entry: number;
  stop_loss: number;
  take_profit: number[];
  reasons: string[];
  pattern: string;
  market_structure: any;
  liquidity_zones: any;
  signal_date: string;
}

export interface UserStrategy {
  id: string | null;
  name: string;
  pairs: string[];
  trading_style: string;
  risk_tolerance: string;
  preferred_timeframes: string[];
  is_active: boolean;
}
