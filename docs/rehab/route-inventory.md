# VIXOR Route Inventory — Day 1

Generated from `src/routes/` enumeration.
Branch: rehab/baseline

## Route Map

| Route Path | Entry File | Access | Current Purpose | P0 Target | Status |
|-----------|-----------|--------|-----------------|-----------|--------|
| `/` | `_authenticated/index.tsx` | Authenticated | Dashboard/home with live ticker, MOXI quick actions, market stats | MOXI discovery/target feed | Preserve/adapt |
| `/auth` | `auth.tsx` | Public | Auth entry | Onboarding | Preserve |
| `/discover` | `_authenticated/discover.tsx` | Authenticated | Discovery feed | MOXI discovery | Preserve/adapt |
| `/discover` (folder) | `_authenticated/_discover/index.tsx` | Authenticated | Discovery sub-features | — | Flag |
| `/opportunities` | `_authenticated/opportunities.tsx` | Authenticated | Opportunities list | Token intelligence | Preserve/adapt |
| `/hunt` | `_authenticated/hunt/radar.tsx` | Authenticated | Radar/scanner | MR.VIGO evidence | Preserve/adapt |
| `/hunt/token.$address` | `_authenticated/hunt/token.$address.tsx` | Authenticated | Token detail | Token intelligence | Preserve/adapt |
| `/hunt/verified.$id` | `_authenticated/hunt/verified.$id.tsx` | Authenticated | Verified token directory | Token intelligence | Preserve/adapt |
| `/hunt/alpha` | `_authenticated/hunt/alpha.tsx` | Authenticated | Alpha signals | Token intelligence | Preserve/adapt |
| `/hunt/whales` | `_authenticated/hunt/whales.tsx` | Authenticated | Whale tracking | Evidence | Preserve/adapt |
| `/shield` | `_authenticated/shield/index.tsx` | Authenticated | Security dashboard | DR.DEX risk | Preserve/adapt |
| `/shield/scanner` | `_authenticated/shield/scanner.tsx` | Authenticated | Security scanner | DR.DEX risk | Preserve/adapt |
| `/shield/trust.$address` | `_authenticated/shield/trust.$address.tsx` | Authenticated | Trust score lookup | DR.DEX risk | Preserve/adapt |
| `/shield/cases` | `_authenticated/shield/cases.tsx` | Authenticated | Security cases | ECHO history | Preserve/adapt |
| `/shield/exposure` | `_authenticated/shield/exposure.tsx` | Authenticated | Exposure analysis | Risk assessment | Preserve/adapt |
| `/shield/alerts` | `_authenticated/shield/alerts.tsx` | Authenticated | Security alerts | Risk assessment | Preserve/adapt |
| `/analysis.$id` | `_authenticated/analysis.$id.tsx` | Authenticated | Analysis detail | Token intelligence | Preserve/adapt |
| `/analyze` | `_authenticated/analyze.tsx` | Authenticated | Analysis entry | Token intelligence | Preserve/adapt |
| `/analyze-page` | `_authenticated/_analyze-page/index.tsx` | Authenticated | Analysis upload/preview | — | Flag |
| `/trade-desk` | `_authenticated/trade-desk.tsx` | Authenticated | Trade execution | Execution boundary | Preserve/adapt |
| `/swap` | `_authenticated/_swap/index.tsx` | Authenticated | Token swap | Execution boundary | Preserve/adapt |
| `/portfolio` | `_authenticated/portfolio.tsx` | Authenticated | Portfolio view | — | Flag |
| `/pnl` | `_authenticated/pnl.tsx` | Authenticated | P&L tracking | — | Flag |
| `/tracking` | `_authenticated/tracking.tsx` | Authenticated | Signal tracking | ECHO history | Preserve/adapt |
| `/trackers` | `_authenticated/trackers.tsx` | Authenticated | Trackers list | ECHO history | Preserve/adapt |
| `/daily-loop` | `_authenticated/daily-loop.tsx` | Authenticated | Daily loop with streak | XP/Streaks | Preserve/adapt |
| `/rewards` | `_authenticated/rewards.tsx` | Authenticated | Rewards/points/streaks | XP ledger | Preserve/adapt |
| `/profile` | `_authenticated/profile.tsx` | Authenticated | User profile/level/XP | XP/Profile | Preserve/adapt |
| `/settings` | `_authenticated/_settings/index.tsx` | Authenticated | Settings | Settings | Preserve |
| `/admin/api-keys` | `_authenticated/admin/api-keys.tsx` | Authenticated+Admin | Admin API keys | Admin | Preserve |
| `/vision` | `_authenticated/vision.tsx` | Authenticated | Vision/radar | — | Flag |
| `/whale` | `_authenticated/whale.tsx` | Authenticated | Whale tracking | Evidence | Preserve/adapt |
| `/wallet-web3` | `_authenticated/wallet-web3.tsx` | Authenticated | Wallet connection | Wallet | Preserve/adapt |
| `/backtest` | `_authenticated/backtest.tsx` | Authenticated | Backtesting | — | Flag |
| `/charts` | `_authenticated/charts.tsx` | Authenticated | Charts | — | Flag |
| `/notifications` | `_authenticated/notifications.tsx` | Authenticated | Notifications | — | Flag |
| `/journal` | `_authenticated/journal.tsx` | Authenticated | Trading journal | ECHO history | Preserve/adapt |
| `/alpha` | `_authenticated/alpha.tsx` | Authenticated | Alpha signals | Token intelligence | Preserve/adapt |
| `/predictions` | `_authenticated/predictions.tsx` | Authenticated | Predictions | — | Flag |
| `/analysis` | `_authenticated/analysis/index.tsx` | Authenticated | Analysis list | Token intelligence | Preserve/adapt |

## Route Categories for MVP

### P0 — Must Preserve/Adapt
- `/` → MOXI discovery/target feed
- `/discover` → Discovery feed
- `/hunt/*` → Evidence/investigation (MR.VIGO)
- `/shield/*` → Risk/security (DR.DEX)
- `/analysis.*` → Token intelligence
- `/trade-desk` → Execution boundary
- `/tracking`, `/trackers` → ECHO case history
- `/daily-loop` → Streaks/XP
- `/rewards` → XP/points
- `/profile` → XP/level/profile

### P1 — Evaluate After P0
- `/portfolio`, `/pnl` — portfolio tracking
- `/journal` — case notes
- `/backtest` — backtesting
- `/charts` — advanced charts
- `/notifications` — alerts

### P2/P3 — Defer or Deprecate
- `/vision` — unclear purpose
- `/predictions` — out of MVP scope
- `/analyze-page` — legacy upload flow
- `/swap` — real swap execution
- `/whale` — duplicate of hunt/whales?
- `/admin/api-keys` — admin only, preserve but gate

## Notes

- Multiple routes share similar concerns (e.g., `/hunt` and `/shield` both relate to investigation/risk).
- The route structure suggests the app already has most P0 surfaces; the rehab will consolidate them under the new character model and case domain.
- Some routes may be deprecated or merged during rehab.
