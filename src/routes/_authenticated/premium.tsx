import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPremiumData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { PageLayout, THEME, Badge, ScrollArea, EmptyState } from "@/components/vixor/PageLayout";

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
    const { error } = await supabase.from("premium_subscriptions").upsert(
      {
        user_id: userId,
        plan_id: data.planId,
        status: "active",
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
      { onConflict: "user_id" },
    );

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
  const currentPlanName = plans.find((p) => p.id === currentPlanId)?.name || "Pro";

  return (
    <PageLayout
      title="Vixor Pro"
      badge="PREMIUM"
      badgeColor={THEME.green}
      description={
        subscription
          ? `You are on the ${currentPlanName} plan`
          : "Upgrade to unlock advanced features"
      }
      loading={isLoading}
      loadingColor={THEME.green}
    >
      <ScrollArea>
        {/* Active subscription banner */}
        {subscription && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              borderBottom: `1px solid ${THEME.border}`,
              background: THEME.surface,
            }}
          >
            <Badge
              label={`ACTIVE · Renews ${new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              color={THEME.green}
            />
          </div>
        )}

        {plans.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              padding: "16px",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const features = Array.isArray((plan as any).features)
                ? ((plan as any).features as string[])
                : [];
              return (
                <div
                  key={plan.id}
                  style={{
                    background: isCurrent ? THEME.surface : THEME.surfaceAlt,
                    borderRadius: "16px",
                    border: `1px solid ${isCurrent ? `${THEME.green}4D` : THEME.border}`,
                    padding: "24px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                      }}
                    >
                      <Badge label="CURRENT" color={THEME.accent} />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      marginBottom: "4px",
                      color: THEME.text,
                    }}
                  >
                    {plan.name}
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      marginBottom: "4px",
                      color: THEME.text,
                    }}
                  >
                    ${(plan.price_cents / 100).toFixed(0)}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: THEME.textSecondary,
                      }}
                    >
                      /mo
                    </span>
                  </div>
                  {(plan as any).badge && <Badge label={(plan as any).badge} color={THEME.amber} />}
                  <div style={{ marginTop: "16px", marginBottom: "20px" }}>
                    {features.length > 0 ? (
                      features.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                            fontSize: "12px",
                          }}
                        >
                          <span
                            style={{
                              color: THEME.green,
                              fontSize: "12px",
                            }}
                          >
                            ✓
                          </span>
                          <span style={{ color: THEME.textSecondary }}>{f}</span>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          fontSize: "12px",
                          color: THEME.textMuted,
                        }}
                      >
                        {plan.price_cents > 0
                          ? `Included with ${plan.name}`
                          : "Basic features included"}
                      </div>
                    )}
                  </div>
                  {isCurrent ? (
                    <button
                      disabled
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: `1px solid ${THEME.green}33`,
                        background: `${THEME.green}14`,
                        color: THEME.accent,
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "default",
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                      }}
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      disabled={subscribing === plan.id}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "none",
                        background: THEME.green,
                        color: THEME.text,
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: subscribing === plan.id ? "wait" : "pointer",
                        opacity: subscribing ? 0.7 : 1,
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {subscribing === plan.id ? "Processing..." : "Upgrade"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="💎"
            title="No plans available"
            message="No premium plans available yet. Check back soon."
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}
