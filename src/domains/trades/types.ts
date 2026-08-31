// ============================================================================
// VIXOR Trades Domain — Types
// ============================================================================
// Aligned with database schema: supabase/migrations/20260610010000_add_trades.sql
// Phase 2: Fixed field dropping bug (F1), aligned with canonical DB schema
// ============================================================================

export type TradeDirection = "long" | "short";

/** Database-backed trade status (matches DB CHECK constraint) */
export type TradeStatus = "open" | "closed" | "cancelled";

/**
 * Canonical Trade model — matches the `trades` database table exactly.
 *
 * DB columns:
 *   - pnl, pnl_pips, r_multiple are GENERATED ALWAYS AS ... STORED
 *     (computed from exit_price/entry_price/direction/quantity/stop_loss).
 *     They are read-only — never included in inserts or updates.
 *
 * IMPORTANT: The `amount` field from the UI maps to `quantity` in the DB.
 * The `current_price` used by the UI is NOT a DB column — it is
 * computed at read time from real-time ticker data.
 */
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
  /** Generated column — computed by DB */
  pnl: number | null;
  /** Generated column — computed by DB */
  pnl_pips: number | null;
  /** Generated column — computed by DB */
  r_multiple: number | null;
  notes: string | null;
  tags: string[];
  strategy: string | null;
  analysis_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Server-validated input for creating a trade.
 * The `amount` field is the UI-facing name for `quantity`.
 * The server maps it to `quantity` before DB insertion.
 */
export interface CreateTradeInput {
  pair: string;
  direction: TradeDirection;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  amount: number;
  leverage?: number;
  notes?: string;
  strategy?: string;
}

/**
 * Server-validated input for updating an existing trade.
 * Only fields that can be legally updated by the user.
 */
export interface UpdateTradeInput {
  tradeId: string;
  exit_price?: number;
  exit_date?: string;
  stop_loss?: number;
  take_profit?: number;
  status?: TradeStatus;
  notes?: string;
  tags?: string[];
  strategy?: string;
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
