/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { getPremiumData } from "@/shared/data";
import { createStarsInvoice } from "@/domains/user/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { PageLayout, Badge, ScrollArea, EmptyState } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({ meta: [{ title: "Premium — Vixor" }] }),
  component: PremiumPage,
});

// Server function to subscribe to a plan
export const subscribeToPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ planId: z.string() }).parse(d))
  .handler(async () => {
    // Subscription status is granted only by the verified Telegram Stars webhook.
    // Keep this endpoint fail-closed for clients that still call the legacy action.
    throw new Error(
      "Premium activation requires a confirmed payment. Use Telegram Stars checkout.",
    );
  });

function PremiumPage() {
  const fetchPremium = useStableServerFn(getPremiumData);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) =>
      createStarsInvoice({ data: { kind: "premium", resourceId: planId } }),
    onMutate: (planId) => {
      setSubscribing(planId);
      setSubscribeError(null);
    },
    onSuccess: (result) => {
      // Telegram owns the checkout UI; premium is enabled only after the verified webhook.
      window.location.assign(result.invoiceUrl);
    },
    onError: (err: Error) => {
      setSubscribeError(err.message || "Could not create Telegram Stars invoice.");
      setTimeout(() => setSubscribeError(null), 5000);
    },
    onSettled: () => {
      setSubscribing(null);
    },
  });

  const query = useQuery({
    queryKey: ["premium-data"],
    queryFn: () => fetchPremium({}),
    staleTime: 60_000,
  });

  const plans = query.data?.plans ?? [];
  const subscription = query.data?.subscription ?? null;
  const isLoading = query.isLoading;

  // Fallback plans when DB is empty
  const visiblePlans =
    plans.length > 0
      ? plans
      : ([
          {
            id: "pro-monthly",
            name: "Pro",
            price_cents: 2900,
            features: ["MOXI AI access", "Advanced signals", "Priority alerts", "Extended history"],
          },
          {
            id: "pro-yearly",
            name: "Pro Annual",
            price_cents: 24900,
            badge: "SAVE 28%",
            features: [
              "Everything in Pro",
              "Annual billing",
              "Dedicated support",
              "Early access to features",
            ],
          },
        ] as any[]);

  const currentPlanId = subscription?.plan_id;
  const currentPlanName = plans.find((p) => p.id === currentPlanId)?.name || "Pro";

  return (
    <PageLayout
      title="Vixor Pro"
      badge="PREMIUM"
      badgeColor={"var(--color-bullish)"}
      loading={isLoading}
      loadingColor={"var(--color-bullish)"}
    >
      <ScrollArea>
        {/* Error banner */}
        {subscribeError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              background: `${"var(--color-bearish)"}14`,
              borderBottom: `1px solid ${"var(--color-bearish)"}33`,
              color: "var(--color-bearish)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            ⚠ {subscribeError}
          </div>
        )}
        {/* Active subscription banner */}
        {subscription && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              borderBottom: `1px solid ${"var(--color-border)"}`,
              background: "var(--color-card)",
            }}
          >
            <Badge
              label={`ACTIVE · Renews ${new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              color={"var(--color-bullish)"}
            />
          </div>
        )}

        {visiblePlans.length > 0 ? (
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
            {visiblePlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const starsPrice = (plan as { stars_price?: number | null }).stars_price;
              const hasStarsPrice = Number.isSafeInteger(starsPrice) && (starsPrice ?? 0) > 0;
              const canCheckout =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id) &&
                hasStarsPrice;
              const features = Array.isArray((plan as any).features)
                ? ((plan as any).features as string[])
                : [];
              return (
                <div
                  key={plan.id}
                  style={{
                    background: isCurrent ? "var(--color-card)" : "var(--color-card-hover)",
                    borderRadius: "16px",
                    border: `1px solid ${isCurrent ? `${"var(--color-bullish)"}4D` : "var(--color-border)"}`,
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
                      <Badge label="CURRENT" color={"var(--color-primary)"} />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      marginBottom: "4px",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {plan.name}
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      marginBottom: "4px",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {hasStarsPrice ? String(starsPrice) + " Stars" : "$" + (plan.price_cents / 100).toFixed(0)}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      {plan.interval === "year" ? "/year" : "/month"}
                    </span>
                  </div>
                  {(plan as any).badge && (
                    <Badge label={(plan as any).badge} color={"var(--color-neutral-wait)"} />
                  )}
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
                              color: "var(--color-bullish)",
                              fontSize: "12px",
                            }}
                          >
                            ✓
                          </span>
                          <span style={{ color: "var(--color-muted-foreground)" }}>{f}</span>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-muted-foreground)",
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
                        border: `1px solid ${"var(--color-bullish)"}33`,
                        background: `${"var(--color-bullish)"}14`,
                        color: "var(--color-primary)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "default",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      disabled={subscribing === plan.id || !canCheckout}
                      onClick={() => subscribeMutation.mutate(plan.id)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "none",
                        background: "var(--color-bullish)",
                        color: "var(--color-foreground)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: subscribing === plan.id ? "wait" : "pointer",
                        opacity: subscribing ? 0.7 : 1,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {subscribing === plan.id
                        ? "Creating invoice..."
                        : canCheckout
                          ? `Pay ${starsPrice} Stars`
                          : "Telegram Stars unavailable"}
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
