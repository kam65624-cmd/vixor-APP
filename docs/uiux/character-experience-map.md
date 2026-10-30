# VIXOR APP — Character Experience Map (Gate 2 Revision)

**Agent:** Agent 3 — UI/UX Design Director · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1`
**Status: PROPOSED — requires owner approval (Gate 2, revised) before Phase 4 implementation.**

> **⚠️ PAUSE NOTICE (2026-10-30, later — supersedes implementation aspects of this document):** the owner has taken **direct control of character creation and visual identity**. All UX-behavior proposals in this map are **on hold**; no Phase 4 implementation, no navigation restructuring, no character identity changes. The artwork layer (§5) is now owner-controlled: VIXOR APP waits for **owner-approved character sheets, expressions, poses, animations, and interaction specifications**. The detailed consumption spec now lives in **`character-asset-readiness.md`** (verified integration points, asset formats/sizes, states, loading/fallback, a11y/i18n/RTL, manifest contract, asset→surface mapping, dependency list) — it supersedes §5 below wherever they differ. **Ownership correction:** Character Studio / Meme & Character App ownership is **TBD** (not assumed to be Agent 1, whose current scope is TG Content Bot + Content Operations). Monogram avatars remain the current fallback system — **not a substitute for the planned owner-approved asset system**.
**Companions:** `design-direction.md` (rev. 2) · `ia-proposal.md` · `screen-concepts.md` · `owner-decisions.md`

**Why this document exists.** The owner's confirmed product vision (2026-10-30): VIXOR APP is a *premium, modern, independently valuable SaaS product* — not a traditional trading terminal or dashboard-heavy interface — and the four characters are **part of the actual product experience, not decorative mascots or a Crew navigation category alone**. This map defines what that means at the level of roles, screens, interactions, and identity — building only on capabilities that exist in the code today, and clearly separating what is proposed.

---

## 0. Product frame: the Decision Loop is the product

VIXOR's differentiator is not data (DexScreener/Birdeye have data) and not charts (TradingView has charts). It is a **crew of specialists that turns market noise into an evidenced decision**. The codebase already encodes this as the Decision Loop — `src/shared/characters.ts` orders the crew "MOXI → MR.VIGO → DR.DEX → ECHO", and the v2 case state-machine (`src/domains/case/state-machine.ts`) walks stages `target_selected → signal_explained → evidence_ready → risk_assessed → decision_recorded → tracking → outcome_reviewed` with each stage owned by a character.

**Design consequence (the organizing law of this revision):** every primary surface of the app is a moment in the Decision Loop, and the character who owns that moment is visibly accountable for it. The user should always be able to answer three questions within one glance:

1. **Who** is working for me right now? (attribution — §3)
2. **What** did they produce, and on **what evidence**? (Evidence Glass — `design-direction.md` §6)
3. **Where am I** in the loop? (loop position — stage chips / Crew hub, `ia-proposal.md`)

This is what makes the characters *product experience* rather than mascots: they are the accountability layer for every piece of synthesized content in the app.

**What this does NOT mean:** characters do not replace features. `/swap`, `/trade-desk`, `/charts`, `/portfolio`, forex sections, journal, daily-loop — all preserved per `feature-preservation-map.md`. Characters frame, verify, and contextualize; they do not swallow the toolset.

---

## 1. The crew — roles, boundaries, and UX behavior

Identity sources (all existing, verified): semantic registry `packages/vixor-gamification/src/characters/registry.ts` (roles, `allowedSurfaces`, tones); presentation bridge `src/shared/characters.ts` (icons, monograms, `--char-*` tokens, routes); i18n `src/shared/characters-i18n.ts` (EN/AR, tested by `characters-i18n.test.tsx`); card primitive `src/components/characters/CharacterGuide.tsx` (6 states, a11y live region).

### 1.1 MOXI — the Guide (finds the opportunity)

| | |
|---|---|
| **Registry role** | `main_guide` — "Main character and face of the product" |
| **Registry surfaces** | onboarding, discovery, guidance |
| **Tone** | curious, encouraging, concise, never overconfident |
| **Identity tokens** | `--char-moxi` `#06b6d4` (+dim/border/glow) · icon `Activity` · monogram **MO** |
| **Bridge route** | `/alpha` (CTA target today; MOXI's lived surface is Home) |

**Responsibilities.** Orientation and momentum: onboarding, the daily briefing (Home), opportunity discovery, guidance across the loop, and delegation to the other three. MOXI is the only character who speaks proactively; the others respond to work.

**Boundaries (never).** MOXI never issues risk verdicts (that is DR.DEX's), never presents an evidence file as complete (MR.VIGO's), never claims outcomes or lessons (ECHO's), and never executes anything. Registry enforces this today via `allowedSurfaces: ["onboarding","discovery","guidance"]`.

**Exists today (verified in code).**
- Home: time-of-day greeting (EN/AR), `MOXI_QUICK_ACTIONS` prompts, MOXI Hero input, EnergyOrb, CharacterGuide card, unified feed (`routes/_authenticated/index.tsx`).
- Global floating orb + chat drawer (`FloatingCopilot.tsx`, `CopilotDrawer.tsx`, `useCopilot`).
- Backend agents (server fns, auth-gated): `coachTrade`, `assessRisk`, `scoreOpportunity`, analyst report (`domains/moxi/agents.ts`, `server/*.agent.ts`) + tool registry (`analyzePair`, `trackSignal`, `createPriceAlert`, …) + context engine + notification hub + prompt.
- Persona system: user-customizable name/personality/communication style, 8 avatar variants, `moxi_personas` table (`domains/moxi/persona.ts`).
- Onboarding: `OnboardingModal.tsx` (first run) + `/v2/onboarding` (3-step MOXI-guided demo case walkthrough).
- Trade desk: `CoachOverlay` (live coaching during trade setup).

**Proposed UX behavior (Gate 2 → Phase 4).**
- **Home becomes "Today" — MOXI's briefing** (concept C1): greeting + one-line market pulse + the single most important attention item + crew status strip + ranked attention feed. MOXI's voice, `--char-moxi` chrome.
- **The orb becomes the Crew Console** (concept C5): the drawer keeps MOXI chat (tools exist) but gains crew-delegation — "ask VIGO to investigate this token" hand-off cards that route to `/investigate` with context. MOXI is the front door to the other three.
- **Onboarding introduces the crew, not features** (concept C1b): the existing modal becomes a 4-step flow — MOXI welcome ("decisions with evidence, no wallet needed") → meet the crew (4 identity cards) → focus picker (assets + risk style, persisted to existing preferences) → first task (guided scan or demo case via `/v2/onboarding`).
- **Verbal signature:** MOXI speaks in first person, ≤2 sentences per card, always ends with an actionable next step.

### 1.2 MR.VIGO — the Investigator (gathers the evidence)

| | |
|---|---|
| **Registry role** | `investigator` — "Collects and presents evidence" |
| **Registry surfaces** | investigation, evidence |
| **Tone** | observant, methodical, evidence-first, skeptical |
| **Identity tokens** | `--char-vigo` `#8b5cf6` (+dim/border/glow) · icon `Search` · monogram **MR** |
| **Bridge route** | `/investigate` |

**Responsibilities.** Building the evidence file: token/wallet investigation, whale flows, on-chain behavior, market context aggregation. VIGO turns "this looks interesting" into "here is what is verifiably true, source by source."

**Boundaries (never).** VIGO never scores risk, never recommends, never speculates beyond sources. Evidence cards carry source chips + timestamps; if a source is unavailable, the card says so (degraded state) instead of guessing. Registry: `allowedSurfaces: ["investigation","evidence"]`.

**Exists today (verified in code).**
- `/investigate` (investigation workflow, CharacterGuide wired), `domains/mr-vigo/*` (functions, types).
- HUNT domain surfaces: `/hunt/radar`, `/hunt/whales`, `/hunt/token/$address`, `/hunt/verified/$id` (whale classifier, acceleration, Birdeye/DexScreener clients).
- v2 case evidence stage (`/v2/case/$caseId/evidence`) with provider interface (`domains/case/providers/evidence-provider.ts`).
- **Known gaps:** `/investigate` and all `/hunt/*` have no global-nav entry (UX-01); prior handoff flagged TS errors to re-verify.

**Proposed UX behavior.**
- **Evidence File pattern** (concept C2/C4): a per-target stack of evidence cards — each card = one claim + source chip (`BIRDEYE · 12s ago`, `--verified` dot) + confidence. Realized with the proposed `EvidenceCard`/`SourceChip` primitives (`design-system.md` §4) under VIGO's identity.
- **VIGO micro-chips in Discover rows** (concept C2): a 16px status dot + "checked" glyph per token row summarizing what VIGO already knows (only when a scan/case exists — never fabricated; no data = no chip).
- **Hand-off reception:** when MOXI delegates, VIGO's surface opens with a transfer banner ("MR.VIGO taking over — gathering evidence on $XYZ") + working state on CharacterGuide.

### 1.3 DR.DEX — the Risk Analyst (quantifies the risk)

| | |
|---|---|
| **Registry role** | `risk_analyst` — "Interprets evidence, identifies threats, gives a clear risk picture" |
| **Registry surfaces** | risk_assessment, decision_review |
| **Tone** | clinical, precise, protective, action-oriented |
| **Identity tokens** | `--char-dex` `#ef4444` (+dim/border/glow) · icon `ShieldCheck` · monogram **DR** |
| **Bridge route** | `/risk` |

**Responsibilities.** Risk intelligence: security scanning (GoPlus/RugCheck), trust scores, exposure analysis, risk verdicts (GO / CAUTION / BLOCK with sizing), and the Risk Governor's pre-trade checks. DEX is the character users learn to trust before they trust any signal.

**Boundaries (never).** DEX never says "buy" or "sell" — verdicts are about **risk and exposure**, not direction; never fabricates findings (consumes VIGO's evidence + scanner output); verdicts always name what would change them (invalidation). Registry: `allowedSurfaces: ["risk_assessment","decision_review"]`.

**Exists today (verified in code).**
- SHIELD surfaces: `/shield` (forensics dashboard), `/shield/scanner`, `/shield/trust/$address`, `/shield/cases`, `/shield/alerts`, `/shield/exposure` (GoPlus + rugcheck clients, trust-score engine).
- `/risk` — DR.DEX decision surface (paper decisions, `logPaperDecision`, no DB write).
- `domains/dr-dex/*` (candlestick analyzer, pattern detector) + `domains/risk-governor` (governor engine, risk rules).
- Trade desk: `GovernorRiskPanel` (Allow/Warning/Blocked states) — currently labeled "Risk Governor" with **no DEX attribution**.
- v2 case risk + decision stages.
- **Known gaps:** `/shield/*` + `/risk` have no global-nav entry (UX-01); severity/status mappers duplicated across shield pages (UX-13).

**Proposed UX behavior.**
- **Risk Verdict card pattern** (concept C3): the canonical output block — verdict pill (GO/CAUTION/BLOCK using existing `--shield-*` semantic scale, never `--char-dex` for data), findings grouped by source with chips, exposure sizing, invalidation line. DEX's monogram on the card header.
- **DEX seal on token pages** (concept C4): `/token/$symbol` gains a persistent risk-seal row — populated only when a scan exists (real data only); otherwise an explicit "Not yet assessed — ask DR.DEX" action to the scanner.
- **Attribution correction:** `GovernorRiskPanel` and `CoachOverlay` outputs get persona chrome in Phase 4 (governor → DEX identity; coach → MOXI identity). Presentation-only change; backend stays in `domains/moxi`.

### 1.4 ECHO — the Memory (records the outcome)

| | |
|---|---|
| **Registry role** | `memory_learning` — "Unified memory and learning layer" |
| **Registry surfaces** | history, outcome_review, learning |
| **Tone** | quiet, reflective, contextual, non-intrusive |
| **Identity tokens** | `--char-echo` `#10b981` (+dim/border/glow) · icon `BarChart3` · monogram **EC** |
| **Bridge route** | `/echo` |

**Responsibilities.** Closing the loop: recording decisions and their rationale, tracking outcomes (signals, positions, cases), weekly review, streaks, and turning results into personal learning. ECHO is why the product gets better the longer you use it.

**Boundaries (never).** ECHO never initiates (quiet by design — surfaces only in review contexts and digest notifications), never predicts, never recommends; it reflects **only recorded history**. Registry: `allowedSurfaces: ["history","outcome_review","learning"]`.

**Exists today (verified in code).**
- `/echo` (overview + stats, `getEchoOverview`), `/tracking` (active signal trackings).
- `domains/echo/*` + `domains/signal-tracking/*` (transition engine, auto-track, hit-TP invariant tests).
- Daily loop streaks + `AnalystReportPanel`; `/review` weekly review (trades domain, `weekly-review.ts`).
- v2 case tracking + outcome stages.
- **Known gaps:** `/echo`, `/tracking`, `/review` not in global nav (UX-01); dual-table split `trades` vs `user_trades` visible to users (DATA-01, Agent 2).

**Proposed UX behavior.**
- **Outcome timeline** (concept C4): every tracked decision gets a vertical timeline (decision → rationale → transitions → outcome → lesson) on `/tracking` detail and future case pages; ECHO's monogram on the header.
- **Loop-closure receipts:** when a tracked signal hits TP/SL, ECHO posts a receipt card to the Home attention feed (via existing notification channels + events system) — "closed loop: your 10/24 LONG hit TP1 (+4.2%). Lesson logged."
- **EOD ritual:** the daily-loop EOD phase gets ECHO identity (it already records the review); MOXI hands over visibly at day's end.

---

## 2. How the crew works together (the visible relay)

The loop hand-off pattern, generalized from the v2 case `STAGE_LABELS` stage→character mapping that already exists:

```
MOXI finds        MR.VIGO verifies       DR.DEX quantifies      ECHO records
(scan/briefing)   (evidence file)        (risk verdict)         (outcome + lesson)
     └── hand-off card ──┘               └── hand-off card ──┘
```

**Hand-off card anatomy** (new pattern, Phase 4): `[monogram] MR.VIGO · took over from MOXI · "Gathering evidence on $XYZ" · [View progress]`. It appears (a) in the attention feed, (b) as a transfer banner on the destination surface, (c) as a line in the Crew hub activity list. Every hand-off is a link — the user can always follow the work.

**Delegation vs. direct entry.** Users can always go straight to any character's surface (Crew hub, omnibox, links). The relay is the *narrated* path, not a required one. Nothing in the loop blocks anything that works today.

---

## 3. Attribution system — how users know who is handling each task

Five rules, all implemented with existing primitives plus the two proposed ones (`CrewChip`, hand-off card):

1. **Persona chip on every authored block.** Any block whose content was synthesized by the product (not raw market data) carries a chip: monogram + name + character border token. Raw data (prices, candles, order books) carries **no** character — characters speak only for judgment, not for facts. This keeps the crew trustworthy instead of noisy.
2. **Active-character chrome.** The Crew Console drawer and any character-led surface tint its chrome with the active character's `--char-*` token. One accent per view law is preserved: character tokens are identity, not decoration.
3. **Stage chips on loop surfaces.** Wherever a decision-in-progress appears, the stage chip shows both stage and owner (as v2 already does: "Evidence · MR.VIGO").
4. **Single-owner rule.** Exactly one character per artifact type: orientation → MOXI · evidence → VIGO · verdict → DEX · outcome → ECHO. No blended authorship ("MOXI & DEX say…") — ambiguity destroys accountability.
5. **Quiet by default.** ECHO never interrupts; DEX speaks only on risk; VIGO speaks only with sources; MOXI speaks at most once per view. Character presence is rationed so the product stays premium, not cartoonish.

---

## 4. Character identity consistency (visual system)

**Three layers, one source of truth each:**

| Layer | Source of truth | Status |
|---|---|---|
| 1. Semantic (who they are) | `packages/vixor-gamification/src/characters/registry.ts` | ✅ exists, tested (`character-registry.test.ts`) |
| 2. Presentation (how they render) | `src/shared/characters.ts` bridge → `--char-*` tokens + icons + monograms; `CharacterGuide` as the single card primitive; per-character gradient backdrops (`styles.css` L1121–1170) | ✅ exists, tested (`characters-i18n.test.tsx`, `design-token-hygiene.test.ts`) |
| 3. Artwork (illustrated assets) | **External — owner-controlled** (Character Studio direction, ownership TBD), consumed via the owner-approved asset contract (§5; detailed spec `character-asset-readiness.md` §7) | ❌ not present today — monogram avatars are the complete current state (fallback, not final) |

**Consistency laws (existing, restated as gates):**
- Character color ONLY via `--char-*` CSS variables — never hex literals (bridge enforces; hygiene test guards).
- Character tokens are quarantined to identity chrome (avatars, rings, section headers, chips). They never encode data semantics — `--char-dex` red is DEX's *identity*, risk *levels* use `--shield-*`. (Mirrors the domain-accent quarantine law.)
- One card primitive: every character-led guidance moment uses `CharacterGuide` (6 states, live region) — no per-page character reimplementations.
- i18n: all character copy through `characters-i18n` (EN/AR), never hardcoded.

**Identity drift found in baseline (new issue UX-17, to fix in Phase 4):** `FloatingCopilot.tsx` renders MOXI's orb with a hardcoded indigo/violet gradient + generic `Bot` icon + infinite bob loop — it matches neither `--char-moxi` (`#06b6d4`) nor the motion law (no ambient loops) nor the monogram system. The orb is the crew's most-seen surface; Phase 4 re-skins it to MOXI's true identity. `CopilotDrawer.tsx` likewise has no persona chrome and a generic empty state (UX-19).

---

## 5. Integration contract for owner-approved character assets

> **Amended 2026-10-30 (pause directive):** the counterparties below are corrected — the **owner** directly controls character creation and visual identity; **Character Studio ownership is TBD** (its repository/product owner must be established separately); **Agent 1's current scope is TG Content Bot & Content Operations** (a fellow consumer, not the Studio owner). The authoritative, more detailed contract spec is now `character-asset-readiness.md` §7 (manifest schema, intake rules, approval flow). This section is retained for context.

**Principle (owner-set):** VIXOR APP consumes character identities and approved assets through a **stable integration contract**. It does not generate, fork, or replace character IP. The independent Character Studio product (ownership TBD) remains a separate creative source; the owner is the direct approval authority for all character art.

**Division of ownership (corrected):**

| Concern | Owner |
|---|---|
| Character creation, visual identity, sheets, expressions, poses, animations | **Owner (direct control)** |
| Character Studio / Meme & Character App product | **TBD — to be established separately; not assumed to be Agent 1** |
| TG Content Bot — content production & publishing from approved identities | Agent 1 (current scope) |
| In-product behavior, UX, attribution, surfaces | VIXOR APP (Agent 3) — asset **consumer** + presentation owner |
| Asset approval for product use | Owner |
| Semantic registry (roles/surfaces/tones) | VIXOR repo (`vixor-gamification`) — mirrors canon; changes need owner approval |

**Proposed asset manifest contract** (schema proposal only, no code; **superseded in detail by `character-asset-readiness.md` §7** — counterparties are the owner and, once established, the separately-owned Character Studio):
- Versioned manifest (JSON) keyed by `CharacterId` (`moxi | mrVigo | drDex | echo` — matching the registry, machine ids as canonical keys).
- Per character: `avatar` (24/32/48/64/128 px, PNG/SVG), `states` (`neutral | thinking | success | error` — mapping 1:1 to `CharacterGuide` states), `fullBody` (onboarding moments only), optional `animation` (Lottie, ≤120KB, reduced-motion-safe static fallback REQUIRED), `altText` (a11y), `dark`/`light` variants, `rtl` variant where art is directional.
- Color references by **token name** (`char-moxi`), never hex — VIXOR's `styles.css` stays the color source of truth in-app.
- `approvedFor` usage field + semver version. VIXOR pins a version per release and degrades gracefully: **missing asset → monogram avatar** (the current system) — no broken states, ever.
- Rejection criteria we will enforce on intake: assets that violate the token quarantine, exceed motion laws (ambient loops), or arrive without alt-text.

**What VIXOR will NOT do:** no invented artwork, no AI-generated stand-in characters, no new characters without owner approval + registry change + asset pack, no forked identity variants (persona customization stays within the existing `moxi_personas` system: name/style/variant — never identity), **and monograms are never treated as the final character asset system — they are the fallback until owner-approved art arrives**.

**Coordination items logged for the owner** (character assets; via the decision log, not direct code changes): approved character sheets, expression/state library (neutral/thinking/success/error), poses & interaction specs, animation specs with static posters, asset pack + manifest hosting, Character Identity Contract sign-off, Character Studio ownership establishment. Full dependency list: `character-asset-readiness.md` §10 (DEP-1…DEP-10). Tracked in `owner-decisions.md` §3.

---

## 6. Existing vs. proposed capability matrix (requirement: no invented features)

| # | Capability | Status today (evidence) | Proposed in this revision | Phase |
|---|---|---|---|---|
| 1 | Character registry (roles/surfaces/tones) | ✅ `vixor-gamification/registry.ts` + tests | unchanged (the owner-controlled asset contract adds assets, not roles) | — |
| 2 | Presentation bridge + `--char-*` tokens | ✅ `shared/characters.ts`, `styles.css` | unchanged; consumed more consistently | 4 |
| 3 | CharacterGuide card (6 states, a11y) | ✅ used on Home/Discover/Investigate/Risk/Echo | unchanged; becomes the standard for all guidance moments | 4 |
| 4 | EN/AR character copy | ✅ `characters-i18n.ts` + tests | extended copy for new surfaces (same pipeline) | 4 |
| 5 | MOXI greeting + quick actions + hero input | ✅ home route | recomposed into "Today" briefing (same data: `getHomeMarketData`, feed) | 4 |
| 6 | Floating orb + chat drawer | ✅ but generic: wrong colors, no persona chrome, generic empty state | re-skinned to `--char-moxi`, becomes Crew Console with delegation (UX-17/19) | 4 |
| 7 | MOXI tool use in chat | ✅ `domains/moxi/tools.ts` (analyzePair, trackSignal, createPriceAlert…) | surfaced as visible tool chips + receipts in drawer | 4 |
| 8 | MOXI persona customization | ✅ `moxi_personas`, 8 avatar variants | entry point moved into Crew Console; system unchanged | 4 |
| 9 | Crew delegation (MOXI → VIGO/DEX/ECHO) | ⚠️ partial: v2 case stages encode it; no general UI | hand-off cards + transfer banners (new pattern) | 4 |
| 10 | VIGO investigation surface | ✅ `/investigate` + `domains/mr-vigo` | gets global nav entry (IA decision) + evidence-file layout | 4 |
| 11 | HUNT whale/trend data | ✅ `/hunt/*` | attributed under VIGO identity in Crew hub linking (no route change) | 4 |
| 12 | DEX security scanning | ✅ `/shield/*` + GoPlus/rugcheck + trust-score | Risk Verdict card pattern + DEX seal on token pages | 4 |
| 13 | Risk Governor panel | ✅ trade-desk `GovernorRiskPanel` (un-attributed) | DEX persona chrome (presentation only) | 4 |
| 14 | Paper decisions | ✅ `/risk` `logPaperDecision` | folded into Decision card flow (behavior unchanged) | 4 |
| 15 | ECHO overview/stats | ✅ `/echo` | + outcome timeline pattern; global nav entry | 4 |
| 16 | Signal tracking + transitions | ✅ `domains/signal-tracking` (auto-track, transitions, invariant tests) | loop-closure receipts surfaced in Home feed | 4 |
| 17 | Weekly review / daily loop | ✅ `/review`, `/daily-loop` | ECHO identity on review moments | 4 |
| 18 | v2 case workflow (stage→character map) | ✅ `/v2/*` with fixtures (experimental) | pattern reference; promotion to main IA is a separate owner decision (mock-data rule) | — |
| 19 | Character artwork/illustration | ❌ none (monograms only) | **NOT proposed as built — owner-controlled.** Consumed via owner-approved asset pack + manifest contract when delivered; monogram fallback until then. Monograms are the fallback, **not a substitute** for the planned asset system | gate (paused) |
| 20 | New character abilities (memory APIs, multi-character chat, voice) | ❌ none | **NOT proposed** — any such capability is a separate proposal with Agent 2 | — |

---

## 7. Measurement (how we know the crew works)

Using the existing analytics layer (`src/shared/analytics.ts`, Mixpanel) — instrument in Phase 4, review after each stage: crew hub open rate; hand-off follow-through (card shown → destination reached); attribution comprehension (session-replay sample, manual, honest label); Crew Console delegation vs. direct entry ratio; time-to-first-decision for new users (onboarding completion → first tracked decision); ECHO receipt engagement. **No vanity metrics; no invented baselines — first measurement is the baseline.**

## 8. Preservation & risk notes

- Zero routes removed/renamed; zero API changes; zero token changes in this revision. Everything in §1 "proposed" is presentation-layer composition of existing data and functions.
- Biggest risks: (a) character presence degrading into noise — mitigated by §3.5 rationing; (b) attribution ambiguity between DEX-verdict and trading semantics — mitigated by token quarantine (§4); (c) asset dependency on **owner approval timing** (no longer an agent-side dependency) — mitigated by monogram fallback (§5) and the readiness package; (d) dock change displacing muscle memory — mitigated by IA option choice + reachability table (`ia-proposal.md` §3.5) + More-panel stability.
- **Pause-state risk note (2026-10-30):** all §1 "Proposed UX behavior" items and the C1–C5 concepts are on hold until the owner approves both the character assets and the Phase-4 go-ahead. Nothing in this map has been implemented.
- Open owner questions consolidated in `owner-decisions.md`.
