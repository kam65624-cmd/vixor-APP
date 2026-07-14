import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
  type CSSProperties,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { getTelegramInitData } from "@/shared/telegram";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";
import { getUserPoints, getUserProfile, getUnreadNotificationCount } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useWallet } from "@/domains/wallet/adapter/WalletProvider";
import { WalletProviderSelector } from "@/domains/wallet/adapter/WalletProviderSelector";
import { useOnline } from "@/shared/hooks/use-online";

// ── SOL Price Hook ──────────────────────────────────────────────────────────

function useSolPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let unsub: (() => void) | undefined;

    // Use BinanceWS for real-time SOL price instead of polling
    import("@/shared/market-data/binance-ws").then(({ BinanceWS }) => {
      const ws = BinanceWS.getInstance();
      unsub = ws.subscribe(["SOLUSDT"], (prices) => {
        const sol = prices.get("SOLUSDT");
        if (sol) {
          setPrice(sol.price);
          setChange(sol.change24h);
        }
      });
    });

    return () => {
      unsub?.();
    };
  }, []);

  return { price, change };
}

// ── Lazy Imports ────────────────────────────────────────────────────────────

const OnboardingModal = lazy(() =>
  import("./OnboardingModal").then((m) => ({ default: m.OnboardingModal })),
);

// ── Navigation Data ─────────────────────────────────────────────────────────

// Bottom nav: 4 core items
const bottomNavItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    to: "/analyze",
    label: "Analyze",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    to: "/copilot",
    label: "Copilot",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    ),
  },
  {
    to: "/discover",
    label: "Discover",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
] as const;

// "More" panel: organized into categories
interface MoreNavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface MoreNavCategory {
  title: string;
  items: MoreNavItem[];
}

const moreNavCategories: MoreNavCategory[] = [
  // ── Layer 1: Core Loop (highest design priority) ──
  {
    title: "Core Loop",
    items: [
      {
        to: "/signals",
        label: "Signals",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.9 19.1C1.7 15.9 1.7 10.6 4.9 7.4" />
            <path d="M7.8 16.2c-2-2-2-5.2 0-7.2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 16.2c2-2 2-5.2 0-7.2" />
            <path d="M19.1 19.1c3.2-3.2 3.2-8.5 0-11.7" />
          </svg>
        ),
      },
      {
        to: "/trade-desk",
        label: "Trade Desk",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        ),
      },
      {
        to: "/daily-loop",
        label: "Daily Loop",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        ),
      },
      {
        to: "/alpha",
        label: "Alpha Signals",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        to: "/predictions",
        label: "Predictions",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        ),
      },
    ],
  },
  // ── Layer 2: Data & Markets ──
  {
    title: "Data & Markets",
    items: [
      {
        to: "/charts",
        label: "Charts",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        ),
      },
      {
        to: "/pulse",
        label: "Pulse & Whale",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12h4l3-9 4 18 3-9h4" />
          </svg>
        ),
      },
      {
        to: "/radar",
        label: "Radar",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
          </svg>
        ),
      },
      {
        to: "/curves",
        label: "Bonding Curves",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m7 17 4-8 4 4 5-9" />
          </svg>
        ),
      },
    ],
  },
  // ── Layer 3: Account & Performance ──
  {
    title: "Performance",
    items: [
      {
        to: "/portfolio",
        label: "Portfolio",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        ),
      },
      {
        to: "/pnl",
        label: "PnL Tracker",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        to: "/journal",
        label: "Journal",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        ),
      },
      {
        to: "/backtest",
        label: "Strategy Lab",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        ),
      },
      {
        to: "/vision",
        label: "Vision AI",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        to: "/bags",
        label: "Bags",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 3h-8l-2 4h12l-2-4z" />
          </svg>
        ),
      },
    ],
  },
  // ── Layer 4: AI & Automation ──
  {
    title: "AI & Automation",
    items: [
      {
        to: "/copilot",
        label: "Copilot",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        ),
      },
      {
        to: "/perpetuals",
        label: "Perpetuals",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 12h10" />
            <path d="M7 5v14" />
            <path d="M17 5v14" />
          </svg>
        ),
      },
      {
        to: "/trackers",
        label: "Trackers",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        ),
      },
    ],
  },
  // ── Layer 5: Platform Management ──
  {
    title: "Platform",
    items: [
      {
        to: "/settings",
        label: "Settings",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        to: "/profile",
        label: "Profile",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        to: "/premium",
        label: "Premium",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        ),
      },
      {
        to: "/rewards",
        label: "Rewards",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        ),
      },
      {
        to: "/brokers",
        label: "Brokers",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        ),
      },
      {
        to: "/referral",
        label: "Referral",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
          </svg>
        ),
      },
    ],
  },
];

