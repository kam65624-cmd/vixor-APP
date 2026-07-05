// ============================================================================
// Broker Domain — Server Functions
// ============================================================================
//
// Broker connection management: get, connect, disconnect.
// Uses a raw (untyped) Supabase client since `broker_connections` table
// may not yet be in the generated Supabase types.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

/** Untyped Supabase admin client for tables not yet in generated types. */
function getRawAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getConnectedBrokers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const db = getRawAdmin();
      const { data, error } = await db
        .from("broker_connections")
        .select("id, broker_name, status, connected_at")
        .eq("user_id", context.userId)
        .eq("status", "connected")
        .order("connected_at", { ascending: false });
      if (error) {
        console.warn("[Broker] getConnectedBrokers error:", error.message);
        return [];
      }
      return (data ?? []) as Array<{ id: string; broker_name: string; status: string; connected_at: string }>;
    } catch {
      return [];
    }
  });

export const connectBroker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ brokerName: z.string().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = getRawAdmin();
    const { userId } = context;

    const { data: existing } = await db
      .from("broker_connections")
      .select("id")
      .eq("user_id", userId)
      .eq("broker_name", data.brokerName)
      .maybeSingle();

    if (existing) {
      const { error } = await db
        .from("broker_connections")
        .update({ status: "connected", connected_at: new Date().toISOString() })
        .eq("id", (existing as { id: string }).id);
      if (error) throw new Error(error.message);
      return { ok: true as const, brokerName: data.brokerName, reconnected: true };
    }

    const { error } = await db.from("broker_connections").insert({
      user_id: userId,
      broker_name: data.brokerName,
      status: "connected",
      connected_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, brokerName: data.brokerName, reconnected: false };
  });

export const disconnectBroker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ brokerName: z.string().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = getRawAdmin();
    const { error } = await db
      .from("broker_connections")
      .update({ status: "disconnected" })
      .eq("user_id", context.userId)
      .eq("broker_name", data.brokerName);
    if (error) throw new Error(error.message);
    return { ok: true as const, brokerName: data.brokerName };
  });