import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LineChart, BarChart3, User, Bell, Sparkles, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/vixor.functions";

const tabs = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/analyze",
    label: "Analyze",
    icon: Plus,
    match: (p: string) => p.startsWith("/analyze") || p.startsWith("/analysis"),
  },
  {
    to: "/charts",
    label: "Charts",
    icon: LineChart,
    match: (p: string) => p.startsWith("/charts"),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: User,
    match: (p: string) =>
      p.startsWith("/profile") ||
      ["/history", "/referral", "/premium", "/settings", "/notifications", "/lot-calculator"].some(
        (x) => p.startsWith(x),
      ),
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancel = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancel) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => {
      cancel = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn && !localStorage.getItem("vixor-onboarded")) setShowOnboarding(true);
  }, [signedIn]);

  // Hide shell on /auth
  if (path === "/auth" || signedIn === false) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-md px-4 pb-28 pt-3">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe">
        <div className="mx-auto max-w-md px-4 pb-3">
          <div className="glass-card rounded-2xl flex items-center justify-around h-16 px-2 shadow-[var(--shadow-elevated)]">
            {tabs.map((t) => {
              const active = t.match(path);
              const Icon = t.icon;
              const isAnalyze = t.label === "Analyze";
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
                >
                  {isAnalyze ? (
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center transition ${active ? "gradient-primary glow-primary" : "bg-card-hover"}`}
                    >
                      <Icon
                        className={`size-5 ${active ? "text-primary-foreground" : "text-foreground"}`}
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : (
                    <>
                      <Icon
                        className={`size-5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span
                        className={`text-[10px] font-medium transition ${active ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {t.label}
                      </span>
                      {active && (
                        <span className="absolute -bottom-0.5 size-1 rounded-full bg-primary" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {showOnboarding && (
        <OnboardingModal
          onClose={() => {
            localStorage.setItem("vixor-onboarded", "1");
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}

function Header() {
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}), staleTime: 30_000 });
  const points = me.data?.balance.balance ?? 0;

  return (
    <header className="glass-header sticky top-0 z-40 pt-safe">
      <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <BarChart3 className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">Vixor</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-card border border-border">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-mono text-sm font-semibold">{points}</span>
            <span className="size-1.5 rounded-full bg-primary pulse-dot" />
          </div>
          <Link
            to="/notifications"
            className="size-8 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition"
          >
            <Bell className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
