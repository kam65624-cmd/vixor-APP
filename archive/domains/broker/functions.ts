import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

export const getConnectedBrokers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("connected_brokers")
      .eq("id", context.userId)
      .single();
    return (profile as any)?.connected_brokers ?? [];
  });

export const connectBroker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      brokerName: z.string(),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      accountId: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("connected_brokers")
      .eq("id", context.userId)
      .single();
    const brokers: any[] = (profile as any)?.connected_brokers ?? [];
    const entry = {
      broker_name: data.brokerName,
      status: "connected",
      account_id: data.accountId ?? null,
      connected_at: new Date().toISOString(),
    };
    const existing = brokers.findIndex((b: any) => b.broker_name === data.brokerName);
    if (existing >= 0) {
      brokers[existing] = entry;
    } else {
      brokers.push(entry);
    }
    await context.supabase
      .from("profiles")
      .update({ connected_brokers: brokers } as any)
      .eq("id", context.userId);
    return { success: true };
  });

export const disconnectBroker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ brokerName: z.string() }))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("connected_brokers")
      .eq("id", context.userId)
      .single();
    const brokers: any[] = ((profile as any)?.connected_brokers ?? []).filter(
      (b: any) => b.broker_name !== data.brokerName,
    );
    await context.supabase
      .from("profiles")
      .update({ connected_brokers: brokers } as any)
      .eq("id", context.userId);
    return { success: true };
  });
