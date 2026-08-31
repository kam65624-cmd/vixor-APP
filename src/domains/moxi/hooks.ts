// ============================================================================
// MOXI — TanStack Query Hooks
// ============================================================================
// Provides useQuery/useMutation wrappers around MOXI server functions.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMoxiPersonaFn, updateMoxiPersonaFn, getMoxiInsights, askMoxi } from "@/domains/moxi";
import type { MoxiPersona } from "@/domains/moxi";

// ── Query Key Factory ──────────────────────────────────────────────────────

/** Query key factory for MOXI data */
export const moxiKeys = {
  persona: () => ["moxiPersona"] as const,
  insights: () => ["moxiInsights"] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Fetch user's MOXI persona */
export function useMoxiPersona() {
  const fetchPersona = useStableServerFn(getMoxiPersonaFn);

  return useQuery({
    queryKey: moxiKeys.persona(),
    queryFn: fetchPersona,
    staleTime: 5 * 60_000,
  });
}

/** Update user's MOXI persona */
export function useUpdateMoxiPersona() {
  const queryClient = useQueryClient();
  const updateFn = useStableServerFn(updateMoxiPersonaFn);

  return useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moxiKeys.persona() });
    },
  });
}

/** Fetch MOXI proactive insights */
export function useMoxiInsights() {
  const fetchInsights = useStableServerFn(getMoxiInsights);

  return useQuery({
    queryKey: moxiKeys.insights(),
    queryFn: fetchInsights,
    staleTime: 2 * 60_000,
    refetchInterval: 2 * 60_000,
  });
}

/** Ask MOXI a question */
export function useAskMoxi() {
  const askFn = useStableServerFn(askMoxi);

  return useMutation({
    mutationFn: askFn,
  });
}
