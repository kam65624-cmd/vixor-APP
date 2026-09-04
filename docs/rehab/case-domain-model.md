# VIXOR V2 — Case Domain Model

Branch: rehab/case-domain-model
Date: 2026-09-04
Status: Definition only — no UI, no routes, no provider implementations.

## Purpose

The Case is the root object that links the entire V2 decision loop:

```
DISCOVER → UNDERSTAND → VERIFY → DECIDE → EXECUTE → TRACK → LEARN
```

Every entity in the V2 loop is associated with a Case via `caseId`. This model is the shared contract between the MOXI discovery surface, the MR.VIGO evidence surface, the DR.DEX risk surface, the decision record, and the ECHO history surface.

## Scope of This Commit

This commit introduces:
1. Type definitions for all V2 case entities.
2. A state machine for case stage transitions.
3. Sample fixtures covering low-risk, caution, and high-risk cases.
4. Unit tests for types, transitions, fixtures, and validation rules.
5. This documentation file.

This commit does **not** introduce:
- UI components or screens.
- Routes or navigation changes.
- Provider interfaces (next commit).
- XP logic (XP event type only, no calculation).
- Wallet, transaction, or execution changes.
- Changes to `routeTree.gen.ts`.

## Entities

All entities live in `src/domains/case/`.

| Entity | File | Purpose |
|--------|------|---------|
| `Case` | `types.ts` | Root object linking the entire journey |
| `Target` | `types.ts` | Token or wallet under review |
| `Signal` | `types.ts` | Explains why a target entered discovery |
| `EvidenceItem` | `types.ts` | A single inspectable fact or finding |
| `SecurityScan` | `types.ts` | Groups the investigation state |
| `RiskAssessment` | `types.ts` | Interprets evidence into a risk view |
| `Decision` | `types.ts` | The user's deliberate choice |
| `Outcome` | `types.ts` | What happened after the decision |
| `XPEvent` | `types.ts` | Type only — no XP logic in this commit |
| `CaseBundle` | `types.ts` | Aggregated view, not persisted |

## Case Stages

The state machine in `state-machine.ts` defines ten stages:

```
new
→ target_selected
→ signal_explained
→ evidence_loading
→ evidence_ready
→ risk_assessed
→ decision_pending
→ decision_recorded
→ tracking
→ outcome_reviewed
```

- Forward transitions along the canonical path are allowed.
- Skipping stages is rejected.
- Backward transitions are rejected.
- The terminal stage is `outcome_reviewed`.

## Validation Rules

These rules are enforced by callers (the type system cannot express them all):

1. **Case without Target is invalid** — `targetId` must be non-empty.
2. **Every Evidence must be linked to a `caseId`**.
3. **RiskAssessment must reference a known `scanId`**.
4. **Decision must have a non-empty `rationale`**.
5. **Outcome must reference a valid `decisionId`**.
6. **A partial or failed scan must not produce a `no-issue` risk status**.

## Evidence vs Risk Assessment

- `EvidenceItem` describes facts (what was observed, where, when).
- `RiskAssessment` interprets facts (what they mean for risk).

A scan can produce many `EvidenceItem` records. A single `RiskAssessment` is derived from them. The separation prevents the UI from conflating raw findings with risk conclusions.

## XPEvent Type

`XPEvent` is defined as a type only. No XP calculation, aggregation, or awarding logic is added in this commit. XP event awarding will be implemented in a dedicated XP ledger commit after the case domain model is in use.

The sample `XPEvent` has `amount: 0` to make it explicit that no XP logic is applied yet.

## Fixtures

Three sample cases are provided in `fixtures.ts`:

| Fixture | Stage | Risk Status | Decision | Purpose |
|---------|-------|-------------|----------|---------|
| `lowRiskCase` | `outcome_reviewed` | `no-issue` | `watch` | Complete evidence, low risk |
| `cautionCase` | `decision_recorded` | `caution` | `wait` | Partial scan, unresolved findings |
| `highRiskCase` | `tracking` | `high-risk` | `avoid` | Confirmed critical findings |

All fixtures:
- Use `SAMPLE` or `DO_NOT_USE` markers in addresses.
- Contain no real addresses, private keys, API keys, passwords, or secrets.
- Use ISO 8601 timestamps in the `2026-01-01` to `2026-03-01` range.
- Are clearly marked as sample data.

## Connection to Character Registry

The Case domain does not depend on the Character Registry. Character assignment to surfaces is handled at the UI layer, not the domain layer. The registry at `packages/vixor-gamification/src/characters/` remains the source of truth for character identity and allowed surfaces.

## Next Steps (Out of This Commit)

1. Provider interfaces for discovery, evidence, security scan, and outcome tracking.
2. Mock provider implementations that use these fixtures.
3. UI surfaces that consume the Case domain.
4. XP ledger that reads `XPEvent` records.
5. Persistence layer (if/when needed) — current design is in-memory.

## File Map

```
src/domains/case/
├── types.ts          # All entity type definitions
├── state-machine.ts  # Case stage transitions
├── fixtures.ts       # Sample data
├── index.ts          # Public exports
└── __tests__/
    └── case-domain.test.ts  # Unit tests
```
