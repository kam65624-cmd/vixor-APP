import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Users,
  Crown,
  Settings,
  Bell,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Zap,
  Target,
  TrendingUp,
  Award,
  Flame,
  Star,
} from "lucide-react";
import { getMe, getReferralStats, listAnalyses } from "@/lib/vixor.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vixor" }] }),
  component: Profile,
});

const BADGES = [
  {
    id: "first_analysis",
    icon: "🎯",
    label: "First Analysis",
    desc: "Completed your first chart read",
  },
  { id: "streak_7", icon: "🔥", label: "On Fire", desc: "7-day login streak" },
  { id: "premium", icon: "👑", label: "Pro Trader", desc: "Subscribed to Premium" },
  { id: "referral", icon: "🤝", label: "Connector", desc: "Referred a friend" },
];

function XPBar({ xp }: { xp: number }) {
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Level {level}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          {xp} / {level * 100} XP
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t } = useI18n();
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetchMe = useStableServerFn(getMe);
  const fetchRef = useStableServerFn(getReferralStats);
  const fetchAnalyses = useStableServerFn(listAnalyses);

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const refs = useQuery({ queryKey: ["refs"], queryFn: () => fetchRef({}) });
  const analyses = useQuery({
    queryKey: ["analyses-profile"],
    queryFn: () => fetchAnalyses({ data: { limit: 50 } }),
  });

  const display = me.data?.profile?.display_name ?? "Trader";
  const tgPhoto = (me.data?.profile as any)?.telegram_photo_url;
  const tgUsername = (me.data?.profile as any)?.telegram_username;
  const avatarFallback = (
    display
      .split(" ")
      .map((s: string) => s[0])
      .join("")
      .slice(0, 2) || "U"
  ).toUpperCase();
  const isPremium = !!me.data?.isPremium;
  const refCount = refs.data?.count ?? 0;
  const joinedAt = me.data?.profile?.created_at;
  const joinedDays = joinedAt
    ? Math.floor((Date.now() - new Date(joinedAt).getTime()) / 86400000)
    : 0;
  const xp = (me.data?.profile as any)?.xp ?? 0;
  const streak = (me.data?.profile as any)?.streak_days ?? 0;
  const totalAnalyses = analyses.data?.length ?? 0;
  const points = me.data?.balance?.balance ?? 0;
  const earned = me.data?.balance?.lifetime_earned ?? 0;

  // Determine unlocked badges
  const unlockedBadges = new Set<string>();
  if (totalAnalyses >= 1) unlockedBadges.add("first_analysis");
  if (streak >= 7) unlockedBadges.add("streak_7");
  if (isPremium) unlockedBadges.add("premium");
  if (refCount >= 1) unlockedBadges.add("referral");

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = [
    {
      to: "/journal" as const,
      icon: BookOpen,
      label: t("profile.tradeJournal"),
      desc: t("profile.tradeJournalDesc"),
      color: "bg-bullish/10 text-bullish",
    },
    {
      to: "/trade-desk" as const,
      icon: LayoutDashboard,
      label: t("profile.tradeDesk"),
      desc: t("profile.tradeDeskDesc"),
      color: "bg-info/10 text-info",
    },
    {
      to: "/referral" as const,
      icon: Users,
      label: t("profile.referralsLink"),
      desc: t("profile.referralsDesc", { count: refCount }),
      color: "bg-primary/10 text-primary",
    },
    {
      to: "/premium" as const,
      icon: Crown,
      label: t("profile.premium"),
      desc: isPremium ? t("profile.premiumActive") : t("profile.premiumUnlock"),
      color: "bg-neutral-wait/10 text-neutral-wait",
    },
    {
      to: "/notifications" as const,
      icon: Bell,
      label: t("profile.notifications"),
      desc: t("profile.notificationsDesc"),
      color: "bg-bearish/10 text-bearish",
    },
    {
      to: "/settings" as const,
      icon: Settings,
      label: t("profile.settings"),
      desc: t("profile.settingsDesc"),
      color: "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Avatar Card */}
      <div className="vixor-card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {tgPhoto ? (
              <img
                src={tgPhoto}
                alt="Telegram Avatar"
                className="size-18 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="size-18 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-primary">
                {avatarFallback}
              </div>
            )}
            {isPremium && (
              <div className="absolute -top-1.5 -right-1.5 size-6 rounded-full gradient-primary flex items-center justify-center">
                <Crown className="size-3 text-primary-foreground" />
              </div>
            )}
            {tgUsername && (
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <div className="bg-[#24A1DE] text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-background shadow-sm whitespace-nowrap">
                  Linked
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {me.isLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : (
              <>
                <div className="font-bold text-lg truncate">{display}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t("profile.memberFor", { days: joinedDays })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {isPremium && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20 text-primary font-bold uppercase tracking-wider">
                      PRO
                    </span>
                  )}
                  {streak > 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-wait/10 border border-neutral-wait/20 text-neutral-wait font-bold">
                      🔥 {t("profile.dayStreak", { days: streak })}
                    </span>
                  )}
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-info/10 border border-info/20 text-info font-bold">
                    ⚡ {points} pts
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <XPBar xp={xp} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t("profile.points"), value: points, color: "text-primary", icon: Zap },
          { label: t("profile.earned"), value: earned, color: "text-bullish", icon: TrendingUp },
          { label: t("profile.analyses"), value: totalAnalyses, color: "text-info", icon: Target },
          {
            label: t("profile.referrals"),
            value: refCount,
            color: "text-neutral-wait",
            icon: Users,
          },
        ].map((s) => (
          <div key={s.label} className="vixor-card p-3 text-center">
            <s.icon className={`size-4 mx-auto mb-1 ${s.color}`} />
            <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[8px] uppercase font-bold text-muted-foreground mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Award className="size-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("profile.badges")}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const unlocked = unlockedBadges.has(b.id);
            return (
              <div
                key={b.id}
                className={`vixor-card p-3 flex items-center gap-3 transition-opacity ${unlocked ? "opacity-100" : "opacity-40"}`}
              >
                <div className="text-2xl">{b.icon}</div>
                <div className="min-w-0">
                  <div className="font-bold text-xs leading-none mb-0.5">{b.label}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight line-clamp-2">
                    {b.desc}
                  </div>
                </div>
                {unlocked && <Star className="size-3 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="vixor-card divide-y divide-border overflow-hidden">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors group"
            >
              <div
                className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${l.color}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{l.label}</div>
                <div className="text-[10px] text-muted-foreground">{l.desc}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full h-12 rounded-2xl bg-bearish/10 border border-bearish/20 text-bearish font-bold flex items-center justify-center gap-2 hover:bg-bearish hover:text-white transition-all duration-200"
      >
        <LogOut className="size-4" /> {t("profile.signOut")}
      </button>
    </div>
  );
}
