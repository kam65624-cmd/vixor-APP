// ============================================================================
// VIXOR Trades Domain — Server Functions
// ============================================================================
// Phase 2 Fix (F1): createTrade now persists ALL validated fields.
// Previously only entry_date + quantity were inserted; all trade parameters
// (pair, direction, entry_price, stop_loss, take_profit) were silently dropped.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { TablesInsert } from "@/shared/supabase/types";
import type { Trade, TradeDirection, TradeStatus } from "./types";

// ── Validation Schemas ─────────────────────────────────────────────────────
// Server-authoritative validation. These schemas are the single source of
// truth for what constitutes a valid trade creation or update request.

const createTradeSchema = z.object({
  pair: z.string().min(1, "Pair is required"),
  direction: z.enum(["long", "short"] as const),
  entry_price: z.number().positive("Entry price must be positive"),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  amount: z.number().positive("Amount must be positive"),
  leverage: z.number().min(1).default(1),
  notes: z.string().max(5000).optional(),
  strategy: z.string().max(255).optional(),
});

const listTradesSchema = z.object({
  status: z.enum(["open", "closed", "cancelled"] as const).default("open"),
  limit: z.number().int().min(1).max(200).default(50),
});

const updateTradeSchema = z.object({
  tradeId: z.string().uuid("Invalid trade ID"),
  exit_price: z.number().positive().optional(),
  exit_date: z.string().optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  status: z.enum(["open", "closed", "cancelled"] as const).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
  strategy: z.string().max(255).optional(),
});

// ── TradeRow: the shape we insert into the database ───────────────────────
// This type is derived from the Supabase generated types to ensure
// compile-time alignment with the database schema.

type TradeInsertRow = Omit<
  TablesInsert<"trades">,
  "id" | "pnl" | "pnl_pips" | "r_multiple" | "created_at" | "updated_at"
>;

// ── Server Functions ───────────────────────────────────────────────────────

export const listTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(listTradesSchema)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("trades")
      .select("*")
      .eq("user_id", context.userId)
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(`Failed to list trades: ${error.message}`);
    return (rows as Trade[]) ?? [];
  });

/**
 * Create a new trade.
 *
 * SERVER-AUTHORITATIVE: All fields are validated server-side and
 * the user_id is taken from the authenticated session, never from
 * the request body. The `amount` field from the UI is mapped to
 * `quantity` in the database.
 *
 * Generated columns (pnl, pnl_pips, r_multiple) are NEVER included
 * in the insert — they are computed by the database.
 */
export const createTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(createTradeSchema)
  .handler(async ({ data, context }) => {
    // Build the insert row — only fields that exist in the DB schema
    // user_id comes from the authenticated session (server-authoritative)
    const insertRow: TradeInsertRow = {
      user_id: context.userId,
      pair: data.pair,
      direction: data.direction,
      entry_price: data.entry_price,
      entry_date: new Date().toISOString(),
      quantity: data.amount,
      stop_loss: data.stop_loss ?? null,
      take_profit: data.take_profit ?? null,
      notes: data.notes ?? null,
      strategy: data.strategy ?? null,
    };

    const { data: row, error } = await context.supabase
      .from("trades")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      // Distinguish validation errors from database errors
      if (error.code === "23505") {
        throw new Error("Trade already exists");
      }
      throw new Error(`Failed to create trade: ${error.message}`);
    }

    if (!row) throw new Error("Failed to create trade: no data returned");
    return row as unknown as Trade;
  });

/**
 * Update an existing trade.
 * SERVER-AUTHORITATIVE: Verifies ownership before allowing updates.
 * Generated columns (pnl, pnl_pips, r_multiple) are NEVER writable.
 */
export const updateTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(updateTradeSchema)
  .handler(async ({ data, context }) => {
    // Verify ownership: only the trade owner can update it
    const { data: existing, error: fetchError } = await context.supabase
      .from("trades")
      .select("id, user_id")
      .eq("id", data.tradeId)
      .single();

    if (fetchError || !existing) {
      throw new Error("Trade not found");
    }
    if (existing.user_id !== context.userId) {
      throw new Error("Unauthorized: you do not own this trade");
    }

    // Build update payload — only mutable fields
    const updates: Partial<TradeInsertRow> = {};
    if (data.exit_price !== undefined) updates.exit_price = data.exit_price;
    if (data.exit_date !== undefined) updates.exit_date = data.exit_date;
    if (data.stop_loss !== undefined) updates.stop_loss = data.stop_loss;
    if (data.take_profit !== undefined) updates.take_profit = data.take_profit;
    if (data.status !== undefined) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.strategy !== undefined) updates.strategy = data.strategy;

    const { data: row, error } = await context.supabase
      .from("trades")
      .update(updates)
      .eq("id", data.tradeId)
      .eq("user_id", context.userId)
      .select("*")
      .single();

    if (error) throw new Error(`Failed to update trade: ${error.message}`);
    if (!row) throw new Error("Trade not found after update");
    return row as unknown as Trade;
  });

export const deleteTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ tradeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Verify ownership before deletion
    const { error } = await context.supabase
      .from("trades")
      .delete()
      .eq("id", data.tradeId)
      .eq("user_id", context.userId);

    if (error) throw new Error(`Failed to delete trade: ${error.message}`);
    return { success: true };
  });

export const getTradeStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: trades } = await context.supabase
      .from("trades")
      .select("pnl, status")
      .eq("user_id", context.userId);

    if (!trades) return null;

    const all = trades as { pnl: number | null; status: string }[];
    const closed = all.filter((t) => t.status === "closed" && t.pnl !== null);
    const wins = closed.filter((t) => (t.pnl as number) > 0);

    return {
      totalTrades: all.length,
      openTrades: all.filter((t) => t.status === "open").length,
      closedTrades: closed.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
      totalPnl: closed.reduce((sum, t) => sum + ((t.pnl as number) ?? 0), 0),
      avgPnl:
        closed.length > 0
          ? closed.reduce((sum, t) => sum + ((t.pnl as number) ?? 0), 0) / closed.length
          : 0,
      bestTrade: closed.length > 0 ? Math.max(...closed.map((t) => t.pnl as number)) : 0,
      worstTrade: closed.length > 0 ? Math.min(...closed.map((t) => t.pnl as number)) : 0,
    };
  });

// ── Type exports for backward compatibility ────────────────────────────────
// These re-exports ensure existing consumers don't break.

export type {
  TradeDirection,
  TradeStatus,
  CreateTradeInput,
  UpdateTradeInput,
  ListTradesFilters,
  TradeStats,
  EquityCurvePoint,
} from "./types";
