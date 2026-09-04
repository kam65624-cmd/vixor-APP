# VIXOR V2 — MVP Surface Map

Branch: rehab/v2-information-architecture
Status: Definition only — no surfaces implemented yet.

## 1. MVP Surfaces (P0)

| Surface | Route | Character | Required States | Acceptance Criteria |
|---------|-------|-----------|-----------------|---------------------|
| Welcome | `/onboarding` | MOXI | empty, in-progress, complete | User can enter without connecting a wallet |
| Target feed | `/discover` | MOXI | empty, loading, loaded, error, unsupported-network | Feed shows signal provenance; target selection creates a case |
| Case view | `/case/:caseId` | MOXI | loading, loaded, partial, failed-scan | Case ID is stable; price/context/liquidity/activity/provenance visible |
| Evidence | `/case/:caseId/evidence` | MR.VIGO | loading, loaded, partial, failed | Each finding has source, timestamp, severity, status; missing evidence is explicit |
| Risk | `/case/:caseId/risk` | DR.DEX | loading, loaded, unable-to-verify | Status vocabulary: no-issue, caution, high-risk, unable-to-verify; uncertainty is shown |
| Decision | `/case/:caseId/decision` | DR.DEX + ECHO | pending, recorded | User records action, rationale, invalidation condition, timestamp |
| History | `/history` | ECHO | empty, loaded, filtered | Timeline of cases; each case can be reopened |

## 2. Required Loading States

Every surface must explicitly handle:
- `loading` — data is being fetched
- `empty` — no data available
- `partial` — some data loaded, some failed
- `error` — fetch or processing failure
- `unavailable` — provider not configured

A failed scan must never render as "safe" or "no issue".

## 3. Case Object (Minimum Fields)

```ts
interface Case {
  caseId: string;          // stable identifier
  targetId: string;        // token or wallet under review
  stage: CaseStage;        // current loop position
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
```

Full case domain model is deferred to a later commit. This is the minimum needed for the architecture definition.

## 4. Decision Record (Minimum Fields)

When the user records a decision, the following are stored:
- `action` — user-selected action (watch, wait, avoid, paper-review)
- `rationale` — reason selected by the user
- `invalidationCondition` — what would make this decision wrong
- `timestamp` — when recorded

Execution is not part of the decision record. Execution is a separate boundary.

## 5. Evidence Item (Minimum Fields)

```ts
interface EvidenceItem {
  category: string;        // contract, ownership, permissions, liquidity, holders, deployer, transactions
  finding: string;        // human-readable description
  severity: "info" | "caution" | "warning" | "critical";
  status: "confirmed" | "unresolved" | "failed";
  source: string;         // where this evidence came from
  observedAt: string;     // ISO timestamp
}
```

## 6. Risk Assessment (Minimum Fields)

```ts
interface RiskAssessment {
  status: "no-issue" | "caution" | "high-risk" | "unable-to-verify";
  reasons: string[];      // top reasons behind the status
  unknowns: string[];     // what could not be verified
  recommendedAction: string; // bounded next step
}
```

## 7. Provider Boundaries (Deferred)

The following provider interfaces are defined in concept but not implemented in this commit:
- `DiscoveryProvider` — returns signal feed with provenance
- `TokenIntelligenceProvider` — returns case intelligence data
- `EvidenceProvider` — returns evidence items
- `SecurityScanProvider` — returns risk assessment
- `OutcomeProvider` — returns outcome tracking data

V2 MVP uses deterministic mock data behind these interfaces. Real connectors are added after the case domain model is in place.

## 8. Reusable Functions (Preserved)

The following existing functions are identified as reusable and must be preserved during V2 migration:

| Function | Location | Reason |
|----------|----------|--------|
| Supabase auth middleware | `src/shared/supabase/auth-middleware.ts` | Required for protected routes |
| Market data gateway | `src/shared/market-data/` | Provider abstraction for prices |
| Shield trust score | `src/domains/shield/trust-score.ts` | Reusable for DR.DEX risk |
| RugCheck client | `src/domains/shield/rugcheck-client.ts` | Security evidence source |
| GoPlus client | `src/domains/shield/goplus-client.ts` | Security evidence source |
| XP calculation | `packages/vixor-gamification/src/xp.ts` | Defer to XP ledger commit |
| Character registry | `packages/vixor-gamification/src/characters/` | Connect to UI incrementally |
| Shared UI primitives | `src/components/ui/` | Reuse for V2 surfaces |
| Paper trading adapter | `src/domains/trading/gateway/adapters/dummy-adapter.ts` | Safe execution boundary in V2 |
| Error handler | `src/shared/observability/error-handler.ts` | Consistent error states |

## 9. Functions to Isolate (Not Fix in This Commit)

The following are documented risks that must remain isolated:

| Concern | Location | Isolation Strategy (Future Commit) |
|---------|----------|-----------------------------------|
| Real-money execution | `src/domains/trading/gateway/functions.ts` | Feature flag `ENABLE_PAPER_TRADING` already exists; ensure real path is unreachable in V2 |
| Wallet signing | `src/domains/wallet/functions.ts` | Keep signature verification, remove signing UX in V2 |
| Admin API keys | `src/shared/api-keys/admin-guard.ts` | Keep guard, restrict query string access |
| In-memory rate limiting | `server/api/_security.ts` | Replace with Redis-backed limiter |
| NFT references | `src/domains/moxi/types.ts` (`nftTokenId`) | Remove field in cleanup commit |
| 3D components | `src/components/vixor/MoxiCharacter3D.tsx` | Remove in visual refactor commit |
| Floating components | `src/components/vixor/FloatingCopilot.tsx` | Remove in visual refactor commit |
| CSS variable `var(--char-vix)` | hunt and shield routes | Rename in visual refactor commit |

## 10. Out of MVP Scope

- Real-money transaction execution
- Wallet signing and custody changes
- Public leaderboards, cash prizes, NFT rewards
- Full 3D character environments
- Holographic UI, floating panels, visible AI identity
- Autonomous trading recommendations
- Production-grade intelligence graph infrastructure
- Broad connector replacement

## 11. XP and Gamification (Deferred)

XP, levels, achievements, and streaks are documented in the baseline audit but not implemented in V2 MVP. Implementation requires:
1. Case domain model in place
2. Auditable XP event ledger
3. Character progress per case stage
4. Non-financial progression rules

These will be addressed in a dedicated XP ledger commit after the case domain model.

## 12. Character Registry Status

The Character Registry at `packages/vixor-gamification/src/characters/` exists and is tested (14 tests passing). It is **not yet connected to the Active UI**. Connection happens incrementally as V2 surfaces are built.

When connected, each V2 surface must:
- Use the registry to determine the character label and icon
- Enforce `isAllowedSurface` for the current surface
- Throw or fallback on unknown character IDs
- Not duplicate character constants in component code

## 13. routeTree.gen.ts

`src/routeTree.gen.ts` is auto-generated. It must not be edited manually. If a config change causes regeneration, the diff is reviewed but not authored by hand.
