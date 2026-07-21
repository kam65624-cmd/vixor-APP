export type TradeDirection = "long" | "short";

export interface Trade {
  id: string;
  user_id: string;
  pair: string;
  direction: TradeDirection;
  entry_price: number;
  current_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  amount: number;
  quantity: number;
  leverage: number;
  pnl: number | null;
  status: "open" | "closed";
  entry_date: string;
  created_at: string;
  closed_at: string | null;
}

export type TradeStatus = "open" | "closed";

export interface CreateTradeInput {
  pair: string;
  direction: TradeDirection;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  amount: number;
  leverage?: number;
}

export interface UpdateTradeInput {
  tradeId: string;
  current_price?: number;
  stop_loss?: number;
  take_profit?: number;
  status?: TradeStatus;
}

export interface ListTradesFilters {
  status?: TradeStatus;
  limit?: number;
}

export interface TradeStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  bestTrade: number;
  worstTrade: number;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
}
