import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Plus, Brain, Briefcase, Bell, User, FlaskConical, Dna } from "lucide-react";
import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useRef, useState, useCallback, memo } from "react";
import { getTelegramInitData } from "@/shared/telegram";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";

// Lazy-load wallet connect button (Web3 deps are large — load only when needed)
const WalletConnectButton = lazy(() =>
  import("@/domains/wallet/adapter").then((m) => ({
    default: m.WalletConnectButton,
  }))
);

// P0: Lazy-load OnboardingModal — shown once, should not be in root chunk
const OnboardingModal = lazy(() =>
  import("./OnboardingModal").then((m) => ({ default: m.OnboardingModal }))
);

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
  {
    to: "/backtest",
    label: "Backtest",
    icon: FlaskConical,
    match: (p: string) => p.startsWith("/backtest"),
  },
  {
    to: "/experiments",
    label: "Experiments",
    icon: Dna,
    match: (p: string) => p.startsWith("/experiments"),
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn && !localStorage.getItem("vixor-onboarded")) {
      // Delay onboarding so it doesn't clash with first paint / auth bootstrap
      const t = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(t);
    }
  }, [signedIn]);

  const telegramLinkedRef = useRef(false);
  // P0: Dynamic imports for Telegram linking — avoids pulling supabase + barrel into root chunk
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
      // Dynamic import: pulls linkTelegramAccount only when needed, not at page load
      import("@/domains/user/functions").then(({ linkTelegramAccount }) =>
        linkTelegramAccount({ data: { initData } })
          .then(() => {
            localStorage.setItem("vixor-tg-linked", "1");
          })
          .catch((err) => console.error("Failed to link Telegram:", err))
      );
    }
  }, [signedIn]);

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
      {/* Layout: full-width header, content max-w-7xl (1280px) centered.
          Mobile: bottom nav, no sidebar. Desktop (lg+): left sidebar rail
          + content + bottom nav hidden. Tablet uses content max-w-5xl. */}
      <div className="flex-1 flex w-full pt-14">
        <DesktopSidebar path={path} tabs={tabs} />
        <main
          className="flex-1 mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-28 lg:pb-12"
          style={{ paddingBottom: "max(7rem, calc(7rem + env(safe-area-inset-bottom, 0px)))" }}
        >
          {children}
        </main>
      </div>
      <BottomNav path={path} tabs={tabs} />

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onClose={closeOnboarding} />
        </Suspense>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// DESKTOP SIDEBAR RAIL — fixed left rail with icons (lg+ only)
// ───────────────────────────────────────────────────────────────────────────
// Solves the "pages not smoothly connected" complaint on desktop — replaces
// the floating bottom nav (which was awkward on desktop) with a proper
// desktop sidebar like Bloomberg Terminal / TradingView.
interface SidebarProps {
  path: string;
  tabs: readonly {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    match: (p: string) => boolean;
  }[];
}

const DesktopSidebar = memo(function DesktopSidebar({ path, tabs }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-16 border-r border-border bg-card/50 backdrop-blur-sm z-30">
      <nav className="flex-1 flex flex-col items-center gap-2 py-6">
        {tabs.map((t) => {
          const active = t.match(path);
          const Icon = t.icon;
          const isAnalyze = t.label === "Analyze";
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`group relative flex flex-col items-center justify-center size-12 rounded-2xl transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
              }`}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              title={t.label}
            >
              {isAnalyze ? (
                <div
                  className={`size-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    active
                      ? "gradient-primary glow-primary scale-105"
                      : "bg-card-hover border border-border group-hover:scale-105"
                  }`}
                >
                  <Icon
                    className={`size-5 ${active ? "text-primary-foreground" : "text-foreground"}`}
                    strokeWidth={2.5}
                  />
                </div>
              ) : (
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              )}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                  active ? "text-primary" : ""
                }`}
              >
                {t.label}
              </span>
              {active && !isAnalyze && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-2 py-4 border-t border-border">
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="size-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors relative"
          title="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute top-1 right-1 size-2 rounded-full bg-primary border border-card" />
        </Link>
        <Link
          to="/profile"
          aria-label="Profile"
          className="size-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors"
          title="Profile"
        >
          <User className="size-5" />
        </Link>
      </div>
    </aside>
  );
});

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
      {/* Full-width header — content max-w-7xl + sidebar offset on desktop */}
      <div className="mx-auto w-full max-w-md sm:max-w-2xl lg:max-w-7xl px-4 sm:px-6 lg:px-8 lg:pl-24">
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
            <Suspense fallback={null}>
              <WalletConnectButton />
            </Suspense>
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
      className="fixed bottom-0 inset-x-0 z-40 pointer-events-none lg:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="mx-auto w-full max-w-md sm:max-w-2xl px-3 pb-3 pointer-events-auto">
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
