import { Link, useLocation } from "@tanstack/react-router";
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

import { getTelegramInitData } from "@/shared/telegram";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";

// ── SOL Price Hook ──────────────────────────────────────────────────────────

function useSolPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/sol-price");
        const data = await res.json();
        if (!cancelled) {
          setPrice(data.price);
          setChange(data.change24h);
        }
      } catch {
        // Silently fail — keep last known price
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { price, change };
}

// ── Lazy Imports ────────────────────────────────────────────────────────────

const WalletConnectButton = lazy(() =>
  import("@/domains/wallet/adapter").then((m) => ({
    default: m.WalletConnectButton,
  })),
);

const OnboardingModal = lazy(() =>
  import("./OnboardingModal").then((m) => ({ default: m.OnboardingModal })),
);

// ── Navigation Data ─────────────────────────────────────────────────────────

// Bottom nav: only 5 core items
const bottomNavItems = [
  {
    to: "/discover",
    label: "Discover",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    to: "/pulse",
    label: "Pulse",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1 1 12 5.006a5 5 0 1 1 7.5 7.566z" />
      </svg>
    ),
  },
  {
    to: "/copilot",
    label: "Copilot",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
      </svg>
    ),
  },
  {
    to: "/analyze",
    label: "Analyze",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h5" /><path d="M17 12h5" /><path d="M7 7l3.5 5-3.5 5H5l3.5-5L5 7z" /><path d="M14 7l3.5 5-3.5 5h-2l3.5-5L12 7z" />
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
  {
    title: "Analytics",
    items: [
      {
        to: "/alpha",
        label: "Alpha Signals",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        ),
      },
      {
        to: "/whale",
        label: "Whale Alerts",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
            <path d="M7 5v14" /><path d="M12 5v14" />
          </svg>
        ),
      },
      {
        to: "/predictions",
        label: "Predictions",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
          </svg>
        ),
      },
      {
        to: "/trackers",
        label: "Trackers",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "DeFi",
    items: [
      {
        to: "/perpetuals",
        label: "Perpetuals",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 12h10" /><path d="M7 5v14" /><path d="M17 5v14" />
            <path d="M5 12h2" /><path d="M17 12h2" />
          </svg>
        ),
      },
      {
        to: "/yield",
        label: "Yield",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 20h18" /><path d="M7 16V4" /><path d="M12 16V8" /><path d="M17 16v-4" />
            <path d="M4 20l3-4 4 4 4-8 4 4 4-4" />
          </svg>
        ),
      },
      {
        to: "/curves",
        label: "Virtual Curve",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="m7 17 4-8 4 4 5-9" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Portfolio",
    items: [
      {
        to: "/wallet-web3",
        label: "Wallet",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        ),
      },
      {
        to: "/pnl",
        label: "PnL",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        to: "/bags",
        label: "Bags",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        ),
      },
      {
        to: "/portfolio",
        label: "Portfolio",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 3h-8l-2 4h12l-2-4z" /><path d="M12 11v6" /><path d="M9 14h6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Social & More",
    items: [
      {
        to: "/communities",
        label: "Communities",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        to: "/rewards",
        label: "Rewards",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        ),
      },
      {
        to: "/vision",
        label: "Vision",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
          </svg>
        ),
      },
      {
        to: "/signals",
        label: "Signals",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          </svg>
        ),
      },
    ],
  },
];

// ── AppShell ────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: ReactNode }) {
  useRenderGuard("AppShell");
  const location = useLocation();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const sol = useSolPrice();

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
      import("@/domains/user/functions").then(({ linkTelegramAccount }) =>
        linkTelegramAccount({ data: { initData } })
          .then(() => {
            localStorage.setItem("vixor-tg-linked", "1");
          })
          .catch((err) => console.error("Failed to link Telegram:", err)),
      );
    }
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
      style={{ background: "#0A0E1A", color: "#F0F4FC" }}
    >
      {/* ── Top Bar: Logo + SOL Price + Actions ── */}
      <TopNav solPrice={sol.price} solChange={sol.change} />

      {/* ── Main Content ── */}
      <main
        className="flex-1 overflow-auto"
        style={{ paddingTop: "40px", paddingBottom: "52px" }}
      >
        {children}
      </main>

      {/* ── Bottom Bar: 5 core nav + More button ── */}
      <BottomBar
        onMoreOpen={() => setShowMore(true)}
        solPrice={sol.price}
        solChange={sol.change}
      />

      {/* ── More Panel (Slide-up) ── */}
      {showMore && (
        <MorePanel
          currentPath={path}
          onClose={() => setShowMore(false)}
        />
      )}

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onClose={closeOnboarding} />
        </Suspense>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV — Minimal: Logo, Discover CTA, SOL price, Deposit, Wallet, User, Bell
