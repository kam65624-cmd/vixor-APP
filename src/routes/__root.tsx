import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback, type ReactNode, Component, type ErrorInfo } from "react";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/vixor/AppShell";
import { wasRenderLoopDetected, getRenderLoopComponent, clearRenderLoopFlag } from "@/hooks/use-render-guard";
import { I18nProvider } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="size-16 rounded-2xl bg-bearish/10 flex items-center justify-center mx-auto mb-4">
          <svg className="size-8 text-bearish" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message?.includes("#310") || wasRenderLoopDetected()
            ? `A rendering loop was detected${wasRenderLoopDetected() ? ` in ${getRenderLoopComponent()}` : ""}. This has been automatically resolved.`
            : error?.message ?? "An unexpected error occurred."}
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-95 transition-transform"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-card-hover transition-colors"
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
      { name: "theme-color", content: "#08090C" },
      { title: "Vixor — AI Chart Analysis" },
      { name: "description", content: "AI-powered chart analysis for traders. Get entry, stop loss, and take profit levels in seconds." },
      { property: "og:title", content: "Vixor — AI Chart Analysis" },
      { property: "og:description", content: "Drop any chart, get an AI trade plan with confidence score, risk, and management in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ src: "https://telegram.org/js/telegram-web-app.js" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: undefined,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
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
    const tg = (window as unknown as { Telegram?: { WebApp?: { ready: () => void; expand: () => void; setHeaderColor?: (c: string) => void } } }).Telegram?.WebApp;
    if (tg) {
      try { tg.ready(); tg.expand(); tg.setHeaderColor?.("#08090C"); } catch { /* noop */ }
    }
    let mounted = true;
    let authDebounce: ReturnType<typeof setTimeout> | null = null;
    let lastAuthEvent = "";
    let lastAuthTime = 0;

    import("@/integrations/supabase/client").then(({ supabase }) => {
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
      (window as unknown as { __vxAuthSub?: { unsubscribe(): void } }).__vxAuthSub = sub.subscription;
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
        <GlobalErrorBoundary onReset={handleErrorReset}>
          <AppShell>
            <Outlet />
          </AppShell>
        </GlobalErrorBoundary>
      </I18nProvider>
    </QueryClientProvider>
  );
}
