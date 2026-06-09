---
Task ID: 1
Agent: Main
Task: Fix React error #310 and analysis data mismatch

Work Log:
- Diagnosed React error #310 root causes: (a) 6 components still using useServerFn directly, (b) auth state change cascade loop in __root.tsx, (c) _authenticated/route.tsx using getUser() which triggers token refresh loops
- Replaced all direct useServerFn calls with useStableServerFn in: discover.tsx, profile.tsx, premium.tsx, referral.tsx, journal.tsx, auth.tsx
- Improved useStableServerFn hook to use lazy ref pattern instead of useCallback for guaranteed single-instance stability
- Fixed __root.tsx auth state change handler: removed router.invalidate() which caused infinite loop (getUser() → token refresh → auth event → router.invalidate() → getUser() → loop), replaced with targeted queryClient invalidation only
- Added 2-second deduplication for identical auth events
- Fixed _authenticated/route.tsx: replaced getUser() with getSession() to avoid network call / token refresh on every route navigation
- Fixed analysis data mismatch: createAnalysis now fetches real OHLCV data from Binance (crypto) and TwelveData (forex/commodity) before running local analysis engine, instead of using generateOHLCV() fake data
- Added fetchTwelveDataKlines function to price-fetcher.server.ts for forex pair OHLCV data
- Updated generateDailySignals to also try TwelveData for non-crypto pairs
- TypeScript compilation passes with zero errors

Stage Summary:
- React error #310 should now be fully resolved - all useServerFn calls wrapped, auth cascade loop broken
- Analysis results now use REAL market data from Binance/TwelveData instead of fake generated data
- Key files modified: discover.tsx, profile.tsx, premium.tsx, referral.tsx, journal.tsx, auth.tsx, __root.tsx, _authenticated/route.tsx, use-stable-server-fn.ts, vixor.functions.ts, run-analysis.server.ts, price-fetcher.server.ts
