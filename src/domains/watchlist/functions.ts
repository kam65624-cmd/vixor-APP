// ============================================================================
// Watchlist Domain — Server Functions
// ============================================================================
//
// User watchlist CRUD operations.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

export const getWatchlists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("watchlists")
        .select("*, items:watchlist_items(*)")
        .eq("user_id", context.userId)
        .order("sort_order");
      if (error) {
        console.warn("[Watchlist] getWatchlists error:", error.message);
        return [];
      }
      return data ?? [];
    } catch {
      return [];
    }
  });

export const getDefaultWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("watchlists")
        .select("*, items:watchlist_items(*)")
        .eq("user_id", context.userId)
        .eq("is_default", true)
        .maybeSingle();
      if (error) {
        console.warn("[Watchlist] getDefaultWatchlist error:", error.message);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  });

export const addToWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    watchlistId: z.string().uuid().optional(),
    pair: z.string().min(1).max(20),
    category: z.enum(["forex", "crypto", "commodity", "stocks"]).default("forex"),
    notes: z.string().max(200).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    let watchlistId = data.watchlistId;

    if (!watchlistId) {
      const { data: wl } = await supabase
        .from("watchlists")
        .select("id")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle();
      if (!wl) {
        const { data: newWl, error: wlErr } = await supabase
          .from("watchlists")
          .insert({ user_id: userId, name: "My Watchlist", is_default: true })
          .select("id")
          .single();
        if (wlErr) throw new Error(wlErr.message);
        watchlistId = newWl.id;
      } else {
        watchlistId = wl.id;
      }
    }

    const { data: existing } = await supabase
      .from("watchlist_items")
      .select("sort_order")
      .eq("watchlist_id", watchlistId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data: item, error } = await supabase
      .from("watchlist_items")
      .insert({
        watchlist_id: watchlistId,
        pair: data.pair,
        category: data.category,
        notes: data.notes,
        sort_order: nextOrder,
      })
      .select()
      .single();
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        throw new Error("ALREADY_ADDED");
      }
      throw new Error(error.message);
    }
    return item;
  });

export const removeFromWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("watchlist_items")
      .delete()
      .eq("id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateWatchlistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    itemId: z.string().uuid(),
    notes: z.string().max(200).optional(),
    sortOrder: z.number().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const update: { notes?: string; sort_order?: number } = {};
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.sortOrder !== undefined) update.sort_order = data.sortOrder;
    
    const { error } = await context.supabase
      .from("watchlist_items")
      .update(update)
      .eq("id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({
    items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number() })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    for (const item of data.items) {
      await supabaseAdmin
        .from("watchlist_items")
        .update({ sort_order: item.sortOrder })
        .eq("id", item.id);
    }
    return { ok: true };
  });
