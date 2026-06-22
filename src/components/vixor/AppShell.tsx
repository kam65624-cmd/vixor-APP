import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useRef, useState, useCallback, memo } from "react";

import { getTelegramInitData } from "@/shared/telegram";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";

// ── SOL Price Hook ──
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
        if (!cancelled) { setPrice(data.price); setChange(data.change24h); }
      } catch { /* keep last known */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  return { price, change };
}

const WalletConnectButton = lazy(() =>
  import("@/domains/wallet/adapter").then((m) => ({ default: m.WalletConnectButton })),
);
const OnboardingModal = lazy(() =>
  import("./OnboardingModal").then((m) => ({ default: m.OnboardingModal })),
);

// ── Navigation Config (matches Axiom.trade exactly) ──
const topNavItems = [
  { to: "/rewards", label: "Rewards" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/vision", label: "Vision" },
  { to: "/yield", label: "Yield" },
  { to: "/predictions", label: "Predictions" },
  { to: "/perpetuals", label: "Perpetuals" },
  { to: "/trackers", label: "Trackers" },
  { to: "/pulse", label: "Pulse" },
  { to: "/discover", label: "Discover" },
] as const;

const bottomNavItems = [
  { to: "/wallet-web3", label: "Wallet", icon: "\uD83D\uDC5B" },
  { to: "/communities", label: "Social", icon: "\uD83D\uDC65" },
  { to: "/discover", label: "Discover", icon: "\uD83D\uDD0D" },
  { to: "/pulse", label: "Pulse", icon: "\uD83D\uDC93" },
  { to: "/pnl", label: "PnL", icon: "\uD83D\uDCB0" },
  { to: "/alpha", label: "Alpha", icon: "\u26A1" },
  { to: "/whale", label: "Whale", icon: "\uD83D\uDC0B" },
  { to: "/trackers", label: "Pump", icon: "\uD83D\uDE80" },
  { to: "/curves", label: "VCurve", icon: "\uD83D\uDCC9" },
  { to: "/bags", label: "Bags", icon: "\uD83C\uDF92" },
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
    if (localStorage.getItem("vixor-tg-linked")) { telegramLinkedRef.current = true; return; }
    const initData = getTelegramInitData();
    if (initData) {
      telegramLinkedRef.current = true;
      import("@/domains/user/functions").then(({ linkTelegramAccount }) =>
        linkTelegramAccount({ data: { initData } })
          .then(() => localStorage.setItem("vixor-tg-linked", "1"))
          .catch((err) => console.error("Failed to link Telegram:", err)),
      );
    }
  }, [signedIn]);

  const closeOnboarding = useCallback(() => {
    try { localStorage.setItem("vixor-onboarded", "1"); } catch { /* */ }
    setShowOnboarding(false);
  }, []);

  if (!signedIn) return <>{children}</>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0f1424", color: "#F0F4FC" }}>
      <TopNav selectedChain={selectedChain} onChainChange={setSelectedChain} solPrice={sol.price} solChange={sol.change} />
      <main style={{ flex: 1, overflow: "auto", paddingTop: "40px", paddingBottom: "52px" }}>
        {children}
      </main>
      <BottomBar solPrice={sol.price} solChange={sol.change} />
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onClose={closeOnboarding} />
        </Suspense>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOP NAV — exact Axiom.trade layout
// Logo | [Trade btn] [Deposit btn] SOL $price | chain | nav links | search star bell wallet user
// ─────────────────────────────────────────────────────────────────

interface TopNavProps {
  selectedChain: string;
  onChainChange: (c: string) => void;
  solPrice?: number | null;
  solChange?: number | null;
}

