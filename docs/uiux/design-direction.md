# VIXOR — Design Direction (Phase 3)

**Agent:** Agent 3 — UI/UX Design Director · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1`
**Status: PROPOSED — requires owner approval (Gate 2) before Phase 4 implementation.**

**Positioning brief:** Premium + Modern + Intelligent + Distinctive + Trend-aware + Highly Usable.
**Chosen spine:** **"Signal over Chrome"** (benchmark §5, Direction 2) — extended with Direction 1's surface/border grammar ("Mission Briefing Room") and Direction 3's "Evidence Glass" treatment reserved for AI-insight cards and premium moments. This is an **evolution of VIXOR V6**, not a rebrand: every existing token survives; we add rules, not hues.

---

## 1. Why this direction (product-grounded, not taste-grounded)

1. **The product is an instrument.** VIXOR's users make financial decisions on a mobile screen, often in Telegram, often in AR or EN, often on flaky data. The interface's job is to make the *signal* the loudest thing on screen (Direction 1) and to make *color mean something* (Direction 2). Every decorative element competes with money-information.
2. **The differentiator is a crew with evidence.** MOXI/MR.VIGO/DR.DEX/ECHO justify trust only if their output carries receipts — source chips, timestamps, confidence. That is Direction 3's "Evidence Glass", applied narrowly where AI speaks.
3. **The existing system is already 70% there.** V6's 4-layer surface ladder, semantic trading colors, mono-numeral rule and token hygiene tests mean the cheapest premium win is *discipline*, not reinvention. The benchmark's top patterns (luminance elevation, `tnum`, one-accent-per-view, states-as-gate) all map onto existing tokens.

## 2. Light/dark strategy

**Dark-first; light maintained at parity.** Rationale: (a) the product is a live terminal used inside Telegram — dark is the native ambient and the deployed default; (b) semantic trading colors were tuned for dark first (bullish `#22d3a6` on `#08090c` passes contrast; light variants already exist and stay maintained); (c) competitor evidence (Linear, Perplexity, TradingView dark-default in trading contexts) supports dark as the *working* theme. Light mode remains fully supported (it exists today and is preserved) — any new token ships with both values. **No automatic theme switching** — user setting stays authoritative.

## 3. Color architecture (rules layered on V6 tokens — no new brand hues)

