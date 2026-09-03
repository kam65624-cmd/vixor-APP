# VIXOR Verification Log — Day 1

Date: 2026-09-03
Branch: rehab/baseline
Commit baseline: d1cde8c

## 1. Install

| Check | Command | Result | Blocking? | Notes |
|-------|---------|--------|-----------|-------|
| Install | `pnpm install` | Pass | No | 1466 packages installed. Some postinstall warnings from `@stellar/stellar-sdk` (yarn not available) and `tiny-secp256k1` (fallback to pure JS). |

## 2. Lint

| Check | Command | Result | Blocking? | Notes |
|-------|---------|--------|-----------|-------|
| Lint | `npx eslint src/ server/` | Pass | No | 0 errors, 15 warnings. Warnings are pre-existing react-refresh and react-hooks warnings in UI components. |

## 3. Type Check

| Check | Command | Result | Blocking? | Notes |
|-------|---------|--------|-----------|-------|
| Typecheck | `npx tsc --noEmit` | Pass | No | No type errors. |

## 4. Build

| Check | Command | Result | Blocking? | Notes |
|-------|---------|--------|-----------|-------|
| Build | `npx vite build` | Pass | No | Built in 52.68s. Output in `.vercel/output/`. Nitro preview/deploy commands available. |

## 5. Tests

| Check | Command | Result | Blocking? | Notes |
|-------|---------|--------|-----------|-------|
| Tests | `npx vitest run` | Partial fail | No | 49 files passed, 2 files failed. 809 tests passed, 7 failed. Failures are pre-existing Chai matcher setup issues in `TrendArrow.test.tsx` and `LiveDot.test.tsx` (`toBeInTheDocument`, `toHaveAttribute` not registered). Not blocking for baseline. |

## 6. Dev Server

| Check | Command | Result | Blocking? | Notes |
|-------|---------|--------|-----------|-------|
| Dev | `npx vite dev` | Pass | No | Server started on `http://192.168.1.8:8080/`. |

## 7. Known Failures / Unresolved Issues

1. **pnpm exec resolution**: `pnpm exec` does not resolve binaries from root `.bin` in this workspace; `npx` works as a workaround. This does not block baseline but should be investigated.
2. **Vitest Chai setup**: `TrendArrow.test.tsx` and `LiveDot.test.tsx` fail due to missing Chai matchers from `@testing-library/jest-dom`. Pre-existing issue.
3. **Postinstall script failure**: `@stellar/stellar-sdk` postinstall script fails due to missing `yarn` on Windows. The package still functions; not blocking.

## 8. Production

- No production changes made.
- Production reference: `https://vixor-app.vercel.app/`
- Branch `rehab/baseline` is independent from `main`.
