// ============================================================================
// useStableServerFn — Stabilizes TanStack Start server function references
// ============================================================================
//
// CRITICAL FIX for React error #310 ("Too many re-renders"):
//
// The original implementation used `useServerFn()` from @tanstack/react-start,
// which internally calls `useRouter()`. This subscribes every component that
// uses a server function to router state changes. When multiple components
// subscribe via useRouter(), ANY router state change (auth events, navigation,
// query invalidation) causes ALL of them to re-render simultaneously, creating
// a cascade that triggers React's infinite re-render protection (#310).
//
// The fix: Call server functions directly. In TanStack Start, server functions
// created with `createServerFn` compile to RPC stubs on the client. They are
// stable module-level references that can be called directly without the hook.
// This eliminates the `useRouter()` subscription entirely.
//
// We still use a stable ref wrapper to ensure the function identity never
// changes across re-renders, which prevents React Query from seeing a new
// queryFn reference (even though RQ doesn't refetch on queryFn change, a
// stable reference is best practice).
//
// Note: We intentionally do NOT use `useServerFn()` because:
// 1. It adds redirect handling we don't need (our server functions return data, not redirects)
// 2. It calls `useRouter()` which subscribes to ALL router state changes
// 3. Each subscription triggers re-renders on every router state change
// ============================================================================

import { useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyServerFn = (...args: any[]) => any;

/**
 * Returns a stable function reference that wraps a TanStack Start server function.
 * The returned function never changes identity across re-renders,
 * preventing React error #310 (infinite re-render loop).
 *
 * This does NOT use `useServerFn` from @tanstack/react-start to avoid
 * the internal `useRouter()` subscription that causes cascading re-renders.
 */
export function useStableServerFn<T extends AnyServerFn>(fn: T): T {
  // Store the latest server function in a ref so the wrapper always calls the current version
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // Create a single stable wrapper function that never changes identity.
  // We use a lazy ref pattern to ensure the function is created only once,
  // even across strict-mode double-renders.
  const stableRef = useRef<((...args: Parameters<T>) => ReturnType<T>) | null>(null);
  if (!stableRef.current) {
    stableRef.current = (...args: Parameters<T>) => fnRef.current(...args);
  }

  return stableRef.current as unknown as T;
}
