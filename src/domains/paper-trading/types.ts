// ============================================================================
// Vixor Paper Trading — Types
// ============================================================================
//
// Paper trading provides a safe sandbox to test if Vixor's signals
// actually make money. All trades are virtual — no real money involved.
//
// Gated by environment variable: ENABLE_PAPER_TRADING=true
//
// SUPABASE MIGRATION:
//
// CREATE TABLE IF NOT EXISTS paper_trades (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id text NOT NULL,
//   pair text NOT NULL,
//   direction text NOT NULL,
//   entry_price numeric NOT NULL,
//   stop_loss numeric NOT NULL,
//   take_profit numeric NOT NULL,
//   size_pct numeric NOT NULL,
//   status text NOT NULL DEFAULT 'OPEN',
//   opened_at timestamptz DEFAULT now(),
//   closed_at timestamptz,
//   exit_price numeric,
//   pnl_pct numeric,
//   agent_confidence numeric,
//   debate_summary text
// );
//
// CREATE INDEX idx_paper_trades_user_status ON paper_trades(user_id, status);
// CREATE INDEX idx_paper_trades_opened_at ON paper_trades(opened_at DESC);
// ============================================================================

export interface PaperTrade {
  id: string;
  userId: string;
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  sizePct: number;
  status: "OPEN" | "CLOSED_WIN" | "CLOSED_LOSS" | "CLOSED_BE";
  openedAt: string;
  closedAt?: string;
  exitPrice?: number;
  pnlPct?: number;
  agentConfidence: number;
  debateSummary?: string;
}

export interface PaperAccount {
  userId: string;
  balance: number;
  totalTrades: number;
  winRate: number;
  totalPnlPct: number;
}
