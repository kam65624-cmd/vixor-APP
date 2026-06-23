import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  Component,
  type ErrorInfo,
} from "react";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/vixor/AppShell";
import { WalletProvider } from "@/domains/wallet/adapter";
import {
  wasRenderLoopDetected,
  getRenderLoopComponent,
  clearRenderLoopFlag,
} from "@/shared/hooks/use-render-guard";
import { I18nProvider } from "@/shared/i18n";

function NotFoundComponent() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#121212", padding: "16px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "72px", fontWeight: 800, color: "#10B981" }}>404</div>
        <h2 style={{ marginTop: "16px", fontSize: "20px", fontWeight: 600, color: "#FFFFFF" }}>Page not found</h2>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#9CA3AF" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          style={{ marginTop: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "#10B981", padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: "#fff", textDecoration: "none" }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Error Boundary Component ──
// Using a class component so we can catch errors with getDerivedStateFromError
// and properly reset without causing React #310
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Vixor] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    clearRenderLoopFlag();
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorView error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

function ErrorView({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#121212", padding: "16px" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#FFFFFF" }}>Something went wrong</h1>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#9CA3AF" }}>
          {error?.message?.includes("#310") || wasRenderLoopDetected()
            ? `A rendering loop was detected${wasRenderLoopDetected() ? ` in ${getRenderLoopComponent()}` : ""}. This has been automatically resolved.`
            : (error?.message ?? "An unexpected error occurred.")}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
          <button
            onClick={onReset}
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#10B981", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          <Link
            to="/"
            style={{ padding: "10px 24px", borderRadius: "8px", background: "#1a2035", border: "1px solid rgba(255,255,255,0.06)", color: "#FFFFFF", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#121212" },
      { title: "Vixor — Solana Meme Coin Trading Terminal" },
      {
        name: "description",
        content:
          "AI-powered Solana meme coin trading terminal. Discover tokens, track whales, and trade with confidence.",
      },
      { property: "og:title", content: "Vixor — Solana Meme Coin Trading Terminal" },
      {
        property: "og:description",
        content:
          "AI-powered Solana meme coin trading terminal. Discover tokens, track whales, and trade with confidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'%3E%3Crect width='32' height='32' rx='8' fill='%2308090C'/%3E%3Cpath d='M6 6v20h20' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M11 18l4-4 4 4 5-5' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
      },
      { rel: "alternate icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
    scripts: [
      // Telegram WebApp SDK
      { src: "https://telegram.org/js/telegram-web-app.js" },
      // ── Theme bootstrap (runs before paint to prevent FOUC) ──
      // Reads the user's saved theme from localStorage and applies the
      // .dark / .light class to <html> BEFORE the first paint. Defaults
      // to dark if no preference is stored.
      {
        innerHTML: `(function(){try{var t=localStorage.getItem('vixor-theme')||'dark';var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('light',!d);}catch(e){document.documentElement.classList.add('dark');}})();`,
        type: "text/javascript",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: undefined,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        {/* ── Theme bootstrap (runs before paint to prevent FOUC) ──
            Reads the user's saved theme from localStorage and applies the
            .dark / .light class to <html> BEFORE the first paint. Defaults
            to dark if no preference is stored. Must be inline in JSX so
            TanStack Start renders it as a real <script> tag in the SSR
            output (scripts[] in document() head config does not always
            emit innerHTML entries). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vixor-theme')||'dark';var d=t==='dark';document.documentElement.classList.toggle('dark',d);document.documentElement.classList.toggle('light',!d);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // ── React #310 FIX: Removed useRouter() ──
  // useRouter() internally calls useStore(router.__store) which subscribes
  // to ALL router state changes. Since RootComponent wraps the ENTIRE app,
  // every router state change caused a full app re-render.
  // Instead, we use useNavigate() for the error reset (which is targeted),
  // and refs for the queryClient and navigate function.
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // ── Auth state change handler ──
  // This is the SINGLE source of truth for auth-triggered query invalidation.
  // It does NOT call router.invalidate() which causes cascading re-renders.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Boot Telegram WebApp if present
    const tg = (
      window as unknown as {
        Telegram?: {
          WebApp?: {
            ready: () => void;
            expand: () => void;
            setHeaderColor?: (c: string) => void;
            setBackgroundColor?: (c: string) => void;
            disableVerticalSwipes?: () => void;
            enableClosingConfirmation?: () => void;
            BackButton?: { hide: () => void };
            SettingsButton?: { hide: () => void };
            MainButton?: { hide: () => void };
          };
        };
      }
    ).Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.("#121212");
        tg.setBackgroundColor?.("#121212");
        tg.disableVerticalSwipes?.();
        // Hide all Telegram chrome that competes with our own header / nav.
        // The screenshot showed a "Close" button and a menu icon — these are
        // Telegram's BackButton and SettingsButton. Hiding them gives us a
        // clean full-screen app surface.
        tg.BackButton?.hide?.();
        tg.SettingsButton?.hide?.();
        tg.MainButton?.hide?.();
      } catch {
        /* noop */
      }
    }
    let mounted = true;
    let authDebounce: ReturnType<typeof setTimeout> | null = null;
    let lastAuthEvent = "";
    let lastAuthTime = 0;

    import("@/shared/supabase/client").then(({ supabase }) => {
      if (!mounted) return;
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;

        // ── React error #310 prevention ──
        // 1. Deduplicate rapid identical auth events within 2 seconds
        const now = Date.now();
        if (event === lastAuthEvent && now - lastAuthTime < 2000) return;
        lastAuthEvent = event;
        lastAuthTime = now;

        // 2. Debounce remaining events (500ms) to prevent cascading re-renders.
        if (authDebounce) clearTimeout(authDebounce);
        authDebounce = setTimeout(() => {
          if (!mounted) return;

          // Only invalidate auth-dependent queries — NOT router.invalidate()
          if (event === "SIGNED_OUT") {
            queryClientRef.current.removeQueries({ queryKey: ["me"] });
            queryClientRef.current.removeQueries({ queryKey: ["analyses"] });
            queryClientRef.current.removeQueries({ queryKey: ["alerts"] });
            queryClientRef.current.removeQueries({ queryKey: ["alerts-dashboard"] });
            queryClientRef.current.removeQueries({ queryKey: ["daily-signals"] });
            queryClientRef.current.removeQueries({ queryKey: ["user-strategy"] });
            queryClientRef.current.removeQueries({ queryKey: ["notifs"] });
            // Navigate to auth page on sign out
            navigateRef.current({ to: "/auth" });
          } else {
            // On sign in / user update, only refetch profile data
            queryClientRef.current.invalidateQueries({ queryKey: ["me"] });
          }
        }, 500);
      });
      (window as unknown as { __vxAuthSub?: { unsubscribe(): void } }).__vxAuthSub =
        sub.subscription;
    });
    return () => {
      mounted = false;
      if (authDebounce) clearTimeout(authDebounce);
    };
  }, []);

  // Reset function for the error boundary — clears ALL query cache and navigates to home
  // to break any render loops. This prevents the #310 loop from restarting immediately
  // after the user clicks "Try again".
  const handleErrorReset = useCallback(() => {
    // Clear all cached query data to prevent stale state from re-triggering loops
    queryClientRef.current.clear();
    // Use replace to avoid building up history entries
    navigateRef.current({ to: "/", replace: true });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <WalletProvider>
          <GlobalErrorBoundary onReset={handleErrorReset}>
            <AppShell>
              <Outlet />
            </AppShell>
          </GlobalErrorBoundary>
        </WalletProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
