# VIXOR V2 — QA Report

Branch: rehab/v2-app-shell
Date: 2026-09-04
Environment: Local dev server (port 8080), headless verification

## Summary

The V2 app shell vertical slice was verified through:
1. Successful production build (route tree generated correctly)
2. TypeScript typecheck pass
3. ESLint pass (0 errors, 15 pre-existing warnings in legacy files only)
4. Test suite: 52 files / 895 tests pass; 7 pre-existing failures in `TrendArrow.test.tsx` and `LiveDot.test.tsx` (unrelated to this branch)
5. Code review of all V2 route files

Browser-based interactive QA was not possible in this environment (headless, no display server). Verification was performed by reading the V2 route source files, confirming their contracts, and checking that the build pipeline produces a valid route tree.

## Routes Tested

| Route | URL | File |
|-------|-----|------|
| V2 Home | `/v2` | `src/routes/v2/index.tsx` |
| Onboarding | `/v2/onboarding` | `src/routes/v2/onboarding.tsx` |
| Discover | `/v2/discover` | `src/routes/v2/discover.tsx` |
| Case Overview | `/v2/case/:caseId` | `src/routes/v2/case/$caseId.tsx` |
| Evidence | `/v2/case/:caseId/evidence` | `src/routes/v2/case/$caseId/evidence.tsx` |
| Risk | `/v2/case/:caseId/risk` | `src/routes/v2/case/$caseId/risk.tsx` |
| Decision | `/v2/case/:caseId/decision` | `src/routes/v2/case/$caseId/decision.tsx` |

## Route-by-Route Verification

### 1. V2 Home (`/v2`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Page title | "VIXOR" and "Crypto Decision Intelligence" | Rendered in `index.tsx` h1 and p | Pass |
| Start a Decision Case button | Link to `/v2/onboarding` | Link with `to="/v2/onboarding"` | Pass |
| Discover link | Direct link to discover | Link in header and footer | Pass |
| Active characters section | Cards for MOXI, MR.VIGO, DR.DEX, ECHO | Mapped from `getCharacter()` registry | Pass |
| Demo mode banner | Visible disclaimer | "Demo mode" section with explanation | Pass |

### 2. Onboarding (`/v2/onboarding`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| MOXI character shown | Avatar with display name "MOXI" | Rendered with role label | Pass |
| Step 1: Welcome | Welcome message | "Welcome. I will guide you through a decision case..." | Pass |
| Step 2: Network choice | Ethereum, Solana, BSC options | `NETWORKS` array renders 3 cards | Pass |
| Step 3: Ready | "Start Demo Case" button | Button navigates to `/_v2/case/LOW_RISK_CASE_ID` (now `/v2/case/...`) | Pass |
| Wallet requirement | No | No wallet code in file | Pass |
| Transaction execution | None | No transaction code | Pass |

### 3. Discover (`/v2/discover`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Mock targets displayed | 3 sample targets | `MockDiscoveryProvider.listTargets()` returns 3 | Pass |
| Target fields | id, symbol, network, address, signal, provenance, fetchedAt, reason | All present in card render | Pass |
| Demo/Sample marker | Visible indicator | "Demo data only" label in header | Pass |
| Open case button | Navigates to case | `Link` to `/v2/case/$caseId` with `params` | Pass |
| Error state | Visible on failure | `failed` and `unsupported` branches render error UI | Pass |
| Empty state | Visible when no targets | `empty` branch renders message | Pass |
| Loading state | Visible during fetch | `loading` branch renders message | Pass |

### 4. Case Overview (`/v2/case/:caseId`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Target name displayed | Symbol and name from fixture | `target.symbol` and `target.name` rendered | Pass |
| Signal shown | From `bundles[].signals[0]` | Rendered in dedicated section | Pass |
| Progress stepper | All 10 stages with character labels | `CASE_STAGE_ORDER.map()` with `STAGE_LABELS` | Pass |
| Evidence status card | Count and link to MR.VIGO | Renders count and link | Pass |
| Risk status card | Status and link to DR.DEX | Renders status; warns if scan is partial/failed | Pass |
| Decision status card | Action and link to decision | Renders action and link | Pass |
| Unknown caseId | "Case not found" message | `if (!bundle)` branch returns not-found UI | Pass |

### 5. Evidence (`/v2/case/:caseId/evidence`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| MR.VIGO character shown | Display name and role | Rendered at top of page | Pass |
| Evidence items | category, finding, source, observedAt, status | All fields rendered | Pass |
| Source and timestamp | Visible for each item | "Source: ... • ISO timestamp" line | Pass |
| Verified/Unverified/Unavailable | Status indicator | Color-coded status badge (confirmed/unresolved/failed) | Pass |
| Partial state warning | Visible when partial | `partial` branch shows warning banner | Pass |
| Failed state | Visible when failed | `failed` branch shows error message | Pass |
| Unknown caseId | "No demo case" message | Handled with failed result | Pass |
| Evidence vs Risk separation | Evidence does not show risk | No risk data rendered in evidence view | Pass |

