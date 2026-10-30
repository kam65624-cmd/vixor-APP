# VIXOR APP — Information Architecture Proposal (Gate 2 Revision)

**Agent:** Agent 3 — UI/UX · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1`
**Status: PROPOSED — replaces the IA section of `design-direction.md` v1 §9. Requires owner approval (Gate 2).**
**Rule of record:** no route is removed, renamed, or hidden in any option. The preservation map (`feature-preservation-map.md`) governs; dock/panel labels may change only with this approval.

---

## 1. The IA question, restated against the product vision

Phase 3 asked: *how do we fit 47 routes into a 390px dock?* The owner's confirmed vision changes the question to: **what navigation expresses "a premium SaaS product run by a crew of specialists"?**

Three tests every option must now pass:
- **T1 — Crew test:** characters are product experience, not a navigation category *alone*. IA must give the crew first-class presence AND the crew must inhabit every workflow (see `character-experience-map.md` §3).
- **T2 — SaaS test:** the app must read as an independently valuable product — intelligence, safety, decision loop first; execution is a feature, not the identity. Not a terminal, not a dashboard.
- **T3 — Reachability test (UX-01):** every one of the 23 orphaned routes (all `/hunt/*`, `/shield/*`, `/echo`, `/investigate`, `/risk`, `/tracking`, `/review`, `/analysis/$id`, …) reachable within **2 taps** from Home.

## 2. The three options, re-examined

### Option A — "Crew as a category" (original Phase-3 recommendation)
Dock → 5 (Home, Discover, Signals, Desk, More); a new **"Crew" category inside the More panel** groups HUNT/SHIELD/ECHO/Investigate/Risk.

- **Fails T1.** This is precisely the arrangement the owner rejected: the crew becomes a folder in a settings-adjacent sheet. Crew discoverability is 2 taps deep with zero live presence — the product's differentiator is stored in a drawer.
- Passes T3 on paper, but character surfaces arrive as "more tools", not as the product's protagonists.
- **Verdict: withdrawn.** It was the right answer to a density question, the wrong answer to a product question.

### Option B — "Crew Rail" (revised, recommended)
Dock → **5: `Today · Discover · Crew · Desk · More`** + global omnibox (carried over from v1 — still the single highest-value interaction addition) + character presence in every surface per the experience map.

- **Passes T1:** the crew is a first-level destination — a hub with live status, workflows, and activity — while attribution chips, seals, guide cards, and hand-offs put characters *inside* every workflow. The tab is the doorway, not the ghetto.
- **Passes T2:** the dock reads as a product narrative — *orient (Today) → explore (Discover) → consult your specialists (Crew) → execute (Desk) → everything else (More)* — instead of a tool shelf. Execution gets exactly one slot, deliberately.
- **Passes T3:** see reachability table §3.6 — all orphaned routes ≤2 taps.
- Cost: dock items Analyze, Signals, Swap, Alpha, Portfolio, Charts are displaced to stable, grouped positions in More + contextual entries (§3.4). This is a Gate-2 approval item (dock is 🔒 in the preservation map).
- **Recommended.**

### Option C — "Assistant-first" (status quo + omnibox)
Keep the 10-item dock; route crew discovery through MOXI's orb/drawer and the omnibox.

- **Fails T3 structurally:** 23 routes would depend on a chat surface whose tool coverage today is three tools (`analyzePair`, `trackSignal`, `createPriceAlert`). Non-AI-inclined users never find HUNT/SHIELD/ECHO.
- **Fails T2:** the 10-item tool dock is the "terminal" identity the owner rejected; UX-03 (mis-taps, drag-scroll) stays.
- Chat-first discovery also risks the "wall of chat" failure the benchmark flagged against Perplexity-style layouts.
- **Verdict: rejected.**

## 3. Option B, specified

### 3.1 Dock (5 items, all existing routes; labels via `nav-strings` EN/AR)

| Slot | Route | Identity | Notes |
|---|---|---|---|
| 1 | `/` **Today** | MOXI | Home re-titled (fixes UX-02: no more "HUNT — Token Discovery Terminal"); MOXI briefing + attention feed (C1) |
| 2 | `/discover` **Discover** | MOXI finds · VIGO verifies | existing page, crew chips added (C2) |
| 3 | **Crew** `/crew` *(new route, new content — the only new route in this option)* | all four | hub (§3.2) |
| 4 | `/trade-desk` **Desk** | DEX governor + MOXI coach | the one deliberately "terminal-dense" surface |
| 5 | **More** (panel) | — | regrouped (§3.3) |

Crew tab icon: a 4-dot constellation (one dot per character token color — the only multi-hue element in the dock, and it is semantic: it IS the crew). Active states, motion, safe-area behavior unchanged from current dock implementation.

### 3.2 The Crew hub (`/crew`) — block layout (mobile-first)

```
┌──────────────────────────────────────────┐
│ CREW                    [omnibox ⌘K]  ⚙  │  top nav (existing)
├──────────────────────────────────────────┤
│ Your crew is on duty                     │  page badge (PageLayout)
│ 2 items need you · 1 loop closes today   │  one-line status, .vx-num
├──────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐            │  2×2 character cards
│ │ MO  MOXI   │ │ MR  MR.VIGO│            │  monogram avatar (art via
│ │ 3 new finds│ │ 2 files open│            │  Agent 1 contract when it
│ │ [See Today]│ │ [Investigate]│           │  lands; monogram fallback)
│ └────────────┘ └────────────┘            │  each card: status line +
│ ┌────────────┐ ┌────────────┐            │  primary CTA → the
│ │ DR  DR.DEX │ │ EC  ECHO   │            │  character's real surface
│ │ 1 alert    │ │ EOD review │            │  (existing routes only)
│ │ [Scanner]  │ │ [Review]   │            │
│ └────────────┘ └────────────┘            │
├──────────────────────────────────────────┤
│ CREW WORKFLOWS                           │  grouped links — every
│ ▸ Investigate a token … MR.VIGO   /investigate + /hunt/*  │  orphaned route
│ ▸ Security & risk ……… DR.DEX  /shield/* + /risk          │  gets a home
│ ▸ Track outcomes ………… ECHO   /echo + /tracking + /review │  (UX-01)
│ ▸ Signals & alpha ………… MOXI   /alpha + /signals          │
├──────────────────────────────────────────┤
│ RECENT CREW ACTIVITY                     │  hand-off cards + receipts
│ [MR] VIGO finished the $XYZ file · 4 min │  (from events/notifications)
├──────────────────────────────────────────┤
│ [ Today ][ Discover ][ ●Crew ][ Desk ][⋯]│  dock
└──────────────────────────────────────────┘
```

Status lines are real data or absent — never fabricated: MOXI ← feed/signals counts, VIGO ← open cases (`getScanHistory`), DEX ← `getShieldAlerts`, ECHO ← `getTodayLoop`/review state. Loading = skeleton cards; empty = "nothing needs you right now" + one action per character.

### 3.3 More panel — regrouped (all existing routes, stable order)

| Group | Items |
|---|---|
| **Markets** | Signals · Alpha · Charts · Radar · Pulse & Whale · Predictions |
| **Research** | Analyze · Vision AI · Journal · PnL Tracker · Trackers |
| **Progression** | Daily Loop · Strategy Lab · Portfolio · Review |
| **Platform** | Settings · Profile · Premium · Rewards · Referral · Wallet |

Swap lives contextually (Desk, token pages, Today quick actions) and in Markets (kept: `Swap`). Language toggle stays pinned at panel footer. Nothing removed; every displaced dock item lands here on day one.

### 3.4 Contextual entries (so displacement ≠ disappearance)
- **Signals** — "See all" from Today's attention feed; More.
- **Analyze** — Today quick actions; every token page ("Analyze with MOXI" — existing pattern); More.
- **Swap** — Desk SwapPanel (exists); token pages (exists); More.
- **Alpha / Portfolio / Charts** — Today quick actions (existing `MOXI_QUICK_ACTIONS` mechanism); More.

### 3.5 What changes technically (Phase 4, after approval)
`BottomBar.tsx` dockItems (5), `MorePanel.tsx` categories, new `/crew` route + page, `nav-strings.ts` EN/AR + `nav-strings.test.tsx` updates, `characters-i18n` additions, Mixpanel nav events. Tests stay green; no backend changes. Displaced-item analytics before/after (dock click paths) reported at the end of the IA stage.

### 3.6 Reachability table (T3 proof — orphaned routes under Option B)

| Route | Tap path | Taps |
|---|---|---|
| `/investigate` | Crew → VIGO card / Investigate | 2 |
| `/hunt/radar` · `/hunt/whales` · `/hunt/token/$addr` · `/hunt/verified/$id` | Crew → Investigate group | 2–3 |
| `/shield` (all 6) · `/risk` | Crew → DEX card / Security group | 2 |
| `/echo` · `/tracking` · `/review` | Crew → ECHO card / Track group | 2 |
| `/analysis/$id` | Today feed / Crew activity / token page | 1–2 |
| `/notifications`, `/wallet-web3`, `/admin/api-keys`, `/opportunities` | More (grouped) / existing in-page links | 2 |
| `/v2/*` | More → Research footer link "Experimental (v2)" | 2 |

## 4. Why not a "Cases" tab instead of "Crew"?
The decision-loop *case* pattern (v2) is the right long-term product shape, but today it runs on fixtures (`domains/case/fixtures.ts` + mock providers). Promoting a mock-data surface to the dock would violate the no-mock-data law and over-promise. The Crew hub expresses the same loop through **real** surfaces now; the case workflow can graduate into the Crew tab later as a separate owner decision when its providers are real (`owner-decisions.md` D-14).

## 5. What Option B explicitly does NOT do
No route removals/renames (one addition: `/crew`). No rebrand. No change to route paths or param contracts. No backend/API changes. V6 tokens untouched (the 4-dot dock icon uses existing `--char-*` values). Desktop: same 5-item dock, centered island + the two-column composition from `design-direction.md` §10, with Crew hub gaining a wide activity rail at ≥1024px.
