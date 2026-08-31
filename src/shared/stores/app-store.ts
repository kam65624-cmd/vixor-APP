// ============================================================================
// VIXOR Global App State — Zustand Store
// ============================================================================
// Lightweight client-side state for UI concerns that don't belong in server state.
// Uses zustand v5 (already installed) with no middleware to keep it minimal.
// ============================================================================

import { create } from "zustand";

interface AppState {
  // ── Sidebar ──
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // ── Active pair (selected across the app) ──
  activePair: string | null;
  setActivePair: (pair: string | null) => void;

  // ── Notification panel ──
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;

  // ── MOXI copilot ──
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;

  // ── Reset ──
  reset: () => void;
}

const INITIAL_STATE = {
  sidebarOpen: false,
  activePair: null,
  notificationPanelOpen: false,
  copilotOpen: false,
} as const;

export const useAppStore = create<AppState>((set) => ({
  ...INITIAL_STATE,

  // ── Sidebar ──
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ── Active pair ──
  setActivePair: (pair) => set({ activePair: pair }),

  // ── Notification panel ──
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),

  // ── MOXI copilot ──
  setCopilotOpen: (open) => set({ copilotOpen: open }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),

  // ── Reset ──
  reset: () => set(INITIAL_STATE),
}));
