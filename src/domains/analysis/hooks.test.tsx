// ============================================================================
// VIXOR Analysis Hooks — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── Mock factories (hoisted) ──────────────────────────────────────────────

const { mockGetAnalysis, mockCreateAnalysis, mockScanOpportunities } = vi.hoisted(() => ({
  mockGetAnalysis: vi.fn(),
  mockCreateAnalysis: vi.fn(),
  mockScanOpportunities: vi.fn(),
}));

vi.mock("@/domains/analysis", () => ({
  getAnalysis: mockGetAnalysis,
  createAnalysis: mockCreateAnalysis,
  scanOpportunities: mockScanOpportunities,
}));

vi.mock("@/shared/hooks/use-stable-server-fn", () => ({
  useStableServerFn: (fn: any) => fn,
}));

// Import hooks after mocks
import { analysisKeys, useAnalysis, useCreateAnalysis, useScanOpportunities } from "./hooks";

// ── Test helpers ──────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("analysisKeys", () => {
  it("1. all key returns base array", () => {
    expect(analysisKeys.all).toEqual(["analyses"]);
  });

  it("2. list key extends all", () => {
    expect(analysisKeys.list()).toEqual(["analyses"]);
  });

  it("3. detail key includes id", () => {
    expect(analysisKeys.detail("abc-123")).toEqual(["analyses", "abc-123"]);
  });
});

describe("useAnalysis", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("4. fetches and returns analysis by id", async () => {
    const analysis = {
      id: "a1",
      pair: "BTC/USDT",
      timeframe: "1H",
      trend: "bullish",
      recommendation: "BUY",
      confidence: 78,
      status: "complete",
    };
    mockGetAnalysis.mockResolvedValue(analysis);

    const { result } = renderHook(() => useAnalysis("a1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(analysis);
    expect(mockGetAnalysis).toHaveBeenCalledWith({ data: { id: "a1" } });
  });

  it("5. is disabled when id is empty", () => {
    mockGetAnalysis.mockResolvedValue(null);

    const { result } = renderHook(() => useAnalysis(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetAnalysis).not.toHaveBeenCalled();
  });
});

describe("useCreateAnalysis", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("6. calls createAnalysis with input data", async () => {
    mockCreateAnalysis.mockResolvedValue({ id: "new-analysis-id" });

    const { result } = renderHook(() => useCreateAnalysis(), {
      wrapper: createWrapper(),
    });

    const input = {
      imageBase64: "iVBOR...",
      mimeType: "image/png",
      selectedPair: "BTC/USDT",
    };

    await act(async () => {
      await result.current.mutateAsync({ data: input });
    });

    // TanStack Query useMutation passes (variables, context) to mutationFn
    expect(mockCreateAnalysis.mock.calls[0][0]).toEqual({ data: input });
  });
});

describe("useScanOpportunities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("7. calls scanOpportunities and returns results", async () => {
    const scanResult = {
      opportunities: [{ pair: "BTC/USDT", confidence: 82, recommendation: "BUY" }],
      scanned: 16,
      total: 1,
    };
    mockScanOpportunities.mockResolvedValue(scanResult);

    const { result } = renderHook(() => useScanOpportunities(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({});
    });

    // TanStack Query useMutation passes (variables, context) to mutationFn
    expect(mockScanOpportunities.mock.calls[0][0]).toEqual({});
    expect(mockScanOpportunities).toHaveBeenCalled();
  });
});
