// ============================================================================
// Daily Loop Domain — Server Functions
// ============================================================================
//
// Server functions for the Daily Trader Loop feature.
// Provides get-or-create, update, and query operations for daily_loops
// and user_streaks tables.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type {
  DailyLoop,
  UserStreak,
  MarketBias,
  EmotionalState,
  TradingSession,
} from "./types";

// ── Helper: Calculate completion percentage from a raw DB row ──
function calcCompletion(loop: Record<string, any>): number {
  let score = 0;
  const total = 3; // 3 phases
  if (loop.morning_prep_completed) score += 1;

  // Session tracking: at least one session noted
  const hasSession =
    loop.london_session_traded ||
    loop.ny_session_traded ||
    loop.asian_session_traded ||
    !!(loop.london_session_notes || loop.ny_session_notes || loop.asian_session_notes);
  if (hasSession) score += 1;

  if (loop.eod_review_completed) score += 1;

  return Math.round((score / total) * 100);
}

// ── Helper: Update streak ──
async function updateStreak(supabase: any, userId: string, date: string) {
  // Get existing streak
  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  const today = new Date(date);
  const todayStr = today.toISOString().split("T")[0];

  if (existing) {
    const lastDate = existing.last_completed_date
      ? new Date(existing.last_completed_date)
      : null;
    const lastStr = lastDate ? lastDate.toISOString().split("T")[0] : null;

    // Already counted today
    if (lastStr === todayStr) return existing as UserStreak;

    // Check if yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const isConsecutive = lastStr === yesterdayStr;
    const newStreak = isConsecutive ? existing.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, existing.longest_streak);

    const { data, error } = await supabase
      .from("user_streaks")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_completed_date: todayStr,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) console.error("[DailyLoop] Streak update error:", error.message);
    return (data ?? existing) as UserStreak;
  } else {
    // Create new streak
    const { data, error } = await supabase
      .from("user_streaks")
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_completed_date: todayStr,
      })
      .select("*")
      .single();

    if (error) console.error("[DailyLoop] Streak insert error:", error.message);
    return data as UserStreak;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GET TODAY'S LOOP (or create if not exists)
// ═══════════════════════════════════════════════════════════════════════
export const getTodayLoop = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().split("T")[0];

    // Try to get existing
    const { data: existing, error: fetchError } = await supabase
      .from("daily_loops")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (existing) return existing as DailyLoop;
    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(fetchError.message);
    }

    // Create new
    const { data: created, error: insertError } = await supabase
      .from("daily_loops")
      .insert({ user_id: userId, date: today })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);
    return created as DailyLoop;
  });

// ═══════════════════════════════════════════════════════════════════════
// UPDATE MORNING PREP
// ═══════════════════════════════════════════════════════════════════════
export const updateMorningPrep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        loopId: z.string().uuid(),
        market_bias: z.enum(["bullish", "bearish", "neutral"]),
        key_levels: z.string().max(2000).default(""),
        watchlist_reviewed: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // First, get the current loop to compute new completion
    const { data: current } = await supabase
      .from("daily_loops")
      .select("*")
      .eq("id", data.loopId)
      .eq("user_id", userId)
      .single();

    const updated: Record<string, any> = {
      morning_prep_completed: true,
      morning_prep_at: new Date().toISOString(),
      market_bias: data.market_bias,
      key_levels: data.key_levels || null,
      watchlist_reviewed: data.watchlist_reviewed,
    };

    const completion = calcCompletion({ ...current, ...updated });
    updated.completion_percentage = completion;

    const { data: result, error } = await supabase
      .from("daily_loops")
      .update(updated as any)
      .eq("id", data.loopId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Update streak if completion >= 100%
    if (completion >= 100) {
      await updateStreak(supabase, userId, result.date);
    }

    return result as DailyLoop;
  });

// ═══════════════════════════════════════════════════════════════════════
// UPDATE SESSION TRACKING
// ═══════════════════════════════════════════════════════════════════════
export const updateSessionTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        loopId: z.string().uuid(),
        session: z.enum(["london", "ny", "asian"]),
        traded: z.boolean(),
        notes: z.string().max(2000).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const sessionKey = data.session as TradingSession;
    const tradedField = `${sessionKey}_session_traded`;
    const notesField = `${sessionKey}_session_notes`;

    // Get current loop
    const { data: current } = await supabase
      .from("daily_loops")
      .select("*")
      .eq("id", data.loopId)
      .eq("user_id", userId)
      .single();

    const updates: Record<string, any> = {
      [tradedField]: data.traded,
      [notesField]: data.notes || null,
    };

    const merged = { ...current, [tradedField]: data.traded, [notesField]: data.notes || null };
    const completion = calcCompletion(merged);
    updates.completion_percentage = completion;

    const { data: result, error } = await supabase
      .from("daily_loops")
      .update(updates as any)
      .eq("id", data.loopId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Update streak if completion >= 100%
    if (completion >= 100) {
      await updateStreak(supabase, userId, result.date);
    }

    return result as DailyLoop;
  });

// ═══════════════════════════════════════════════════════════════════════
// UPDATE END-OF-DAY REVIEW
// ═══════════════════════════════════════════════════════════════════════
export const updateEodReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        loopId: z.string().uuid(),
        daily_pnl: z.number().nullable().optional(),
        trades_taken: z.number().min(0).optional(),
        rules_followed: z.number().min(0).optional(),
        rules_broken: z.number().min(0).optional(),
        emotional_state: z.enum(["disciplined", "anxious", "fomo", "revenge", "calm", "tired"]),
        lessons_learned: z.string().max(5000).default(""),
        tomorrow_plan: z.string().max(5000).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get current loop for completion calc
    const { data: current } = await supabase
      .from("daily_loops")
      .select("*")
      .eq("id", data.loopId)
      .eq("user_id", userId)
      .single();

    const updates: Record<string, any> = {
      eod_review_completed: true,
      eod_review_at: new Date().toISOString(),
      emotional_state: data.emotional_state,
      lessons_learned: data.lessons_learned || null,
      tomorrow_plan: data.tomorrow_plan || null,
    };

    if (data.daily_pnl !== undefined) updates.daily_pnl = data.daily_pnl;
    if (data.trades_taken !== undefined) updates.trades_taken = data.trades_taken;
    if (data.rules_followed !== undefined) updates.rules_followed = data.rules_followed;
    if (data.rules_broken !== undefined) updates.rules_broken = data.rules_broken;

    const merged = { ...current, eod_review_completed: true };
    const completion = calcCompletion(merged);
    updates.completion_percentage = completion;

    const { data: result, error } = await supabase
      .from("daily_loops")
      .update(updates as any)
      .eq("id", data.loopId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Update streak if completion >= 100%
    if (completion >= 100) {
      await updateStreak(supabase, userId, result.date);
    }

    return result as DailyLoop;
  });

// ═══════════════════════════════════════════════════════════════════════
// GET LOOP HISTORY (last 30 days)
// ═══════════════════════════════════════════════════════════════════════
export const getLoopHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        limit: z.number().min(1).max(90).default(30),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: loops, error } = await supabase
      .from("daily_loops")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);
    return (loops ?? []) as DailyLoop[];
  });

// ═══════════════════════════════════════════════════════════════════════
// GET STREAK
// ═══════════════════════════════════════════════════════════════════════
export const getStreak = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return (data ?? null) as UserStreak | null;
  });
