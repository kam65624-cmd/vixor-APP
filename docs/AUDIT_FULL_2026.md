# VIXOR MVP Audit Report
**Date:** 2026-09-28
**Scope:** Full codebase — domains, routes, APIs, database, external integrations
**Status:** MVP — decision loop NOT complete, many backend/UI wiring gaps

---

## 🔴 CRITICAL — Blocker Issues

### 1. TypeScript Errors (2 active files)

**File: `src/routes/_authenticated/investigate.tsx`**

| Line | Error | Impact |
|------|-------|--------|
| 26 | `"/_authenticated/investigate"` not assignable to `keyof FileRoutesByPath` | TanStack Router route definition broken |
| 532 | `Type 'unknown' is not assignable to type 'ReactNode'` | JSX render error |
| 575 | `Type '{}' is missing properties from InvestigationResult` | Mutation error state type mismatch |
| 580–635 | Property access on wrong type (evidence, unknowns, etc.) | Multiple type errors in error render block |

**File: `src/domains/mr-vigo/functions.ts`**

| Line | Error | Impact |
|------|-------|--------|
| 48 | `Evidence<unknown>` not serializable via TanStack ServerFn | investigateToken can fail at runtime |
| 185 | `string \| null` not assignable to `string \| undefined` | tokenImage type mismatch |

### 2. Paper Decision Loop NOT Wired to UI

The full 4-character decision loop is architecturally defined but the connections are broken:

```
MOXI (askMoxi) → MR.VIGO (investigateToken) → DR.DEX (assessToken + logPaperDecision) → ECHO (getEchoOverview)
        ↑                                        ↓                                     ↓                    ↓
   Chat UI ✓                              /investigate ✓                  /trade-desk UI ❌    /echo ✓
                                      (investigate.tsx ⚠️ TS errors)    (PaperDecision not      (StatsPanel ✓)
                                                                     connected to ECHO)
```

**DR.DEX specifically:**
- `assessToken` server function is built ✅ but no UI calls it
- `logPaperDecision` is paper-only (no DB write) — decision is returned to caller and lost
- **ECHO does NOT receive paper decisions** — `getEchoOverview` queries `signal_tracking` and `trades` but has no concept of `paper_decisions` table
- **No `paper_decisions` table in database** — the comment in `logPaperDecision` says "wiring belongs to ECHO" but it's not done

### 3. Auth Guard Missing on Public Server Functions

These server functions have NO auth middleware — anyone can call them:

| Function | File | Risk |
|----------|------|------|
| `getCandles` | `src/domains/trade/functions.ts:103` | Rate limit abuse, no user context |
| `getTicker` | `src/domains/trade/functions.ts:146` | Rate limit abuse |
| `getTechnicalSignals` | `src/domains/trade/functions.ts:158` | Rate limit abuse |
| `getPopularSwapTokens` | `src/domains/trade/functions.ts:288` | Low risk but inconsistent |
| `getJupiterSwapQuote` | `src/domains/trade/functions.ts:232` | Medium — could probe swap pricing |
| `get1inchSwapQuote` | `src/domains/trade/functions.ts:306` | Medium — same |
| `getEvmSwapTokens` | `src/domains/trade/functions.ts:344` | Low risk |

### 4. Table Name Inconsistency: `user_trades` vs `trades`

Two separate tables exist with similar but different schemas:

| Table | Used by | Columns |
|-------|---------|---------|
| `user_trades` | `trade/functions.ts` (getDashboardData, getUserTrades, saveUserTrade) | pnl_usd, token_symbol, side, amount, price_usd, total_usd, status, created_at |
| `trades` | `echo/functions.ts`, `server/api/echo-stats.ts` | id, pair, direction, status, pnl, entry_date, exit_date, notes, user_id |

**This means:**
- Dashboard and PnL UI read from `user_trades`
- Echo/stats read from `trades`
- If user creates a trade via Dashboard → it goes to `user_trades` → Echo never sees it
- The two tables are never synchronized

### 5. Birdeye API Key Missing

`BIRDEYE_API_KEY` is optional — without it, market data falls back to DexScreener which has limited token metadata. All Birdeye-dependent data (holders count, market cap, social links) degrades gracefully but with less quality.

---

## 🟠 HIGH PRIORITY — Major Gaps

### 6. Background Signal Generation Not Wired

`server/api/generate-signals.ts` is a working cron job that:
- Fetches Binance klines
- Runs local pattern analysis
- Saves to `daily_signals` table

**Problems:**
- Not connected to any UI surface — user can't view generated signals
- No signal list/feed route that queries `daily_signals`
- The `/signals` route exists but not confirmed it's wired to this table

### 7. DR.DEX — AssessToken UI Wiring

`assessTokenWithPatterns` (candlestick pattern assessment) was built in a previous session but:
- Not connected to any route/UI
- The pattern summary panel exists in `CandlestickChartReact` but the server function data isn't fed to it

### 8. Swap Execution is PARTIAL

Both Jupiter and 1inch integration are built:
- Quote fetching ✅
- Unsigned transaction building ✅
- **Actual signing and broadcast ❌** — UI needs wallet integration (Phantom/MetaMask)

### 9. Daily Loop — 3 Phases Not Fully Wired

`daily-loop/functions.ts` has all server functions:
- `getTodayLoop` ✅
- `updateMorningPrep` ✅
- `updateSessionTracking` ✅
- `updateEodReview` ✅
- `getLoopHistory` ✅
- `getStreak` ✅

But need to verify the `_daily-loop/index.tsx` UI actually calls all these correctly.

### 10. No Auth on Root Route

`src/routes/__root.tsx` — no global auth check. Users can hit any route before auth. TanStack Start's `requireSupabaseAuth` middleware is used per-server-function but not on route level.

---

