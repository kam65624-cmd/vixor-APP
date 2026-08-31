// ============================================================================
// VIXOR Signal Tracking — Auto-Track Daily Signals
// ============================================================================
//
// Automatically creates signal trackings for today's high-confidence daily signals.
// Wires the Signal Generation → Tracking part of the product loop.
//
// ============================================================================

import { supabaseAdmin } from "@/shared/supabase/client.server";
import { VixorEvents } from "@/shared/events";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AutoTrackResult {
  tracked: number;
  skipped: number;
  errors: number;
  details: { pair: string; action: "tracked" | "skipped" | "error"; reason?: string }[];
}

interface DailySignalRow {
  id: string;
  pair: string;
  timeframe: string;
  recommendation: string;
  confidence: number;
  entry: number | null;
  stop_loss: number | null;
  take_profit: number[] | null;
  signal_date: string;
}

// ── Main Function ────────────────────────────────────────────────────────────

/**
 * Automatically create signal trackings for today's high-confidence daily signals.
 * Only tracks signals with confidence >= minConfidence and direction != WAIT.
 */
export async function autoTrackDailySignals(options?: {
  minConfidence?: number;
  userId?: string;
}): Promise<AutoTrackResult> {
  const minConfidence = options?.minConfidence ?? 65;
  const userId = options?.userId;

  const result: AutoTrackResult = {
    tracked: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  // 1. Fetch today's daily signals from Supabase
  const today = new Date().toISOString().split("T")[0];

  const query = supabaseAdmin
    .from("daily_signals")
    .select("*")
    .eq("signal_date", today)
    .order("confidence", { ascending: false });

  const { data: signals, error: fetchError } = await query;

  if (fetchError || !signals) {
    return {
      tracked: 0,
      skipped: 0,
      errors: 1,
      details: [
        {
          pair: "*",
          action: "error",
          reason: fetchError?.message ?? "Failed to fetch daily signals",
        },
      ],
    };
  }

  const dailySignals = signals as DailySignalRow[];

  // 2. Filter by confidence >= minConfidence and direction != 'WAIT'
  const eligible = dailySignals.filter(
    (s) => s.confidence >= minConfidence && s.recommendation !== "WAIT",
  );

  // 3. For each signal, check duplicates and create tracking
  for (const signal of eligible) {
    try {
      // If userId is specified, check for existing tracking (avoid duplicates)
      if (userId) {
        const { data: existing } = await supabaseAdmin
          .from("signal_tracking")
          .select("id")
          .eq("user_id", userId)
          .eq("signal_id", signal.id)
          .maybeSingle();

        if (existing) {
          result.skipped++;
          result.details.push({
            pair: signal.pair,
            action: "skipped",
            reason: "Already tracking this signal",
          });
          continue;
        }
      }

      // 4. Create signal tracking
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: row, error: insertError } = await supabaseAdmin
        .from("signal_tracking")
        .insert({
          signal_id: signal.id,
          source_type: "daily_signal",
          pair: signal.pair,
          direction: signal.recommendation,
          entry_price: signal.entry ?? null,
          stop_loss: signal.stop_loss ?? null,
          take_profit: signal.take_profit ?? [],
          expires_at: expiresAt,
          user_id: userId ?? "system",
        })
        .select("id, pair, direction, entry_price, stop_loss")
        .single();

      if (insertError || !row) {
        result.errors++;
        result.details.push({
          pair: signal.pair,
          action: "error",
          reason: insertError?.message ?? "Insert failed",
        });
        continue;
      }

      // 5. Emit signal.tracking.created event
      void VixorEvents.emit("signal.tracking.created", {
        trackingId: row.id,
        userId: userId ?? "system",
        pair: row.pair,
        direction: row.direction as "BUY" | "SELL" | "WAIT",
        entryPrice: row.entry_price ?? 0,
        stopLoss: row.stop_loss ?? 0,
      });

      result.tracked++;
      result.details.push({ pair: signal.pair, action: "tracked" });
    } catch (err) {
      result.errors++;
      result.details.push({
        pair: signal.pair,
        action: "error",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Add skipped count for filtered-out signals
  const skippedByFilter = dailySignals.length - eligible.length;
  result.skipped += skippedByFilter;
  for (const signal of dailySignals) {
    if (!eligible.includes(signal)) {
      const reason =
        signal.recommendation === "WAIT"
          ? "Direction is WAIT"
          : `Confidence ${signal.confidence} < ${minConfidence}`;
      result.details.push({ pair: signal.pair, action: "skipped", reason });
    }
  }

  return result;
}
