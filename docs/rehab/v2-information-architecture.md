# VIXOR V2 — Information Architecture

Branch: rehab/v2-information-architecture
Date: 2026-09-04
Status: Definition only — no routes deleted, no components removed.

## 1. Product Definition

VIXOR = **Crypto Decision Intelligence**

A single coherent product that guides the user from signal discovery to outcome learning through one decision loop, supported by four active characters.

## 2. Core Loop

```
DISCOVER → UNDERSTAND → VERIFY → DECIDE → EXECUTE → TRACK → LEARN
```

Every surface in V2 maps to exactly one stage of this loop. A token, alert, risk finding, decision, transaction, and outcome are linked as one traceable case with a stable case ID.

## 3. V2 Target Routes

| Route | Stage | Primary Character | Purpose |
|-------|-------|-------------------|---------|
| `/onboarding` | Discover (entry) | MOXI | Welcome and guided setup |
| `/discover` | Discover | MOXI | Target feed with signal provenance |
| `/case/:caseId` | Understand | MOXI | Token intelligence case view |
| `/case/:caseId/evidence` | Verify | MR.VIGO | Evidence investigation |
| `/case/:caseId/risk` | Verify | DR.DEX | Risk assessment |
| `/case/:caseId/decision` | Decide | DR.DEX + ECHO | Decision review and recording |
| `/history` | Track + Learn | ECHO | Case history timeline |
| `/learning` | Learn | ECHO | Personal decision profile and patterns |
| `/settings` | (meta) | — | User settings |

## 4. Character Surface Map

| Character | Surfaces |
|-----------|----------|
| MOXI | `/onboarding`, `/discover`, `/case/:caseId` |
| MR.VIGO | `/case/:caseId/evidence` |
| DR.DEX | `/case/:caseId/risk`, `/case/:caseId/decision` |
| ECHO | `/case/:caseId/decision` (recording), `/history`, `/learning` |

A character must not appear on a surface outside its allowed set. Enforced by `packages/vixor-gamification/src/characters/registry.ts` (already created in Day 2, not yet connected to UI).

## 5. MVP Scope

| Priority | Surface | Notes |
|----------|---------|-------|
| P0 | `/onboarding` | Welcome, no wallet required |
| P0 | `/discover` | Feed with provenance explanation |
| P0 | `/case/:caseId` | Single token case view |
| P0 | `/case/:caseId/evidence` | MR.VIGO investigation |
| P0 | `/case/:caseId/risk` | DR.DEX assessment |
| P0 | `/case/:caseId/decision` | Rationale + invalidation condition |
| P0 | `/history` | ECHO case timeline |
| P1 | `/learning` | Pattern summary (post-MVP) |
| P1 | `/settings` | User preferences |

## 6. Excluded from V2 MVP

- Real-money transaction execution (isolate, do not enable)
- Wallet signing and custody changes (out of scope)
- Public leaderboards, cash prizes, NFT rewards
- Full 3D character environments
- Holographic UI, floating panels, visible AI identity
- Autonomous trading recommendations
- Production-grade intelligence graph infrastructure
- Broad connector replacement before provider abstraction is tested
- Complete redesign of every existing route in this commit

## 7. Navigation Principle

The app must not present as a collection of unrelated tools. One primary navigation surface (bottom or side) with these anchors:
- Discover (MOXI)
- History (ECHO)
- Settings (meta)

Secondary navigation is context-aware within a case:
- Case → Evidence → Risk → Decision
- Case → Outcome Review (when available)

## 8. Case Object

A `case` is the root object linking every stage. Minimum fields:
- `caseId` — stable identifier
- `targetId` — the token or wallet under review
- `stage` — current loop position
- `createdAt`, `updatedAt`

A case ID is visible in the flow and remains stable across all stages.

## 9. Provider Boundaries

V2 uses a provider interface for all external data:
- Discovery provider (with provenance)
- Token intelligence provider
- Evidence provider
- Security scan provider
- Outcome tracking provider

In V2 MVP, providers return deterministic mock data so UX and domain behavior are testable without connector instability. Real connectors are added after provider contracts stabilize.

## 10. XP and Gamification (Deferred to Later)

XP is non-financial progression metadata. Events are tied to case stages, not transaction volume. Implementation deferred to a later commit after the case domain model is in place.

## 11. Security Boundaries (Isolated, Not Fixed in This Commit)

The following are documented risks that must remain isolated:
- `executeTrade` real-money path
- Wallet signing flow
- Admin API key via query string
- In-memory rate limiting
- NFT references in persona schema
- 3D and floating UI components
- CSS variable `var(--char-vix)` legacy color token

These are NOT fixed in this commit. They are documented for a later isolation or removal commit.

## 12. Registry Status

The Character Registry at `packages/vixor-gamification/src/characters/` exists and is tested (14 tests passing). It is **not yet connected to the Active UI**. Connecting it is part of the V2 migration and will happen incrementally as routes are rebuilt, not as a blanket replacement in legacy routes.

## 13. routeTree.gen.ts

`src/routeTree.gen.ts` is auto-generated by the TanStack router plugin. It must not be edited manually. If a config change causes regeneration, the diff is reviewed but not authored by hand.

## 14. Migration Strategy

Legacy routes are not deleted in this commit. Each is classified as one of:
- **Adapt** — keep but connect to V2 concepts
- **Rebuild** — replace with a V2 surface
- **Deprecate** — mark for removal after V2 success
- **Isolate** — keep but disable dangerous paths
- **Archive** — move to `archive/` and remove from active navigation

The detailed classification is in `route-migration-map.md`.

## 15. Out of Scope for This Commit

- Case domain model implementation (types, validation, fixtures)
- Provider interface implementation
- Screen implementation
- XP ledger
- Test suite expansion
- Visual redesign
- Route deletion
- Component deletion
- 3D/floating component removal
- Real trade isolation
