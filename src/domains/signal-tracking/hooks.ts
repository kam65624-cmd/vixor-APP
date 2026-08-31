// ============================================================================
// VIXOR Signal Tracking — TanStack Query Hooks
// ============================================================================
// Provides useQuery/useMutation wrappers around signal-tracking server functions.
// Follows the project pattern: useStableServerFn + useQuery/useMutation.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  getUserSignalTrackings,
  requestSignalTransition,
  createSignalTracking,
  type CreateSignalTrackingInput,
} from "@/domains/signal-tracking";

// ── Query Key Factory ──────────────────────────────────────────────────────

/** Query key factory for signal tracking */
export const signalTrackingKeys = {
  all: ["signalTrackings"] as const,
  list: (filters?: { status?: string }) => [...signalTrackingKeys.all, filters] as const,
  detail: (id: string) => [...signalTrackingKeys.all, id] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Fetch user's signal trackings */
export function useSignalTrackings(filters?: { status?: string }) {
  const fetchTrackings = useStableServerFn(getUserSignalTrackings);

  return useQuery({
    queryKey: signalTrackingKeys.list(filters),
    queryFn: async () => {
      const res = await fetchTrackings({});
      if (res.error) throw new Error(res.error);
      return res;
    },
    staleTime: 30_000,
  });
}

/** Request a signal transition */
export function useSignalTransition() {
  const queryClient = useQueryClient();
  const transitionFn = useStableServerFn(requestSignalTransition);

  return useMutation({
    mutationFn: transitionFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signalTrackingKeys.all });
    },
  });
}

/** Create a new signal tracking */
export function useCreateSignalTracking() {
  const queryClient = useQueryClient();
  const createFn = useStableServerFn(createSignalTracking);

  return useMutation({
    mutationFn: (input: CreateSignalTrackingInput) => createFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signalTrackingKeys.all });
    },
  });
}
