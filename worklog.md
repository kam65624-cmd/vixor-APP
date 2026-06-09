# Worklog — P2: Real Portfolio Intelligence

**Date:** 2026-03-05
**Task:** Replace proxy metrics with real trade data on the portfolio page

## Summary

Replaced all proxy metrics (confidence-based win rate, derived profit factor, estimated drawdown) with real trade data from a new `trades` table. The portfolio page now shows actual P&L, real equity curves, and genuine trade breakdowns.

## Changes Made

### 1. SQL Migration — `supabase/migrations/20260610010000_add_trades.sql`
- Created `trades` table with:
  - Entry/exit fields (price, date, quantity)
  - Risk management fields (stop_loss, take_profit)
  - Generated columns: `pnl`, `pnl_pips`, `r_multiple`
  - Metadata: notes, tags, strategy, analysis_id
  - RLS policies for user-scoped access
  - Indexes on user_id, status, pair, entry_date
  - Auto-update trigger for `updated_at`

### 2. Supabase Types — `src/shared/supabase/types.ts`
- Added `trades` table definition with Row, Insert, Update types
- Added relationships to profiles and analyses

### 3. Migration Utility — `src/shared/migrate.server.ts`
- Added `trades` field to `MigrationStatus` interface
- Added trades table check in `checkMigrations()`
- Added CREATE TABLE SQL for trades in `getMigrationSQL()`
- Updated `allComplete` logic to include trades table

### 4. Trades Domain — `src/domains/trades/`

**types.ts:**
- `Trade` — full trade row type
- `CreateTradeInput` — for opening new trades
- `UpdateTradeInput` — for closing/updating trades
- `ListTradesFilters` — status, pair, date range filters
- `TradeStats` — comprehensive portfolio statistics
- `EquityCurvePoint` — for chart data

**functions.ts:**
- `createTrade` (POST) — Open a new trade with validation
- `listTrades` (GET) — List trades with filters
- `updateTrade` (POST) — Update/close trade
- `deleteTrade` (POST) — Delete a trade
- `getTradeStats` (GET) — Calculate real portfolio stats:
  - Win rate, P&L, profit factor, max drawdown
  - Average R-multiple, best/worst trade
  - Average holding time
  - Breakdown by pair, direction, day of week
- `getEquityCurve` (GET) — Cumulative P&L over time

**index.ts:**
- Barrel exports for all functions and types

### 5. Barrel Export — `src/lib/vixor.functions.ts`
- Added trades domain exports (createTrade, listTrades, updateTrade, deleteTrade, getTradeStats, getEquityCurve)

### 6. Portfolio Page Rewrite — `src/routes/_authenticated/portfolio.tsx`

**Before:** Used proxy metrics from analyses (confidence-based win rate, derived profit factor, estimated drawdown, placeholder equity curve)

**After:** Uses real trade data:
- **Performance Overview:** Real win rate (closed wins/total closed), Total P&L (sum of closed trade P&L), Profit Factor (gross profit/|gross loss|), Avg R-Multiple, Max Drawdown (peak-to-trough)
- **Equity Curve:** Real AreaChart using recharts with cumulative P&L from closed trades, green/red gradient based on profitability
- **Open Positions Widget:** Shows currently open trades with entry price, direction, SL/TP, "Close Trade" button
- **New Trade Dialog:** Full form for pair, direction, entry price, quantity, SL, TP, strategy, notes
- **Close Trade Dialog:** Quick close with exit price entry
- **Trade Breakdown:** By Pair (win rate + P&L), By Direction (Long vs Short), By Day of Week
- **Recent Trades:** Last 20 closed trades with P&L and R-multiple
- **Empty State:** Helpful onboarding when no trades exist

### 7. Trade Desk Page Update — `src/routes/_authenticated/trade-desk.tsx`

**Added:**
- Direction selector (Long/Short)
- Entry price input
- "Save as Trade" button that creates a real trade in the trades table
- Pre-fills pair from the calculator, calculates SL price from pips
- Shows real open positions from trades table (replaces static empty state)
- Success feedback animation

## Technical Decisions

1. **Generated columns for P&L calculation:** The `pnl`, `pnl_pips`, and `r_multiple` columns are GENERATED ALWAYS AS STORED in PostgreSQL, ensuring consistent calculation at the DB level. However, the migration utility includes a simpler version without generated columns since it can't execute the full SQL through PostgREST.

2. **Stats calculation on the server:** All statistical calculations (win rate, profit factor, max drawdown, etc.) are done server-side in `getTradeStats`, ensuring consistent results and keeping the client lightweight.

3. **Client-side charting with recharts:** The equity curve uses recharts `AreaChart` with dynamic gradient colors (green for positive, red for negative cumulative P&L).

4. **Consistent patterns:** All server functions follow the same patterns as existing domains (notes, trading) — using `createServerFn`, `requireSupabaseAuth` middleware, zod validators, and `useStableServerFn` on the client.

## Files Modified
- `supabase/migrations/20260610010000_add_trades.sql` (new)
- `src/shared/supabase/types.ts`
- `src/shared/migrate.server.ts`
- `src/domains/trades/types.ts` (new)
- `src/domains/trades/functions.ts` (new)
- `src/domains/trades/index.ts` (new)
- `src/lib/vixor.functions.ts`
- `src/routes/_authenticated/portfolio.tsx`
- `src/routes/_authenticated/trade-desk.tsx`

## Verification
- TypeScript compilation passes (`npx tsc --noEmit` — only pre-existing vite.config.ts error)
- All imports verified
- All server function signatures match expected patterns
