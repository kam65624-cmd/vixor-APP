// ============================================================================
// VIXOR Signal Tracking — Server Functions
// ============================================================================
// CRUD + lifecycle management for per-user signal tracking.
// Uses createServerFn (TanStack Start) with requireSupabaseAuth middleware.
// Notifications are sent server-side when status changes to TP/SL hit.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { SignalTracking, SignalStatus, CreateSignalTrackingInput } from "./types";
import { TERMINAL_STATUSES, MONITORED_STATUSES } from "./types";
import { notificationRouter } from "@/shared/notifications";

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

// TODO(P1-4): take_profit array write-time element validation is missing.
// Malformed arrays (non-numeric, negative, wrong length) are accepted.
// This is documented for a later validation task — not addressed in 1.2C.

// TODO(Task-2): hit_tp is currently client-controlled. The server-authority
// implementation (Task 2) will derive hit_tp from the transition engine.
// Do NOT fix in 1.2C.

// ── Update Tracking Status ─────────────────────────────────────────────────

export const updateSignalTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const data = d as {
      trackingId: string;
      status: SignalStatus;
      currentPrice?: number;
      hitTp?: number;
    };
    if (!data.trackingId || !data.status) throw new Error("trackingId and status are required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { trackingId, status, currentPrice, hitTp } = data;
    const { userId, supabase } = context;

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (currentPrice !== undefined) updates.current_price = currentPrice;
    if (hitTp !== undefined) updates.hit_tp = hitTp;

    // Set resolved_at for terminal statuses
    if (TERMINAL_STATUSES.includes(status)) {
      updates.resolved_at = new Date().toISOString();
    }
    // Set activated_at when moving to active
    if (status === "active") {
      updates.activated_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("signal_tracking")
      .update(updates as any)
      .eq("id", trackingId)
      .eq("user_id", userId);

    if (error) {
      return { ok: false, error: error.message };
    }

    // ── Send notification for status changes that warrant user alerts ──
    // NOTE: tp1_hit and tp2_hit are INTERMEDIATE (not terminal) but still
    // deserve notifications. We check explicitly rather than relying on
    // TERMINAL_STATUSES to avoid silently dropping intermediate TP alerts.
    const warrantsNotification =
      status === "active" || status.startsWith("tp") || status === "sl_hit";
    if (warrantsNotification) {
      // Fetch the tracking to get pair/direction for notification
      const { data: tracking } = await supabase
        .from("signal_tracking")
        .select("pair, direction, entry_price, stop_loss, take_profit")
        .eq("id", trackingId)
        .single();

      if (tracking) {
        const dir = tracking.direction === "BUY" ? "Long" : "Short";
        let title = "";
        let body = "";
        let severity: "info" | "warning" = "info";

        if (status === "active") {
          title = "Entry Reached on {{pair}}";
          body = `${dir} ${tracking.pair} — Entry at $${tracking.entry_price?.toFixed(2) ?? "?"} reached. Now monitoring TP/SL.`;
        } else if (status.startsWith("tp")) {
          title = "TP Hit on {{pair}}!";
          body = `${dir} ${tracking.pair} — Take Profit hit at $${currentPrice?.toFixed(2) ?? "?"}! Signal: ${status}.`;
        } else if (status === "sl_hit") {
          title = "SL Hit on {{pair}}";
          body = `${dir} ${tracking.pair} — Stop Loss hit at $${currentPrice?.toFixed(2) ?? "?"}! Signal closed.`;
          severity = "warning";
        }

        if (title) {
          void notificationRouter
            .send({
              userId,
              title,
              body,
              severity,
              payload: {
                pair: tracking.pair,
                direction: tracking.direction,
                price: currentPrice,
                status,
              },
            })
            .catch(() => {
              /* non-blocking */
            });
        }
      }
    }

    return { ok: true, error: null };
  });

// ── Cancel Tracking ────────────────────────────────────────────────────────

