# VIXOR V2 — Route Migration Map

Branch: rehab/v2-information-architecture
Status: Classification only — no routes deleted, no components removed.

## Classification Legend

| Code | Meaning | Action |
|------|---------|--------|
| Adapt | Keep but connect to V2 concepts | Add V2 links, mark deprecation timeline |
| Rebuild | Replace with a V2 surface | Plan V2 replacement, remove after V2 success |
| Deprecate | Mark for removal after V2 success | Add deprecation notice, keep functional |
| Isolate | Keep but disable dangerous paths | Remove real-money execution, gate behind feature flag |
| Archive | Move to archive/ and remove from navigation | Out of active routing, preserved in git history |

## Current Routes Classification

### Discovery and Home

| Route | Current Purpose | V2 Surface | Decision | Justification | Has Wallet/Tx/Execution |
|-------|-----------------|------------|----------|---------------|-------------------------|
| `/` (`_authenticated/index.tsx`) | Dashboard with live ticker and MOXI quick actions | `/discover` | Rebuild | V2 unifies home and discovery | No (display only) |
| `/discover` | Discovery feed | `/discover` | Adapt | Keep feed, connect to case creation | No |
| `/opportunities` | Opportunities list | `/discover` | Rebuild | Merge into discover feed | No |
| `/alpha` | Alpha signals | `/discover` | Rebuild | Merge into discover feed with provenance | No |
| `/hunt/alpha` | Alpha signals page | `/discover` | Rebuild | Merge into discover feed | No |
| `/hunt/radar` | Radar/scanner | `/discover` | Rebuild | Merge into discover feed | No |
| `/hunt/whales` | Whale tracking | (deferred) | Deprecate | Out of MVP scope | No |

### Token Intelligence

| Route | Current Purpose | V2 Surface | Decision | Justification | Has Wallet/Tx/Execution |
|-------|-----------------|------------|----------|---------------|-------------------------|
| `/hunt/token/$address` | Token detail | `/case/:caseId` | Rebuild | V2 uses case object as container | No |
| `/hunt/verified/$id` | Verified token directory | `/discover` | Adapt | Keep as filter in discover | No |
| `/token/$symbol` | Token by symbol | `/case/:caseId` | Rebuild | Route via case ID | No |
| `/analyze` | Analysis entry | `/case/:caseId` | Rebuild | Merge into case flow | No |
| `/analyze-page` | Upload/preview flow | (deferred) | Deprecate | Out of MVP | No |
| `/analysis/$id` | Analysis detail | `/case/:caseId` | Rebuild | Merge into case flow | No |
| `/analysis` | Analysis list | `/case/:caseId` | Rebuild | List replaced by history filter | No |
| `/charts` | Advanced charts | (deferred) | Deprecate | Out of MVP scope | No |
| `/vision` | Vision/radar | (deferred) | Deprecate | Out of MVP scope | No |
| `/predictions` | Predictions | (deferred) | Deprecate | Out of MVP scope | No |
| `/backtest` | Backtesting | (deferred) | Deprecate | Out of MVP scope | No |

### Security and Risk

| Route | Current Purpose | V2 Surface | Decision | Justification | Has Wallet/Tx/Execution |
|-------|-----------------|------------|----------|---------------|-------------------------|
| `/shield` | Security dashboard | `/discover` | Adapt | Quick-access to risk filter | No |
| `/shield/scanner` | Security scanner | `/case/:caseId/risk` | Rebuild | Risk is part of case | No |
| `/shield/trust/$address` | Trust score lookup | `/case/:caseId/risk` | Rebuild | Risk is part of case | No |
| `/shield/cases` | Security cases | `/history` | Rebuild | Merge into case history | No |
| `/shield/exposure` | Exposure analysis | `/case/:caseId` | Rebuild | Part of case intelligence | No |
| `/shield/alerts` | Security alerts | `/discover` | Adapt | Alerts surface in discover | No |
| `/wallet-web3` | Wallet connection | (isolated) | Isolate | Keep connection, isolate signing | **Yes — wallet signing** |
| `/whale` | Whale tracking | (deferred) | Deprecate | Duplicate of hunt/whales | No |

### Trading and Execution

| Route | Current Purpose | V2 Surface | Decision | Justification | Has Wallet/Tx/Execution |
|-------|-----------------|------------|----------|---------------|-------------------------|
| `/trade-desk` | Trade execution UI | `/case/:caseId/decision` | Isolate | Keep UI, disable real execution | **Yes — execution** |
| `/swap` | Token swap | (deferred) | Archive | Real swap out of MVP | **Yes — execution** |
| `/portfolio` | Portfolio view | (deferred) | Deprecate | Out of MVP scope | No |
| `/pnl` | P&L tracking | (deferred) | Deprecate | Out of MVP scope | No |
| `/tracking` | Signal tracking | `/history` | Rebuild | Merge into case history | No |
| `/trackers` | Trackers list | `/history` | Rebuild | Merge into case history | No |

### User and Profile

| Route | Current Purpose | V2 Surface | Decision | Justification | Has Wallet/Tx/Execution |
|-------|-----------------|------------|----------|---------------|-------------------------|
| `/profile` | User profile/level/XP | `/learning` | Adapt | Profile becomes learning summary | No |
| `/rewards` | Points and streaks | `/learning` | Adapt | Merge into learning | No |
| `/daily-loop` | Daily loop | `/learning` | Adapt | Daily loop becomes learning entry | No |
| `/referral` | Referral program | (deferred) | Deprecate | Out of MVP scope | No |
| `/notifications` | Notifications | `/history` | Adapt | Notifications surface in case context | No |
| `/journal` | Trading journal | `/history` | Adapt | Journal entries are part of history | No |
| `/settings` | User settings | `/settings` | Adapt | Keep with V2 design constraints | No |
| `/admin/api-keys` | Admin API keys | (isolated) | Isolate | Keep admin access, restrict | **Yes — admin keys** |

### Auth

| Route | Current Purpose | V2 Surface | Decision | Justification | Has Wallet/Tx/Execution |
|-------|-----------------|------------|----------|---------------|-------------------------|
| `/auth` | Auth entry | `/onboarding` | Rebuild | V2 onboarding replaces auth page | No |

## Summary

| Classification | Count | Notes |
|----------------|-------|-------|
| Adapt | 8 | Keep with V2 links |
| Rebuild | 20 | Replace with V2 surfaces |
| Deprecate | 9 | Mark for post-V2 removal |
| Isolate | 3 | Keep but disable dangerous paths |
| Archive | 1 | Move to archive/ |

## Routes with Wallet / Transaction / Execution

These routes contain wallet, transaction, or execution logic and must be isolated (not executed) in V2 MVP:
- `/wallet-web3` — wallet signing
- `/trade-desk` — trade execution
- `/swap` — real swap (archive)
- `/admin/api-keys` — admin API access

These routes are **not deleted** in this commit. They are marked for isolation in a later commit.

## Routes with 3D or Floating UI

- `/` (index.tsx) — uses `MoxiCharacter3D.tsx` and `FloatingCopilot.tsx`

These components are **not removed** in this commit. They are documented for later removal.

## Next Steps

1. No routes are deleted in this commit.
2. No components are removed in this commit.
3. No Wallet, Transaction, or Execution logic is changed in this commit.
4. V2 route creation will happen in future commits following the case domain model.
