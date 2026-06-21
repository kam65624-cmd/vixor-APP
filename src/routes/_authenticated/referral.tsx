import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Share2, Users, Crown } from "lucide-react";
import { SectionTitle } from "@/components/vixor/atoms";
import { useState } from "react";
import { getMe, getReferralStats, claimReferral } from "@/domains/user/functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({ meta: [{ title: "Referrals — Vixor" }] }),
  component: Referral,
});

const tiers = [
  { name: "Bronze", min: 1 },
  { name: "Silver", min: 5 },
  { name: "Gold", min: 15 },
  { name: "Diamond", min: 30 },
];

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};
const mono = { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" };

function Referral() {
  const qc = useQueryClient();
  const { t } = useI18n();
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetchMe = useStableServerFn(getMe);
  const fetchRef = useStableServerFn(getReferralStats);
  const claimFn = useStableServerFn(claimReferral);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const refs = useQuery({ queryKey: ["refs"], queryFn: () => fetchRef({}) });
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const m = useMutation({
    mutationFn: (c: string) => claimFn({ data: { code: c.toUpperCase() } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      setCode("");
    },
  });

  const myCode = me.data?.profile?.referral_code ?? "";
  const count = refs.data?.count ?? 0;
  const next = tiers.find((t) => t.min > count) ?? tiers[tiers.length - 1];
  const current = [...tiers].reverse().find((t) => t.min <= count) ?? tiers[0];
  const progress = Math.min(100, (count / next.min) * 100);

  function copy() {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

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
        <h1 className="font-semibold">{t("referral.title")}</h1>
        <div className="size-9" />
      </div>

      <div
        className="p-5 relative overflow-hidden text-center"
        style={{ ...card, marginTop: "20px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.03) 100%)",
          }}
        />
        <div className="relative">
          <div
            className="size-16 rounded-2xl mx-auto flex items-center justify-center mb-3"
            style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
          >
            <Users className="size-7" style={{ color: "#fff" }} />
          </div>
          <h2 className="text-xl font-bold">{t("referral.inviteFriends")}</h2>
          <p className="text-sm mt-1" style={{ color: "#7B8BA8" }}>
            +25 pts for you · +15 pts for them
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3" style={{ ...card, marginTop: "20px" }}>
        <div className="text-xs uppercase tracking-wide" style={{ color: "#7B8BA8" }}>
          {t("referral.yourReferralCode")}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-4 h-12 rounded-xl flex items-center font-bold tracking-wider"
            style={{ ...mono, background: "rgba(255,255,255,0.05)" }}
          >
            {myCode || "—"}
          </div>
          <button
            onClick={copy}
            className="size-12 rounded-xl flex items-center justify-center"
            style={card}
          >
            <Copy className="size-4" style={{ color: "#7B8BA8" }} />
          </button>
        </div>
        {copied && (
          <div className="text-[10px]" style={{ color: "#3B82F6" }}>
            {t("referral.copied")}
          </div>
        )}
        <button
          className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff" }}
        >
          <Share2 className="size-4" /> {t("referral.shareViaTelegram")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3" style={{ marginTop: "20px" }}>
        {[
          { label: t("profile.referrals"), value: count, sub: current.name },
          { label: t("profile.earned"), value: `${count * 25}`, sub: t("referral.points") },
          { label: t("referral.tier"), value: current.name, sub: t("referral.current") },
        ].map((s) => (
          <div key={s.label} className="p-3 text-center" style={card}>
            <div className="text-xl font-bold" style={{ ...mono }}>
              {s.value}
            </div>
            <div className="text-[10px] uppercase mt-0.5" style={{ color: "#7B8BA8" }}>
              {s.label}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "#3B82F6" }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4" style={{ ...card, marginTop: "20px" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <Crown className="size-4" style={{ color: "#3B82F6" }} /> Next: {next.name}
          </span>
          <span className="text-xs" style={{ ...mono, color: "#7B8BA8" }}>
            {count} / {next.min}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
            }}
          />
        </div>
      </div>

      {!me.data?.profile?.referred_by && (
        <div className="p-4 flex flex-col gap-3" style={{ ...card, marginTop: "20px" }}>
          <div className="text-sm font-semibold">{t("referral.haveCode")}</div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VIXOR123"
              maxLength={16}
              className="flex-1 h-11 px-4 rounded-xl outline-none text-sm tracking-wider uppercase"
              style={{
                ...mono,
                background: "rgba(255,255,255,0.05)",
                color: "#F0F4FC",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
            <button
              onClick={() => code.length >= 4 && m.mutate(code)}
              disabled={m.isPending || code.length < 4}
              className="px-4 h-11 rounded-xl text-sm font-semibold"
              style={{
                background: "#3B82F6",
                color: "#fff",
                opacity: m.isPending || code.length < 4 ? 0.5 : 1,
              }}
            >
              {t("referral.apply")}
            </button>
          </div>
          {m.error && (
            <div className="text-xs" style={{ color: "#EF4444" }}>
              {(m.error as Error).message}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <SectionTitle title={t("referral.howItWorks")} />
        <div className="p-4 flex flex-col gap-3" style={card}>
          {[t("referral.step1"), t("referral.step2"), t("referral.step3")].map((s, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="size-7 rounded-full flex items-center justify-center font-bold text-xs"
                style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}
              >
                {i + 1}
              </div>
              <div className="text-sm pt-1">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
