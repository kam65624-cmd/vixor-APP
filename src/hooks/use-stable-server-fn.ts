// ============================================================================
// useStableServerFn — Stabilizes TanStack Start server function references
// ============================================================================
//
// React error #310 ("Too many re-renders") is caused by useServerFn() returning
// a new function reference on every render. When used directly as a queryFn or
// mutationFn, this creates an infinite loop:
//
//   render → new fn ref → new queryFn → re-fetch → new data → re-render → loop
//
// This hook wraps useServerFn with a stable function reference that never changes,
// breaking the cycle. It replaces the repetitive useRef + useCallback pattern
// used throughout the codebase.
//
// Usage:
//   const fetchMe = useStableServerFn(getMe);
//   const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
//
// Or with arguments:
//   const fetchAnalysis = useStableServerFn(getAnalysis);
//   const q = useQuery({
//     queryKey: ["analysis", id],
//     queryFn: () => fetchAnalysis({ data: { id } }),
//   });
// ============================================================================

import { useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyServerFn = (...args: any[]) => any;

/**
 * Returns a stable function reference that wraps useServerFn.
 * The returned function never changes identity across re-renders,
 * preventing React error #310 (infinite re-render loop).
 */
export function useStableServerFn<T extends AnyServerFn>(fn: T): T {
  const serverFn = useServerFn(fn);
  const ref = useRef(serverFn);
  ref.current = serverFn;

  // Create a single stable function that always delegates to the latest ref.
  // The type assertion is safe because the returned function has the same
  // call signature as the input server function.
  const stableFn = useCallback(
    ((...args: Parameters<T>) => ref.current(...args)) as unknown as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return stableFn;
}
