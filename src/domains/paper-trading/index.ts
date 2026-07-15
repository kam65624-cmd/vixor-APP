// ============================================================================
// Vixor Paper Trading — Public API
// ============================================================================
//
// Paper Trading provides a safe sandbox to test if Vixor's signals
// actually make money. All trades are virtual — no real money involved.
//
// Gated by environment variable: ENABLE_PAPER_TRADING=true
//
// Usage:
//   const engine = new PaperEngine();
//   const trade = await engine.openTrade(userId, analysisResult, governorDecision);
//   const settled = await engine.settleTrades(userId);
//
//   const ledger = new TradeLedger();
//   const account = await ledger.getAccount(userId);
//   const recent = await ledger.getRecentTrades(userId);
//
// SUPABASE MIGRATION (run once):
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
// CREATE INDEX IF NOT EXISTS idx_paper_trades_user_status ON paper_trades(user_id, status);
// CREATE INDEX IF NOT EXISTS idx_paper_trades_opened_at ON paper_trades(opened_at DESC);
// ============================================================================

export { PaperEngine } from "./engine/paper.engine";
export { TradeLedger } from "./ledger/trade-ledger";
export { type PaperTrade, type PaperAccount } from "./types";