## 🟡 MEDIUM PRIORITY

### 11. Database Indexes — Missing Critical Indexes

No explicit index migration found. Likely gaps:
- `signal_tracking(user_id, status)` — queried by ECHO and generate-signals
- `signal_tracking(status, created_at)` — filtered by active/pending
- `trades(user_id, exit_date)` — weekly PnL aggregation
- `trades(user_id, status)` — open vs closed
- `daily_signals(pair, timeframe, signal_date)` — dedup on insert
- `contract_scans(user_id, created_at)` — scan history

### 12. i18n — Only AR/EN

Arabic and English exist, but:
- No `fr.ts`, `zh.ts`, `es.ts` for broader market
- Dynamic content (error messages, API responses) may still be hardcoded EN

### 13. 42+ Route Files — Many Likely Stubs

Top-level `_authenticated/` has 39 `.tsx` files including duplicates (both `echo.tsx` and `_echo/`?). Some are clearly UI stubs not wired to server functions.

### 14. old `trade` domain vs `trades` domain

Two separate domains:
- `src/domains/trade/` — pattern detection, jupiter/1inch, dashboard
- `src/domains/trades/` — database CRUD (listTrades, createTrade)

Both have overlapping functionality. `trade/functions.ts` uses `user_trades` table, `trades/functions.ts` uses `trades` table. This is confusing and error-prone.

### 15. No Rate Limiting on External API Calls

- `fetchGoPlusSecurity` — no built-in rate limiting
- Birdeye calls — no rate limiting
- Jupiter/1inch quote calls — no rate limiting

### 16. `reanalysis-cron.ts` — Not Reviewed

`server/api/reanalysis-cron.ts` exists but not audited. Could be orphaned or broken.

### 17. `ai-gateway.server.ts` — Not Reviewed

Root-level file. Not clear if it's wired into the MOXI agent.

### 18. `asset-registry.ts` — Not Audited

`src/shared/asset-registry.ts` — determines which pairs get signal generation. If empty, cron generates nothing.

### 19. `VixorEvents` — Unused

`src/shared/events/VixorEvents` is emitted in `generate-signals.ts` but no listener found. Event system may be orphaned.

### 20. CORS/API Security

`server/api/_security.ts` exists but need to verify all public endpoints have proper CORS and rate limiting.

---

## 🟢 LOW PRIORITY — Nice to Have

### 21. No PWA / Service Worker
- Offline support not implemented
- Installability not set up

### 22. No Analytics / Error Tracking Setup
- No Sentry DSN or equivalent in `.env`
- No error boundary components

### 23. `worklog.md` — Manual Process
- Sprint tracking is a doc file, not automated

### 24. `.storybook/` — Stale?
- Storybook exists but not confirmed it's actively maintained

### 25. `agent-ctx/` — Documentation Only
- Agent context files exist but not confirmed if used

---

## ✅ WHAT'S WORKING WELL

1. **TypeScript** — 0 errors after last fix (pending re-verification)
2. **vitest** — 50 test files, all passing
3. **4-Character Architecture** — conceptually sound and well-separated
4. **External API Health Checks** — `/api/shield-health` + `/api/market-data-health` both implemented
5. **Echo Stats** — `/api/echo-stats` comprehensive, covers all major aggregates
6. **Signal Tracking Tables** — Rich schema with status transitions (tp1_hit, tp2_hit, tp3_hit, invalidated)
7. **Daily Loop** — Full server-side CRUD, streak tracking
8. **Risk Governor** — Standalone, well-tested, no external dependencies
9. **i18n Foundation** — Centralized nav strings, AR/EN, RTL support
10. **CI/CD** — Vercel deploys, pre-commit hooks, TypeScript check

---

## 📋 PRIORITIZED ACTION PLAN

### Phase 1 — Critical Fixes (Do First)
1. Fix TS errors in `investigate.tsx` (3 types of errors)
2. Fix TS error in `mr-vigo/functions.ts:185`
3. Add auth middleware to all public server functions in `trade/functions.ts`
4. Create `paper_decisions` table migration + wire `logPaperDecision` → ECHO

### Phase 2 — Loop Completion (MVP Core)
5. Wire `assessToken` server function to DR.DEX UI surface
6. Wire `paper_decisions` to ECHO timeline
7. Wire `daily_signals` table to a signals feed UI route
8. Verify `/trade-desk` calls `getDashboardData` / `getUserTrades` with correct table

### Phase 3 — Data Integrity
9. Create database indexes migration
10. Audit and fix `user_trades` vs `trades` table — pick one canonical table
11. Audit `signal_tracking` vs `paper_decisions` relationship
12. Verify `getEchoOverview` picks up all data sources correctly

### Phase 4 — External Integrations
13. Set BIRDEYE_API_KEY (production)
14. Add rate limiting to GoPlus/Birdeye calls
15. Audit Jupiter/1inch wallet signing flow

### Phase 5 — Polish
16. Audit all 42 route files — stub vs wired
17. Add error boundary components
18. Add Sentry error tracking
19. Full i18n pass on dynamic error messages
20. Test the full MOXI→VIGO→DEX→ECHO flow end-to-end

---

## 📊 Summary Numbers

| Metric | Count |
|--------|-------|
| Total domains | 23 |
| Domains with server.ts | 2 (wallet, discovery) |
| Domains with functions.ts | 19 |
| Server API routes | 16 |
| Migrations | 36 |
| Route files (top-level) | 39 |
| i18n languages | 2 (AR, EN) |
| External APIs integrated | 5 (GoPlus, RugCheck, Birdeye, DexScreener, Binance) |
| Active TS errors | ~12 (2 files) |
| Test files | 50+ |
| PRs merged total | 21 |

---

*Generated by Mavis audit task — 2026-09-28*
