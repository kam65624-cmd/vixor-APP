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
import { getMe, getReferralStats } from "@/domains/user/functions";
import { listAnalyses } from "@/domains/analysis/functions";
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

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};
const mono = { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" };
const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#7B8BA8",
};

function XPBar({ xp }: { xp: number }) {
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span style={labelStyle}>Level {level}</span>
        <span className="text-[10px] font-bold" style={{ color: "#7B8BA8" }}>
          {xp} / {level * 100} XP
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
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
    queryFn: async () => {
      const r = await fetchAnalyses({ data: { limit: 50, offset: 0 } });
      // Server now returns { items, total, hasMore }
      return (r as any)?.items ?? (Array.isArray(r) ? r : []);
    },
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
      color: "rgba(34,197,94,0.1)",
      iconColor: "#22C55E",
    },
    {
      to: "/trade-desk" as const,
      icon: LayoutDashboard,
      label: t("profile.tradeDesk"),
      desc: t("profile.tradeDeskDesc"),
      color: "rgba(59,130,246,0.1)",
      iconColor: "#3B82F6",
    },
    {
      to: "/referral" as const,
      icon: Users,
      label: t("profile.referralsLink"),
      desc: t("profile.referralsDesc", { count: refCount }),
      color: "rgba(59,130,246,0.1)",
      iconColor: "#3B82F6",
    },
    {
      to: "/premium" as const,
      icon: Crown,
      label: t("profile.premium"),
      desc: isPremium ? t("profile.premiumActive") : t("profile.premiumUnlock"),
      color: "rgba(245,158,11,0.1)",
      iconColor: "#F59E0B",
    },
    {
      to: "/notifications" as const,
      icon: Bell,
      label: t("profile.notifications"),
      desc: t("profile.notificationsDesc"),
      color: "rgba(239,68,68,0.1)",
      iconColor: "#EF4444",
    },
    {
      to: "/settings" as const,
      icon: Settings,
      label: t("profile.settings"),
      desc: t("profile.settingsDesc"),
      color: "rgba(255,255,255,0.05)",
      iconColor: "#7B8BA8",
    },
  ];

  return (
    <div
      className="w-full"
      style={{
        background: "#0A0E1A",
        color: "#F0F4FC",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Avatar Card */}
      <div className="p-5" style={card}>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {tgPhoto ? (
              <img
                src={tgPhoto}
                alt="Telegram Avatar"
                className="size-18 rounded-2xl object-cover"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              />
            ) : (
              <div
                className="size-18 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                  color: "#fff",
                  borderRadius: "16px",
                }}
              >
                {avatarFallback}
              </div>
            )}
            {isPremium && (
              <div
                className="absolute -top-1.5 -right-1.5 size-6 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
              >
                <Crown className="size-3" style={{ color: "#fff" }} />
              </div>
            )}
            {tgUsername && (
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <div
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: "#24A1DE", color: "#fff", border: "1px solid #0A0E1A" }}
                >
                  Linked
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {me.isLoading ? (
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : (
              <>
                <div className="font-bold text-lg truncate" style={{ color: "#F0F4FC" }}>
                  {display}
                </div>
                <div className="text-xs mb-2" style={{ color: "#7B8BA8" }}>
                  {t("profile.memberFor", { days: joinedDays })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {isPremium && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(59,130,246,0.15)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "#3B82F6",
                      }}
                    >
                      PRO
                    </span>
                  )}
                  {streak > 0 && (
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        color: "#F59E0B",
                      }}
                    >
                      🔥 {t("profile.dayStreak", { days: streak })}
                    </span>
                  )}
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      color: "#3B82F6",
                    }}
                  >
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
      <div className="grid grid-cols-4 gap-2" style={{ marginTop: "20px" }}>
        {[
          { label: t("profile.points"), value: points, color: "#3B82F6", icon: Zap },
          { label: t("profile.earned"), value: earned, color: "#22C55E", icon: TrendingUp },
          { label: t("profile.analyses"), value: totalAnalyses, color: "#3B82F6", icon: Target },
          {
            label: t("profile.referrals"),
            value: refCount,
            color: "#F59E0B",
            icon: Users,
          },
        ].map((s) => (
          <div key={s.label} className="p-3 text-center" style={card}>
            <s.icon className="size-4 mx-auto mb-1" style={{ color: s.color }} />
            <div className="text-lg font-bold" style={{ ...mono, color: s.color }}>
              {s.value}
            </div>
            <div
              className="mt-0.5"
              style={{
                fontSize: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#7B8BA8",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ marginTop: "20px" }}>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Award className="size-4" style={{ color: "#3B82F6" }} />
          <h2 style={{ ...labelStyle, fontSize: "12px" }}>{t("profile.badges")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const unlocked = unlockedBadges.has(b.id);
            return (
              <div
                key={b.id}
                className="p-3 flex items-center gap-3 transition-opacity"
                style={{ ...card, opacity: unlocked ? 1 : 0.4 }}
              >
                <div className="text-2xl">{b.icon}</div>
                <div className="min-w-0">
                  <div
                    className="font-bold text-xs leading-none mb-0.5"
                    style={{ color: "#F0F4FC" }}
                  >
                    {b.label}
                  </div>
                  <div
                    className="text-[9px] leading-tight line-clamp-2"
                    style={{ color: "#7B8BA8" }}
                  >
                    {b.desc}
                  </div>
                </div>
                {unlocked && <Star className="size-3 shrink-0" style={{ color: "#3B82F6" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="overflow-hidden" style={{ ...card, marginTop: "20px" }}>
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="p-3.5 flex items-center gap-3 transition-colors group"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="size-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: l.color }}
              >
                <Icon className="size-4" style={{ color: l.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: "#F0F4FC" }}>
                  {l.label}
                </div>
                <div className="text-[10px]" style={{ color: "#7B8BA8" }}>
                  {l.desc}
                </div>
              </div>
              <ChevronRight className="size-4 transition-all" style={{ color: "#7B8BA8" }} />
            </Link>
          );
        })}
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full h-12 font-bold flex items-center justify-center gap-2 transition-all"
        style={{
          marginTop: "20px",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "#EF4444",
          borderRadius: "16px",
        }}
      >
        <LogOut className="size-4" /> {t("profile.signOut")}
      </button>
    </div>
  );
}