// ── AppShell ────────────────────────────────────────────────────────────────

// Detect Telegram WebApp for layout adjustments
function useIsTelegram() {
  const [isTg, setIsTg] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tg = (window as any).Telegram?.WebApp;
      setIsTg(!!tg);
    }
  }, []);
  return isTg;
}

export function AppShell({ children }: { children: ReactNode }) {
  useRenderGuard("AppShell");
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const sol = useSolPrice();
  const isTg = useIsTelegram();
  const { wallet } = useWallet();
  const { isOnline } = useOnline();

  const signedIn = path !== "/auth";

  // Close "More" panel on route change
  useEffect(() => {
    setShowMore(false);
  }, [path]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn && !localStorage.getItem("vixor-onboarded")) {
      const t = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(t);
    }
  }, [signedIn]);

  // ── Telegram Profile Auto-Sync ──
  // On every app open inside Telegram, sync the user's name, photo, and ID
  // from the WebApp API to the server profile. This ensures the profile
  // always reflects the latest Telegram data without requiring manual action.
  const tgSyncRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!signedIn || tgSyncRef.current) return;
    tgSyncRef.current = true;

    const tg = (
      window as unknown as {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: {
              user?: {
                id: number;
                first_name: string;
                last_name?: string;
                username?: string;
                photo_url?: string;
              };
            };
          };
        };
      }
    ).Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;
    if (!tgUser?.id) return;

    // Delay to let auth session be established first
    const timer = setTimeout(() => {
      import("@/domains/user/functions").then(({ syncTelegramProfile }) =>
        syncTelegramProfile({
          data: {
            telegramId: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
            photoUrl: tgUser.photo_url,
          },
        }).catch((err) => {
          console.warn("[AppShell] Telegram profile sync failed:", err?.message);
        }),
      );
    }, 3000); // 3s delay to ensure auth session is ready
    return () => clearTimeout(timer);
  }, [signedIn]);

  const telegramLinkedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!signedIn || telegramLinkedRef.current) return;
    if (localStorage.getItem("vixor-tg-linked")) {
      telegramLinkedRef.current = true;
      return;
    }

    // Try up to 3 times with delay (SDK may not be ready on first render)
    let attempts = 0;
    const maxAttempts = 3;
    const tryLink = () => {
      attempts++;
      const initData = getTelegramInitData();
      if (initData) {
        telegramLinkedRef.current = true;
        import("@/domains/user/functions").then(({ linkTelegramAccount }) =>
          linkTelegramAccount({ data: { initData } })
            .then(() => {
              localStorage.setItem("vixor-tg-linked", "1");
            })
            .catch((err) => {
              console.error("Failed to link Telegram:", err);
              // Allow retry on next session by NOT setting vixor-tg-linked
              telegramLinkedRef.current = false;
            }),
        );
      } else if (attempts < maxAttempts) {
        setTimeout(tryLink, 500);
      }
    };
    tryLink();
  }, [signedIn]);

  const closeOnboarding = useCallback(() => {
    try {
      localStorage.setItem("vixor-onboarded", "1");
    } catch {
      // localStorage may be unavailable in private browsing
    }
    setShowOnboarding(false);
  }, []);

  if (!signedIn) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-background)", color: "var(--color-foreground)" }}
    >
      {/* ── Top Bar: Logo + SOL Price + Actions ── */}
      <TopNav
        solPrice={sol.price}
        solChange={sol.change}
        isTg={isTg}
        onWalletClick={() => {
          if (wallet?.status === "connected") {
            navigate({ to: "/wallet-web3" });
          } else {
            setShowWalletModal(true);
          }
        }}
      />

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div
          style={{
            padding: "6px 16px",
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            color: "#F87171",
            background: "rgba(248,113,113,0.08)",
            borderBottom: "1px solid rgba(248,113,113,0.15)",
            letterSpacing: "0.03em",
          }}
          role="alert"
          aria-live="assertive"
        >
          You are offline — data may be stale
        </div>
      )}

      {/* ── Main Content ── */}
      <main
        className="flex-1 overflow-auto"
        style={{
          paddingTop: isTg ? "calc(44px + env(safe-area-inset-top, 0px))" : "44px",
          paddingBottom: "calc(52px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div key={path} className="vixor-page-enter">
          {children}
        </div>
      </main>

      {/* ── Bottom Bar: 5 core nav + More button ── */}
      <BottomBar
        onMoreOpen={() => setShowMore(true)}
        solPrice={sol.price}
        solChange={sol.change}
        isTg={isTg}
      />

      {/* ── More Panel (Slide-up) ── */}
      {showMore && <MorePanel currentPath={path} onClose={() => setShowMore(false)} />}

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onClose={closeOnboarding} />
        </Suspense>
      )}

      {/* ── Wallet Connection Modal (OpenSea-style) ── */}
      {showWalletModal && (
        <div
          onClick={() => setShowWalletModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--overlay)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-card)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              borderTop: "1px solid var(--color-border)",
              width: "100%",
              maxWidth: "420px",
              maxHeight: "80vh",
              overflowY: "auto",
              animation: "slideUp 0.25s ease",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: "10px",
                paddingBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "4px",
                  borderRadius: "2px",
                  background: "var(--handle-bar)",
                }}
              />
            </div>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px 12px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-foreground)" }}>
                Connect Wallet
              </span>
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  background: "var(--color-muted)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  color: "var(--color-muted-foreground)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            {/* Provider selector */}
            <div style={{ padding: "12px 16px 16px" }}>
              <WalletProviderSelector />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification Bell with unread badge ──────────────────────────────────

