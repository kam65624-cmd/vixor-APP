import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Plus, Brain, Briefcase } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { supabase } from "@/shared/supabase/client";
import { getTelegramInitData } from "@/shared/telegram";
import { linkTelegramAccount } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";

const tabs = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/discover",
    label: "Discover",
    icon: Compass,
    match: (p: string) => p.startsWith("/discover") || p.startsWith("/charts"),
  },
  {
    to: "/analyze",
    label: "Analyze",
    icon: Plus,
    match: (p: string) => p.startsWith("/analyze") || p.startsWith("/analysis"),
  },
  { to: "/copilot", label: "Copilot", icon: Brain, match: (p: string) => p.startsWith("/copilot") },
  {
    to: "/portfolio",
    label: "Portfolio",
    icon: Briefcase,
    match: (p: string) =>
      p.startsWith("/portfolio") ||
      p.startsWith("/journal") ||
      p.startsWith("/trade-desk") ||
      p.startsWith("/signals") ||
      p.startsWith("/daily-loop") ||
      p.startsWith("/notifications") ||
      p.startsWith("/settings") ||
      p.startsWith("/profile") ||
      p.startsWith("/premium") ||
      p.startsWith("/referral"),
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useRenderGuard("AppShell");
  const location = useLocation();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = useState(false);

  const signedIn = path !== "/auth";

  const linkTelegram = useStableServerFn(linkTelegramAccount);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn && !localStorage.getItem("vixor-onboarded")) {
      // Delay onboarding so it doesn't clash with first paint / auth bootstrap
      const t = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(t);
    }
  }, [signedIn]);

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
        .then(() => {
          localStorage.setItem("vixor-tg-linked", "1");
        })
        .catch((err) => console.error("Failed to link Telegram:", err));
    }
  }, [signedIn, linkTelegram]);

  const closeOnboarding = useCallback(() => {
    localStorage.setItem("vixor-onboarded", "1");
    setShowOnboarding(false);
  }, []);

  if (!signedIn) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      {/* Responsive: mobile = max-w-md, desktop = max-w-4xl with side padding.
          pt-20 = 14 (header h-14 = 3.5rem) + 1.5rem breathing room so content
          never hides behind the fixed header. */}
      <main
        className="flex-1 mx-auto w-full max-w-md lg:max-w-4xl px-4 pt-20 pb-28"
        style={{ paddingBottom: "max(7rem, calc(7rem + env(safe-area-inset-bottom, 0px)))" }}
      >
        {children}
      </main>
      <BottomNav path={path} tabs={tabs} />

      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// HEADER — fixed to top, compact, professional
// ───────────────────────────────────────────────────────────────────────────
const Header = memo(function Header() {
  return (
    <header
      className="fixed top-0 inset-x-0 z-40 glass-header"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 0px)",
        // Telegram WebApp may add header chrome; this ensures our header
        // always sits at the visible top of the viewport.
      }}
    >
      <div className="mx-auto max-w-md lg:max-w-4xl px-4">
        <div className="h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-8 rounded-xl gradient-primary flex items-center justify-center glow-primary group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-primary-foreground"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg">Vixor</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="size-9 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-muted-foreground"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary border-2 border-background" />
            </Link>
            <Link
              to="/profile"
              aria-label="Profile"
              className="size-9 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition-colors overflow-hidden"
            >
              <div className="size-full rounded-full bg-gradient-to-tr from-primary/20 to-info/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground">ME</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
});

// ───────────────────────────────────────────────────────────────────────────
// BOTTOM NAV — fixed to bottom, larger touch targets, clearer active state
// ───────────────────────────────────────────────────────────────────────────
interface BottomNavProps {
  path: string;
  tabs: readonly {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    match: (p: string) => boolean;
  }[];
}

const BottomNav = memo(function BottomNav({ path, tabs }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="mx-auto max-w-md lg:max-w-4xl px-3 pb-3 pointer-events-auto">
        <div className="glass-card rounded-2xl flex items-stretch justify-around h-16 px-1.5 shadow-[var(--shadow-elevated)] relative overflow-hidden">
          {tabs.map((t) => {
            const active = t.match(path);
            const Icon = t.icon;
            const isAnalyze = t.label === "Analyze";
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative z-10 rounded-xl transition-colors"
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
              >
                {isAnalyze ? (
                  <div
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      active
                        ? "gradient-primary glow-primary scale-110 -translate-y-1"
                        : "bg-card-hover border border-border hover:scale-105"
                    }`}
                  >
                    <Icon
                      className={`size-6 ${active ? "text-primary-foreground" : "text-foreground"}`}
                      strokeWidth={2.5}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className={`flex items-center justify-center transition-all duration-200 ${
                        active ? "-translate-y-0.5" : ""
                      }`}
                    >
                      <Icon
                        className={`size-5.5 transition-colors duration-300 ${
                          active ? "text-primary" : "text-muted-foreground"
                        }`}
                        strokeWidth={active ? 2.5 : 2}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
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
  );
});
