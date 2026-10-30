# VIXOR APP — Phase 1: Full Application UX Audit

**Agent:** Agent 3 — UI/UX Design Director · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1` · **Base:** `main@b893b62`
**Inputs:** full route reads (P0 pages), server-fn usage map (all routes), local dev render without auth session (degraded states), baseline screenshots (`docs/uiux/screenshots/baseline/`, 12 captures), prior audits (`docs/AUDIT_FULL_2026.md`, `docs/rehab/*`, handoff 2026-10-24).
**Honesty note:** runtime behaviors behind real authentication are **Not Verified** in this pass (no staging URL, no test credentials — see UX-16). Everything below is evidence-based from static analysis + unauthenticated local render.

---

## 1. First-time user experience (FTU)

The FTU chain is: open in Telegram → `/auth` auto-signin (WebApp initData) → `/` home. In-browser users get the Telegram Login Widget with a 5s timeout state, then a hidden email/password fallback. **Strengths:** the Telegram-native path is genuinely low-friction; onboarding modal appears once (localStorage-gated) with a 1.2s delay; "200 free points" gives a reason to try. **Weaknesses:** (1) the onboarding modal and `/v2/onboarding` (character-guided case walkthrough) are two different stories told at two different depths — no single canonical "what is VIXOR" moment; (2) after landing on `/`, a first-time user sees MOXI's greeting (good) but no orientation to the character system (MR.VIGO/DR.DEX/ECHO are invisible unless linked from content); (3) FTU in AR is unverified. **Verdict:** functional, not yet narrative. The product's differentiator (the crew) is absent from its own first impression.

## 2. Dashboard comprehension

`/` mixes four jobs in one screen: orientation (greeting), market pulse (ticker + stat pills), quick actions (MOXI prompts), and feed (UnifiedFeed/SmartTabs). Density is high but rhythm is good (V6 stat pills with hover glow read well at 390px — screenshot 02/10). **Issues:** the page title brands it as "HUNT — Token Discovery Terminal" (UX-02) which misframes the surface; stat pills present values without time-window or source labels (which feed? FNG vs global — unlabeled provenance); no "as of" timestamps on live data. **Verdict:** solid skeleton; needs provenance labels + correct identity.

## 3. Navigation clarity

Three navigation systems coexist: fixed 44px glass top nav, a 10-item dynamic bottom dock (drag-scroll, grouped core/trading/ai), and a 4-category More sheet (14 items). Within-sheet and dock, hierarchy is clear. **The gap is between systems:** HUNT, SHIELD, ECHO, `/investigate`, `/risk`, `/tracking`, `/notifications`, `/wallet-web3`, `/review`, `/v2/*` exist only via in-page cross-links (UX-01) — the product's three differentiating domains are structurally invisible. The dock also exceeds Telegram mini-app ergonomics (UX-03). **Verdict:** local clarity, global incoherence. This is the highest-leverage Phase 4 target (owner Gate-2 decision required).

## 4. Information hierarchy

Newer surfaces (`PageLayout` family: PageBadge/StatsRow/DataRow) show a disciplined hierarchy; the home page hand-rolls its own (782 lines) and older legacy pages (`/whale`, `/pulse`, `/radar` siblings) predate the system (UX-09). Hierarchy within pages is generally good; across pages it varies by generation. **Verdict:** two design generations coexist; converge during Phase 4 without redesigning either.

## 5. Feature discoverability

Quantified: of 47 app routes, 24 are reachable from global nav in ≤2 taps; 23 depend on contextual links (page-inventory §1). Premium/rewards/referral (monetization) are well-placed in the More panel. The character system — the core brand — has zero dedicated entry. **Verdict:** trading actions discoverable; intelligence domains are not.

## 6. Workflow efficiency

The flagship loop (discover → token → analyze → track → loop review) is well-wired at the data layer: `createSignalTracking` exists on both `/signals` and `/analysis`; `/trade-desk` prefills from URL params; `/daily-loop`'s six server fns are all called (prior audit's "not fully wired" is stale at the wiring level — DATA-03). **Friction points:** token deep links without params degrade (UX-05); discover's filter state lives in URL (good, shareable) but there is no global search/command surface (paste-an-address anywhere → auto-route); cross-domain jumps (hunt→shield on same token) rely on page-specific buttons. **Verdict:** data-layer flows are healthy; interaction-layer shortcuts (omnibox, cross-links) are the upgrade path.

## 7. Consistency across pages

Token system (V6) is consistent by test (`design-token-hygiene`). Component usage is not: shadcn `ui/*`, custom `vixor/*`, and `PageLayout` primitives overlap (three button idioms exist: shadcn Button, `vx-btn-*`, inline `style={{}}` buttons — TopNav uses inline styles). Severity/status mapping logic is re-implemented per page (UX-13). Sound feedback exists on the desk but not elsewhere. **Verdict:** visual language is coherent; component language is fragmented. Phase 3's design-system doc must pick canonical primitives per job.

## 8. Visual quality

Baseline renders show a genuinely premium dark product: 4-layer surface ladder, glass top nav, gradient overlays, mono numerals for prices. Weak spots visible in captures: (1) empty/missing-data states render as blank regions rather than designed states (discover silent-empty — UX-04); (2) hover-glow affordances on touch devices are decorative-only; (3) some pages center content in narrow columns on desktop (1440 renders show a mobile layout stretched — screenshots 10–12: the app is mobile-first; desktop gets no expanded layout, e.g. no multi-column grids); (4) mixed inline-style vs Tailwind class styling (engineering smell affecting future consistency). **Verdict:** mobile visual quality: high. Desktop: under-designed (mobile-scaled, not desktop-composed).

## 9. Loading & error states

Present: skeletons (home/discover/settings/charts), `EmptyState` component, RouteLoading, error boundaries, toasts (sonner), offline banner (`role="alert"`). Inconsistent: `isError` handling varies per query (discover swallows errors — UX-04); no retry affordance standard; no data-age ("as of") indicators; degraded-source presentation is accidental rather than designed (DATA-04). **Verdict:** the state inventory exists as components but not as a discipline. Phase 3 will define a states matrix (loading/empty/error/degraded/offline/stale × page) as a design gate.

## 10. Mobile usability

The primary target (Telegram mini-app) is well served: safe-area insets respected (isTg adjustments), dynamic dock, pull-to-refresh on discover, bottom sheets (SmartBottomSheet, wallet modal with handle bar). Issues: dock density on 390px (UX-03); touch targets on TopNav icon buttons below 44px (UX-14); horizontal drag on dock conflicts with page-level gestures in places; marquee/flash animations run on mobile data connections without reduced-motion gates (UX-06). **Verdict:** strong native-feeling base; ergonomics polish needed.

## 11. Accessibility (WCAG 2.2 AA target — not yet tested, honestly)

Not Verified. Static observations only: `aria-label` present on dock/more buttons and offline banner; color-only direction signaling in tickers (UX-14); focus visibility, heading order, focus traps in modals, and 200% zoom behavior are unverified; `axe-core` runs are scheduled per Phase 4/6 stage. **No compliance claim is made.**

## 12. Performance & interaction responsiveness

Not measured this pass (no Lighthouse/trace data — marked Not Verified). Structural risks noted for Phase 6: home bundles the ticker + feed + FX (EnergyOrb) in one 782-line page; client-side fetch chains on discover (waterfall: boosts → per-token pairs); marquee tripled DOM; `key={path}` page remount resets scroll state (intentional? verify). Baseline dev renders responded quickly after compile; production parity unknown.

---

## Visual baseline evidence (local dev, unauthenticated)

| Capture | File | Notes |
|---|---|---|
| Auth (mobile) | `01-auth-m.png` | Telegram-first chain visible; fallback links present |
| Home (mobile/desktop) | `02-home-m.png`, `10-home-d.png` | Ticker + stat pills + MOXI greeting; desktop = stretched mobile |
| Discover (mobile/desktop) | `03-discover-m.png`, `11-discover-d.png` | Multi-asset feed; empty-state behavior on blocked sources |
| Hunt radar | `04-hunt-radar-m.png` | Chain filters + trending rows |
| Shield | `05-shield-m.png` | KPIs + alerts + history (title verified on re-shoot) |
| Trade desk | `06-trade-desk-m.png`, `12-trade-desk-d.png` | Risk calc + positions + guarded execution |
| Settings | `07-settings-m.png` | Local prefs + language + exchange CRUD |
| Premium | `08-premium-m.png` | Plan cards (fallback constants active — DB unreachable) |
| V2 onboarding | `09-v2-onboarding-m.png` | 3-step character walkthrough |

Console: 2 page errors per page in sandbox — attributed to unreachable placeholder Supabase + restricted external APIs (degraded-mode noise); not classified as product defects without isolation. Production/hydration check: Not Verified (UX-16).

## Overall assessment

VIXOR APP is **not** a blank canvas problem — it is a **discipline problem**. The token system, data layer, and Telegram integration are strong; the character differentiator is real but structurally invisible; states are built but not enforced; desktop is an afterthought; three component generations coexist. Phase 2 (benchmark) and Phase 3 (direction) should therefore aim at: (1) an IA decision that makes the crew findable, (2) a states/data-provenance discipline, (3) canonical component primitives, (4) honest desktop composition, (5) accessibility as a gate — all while preserving every behavior mapped in `feature-preservation-map.md`.
