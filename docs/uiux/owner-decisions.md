# VIXOR APP — Owner Decisions & Gate Log (Agent 3, UI/UX)

**Branch:** `uiux/vixor-app-phase-1` · **Living document** · Updated: 2026-10-30 (Gate 2 revision)
**Purpose:** single place for the owner to see what is decided, what is being requested, and what is parked. Every request states exactly what approving it authorizes.

---

## 1. Decided by owner (recorded — source: owner instructions)

| # | Decision | Recorded | Consequence |
|---|---|---|---|
| D-01 | One app at a time: current authorization is **vixor-APP only** (no vixor-hunt/shield/trade/tg-content-bot) | master prompt | Agent 3 scope limited to this repo |
| D-02 | **Feature preservation mandate**: no route removal/rename/hiding; behavior-preserving UI work only | master prompt | `feature-preservation-map.md` is the Phase-4 contract |
| D-03 | **No merge / no deploy / no production, backend, or database changes** without owner approval; Draft PRs only | master prompt | All Agent 3 PRs stay draft until approved |
| D-04 | Phase 0–3 work acknowledged; **PR #28 was merged by owner** (2026-10-30 03:12:31Z — see §5) | repo events | Phase 0–3 docs + V6.1 tokens are now part of `main` |
| D-05 | **Product vision confirmed:** premium, modern, **independently valuable SaaS** — NOT a trading terminal or dashboard-heavy interface | Gate 2 revision | Design direction Rev. 2 recalibrated accordingly |
| D-06 | **Characters are product experience**, not decorative mascots or a Crew navigation category alone | Gate 2 revision | `character-experience-map.md` produced |
| D-07 | **VIXOR consumes character identities/assets via a stable integration contract** with the Meme & Character App direction (Agent 1); VIXOR does not replace Character Studio | Gate 2 revision | Contract spec proposed (experience map §5); no artwork invented by VIXOR |
| D-08 | **V6 design tokens preserved; no rebrand; no destructive redesign** | Gate 2 revision | Rev. 2 adds zero tokens; all laws additive |
| D-09 | No Phase 4 implementation until owner approves the revised direction | Gate 2 revision | This document + companions are the approval package |

## 2. Requested now — Gate 2 approval package (approve/reject each)

**R-1 — Revised design direction (Rev. 2).** `design-direction.md` v2: crew-with-evidence positioning, anti-dashboard composition rules (hero question + ranked feed; ≤6 equal-weight tiles; 1 chart per mobile view), character presence system, Desk as the single deliberate "terminal" surface. *Approving authorizes: Phase 4 page passes under these laws (still staged, still screenshot-verified).*

**R-2 — IA Option B "Crew Rail"** (`ia-proposal.md`): dock → **Today · Discover · Crew · Desk · More** + global omnibox + regrouped More panel + new `/crew` hub. All 47 routes preserved; displaced dock items get stable More positions + contextual entries; every orphaned route ≤2 taps. *Approving authorizes: `BottomBar`/`MorePanel` restructure, new `/crew` route, nav-string/i18n updates — one reviewable stage with before/after screenshots.*

**R-3 — Character experience system** (`character-experience-map.md`): roles/boundaries per character, attribution rules (persona chips, hand-off cards, single-owner rule), orb re-skin to `--char-moxi` (fixes UX-17), GovernorRiskPanel→DR.DEX / CoachOverlay→MOXI attribution, Crew Console concept. *Approving authorizes: Phase 4 identity primitives (CrewChip, hand-off card) + the C1→C5 concept build order.*

**R-4 — Character asset integration contract** (experience map §5): versioned manifest keyed by `CharacterId`; avatars/states/full-body/Lottie-with-static-fallback; colors by token name; monogram fallback when absent; approval flow owner-side. *Approving authorizes: Agent 3 to send the contract spec to Agent 1 via the owner and to build the consumption layer (never the art).*

**R-5 — Home re-title** `/` → "Today" (fixes UX-02) as part of R-2. *Approving authorizes the title/copy change; data wiring untouched.*

## 3. Coordination items (no code, information routing)

- **→ Agent 1 (Meme & Character App):** manifest schema sign-off; state list (`neutral/thinking/success/error`); first asset pack target + cadence; RTL/dark/light variants. Sent only after R-4 approval.
- **→ Agent 2 (backend):** unchanged from previous phase — UX-11 route-guard approach; DATA-01 dual-table visibility; ENG-01 `@walletconnect/sign-client` declaration (dependency change needs owner sign-off); staging/test credentials for authenticated verification; Arabic UI body font choice (recommend IBM Plex Sans Arabic or Noto Kufi Arabic, OFL).

## 4. Parked (explicitly not this phase)

- **D-14 — v2 case workflow promotion** into main IA (requires real providers replacing fixtures; mock-data rule blocks promotion today).
- Multi-character conversation, character memory APIs, voice — not proposed; separate future proposals.
- `/loop` legacy alias consolidation — 🔒 preservation map.
- Premium page visual pass — deferred pending PR #26/#27 resolution (payments-owned).

## 5. Anomaly & state log (transparency)

- **PR #28 merged by owner at 2026-10-30T03:12:31Z** (events: `ready_for_review` 03:12:13Z → `merged` 03:12:31Z, actor `kam65624-cmd`). The Gate-2 instruction to "keep PR #28 open as Draft" cannot be executed retroactively — GitHub cannot reopen a merged PR, and Agent 3 did not perform the merge. **Resolution:** Phase 0–3 content is preserved in `main` (merge `62df4b0`); the Gate 2 revision continues on the **same branch** and is delivered as a **new Draft PR** referencing #28. No history rewritten; nothing discarded.
- Credentials: the owner's initial credentials (GitHub PAT, Cloudflare keys) were received in-chat. They are used only for repo operations on this project, are never written into commits/docs/logs, and **rotation is recommended** given they transited chat.
- All Gate-2-revision deliverables are **documentation + one mockup HTML only** — zero application code changes in this round, per D-09.
