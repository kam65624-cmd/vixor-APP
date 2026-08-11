// ============================================================================
// MOXI Hooks — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── Mock factories (hoisted) ──────────────────────────────────────────────

const { mockGetMoxiPersonaFn, mockUpdateMoxiPersonaFn, mockGetMoxiInsights, mockAskMoxi } =
  vi.hoisted(() => ({
    mockGetMoxiPersonaFn: vi.fn(),
    mockUpdateMoxiPersonaFn: vi.fn(),
    mockGetMoxiInsights: vi.fn(),
    mockAskMoxi: vi.fn(),
  }));

vi.mock("@/domains/moxi", () => ({
  getMoxiPersonaFn: mockGetMoxiPersonaFn,
  updateMoxiPersonaFn: mockUpdateMoxiPersonaFn,
  getMoxiInsights: mockGetMoxiInsights,
  askMoxi: mockAskMoxi,
  DEFAULT_MOXI_PERSONA: {
    name: "MOXI",
    personality: "Default",
    expertise: [],
    communicationStyle: "mixed" as const,
    avatarVariant: "default" as const,
    isCustomized: false,
  },
}));

vi.mock("@/shared/hooks/use-stable-server-fn", () => ({
  useStableServerFn: (fn: any) => fn,
}));

// Import hooks after mocks
import {
  moxiKeys,
  useMoxiPersona,
  useUpdateMoxiPersona,
  useMoxiInsights,
  useAskMoxi,
} from "./hooks";
import { DEFAULT_MOXI_PERSONA } from "./types";

// ── Test helpers ──────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("moxiKeys", () => {
  it("1. persona key returns correct array", () => {
    expect(moxiKeys.persona()).toEqual(["moxiPersona"]);
  });

  it("2. insights key returns correct array", () => {
    expect(moxiKeys.insights()).toEqual(["moxiInsights"]);
  });
});

describe("useMoxiPersona", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("3. fetches and returns persona", async () => {
    const persona = { ...DEFAULT_MOXI_PERSONA, name: "BullTrader" };
    mockGetMoxiPersonaFn.mockResolvedValue(persona);

    const { result } = renderHook(() => useMoxiPersona(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(persona);
    expect(mockGetMoxiPersonaFn).toHaveBeenCalled();
  });
});

describe("useUpdateMoxiPersona", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("4. calls update with data and invalidates persona key", async () => {
    const updatedPersona = {
      ...DEFAULT_MOXI_PERSONA,
      name: "CustomName",
      personality: "Aggressive scalper",
    };
    mockUpdateMoxiPersonaFn.mockResolvedValue({
      success: true,
      persona: updatedPersona,
    });

    const { result } = renderHook(() => useUpdateMoxiPersona(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        data: { name: "CustomName", personality: "Aggressive scalper" },
      });
    });

    // TanStack Query useMutation passes (variables, context) to mutationFn
    expect(mockUpdateMoxiPersonaFn.mock.calls[0][0]).toEqual({
      data: { name: "CustomName", personality: "Aggressive scalper" },
    });
  });
});

describe("useMoxiInsights", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("5. fetches and returns insights", async () => {
    const insights = [
      {
        type: "price_alert",
        title: "BTC nearing resistance",
        body: "BTC/USDT is approaching the $110k resistance level.",
        severity: "warning",
        detectedAt: new Date().toISOString(),
      },
    ];
    mockGetMoxiInsights.mockResolvedValue(insights);

    const { result } = renderHook(() => useMoxiInsights(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(insights);
  });
});

describe("useAskMoxi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("6. calls askMoxi with message data", async () => {
    mockAskMoxi.mockResolvedValue({
      response: "BTC looks bullish on the 1H.",
      agent: "moxi",
    });

    const { result } = renderHook(() => useAskMoxi(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        data: { message: "What's BTC doing?" },
      });
    });

    // TanStack Query useMutation passes (variables, context) to mutationFn
    expect(mockAskMoxi.mock.calls[0][0]).toEqual({
      data: { message: "What's BTC doing?" },
    });
  });
});
