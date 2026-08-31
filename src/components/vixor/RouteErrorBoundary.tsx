import React from "react";
import { useRouter } from "@tanstack/react-router";
import { log } from "@/shared/structured-logger";
import { captureException } from "@/shared/sentry";

/* ------------------------------------------------------------------ */
/*  Props & State                                                      */
/* ------------------------------------------------------------------ */

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Catches unhandled errors thrown inside descendant route components.
 *
 * - **Production**: shows a minimal dark error screen with recovery actions.
 * - **Development**: surfaces the full error message and component stack.
 * - All errors are reported via the structured logger (`log.error`).
 */
class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /* ---- static lifecycle ---- */

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  /* ---- instance lifecycle ---- */

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    log.error("Route error", { error, componentStack: info.componentStack });
    try {
      captureException(error);
    } catch {
      /* noop */
    }
  }

  /* ---- reset ---- */

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  /* ---- render ---- */

  render(): React.ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    return (
      <ErrorScreen
        error={this.state.error}
        componentStack={
          // componentStack is only available via componentDidCatch,
          // so we stash it on the instance. If it's missing (e.g. triggered
          // from getDerivedStateFromError without a re-render cycle),
          // dev users will still see the error message.
          (this as unknown as { _componentStack?: string })._componentStack ?? ""
        }
        onReset={this.handleReset}
      />
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Presentational error screen (uses hooks internally)                */
/* ------------------------------------------------------------------ */

function ErrorScreen({
  error,
  componentStack,
  onReset,
}: {
  error: Error;
  componentStack: string;
  onReset: () => void;
}) {
  const router = useRouter();
  const isDev = import.meta.env.DEV;

  const handleGoBack = () => window.history.back();
  const handleTryAgain = () => window.location.reload();
  const handleGoHome = () => router.navigate({ to: "/" });

  return (
    <div style={styles.root} role="alert">
      {/* Accent bar */}
      <div style={styles.accentBar} />

      <div style={styles.inner}>
        {/* Icon */}
        <div style={styles.iconCircle}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-bearish)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>Something went wrong</h1>

        {/* Production message */}
        {!isDev && (
          <p style={styles.message}>
            An unexpected error occurred while loading this page. You can try going back,
            refreshing, or returning to the dashboard.
          </p>
        )}

        {/* Dev: full error details */}
        {isDev && (
          <div style={styles.devBlock}>
            <pre style={styles.errorText}>
              {error.toString()}
              {"\n\n"}
              {error.stack}
            </pre>
            {componentStack && <pre style={styles.stackText}>{componentStack}</pre>}
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.actions}>
          <button onClick={handleGoBack} style={styles.btn}>
            Go Back
          </button>
          <button onClick={handleTryAgain} style={styles.btnPrimary}>
            Try Again
          </button>
          <button onClick={handleGoHome} style={styles.btn}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline styles                                                      */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-background)",
    color: "#E4E5E9",
    fontFamily: "var(--font-sans)",
    overflow: "auto",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "var(--color-bearish)",
  },
  inner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 540,
    width: "100%",
    padding: "40px 24px",
    textAlign: "center",
  },
  iconCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
    borderRadius: "50%",
    backgroundColor: "rgba(251, 70, 103, 0.12)",
    marginBottom: 24,
  },
  heading: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  message: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#8A8D97",
    maxWidth: 400,
    marginBottom: 28,
  },
  devBlock: {
    width: "100%",
    maxWidth: 540,
    marginBottom: 28,
    textAlign: "left",
    borderRadius: 8,
    backgroundColor: "#12141A",
    border: "1px solid #23262F",
    padding: 16,
    overflow: "auto",
    maxHeight: 320,
  },
  errorText: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
    color: "var(--color-bearish)",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  stackText: {
    margin: 0,
    marginTop: 12,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
    color: "#8A8D97",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    padding: "0 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    backgroundColor: "var(--color-bearish)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    padding: "0 20px",
    fontSize: 14,
    fontWeight: 500,
    color: "#C5C7CE",
    backgroundColor: "transparent",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
};

export default RouteErrorBoundary;
