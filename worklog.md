---
Task ID: 2
Agent: Main
Task: Fix React error #310 (Too many re-renders) - comprehensive fix

Work Log:
- Analyzed useServerFn implementation from @tanstack/react-start: it calls useRouter() internally, which subscribes to ALL router state changes. When 5+ components use useStableServerFn (which wraps useServerFn), any router state change triggers ALL of them to re-render simultaneously, creating cascading re-renders that hit React's limit (#310)
- Rewrote useStableServerFn to NOT use useServerFn at all - server functions are callable directly as RPC stubs, no hook needed. This eliminates all useRouter() subscriptions from server function usage
- Fixed AppShell.tsx: added signedInRef to only trigger setSignedIn when the value actually changes (null→true, true→false), preventing unnecessary re-renders from duplicate auth events
- Fixed __root.tsx: replaced functional error component with class-based GlobalErrorBoundary for proper error recovery. Error reset now navigates to home (breaks render loops) instead of just resetting the boundary
- Fixed router.tsx: added structuralSharing: true (reuses object references when data unchanged), refetchOnMount: false, defaultPreload: false to reduce unnecessary re-renders
- Fixed auth.tsx: removed ALL router.invalidate() calls (3 instances) - this was the primary trigger for cascading re-renders. Auth state listener in __root.tsx handles query invalidation
- Added useMemo to all useQuery calls across all pages (analysis, index, signals, charts, notifications, alerts) to prevent re-renders from new object references in query options
- Verified TypeScript compiles with zero errors
- Verified full build succeeds

Stage Summary:
- ROOT CAUSE: useServerFn() internally calls useRouter(), subscribing every component to router state changes. Multiple simultaneous subscriptions + router.invalidate() = cascading re-renders = React #310
- FIX: Eliminated useServerFn entirely, removed all router.invalidate() calls, added structural sharing, memoized query options
- Build passes successfully, ready for deployment
