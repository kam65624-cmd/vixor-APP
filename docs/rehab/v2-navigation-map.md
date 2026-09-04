# VIXOR V2 — Navigation Map

Branch: rehab/v2-information-architecture
Status: Definition only — no navigation implemented yet.

## 1. Navigation Principle

VIXOR V2 must not present as a collection of unrelated tools. One primary navigation surface with context-aware secondary navigation within a case.

## 2. Primary Navigation

A single bottom or side navigation with three anchors:

| Anchor | Route | Character | Icon Concept |
|--------|-------|-----------|--------------|
| Discover | `/discover` | MOXI | Compass or radar |
| History | `/history` | ECHO | Timeline or book |
| Settings | `/settings` | — | Gear or slider |

This is the only persistent navigation. It is visible on all V2 surfaces.

## 3. Onboarding

| Flow Step | Route | Character | Notes |
|-----------|-------|-----------|-------|
| Welcome | `/onboarding` | MOXI | First screen, no wallet required |
| Target choice | `/discover` (entry state) | MOXI | Paste address or pick from feed |
| First case | `/case/:caseId` | MOXI → MR.VIGO → DR.DEX | Guided tour |

## 4. Case Context Navigation

When inside a case (`/case/:caseId/...`), a secondary navigation appears at the top of the case view:

| Step | Route | Character | Stage |
|------|-------|-----------|-------|
| Intelligence | `/case/:caseId` | MOXI | Understand |
| Evidence | `/case/:caseId/evidence` | MR.VIGO | Verify |
| Risk | `/case/:caseId/risk` | DR.DEX | Verify |
| Decision | `/case/:caseId/decision` | DR.DEX + ECHO | Decide |

Progress through the case is shown as a step indicator. The user can move forward and backward, but cannot skip a stage without explicit acknowledgment.

## 5. History Navigation

| View | Route | Character | Purpose |
|------|-------|-----------|---------|
| All cases | `/history` | ECHO | Timeline of all cases |
| Case detail | `/history/:caseId` | ECHO | Single case review |
| Learning summary | `/learning` | ECHO | Patterns and insights |

## 6. Settings Navigation

| Section | Route | Purpose |
|---------|-------|---------|
| Profile | `/settings/profile` | Display name, avatar variant |
| Notifications | `/settings/notifications` | Alert preferences |
| Wallet (isolated) | `/settings/wallet` | Connection management, no signing in MVP |
| API keys (isolated) | `/settings/api-keys` | Admin-gated, out of MVP for regular users |

## 7. Hidden or Isolated Routes

The following routes exist in the codebase but are **not** part of the V2 navigation:

- `/trade-desk` — isolated, no real execution in V2
- `/swap` — archived, out of MVP
- `/admin/api-keys` — admin only, isolated
- `/hunt/*` — merged into `/discover` and `/case/:caseId`
- `/shield/*` — merged into `/case/:caseId/risk` and `/history`
- `/wallet-web3` — connection only, no signing
- `/analyze`, `/analyze-page` — merged into case flow
- `/portfolio`, `/pnl` — out of MVP
- `/charts`, `/backtest`, `/predictions`, `/vision` — out of MVP
- `/whale`, `/hunt/whales` — out of MVP
- `/referral` — out of MVP

## 8. Navigation Anti-Patterns (Explicitly Avoided)

- No bottom nav with more than 3-4 anchors
- No floating action buttons that compete with content
- No persistent sidebars on mobile
- No tab bars inside a case (use the case step indicator instead)
- No character mascots as navigation elements
- No AI-themed navigation labels

## 9. Implementation Status

This document defines the target navigation. The actual navigation components are not implemented in this commit. Implementation happens in a future commit after the case domain model is in place.

## 10. Connection to Character Registry

When implemented, navigation must use the Character Registry to determine which character icon or label appears on each surface. The registry is at `packages/vixor-gamification/src/characters/` and is already tested.