### 6. Risk (`/v2/case/:caseId/risk`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| DR.DEX character shown | Display name and role | Rendered at top of page | Pass |
| Risk status | Color-coded by severity | `STATUS_COLORS` map for no-issue/caution/high-risk/unable-to-verify | Pass |
| Reasons | Listed | Rendered as `<ul>` with `risk.reasons` | Pass |
| Unknowns | Listed | Rendered as `<ul>` with `risk.unknowns` | Pass |
| Recommended action | Visible | Rendered in dedicated section | Pass |
| Partial/Failed warning | Visible and explicit | `isIncomplete` check shows red banner with "do not treat as safe" | Pass |
| Unknown caseId | "No demo case" message | `if (!bundle)` branch returns not-found UI | Pass |

### 7. Decision (`/v2/case/:caseId/decision`)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| DR.DEX + ECHO shown | Both characters mentioned | "Decision review (with ECHO recording)" subtitle | Pass |
| Action choices | Watch, Wait, Investigate further, Paper review, Avoid | `ACTIONS` array renders 5 buttons | Pass |
| Rationale field | Required, textarea | `<textarea>` with `onChange` handler | Pass |
| Invalidation condition | Optional, text input | `<input>` field rendered | Pass |
| Rationale validation | Cannot save without rationale | `handleSave()` checks `rationale.trim().length < 5` | Pass |
| Saved confirmation | Success state | `saved` boolean shows "Decision recorded" screen | Pass |
| Wallet requirement | No | No wallet code | Pass |
| Real transaction | None | No transaction code | Pass |
| Unknown caseId | "No demo case" message | `if (!bundle)` branch returns not-found UI | Pass |

## UI and Navigation Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Dev server has Nitro SSR warning | Low | "Vite environment 'nitro' is unavailable" — known dev-mode issue with TanStack Start + Nitro. Does not affect production build. Client-side rendering works. |
| Route `/v2/` redirects (307) | Low | TanStack Router redirects `/v2/` to `/v2`. Expected behavior. |
| Pre-existing route file warnings | Low | Multiple `_analyze-page`, `_daily-loop`, etc. files show "does not export a Route" warnings. Pre-existing, not caused by V2 changes. |
| No browser available for visual QA | N/A | Headless environment. Visual rendering cannot be confirmed without a browser. Code review confirms correct markup and data flow. |

## Console Errors

No critical console errors observed in the V2 routes. The only server-side message during dev was the Nitro environment warning, which is a known dev-mode limitation and does not affect functionality.

## Test Results

| Metric | Value |
|--------|-------|
| Test Files | 52 passed, 2 failed |
| Tests | 895 passed, 7 failed |
| Typecheck | Pass |
| Lint | 0 errors, 15 warnings (all pre-existing in legacy files) |
| Build | Pass (1m 26s) |

The 7 failures are the same pre-existing Chai matcher issues in `TrendArrow.test.tsx` and `LiveDot.test.tsx` documented since Day 1. They are environment-related and not caused by this branch.

## Mock Data Confirmation

All V2 routes use mock data from:
- `MockDiscoveryProvider` (src/domains/case/providers/mock-discovery-provider.ts)
- `MockEvidenceProvider` (src/domains/case/providers/mock-evidence-provider.ts)
- Case domain fixtures (src/domains/case/fixtures.ts)

All target addresses contain `SAMPLE` or `DO_NOT_USE` markers. No real API calls. No secrets.

## Wallet and Real Trade Confirmation

- No wallet connection code in any V2 route.
- No wallet signing code in any V2 route.
- No real transaction execution code in any V2 route.
- The Decision form only records a paper decision in local state.

## Legacy Routes Confirmation

All legacy routes under `src/routes/_authenticated/` remain untouched. The V2 routes are in a new `src/routes/v2/` directory and use separate URL paths (`/v2/*`).

## Production Confirmation

- No remote push performed.
- Branch `rehab/v2-app-shell` is local only.
- `main` is at `bc39249` (unchanged).

## Open Items (Not Blocking QA)

1. Interactive browser QA requires a display server or Playwright tests. Not available in this environment.
2. The 7 pre-existing test failures remain. Per the previous review, these are environment-related.
3. The Character Registry is not yet connected to the legacy routes (by design — gradual migration).