const NotificationBell = memo(function NotificationBell() {
  const fetchUnread = useStableServerFn(getUnreadNotificationCount);
  const { data } = useQuery({
    queryKey: ["unread-notif-count"],
    queryFn: () => fetchUnread({}),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unread = data?.unreadCount ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: "30px",
        height: "30px",
        background: "var(--color-muted)",
        textDecoration: "none",
        minWidth: "44px",
        minHeight: "44px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-muted-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-3px",
            right: "-3px",
            minWidth: "14px",
            height: "14px",
            borderRadius: "7px",
            background: "var(--color-bearish)",
            color: "var(--primary-foreground)",
            fontSize: "10px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
          }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV — Minimal: Logo, Discover CTA, SOL price, Deposit, Wallet, User, Bell
// ─────────────────────────────────────────────────────────────────────────────

// ── Points Badge ───────────────────────────────────────────────────────────

const PointsBadge = memo(function PointsBadge() {
  const { data } = useQuery({
    queryKey: ["user-points-nav"],
    queryFn: () => getUserPoints({}),
    staleTime: 30_000,
    retry: 2,
  });
  const balance = data?.balance ?? 0;

  return (
    <Link
      to="/rewards"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-mono font-bold"
      style={{
        color: "var(--color-primary)",
        background: "rgba(91,110,245,0.08)",
        border: "1px solid rgba(91,110,245,0.15)",
        textDecoration: "none",
        minWidth: "44px",
        minHeight: "44px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: "12px" }}>⚡</span>
      {balance}
    </Link>
  );
});

// ── Wallet Nav Label — shows balance + address when connected, "Connect" when not ──

const WalletNavLabel = memo(function WalletNavLabel() {
  const { wallet } = useWallet();
  const isConnected = wallet?.status === "connected";
  const addr = wallet?.address || "";
  const isSolana = wallet?.chain === "solana";

  // Fetch SOL balance when connected on Solana
  const { data: solBalance } = useQuery({
    queryKey: ["wallet-sol-balance", addr],
    queryFn: async () => {
      if (!addr || !isSolana) return null;
      try {
        const { getPhantomSolBalance } = await import("@/domains/wallet/adapters/phantom-adapter");
        return await getPhantomSolBalance(addr);
      } catch {
        // Expected: dynamic import or wallet adapter may fail
        return null;
      }
    },
    enabled: isConnected && isSolana && !!addr,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (!isConnected) {
    return <span className="hidden sm:inline">Connect</span>;
  }

  const short = addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-3)}` : addr;
  const balanceStr =
    solBalance != null ? `${solBalance.toFixed(solBalance < 1 ? 3 : 2)} SOL` : null;

  return (
    <span className="hidden sm:inline" style={{ opacity: 0.9 }}>
      {balanceStr ? `${balanceStr} · ` : ""}
      {short}
    </span>
  );
});

interface TopNavProps {
  solPrice?: number | null;
  solChange?: number | null;
  isTg?: boolean;
  onWalletClick?: () => void;
}

// ── Top Nav Avatar — shows real user photo ──────────────────────────────

/** Read Telegram user photo directly from the WebApp API (instant, no server round-trip). */
function useTelegramPhoto(): string | null {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const tg = (
        window as unknown as {
          Telegram?: { WebApp?: { initDataUnsafe?: { user?: { photo_url?: string } } } };
        }
      ).Telegram?.WebApp;
      const url = tg?.initDataUnsafe?.user?.photo_url;
      if (url) setPhoto(url);
    } catch {
      // Telegram WebApp API unavailable outside Telegram; safe to ignore.
    }
  }, []);
  return photo;
}

const TopNavAvatar = memo(function TopNavAvatar() {
  const fetchProfile = useStableServerFn(getUserProfile);
  const tgPhoto = useTelegramPhoto();

  // Also get Telegram name client-side for the initial fallback
  const [tgName, setTgName] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const tg = (
        window as unknown as {
          Telegram?: {
            WebApp?: { initDataUnsafe?: { user?: { first_name?: string; username?: string } } };
          };
        }
      ).Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      if (user?.first_name) setTgName(user.first_name);
      else if (user?.username) setTgName(user.username);
    } catch {
      // Telegram WebApp API unavailable outside Telegram; safe to ignore.
    }
  }, []);

  const { data } = useQuery({
    queryKey: ["topnav-profile"],
    queryFn: () => fetchProfile({}),
    staleTime: 60_000,
  });
  const profile = data?.profile;
  // Priority: Telegram client-side photo > server telegram_photo_url > avatar_url
  const photoUrl = tgPhoto || profile?.telegram_photo_url || profile?.avatar_url;
  const displayName = tgName || profile?.display_name || profile?.username || "";
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link
      to="/profile"
      className="flex items-center justify-center rounded-full overflow-hidden"
      style={{
        width: "30px",
        height: "30px",
        border: "1px solid var(--color-border)",
        textDecoration: "none",
        background: photoUrl && !imgErr ? "none" : "var(--gradient-primary)",
        flexShrink: 0,
        minWidth: "44px",
        minHeight: "44px",
      }}
    >
      {photoUrl && !imgErr ? (
        <img
          src={photoUrl}
          alt={displayName}
          onError={() => setImgErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" as const }}
        />
      ) : (
        <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary-foreground)" }}>
          {initial}
        </span>
      )}
    </Link>
  );
});

const TopNav = memo(function TopNav({ solPrice, solChange, isTg, onWalletClick }: TopNavProps) {
  return (
    <header
      className="fixed inset-x-0 z-50"
      style={{
        background: "rgba(10, 10, 13, 0.80)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--color-border)",
        height: "44px",
        top: isTg ? "env(safe-area-inset-top, 0px)" : "0px",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
      }}
    >
      <div className="flex items-center justify-between w-full" style={{ maxWidth: "100%" }}>
        {/* Left: Logo (icon only) */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center mr-4" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "var(--gradient-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary-foreground)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
          </Link>

          {/* SOL Global Price — compact */}
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold"
            style={{
              color: (solChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
            }}
          >
            SOL {solPrice ? `$${solPrice.toFixed(2)}` : "..."}
            {solChange != null ? ` ${solChange >= 0 ? "+" : ""}${solChange.toFixed(1)}%` : ""}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Points */}
          <PointsBadge />

          {/* Wallet — shows balance when connected, opens modal when disconnected */}
          <button
            onClick={onWalletClick}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded text-[11px] sm:text-[12px] font-bold"
            style={{
              background: "var(--gradient-primary)",
              color: "var(--primary-foreground)",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(91,110,245,0.25)",
              height: "30px",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
            </svg>
            <WalletNavLabel />
          </button>

          {/* User Avatar — real photo from profile */}
          <TopNavAvatar />

          {/* Notifications — with unread badge */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM BAR — 5 core items + More button
// ─────────────────────────────────────────────────────────────────────────────

interface BottomBarProps {
  onMoreOpen: () => void;
  solPrice?: number | null;
  solChange?: number | null;
  isTg?: boolean;
}

const BottomBar = memo(function BottomBar({
  onMoreOpen,
  solPrice,
  solChange,
  isTg,
}: BottomBarProps) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: "rgba(10, 10, 13, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        height: isTg ? "calc(52px + env(safe-area-inset-bottom, 0px))" : "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: isTg ? "env(safe-area-inset-bottom, 0px)" : "0px",
        padding: "0 4px",
      }}
    >
      {/* 5 core nav items */}
      {bottomNavItems.map((item) => {
        const isActive = path === item.to || path.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center rounded-lg transition-all"
            style={{
              minWidth: "48px",
              height: "44px",
              textDecoration: "none",
            }}
          >
            <div
              className="flex flex-col items-center justify-center"
              style={{
                opacity: isActive ? 1 : 0.45,
                transform: isActive ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  color: isActive ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  transition: "color 0.2s ease",
                }}
              >
                {item.icon}
              </span>
              {isActive && (
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    marginTop: "3px",
                    boxShadow: "0 0 8px var(--color-primary)",
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--color-primary)" : "var(--color-muted-foreground)",
                  letterSpacing: "0.02em",
                  transition: "all 0.2s ease",
                }}
              >
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}

      {/* More Button */}
      <button
        onClick={onMoreOpen}
        className="flex flex-col items-center justify-center rounded-lg transition-all"
        style={{
          minWidth: "48px",
          height: "44px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          opacity: 0.6,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="12" cy="5" r="1" fill="var(--color-muted-foreground)" />
          <circle cx="12" cy="12" r="1" fill="var(--color-muted-foreground)" />
          <circle cx="12" cy="19" r="1" fill="var(--color-muted-foreground)" />
        </svg>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            marginTop: "2px",
            letterSpacing: "0.02em",
          }}
        >
          More
        </span>
      </button>
    </nav>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// MORE PANEL — Slide-up sheet with categorized navigation
// ─────────────────────────────────────────────────────────────────────────────

interface MorePanelProps {
  currentPath: string;
  onClose: () => void;
}

function MorePanel({ currentPath, onClose }: MorePanelProps) {
  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--overlay-secondary)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 99,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--color-card)",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          borderTop: "1px solid var(--color-border)",
          zIndex: 100,
          maxHeight: "75vh",
          overflowY: "auto",
          animation: "slideUp 0.25s ease",
          paddingBottom: "8px",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "10px",
            paddingBottom: "6px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--handle-bar)",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px 10px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
            }}
          >
            Explore
          </span>
          <button
            onClick={onClose}
            style={{
              background: "var(--color-muted)",
              border: "none",
              borderRadius: "6px",
              padding: "4px 10px",
              color: "var(--color-muted-foreground)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {/* Categories */}
        <div style={{ padding: "8px 12px" }}>
          {moreNavCategories.map((category) => (
            <div key={category.title} style={{ marginBottom: "12px" }}>
              {/* Category Title */}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--color-muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 8px 6px",
                }}
              >
                {category.title}
              </div>

              {/* Items Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                }}
              >
                {category.items.map((item) => {
                  const isActive = currentPath === item.to || currentPath.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px",
                        borderRadius: "12px",
                        background: isActive ? "var(--bullish-bg)" : "var(--color-muted)",
                        border: isActive
                          ? "1px solid color-mix(in srgb, var(--color-bullish) 20%, transparent)"
                          : "1px solid var(--color-border)",
                        textDecoration: "none",
                        color: isActive ? "var(--color-primary)" : "var(--color-muted-foreground)",
                        fontSize: "12px",
                        fontWeight: isActive ? 600 : 500,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          color: isActive
                            ? "var(--color-primary)"
                            : "var(--color-muted-foreground)",
                          display: "flex",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyframe animations via inline style tag */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
