// ============================================================================
// Vixor Paper Trading — Paper Engine
// ============================================================================
//
// Opens and settles paper (virtual) trades based on analysis signals.
// All trades are virtual — no real money involved.
//
// Key principles:
//   - MUST check ENABLE_PAPER_TRADING flag before any operation
//   - NEVER calls real exchange APIs for execution — price-fetcher is READ-ONLY
//   - NEVER modifies src/domains/trades/ (real trades)
//   - Fully async and wrapped in try/catch
//   - settleTrades() is idempotent — safe to call repeatedly
// ============================================================================

import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";
import type { GovernorDecision } from "@/domains/risk-governor";
import { fetchPrice } from "@/domains/market/server/price-fetcher";
import type { PaperTrade } from "../types";

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
      console.error("[PaperEngine] Could not import Supabase client");
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

export class PaperEngine {
  /**
   * Open a new paper trade from an AnalysisResult + GovernorDecision.
   *
   * Returns null if:
   *   - ENABLE_PAPER_TRADING is not set
   *   - GovernorDecision action is BLOCK
   *   - Supabase is not available
   */
  async openTrade(
    userId: string,
    signal: AnalysisResult,
    decision: GovernorDecision,
    debateSummary?: string,
  ): Promise<PaperTrade | null> {
    // ── Gate: Check if paper trading is enabled ──
    if (process.env.ENABLE_PAPER_TRADING !== "true") {
      return null;
    }

    // ── Gate: Blocked signals don't open trades ──
    if (decision.action === "BLOCK") {
      console.log("[PaperEngine] Signal blocked by Risk Governor — not opening paper trade.");
      return null;
    }

    // ── Gate: WAIT signals don't open trades ──
    if (signal.recommendation === "WAIT") {
      return null;
    }

    try {
      const supabase = await getSupabase();
      if (!supabase) return null;

      const takeProfit = signal.take_profit[0] ?? signal.entry; // Conservative TP

      const { data, error } = await supabase
        .from("paper_trades")
        .insert({
          user_id: userId,
          pair: signal.pair,
          direction: signal.recommendation as "BUY" | "SELL",
          entry_price: signal.entry,
          stop_loss: signal.stop_loss,
          take_profit: takeProfit,
          size_pct: decision.suggestedSizePct,
          status: "OPEN",
          opened_at: new Date().toISOString(),
          agent_confidence: signal.confidence,
          debate_summary: debateSummary ?? null,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[PaperEngine] Failed to insert paper trade:", error.message);
        return null;
      }

      console.log(
        `[PaperEngine] Opened paper trade: ${signal.recommendation} ${signal.pair} @ ${signal.entry} ` +
        `(SL: ${signal.stop_loss}, TP: ${takeProfit}, size: ${decision.suggestedSizePct})`,
      );

      return {
        id: data.id,
        userId,
        pair: signal.pair,
        direction: signal.recommendation as "BUY" | "SELL",
        entryPrice: signal.entry,
        stopLoss: signal.stop_loss,
        takeProfit,
        sizePct: decision.suggestedSizePct,
        status: "OPEN",
        openedAt: new Date().toISOString(),
        agentConfidence: signal.confidence,
        debateSummary: debateSummary ?? undefined,
      };
    } catch (err) {
      console.error(
        "[PaperEngine] Failed to open paper trade:",
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  }

  /**
   * Check open trades against current prices and close if TP/SL hit.
   *
   * This method is IDEMPOTENT — safe to call repeatedly (e.g., from a cron job).
   * It only updates trades that haven't been settled yet.
   *
   * @returns List of trades that were settled in this run
   */
  async settleTrades(userId: string): Promise<PaperTrade[]> {
    // ── Gate: Check if paper trading is enabled ──
    if (process.env.ENABLE_PAPER_TRADING !== "true") {
      return [];
    }

    try {
      const supabase = await getSupabase();
      if (!supabase) return [];

      // ── Fetch all OPEN paper trades for this user ──
      const { data: openTrades, error: fetchError } = await supabase
        .from("paper_trades")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "OPEN")
        .order("opened_at", { ascending: true });

      if (fetchError) {
        console.error("[PaperEngine] Failed to fetch open paper trades:", fetchError.message);
        return [];
      }

      if (!openTrades || openTrades.length === 0) {
        return [];
      }

      const settled: PaperTrade[] = [];

      for (const trade of openTrades as PaperTradeRow[]) {
        try {
          // ── Fetch current price for this pair ──
          const priceResult = await fetchPrice(trade.pair);
          if (!priceResult || !priceResult.price) {
            continue; // Skip if price unavailable — try again next cycle
          }

          const currentPrice = priceResult.price;
          const entry = trade.entry_price;
          const sl = trade.stop_loss;
          const tp = trade.take_profit;

          let status: "CLOSED_WIN" | "CLOSED_LOSS" | "CLOSED_BE" | null = null;
          let exitPrice: number | null = null;

          if (trade.direction === "BUY") {
            // BUY trade: TP above entry, SL below entry
            if (currentPrice >= tp) {
              status = "CLOSED_WIN";
              exitPrice = tp;
            } else if (currentPrice <= sl) {
              status = "CLOSED_LOSS";
              exitPrice = sl;
            }
            // Break-even: price hasn't moved meaningfully from entry
            else if (Math.abs(currentPrice - entry) < 0.001 * entry) {
              // Only close as BE if the trade has been open for a while (> 24h)
              const hoursOpen = (Date.now() - new Date(trade.opened_at).getTime()) / (1000 * 60 * 60);
              if (hoursOpen > 24) {
                status = "CLOSED_BE";
                exitPrice = currentPrice;
              }
            }
          } else {
            // SELL trade: TP below entry, SL above entry
            if (currentPrice <= tp) {
              status = "CLOSED_WIN";
              exitPrice = tp;
            } else if (currentPrice >= sl) {
              status = "CLOSED_LOSS";
              exitPrice = sl;
            }
            // Break-even check
            else if (Math.abs(currentPrice - entry) < 0.001 * entry) {
              const hoursOpen = (Date.now() - new Date(trade.opened_at).getTime()) / (1000 * 60 * 60);
              if (hoursOpen > 24) {
                status = "CLOSED_BE";
                exitPrice = currentPrice;
              }
            }
          }

          // ── Update the trade in Supabase if settled ──
          if (status && exitPrice !== null) {
            // Calculate PnL percentage
            let pnlPct: number;
            if (trade.direction === "BUY") {
              pnlPct = ((exitPrice - entry) / entry) * 100;
            } else {
              pnlPct = ((entry - exitPrice) / entry) * 100;
            }

            const { error: updateError } = await supabase
              .from("paper_trades")
              .update({
                status,
                exit_price: exitPrice,
                pnl_pct: Math.round(pnlPct * 100) / 100,
                closed_at: new Date().toISOString(),
              })
              .eq("id", trade.id);

            if (updateError) {
              console.error(`[PaperEngine] Failed to settle trade ${trade.id}:`, updateError.message);
              continue;
            }

            settled.push({
              id: trade.id,
              userId: trade.user_id,
              pair: trade.pair,
              direction: trade.direction,
              entryPrice: trade.entry_price,
              stopLoss: trade.stop_loss,
              takeProfit: trade.take_profit,
              sizePct: trade.size_pct,
              status,
              openedAt: trade.opened_at,
              closedAt: new Date().toISOString(),
              exitPrice,
              pnlPct: Math.round(pnlPct * 100) / 100,
              agentConfidence: trade.agent_confidence ?? 0,
              debateSummary: trade.debate_summary ?? undefined,
            });

            console.log(
              `[PaperEngine] Settled trade ${trade.id}: ${status} ` +
              `${trade.direction} ${trade.pair} (PnL: ${pnlPct.toFixed(2)}%)`,
            );
          }
        } catch (tradeErr) {
          console.error(
            `[PaperEngine] Error settling trade ${trade.id}:`,
            tradeErr instanceof Error ? tradeErr.message : String(tradeErr),
          );
          // Continue with other trades — don't let one failure stop the batch
        }
      }

      return settled;
    } catch (err) {
      console.error(
        "[PaperEngine] settleTrades failed:",
        err instanceof Error ? err.message : String(err),
      );
      return [];
    }
  }
}
