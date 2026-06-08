import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, Sparkles, Zap, ShieldCheck, Bell, BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPremiumPlans, getPointPacks, subscribePremium, purchasePack, getMe, createStarsInvoice } from "@/lib/vixor.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isInsideTelegram, openTelegramInvoice } from "@/lib/telegram";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({ meta: [{ title: "Premium — Vixor" }] }),
  component: Premium,
});

const features = [
  { icon: Sparkles, label: "Unlimited analyses" },
  { icon: Zap, label: "Priority AI processing" },
  { icon: BarChart3, label: "Advanced indicators" },
  { icon: Bell, label: "Unlimited price alerts" },
  { icon: ShieldCheck, label: "Multi-strategy plans" },
];

function Premium() {
  const qc = useQueryClient();
  const fetchPlans = useServerFn(getPremiumPlans);
  const fetchPacks = useServerFn(getPointPacks);
  const fetchMe = useServerFn(getMe);
  const subscribe = useServerFn(subscribePremium);
  const buy = useServerFn(purchasePack);
  const buyStars = useServerFn(createStarsInvoice);

  const plans = useQuery({ queryKey: ["plans"], queryFn: () => fetchPlans({}) });
  const packs = useQuery({ queryKey: ["packs"], queryFn: () => fetchPacks({}) });
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });

  const [planId, setPlanId] = useState<string>("yearly");
  const subMut = useMutation({
    mutationFn: (id: string) => subscribe({ data: { planId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
  const packMut = useMutation({
    mutationFn: async (id: string) => {
      if (isInsideTelegram()) {
        const pack = packs.data?.find(p => p.id === id);
        const amountStars = Math.max(1, Math.floor((pack?.price_cents ?? 0) / 2));
        const res = await buyStars({ data: { packId: id, amountStars } });
        openTelegramInvoice(res.invoiceUrl);
        return;
      } else {
        return buy({ data: { packId: id } });
      }
    },
    onSuccess: () => {
      if (!isInsideTelegram()) {
        qc.invalidateQueries({ queryKey: ["me"] });
      }
    },
  });

  const isPremium = !!me.data?.isPremium;
  const inTg = isInsideTelegram();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/profile" className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"><ArrowLeft className="size-4"/></Link>
        <h1 className="font-semibold">Premium</h1>
        <div className="size-9"/>
      </div>

      <div className="vixor-card p-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-info/10 to-transparent"/>
        <div className="relative">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-info mx-auto flex items-center justify-center mb-3 glow-primary">
            <Crown className="size-8 text-primary-foreground"/>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Vixor Premium</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isPremium ? "Active until " + new Date(me.data?.premium?.current_period_end ?? "").toLocaleDateString() : "Unlimited analyses. Smarter setups."}
          </p>
        </div>
      </div>

      <div className="vixor-card p-4 space-y-3">
        {features.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center"><Icon className="size-4 text-primary"/></div>
              <span className="text-sm flex-1">{f.label}</span>
              <Check className="size-4 text-primary"/>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {plans.data?.map(p => (
          <button key={p.id} onClick={() => setPlanId(p.id)} disabled={isPremium}
            className={`w-full vixor-card p-4 flex items-center gap-3 text-left border-2 ${planId === p.id ? "border-primary" : "border-transparent"} disabled:opacity-50`}>
            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${planId === p.id ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {planId === p.id && <div className="size-2 rounded-full bg-primary-foreground"/>}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{p.name}</div>
              {p.badge && <div className="text-[10px] text-primary font-semibold">{p.badge}</div>}
            </div>
            <div className="text-right">
              <div className="font-bold text-mono">${(p.price_cents / 100).toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">/{p.interval}</div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={() => subMut.mutate(planId)} disabled={isPremium || subMut.isPending}
        className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold glow-primary flex items-center justify-center gap-2 disabled:opacity-50">
        {subMut.isPending && <Loader2 className="size-4 animate-spin"/>}
        {isPremium ? "You're a Premium member" : "Upgrade now"}
      </button>
      {subMut.error && <p className="text-xs text-bearish text-center">{(subMut.error as Error).message}</p>}

      <p className="text-[10px] text-center text-muted-foreground">Cancel anytime. Pay with Telegram Stars or card.</p>

      <div>
        <h2 className="text-base font-semibold tracking-tight mb-3">Or top up points</h2>
        <div className="grid grid-cols-2 gap-3">
          {packs.data?.map(p => (
            <div key={p.id} className={`vixor-card p-4 relative ${p.badge === "Popular" ? "border-primary border-2" : ""}`}>
              {p.badge && <span className="absolute -top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded">{p.badge.toUpperCase()}</span>}
              <div className="text-mono text-2xl font-bold">{p.points}{p.bonus_points ? <span className="text-xs text-bullish"> +{p.bonus_points}</span> : null}</div>
              <div className="text-[11px] text-muted-foreground mb-3">points</div>
              <button onClick={() => packMut.mutate(p.id)} disabled={packMut.isPending}
                className="w-full h-9 rounded-lg bg-[#24A1DE] text-white flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50">
                {packMut.isPending && packMut.variables === p.id ? "…" : (
                  <>
                    <Star className="size-3" fill="currentColor" />
                    {Math.max(1, Math.floor(p.price_cents / 2))} Stars
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
        {packMut.error && <p className="text-xs text-bearish text-center mt-2">{(packMut.error as Error).message}</p>}
      </div>
    </div>
  );
}
