import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { toast } from "sonner";
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
import { initSentry, captureException } from "@/shared/sentry";
import { initAnalytics } from "@/shared/analytics";
import type { ErrorRouteComponent } from "@tanstack/react-router";
import RouteErrorBoundaryClass from "@/components/vixor/RouteErrorBoundary";

const RouteErrorBoundary: ErrorRouteComponent = (props) => (
  <RouteErrorBoundaryClass
    {...(props as unknown as React.ComponentProps<typeof RouteErrorBoundaryClass>)}
  />
);
import RouteLoading from "@/components/vixor/RouteLoading";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="text-center">
        <div className="text-7xl font-extrabold" style={{ color: "var(--color-primary)" }}>
          404
        </div>
        <h2 className="mt-4 text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
          Page not found
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white no-underline"
          style={{ background: "var(--color-primary)" }}
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
    try {
      captureException(error);
    } catch {
      /* noop */
    }
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
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="mx-auto max-w-sm text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(246,70,93,0.12)" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-destructive)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-foreground)" }}>
          Something went wrong
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          {error?.message?.includes("#310") || wasRenderLoopDetected()
            ? `A rendering loop was detected${wasRenderLoopDetected() ? ` in ${getRenderLoopComponent()}` : ""}. This has been automatically resolved.`
            : (error?.message ?? "An unexpected error occurred.")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onReset}
            className="cursor-pointer rounded-lg border-none px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            Try again
          </button>
          <Link
            to="/"
            className="rounded-lg px-6 py-2.5 text-sm font-semibold no-underline"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
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
      { property: "og:site_name", content: "VIXOR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@vixor_app" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'%3E%3Crect width='32' height='32' rx='8' fill='%23121212'/%3E%3Cpath d='M6 6v20h20' stroke='%2310B981' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M11 18l4-4 4 4 5-5' stroke='%2310B981' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
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
  errorComponent: RouteErrorBoundary,
  pendingComponent: RouteLoading,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
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

  // ── Global React Query error handler ──
  // Subscribes to query cache updates and shows toast errors for failed queries.
  // Rate-limited to prevent toast spam on cascading failures.
  useEffect(() => {
    const queryCache = queryClientRef.current.getQueryCache();
    const lastToast = { key: "", time: 0 };

    const unsub = queryCache.subscribe(
      (event: {
        type: string;
        query?: {
          queryKey: readonly unknown[];
          state: { status: string; error?: Error; fetchStatus: string };
        };
      }) => {
        // Only handle query state updates
        if (event.type !== "updated" || !event.query) return;
        const { queryKey, state } = event.query;

        // Only show toast for actively-fetched queries that errored (skip background/stale errors)
        if (state.status !== "error" || state.fetchStatus !== "idle" || !state.error) return;

        const msg = state.error?.message || "Something went wrong";
        const key = queryKey.join("/");
        const now = Date.now();

        // ── Suppress auth errors from toast — they're handled by auth guard redirect ──
        // Showing "Unauthorized: Invalid token" toasts is confusing when the auth
        // guard will redirect to /auth anyway. These errors are expected when
        // the session expires or is invalid.
        if (
          msg.includes("Unauthorized") ||
          msg.includes("No authorization header") ||
          msg.includes("No token") ||
          msg.includes("Invalid token")
        ) {
          return;
        }

        // Rate-limit: same error key only shows once per 10 seconds
        if (lastToast.key === key && now - lastToast.time < 10_000) return;
        lastToast.key = key;
        lastToast.time = now;

        toast.error(msg);
      },
    );

    return unsub;
  }, []);

  // ── Auth state change handler ──
  // This is the SINGLE source of truth for auth-triggered query invalidation.
  // It does NOT call router.invalidate() which causes cascading re-renders.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // ── Init Sentry & Analytics ──
    initSentry();
    initAnalytics();
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

      const win = window as unknown as { __vxAuthSub?: { unsubscribe(): void } };
      if (win.__vxAuthSub) {
        win.__vxAuthSub.unsubscribe();
        win.__vxAuthSub = undefined;
      }
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
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1A1D24",
                border: "1px solid #2A2D37",
                color: "#E4E5E9",
              },
            }}
          />
        </WalletProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
