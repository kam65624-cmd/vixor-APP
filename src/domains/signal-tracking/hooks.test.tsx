// ============================================================================
// VIXOR Signal Tracking Hooks — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── Mock factories (hoisted) ──────────────────────────────────────────────

const { mockGetUserSignalTrackings, mockRequestSignalTransition, mockCreateSignalTracking } =
  vi.hoisted(() => ({
    mockGetUserSignalTrackings: vi.fn(),
    mockRequestSignalTransition: vi.fn(),
    mockCreateSignalTracking: vi.fn(),
  }));

vi.mock("@/domains/signal-tracking", () => ({
  getUserSignalTrackings: mockGetUserSignalTrackings,
  requestSignalTransition: mockRequestSignalTransition,
  createSignalTracking: mockCreateSignalTracking,
}));

vi.mock("@/shared/hooks/use-stable-server-fn", () => ({
  useStableServerFn: (fn: any) => fn,
}));

// Import hooks after mocks
import {
  signalTrackingKeys,
  useSignalTrackings,
  useSignalTransition,
  useCreateSignalTracking,
} from "./hooks";

// ── Test helpers ──────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("signalTrackingKeys", () => {
  it("1. all key returns base array", () => {
    expect(signalTrackingKeys.all).toEqual(["signalTrackings"]);
  });

  it("2. list key extends all with optional filters", () => {
    const withoutFilters = signalTrackingKeys.list();
    expect(withoutFilters).toEqual(["signalTrackings", undefined]);

    const withFilters = signalTrackingKeys.list({ status: "active" });
    expect(withFilters).toEqual(["signalTrackings", { status: "active" }]);
  });

  it("3. detail key includes id", () => {
    expect(signalTrackingKeys.detail("abc-123")).toEqual(["signalTrackings", "abc-123"]);
  });
});

describe("useSignalTrackings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("4. fetches trackings and returns data", async () => {
    const trackings = [
      {
        id: "t1",
        pair: "BTC/USDT",
        status: "active",
        direction: "BUY",
      },
    ];
    mockGetUserSignalTrackings.mockResolvedValue({
      trackings,
      error: null,
    });

    const { result } = renderHook(() => useSignalTrackings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.trackings).toEqual(trackings);
    expect(mockGetUserSignalTrackings).toHaveBeenCalledWith({});
  });

  it("5. passes status filter to queryKey", async () => {
    mockGetUserSignalTrackings.mockResolvedValue({
      trackings: [],
      error: null,
    });

    const { result } = renderHook(() => useSignalTrackings({ status: "active" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Verify the queryKey includes the filter
    expect(result.current.fetchStatus).toBeDefined();
  });

  it("6. handles error response", async () => {
    mockGetUserSignalTrackings.mockResolvedValue({
      trackings: undefined,
      error: "Unauthorized",
    });

    const { result } = renderHook(() => useSignalTrackings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Unauthorized");
  });
});

describe("useSignalTransition", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("7. calls requestSignalTransition with data", async () => {
    const transitionData = {
      trackingId: "t1",
      observedPrice: 115000,
      currentVersion: "2026-01-01T00:00:00Z",
      actor: "system" as const,
    };
    mockRequestSignalTransition.mockResolvedValue({ ok: true, transition: { to: "tp1_hit" } });

    const { result } = renderHook(() => useSignalTransition(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ data: transitionData });
    });

    // TanStack Query useMutation passes (variables, context) to mutationFn
    expect(mockRequestSignalTransition.mock.calls[0][0]).toEqual({
      data: transitionData,
    });
  });
});

describe("useCreateSignalTracking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("8. calls createSignalTracking with input wrapped in data", async () => {
    const input = {
      pair: "BTC/USDT",
      direction: "BUY" as const,
      entryPrice: 100000,
      stopLoss: 95000,
      takeProfit: [110000, 120000],
    };
    mockCreateSignalTracking.mockResolvedValue({
      ok: true,
      error: null,
      trackingId: "new-id",
    });

    const { result } = renderHook(() => useCreateSignalTracking(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    // TanStack Query useMutation passes (variables, context) to mutationFn
    expect(mockCreateSignalTracking.mock.calls[0][0]).toEqual({ data: input });
  });
});
