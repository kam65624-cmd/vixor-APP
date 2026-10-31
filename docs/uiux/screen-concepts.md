# VIXOR APP — Screen-Level Concepts (Gate 2 Revision)

**Agent:** Agent 3 — UI/UX · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1`
**Status: PROPOSED (Gate 2). [PAUSED 2026-10-30: the owner has taken direct control of character creation and visual identity — these concepts are ON HOLD and nothing has been implemented. Monogram placeholders in the mockup are the current fallback system, NOT a substitute for the planned owner-approved character asset system. Asset dependencies and the consumption contract now live in `character-asset-readiness.md`. No navigation restructuring or Phase 4 work until owner go-ahead (D-10).]** Visual companion: **`docs/uiux/concepts/gate2-concepts.html`** (self-contained, real V6 dark tokens, monogram avatars only — open in a browser).

**Reading rules for every concept below.**
- `[EXISTS]` = feature/data/component exists today at the referenced route (see `feature-preservation-map.md` / `page-inventory.md`). Nothing `[EXISTS]` is removed.
- `[NEW]` = proposed composition/interaction, built from existing data sources and components. `[NEW]` never means "invented capability" — where a data source does not exist, the concept states the dependency instead of assuming it.
- Wireframes are mobile-first (390–430px), dark-first, and use V6 tokens only. All character art is monogram placeholders until the owner-controlled asset pipeline delivers approved assets (monograms are the fallback, never the final system).
- Every concept must define the states matrix (loading/empty/error/degraded/offline/stale/RTL) before Phase 4 build — sketched per concept.

---

## C1 — Product Home: "Today" + first-run onboarding

**Answers:** "What deserves my attention right now — and who is on it?"
**Route:** `/` (existing home, re-titled — fixes UX-02) · **Owner character:** MOXI.

### C1a. Today (returning user)

```
┌──────────────────────────────────────────┐
│ VIXOR ⌂     SOL 178.42 ▲0.8%  ◦15 ⚙ 👤  │ [EXISTS] TopNav (SOL/BTC live, points)
├──────────────────────────────────────────┤
│ GOOD EVENING, ALI              [MO] MOXI │ [EXISTS] time-of-day greeting (EN/AR)
│ Fear & Greed 61 · BTC 24h +1.2% · 3h left│ [EXISTS] market stat pills → 1-line pulse
├──────────────────────────────────────────┤
│ ▸ MARKET TICKER (live marquee)           │ [EXISTS] MarketTicker (reduced-motion fixed)
├──────────────────────────────────────────┤
│ ┌ MOXI'S BRIEFING ───────────── [MO] ─┐  │ [NEW] hero card = the "hero question"
│ │ One thing today: $XYZ is trending    │  │ data: getHomeMarketData + feed ranking
│ │ with smart-money inflow, unverified. │  │ (no new API — composes existing feeds)
│ │ [Investigate with VIGO →] [Dismiss]  │  │ CTA = hand-off card (experience map §2)
│ └──────────────────────────────────────┘  │
│ ┌ CREW STATUS ─────────────────────────┐  │ [NEW] strip, 4 monogram chips + status
│ │ MO 3 new · MR 2 files · DR 1 alert · │  │ real counts: feed / scanHistory /
│ │ EC EOD review ready                  │  │ shieldAlerts / todayLoop — or hidden
│ └──────────────────────────────────────┘  │  when empty (never fabricated)
│ ┌ ATTENTION FEED ──────────────────────┐  │ [EXISTS] UnifiedFeed + SmartTabs
│ │ ranked: signals · alerts · tracked    │  │ [NEW] ranking + loop-closure receipts
│ │ outcomes · crew activity              │  │ (ECHO receipts, hand-off cards)
│ │ [See all signals →]                   │  │ contextual entry (IA §3.4)
│ └──────────────────────────────────────┘  │
│ ┌ QUICK ACTIONS ───────────────────────┐  │ [EXISTS] MOXI_QUICK_ACTIONS
│ └──────────────────────────────────────┘  │
│ [ Today ][ Discover ][ ●Crew ][ Desk ][⋯]│ [NEW] dock per ia-proposal.md
└──────────────────────────────────────────┘
```

**Interactions:** briefing CTA → `/investigate` prefilled (existing route accepts a target param — verify in Phase 4); feed rows → existing destinations; crew chips → `/crew`.
**States:** loading = greeting skeleton + feed shimmer `[EXISTS SkeletonRow]`; empty feed = `EmptyState` + "Discover tokens" `[EXISTS]`; degraded = source chips "BINANCE · unavailable" `[NEW per UX-04 fix]`; offline = existing banner; RTL = mirrored layout, greeting already i18n'd `[EXISTS]`.

### C1b. First-run onboarding (new user)

**Shell:** existing `OnboardingModal.tsx` (first-run, `vixor-onboarded` flag) extended from a single modal into a 4-step flow — same trigger, same dismissal memory. `/v2/onboarding` (MOXI-guided, `[EXISTS]`) remains the deeper demo-case walkthrough it already is.

1. **Welcome — MOXI.** "I'm MOXI. VIXOR gives you decisions with evidence — no wallet needed." Value props ×3 (from existing auth-page feature list `[EXISTS]`). 200-free-points hook `[EXISTS]`.
2. **Meet the crew.** 4 identity cards (registry data `[EXISTS]`, monograms; artwork via the owner-controlled asset pipeline when approved). One line each: *MOXI finds · VIGO verifies · DEX quantifies · ECHO remembers.*
3. **Focus picker.** Assets (crypto/forex/meme/commodity — existing asset classes) + risk style (conservative/balanced/aggressive). Persists to existing user settings — no new backend.
4. **First task.** Two doors: "Scan the market with MOXI" (→ Discover) or "Walk a demo case" (→ `/v2/onboarding` `[EXISTS]`). Skippable; re-openable from Crew hub.

**States:** all steps keyboard-navigable, RTL-mirrored, skippable; no data dependency (works offline).

---

## C2 — Character-led discovery

**Answers:** "What's out there that matches my criteria — and is any of it verified?"
**Route:** `/discover` `[EXISTS]` · **Owners:** MOXI (finding) · MR.VIGO (verification status).

```
┌──────────────────────────────────────────┐
│ DISCOVER              [omnibox ⌘K]  ⧩    │ [NEW omnibox] + [EXISTS] search/filters
│ [Crypto] [Forex] [Smart Money]  Filters ▾│ [EXISTS] tabs + FilterPanel + URL params
├──────────────────────────────────────────┤
│ ┌ [MO] MOXI SCAN ────────────────────── ┐│ [NEW] result summary = hero question:
│ │ 6 tokens match your filters. Two have ││ "what matched and what matters"
│ │ unusual smart-money inflow.           ││ data: existing filtered feed only
│ └───────────────────────────────────────┘│
│ ┌──────────────────────────────────────┐ │
│ │ $XYZ  ▲ +42%  $1.2M vol  ~sparkline  │ │ [EXISTS] TokenRow + SparklineSVG
│ │ [MR ✓ checked 4m ago] [DR ⚠ 2 flags] │ │ [NEW] VIGO/DEX micro-chips — ONLY
│ │        [Investigate →] [Analyze]      │ │ when a scan exists (source: scanHistory);
│ └──────────────────────────────────────┘ │ no data = no chip, never fabricated
│ ┌──────────────────────────────────────┐ │
│ │ $ABC  ▼ −3.1%  $890K vol  ~sparkline │ │ … ranked feed [EXISTS sorting]
│ └──────────────────────────────────────┘ │
│ pull-to-refresh ↓                        │ [EXISTS] PullIndicator
└──────────────────────────────────────────┘
```

**Interactions:** row → `/token/$symbol` `[EXISTS]`; "Investigate" → `/investigate` with target (hand-off card + transfer banner on arrival `[NEW pattern]`); chips → `/shield/trust/$address` / evidence file.
**Data integrity:** chips render **only** from existing scan/case data; the "no chip" state is the default. Forex sections, session indicator, smart-money bar — all `[EXISTS]`, unchanged.
**States:** loading = row skeletons `[EXISTS]`; empty = `EmptyState` variant `[EXISTS]`; **error = explicit degraded chip + retry (UX-04 fix — replaces silent `[]`)**; offline; RTL.

---

## C3 — Risk intelligence workflow (DR.DEX)

**Answers:** "Is this safe to touch — and what exactly is wrong with it?"
**Routes:** `/shield/scanner` (entry) → `/shield/trust/$address`, `/shield/cases`, `/shield/alerts`, `/risk` `[ALL EXIST]` · **Owner:** DR.DEX.

```
┌──────────────────────────────────────────┐
│ DR.DEX — SECURITY SCANNER        [DR]    │ [EXISTS] page, retitled to DEX identity
│ ┌ paste contract address ┐ [Scan]        │ [EXISTS] scanToken (GoPlus + rugcheck)
├──────────────────────────────────────────┤
│ (scanning)  [DR] DR.DEX is working…      │ [NEW] CharacterGuide working state
│ ▸ checking honeypot… ▸ tokenomics…       │ (stepped status à la benchmark §1.6)
├──────────────────────────────────────────┤
│ ┌ RISK VERDICT ─────────────── [DR] ───┐ │ [NEW] the canonical verdict card:
│ │ ⚠ CAUTION                            │ │ verdict pill uses --shield-caution
│ │ Trust score 54/100 (EXISTS trust-    │ │ [EXISTS] --shield-* semantic scale —
│ │ score engine)                        │ │ never --char-dex for data
│ │ ─ Findings (by source) ────────────  │ │
│ │ ✖ Owner can change fees   · GOPLUS   │ │ source chips + age + --verified dot
│ │ ✖ Top-10 holder 34%      · GOPLUS    │ │ (Evidence Glass)
│ │ ✔ LP locked 12 mo        · RUGCHECK  │ │
│ │ ─ Exposure guidance ───────────────  │ │ [EXISTS] risk-governor rules drive the
│ │ Max suggested: 1.5% of portfolio     │ │ sizing line (engine exists; surfaced)
│ │ Invalidation: LP unlock < 90d        │ │
│ │ [Save as case] [Ask VIGO for evidence]│ │ hand-off + case creation [EXISTS cases]
│ └──────────────────────────────────────┘ │
│ ┌ ALERTS ──────────────────────────────┐ │ [EXISTS] getShieldAlerts feed
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Interactions:** verdict → save to `/shield/cases` `[EXISTS]`; "Ask VIGO" → `/investigate` hand-off; alert rows → existing destinations; paper decision logging `/risk` `[EXISTS]` reachable from verdict actions.
**States:** scanning = stepped working status; empty scan history = `EmptyState` + "Scan a token" `[EXISTS pattern]`; source degraded = per-finding "unavailable" chip; error = retry; RTL.

