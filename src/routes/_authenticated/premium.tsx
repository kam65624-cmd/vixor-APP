import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getPremiumData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({ meta: [{ title: "Premium — Vixor" }] }),
  component: PremiumPage,
});

// Server function to subscribe to a plan
export const subscribeToPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ planId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Upsert subscription
    const { error } = await supabase
      .from("premium_subscriptions")
      .upsert({
        user_id: userId,
        plan_id: data.planId,
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
    return { success: true };
  });

function PremiumPage() {
  const fetchPremium = useStableServerFn(getPremiumData);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["premium-data"],
    queryFn: () => fetchPremium({}),
    staleTime: 60_000,
  });

  const plans = query.data?.plans ?? [];
  const subscription = query.data?.subscription ?? null;
  const isLoading = query.isLoading;

  const currentPlanId = subscription?.plan_id;

  return (
    <div style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{
          fontSize: "28px", fontWeight: 800, margin: 0,
          background: "linear-gradient(135deg, #10B981, #8B5CF6, #EC4899)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Vixor Pro</h1>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>
          {subscription
            ? `You are on the ${plans.find((p) => p.id === currentPlanId)?.name || "Pro"} plan`
            : "Upgrade to unlock advanced features"}
        </p>
        {subscription && (
          <span className="text-[10px] font-bold px-2 py-1 rounded mt-2 inline-block" style={{
            background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)",
          }}>ACTIVE · Renews {new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : plans.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`, gap: "16px", maxWidth: "900px", margin: "0 auto" }}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const features = Array.isArray((plan as any).features) ? (plan as any).features as string[] : [];
            return (
              <div key={plan.id} style={{
                background: isCurrent ? "#1A1A1A" : "#1E1E1E",
                borderRadius: "16px", border: `1px solid ${isCurrent ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
                padding: "24px", position: "relative", overflow: "hidden",
              }}>
                {isCurrent && (
                  <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}>CURRENT</span>
                  </div>
                )}
                <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px" }}>{plan.name}</div>
                <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", marginBottom: "4px" }}>
                  ${(plan.price_cents / 100).toFixed(0)}
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF" }}>/mo</span>
                </div>
                {(plan as any).badge && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded mb-4 inline-block" style={{
                    background: "rgba(245,158,11,0.12)", color: "#F59E0B",
                  }}>{plan.badge}</span>
                )}
                <div style={{ marginTop: "16px", marginBottom: "20px" }}>
                  {features.length > 0 ? features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px" }}>
                      <span style={{ color: "#22C55E", fontSize: "12px" }}>\u2713</span>
                      <span style={{ color: "#9CA3AF" }}>{f}</span>
                    </div>
                  )) : (
                    <div style={{ fontSize: "12px", color: "#6B7280" }}>
                      {plan.price_cents > 0 ? `Included with ${plan.name}` : "Basic features included"}
                    </div>
                  )}
                </div>
                {isCurrent ? (
                  <button disabled style={{
                    width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.2)",
                    background: "rgba(16,185,129,0.08)", color: "#34D399", fontSize: "12px", fontWeight: 700,
                    cursor: "default", fontFamily: "'Inter', system-ui, sans-serif",
                  }}>Current Plan</button>
                ) : (
                  <button disabled={subscribing === plan.id} style={{
                    width: "100%", padding: "10px", borderRadius: "8px", border: "none",
                    background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontSize: "12px", fontWeight: 700,
                    cursor: subscribing === plan.id ? "wait" : "pointer", opacity: subscribing ? 0.7 : 1,
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    {subscribing === plan.id ? "Processing..." : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No premium plans available yet. Check back soon.</p>
        </div>
      )}
    </div>
  );
}