1. **Semantic apartheid (law):** `--bullish/--bearish/--neutral-wait` appear ONLY as data meaning (direction/PnL/status). Never decorative. Never on chrome, never as section theming.
2. **One accent per view:** indigo `--primary` = primary actions only; purple `--secondary-accent` = AI/crew identity only (avatar rings, copilot chrome, character moments); gold = premium only (existing law, restated).
3. **Domain accents stay quarantined:** HUNT lime and SHIELD gold remain inside their domains; they never leak into global chrome.
4. **New token (the only color addition):** `--verified: #22d3ee` (+dim/border) — the "source verified" color for evidence chips, deliberately the same family as `--shield-safe` (cross-domain coherence: cyan = checked). **Green stays exclusively market-positive** — this resolves the Perplexity-pattern conflict (their verified-green would corrupt VIXOR's semantic green).
5. **Borders become whispers:** in dark, solid border grays migrate to `rgba(255,255,255,0.06–0.10)` hairlines (Linear grammar) — `--border-subtle/hover` retune within existing token names; light mode keeps solid hairlines.

## 4. Typography (laws, not suggestions)

1. Inter for narrative/UI — weights **400 / 500 / 590** only; 590 replaces 700 everywhere (Linear discipline). Existing `font-bold` usages migrate to 590-class (`--text-weight-strong`) during Phase 4 page passes.
2. **JetBrains Mono + `tnum` for ALL numerics** — prices, PnL, percentages, scores, timestamps. New utility `.vx-num` (Phase 3 token file) applies `font-variant-numeric: tabular-nums` + mono stack. Live-updating numbers must never reflow.
3. Bold is reserved for **verdicts** ("VERDICT: LONG", "CONFIRMED"), never inline emphasis (Perplexity law).
4. **Arabic:** Amiri remains the AR display face. **Gap found:** Inter has no Arabic glyphs — AR body text currently falls back to system fonts (uncontrolled). *Recommendation (owner decision, Phase 4):* add an Arabic UI face (IBM Plex Sans Arabic or Noto Kufi Arabic, OFL) for AR body/UI; Amiri stays for display/quotes. Recorded as UX-15/UX-07 dependency.

## 5. Surfaces, elevation & borders

- Ladder unchanged (4 layers max — benchmark says cap at 3; VIXOR's 4th `--surface-hero` is reserved for hero/premium moments only, which satisfies the spirit: **3 working layers + 1 ceremonial**).
- **Elevation = luminance step, never a new shadow** (Linear law). Shadows reserved for overlays/floating only (existing 6-level system stays).
- Chart containers get **sunken wells** (inset 1px + inner shadow) instead of floating cards — charts are read, not clicked.
- Glass 2.0 stays for top nav, dock, sheets — and nowhere else (no glass content cards; data must be crisp).

## 6. Data visualization grammar

1. Sparkline-in-row as the default density pattern (TradingView); full charts on drill-down.
2. **Per-widget timeframe chips** (24H/7D/30D) — standard on all metric cards (Datadog pattern).
3. Every live block carries **provenance + age**: "BINANCE · 12s ago" mono micro-label; every AI claim carries **source chips + confidence** (Evidence Glass).
4. Chart series palette extended from 3 to 6 (new: `#22d3ee`, `#f5a623`, `#f0c419` family — drawn from EXISTING semantic hues but used as *series* colors only in multi-series contexts, never re-colored per-chart on semantic single-series). No new hues introduced.
5. Direction is never color-only: every delta gets an arrow glyph (▲▼) + sign (UX-14 fix).

## 7. Motion philosophy (state-driven only)

- Durations 120–250ms, `--ease-decelerate` entrances; nothing bounces; nothing loops (the dock's active indicator is the single persistent motion).
- **Number-first motion:** prices tick, sparklines draw, gauges fill — the *data* animates, not the containers (Direction 2).
- Evidence cards assemble with 100ms stagger (Direction 3) on copilot output only.
- **Reduced-motion:** a global CSS gate **already exists in V6** (`styles.css` L2201–2232 — verified during Phase 3); the remaining gap is **JS-driven motion** (framer-motion springs on the dock) — Phase 4 gates those with `useReducedMotion()`. (Issue UX-06, corrected.)
- The one ceremonial moment per cycle: **streak milestone** (annual-sparkle budget).

## 8. States discipline (the Geist-style gate)

Every screen must define, as named states: **loading (skeleton) · empty (EmptyState + action) · error (retry affordance) · degraded (source chip "unavailable") · offline (existing banner) · stale (age indicator) · RTL (mirrored)**. Phase 4 implements per page; Phase 6 verifies per page. `/discover`'s silent-empty (UX-04) is the first target. No page ships a state it hasn't designed.

## 9. IA & navigation concept (Gate-2 decision — options, not fait accompli)

- **Option A (recommended):** dock reduces to **5** (Home, Discover, Signals, Desk, More) — all displaced items land in a re-grouped More panel with a new **"Crew"** category (HUNT/SHIELD/ECHO/Investigate/Risk) making the character system discoverable in ≤2 taps (fixes UX-01 + UX-03 with zero route changes).
- **Option B:** keep 10-item dock; add character-hub screen as a "Crew" tab.
- **Option C:** status-quo + omnibox only.
- In all options: **global omnibox** (paste address/symbol/@wallet → auto-route to token/case/whale) is added to the top nav (Birdeye/Linear pattern) — this is the single highest-value interaction addition.
- No route is removed, renamed, or hidden in any option (preservation map governs).

## 10. Desktop composition (fixing "stretched mobile")

At ≥1024px: content grids become **two-column** (`main + 360px context rail`) on Home/Discover/Trade-desk/Analysis — the rail carries crew context, source chips, and quick actions (Evidence Glass lives naturally there). Dock remains but centers as an island; top nav gains breadcrumb context. Pages keep `PageLayout` scaffolding; only grid rules change at `lg:`. Mobile (390–430px) remains the primary target — desktop is composed, not scaled.

## 11. Accessibility floor (non-negotiable, verified per stage)

44×44px targets · visible `:focus-visible` ring (new token) · direction never color-only (arrows + signs) · heading order per page · `axe-core` per Phase 4/6 stage · keyboard journeys per stage · 200% zoom check. WCAG 2.2 AA is the target; **no compliance claim is made until tested** (UX-14/UX-06).

## 12. What we deliberately do NOT do

No rebrand · no new brand hues (one utility addition: `--verified`) · no new UI library (shadcn stays; inline-style buttons migrate to cva variants) · no chart library swap · no decorative pastel tints · no ambient loops · no glass on content cards · no mega-menus · no pay-for-visibility anything · no mock data anywhere (degraded states are designed, never faked).
