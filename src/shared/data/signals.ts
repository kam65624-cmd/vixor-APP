import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Trading Journal ─────────────────────────
export const getJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: entries } = await supabase
      .from("trading_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { entries: entries || [] };
  });

// ── Daily Signals (for signals page) ────────────────────────
export const getDailySignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data: signals } = await supabase
      .from("daily_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return { signals: signals || [] };
  });

// ── Recent Analyses (for vision page) ────────────────────────
export const getRecentAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: analyses } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return { analyses: analyses || [] };
  });
