import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Share2, Users, Crown } from "lucide-react";
import { SectionTitle } from "@/components/vixor/atoms";
import { useServerFn } from "@tanstack/react-start";
import { getMe, getReferralStats, claimReferral } from "@/lib/vixor.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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

function Referral() {
  const qc = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const fetchRef = useServerFn(getReferralStats);
  const claim = useServerFn(claimReferral);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const refs = useQuery({ queryKey: ["refs"], queryFn: () => fetchRef({}) });
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const m = useMutation({
    mutationFn: (c: string) => claim({ data: { code: c.toUpperCase() } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); setCode(""); },
  });

  const myCode = me.data?.profile?.referral_code ?? "";
  const count = refs.data?.count ?? 0;
  const next = tiers.find(t => t.min > count) ?? tiers[tiers.length - 1];
  const current = [...tiers].reverse().find(t => t.min <= count) ?? tiers[0];
  const progress = Math.min(100, (count / next.min) * 100);

  function copy() {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/profile" className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"><ArrowLeft className="size-4"/></Link>
        <h1 className="font-semibold">Referrals</h1>
        <div className="size-9"/>
      </div>

      <div className="vixor-card p-5 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10"/>
        <div className="relative">
          <div className="size-16 rounded-2xl gradient-primary glow-primary mx-auto flex items-center justify-center mb-3">
            <Users className="size-7 text-primary-foreground"/>
          </div>
          <h2 className="text-xl font-bold">Invite friends, earn points</h2>
          <p className="text-sm text-muted-foreground mt-1">+25 pts for you · +15 pts for them</p>
        </div>
      </div>

      <div className="vixor-card p-4 space-y-3">
        <div className="text-xs uppercase text-muted-foreground tracking-wide">Your referral code</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 h-12 rounded-xl bg-muted flex items-center font-bold text-mono tracking-wider">
            {myCode || "—"}
          </div>
          <button onClick={copy} className="size-12 rounded-xl bg-card border border-border flex items-center justify-center">
            <Copy className="size-4"/>
          </button>
        </div>
        {copied && <div className="text-[10px] text-primary">Copied!</div>}
        <button className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary">
          <Share2 className="size-4"/> Share via Telegram
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Referrals", value: count, sub: current.name },
          { label: "Earned", value: `${count * 25}`, sub: "points" },
          { label: "Tier", value: current.name, sub: "current" },
        ].map(s => (
          <div key={s.label} className="vixor-card p-3 text-center">
            <div className="text-xl font-bold text-mono">{s.value}</div>
            <div className="text-[10px] uppercase text-muted-foreground">{s.label}</div>
            <div className="text-[10px] text-primary mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="vixor-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold flex items-center gap-1.5"><Crown className="size-4 text-primary"/> Next: {next.name}</span>
          <span className="text-xs text-muted-foreground text-mono">{count} / {next.min}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${progress}%` }}/>
        </div>
      </div>

      {!me.data?.profile?.referred_by && (
        <div className="vixor-card p-4 space-y-3">
          <div className="text-sm font-semibold">Have a referral code?</div>
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="VIXOR123" maxLength={16}
              className="flex-1 h-11 px-4 rounded-xl bg-muted outline-none text-sm font-mono tracking-wider uppercase" />
            <button onClick={() => code.length >= 4 && m.mutate(code)} disabled={m.isPending || code.length < 4}
              className="px-4 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Apply</button>
          </div>
          {m.error && <div className="text-xs text-bearish">{(m.error as Error).message}</div>}
        </div>
      )}

      <div>
        <SectionTitle title="How it works"/>
        <div className="vixor-card p-4 space-y-3">
          {["Share your code with friends","They sign up and apply your code","You both get bonus points instantly"].map((s,i) => (
            <div key={i} className="flex gap-3">
              <div className="size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">{i+1}</div>
              <div className="text-sm pt-1">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