const TopNav = memo(function TopNav({ selectedChain, onChainChange, solPrice, solChange }: TopNavProps) {
  const location = useLocation();
  const path = location.pathname;
  const solUp = (solChange ?? 0) >= 0;

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "#121826",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      height: "40px",
      display: "flex",
      alignItems: "center",
      padding: "0 10px",
      fontSize: "11px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {/* ── Left Section ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", marginRight: "8px" }}>
            <div style={{
              width: "22px", height: "22px", borderRadius: "6px",
              background: "linear-gradient(135deg, #3B82F6, #60A5FA)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>VIXOR</span>
          </Link>

          {/* Trade Button (green) */}
          <Link to="/discover" style={{
            background: "#10b981", color: "#fff", fontSize: "10px", fontWeight: 700,
            padding: "3px 10px", borderRadius: "4px", textDecoration: "none",
          }}>Trade</Link>

          {/* Deposit Button (blue) */}
          <Link to="/wallet-web3" style={{
            background: "#3B82F6", color: "#fff", fontSize: "10px", fontWeight: 700,
            padding: "3px 10px", borderRadius: "4px", textDecoration: "none",
          }}>Deposit</Link>

          {/* SOL Price */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, color: solUp ? "#22C55E" : "#EF4444", fontFamily: "monospace" }}>
            <span style={{ color: "#fff" }}>SOL</span>
            {solPrice ? `$${solPrice.toFixed(2)}` : "..."}
            {solChange != null && <span>{solUp ? "+" : ""}{solChange.toFixed(1)}%</span>}
          </div>

          {/* Chain Selector */}
          <button onClick={() => onChainChange(selectedChain === "Solana" ? "Ethereum" : "Solana")} style={{
            display: "flex", alignItems: "center", gap: "4px",
            fontSize: "10px", fontWeight: 600, color: "#60A5FA",
            background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)",
            padding: "2px 8px", borderRadius: "4px", cursor: "pointer",
          }}>
            <span style={{ fontSize: "12px" }}>&#162;</span> {selectedChain}
          </button>

          {/* Divider */}
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />

          {/* Nav Links */}
          {topNavItems.map((item) => {
            const isActive = path === item.to || path.startsWith(item.to + "/");
            return (
              <Link key={item.to} to={item.to} style={{
                fontSize: "11px", fontWeight: 500, color: isActive ? "#60A5FA" : "#7B8BA8",
                background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                padding: "4px 8px", borderRadius: "4px", textDecoration: "none",
                whiteSpace: "nowrap",
              }}>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* ── Right Section ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Search */}
          <div style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", cursor: "pointer", color: "#7B8BA8", fontSize: "13px" }}>
            &#128269;
          </div>
          {/* Star */}
          <div style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", cursor: "pointer", color: "#7B8BA8", fontSize: "13px" }}>
            &#9733;
          </div>
          {/* Notifications */}
          <Link to="/notifications" style={{ position: "relative", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", cursor: "pointer", color: "#7B8BA8", fontSize: "13px", textDecoration: "none" }}>
            &#128276;
            <span style={{ position: "absolute", top: "3px", right: "3px", width: "6px", height: "6px", borderRadius: "50%", background: "#EF4444" }} />
          </Link>
          {/* Wallet */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#7B8BA8", cursor: "pointer" }}>
            <span style={{ fontSize: "13px" }}>&#128179;</span>
            <span style={{ fontWeight: 600, color: "#fff" }}>0</span>
          </div>
          {/* User Avatar */}
          <Link to="/profile" style={{
            width: "26px", height: "26px", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(96,165,250,0.2))",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 800, color: "#fff", textDecoration: "none",
          }}>ME</Link>
        </div>
      </div>
    </header>
  );
});

// ─────────────────────────────────────────────────────────────────
// BOTTOM BAR — exact Axiom.trade layout
// 10 icons | balance | connection | global | links
// ─────────────────────────────────────────────────────────────────

interface BottomBarProps {
  solPrice?: number | null;
  solChange?: number | null;
}

const BottomBar = memo(function BottomBar({ solPrice, solChange }: BottomBarProps) {
  const location = useLocation();
  const path = location.pathname;
  const solUp = (solChange ?? 0) >= 0;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "#121826",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      height: "52px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 6px",
    }}>
      {/* Nav Icons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: "2px" }}>
        {bottomNavItems.map((item) => {
          const isActive = path === item.to || path.startsWith(item.to + "/");
          return (
            <Link key={item.to + item.label} to={item.to} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "4px 5px", borderRadius: "6px", textDecoration: "none",
              opacity: isActive ? 1 : 0.45,
              minWidth: 0,
            }}>
              <span style={{ fontSize: "15px", lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: "8px", fontWeight: 600, marginTop: "2px", letterSpacing: "0.01em",
                color: isActive ? "#60A5FA" : "#7B8BA8",
              }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: SOL + Links */}
      <div style={{
        display: "none",
        alignItems: "center",
        gap: "8px",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        marginLeft: "6px",
        paddingLeft: "10px",
      }}
      className="md:!flex"
      >
        <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", color: solUp ? "#22C55E" : "#EF4444" }}>
          SOL {solPrice ? `$${solPrice.toFixed(2)}` : "..."} GLOBAL
        </span>
        <a href="#" style={{ fontSize: "10px", color: "#7B8BA8", textDecoration: "none" }}>Discord</a>
        <a href="#" style={{ fontSize: "10px", color: "#7B8BA8", textDecoration: "none" }}>X</a>
        <a href="#" style={{ fontSize: "10px", color: "#7B8BA8", textDecoration: "none" }}>Docs</a>
      </div>
    </nav>
  );
});