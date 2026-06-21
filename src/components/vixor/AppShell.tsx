import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useRef, useState, useCallback, memo } from "react";

import { getTelegramInitData } from "@/shared/telegram";

// ── SOL Price Hook — fetches from Binance via /api/sol-price ──
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
import { useRenderGuard } from "@/shared/hooks/use-render-guard";

// Lazy-load wallet connect button (Web3 deps are large — load only when needed)
const WalletConnectButton = lazy(() =>
  import("@/domains/wallet/adapter").then((m) => ({
    default: m.WalletConnectButton,
  })),
);

// P0: Lazy-load OnboardingModal — shown once, should not be in root chunk
const OnboardingModal = lazy(() =>
  import("./OnboardingModal").then((m) => ({ default: m.OnboardingModal })),
);

// ── Axiom-style Navigation — Top Bar + Bottom Bar ──
// Top bar: Discover, Pulse, Trackers, Perpetuals, Predictions, Yield, Vision, Portfolio, Rewards
// Bottom bar: Wallet, Social, Discover, Pulse, PnL, Alpha, Whale, Pump, Virtual Curve, Bags

const topNavItems = [
  { to: "/discover", label: "Discover", icon: "🔍" },
  { to: "/pulse", label: "Pulse", icon: "💓" },
  { to: "/trackers", label: "Trackers", icon: "📊" },
  { to: "/perpetuals", label: "Perpetuals", icon: "♾️" },
  { to: "/predictions", label: "Predictions", icon: "🎯" },
  { to: "/yield", label: "Yield", icon: "🌾" },
  { to: "/vision", label: "Vision", icon: "👁️" },
  { to: "/portfolio", label: "Portfolio", icon: "💼" },
  { to: "/rewards", label: "Rewards", icon: "🏆" },
] as const;

const bottomNavItems = [
  { to: "/wallet-web3", label: "Wallet", icon: "👛" },
  { to: "/communities", label: "Social", icon: "👥" },
  { to: "/discover", label: "Discover", icon: "🔍" },
  { to: "/pulse", label: "Pulse", icon: "💓" },
  { to: "/pnl", label: "PnL", icon: "💰" },
  { to: "/alpha", label: "Alpha", icon: "⚡" },
  { to: "/whale", label: "Whale", icon: "🐋" },
  { to: "/trackers", label: "Pump", icon: "🚀" },
  { to: "/curves", label: "VCurve", icon: "📉" },
  { to: "/bags", label: "Bags", icon: "🎒" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useRenderGuard("AppShell");
  const location = useLocation();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedChain, setSelectedChain] = useState("Solana");
  const sol = useSolPrice();

  const signedIn = path !== "/auth";

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
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0E1A", color: "#F0F4FC" }}>
      {/* ── Axiom-Style Top Navigation Bar ── */}
      <TopNav selectedChain={selectedChain} onChainChange={setSelectedChain} solPrice={sol.price} solChange={sol.change} />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto" style={{ paddingTop: "40px", paddingBottom: "52px" }}>
        {children}
      </main>

      {/* ── Axiom-Style Bottom Navigation Bar ── */}
      <BottomBar solPrice={sol.price} solChange={sol.change} />

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onClose={closeOnboarding} />
        </Suspense>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// TOP NAV BAR — Axiom-style with chain selector, nav links, wallet, deposit
// ───────────────────────────────────────────────────────────────────────────

interface TopNavProps {
  selectedChain: string;
  onChainChange: (chain: string) => void;
  solPrice?: number | null;
  solChange?: number | null;
}

const TopNav = memo(function TopNav({ selectedChain, onChainChange, solPrice, solChange }: TopNavProps) {
  const location = useLocation();
  const path = location.pathname;

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
      <div className="flex items-center justify-between w-full" style={{ maxWidth: "100%" }}>
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-1">
          {/* Vixor Logo */}
          <Link to="/" className="flex items-center gap-1.5 mr-3" style={{ textDecoration: "none" }}>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#F0F4FC", letterSpacing: "-0.02em" }}>
              VIXOR
            </span>
          </Link>

          {/* Nav Links */}
          {topNavItems.map((item) => {
            const isActive = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all"
                style={{
                  color: isActive ? "#60A5FA" : "#7B8BA8",
                  background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "11px" }}>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Chain Selector + SOL Price + Deposit + Wallet + User */}
        <div className="flex items-center gap-2">
          {/* Chain Selector */}
          <button
            onClick={() => onChainChange(selectedChain === "Solana" ? "Ethereum" : "Solana")}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              background: "rgba(59,130,246,0.12)",
              color: "#60A5FA",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <span>◎</span>
            <span>{selectedChain}</span>
          </button>

          {/* SOL Global Price */}
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{ color: (solChange ?? 0) >= 0 ? "#22C55E" : "#EF4444" }}
          >
            SOL {solPrice ? `$${solPrice.toFixed(2)}` : "..."}{solChange != null ? ` ${(solChange >= 0 ? "+" : "")}${solChange.toFixed(1)}%` : ""}
          </div>

          {/* Deposit Button */}
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
              background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(96,165,250,0.2))",
              border: "1px solid rgba(255,255,255,0.1)",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#F0F4FC" }}>ME</span>
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
            <span style={{ fontSize: "12px" }}>🔔</span>
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

// ───────────────────────────────────────────────────────────────────────────
// BOTTOM BAR — Axiom-style with crypto icons + SOL global price + social links
// ───────────────────────────────────────────────────────────────────────────

interface BottomBarProps {
  solPrice?: number | null;
  solChange?: number | null;
}

const BottomBar = memo(function BottomBar({ solPrice, solChange }: BottomBarProps) {
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
        justifyContent: "space-between",
        padding: "0 4px",
      }}
    >
      {/* Bottom Nav Icons */}
      <div className="flex items-center justify-center flex-1 gap-0.5">
        {bottomNavItems.map((item) => {
          const isActive = path === item.to || path.startsWith(item.to + "/");
          return (
            <Link
              key={item.to + item.label}
              to={item.to}
              className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg transition-all"
              style={{
                minWidth: "0",
                textDecoration: "none",
              }}
            >
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                <span style={{ fontSize: "14px", lineHeight: 1 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: "8px",
                    fontWeight: 600,
                    color: isActive ? "#60A5FA" : "#7B8BA8",
                    marginTop: "1px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Right side: SOL Price + Social Links */}
      <div
        className="hidden md:flex items-center gap-2 pl-2"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", marginLeft: "4px", paddingLeft: "8px" }}
      >
        <span className="text-[10px] font-mono font-bold" style={{ color: (solChange ?? 0) >= 0 ? "#22C55E" : "#EF4444" }}>
          SOL {solPrice ? `$${solPrice.toFixed(2)}` : "..."} GLOBAL
        </span>
        <a href="#" className="text-[10px]" style={{ color: "#7B8BA8", textDecoration: "none" }}>
          Discord
        </a>
        <a href="#" className="text-[10px]" style={{ color: "#7B8BA8", textDecoration: "none" }}>
          X
        </a>
        <a href="#" className="text-[10px]" style={{ color: "#7B8BA8", textDecoration: "none" }}>
          Docs
        </a>
      </div>
    </nav>
  );
});
