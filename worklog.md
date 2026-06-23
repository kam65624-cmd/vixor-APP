---
Task ID: 1
Agent: Main Agent
Task: Comprehensive UI/UX Audit & Fix — All 9 Pages + Full Codebase

Work Log:
- Performed full codebase exploration (39 route files, 49 component files, 13 domain functions)
- Identified 11 critical runtime bugs, 9 old color instances across 12 files, ~40 unused imports
- Fixed SectionTitle label= → title= in 4 pages (yield, predictions, wallet-web3, communities)
- Fixed StatsRow valueColor= → color= in 4 pages (stat colors were all rendering white)
- Fixed EmptyState missing icon/title props in 6 pages (pulse, perpetuals, yield, predictions, wallet-web3, communities)
- Fixed DataRowTwoLine in perpetuals.tsx (was passing children instead of topContent/bottomContent)
- Fixed tab state types (number → string) in wallet-web3, communities
- Fixed StatsRow value types (number → string) in pulse, perpetuals
- Removed invalid 'mono' and 'style' props from components
- Replaced all old colors (#08090C, #6366f1, #1a2035, #1e2438, #2D3748) across 12 files
- Verified ZERO old colors remain in src/ (confirmed with rg count = 0)
- Cleaned ~40 unused imports across 4 files
- Renamed THEME.blue → THEME.accent, THEME.blueDeep → THEME.accentDeep across 10 files
- Fixed all TypeScript errors in 9 main pages (zero errors)
- Git committed (21 files changed, +115/-220 lines) and pushed to trigger Vercel deploy

Stage Summary:
- 21 files modified across 5 phases
- All 9 main pages now have zero TypeScript errors
- Zero old color references in entire src/
- All PageLayout component props are now correctly used
- THEME tokens have accurate naming (accent instead of misleading "blue")
- Deployed to Vercel via git push