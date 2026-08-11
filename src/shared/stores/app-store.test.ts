// ============================================================================
// VIXOR App Store — Unit Tests
// ============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./app-store";

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.getState().reset();
  });

  it("1. starts with correct initial state", () => {
    const state = useAppStore.getState();
    expect(state.sidebarOpen).toBe(false);
    expect(state.activePair).toBeNull();
    expect(state.notificationPanelOpen).toBe(false);
    expect(state.copilotOpen).toBe(false);
  });

  it("2. toggleSidebar flips the sidebar state", () => {
    const { toggleSidebar } = useAppStore.getState();

    toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(true);

    toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it("3. setSidebarOpen sets an explicit value", () => {
    const { setSidebarOpen } = useAppStore.getState();

    setSidebarOpen(true);
    expect(useAppStore.getState().sidebarOpen).toBe(true);

    setSidebarOpen(false);
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it("4. setActivePair stores and clears the active pair", () => {
    const { setActivePair } = useAppStore.getState();

    setActivePair("BTC/USDT");
    expect(useAppStore.getState().activePair).toBe("BTC/USDT");

    setActivePair(null);
    expect(useAppStore.getState().activePair).toBeNull();
  });

  it("5. copilot toggle and set work correctly", () => {
    const { toggleCopilot, setCopilotOpen } = useAppStore.getState();

    toggleCopilot();
    expect(useAppStore.getState().copilotOpen).toBe(true);

    setCopilotOpen(false);
    expect(useAppStore.getState().copilotOpen).toBe(false);

    toggleCopilot();
    expect(useAppStore.getState().copilotOpen).toBe(true);
  });

  it("6. notification panel open/close", () => {
    const { setNotificationPanelOpen } = useAppStore.getState();

    setNotificationPanelOpen(true);
    expect(useAppStore.getState().notificationPanelOpen).toBe(true);

    setNotificationPanelOpen(false);
    expect(useAppStore.getState().notificationPanelOpen).toBe(false);
  });

  it("7. reset returns everything to initial state", () => {
    const { toggleSidebar, setActivePair, toggleCopilot, setNotificationPanelOpen, reset } =
      useAppStore.getState();

    // Mutate everything
    toggleSidebar();
    setActivePair("ETH/USDT");
    toggleCopilot();
    setNotificationPanelOpen(true);

    // Verify mutated
    expect(useAppStore.getState().sidebarOpen).toBe(true);
    expect(useAppStore.getState().activePair).toBe("ETH/USDT");
    expect(useAppStore.getState().copilotOpen).toBe(true);
    expect(useAppStore.getState().notificationPanelOpen).toBe(true);

    // Reset
    reset();

    const state = useAppStore.getState();
    expect(state.sidebarOpen).toBe(false);
    expect(state.activePair).toBeNull();
    expect(state.copilotOpen).toBe(false);
    expect(state.notificationPanelOpen).toBe(false);
  });
});