// ─────────────────────────────────────────────────────────────────────────────

interface TopNavProps {
  solPrice?: number | null;
  solChange?: number | null;
}

const TopNav = memo(function TopNav({ solPrice, solChange }: TopNavProps) {
  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: "#0D1117",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        height: "40px",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
      }}
    >
      <div
        className="flex items-center justify-between w-full"
        style={{ maxWidth: "100%" }}
      >
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1.5 mr-4"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #3B82F6, #60A5FA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#F0F4FC",
                letterSpacing: "-0.02em",
              }}
            >
              VIXOR
            </span>
          </Link>

          {/* SOL Global Price — compact */}
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{
              color: (solChange ?? 0) >= 0 ? "#22C55E" : "#EF4444",
            }}
          >
            SOL{" "}
            {solPrice ? `$${solPrice.toFixed(2)}` : "..."}
            {solChange != null
              ? ` ${(solChange >= 0 ? "+" : "")}${solChange.toFixed(1)}%`
              : ""}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Deposit */}
          <Link
            to="/wallet-web3"
            className="hidden sm:flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #60A5FA)",
              color: "white",
              textDecoration: "none",
            }}
          >
            Deposit
          </Link>

          {/* Wallet Connect */}
          <Suspense fallback={null}>
            <WalletConnectButton />
          </Suspense>

          {/* User Avatar */}
          <Link
            to="/profile"
            className="flex items-center justify-center rounded-full"
            style={{
              width: "26px",
              height: "26px",
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(96,165,250,0.2))",
              border: "1px solid rgba(255,255,255,0.1)",
              textDecoration: "none",
            }}
          >
            <span
              style={{ fontSize: "9px", fontWeight: 800, color: "#F0F4FC" }}
            >
              ME
            </span>
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: "26px",
              height: "26px",
              background: "rgba(255,255,255,0.05)",
              textDecoration: "none",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7B8BA8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span
              className="absolute"
              style={{
                top: "2px",
                right: "2px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#3B82F6",
              }}
            />
          </Link>
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
}

const BottomBar = memo(function BottomBar({
  onMoreOpen,
  solPrice,
  solChange,
}: BottomBarProps) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: "#0D1117",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 4px",
      }}
    >
      {/* 4 core nav items */}
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
                  color: isActive ? "#60A5FA" : "#7B8BA8",
                  transition: "color 0.2s ease",
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#60A5FA" : "#7B8BA8",
                  marginTop: "2px",
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
          stroke="#7B8BA8"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="12" cy="5" r="1" fill="#7B8BA8" />
          <circle cx="12" cy="12" r="1" fill="#7B8BA8" />
          <circle cx="12" cy="19" r="1" fill="#7B8BA8" />
        </svg>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 500,
            color: "#7B8BA8",
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
          background: "rgba(0,0,0,0.6)",
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
          background: "#111827",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
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
              background: "rgba(255,255,255,0.15)",
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
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#F0F4FC",
            }}
          >
            Explore
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: "6px",
              padding: "4px 10px",
              color: "#7B8BA8",
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
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#4A5568",
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
                  gap: "6px",
                }}
              >
                {category.items.map((item) => {
                  const isActive =
                    currentPath === item.to ||
                    currentPath.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 10px",
                        borderRadius: "8px",
                        background: isActive
                          ? "rgba(59,130,246,0.12)"
                          : "rgba(255,255,255,0.03)",
                        border: isActive
                          ? "1px solid rgba(59,130,246,0.2)"
                          : "1px solid rgba(255,255,255,0.04)",
                        textDecoration: "none",
                        color: isActive ? "#60A5FA" : "#C9D1E0",
                        fontSize: "12px",
                        fontWeight: isActive ? 600 : 500,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          color: isActive ? "#60A5FA" : "#7B8BA8",
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