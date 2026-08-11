// ============================================================================
// VIXOR Signal Tracking — Server Functions
// ============================================================================
// CRUD + lifecycle management for per-user signal tracking.
// Uses createServerFn (TanStack Start) with requireSupabaseAuth middleware.
//
// Signal STATUS transitions are handled by signal-transition.service.ts
// via requestSignalTransition (transition.server.fn.ts). This module only
// provides creation and read operations.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { SignalTracking, CreateSignalTrackingInput } from "./types";

// ── Create Tracking ────────────────────────────────────────────────────────

export const createSignalTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const data = d as CreateSignalTrackingInput;
    if (!data.pair || !data.direction) throw new Error("pair and direction are required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Prevent duplicate: same user + signal_id
    if (data.signalId) {
      const { data: existing } = await supabase
        .from("signal_tracking")
        .select("id")
        .eq("user_id", userId)
        .eq("signal_id", data.signalId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        return { ok: false as const, error: "ALREADY_TRACKING" as const, trackingId: existing.id };
      }
    }

    // Calculate expiry: default 24h from now
    const expiresAt = data.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: row, error } = await supabase
      .from("signal_tracking")
      .insert({
        user_id: userId,
        signal_id: data.signalId ?? null,
        source_type: data.sourceType ?? "daily_signal",
        pair: data.pair,
        direction: data.direction,
        entry_price: data.entryPrice ?? null,
        stop_loss: data.stopLoss ?? null,
        take_profit: data.takeProfit ?? [],
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error || !row) {
      return { ok: false, error: error?.message ?? "insert_failed", trackingId: null };
    }

    return { ok: true, error: null, trackingId: row.id };
  });

// ── Get User's Trackings ───────────────────────────────────────────────────

export const getUserSignalTrackings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;

    const { data, error } = await supabase
      .from("signal_tracking")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { trackings: (data ?? []) as SignalTracking[], error: null };
  });
