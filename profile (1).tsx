import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  History,
  Users,
  Crown,
  Settings,
  Bell,
  Calculator,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { SectionTitle } from "@/components/vixor/atoms";
import { useServerFn } from "@tanstack/react-start";
import { getMe, getReferralStats } from "@/lib/vixor.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vixor" }] }),
  component: Profile,
});

function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchRef = useServerFn(getReferralStats);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const refs = useQuery({ queryKey: ["refs"], queryFn: () => fetchRef({}) });

  const display = me.data?.profile?.display_name ?? "Trader";
  const avatar = (
    display
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2) || "U"
  ).toUpperCase();
  const isPremium = !!me.data?.isPremium;
  const refCount = refs.data?.count ?? 0;
  const joinedAt = me.data?.profile?.created_at;
  const joinedDays = joinedAt
    ? Math.floor((Date.now() - new Date(joinedAt).getTime()) / 86400000)
    : 0;

  const links = [
    {
      to: "/history",
      icon: History,
      label: "Analysis history",
      desc: "All your past chart analyses",
    },
    {
      to: "/referral",
      icon: Users,
      label: "Referrals",
      desc: `${refCount} friend${refCount === 1 ? "" : "s"}`,
    },
    {
      to: "/premium",
      icon: Crown,
      label: "Premium",
      desc: isPremium ? "Active" : "Unlock unlimited",
    },
    {
      to: "/lot-calculator",
      icon: Calculator,
      label: "Lot calculator",
      desc: "Position sizing tool",
    },
    { to: "/notifications", icon: Bell, label: "Notifications", desc: "View alerts" },
    { to: "/settings", icon: Settings, label: "Settings", desc: "Theme, language, account" },
  ] as const;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-5">
      <div className="vixor-card p-5 flex items-center gap-4">
        <div className="size-16 rounded-2xl gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground glow-primary">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{display}</div>
          <div className="text-xs text-muted-foreground">Joined {joinedDays}d ago</div>
          <div className="flex gap-1.5 mt-2">
            {isPremium && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary">
                Premium
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded bg-bullish/15 text-bullish">
              {me.data?.profile?.streak_days ?? 0}🔥
            </span>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle title="Quick stats" />
        <div className="vixor-card p-4 grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] uppercase text-muted-foreground">Points</div>
            <div className="text-xl font-bold text-mono">{me.data?.balance.balance ?? 0}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-muted-foreground">Earned</div>
            <div className="text-xl font-bold text-mono text-bullish">
              {me.data?.balance.lifetime_earned ?? 0}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-muted-foreground">Referrals</div>
            <div className="text-xl font-bold text-mono">{refCount}</div>
          </div>
        </div>
      </div>

      <div className="vixor-card divide-y divide-border">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to} className="p-4 flex items-center gap-3 vixor-card-hover">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.desc}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>

      <button
        onClick={signOut}
        className="w-full h-11 rounded-xl bg-muted text-muted-foreground text-sm font-medium flex items-center justify-center gap-2"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
