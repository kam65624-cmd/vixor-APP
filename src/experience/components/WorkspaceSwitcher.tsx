"use client";

// ============================================================================
// VIXOR Workspace Switcher
// ============================================================================
//
// Allows users to switch between:
//   - Intelligence OS (Bloomberg dark — default)
//   - Web3 Terminal — BullX (green accent, terminal style)
//   - Web3 Terminal — Axiom (blue accent, grid style)
//   - Web3 Terminal — OpenSea (cyan accent, card style)
//
// Integrated into AppShell header. Persists choice in localStorage.
// Color coded: yellow (OS) + cyan (Terminal styles).
// ============================================================================

import { useCallback, useEffect, useState, memo } from "react";
import type { WorkspaceStyle } from "@/experience/styles";
import { getStyleTokens } from "@/experience/styles";

interface WorkspaceSwitcherProps {
  className?: string;
  /** Callback when workspace changes */
  onWorkspaceChange?: (style: WorkspaceStyle) => void;
}

const WORKSPACES: { id: WorkspaceStyle; label: string; shortLabel: string; color: string }[] = [
  { id: "os", label: "Intelligence OS", shortLabel: "OS", color: "#FBBF24" },
  { id: "bullx", label: "BullX Terminal", shortLabel: "BX", color: "#00D4AA" },
  { id: "axiom", label: "Axiom Grid", shortLabel: "AX", color: "#10B981" },
  { id: "opensea", label: "OpenSea", shortLabel: "OS", color: "#2081E2" },
];

export function WorkspaceSwitcher({ className, onWorkspaceChange }: WorkspaceSwitcherProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceStyle>("os");
  const [open, setOpen] = useState(false);

  // ── Restore from localStorage ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("vixor-workspace") as WorkspaceStyle | null;
    if (saved && WORKSPACES.some((w) => w.id === saved)) {
      setActiveWorkspace(saved);
    }
  }, []);

  // ── Apply style tokens to document ──
  useEffect(() => {
    if (typeof document === "undefined") return;
    const tokens = getStyleTokens(activeWorkspace);
    const root = document.documentElement;

    Object.entries(tokens.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });

    // Store workspace class for CSS targeting
    root.classList.remove("ws-bullx", "ws-axiom", "ws-opensea", "ws-os");
    root.classList.add(`ws-${activeWorkspace}`);
  }, [activeWorkspace]);

  const switchWorkspace = useCallback(
    (id: WorkspaceStyle) => {
      setActiveWorkspace(id);
      localStorage.setItem("vixor-workspace", id);
      setOpen(false);
      onWorkspaceChange?.(id);
    },
    [onWorkspaceChange],
  );

  const current = WORKSPACES.find((w) => w.id === activeWorkspace) ?? WORKSPACES[0];
  const isTerminal = activeWorkspace !== "os";

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card border border-border hover:bg-card-hover transition-colors"
        aria-label="Switch workspace"
        aria-expanded={open}
      >
        <span className="size-2 rounded-full" style={{ backgroundColor: current.color }} />
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {current.shortLabel}
        </span>
        <svg
          className={`size-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl bg-card border border-border shadow-[var(--shadow-elevated)] p-1">
            <div className="px-2.5 py-1.5 border-b border-border mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                Workspace
              </p>
            </div>
            {WORKSPACES.map((ws) => (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  activeWorkspace === ws.id
                    ? "bg-accent/10 text-foreground"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
                }`}
              >
                <span
                  className="size-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ws.color }}
                />
                <span className="text-xs font-medium">{ws.label}</span>
                {activeWorkspace === ws.id && (
                  <svg
                    className="size-3.5 ml-auto text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Hook to get the current workspace style anywhere in the component tree.
 */
export function useWorkspace(): {
  workspace: WorkspaceStyle;
  isTerminal: boolean;
  tokens: ReturnType<typeof getStyleTokens>;
} {
  const [workspace] = useState<WorkspaceStyle>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vixor-workspace") as WorkspaceStyle | null;
      if (saved) return saved;
    }
    return "os";
  });

  return {
    workspace,
    isTerminal: workspace !== "os",
    tokens: getStyleTokens(workspace),
  };
}