---

## C4 — Analysis & decision-support workflow

**Answers:** "What's the setup, how safe is it, what did I decide — and what happened?"
**Routes:** `/analyze` → `/analysis/$id` → `/tracking` → `/echo` `[ALL EXIST]` · **Owners:** the full relay (MOXI intake → DEX risk → user decides → ECHO tracks).

```
┌──────────────────────────────────────────┐
│ ANALYZE                                  │ [EXISTS] /analyze 3-stage flow
│ upload → analyzing → preview   [MO] MOXI │ (UploadStage/AnalyzingStage/PreviewStage)
├──────────────────────────────────────────┤
│ ┌ ANALYSIS RESULT ──────────────────────┐│ [EXISTS] /analysis/$id tabs: setup /
│ │ HeroSignalCard [EXISTS] · pattern,    ││ management / market context, annotated
│ │ direction, confidence (analysis engine)│ chart, news impact, notes CRUD
│ │ ┌ RISK PANEL ──────────── [DR] ─────┐ ││ [NEW] DEX risk block on analysis detail:
│ │ │ GO · sizing 0.5–1% · invalidation  │ ││ composes verdict pattern (C3) + existing
│ │ └───────────────────────────────────┘ ││ risk-governor output for this symbol
│ │ ┌ EVIDENCE SUMMARY ────── [MR] ─────┐ ││ [NEW] VIGO evidence summary: existing
│ │ │ 4 sources · 1 conflict (whale net) │ ││ whale/scan data for this symbol,
│ │ │ [Open full file → /investigate]    │ ││ linked, chips only when data exists
│ │ └───────────────────────────────────┘ ││
│ │ ┌ DECISION ─────────────────────────┐ ││ [EXISTS→NEW] "Track this signal"
│ │ │ Direction LONG · entry 0.842       │ ││ (createSignalTracking) becomes a
│ │ │ SL 0.798 · TP1 0.91 · rationale …  │ ││ structured decision card: direction +
│ │ │ invalidation …   [Record & track]  │ ││ rationale + invalidation + size
│ │ └───────────────────────────────────┘ ││ (logPaperDecision [EXISTS] + tracking)
│ └──────────────────────────────────────┘ │
│ ┌ OUTCOME TIMELINE ────────── [EC] ────┐ │ [NEW] ECHO timeline on tracking detail:
│ │ ● decision 10/24 14:02                │ │ decision → transitions (transition-engine
│ │ ● TP1 hit 10/25 09:14 (+4.2%)         │ │ [EXISTS]) → outcome → lesson line
│ │ ● EOD review logged · streak 6d       │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Interactions:** decision card → tracking created `[EXISTS]`; timeline rows → source records; "Open full file" → `/investigate`. The v2 case workflow (`/v2/case/*` `[EXISTS]`, fixtures) remains the experimental north-star for this loop; graduating it into main IA is owner decision D-14 (real providers required first — no mock data in prime surfaces).
**States:** analyzing = stepped progress `[EXISTS]`; error = retry preserving upload; missing risk/evidence blocks = omitted entirely (not fake); timeline empty = "No outcome yet — tracking active"; RTL.

---

## C5 — Crew Console: character interaction & assistance

**Answers:** "Who is working for me, what are they doing, and can I talk to them?"
**Entry:** the floating orb `[EXISTS FloatingCopilot]` — global. **Owners:** all four (MOXI hosts).

```
┌──────────────────────────────────────────┐
│            (home screen behind)          │
│                                     ⬤    │ [EXISTS] draggable orb — re-skinned:
│                                   [MO]   │ --char-moxi identity, no ambient bob
├──────────────────────────────────────────┤ (drawer opens, chrome = active char)
│ ● MOXI                     [MR][DR][EC]  │ [NEW] crew switcher; active chrome tint
│ ┌ CHAT ────────────────────────────────┐ │ [EXISTS] useCopilot messages/send
│ │ [MO] Evening, Ali. SOL is 0.8% up    │ │
│ │      against rising funding.         │ │
│ │ ┌ TOOL RECEIPT ──────────────────┐   │ │ [NEW] visible tool use: existing
│ │ │ ⚙ analyzePair(SOL/USDT, 4h)    │   │ │ moxi tools (analyzePair/trackSignal/
│ │ │ ✓ pattern: higher lows         │   │ │ createPriceAlert) rendered as receipts
│ │ └────────────────────────────────┘   │ │ with source + age
│ │ [MO] Want me to track it? → [trackSignal]│
│ │ You: track above 185               │ │
│ │ [EC] Tracked. I'll log the outcome. │ │ [NEW] hand-off: ECHO answers for the
│ │      [View tracking →]             │ │ tracking action in its own identity
│ └──────────────────────────────────────┘ │
│ ┌ CREW DIGEST ─────────────────────────┐ │ [NEW] today's crew activity (existing
│ │ [MR] $XYZ file ready · 4m  [Open]    │ │ notification-hub + events data)
│ │ [DR] 1 new alert on $ABC   [Review]  │ │
│ │ [EC] EOD review due       [Start]    │ │
│ └──────────────────────────────────────┘ │
│ ───────────────────────────────────────  │
│ [Type your message…]            [send]   │ [EXISTS] input
│ MOXI persona ⚙ (name/style/variant)      │ [EXISTS] persona system — new entry point
└──────────────────────────────────────────┘
```

**Interactions:** switcher tabs change drawer chrome to that character's `--char-*` and show their surface summary + recent activity (not a second chat — only MOXI chats; the others present their work and deep-links; single-owner rule). Tool receipts expandable; digest rows → surfaces.
**States:** loading = per-message skeleton; tool error = receipt error state + retry `[guide 'error' state EXISTS]`; empty digest = hidden; offline = queued with banner; RTL mirrored.
**Dependency honesty:** multi-character *conversation* is NOT proposed — only MOXI converses; others report. Any deeper capability is a future proposal (matrix row 20, `character-experience-map.md` §6).

---

## Cross-concept build order (after Gate 2 approval)

1. Crew identity primitives (CrewChip, hand-off card, orb re-skin UX-17) → 2. `/crew` hub + dock 5 (IA option B) → 3. C1 Today recompose → 4. C2 chips + degraded states → 5. C3 verdict card → 6. C4 decision card + timeline → 7. C5 console. Each stage: before/after screenshots, per-stage tests (`nav-strings`, `characters-i18n`, `character-registry`, `design-token-hygiene`, tsc, lint, axe), changelog entry — per `design-system.md` §8 governance.
