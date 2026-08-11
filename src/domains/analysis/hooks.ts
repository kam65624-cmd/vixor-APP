// ============================================================================
// VIXOR Analysis — TanStack Query Hooks
// ============================================================================
// Provides useQuery/useMutation wrappers around analysis server functions.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getAnalysis, createAnalysis, scanOpportunities } from "@/domains/analysis";

// ── Query Key Factory ──────────────────────────────────────────────────────

/** Query key factory for analyses */
export const analysisKeys = {
  all: ["analyses"] as const,
  list: () => [...analysisKeys.all] as const,
  detail: (id: string) => [...analysisKeys.all, id] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Fetch a single analysis by ID */
export function useAnalysis(id: string) {
  const fetchAnalysis = useStableServerFn(getAnalysis);

  return useQuery({
    queryKey: analysisKeys.detail(id),
    queryFn: () => fetchAnalysis({ data: { id } }),
    staleTime: 5 * 60_000,
    enabled: !!id,
  });
}

/** Create a new analysis */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  const createFn = useStableServerFn(createAnalysis);

  return useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.all });
    },
  });
}

/** Scan for trading opportunities across popular pairs */
export function useScanOpportunities() {
  const scanFn = useStableServerFn(scanOpportunities);

  return useMutation({
    mutationFn: scanFn,
  });
}
