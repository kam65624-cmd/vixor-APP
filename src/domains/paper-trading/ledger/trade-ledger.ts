// ============================================================================
// Vixor Paper Trading — Trade Ledger
// ============================================================================
//
// Read-only ledger for paper trading account stats and trade history.
// Used by the UI to display paper trading performance.
//
// Key principles:
//   - READ-ONLY — never writes to the database
//   - MUST check ENABLE_PAPER_TRADING flag before any operation
//   - Safe to call repeatedly — no side effects
// ============================================================================

import type { PaperTrade, PaperAccount } from "../types";

/**
 * Get the Supabase admin client.
 * Lazy-imported to avoid circular dependencies at module load time.
 * Returns as `any` because the paper_trades table may not exist in generated types yet.
 */
async function getSupabase(): Promise<any> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  } catch {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");
      return supabaseAdmin;
    } catch {
      console.error("[TradeLedger] Could not import Supabase client");
      return null;
    }
  }
}

/** Row shape returned from paper_trades table */
interface PaperTradeRow {
  id: string;
  user_id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  size_pct: number;
  status: "OPEN" | "CLOSED_WIN" | "CLOSED_LOSS" | "CLOSED_BE";
  opened_at: string;
  closed_at: string | null;
  exit_price: number | null;
  pnl_pct: number | null;
  agent_confidence: number | null;
  debate_summary: string | null;
}

function rowToTrade(t: PaperTradeRow): PaperTrade {
  return {
    id: t.id,
    userId: t.user_id,
    pair: t.pair,
    direction: t.direction,
    entryPrice: t.entry_price,
    stopLoss: t.stop_loss,
    takeProfit: t.take_profit,
    sizePct: t.size_pct,
    status: t.status,
    openedAt: t.opened_at,
    closedAt: t.closed_at ?? undefined,
    exitPrice: t.exit_price ?? undefined,
    pnlPct: t.pnl_pct ?? undefined,
    agentConfidence: t.agent_confidence ?? 0,
    debateSummary: t.debate_summary ?? undefined,
  };
}

export class TradeLedger {
  /**
   * Get the paper trading account summary for a user.
   * Calculates total trades, win rate, and PnL from all paper trades.
   *
   * Virtual balance starts at $10,000.
   */
  async getAccount(userId: string): Promise<PaperAccount> {
    const defaultAccount: PaperAccount = {
      userId,
      balance: 10000,
      totalTrades: 0,
      winRate: 0,
      totalPnlPct: 0,
    };

    if (process.env.ENABLE_PAPER_TRADING !== "true") {
      return defaultAccount;
    }

    try {
      const supabase = await getSupabase();
      if (!supabase) return defaultAccount;

      const { data: trades, error } = await supabase
        .from("paper_trades")
        .select("*")
        .eq("user_id", userId)
        .order("opened_at", { ascending: true });

      if (error || !trades) {
        console.error("[TradeLedger] Failed to fetch paper trades:", error?.message);
        return defaultAccount;
      }

      const rows = trades as PaperTradeRow[];
      const totalTrades = rows.length;
      const wins = rows.filter((t) => t.status === "CLOSED_WIN").length;
      const closedTrades = rows.filter((t) => t.status.startsWith("CLOSED_")).length;

      const totalPnlPct = rows
        .filter((t) => t.pnl_pct !== null)
        .reduce((sum, t) => sum + (t.pnl_pct ?? 0), 0);

      // Balance starts at 10000, adjusted by cumulative PnL
      const balance = 10000 * (1 + totalPnlPct / 100);

      return {
        userId,
        balance: Math.round(balance * 100) / 100,
        totalTrades,
        winRate: closedTrades > 0 ? Math.round((wins / closedTrades) * 100) / 100 : 0,
        totalPnlPct: Math.round(totalPnlPct * 100) / 100,
      };
    } catch (err) {
      console.error(
        "[TradeLedger] getAccount failed:",
        err instanceof Error ? err.message : String(err),
      );
      return defaultAccount;
    }
  }

  /**
   * Get the most recent paper trades for a user.
   * Ordered by openedAt descending (newest first).
   */
  async getRecentTrades(userId: string, limit = 10): Promise<PaperTrade[]> {
    if (process.env.ENABLE_PAPER_TRADING !== "true") {
      return [];
    }

    try {
      const supabase = await getSupabase();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("paper_trades")
        .select("*")
        .eq("user_id", userId)
        .order("opened_at", { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.error("[TradeLedger] Failed to fetch recent trades:", error?.message);
        return [];
      }

      return (data as PaperTradeRow[]).map(rowToTrade);
    } catch (err) {
      console.error(
        "[TradeLedger] getRecentTrades failed:",
        err instanceof Error ? err.message : String(err),
      );
      return [];
    }
  }
}