export const cancelSignalTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const data = d as { trackingId: string };
    if (!data.trackingId) throw new Error("trackingId is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { trackingId } = data;
    const { userId, supabase } = context;

    const { error } = await supabase
      .from("signal_tracking")
      .update({
        status: "cancelled",
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", trackingId)
      .eq("user_id", userId);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, error: null };
  });

// TODO(Task-2): This client-side price evaluation will be replaced by
// server-authority evaluation. Kept for legacy compatibility until Task 6.

// ── Price Check: Evaluate a single tracking against a price ────────────────
// This runs on the CLIENT (called from useSignalMonitor hook).

export function evaluateTrackingPrice(
  tracking: SignalTracking,
  currentPrice: number,
): {
  hitType: "entry_reached" | "tp_hit" | "sl_hit" | "none";
  tpLevel?: number;
  newStatus?: SignalStatus;
} {
  if (tracking.direction === "WAIT") {
    return { hitType: "none" };
  }

  if (!tracking.entry_price && !tracking.stop_loss) {
    return { hitType: "none" };
  }

  // PENDING: Check if entry price is reached
  if (tracking.status === "pending" && tracking.entry_price) {
    const entry = tracking.entry_price;
    if (tracking.direction === "BUY") {
      if (currentPrice <= entry) {
        return { hitType: "entry_reached", newStatus: "active" };
      }
    } else {
      if (currentPrice >= entry) {
        return { hitType: "entry_reached", newStatus: "active" };
      }
    }
    return { hitType: "none" };
  }

  // ACTIVE: Monitor TP/SL
  if (tracking.status === "active") {
    const tps: number[] = Array.isArray(tracking.take_profit) ? tracking.take_profit : [];

    if (tracking.direction === "BUY") {
      if (tracking.stop_loss && currentPrice <= tracking.stop_loss) {
        return { hitType: "sl_hit", newStatus: "sl_hit" };
      }
      for (let i = tracking.hit_tp; i < tps.length; i++) {
        if (currentPrice >= tps[i]) {
          const nextStatus = `tp${i + 1}_hit` as SignalStatus;
          return { hitType: "tp_hit", tpLevel: tps[i], newStatus: nextStatus };
        }
      }
    } else {
      if (tracking.stop_loss && currentPrice >= tracking.stop_loss) {
        return { hitType: "sl_hit", newStatus: "sl_hit" };
      }
      for (let i = tracking.hit_tp; i < tps.length; i++) {
        if (currentPrice <= tps[i]) {
          const nextStatus = `tp${i + 1}_hit` as SignalStatus;
          return { hitType: "tp_hit", tpLevel: tps[i], newStatus: nextStatus };
        }
      }
    }
  }

  return { hitType: "none" };
}

// TODO(P1-cleanup): updateExcursions() is dead-code — exported but has zero
// production callers. MFE/MAE values remain at DB defaults (0).
// Documented for later cleanup task. Do NOT remove in 1.2C.

// ── Update MFE/MAE (client-side) ──────────────────────────────────────────

export function updateExcursions(
  tracking: SignalTracking,
  currentPrice: number,
): { maxFavorable: number; maxAdverse: number } {
  if (tracking.direction === "WAIT" || !tracking.entry_price) {
    return {
      maxFavorable: tracking.max_favorable_excursion,
      maxAdverse: tracking.max_adverse_excursion,
    };
  }

  let mfe = tracking.max_favorable_excursion;
  let mae = tracking.max_adverse_excursion;
  const entry = tracking.entry_price;

  if (tracking.direction === "BUY") {
    const favorable = currentPrice - entry;
    const adverse = entry - currentPrice;
    if (favorable > mfe) mfe = favorable;
    if (adverse > mae) mae = adverse;
  } else {
    const favorable = entry - currentPrice;
    const adverse = currentPrice - entry;
    if (favorable > mfe) mfe = favorable;
    if (adverse > mae) mae = adverse;
  }

  return { maxFavorable: mfe, maxAdverse: mae };
}
