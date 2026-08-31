import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Watchlist Data (for trackers page) ────────────────────────
export const getWatchlistData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: watchlists } = await supabase
      .from("watchlists")
      .select("id, name, is_default, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // watchlist_items doesn't have user_id — join via watchlists to enforce ownership
    const { data: items } = await supabase
      .from("watchlist_items")
      .select("*")
      .in(
        "watchlist_id",
        (watchlists || []).map((w: { id: string }) => w.id),
      )
      .order("added_at", { ascending: false })
      .limit(100);

    const { data: alerts } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return {
      watchlists: watchlists || [],
      watchlistItems: items || [],
      priceAlerts: alerts || [],
    };
  });
