import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Crown, BarChart3, Calculator, Eye, BookOpen, ChevronRight, TrendingUp, Trophy, Target } from "lucide-react";
import { SectionTitle, RecBadge, ConfidenceBar } from "@/components/vixor/atoms";
import { useServerFn } from "@tanstack/react-start";
import { getMe, listAnalyses } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Dashboard — Vixor" }] }),
  component: Dashboard,
});

const quickActions = [
  { to: "/analyze", label: "Analyze Chart", icon: BarChart3, accent: "primary" as const },
  { to: "/lot-calculator", label: "Lot Calculator", icon: Calculator, accent: "info" as const },
  { to: "/charts", label: "Watchlist", icon: Eye, accent: "purple" as const },
  { to: "/profile", label: "Trade Journal", icon: BookOpen, accent: "amber" as const },
] as const;

const accents: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  info: "bg-info/15 text-info",
  purple: "bg-[oklch(0.65_0.2_300)/15%] text-[oklch(0.78_0.18_300)]",
  amber: "bg-neutral-wait/15 text-neutral-wait",
};

const achievementDefs = [
  { id: "1", label: "First Analysis", req: (n: number) => n >= 1 },
  { id: "2", label: "5-Day Streak", req: (_n: number, s: number) => s >= 5 },
  { id: "3", label: "10 Analyses", req: (n: number) => n >= 10 },
  { id: "4", label: "Chart Master", req: (n: number) => n >= 50 },
  { id: "5", label: "Diamond Hands", req: (n: number) => n >= 100 },
];

function Dashboard() {
  const fetchMe = useServerFn(getMe);
  const fetchList = useServerFn(listAnalyses);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const recent = useQuery({ queryKey: ["analyses", 5], queryFn: () => fetchList({ data: { limit: 5 } }) });

  const points = me.data?.balance.balance ?? 0;
  const isPremium = !!me.data?.isPremium;
  const streak = me.data?.profile?.streak_days ?? 0;
  const displayName = me.data?.profile?.display_name ?? "trader";
  const firstName = displayName.split(" ")[0];
  const analysesCount = recent.data?.length ?? 0;

  const pointsState = points >= 30 ? "ready" : points >= 10 ? "low" : "urgent";

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight">Hey, {firstName} 👋</h1>
      </div>

      <div className="vixor-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bullish opacity-50 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Points Balance</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
              pointsState === "ready" ? "bg-bullish/15 text-bullish" :
              pointsState === "low" ? "bg-neutral-wait/15 text-neutral-wait" :
              "bg-bearish/15 text-bearish"
            }`}>
              {pointsState === "ready" ? "Ready to Analyze" : pointsState === "low" ? "Running Low" : "Get More Points"}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-mono">{points}</span>
            <span className="text-sm text-muted-foreground pb-2">pts</span>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {[3,5,2,4,6,3,5].map((v,i) => (
              <div key={i} className="rounded-sm bg-primary/40" style={{ width: 12, height: 4 + v*3 }} />
            ))}
            <span className="text-xs text-muted-foreground ml-2">Last 7 days</span>
          </div>
        </div>
      </div>

      <div className="vixor-card p-4 vixor-card-hover">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-neutral-wait/15 flex items-center justify-center">
              <Flame className="size-5 text-neutral-wait" />
            </div>
            <div>
              <div className="font-semibold text-sm">{streak}-day streak 🔥</div>
              <div className="text-xs text-muted-foreground">Claim today's +9 points</div>
            </div>
          </div>
          <button className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Claim</button>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {[1,2,3,4,5,6,7].map(d => (
            <div key={d} className={`flex-1 h-1.5 rounded-full ${d <= streak ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {!isPremium && (
        <Link to="/premium" className="block vixor-card p-4 vixor-card-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10 pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <Crown className="size-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Unlock Unlimited Analyses</div>
              <div className="text-xs text-muted-foreground">Premium · from $14.99/mo</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </Link>
      )}

      <div>
        <SectionTitle title="Quick actions" />
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(qa => {
            const Icon = qa.icon;
            return (
              <Link key={qa.to} to={qa.to} className="vixor-card vixor-card-hover p-4 flex flex-col gap-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${accents[qa.accent]}`}>
                  <Icon className="size-5" />
                </div>
                <div className="text-sm font-semibold">{qa.label}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle title="Recent analyses" action={
          <Link to="/history" className="text-xs text-primary font-medium">View all</Link>
        }/>
        <div className="space-y-2">
          {recent.isLoading && <div className="vixor-card p-6 text-center text-xs text-muted-foreground">Loading…</div>}
          {!recent.isLoading && (recent.data?.length ?? 0) === 0 && (
            <Link to="/analyze" className="vixor-card vixor-card-hover p-6 text-center block">
              <BarChart3 className="size-8 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-semibold">No analyses yet</div>
              <div className="text-xs text-muted-foreground mt-1">Drop your first chart to get started</div>
            </Link>
          )}
          {recent.data?.slice(0,4).map(a => (
            <Link key={a.id} to="/analysis/$id" params={{ id: a.id }} className="vixor-card vixor-card-hover p-3 flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${
                a.recommendation === "BUY" ? "bg-bullish/15 text-bullish" :
                a.recommendation === "SELL" ? "bg-bearish/15 text-bearish" :
                "bg-neutral-wait/15 text-neutral-wait"
              }`}>
                <TrendingUp className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-mono">{a.pair ?? "Pending"}</span>
                  {a.timeframe && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{a.timeframe}</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{a.pattern ?? a.status}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {a.recommendation && <RecBadge rec={a.recommendation} />}
                <span className="text-[10px] text-muted-foreground">{relTime(a.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="Achievements" action={<span className="text-xs text-muted-foreground">{achievementDefs.filter(a => a.req(analysesCount, streak)).length} / {achievementDefs.length}</span>} />
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {achievementDefs.map(a => {
            const unlocked = a.req(analysesCount, streak);
            return (
              <div key={a.id} className={`vixor-card p-3 min-w-[120px] flex flex-col items-center gap-2 ${!unlocked && "opacity-40"}`}>
                <div className={`size-10 rounded-xl flex items-center justify-center ${unlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Trophy className="size-5" />
                </div>
                <div className="text-xs font-medium text-center">{a.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="vixor-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <span className="text-sm font-semibold">Analyses completed</span>
          </div>
          <span className="text-mono text-sm font-semibold text-bullish">{analysesCount}</span>
        </div>
        <ConfidenceBar value={Math.min(100, analysesCount * 5)} />
        <p className="text-xs text-muted-foreground mt-2">Your trading journey so far</p>
      </div>
    </div>
  );
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
