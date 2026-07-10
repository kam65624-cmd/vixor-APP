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