import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Crown,
  Sparkles,
  Zap,
  ShieldCheck,
  Bell,
  BarChart3,
  Loader2,
  Star,
} from "lucide-react";
import { useState } from "react";
import {
  getPremiumPlans,
  getPointPacks,
  subscribePremium,
  purchasePack,
  getMe,
  createStarsInvoice,
} from "@/domains/user/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isInsideTelegram, openTelegramInvoice } from "@/shared/telegram";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";

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

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};
const mono = { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" };

function Premium() {
  const qc = useQueryClient();
  const { t } = useI18n();
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetchPlans = useStableServerFn(getPremiumPlans);
  const fetchPacks = useStableServerFn(getPointPacks);
  const fetchMe = useStableServerFn(getMe);
  const subscribe = useStableServerFn(subscribePremium);
  const buy = useStableServerFn(purchasePack);
  const buyStars = useStableServerFn(createStarsInvoice);

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
        const pack = packs.data?.find((p) => p.id === id);
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
    <div
      className="w-full"
      style={{
        background: "#0A0E1A",
        color: "#F0F4FC",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="size-9 rounded-xl flex items-center justify-center"
          style={card}
        >
          <ArrowLeft className="size-4" style={{ color: "#7B8BA8" }} />
        </Link>
        <h1 className="font-semibold">{t("premium.title")}</h1>
        <div className="size-9" />
      </div>

      <div
        className="p-6 relative overflow-hidden text-center"
        style={{ ...card, marginTop: "20px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.02) 100%)",
          }}
        />
        <div className="relative">
          <div
            className="size-16 rounded-2xl mx-auto flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
          >
            <Crown className="size-8" style={{ color: "#fff" }} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t("premium.vixorPremium")}</h2>
          <p className="text-sm mt-1" style={{ color: "#7B8BA8" }}>
            {isPremium
              ? t("premium.activeUntil", {
                  date: new Date(me.data?.premium?.current_period_end ?? "").toLocaleDateString(),
                })
              : t("premium.unlimitedSmarter")}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3" style={{ ...card, marginTop: "20px" }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.15)" }}
              >
                <Icon className="size-4" style={{ color: "#3B82F6" }} />
              </div>
              <span className="text-sm flex-1">{f.label}</span>
              <Check className="size-4" style={{ color: "#3B82F6" }} />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2" style={{ marginTop: "20px" }}>
        {plans.data?.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlanId(p.id)}
            disabled={isPremium}
            className="w-full p-4 flex items-center gap-3 text-left"
            style={{
              ...card,
              border: planId === p.id ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
              opacity: isPremium ? 0.5 : 1,
            }}
          >
            <div
              className="size-5 rounded-full flex items-center justify-center"
              style={{
                border: `2px solid ${planId === p.id ? "#3B82F6" : "#4A5568"}`,
                background: planId === p.id ? "#3B82F6" : "transparent",
              }}
            >
              {planId === p.id && (
                <div className="size-2 rounded-full" style={{ background: "#fff" }} />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{p.name}</div>
              {p.badge && (
                <div className="text-[10px] font-semibold" style={{ color: "#3B82F6" }}>
                  {p.badge}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold" style={{ ...mono }}>
                ${(p.price_cents / 100).toFixed(2)}
              </div>
              <div className="text-[10px]" style={{ color: "#7B8BA8" }}>
                / {p.interval}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => subMut.mutate(planId)}
        disabled={isPremium || subMut.isPending}
        className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
        style={{
          marginTop: "20px",
          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
          color: "#fff",
          opacity: isPremium || subMut.isPending ? 0.5 : 1,
        }}
      >
        {subMut.isPending && <Loader2 className="size-4 animate-spin" />}
        {isPremium ? t("premium.yourePremium") : t("premium.upgradeNow")}
      </button>
      {subMut.error && (
        <p className="text-xs text-center" style={{ marginTop: "8px", color: "#EF4444" }}>
          {(subMut.error as Error).message}
        </p>
      )}

      <p className="text-[10px] text-center" style={{ marginTop: "12px", color: "#4A5568" }}>
        {t("premium.cancelAnytime")}. Pay with Telegram Stars or card.
      </p>

      <div style={{ marginTop: "20px" }}>
        <h2 className="text-base font-semibold tracking-tight mb-3">{t("premium.orTopUp")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {packs.data?.map((p) => (
            <div
              key={p.id}
              className="p-4 relative"
              style={{
                ...card,
                border:
                  p.badge === "Popular" ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {p.badge && (
                <span
                  className="absolute -top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded"
                  style={{ background: "#3B82F6", color: "#fff" }}
                >
                  {p.badge.toUpperCase()}
                </span>
              )}
              <div className="text-2xl font-bold" style={mono}>
                {p.points}
                {p.bonus_points ? (
                  <span className="text-xs" style={{ color: "#22C55E" }}>
                    {" "}
                    +{p.bonus_points}
                  </span>
                ) : null}
              </div>
              <div className="text-[11px] mb-3" style={{ color: "#7B8BA8" }}>
                points
              </div>
              <button
                onClick={() => packMut.mutate(p.id)}
                disabled={packMut.isPending}
                className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold"
                style={{
                  background: "#24A1DE",
                  color: "#fff",
                  opacity: packMut.isPending ? 0.5 : 1,
                }}
              >
                {packMut.isPending && packMut.variables === p.id ? (
                  "…"
                ) : (
                  <>
                    <Star className="size-3" fill="currentColor" />
                    {Math.max(1, Math.floor(p.price_cents / 2))} Stars
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
        {packMut.error && (
          <p className="text-xs text-center mt-2" style={{ color: "#EF4444" }}>
            {(packMut.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}
