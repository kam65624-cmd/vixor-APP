# Worklog: P6 — Fix API Routes + Final Cleanup

## Date: 2026-06-09

## Summary

Fixed all API route files to use the correct Nitro/h3 `defineEventHandler` pattern, registered them with the Nitro plugin in `vite.config.ts`, removed dead code, and added the `getPendingMigrationsSQL()` utility.

---

## Problem 1: API Routes Don't Work (FIXED)

### Root Cause

The API route files in `src/routes/api/` used `createAPIFileRoute` from `@tanstack/react-start/api`, which **does not exist** in the installed version. This caused build warnings ("Route file does not export a Route") and 404s on Vercel because Nitro never registered these handlers.

Additionally, even after rewriting to `defineEventHandler`, the API routes still wouldn't work because **Nitro's `scanDirs` was empty** — it didn't know to look in `src/routes/api/` for route handlers.

### Changes Made

1. **`src/routes/api/check-alerts.ts`** — Rewrote from `createAPIFileRoute` to `defineEventHandler` from `h3`. Uses `getMethod`, `getHeader`, and `createError` from h3. Supports both GET and POST (for Vercel Cron). CRON_SECRET validation preserved.

2. **`src/routes/api/generate-signals.ts`** — Same rewrite. Added `fetchTwelveDataKlines` fallback that was missing in the `-` prefixed version. All business logic (pair/timeframe iteration, Binance/TwelveData fetching, analysis, Supabase insert) preserved.

3. **`src/routes/api/telegram-webhook.ts`** — Rewrote to `defineEventHandler`. Uses `readBody` from h3 (with `as Record<string, any>` type assertion) instead of `request.json()`. Both pre_checkout_query and successful_payment handling preserved.

4. **`src/routes/api/migrate.ts`** — Already used `defineEventHandler` from h3. Cleaned up to also import and use the new `getPendingMigrationsSQL()` function in the POST handler.

5. **`vite.config.ts`** — **Critical fix**: Added `routes` config to the `nitro()` plugin to explicitly register all 4 API routes:
   ```ts
   routes: {
     "/api/check-alerts": "./src/routes/api/check-alerts.ts",
     "/api/generate-signals": "./src/routes/api/generate-signals.ts",
     "/api/telegram-webhook": "./src/routes/api/telegram-webhook.ts",
     "/api/migrate": "./src/routes/api/migrate.ts",
   },
   ```
   This tells Nitro where to find the handlers at build time. Without this, Nitro's route scanner had an empty `scanDirs` and never discovered them.

### Verification

After rebuild, the server bundle (`index.mjs`) contains the route registration:
```
/api/check-alerts → handler
/api/generate-signals → handler
/api/telegram-webhook → handler
/api/migrate → handler
/** → SSR renderer (catch-all)
```

All business logic functions (`checkAllAlerts`, `fetchBinanceKlines`, `runLocalAnalysis`, `pre_checkout_query`, `checkMigrations`, `getPendingMigrationsSQL`) are present in the bundle.

---

## Problem 2: Apply SQL Migrations (PARTIALLY FIXED)

### Changes Made

1. **`src/shared/migrate.server.ts`** — Added `getPendingMigrationsSQL()` async function that:
   - Calls `checkMigrations()` to get current table status
   - If all tables exist, returns a "no migration needed" message
   - If tables are missing, returns the full SQL (with `IF NOT EXISTS` clauses) plus a header listing which tables are missing and instructions to run in Supabase Dashboard SQL Editor

2. **`src/server/migrate.server.ts`** — Updated re-export to include `getPendingMigrationsSQL`

3. **`src/routes/api/migrate.ts`** — POST handler now calls `getPendingMigrationsSQL()` instead of `getMigrationSQL()`, returning `{ sql, instructions }` JSON

### Note

The actual SQL still needs to be run manually in the Supabase Dashboard SQL Editor since the Supabase JS client doesn't support raw SQL execution. The GET `/api/migrate` endpoint shows table status, and POST `/api/migrate` returns the SQL to copy-paste.

---

## Problem 3: Remove Dead Code (FIXED)

### Files Deleted

- `src/routes/api/-check-alerts.ts` — Workaround copy using `createAPIFileRoute`
- `src/routes/api/-generate-signals.ts` — Workaround copy using `createAPIFileRoute`
- `src/routes/api/-telegram-webhook.ts` — Workaround copy using `createAPIFileRoute`
- `src/routes/api/-migrate.ts` — Workaround copy using `defineEventHandler` from `vinxi/http`
- `src/types/api-routes.d.ts` — Declared non-existent `createAPIFileRoute` from `@tanstack/react-start/api` and `defineEventHandler` from `vinxi/http`

### Verified

- No remaining imports of `@tanstack/react-start/api` in the codebase
- No remaining imports of `vinxi/http` in the codebase
- No remaining `-` prefixed files in `src/routes/api/`
- No remaining `api-routes.d.ts` references

---

## Verification Results

- **TypeScript**: `npx tsc --noEmit` passes (only pre-existing `includeFiles` type error in `vite.config.ts`)
- **Build**: `npm run build` succeeds
- **Module load**: `node -e "await import('./.vercel/output/functions/__server.func/index.mjs')"` succeeds
- **Route registration**: All 4 API routes are registered in the Nitro bundle with correct paths
- **Business logic**: All handler functions present in the bundle
---
Task ID: 1
Agent: Main Agent (Super Z)
Task: VIXOR Full System Audit & Reverse Engineering Report

Work Log:
- Launched 3 parallel exploration agents to map the complete codebase, read all SQL migrations, and audit all route/page files
- Launched 2 additional agents to deep-dive into AI/API source code and security/DevOps configuration
- Compiled findings from all 5 agents into a comprehensive 20-section forensic audit report
- Generated PDF using ReportLab with cascade palette (25 pages, 157KB)
- Created professional cover page using HTML/Playwright (Template 01: HUD Data Terminal style)
- Merged cover + body PDFs into final deliverable

Stage Summary:
- Generated: /home/z/my-project/download/Vixor_Full_System_Audit_Report_Final.pdf (25 pages)
- Generated: /home/z/my-project/download/Vixor_Full_System_Audit_Report.pdf (body only, 24 pages)
- Generated: /home/z/my-project/download/cover.pdf (cover page)
- Key findings: API stubs in fix-vercel-bundle.mjs break alerts/signals/payments; no payment verification; exposed OIDC token; triple code duplication; local analysis engine is the crown jewel
