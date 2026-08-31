import { useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";

import { getTelegramInitData } from "@/shared/telegram";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";
import { useWallet } from "@/domains/wallet/adapter/WalletProvider";
import { WalletProviderSelector } from "@/domains/wallet/adapter/WalletProviderSelector";
import { useOnline } from "@/shared/hooks/use-online";
import { FloatingCopilot } from "@/components/vixor/FloatingCopilot";
import { DynamicDock } from "@/components/vixor/layout/BottomNav/DynamicDock";

import { TopNav } from "./TopNav";
import { dockItems } from "./BottomBar";
import { moreNavCategories } from "./MorePanel";

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
  import("../OnboardingModal").then((m) => ({ default: m.OnboardingModal })),
);

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
  const [showWalletModal, setShowWalletModal] = useState(false);
  const sol = useSolPrice();
  const isTg = useIsTelegram();
  const { wallet } = useWallet();
  const { isOnline } = useOnline();

  const signedIn = path !== "/auth";

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
            color: "var(--color-bearish)",
            background: "var(--bearish-bg)",
            borderBottom: "1px solid var(--bearish-bg)",
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
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div key={path} className="vixor-page-enter">
          {children}
        </div>
      </main>

      {/* ── Dynamic Dock ── */}
      <DynamicDock items={dockItems} moreCategories={moreNavCategories} isTg={isTg} />

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal onClose={closeOnboarding} />
        </Suspense>
      )}

      {/* ── MOXI Floating Orb (global) ── */}
      <FloatingCopilot />
      {showWalletModal && (
        <div
          onClick={() => setShowWalletModal(false)}
          className="fixed inset-0 z-[200] flex items-end justify-center animate-fadeIn"
          style={{
            background: "var(--overlay)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] max-h-[80vh] overflow-y-auto animate-slideUp rounded-t-3xl"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              borderTop: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-floating)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--handle-bar)" }} />
            </div>
            {/* Header ── V6 refined */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "var(--primary-bg)",
                    border: "1px solid var(--primary-border)",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[14px] font-bold text-foreground">Connect Wallet</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Choose a provider to continue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--surface-elevated)] border border-[var(--color-border)] text-muted-foreground hover:text-foreground hover:border-[var(--border-hover)] transition-all cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            {/* Provider selector */}
            <div className="p-4">
              <WalletProviderSelector />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
