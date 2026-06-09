// ============================================================================
// Trades Domain — Types
// ============================================================================

export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed" | "cancelled";

export interface Trade {
  id: string;
  user_id: string;
  pair: string;
  direction: TradeDirection;
  status: TradeStatus;
  entry_price: number;
  entry_date: string;
  quantity: number | null;
  exit_price: number | null;
  exit_date: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number | null;
  pnl_pips: number | null;
  r_multiple: number | null;
  notes: string | null;
  tags: string[];
  strategy: string | null;
  analysis_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTradeInput {
  pair: string;
  direction: TradeDirection;
  entry_price: number;
  quantity?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  notes?: string | null;
  tags?: string[];
  strategy?: string | null;
  analysis_id?: string | null;
}

export interface UpdateTradeInput {
  tradeId: string;
  exit_price?: number | null;
  exit_date?: string | null;
  status?: TradeStatus;
  stop_loss?: number | null;
  take_profit?: number | null;
  notes?: string | null;
  tags?: string[];
  strategy?: string | null;
  quantity?: number | null;
}

export interface ListTradesFilters {
  status?: TradeStatus;
  pair?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface TradeStats {
  totalTrades: number;
  closedTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  profitFactor: number | null;
  maxDrawdown: number;
  avgRMultiple: number | null;
  bestTrade: { pnl: number; pair: string } | null;
  worstTrade: { pnl: number; pair: string } | null;
  avgHoldingTimeHours: number | null;
  winRateByPair: { pair: string; count: number; winRate: number; totalPnl: number }[];
  winRateByDirection: { direction: string; count: number; winRate: number; totalPnl: number }[];
  winRateByDay: { day: string; count: number; winRate: number; totalPnl: number }[];
}

export interface EquityCurvePoint {
  date: string;
  cumulative_pnl: number;
}
