---
Task ID: 1
Agent: Main Agent
Task: Fix React error #310 and configure Twelve Data API key

Work Log:
- Diagnosed React #310 root cause: useRouterState() and useRouter() subscribe to ALL router state changes, causing cascade re-renders across the entire component tree
- Fixed AppShell: replaced useRouterState() with useLocation() — only subscribes to location.pathname changes instead of ALL router state
- Fixed Root component: replaced useRouter() with useNavigate() — eliminates root-level subscription to all router state changes
- Fixed Settings page: replaced useRouter() with useNavigate()
- Fixed DiscoverNews: added useMemo for query options (was the only component not using it)
- Added useRenderGuard hook for detecting and diagnosing render loops
- Added render guard to AppShell and CommandCenter (home page) for early detection
- Enhanced ErrorView with render loop component name detection
- Updated .env with real Twelve Data API key: 133b4fe51b964e54acaf88f00d037b95
- Updated twelvedata.server.ts isConfigured() to reject "demo" key
- Verified all TypeScript compilation passes with no errors

Stage Summary:
- React #310 fix: 3 files changed (AppShell, __root__, settings) to remove full router state subscriptions
- API key: Real Twelve Data key configured, replacing "demo"
- Render guard: New hook for detecting infinite render loops with component name identification
- All changes compile cleanly with no TypeScript errors
