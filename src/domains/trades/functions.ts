import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { Trade, TradeDirection } from "./types";

export const listTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      status: z.enum(["open", "closed"]).default("open"),
      limit: z.number().default(50),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("trades")
      .select("*")
      .eq("user_id", context.userId)
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return (rows as unknown[]) as Trade[];
  });

export const createTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      pair: z.string(),
      direction: z.enum(["long", "short"]),
      entry_price: z.number(),
      stop_loss: z.number().optional(),
      take_profit: z.number().optional(),
      amount: z.number(),
      leverage: z.number().default(1),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("trades")
      .insert({
        entry_date: new Date().toISOString(),
        quantity: data.amount,
      } as any);
    if (!row) throw new Error("Failed to create trade");
    return row as unknown as Trade;
  });