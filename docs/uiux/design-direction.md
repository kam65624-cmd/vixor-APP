# VIXOR — Design Direction (Phase 3, Rev. 2 — Gate 2 Revision)

**Agent:** Agent 3 — UI/UX Design Director · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1`
**Status: PROPOSED — requires owner approval (Gate 2) before Phase 4 implementation.**

**Positioning brief (owner-confirmed, 2026-10-30):** VIXOR APP is a **premium, modern, independently valuable SaaS product** run by a crew of specialists — **not a traditional trading terminal, not a dashboard-heavy interface.** The four characters (MOXI, MR.VIGO, DR.DEX, ECHO) are part of the actual product experience, not decorative mascots.

**Revision note (v1 → v2).** Rev. 1 framed the product as an *instrument* ("Signal over Chrome", briefing-room grammar). The owner's vision keeps the discipline but changes the product's center of gravity: the loudest signal is the **crew's judgment, with evidence**. Rev. 2 recalibrates positioning, composition, and the character system; it **withdraws nothing from V6** — every token, law, and preservation rule from Rev. 1 survives. New companions: `character-experience-map.md` (roles/attribution), `ia-proposal.md` (replaces §9 below), `screen-concepts.md` (C1–C5), `owner-decisions.md`.

---

## 1. Why this direction (product-grounded, not taste-grounded)

1. **The product is a decision, not a dashboard.** VIXOR's users don't want more data — DexScreener has data. They want to know *what deserves attention, whether it's safe, and what happened last time*. Every screen's first job is to answer a question, not to fill a grid.
2. **The differentiator is a crew with receipts.** MOXI/MR.VIGO/DR.DEX/ECHO justify trust only if their output carries evidence — source chips, timestamps, confidence (Evidence Glass). Attribution is a first-class system (`character-experience-map.md` §3), not a decorative flourish.
3. **Independently valuable = valuable before any trade.** The product must deliver worth with zero wallet connected: intelligence (Today briefing), safety (DEX verdicts), decision craft (structured rationale + tracked outcomes). Execution (Desk/Swap) is a feature — one dock slot — not the identity.
4. **The existing system is already 70% there.** V6's surface ladder, semantic trading colors, mono-numeral rule, character token registry, and `CharacterGuide` mean the cheapest premium win is *discipline + composition*, not reinvention.

## 2. Light/dark strategy

**Dark-first; light maintained at parity.** Rationale unchanged from Rev. 1: Telegram-native ambient, semantic colors tuned for dark, deployed default. Light stays fully supported; every new token ships both values; **no automatic theme switching** — the user setting is authoritative.

## 3. Color architecture (rules layered on V6 tokens — no new brand hues)

1. **Semantic apartheid (law):** `--bullish/--bearish/--neutral-wait` appear ONLY as data meaning. Never decorative, never chrome, never section theming.
2. **Character identity law (revised from Rev. 1 — correction):** each character's identity chrome uses **that character's own `--char-*` token** (moxi cyan · vigo violet · dex red · echo green) — avatar rings, persona chips, drawer chrome, stage chips. Rev. 1's "purple = crew identity" rule is **withdrawn**: violet is MR.VIGO's identity, and one shared crew color would destroy attribution (single-owner rule). The crew's *collective* moments (dock icon, hub header) either stay neutral or show all four tokens together — never a single "crew purple". `--secondary-accent` remains a brand accent for marketing/gradient moments only.
3. **Character tokens are quarantined to identity chrome** — they never encode data semantics. Risk levels use `--shield-*`; direction uses `--bullish/--bearish`. `--char-dex` red is DEX's *name tag*, not a risk scale.
4. **One accent per view:** indigo `--primary` = primary actions only; gold = premium only. Domain accents (HUNT lime, SHIELD gold) stay inside their domains.
5. **`--verified` cyan (V6.1 addition, already in `styles.css`):** source-verified chips. Green stays exclusively market-positive.
6. **Borders become whispers:** dark-mode hairlines at `rgba(255,255,255,0.06–0.10)` via the existing `--border`/`--border-subtle` names; light keeps solid hairlines.

## 4. Typography (laws, not suggestions)

Unchanged from Rev. 1: Inter 400/500/590 (590 replaces 700 via `--text-weight-strong`); **JetBrains Mono + `tnum` (`.vx-num`) for ALL numerics**; bold reserved for verdicts; Arabic display = Amiri with an Arabic UI body face as an owner decision (IBM Plex Sans Arabic / Noto Kufi Arabic recommended). Additions for character voice: MOXI's card copy ≤2 sentences, one action; DEX verdicts are always mono-numeral; VIGO evidence lines always end with a source chip.

## 5. Surfaces, elevation & borders

Unchanged: 4-layer ladder (3 working + 1 ceremonial `--surface-hero`); elevation = luminance step, shadows only for overlays; chart wells sunken; Glass 2.0 only on nav/dock/sheets. **Composition law added (Rev. 2):** vertical rhythm per view = **one hero question + ranked supporting blocks** (see §6).

## 6. Composition rules — "premium SaaS, not dashboard-heavy" (new in Rev. 2)

1. **The hero question:** every primary screen opens with the question it answers ("What deserves attention?", "Is this token safe?", "What did I decide and what happened?") — as a single narrative card, not a stat grid.
2. **Density is a tool, not a default.** Comparison jobs (Discover rows, positions, evidence stacks, case tables) may be dense. Orientation jobs (Today, Crew, onboarding) must not exceed **one hero + crew strip + ranked feed** on mobile.
3. **Widget budget:** no more than **6 equal-weight tiles per mobile view**; where a view would exceed it, tiles become ranked feed rows (ranked by relevance, not by module).
4. **Charts:** max **one chart per mobile view by default**; sparklines in rows; full charts on drill-down. The chart is copilot-annotated evidence, never a toolbar wall.
5. **The loop is visible:** wherever a decision-in-progress appears, its stage chip + owner character appear with it (Experience map §3).
6. **The one terminal:** `/trade-desk` is deliberately the densest surface (execution = focus mode) — everywhere else composes down.

## 7. Data visualization grammar

Unchanged from Rev. 1: sparkline-in-row default; per-widget timeframe chips; provenance + age on every live block; source chips + confidence on every AI claim; 6-color series palette from existing hues; direction never color-only (arrow + sign).

## 8. Motion philosophy (state-driven only)

Unchanged: 120–250ms, decelerate entrances, nothing bounces, **nothing loops** — with one correction now logged as UX-17: the MOXI orb's infinite bob + pulsing glow ring violates this law today and is re-skinned in Phase 4 (identity + motion together). Number-first motion; evidence cards assemble with 100ms stagger; reduced-motion: CSS gate exists (V6), JS-driven motion gated via `useReducedMotion()` in Phase 4. **Character motion rule (new):** characters express state (thinking/success/error) through `CharacterGuide` state changes and at most a 200ms entrance — no idle character animations, no ambient mascot behavior. The streak milestone remains the single ceremonial moment per cycle.

## 9. IA & navigation

**Superseded by `ia-proposal.md`** (Gate 2 decision): recommended **Option B "Crew Rail"** — dock 5 (`Today · Discover · Crew · Desk · More`) + global omnibox + character presence in every surface. Rev. 1's Option A ("Crew" as a More-panel category) is **withdrawn** as inconsistent with the owner's vision (crew as a navigation category alone is what the owner rejected). No route is removed or renamed in any option.

## 10. Desktop composition (fixing "stretched mobile")

Unchanged: at ≥1024px, `main + 360px context rail` on Today/Discover/Desk/Analysis — the rail carries crew context, evidence chips, quick actions. Dock centers as an island. **Addition (Rev. 2):** the Crew hub gets a wide activity rail (live crew activity + open loops) at ≥1024px. Mobile 390–430px remains primary.

## 11. Accessibility floor (non-negotiable)

Unchanged: 44×44 targets · visible `:focus-visible` ring (`--focus-ring`) · direction never color-only · heading order · axe-core per stage · keyboard journeys · 200% zoom. **Character rule (new):** character identity is never color-only — every persona chip carries monogram + name text; character art (when it lands via the Agent 1 contract) requires alt-text and a reduced-motion-safe static variant.

## 12. What we deliberately do NOT do

No rebrand · no new brand hues · no new UI library · no chart library swap · no decorative pastel tints · no glass on content cards · no mega-menus · no pay-for-visibility · no mock data anywhere. **Rev. 2 additions:** no mascot gimmicks (no confetti, no sticker reactions, no talking-head interruptions) · no ambient character animations · no invented character artwork (assets arrive only via the Agent 1 integration contract; monogram fallback until then) · no "crew purple" or any single-color crew branding · no dashboard walls where a narrative answers better · **no destructive redesign — every existing feature, route, and token preserved per `feature-preservation-map.md`**.
