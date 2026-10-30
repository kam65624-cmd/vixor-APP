# VIXOR APP — UX Issue Register (living document)

**Agent:** Agent 3 — UI/UX · **Branch:** `uiux/vixor-app-phase-1` · Updated: 2026-10-30

**Statuses:** Not Started · Partial · Code Complete / Not Verified · Done + Verified · Blocked · **Requires Owner Approval**.
Every "Done + Verified" claim requires evidence (test, screenshot, browser journey log). Nothing here is marked verified without it.

---

## UX issues

### UX-01 — HUNT/SHIELD/ECHO & legacy routes unreachable from global navigation
- **Severity:** P0 (IA) · **User impact:** entire character domains (HUNT, SHIELD, ECHO — the product's differentiators) depend on in-page cross-links; new users cannot discover them; `/echo`, `/investigate`, `/risk`, `/tracking`, `/opportunities`, `/notifications`, `/wallet-web3`, `/review`, `/analysis/$id`, all `/v2/*` have no dock/panel entry.
- **Evidence:** `BottomBar.tsx` `dockItems` + `MorePanel.tsx` `moreNavCategories` vs. full route list (page-inventory §1).
- **Root cause:** organic growth of routes without IA governance; dock optimized for trading actions, not domains.
- **Proposed solution (Gate 2 revision):** IA **Option B "Crew Rail"** (`ia-proposal.md`) — new first-level `/crew` hub (character status cards + workflow groups + activity) puts every character domain ≤2 taps from home. Option A ("Crew" as a More-panel category) **withdrawn** — inconsistent with the owner's vision (crew must not be a navigation category alone). No route deletions.
- **Status:** Requires Owner Approval (Gate 2) — recommendation updated 2026-10-30. **Verification (when implemented):** journey test — every route in page-inventory reachable within 2 taps from home.
- **Remaining risk:** low after IA decision; high if left unaddressed (product story invisible).

### UX-02 — Home page identity confusion
- **Severity:** P1 · **Impact:** `/` is titled "HUNT — Token Discovery Terminal" (browser tab + SEO/sharing) while functioning as the general dashboard; brand surfaces (HUNT) bleed into the home.
- **Evidence:** `routes/_authenticated/index.tsx` line 52 (`head` meta) — read + dev render.
- **Proposed:** retitle `/` to its own surface ("VIXOR — Command Center"); HUNT branding stays on `/hunt/*`.
- **Status:** Not Started (Phase 4, trivial) · **Verify:** dev-render title check.

### UX-03 — Dock density (10 items) vs. Telegram mini-app ergonomics
- **Severity:** P1 · **Impact:** on 390px the dock requires horizontal drag/scroll (auto-center helps); mis-taps near separators; benchmark guidance: ≤5 primary + More.
- **Evidence:** `BottomBar.tsx` (groups core/trading/ai/more) + baseline screenshots 02/10; competitor benchmark §B (avoid mega-nav).
- **Proposed (Gate 2 revision):** dock → 5 per IA Option B: **Today · Discover · Crew · Desk · More** (`ia-proposal.md` §3.1). Displaced items (Analyze, Signals, Swap, Alpha, Portfolio, Charts) land in a regrouped More panel at stable positions + contextual entries (IA §3.4).
- **Status:** Requires Owner Approval (Gate 2) — recommendation updated 2026-10-30.

### UX-04 — `/discover` silently swallows fetch errors
- **Severity:** P1 · **Impact:** on DexScreener/exchangerate failure the feed renders empty with no reason — users cannot distinguish "no results" from "data unavailable" (data-integrity perception risk).
- **Evidence:** `_discover/index.tsx` queryFn returns `[]` on `!res.ok` (read, lines 78–90).
- **Proposed:** propagate error state → explicit `EmptyState` variant with retry + "live/degraded/unavailable" source chip.
- **Status:** Not Started (Phase 4) · **Verify:** route-mocked failure → state visible (browser test).

### UX-05 — `/token/$symbol` depends on URL params for core display data
- **Severity:** P1 · **Impact:** shared/deep-linked tokens without params render blank price/name; watch a token from an external source → degraded page.
- **Evidence:** `token.$symbol.tsx` `validateSearch` (chain/price/change24h/name/dexUrl/pairAddress).
- **Proposed:** fallback fetch-by-symbol when params absent (server fn exists in hunt `getTokenDetail` family); params remain as override.
- **Status:** Not Started (Phase 4; backend fn reuse — coordinate Agent 2 if a new server fn is needed).

### UX-06 — Reduced-motion: global gate EXISTS; JS-driven motion not covered (corrected 2026-10-30)
- **Severity:** P3 (a11y) — **corrected down from P2 after evidence check.**
- **Impact:** a global `prefers-reduced-motion` gate IS present (`src/styles.css` L2201–2232: universal 0.01ms durations + per-class overrides for shimmer/pulse-dot/card-stagger/live-badge/page-enter, plus `.vixor-energy-orb`). The remaining gaps: (a) **JS-driven motion** (framer-motion springs on the dock, `whileHover`/`whileTap`) is not gated — CSS media rules do not affect it; (b) the home ticker marquee relies on the universal rule (duration→0.01ms, iteration→1), which freezes it at end-state — verify the frozen frame is acceptable.
- **Evidence:** `src/styles.css` read (L2200–2266) during Phase 3 preparation; initial register entry wrongly claimed no gate existed — corrected here per evidence-first policy.
- **Proposed:** Phase 4 — gate framer-motion usage with `useReducedMotion()`; verify ticker frozen-state quality; keep all state-change motion.
- **Status:** Partial (CSS gate: Done pre-existing; JS gating: Not Started) · **Verify:** emulate reduced-motion → dock springs disabled, page transitions instant.

### UX-07 — RTL/AR coverage unverified at baseline
- **Severity:** P1 · **Impact:** AR is a first-class locale (Amiri fonts, RTL layout required); no baseline AR pass exists; directional paddings/margins and icon mirroring are regression-prone during visual changes.
- **Evidence:** `fonts/arabic/*`, `i18n/translations/ar.ts`, no AR screenshots in baseline.
- **Proposed:** Phase 4/6 — AR render pass per changed page + `dir=rtl` visual checks; add to QA checklist.
- **Status:** Not Started · **Verify:** AR screenshots per stage.

### UX-08 — Monolithic page files (maintainability & consistency risk)
- **Severity:** P2 (engineering) · **Impact:** home 782, settings 801, shield 676, risk 752, echo 566+ lines — slow to review, drift from shared primitives, inconsistent states.
- **Evidence:** file line counts (read passes).
- **Proposed:** Phase 4 staged extraction per page (behavior-identical components; token tests + visual diff per stage). No user-facing change intended.
- **Status:** Not Started (per-stage, reviewable commits).

### UX-09 — Inconsistent page scaffold primitives
- **Severity:** P2 · **Impact:** newer pages use `PageLayout` (PageBadge/StatsRow/DataRow/ScrollArea); home & several legacy pages hand-roll layout; visual rhythm differs page-to-page (V6 not uniformly expressed).
- **Evidence:** imports across route files (S-survey); baseline screenshots.
- **Proposed:** converge on `PageLayout` family during Phase 4 page passes; extend PageLayout (not new systems).
- **Status:** Not Started.

### UX-10 — Stale "Mock Data" comments on real-data pages
- **Severity:** P3 (hygiene) · **Impact:** misleading contributors; audit friction (this audit had to disprove them).
- **Evidence:** `hunt/radar.tsx` L14, `shield/index.tsx` L16, `_swap/*`, `whales.tsx` etc. (search: "Mock").
- **Proposed:** comment cleanup only (no behavior change).
- **Status:** Not Started (Phase 4 hygiene commit).

### UX-11 — No route-level auth guard (unauthenticated shell renders)
- **Severity:** P1 (UX + defense-in-depth) · **Impact:** without a session, `_authenticated` pages render with failing queries (empty/error states) instead of a sign-in redirect — feels broken to signed-out users; server fns remain protected (data safe).
- **Evidence:** dev render with no auth session (baseline screenshots render pages); prior audit item #10 still true at route level.
- **Proposed:** route-group `beforeLoad` guard redirecting to `/auth` — **coordination: Agent 2 (auth middleware owner) approves approach; Agent 3 implements UI side.**
- **Status:** Blocked (needs Agent 2 sign-off) · **Verify:** signed-out journey → redirected; signed-in journey unaffected.

### UX-12 — Settings `twoFactor` toggle is UI-only
- **Severity:** P2 · **Impact:** toggle implies a security feature that is not enforced — trust risk on a trading product.
- **Evidence:** `_settings/index.tsx` localToggles (`twoFactor: stored.twoFactor ?? false`), no enforcement path found.
- **Proposed:** label as "coming soon" (disabled) or remove until wired — decision with Agent 2.
- **Status:** Blocked (Agent 2 decision).

### UX-13 — Duplicated severity/status mappers across SHIELD pages
- **Severity:** P3 · **Impact:** drift risk (six shield pages repeat color/text mapping logic).
- **Proposed:** extract shared `SeverityBadge`/`CaseStatusBadge` (behavior-identical).
- **Status:** Not Started (Phase 4).

### UX-14 — Accessibility gaps (targets, color-only, focus)
- **Severity:** P1 (WCAG 2.2 AA target) · **Impact:** TopNav icon buttons ~28–30px (below 44px target); ticker uses green/red text as sole direction signal (color-only); focus visibility unverified app-wide; heading order unverified.
- **Evidence:** `TopNav.tsx` inline sizes; ticker `TickerItem` (color-only); a11y checklist (installed reference) not yet applied as an audit.
- **Proposed:** Phase 4/6 — 44px targets, direction arrows/icons alongside color, focus-visible pass, `axe-core` run per stage.
- **Status:** Not Started · **Verify:** axe reports + keyboard journey per stage.

### UX-15 — Hardcoded EN strings outside i18n coverage
- **Severity:** P2 · **Impact:** partial AR experience (mixed-language pages under AR locale).
- **Evidence:** prior audit item #12; nav-strings test covers nav only; sample pages contain EN literals (e.g., auth copy, home greeting — verify list in Phase 4).
- **Proposed:** i18n coverage sweep (en+ar) with test extension.
- **Status:** Not Started.

### UX-16 — No production visual baseline available
- **Severity:** Process limitation · **Impact:** before/after and visual-regression comparisons are limited to local dev renders; published-site hydration check impossible.
- **Proposed:** owner provides production/staging URL (read-only) or approves a preview deployment path.
- **Status:** Blocked (owner input requested).

### UX-17 — MOXI copilot orb: identity drift + motion-law violation
- **Severity:** P1 (brand consistency — the crew's most-seen surface). **Found:** 2026-10-30 Gate 2 revision.
- **Impact:** `FloatingCopilot.tsx` renders MOXI's orb with a hardcoded indigo/violet gradient (`#8B5CF6→#6366F1→#4338CA`) + generic `Bot` icon + infinite sine-wave bob + looping glow ring. It matches neither MOXI's canonical identity (`--char-moxi` `#06b6d4`, `Activity` icon, `MO` monogram — `src/shared/characters.ts`) nor the motion law (no ambient loops; design-direction §8). Under the character-driven product vision this is the highest-visibility identity defect.
- **Evidence:** `src/components/vixor/FloatingCopilot.tsx` L22–36, L89–119 (read 2026-10-30).
- **Proposed:** Phase 4 re-skin to `--char-moxi` token chrome + monogram/avatar slot + static or state-driven motion gated by `useReducedMotion()`; concept C5 (`screen-concepts.md`).
- **Status:** Not Started (Phase 4, after Gate 2). **Verify:** token-hygiene test + visual + reduced-motion emulation.

### UX-18 — No character artwork layer (monogram-only avatars)
- **Severity:** P2 (dependency). **Found:** 2026-10-30 Gate 2 revision.
- **Impact:** character identity currently renders as monograms + Lucide icons only; illustrated assets are the missing layer of the character experience. VIXOR must not invent artwork (owner rule) — assets arrive via the Agent 1 / Character Studio integration contract (`character-experience-map.md` §5).
- **Evidence:** `characters.ts` (monogram function), `MoxiAvatar.tsx` (gradient monograms); no illustrated character assets in repo.
- **Proposed:** monogram fallback is the complete, shippable state today; asset consumption layer + manifest contract after R-4 approval (`owner-decisions.md`).
- **Status:** Blocked on Agent 1 coordination (owner-routed). Not a Phase 4 blocker — fallback design is final-quality.

### UX-19 — Copilot drawer: generic chat, no persona chrome / tool visibility / crew attribution
- **Severity:** P1 (character experience). **Found:** 2026-10-30 Gate 2 revision.
- **Impact:** `CopilotDrawer.tsx` is an unbranded chat ("Type your message…" placeholder, no MOXI identity, no visible tool use, no source chips) while the backend already exposes MOXI tools (`analyzePair`, `trackSignal`, `createPriceAlert`) and persona customization (`moxi_personas`). The product's flagship AI surface undersells existing capability and breaks attribution rules (experience map §3).
- **Evidence:** `src/components/vixor/CopilotDrawer.tsx` (read 2026-10-30); `src/domains/moxi/tools.ts`; `src/domains/moxi/persona.ts`.
- **Proposed:** Crew Console concept C5 (`screen-concepts.md`): persona chrome, tool receipts with sources, crew-delegated replies (single-owner rule), digest, persona entry point — all consuming existing functions.
- **Status:** Not Started (Phase 4, after Gate 2).

---

## Engineering issues (frontend-owned unless noted)

### ENG-01 — Undeclared direct import: `@walletconnect/sign-client`
- **Severity:** P1 · **Impact:** Vite dep-scan fails at dev boot (warning; pre-bundling skipped); resolution works only via hoisting luck — fragile on clean installs; supply-chain hygiene.
- **Evidence:** dev-server log (this session): "imported but could not be resolved… walletconnect-adapter.ts".
- **Proposed fix:** declare the dependency in `package.json` (exact version from the lockfile graph) — **requires owner approval (dependency change)**; then re-run `pnpm install --frozen-lockfile` check (lockfile update) and verify `/wallet-web3` journey.
- **Status:** Requires Owner Approval.

### ENG-02 — Hydration error `#418` on published site (root cause unproven)
- **Carried from handoff.** **Proposed:** isolate in Phase 6 with a staging URL; not reproducible in sandbox (no production parity).
- **Status:** Blocked (needs UX-16 resolution).

### ENG-03 — No root `README.md`
- **Severity:** P3 (repo hygiene) · **Proposed:** add a concise README (stack, scripts, env, deploy) in Phase 4 docs commit.
- **Status:** Not Started.

---

## Data-integrity issues (Agent 2 ownership; surfaced by UI audit)

### DATA-01 — Dual tables `user_trades` vs `trades`
- **Impact (user-visible):** dashboard/PnL read `user_trades`; echo/stats read `trades` — a trade logged from the desk may never appear in ECHO learning. UI shows "consistent" numbers that are actually two datasets.
- **Owner:** Agent 2 (schema). **Agent 3 action:** none until contract decided; UI must not paper over it.
- **Status:** Open (Agent 2) — carried from prior audit; still present at baseline (both query paths confirmed by grep map).

### DATA-02 — Premium activation without verified payment (`subscribeToPlan`)
- **Impact:** the page's subscribe button upserts an `active` subscription with no Stars payment verification.
- **Owner:** payments stream — **already addressed by open PRs #26 (draft) + #27**; Agent 3 must not touch the logic and will rebase visual work after those merge.
- **Status:** Open (payments stream).

### DATA-03 — RESOLVED (at wiring level): `/signals` ↔ `daily_signals`
- Prior audit item #6 claimed the cron table was not wired to UI; current code calls `getDailySignals` in `signals.tsx` (line 184) and `_radar/index.tsx` (line 34). Verified statically this session. Runtime check pending Phase 6.

### DATA-04 — Optional-key degraded modes must be designed, not accidental
- Birdeye/OpenRouter/etc. missing keys produce silent degradation today. Phase 3/4 must define explicit "source unavailable" presentation (chips/banners) — see UX-04 pattern.

---

## Change log for this register
- 2026-10-30: initial register created from Phase 0/1 evidence (static + local dev render). 16 UX + 3 ENG + 4 DATA entries. No items marked Done + Verified.
- 2026-10-30 (later): **UX-06 corrected** — global reduced-motion gate already exists in V6 (styles.css L2201–2232); gap narrowed to JS-driven motion (framer springs). Severity P2→P3. Evidence-first policy applied.
- 2026-10-30 (later): **Typecheck re-verification:** `tsc --noEmit` **PASS clean** on `main@b893b62` (run this session) — disproves `AUDIT_FULL_2026.md` item #1 (TS errors in `investigate.tsx` + `mr-vigo/functions.ts`) at current main. Evidence: this session's command log; carried into `page-inventory.md` / `feature-preservation-map.md`.
- 2026-10-30 (later): **`pnpm install --frozen-lockfile` PASS** (30.1s) + dev server boots (port 8080) — dependency-scan warning ENG-01 persists (walletconnect) without blocking.
- 2026-10-30 (Gate 2 revision): **UX-01 + UX-03 recommendations updated** to IA Option B "Crew Rail" (`ia-proposal.md`); Option A withdrawn (owner vision: crew must not be a navigation category alone). **UX-17, UX-18, UX-19 added** from the character-experience review (orb identity drift + motion violation; missing artwork layer pending Agent 1 contract; generic copilot drawer). 19 UX + 3 ENG + 4 DATA entries. No code changed this round.
