import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, Plus, BookOpen, Bell, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import { getTelegramInitData } from "@/lib/telegram";
import { linkTelegramAccount } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";

const tabs = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/discover", label: "Discover", icon: Compass, match: (p: string) => p.startsWith("/discover") },
  { to: "/analyze", label: "Analyze", icon: Plus, match: (p: string) => p.startsWith("/analyze") || p.startsWith("/analysis") },
  { to: "/charts", label: "Charts", icon: BarChart3, match: (p: string) => p.startsWith("/charts") || p.startsWith("/signals") || p.startsWith("/trade-desk") },
  { to: "/journal", label: "Journal", icon: BookOpen, match: (p: string) => p.startsWith("/journal") || p.startsWith("/profile") },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { location } = useRouterState();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancel = false;
    // Get initial session once — no duplicate onAuthStateChange listener needed
    // because __root.tsx already handles auth changes with router.invalidate()
    supabase.auth.getSession().then(({ data }) => {
      if (!cancel) setSignedIn(!!data.session);
    });
    // Single lightweight listener just to toggle signedIn state
    // (router.invalidate in __root.tsx handles full re-validation)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return; // Already handled by getSession above
      setSignedIn(!!session);
    });
    return () => { cancel = true; sub.subscription.unsubscribe(); };
  }, []);

  const linkTelegram = useStableServerFn(linkTelegramAccount);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn) {
      if (!localStorage.getItem("vixor-onboarded")) setShowOnboarding(true);
    }
  }, [signedIn]);

  // Link Telegram in a separate effect that only runs once (not on every signedIn change)
  const telegramLinkedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!signedIn || telegramLinkedRef.current) return;
    if (localStorage.getItem("vixor-tg-linked")) {
      telegramLinkedRef.current = true;
      return;
    }
    const initData = getTelegramInitData();
    if (initData) {
      telegramLinkedRef.current = true;
      linkTelegram({ data: { initData } })
        .then(() => { localStorage.setItem("vixor-tg-linked", "1"); })
        .catch(err => console.error("Failed to link Telegram:", err));
    }
  }, [signedIn]);

  // Hide shell on /auth
  if (path === "/auth" || signedIn === false) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-md px-4 pb-28 pt-3">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none">
        <div className="mx-auto max-w-md px-4 pb-3 pointer-events-auto">
          <div className="glass-card rounded-2xl flex items-center justify-around h-16 px-2 shadow-[var(--shadow-elevated)] relative overflow-hidden">
            {tabs.map(t => {
              const active = t.match(path);
              const Icon = t.icon;
              const isAnalyze = t.label === "Analyze";
              return (
                <Link key={t.to} to={t.to} className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative z-10">
                  {isAnalyze ? (
                    <div className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? "gradient-primary glow-primary scale-110" : "bg-card-hover border border-border"}`}>
                      <Icon className={`size-6 ${active ? "text-primary-foreground" : "text-foreground"}`} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <>
                      <Icon className={`size-5 transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 2} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground"}`}>{t.label}</span>
                      {active && <span className="absolute -bottom-1 size-1 rounded-full bg-primary" />}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {showOnboarding && (
        <OnboardingModal onClose={() => { localStorage.setItem("vixor-onboarded", "1"); setShowOnboarding(false); }} />
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="glass-header sticky top-0 z-40 pt-safe">
      <div className="mx-auto max-w-md px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-8 rounded-xl gradient-primary flex items-center justify-center glow-primary group-hover:scale-105 transition-transform">
            <BarChart3 className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight text-lg">Vixor</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/profile" className="size-8 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition">
            <div className="size-full rounded-full bg-gradient-to-tr from-primary/20 to-info/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground">ME</span>
            </div>
          </Link>
          <Link to="/notifications" className="size-8 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition">
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute top-0 right-0 size-2.5 rounded-full bg-primary border-2 border-background" />
          </Link>
        </div>
      </div>
    </header>
  );
}
