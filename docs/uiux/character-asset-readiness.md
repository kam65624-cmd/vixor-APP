# VIXOR APP — Character Implementation Readiness Package

**Agent:** Agent 3 — UI/UX · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1` · **PR:** #29 (Draft)
**Status: READINESS DOCUMENTATION ONLY. — Rev. 2 (final corrections round; see `implementation-changelog.md` Stage 5)**

**Commit lineage (verification metadata — full table in Appendix A):** Phase-0 baseline `main@b893b62` → `main` after PR #28 merge `62df4b0` → Gate 2 revision `06828f7` = **the exact commit used for all code inspection in this package** → readiness package Rev. 1 `bd212f6` → **this corrections commit (Rev. 2, branch HEAD at delivery)**. No application code changed from `06828f7` through HEAD — verified docs-only diffs.

**Why this document exists.** Per the owner's pause directive (2026-10-30): the owner is taking **direct control of character creation and visual identity**. Until owner-approved character sheets, expressions, poses, animations, and interaction specifications are delivered:

1. No character identity is invented, redesigned, generated, or replaced.
2. No placeholder artwork is created or treated as final.
3. Phase 4 visual implementation does not start.
4. No application or navigation restructuring happens based on unapproved character concepts.
5. All existing features, routes, and current working changes are preserved.

This package documents **what exists today**, **what VIXOR APP will need to consume owner-approved assets**, and **the exact integration contract** — so that the moment approved assets arrive, implementation can proceed with zero design ambiguity.

**Ownership statement (owner-set, corrects earlier assumptions).** The Character Studio / Meme & Character App is an **independent product direction whose repository and product ownership is TBD** — it must be established separately and is **not assumed to be Agent 1**. Agent 1's current responsibility is the **TG Content Bot and Content Operations** (a content-production and publishing consumer of approved character identities). **VIXOR APP is a character asset consumer and the presentation owner for character experience inside its own surfaces.** One canonical, versioned, owner-approved **Character Identity Contract** governs all consumers.

**Reading rules.**
- `[EXISTING]` = verified in code at this commit (evidence: file + line). Nothing `[EXISTING]` changes in this task.
- `[PROPOSED]` = required for asset consumption; **not built, not designed as final, blocked on owner-approved assets** (see §10 Dependencies). No proposed item is implemented in this round.
- Monogram avatars (MO / MR / DR / EC) are the **current complete fallback system, not a substitute for the planned owner-approved character asset system**. The artwork layer is absent today and is the layer this package prepares to consume.

---

## 1. Current character identity system — what exists today `[EXISTING]`

Four layers, each with a single source of truth, all verified at this commit:

### 1.1 Semantic registry — who the characters are
**File:** `packages/vixor-gamification/src/characters/registry.ts` (+ `types.ts`; tested by `src/__tests__/character-registry.test.ts`)

| CharacterId | displayName | role | allowedSurfaces | tone | active |
|---|---|---|---|---|---|
| `moxi` | MOXI | `main_guide` | onboarding, discovery, guidance | curious, encouraging, concise, never overconfident | ✅ |
| `mrVigo` | MR.VIGO | `investigator` | investigation, evidence | observant, methodical, evidence-first, skeptical | ✅ |
| `drDex` | DR.DEX | `risk_analyst` | risk_assessment, decision_review | clinical, precise, protective, action-oriented | ✅ |
| `echo` | ECHO | `memory_learning` | history, outcome_review, learning | quiet, reflective, contextual, non-intrusive | ✅ |

Helpers: `getCharacter`, `isActiveCharacter`, `isAllowedSurface`, `getAllActiveCharacters`, `ACTIVE_CHARACTER_IDS`. **These machine ids (`moxi | mrVigo | drDex | echo`) are the canonical keys any asset manifest must use.**

### 1.2 Presentation bridge — how identity renders
**File:** `src/shared/characters.ts` (imported by pages/components; never redefined at page level)

Per character: `icon` (Lucide: MOXI `Activity` · MR.VIGO `Search` · DR.DEX `ShieldCheck` · ECHO `BarChart3`), `tagline`, `description`, `roleLabel`, `route` (`/alpha` · `/investigate` · `/risk` · `/echo` — primary surface CTA targets), `surfaceLabel`, and the token set `colorVar/dimVar/borderVar/glowVar` resolving to `var(--char-*)`. `characterMonogram(id)` yields the two-letter monogram (**MO / MR / DR / EC**). Order: MOXI → MR.VIGO → DR.DEX → ECHO (Decision Loop order).

### 1.3 Design tokens + CSS — the visual grammar
**File:** `src/styles.css` (guarded by `design-token-hygiene.test.ts`)

- `--char-{moxi|vigo|dex|echo}` + `-dim` / `-border` / `-glow` per character (L112–133, defined once in `:root` — **theme-invariant**: no separate light overrides; both themes use the same identity hues): moxi `#06b6d4` cyan · vigo `#8b5cf6` violet · dex `#ef4444` red · echo `#10b981` green.
- `.vx-char-bg-{moxi|vigo|dex|echo}` animated gradient backdrop classes (L1118–1175; ambient loops gated by the global `prefers-reduced-motion` block L2201–2232).
- Character color ONLY via these variables — never hex literals in components (enforced by tests).

### 1.4 i18n layer — EN/AR copy
**Files:** `src/shared/characters-i18n.ts` + `characters` namespace in `src/shared/i18n/translations/{en,ar}.ts` (tested by `characters-i18n.test.tsx`). Localized name/role/tagline/description/surfaceLabel + the 6 guide-state messages + retry + ariaLabel. **Brand marks (MOXI / MR.VIGO / DR.DEX / ECHO) intentionally stay Latin in both languages.**

### 1.5 What does NOT exist today `[EXISTING = nothing]` — verified absence
- **No illustrated character artwork of any kind**: `public/` contains only `favicon.ico`; no character PNG/SVG/GIF/WebP/Lottie anywhere in the repo.
- **No character-asset loading, versioning, caching, or fallback layer**: `src/shared/asset-registry/` is the *trading-asset* registry (pairs like BTC/USDT) — unrelated to character art.
- **No expressions, poses, or motion states** beyond the abstract `CharacterGuide` state machine (§4) and a CSS spinner.
- **No `/crew` route**, no character identity on `/hunt/*`, `/shield/*`, `/tracking`, `/review` pages (verified: zero references).
- **Un-attributed surfaces**: `GovernorRiskPanel` says "Risk Governor" with no DR.DEX identity; `CoachOverlay` runs MOXI backend agents with no MOXI chrome; `OnboardingModal` has no character content; `FloatingCopilot`/`CopilotDrawer` use a generic indigo `Bot` identity that matches no `--char-*` token (UX-17/UX-19 — fixes are Phase 4 work, currently **paused** by this directive).
- `MoxiCharacter3D.tsx` (pure-CSS 3D side character) exists but is **unused** in the live UI; `MoxiAvatar.tsx` is consumed only by it.

---

## 2. Integration-point inventory — exact components & routes per character `[EXISTING]`

### 2.1 MOXI (the Guide)

| # | Surface | Component / location | What renders | Evidence |
|---|---|---|---|---|
| M1 | `/` Home | `routes/_authenticated/index.tsx` | Time-of-day greeting (EN/AR via `useCharacterStrings("moxi")`), "اسأل MOXI" CTA (Bot icon), MOXI Hero input block, `MOXI_QUICK_ACTIONS` (first 4), `CharacterGuide character="moxi"`, decorative `EnergyOrb colorVar="--char-moxi" size={280}` | L11–15, 412, 494–565, 685 |
| M2 | `/discover` | `_discover/index.tsx` | `CharacterGuide character="moxi" compact` as page banner | L5, 527 |
| M3 | Global floating orb | `components/vixor/FloatingCopilot.tsx` (mounted in `app-shell/index.tsx`) | 64×64 draggable orb — **currently indigo/violet gradient + `Bot` icon + infinite bob (identity drift, UX-17)** | L22–36, 71–72, 89–119 |
| M4 | Copilot drawer | `components/vixor/CopilotDrawer.tsx` (opened from orb) | "MOXI" title text + generic `Bot` icons (20px header, 32px empty state); chat via `hooks/useCopilot.ts`; **no persona chrome (UX-19)** | L34, 87, 97, 137, 209 |
| M5 | `/trade-desk` | `components/vixor/CoachOverlay.tsx` | Live trade coaching from `coachTrade` (moxi server agent) — **no MOXI visual identity** | imports L19 |
| M6 | `/v2/onboarding` | `routes/v2/onboarding.tsx` | 3-step walkthrough (welcome → network → ready); MOXI `displayName` in hero text | L4, 20, 38 |
| M7 | `/loop` (legacy) | `routes/_authenticated/loop.tsx` | First card in the 4-character Decision-Loop flow + surface table row (all four via `CHARACTERS`) | L110, 181 |
| M8 | Server agents | `domains/moxi/` (`agents.ts`, `server/{analyst,coach,governor,hunter}.agent.ts`, `tools.ts`: `analyzePair`/`trackSignal`/`createPriceAlert`, `context-engine.ts`, `notification-hub.ts`, `prompt.ts`) | All MOXI intelligence behavior (auth-gated server fns) | dir listing |
| M9 | Persona system (server-side only) | `domains/moxi/persona.ts` | `moxi_personas` table: user-customizable name/personality/communicationStyle/avatarVariant; 8 avatar variants defined in `AVATAR_VARIANTS` (gradient circles). **No persona UI exists today** | persona.ts L29–68, 83–129 |

### 2.2 MR.VIGO (the Investigator)

| # | Surface | Component / location | What renders | Evidence |
|---|---|---|---|---|
| V1 | `/investigate` | `routes/_authenticated/investigate.tsx` | `CharacterHero character="vigo"` (monogram avatar + `.vx-char-bg-vigo` animated gradient + stats), `CharacterGuide character="mrVigo"`, `ParticleNetwork colorVar="--char-vigo"`, page meta title "Investigation — MR.VIGO — VIXOR"; accepts `?address=&chain=` search params | L38–41, 45–55, 459–462 |
| V2 | `/hunt/*` (radar, whales, alpha, token/$address, verified/$id) | `routes/_authenticated/hunt/*.tsx` | **No VIGO identity today** — pages exist, un-attributed (UX-01: also unreachable from global nav) | verified: zero vigo refs |
| V3 | `/v2/case/$caseId/evidence` | `routes/v2/case/$caseId/evidence.tsx` | `getCharacter("mrVigo")` displayName in evidence stage header | L21, 72 |
| V4 | v2 stage chips | `routes/v2/case/$caseId.tsx` | `STAGE_LABELS` maps `evidence_loading`/`evidence_ready` → `characterId: "mrVigo"` (text/color chips) | L30–31 |
| V5 | Server domain | `domains/mr-vigo/` (functions, types) + HUNT clients (Birdeye/DexScreener/whale classifier) | Investigation data functions | dir listing |

### 2.3 DR.DEX (the Risk Analyst)

| # | Surface | Component / location | What renders | Evidence |
|---|---|---|---|---|
| D1 | `/risk` | `routes/_authenticated/risk.tsx` | `CharacterGuide character="drDex"`, `ParticleNetwork`, paper-decision flow (`logPaperDecision`) | L44, 817 |
| D2 | `/shield/*` (index, scanner, trust/$address, cases, alerts, exposure) | `routes/_authenticated/shield/*.tsx` | **No DEX identity today** — pages exist, un-attributed (UX-01) | verified: zero dex refs |
| D3 | `/trade-desk` | `components/vixor/GovernorRiskPanel.tsx` | "Risk Governor" panel (Allow/Warning/Blocked) — **no DR.DEX attribution** | L230, 300 |
| D4 | `/v2/case/$caseId/risk` | `routes/v2/case/$caseId/risk.tsx` | `getCharacter("drDex")` displayName in risk stage header | L34, 82 |
| D5 | v2 stage chips | `$caseId.tsx` | `risk_assessed`/`decision_pending` → `characterId: "drDex"` | L32–33 |
| D6 | Server domain | `domains/dr-dex/` + `domains/risk-governor/` + `domains/shield/` (GoPlus/rugcheck clients, trust-score engine, governor engine) | Risk/scanning data functions | dir listing |

### 2.4 ECHO (the Memory)

| # | Surface | Component / location | What renders | Evidence |
|---|---|---|---|---|
| E1 | `/echo` | `routes/_authenticated/echo.tsx` | `CharacterGuide character="echo"`, `ParticleNetwork`, stats panel (`getEchoOverview` + `components/echo/EchoStatsPanel.tsx`) | L42, 654 |
| E2 | `/tracking` · `/review` · `/daily-loop` (EOD) | tracking/review/daily-loop routes | **No ECHO identity today** — tracking/review un-attributed (UX-01); daily-loop EOD records reviews without ECHO branding | verified |
| E3 | `/v2/case/$caseId/decision` + stage chips | `$caseId.tsx`, `decision.tsx` | `decision_recorded`/`tracking`/`outcome_reviewed` → `characterId: "echo"` | L34–35 |
| E4 | `/loop` (legacy) | `loop.tsx` | 4th card in Decision-Loop flow | L110 |
| E5 | Server domain | `domains/echo/` + `domains/signal-tracking/` (transition engine, auto-track, TP/SL invariants) | Outcome/learning data functions | dir listing |

### 2.5 Cross-character `[EXISTING]`
- **`/loop`** is the only page that renders all four characters together (flow diagram + surface table, `CHARACTERS.map`).
- **`CharacterGuide`** (6 states, §4) is the single guidance-card primitive, used on Home (moxi), Discover (moxi, compact), Investigate (mrVigo), Risk (drDex), Echo (echo).
- **`CharacterHero`** (monogram hero banner) exists but is wired only on `/investigate`.
- v2 case pages map every workflow stage to a character (`STAGE_LABELS`, 10 stages).

---

## 3. Asset slot inventory & required formats, dimensions, resolutions `[PROPOSED intake spec]`

These are the **consumption slots** where owner-approved assets would render. Sizes are the *actual rendered CSS pixels in current code* (source of truth for required resolutions). Raster assets require **@1x/@2x/@3x**; **SVG is preferred** wherever the art allows (infinitely dense, theme-adaptable, tiny).

**Approved asset-delivery direction (owner decision D-12, 2026-10-30 — an approved decision, not an open question; resolves former question B1):** the owner has approved delivery of **BOTH 2D and 3D** character assets. Three distinct deliverable classes:

| Deliverable class | What it is | Role in the pipeline | Consumed at runtime by VIXOR? |
|---|---|---|---|
| **3D source / model deliverables** | canonical 3D character models and their source files | owner-side canonical sources — all future renders and derivations come from these | **No** — never loaded by the app |
| **Cinematic 3D renders** | rendered stills/sequences produced from the 3D models | cinematic / marketing / reference material; may serve as the visual source for raster stills | Only as **derived raster stills** that pass the intake rules below |
| **2D adaptations** | derived 2D artwork (SVG / PNG / Lottie) produced from the approved designs | the **runtime consumption class** — what this entire spec (slots, formats, budgets, manifest) governs | **Yes** — via the manifest contract (§7) |

Everything in the slot table and format rules below therefore applies to the **2D-adaptation outputs** (and to render-derived stills that meet the same rules). 3D sources and cinematic renders are owner-pipeline deliverables — honored, versioned, and referenced — but they are **not runtime manifest entries**.

| Slot ID | Component (existing) | Rendered size | Today's content | Required formats | Priority |
|---|---|---|---|---|---|
| S1 `guide-avatar` | `CharacterGuide` monogram box | 40×40 (rounded-xl) | 2-letter monogram text | SVG **or** PNG 48/80/120px, transparent | P0 (highest-traffic character surface) |
| S2 `guide-corner-icon` | `CharacterGuide` corner box | 32×32 box, 16px glyph | Lucide icon | SVG 20/32/48px | P1 (SVG only — must scale to 16px legibly) |
| S3 `hero-avatar` | `CharacterHero` avatar circle (glow) | ~48–56px circle within banner | monogram | SVG **or** PNG @3x ≥168px | P1 |
| S4 `hero-backdrop` | `.vx-char-bg-*` gradient classes | full-bleed banner | code-generated gradient (CSS) | *(no asset required — CSS persists; optional static SVG texture if owner wants)* | P2 |
| S5 `orb` | `FloatingCopilot` | 64×64 (draggable, global) | gradient + Bot icon (**drift, to fix**) | SVG **or** PNG 64/128/192px + optional state ring | P0 (most-seen surface) |
| S6 `drawer-header` | `CopilotDrawer` header + empty state | 20px + 32px contexts + "MOXI" text | Bot icon + text | SVG 24/40/96px | P0 |
| S7 `loop-card` | `/loop` `CharacterCard` | 40×40 (rounded-xl) + 18px icon | monogram + icon | same as S1 | P2 (legacy route) |
| S8 `stage-chip` | v2 case `STAGE_LABELS` chips | ~14–16px inline | text + token color | optional 16px mini-glyph SVG | P2 |
| S9 `state-avatars` | `CharacterGuide` states (§4) | 40×40 | spinner/monogram | per-state variants of S1 (see §4) | P0 |
| S10 `full-body` | **no existing surface** — onboarding/welcome moments are `[PROPOSED]` | up to ~60% viewport width on 390–430px; desktop rail ~360px column | — (nothing) | SVG **or** PNG @2x, min canvas 800×800, transparent bg | P1 (only if owner specs onboarding art) |
| S11 `energy-orb-fx` | Home `EnergyOrb` | 280px decorative | code-generated orb (CSS/canvas) | *(no asset required — decorative FX stays code-generated)* | — |
| S12 `persona-avatars` | `MoxiAvatar` 8 variants (currently unused in live UI) | default 40px, scalable | gradient circles + letter | PNG/SVG per variant @3x ≥120px | P3 (decide with owner: keep variants as *user-chosen frames* around approved art, or retire) |

**Animation formats `[PROPOSED]` (runtime engineering contract):**
- **Lottie JSON** (`lottie-web`-compatible) is the only accepted rich-animation format — vector, small, runtime-controllable, frame-seekable for reduced-motion statics.
- CSS/SVG-native animation acceptable for simple effects.
- **Video (MP4/WebM/GIF) is NOT accepted at runtime** (size, pause control, reduced-motion safety).
- Any animated asset **MUST** ship a static poster/first-frame (SVG or PNG) — this is a hard intake requirement (§6).
- Size budgets: avatar-class assets ≤ 50 KB each; Lottie ≤ 120 KB each; full-body ≤ 250 KB.

**Reference deliverables vs. runtime formats — two different contract classes (correction, D-13):**
- **Creative production references** — character design sheets, expression sheets, pose sheets, animation storyboards, animatics, and AI-video explorations (e.g., Google Flow / Veo outputs) — are **owner-side creative reference deliverables**. They define *what the character looks like and how it behaves*; they are inputs to the owner's production pipeline.
- **Runtime animation requirements** (this block, plus the §4.3 motion laws, §5 loading/fallback, §6 a11y, §7 manifest) are a **separate engineering contract** defining *what the app can load*.
- **No automatic conversion is assumed or implied:** a storyboard, animatic, or Google Flow video does **not** become a production-ready Lottie animation by itself. Producing runtime assets from references (rebuild as Lottie/SVG, export posters, meet size budgets) is an owner-pipeline production step, and only its **outputs** are validated at VIXOR intake. This is exactly why video remains non-consumable at runtime *even though* video is a legitimate creative reference format.

**File naming/versioning `[PROPOSED]`:** content-hashed filenames (`moxi-state-thinking@3x-a1b2c3.png`), immutable URLs, no query-string cache busting.

---

## 4. Required animation states & interaction events

### 4.1 States `[EXISTING state machine → PROPOSED asset mapping]`

`CharacterGuide` already defines the canonical 6-state machine (`CharacterGuideState`, `CharacterGuide.tsx` L41): `idle · loading · ready · working · success · error`, with `aria-busy` on async states and a polite `role="status"` live region. **The owner-approved asset set must cover, at minimum, these four runtime UI states per character** (they collapse the six UI states):

| Asset state | Covers UI states | Current visual | Asset requirement `[PROPOSED]` |
|---|---|---|---|
| `neutral` | idle, ready | monogram + Sparkles icon | static avatar (S1/S5/S6 variant) |
| `thinking` | loading, working | monogram + `Loader2` spinner | ≤240ms looping micro-animation OR static variant + existing spinner; **poster required** |
| `success` | success | monogram + CheckCircle2 | static (one-shot ≤250ms entrance acceptable; no loop) |
| `error` | error | monogram + AlertTriangle | static (same rules) |

States map 1:1 to `CharacterGuide` — the component is the rendering contract, so assets drop into a system that already announces state changes accessibly.

**Scope clarification (owner direction D-13, 2026-10-30 — resolves former question B5):** `neutral / thinking / success / error` is the **minimum runtime UI state mapping** — the floor required by the existing `CharacterGuide` machine — **NOT the complete creative expression library**. The owner's production direction includes **full expression sheets, poses, animation references, and interaction specifications** for each character. A richer creative library is expected and welcome: the mapping above only guarantees that, whatever the library contains, at least these four states can be rendered per character in the current UI. Mapping additional expressions and poses from the creative library onto specific surfaces is precisely what DEP-3 (interaction specifications) governs — and that mapping stays owner-defined.

### 4.2 Interaction events `[EXISTING mechanics → PROPOSED character moments]`

Existing mechanics an asset can react to (all in code today): dock/tab `whileHover`/`whileTap` (framer-motion, BottomBar), orb drag + open (FloatingCopilot), drawer open/close, guide-card state changes, page-enter transitions, streak milestone moment (daily-loop, the single ceremonial motion allowed by the design direction).

`[PROPOSED — blocked on owner-approved interaction specs]` character moments that would consume state assets: hand-off between characters (relay), verdict render on scan completion, TP/SL outcome receipt, EOD hand-over, onboarding welcome. **None of these are built**; they are the demand signal for the `success`/`thinking`/`error` states above.

### 4.3 Motion laws (VIXOR design system — apply to every asset)
120–250ms transitions · decelerate entrances · nothing bounces · **no ambient/idle loops** (one-shot state expressions only; the existing orb bob and gradient backdrops are pre-existing deviations — orb fix is Phase 4, currently paused) · `prefers-reduced-motion`: **static variant mandatory** (global CSS gate exists at `styles.css` L2201–2232; JS gate `useReducedMotion()` planned with Phase 4) · no flashing > 3 Hz (seizure safety).

---

## 5. Loading, versioning, caching, fallback `[PROPOSED — nothing exists today]`

Verified: no character-asset infrastructure exists (§1.5). The following is the consumption contract to be built **only after** owner approval + asset delivery:

1. **Manifest-driven:** a single versioned JSON manifest (schema §7) is the only entry point. VIXOR pins a **manifest version per app release** — no runtime "latest" fetch (predictability, security, reproducible screenshots).
2. **Loading:** assets load lazily per-surface via native `<img loading="lazy">` / dynamic import for Lottie; **routes never block on character art** — the monogram renders instantly, artwork swaps in on arrival. All slots have fixed dimensions/aspect ratio (§3) → zero layout shift.
3. **Caching:** content-hashed URLs + immutable cache headers → permanent browser/CDN cache; a new asset = new hash = cache-safe. Offline: cached art shows; uncached → monogram.
4. **Fallback chain (hard rule):** `approved artwork → monogram avatar → initials text`. **No broken images, no empty circles, ever.** Missing/failed/filters-failed assets degrade silently to the monogram — the current system *is* the fallback, which is why it stays untouched.
5. **Intake validation `[PROPOSED]`:** a CI check (Phase 4) verifying manifest schema, presence of posters for animations, EN/AR alt text, budget compliance, and hash integrity before a version pins.
6. **No backend work required for consumption** — assets are static files; the manifest is versioned in-repo or fetched from an owner-controlled location (hosting decision: §10 DEP-5).

---

## 6. Accessibility, reduced-motion, responsive, EN/AR & RTL requirements

**Accessibility (WCAG 2.2 AA target):**
- Every meaningful asset carries **alt text in EN and AR** (manifest field §7); decorative instances render `aria-hidden` (pattern exists: EnergyOrb, ParticleNetwork).
- CharacterGuide's live region (`role="status"`, `aria-live="polite"`) already announces state changes — artwork must not reintroduce its own announcements (no `aria-live` on media).
- Identity is **never color-only**: monogram + localized name text always accompany any avatar (existing law; keeps 4-character distinction for color-blind users).
- Artwork must not reduce contrast of adjacent text or obscure `:focus-visible` rings; interactive character surfaces remain ≥44×44px targets (UX-14 gap tracked separately).
- No flashing > 3 Hz; motion per §4.3.

**Reduced motion:** every animated asset ships a static poster; app renders the poster under `prefers-reduced-motion` (CSS gate exists; JS gate lands with Phase 4). Animated assets without a poster are **rejected at intake**.

**Responsive / platforms:** primary 390–430px mobile (Telegram mini-app: dock 72px + safe-area insets), desktop ≥1024px with 360px context rail. Assets must stay legible from 16px (S2/S8 chips) to ~280px moments; raster @3x per §3. Dark-first with full light parity — `--char-*` identity hues are theme-invariant (§1.3), so **artwork must read on both dark and light surfaces** (dark + light variants in the manifest, or a single variant verified legible on both).

**EN/AR & RTL:**
- Brand marks stay Latin (existing i18n rule); alt text localized both locales.
- **No text baked into artwork** (untranslatable); if the owner's art includes typography, per-locale variants are required.
- Directional art (facing/gesturing) must be **direction-neutral OR provide an RTL-mirrored variant** — the app mirrors layout via `dir="rtl"` and the existing `[dir="rtl"] [data-flip]` utility; mirrored Lottie is NOT auto-safe → RTL variant rule stands.
- Arabic character copy renders in Amiri display (existing); artwork style is the owner's call.

---

## 7. Integration contract — consuming owner-approved character assets `[PROPOSED spec]`

**One canonical Character Identity Contract, versioned, owner-approved, shared by all consumers** (VIXOR APP, TG Content Bot, and the future Character Studio once its ownership is established). VIXOR APP does not own or define character identity — it consumes.

### 7.1 Ownership matrix (corrected per directive)

| Concern | Owner |
|---|---|
| Character creation, visual identity, sheets, expressions, poses, animations | **Owner (direct control)** |
| Character Studio / Meme & Character App product | **TBD — repository/product ownership to be established separately; NOT assumed to be Agent 1** |
| TG Content Bot & Content Operations (content-production + publishing consumer) | Agent 1 (current scope) |
| Character asset consumption + presentation inside VIXOR surfaces | VIXOR APP (Agent 3) |
| Canonical Character Identity Contract (schema) | Owner-approved; one versioned schema for all consumers |
| Semantic registry (roles/surfaces/tones in VIXOR) | VIXOR repo (`vixor-gamification` package) — mirrors canon; changes need owner approval |

### 7.2 Manifest schema (v1 — for owner review, not implemented)

```jsonc
{
  "schemaVersion": "1.0.0",          // semver; breaking changes = major
  "manifestVersion": "1.0.0",        // pinned per VIXOR release
  "generatedAt": "2026-10-30T00:00:00Z",
  "approval": { "approvedBy": "<owner>", "approvedAt": "ISO-8601" },
  "characters": {
    "moxi": {                         // KEY = registry machine id (§1.1) — canonical
      "assets": {
        "avatar-neutral": {
          "slot": "S1",               // §3 slot id
          "variants": [
            { "theme": "dark",  "format": "svg", "src": "moxi/neutral-dark-a1b2c3.svg" },
            { "theme": "light", "format": "svg", "src": "moxi/neutral-light-d4e5f6.svg" }
          ],
          "altText": { "en": "MOXI", "ar": "MOXI" },
          "rtl": "neutral"            // "neutral" | "mirrored-variant"
        },
        "state-thinking": {
          "slot": "S9",
          "animation": { "format": "lottie", "src": "moxi/thinking-b7c8d9.json",
                         "poster": "moxi/thinking-poster-e0f1a2.svg",
                         "durationMs": 240, "loop": true },   // loop ONLY for "thinking"
          "altText": { "en": "MOXI is thinking", "ar": "MOXI يفكر" }
        },
        "state-success":  { "…": "static; entrance ≤250ms; loop:false" },
        "state-error":    { "…": "static; loop:false" },
        "full-body":      { "…": "optional; S10; min 800×800 canvas" }
      }
    }
    // "mrVigo", "drDex", "echo" — same shape
  }
}
```

**Hard intake rules (VIXOR enforces on consumption):** keys = registry machine ids · poster REQUIRED for every animation · `altText` REQUIRED in both locales · `loop:true` only for `thinking` · colors of in-app chrome still come from `--char-*` tokens (art must be consistent with the character's identity hue; the app never recolors art) · checksums (sha256) on every file · size budgets §3 · manifest entries are **runtime assets only** (2D adaptations / render-derived stills — §3 deliverable classes, D-12); 3D sources and cinematic renders are owner-side deliverables, not manifest entries.

### 7.3 Approval → consumption flow
1. Owner approves character sheets / expressions / poses / animations / interaction specs.
2. Assets published per manifest (hosting decision §10 DEP-5) or delivered into the repo.
3. VIXOR pins the manifest version; CI intake validation runs (§5.5).
4. Phase 4 consumption layer (slot components read manifest → artwork, else monogram) — **staged, screenshot-verified, behind the existing gates**; still requires the owner's Phase-4 go-ahead per the pause directive.

### 7.4 Non-goals (binding)
VIXOR APP will **not** generate, edit, fork, or substitute character artwork; will not treat monograms as the end state; will not add characters, change names/roles/tones, or alter `--char-*` identity hues without owner approval; will not animate beyond §4.3 laws; will not build any character-creation capability.

---

## 8. Asset → surface mapping (every approved asset to its application surface)

When the owner delivers assets, each manifest entry maps to these exact surfaces (slot ids per §3):

| Manifest asset | Slot | Renders on (component → route) | Character(s) | State |
|---|---|---|---|---|
| `avatar-neutral` | S1 | `CharacterGuide` → `/` `/discover` `/investigate` `/risk` `/echo` | all 4 | idle/ready |
| `avatar-neutral` | S5 | `FloatingCopilot` orb → global (all routes) | moxi | resting |
| `avatar-neutral` | S6 | `CopilotDrawer` header/empty state → global drawer | moxi | resting |
| `avatar-neutral` | S3 | `CharacterHero` → `/investigate` (extendable to other character-led surfaces only as approved Phase-4 work) | owner-scoped | resting |
| `avatar-neutral` | S7 | `/loop` character cards | all 4 | resting |
| `state-thinking` | S9 | `CharacterGuide` loading/working — scan, analyze, investigation runs | all 4 | loading/working |
| `state-success` | S9 | `CharacterGuide` success — verdict saved, tracking created, review logged | all 4 | success |
| `state-error` | S9 | `CharacterGuide` error + retry | all 4 | error |
| `full-body` | S10 | onboarding/welcome moments — **surface itself is `[PROPOSED]`**; no existing route renders full-body today | owner-scoped | welcome |
| (none) | S4, S11 | hero backdrops + EnergyOrb stay **code-generated** — no artwork consumed | — | — |
| (none) | S8 | stage chips stay text+token-color unless owner specs mini-glyphs | — | — |
| `persona-frames` (optional) | S12 | persona variants — **decision needed** (§10 DEP-8): keep as user-chosen frames around approved art, or retire | moxi | — |

**Unattributed high-value surfaces that approved assets would let us identity-align (all `[PROPOSED]`, all Phase-4, all paused):** `/shield/*` → DR.DEX · `/hunt/*` → MR.VIGO · `/tracking` `/review` → ECHO · `GovernorRiskPanel` → DR.DEX · `CoachOverlay` → MOXI · `OnboardingModal` → MOXI/crew. None of these change until the owner approves both the assets and the Phase-4 build.

---

## 9. Existing vs. proposed — explicit separation

| Capability | Status | Evidence / blocker |
|---|---|---|
| Semantic registry (4 characters, roles, surfaces, tones) | `[EXISTING]` | `vixor-gamification/registry.ts` + tests |
| Presentation bridge (icons, monograms, tokens, routes) | `[EXISTING]` | `shared/characters.ts` + tests |
| `--char-*` identity tokens + gradient backdrops | `[EXISTING]` | `styles.css` L112–133, L1118–1175 |
| EN/AR character copy pipeline | `[EXISTING]` | `characters-i18n.ts` + translations + tests |
| `CharacterGuide` 6-state card, a11y live region | `[EXISTING]` | used on 5 routes |
| `CharacterHero` monogram banner | `[EXISTING]` | wired on `/investigate` only |
| MOXI server agents, tools, persona storage | `[EXISTING]` | `domains/moxi/*` |
| Character artwork (avatars, expressions, poses, animations) | **ABSENT — owner-controlled** | no art in repo; arrives only via owner approval |
| Character-asset manifest, loading, caching, intake validation | `[PROPOSED]` | §5, §7 — build after assets + approval |
| Artwork slots in Guide/Hero/Orb/Drawer components | `[PROPOSED]` | §3, §8 — Phase 4 |
| Identity alignment of shield/hunt/tracking/review/governor/coach | `[PROPOSED]` | §8 — Phase 4 |
| Crew hub `/crew`, dock restructure, onboarding rework | `[PROPOSED — PAUSED]` | per directive item 4: no nav restructuring on unapproved character concepts |
| Orb re-skin to `--char-moxi` (UX-17), drawer chrome (UX-19) | `[PROPOSED — PAUSED]` | token-compliance fixes, but Phase-4 visual work → paused with everything else |

---

## 10. Implementation dependencies (the list)

**Blocked-on-owner (hard sequence — nothing below starts without these):**

- **DEP-1 — Owner-approved character sheets** (per character): canonical name, role, palette, silhouette, proportions, expression set. *Owner.*
- **DEP-2 — Approved creative library** (owner's production direction: full expression sheets, poses, animation references, interaction specifications), which must include — **at minimum** — the four runtime UI states (`neutral/thinking/success/error`) per character (§4.1, D-13). *Owner.*
- **DEP-3 — Approved poses & interaction specifications** (which pose/expression for which surface & event, §4.2). *Owner.*
- **DEP-4 — Approved runtime animation deliverables** (format, durations, posters, reduced-motion statics, §4.3) — the engineering-contract **outputs** produced from the creative references; a storyboard, animatic, or Google Flow video is a reference, not a runtime asset (§3, D-13). *Owner.*
- **DEP-5 — Published asset pack + versioned manifest** (or in-repo delivery) covering the **2D-adaptation runtime class** plus render-derived stills that pass intake; 3D sources and cinematic renders stay owner-side (D-12) — includes the **hosting decision** (owner-controlled location vs. VIXOR repo). *Owner.*
- **DEP-6 — Canonical Character Identity Contract sign-off** (schema §7.2) — one versioned schema binding all consumers (VIXOR APP, TG Content Bot, future Studio). *Owner.*
- **DEP-7 — Character Studio repository/product ownership established** (TBD, separate from Agent 1's current TG Content Bot scope). *Owner decision.*
- **DEP-8 — Localization & direction decisions per asset:** EN/AR alt text, RTL variant or direction-neutrality, text-in-art policy (§6). *Owner, informed by this package.*
- **DEP-9 — Owner approval of THIS readiness package** — unblocks *only* the build of the consumption layer (manifest loader, intake validation, slot components with monogram fallback), which itself remains scheduled behind DEP-1…DEP-5.
- **DEP-10 — Owner Phase-4 go-ahead** (lift of the pause directive) for any visual implementation, including the UX-17/UX-19 token-compliance fixes and any IA change.

**Already in place (no dependency):** registry, bridge, tokens, i18n, CharacterGuide state machine + live region, monogram fallback, reduced-motion CSS gate, tests (`character-registry`, `characters-i18n`, `design-token-hygiene`, `nav-strings`).

**Explicitly out of scope:** no code changes, no artwork generation, no Phase 4, no merge, no deployment (this round is documentation only).

---

## Appendix A — Verification metadata & log (corrected 2026-10-30, Rev. 2)

**Commit lineage — four distinct facts, never conflated:**

| Commit | Role | Verified fact |
|---|---|---|
| `b893b62` | **Original Phase-0 baseline** — `main` when this branch was created | Phase 0–1 audits ran against it (changelog Stages 0–1) |
| `62df4b0` | `main` after the owner merged PR #28 (2026-10-30T03:12:31Z); branch fast-forward point for the Gate 2 revision | Stage 3 branch base |
| `06828f7` | **Gate 2 revision commit — the EXACT commit used for all code inspection in this package** (it was branch HEAD at inspection time) | every `[EXISTING]` file:line evidence in §1–§2, §4, §9 was read at this commit |
| `bd212f6` | **Readiness package Rev. 1** — the commit that added this document + the pause records | documentation only: `git diff 06828f7..bd212f6` touches `docs/uiux/` only — **zero application code** (verified) |
| *(this commit)* | **Readiness corrections Rev. 2 — current branch HEAD at delivery of this round** | documentation only; no code re-inspection performed, because no application code changed since the `06828f7` inspection (verified by diff) |

**Correction recorded:** the Rev. 1 header said "base commit `06828f7`" and this appendix was titled "this session, commit `06828f7`" — phrasing that risked reading `06828f7` as the *latest* verification commit. The table above is the accurate statement: **inspection happened at `06828f7`; the document landed at `bd212f6`; the corrections round is the commit after `bd212f6`** (exact SHA in `implementation-changelog.md` Stage 5 and the delivery report). All Rev. 1 `[EXISTING]` evidence remains valid — no application code changed between these commits.

**Method (inspection at `06828f7`):** direct file reads + `rg` searches over `src/`, `packages/`, `public/`. Key evidence: registry (`packages/vixor-gamification/src/characters/registry.ts` complete read) · bridge (`src/shared/characters.ts` complete read, L31–164) · tokens (`src/styles.css` L112–133, L1118–1175) · CharacterGuide (complete read; states L41, live region L171–189, avatar L134–139) · CharacterHero (props L36–52) · FloatingCopilot (L22–36 bob, L71–72 64×64) · CopilotDrawer (L34/87/97/137/209 Bot+MOXI) · MoxiAvatar + AVATAR_VARIANTS (`domains/moxi/persona.ts` L29–68) · MoxiCharacter3D unused (usage scan) · OnboardingModal no-character (L4–19) · GovernorRiskPanel "Risk Governor" (L230) · CharacterGuide usage sites (5 routes) · CharacterHero usage (investigate only) · hunt/shield/tracking/review identity absence (zero refs) · `/loop` all-four flow (L110–193) · v2 stage→character map (`v2/case/$caseId.tsx` L26–35) · v2 onboarding moxi (L20/38) · `public/` = favicon.ico only · `asset-registry` = trading pairs (types.ts read) · persona table (persona.ts L83–129).

## Appendix B — Questions to the owner (B1 & B5 now resolved decisions; B2–B4 remain open)

**Resolved / clarified by owner decision (2026-10-30 — recorded as decisions in `owner-decisions.md`, no longer open questions):**

- **B1 — RESOLVED (D-12):** approved asset delivery is **BOTH 2D and 3D**, as three distinct deliverable classes — **3D source/model deliverables** (owner-side canonical sources, never loaded by the app), **cinematic 3D renders** (cinematic/reference material; may seed render-derived raster stills), and **2D adaptations** (the runtime consumption class governed by §3/§7). See the deliverable-class table in §3.
- **B5 — CLARIFIED (D-13):** `neutral/thinking/success/error` is the **minimum runtime UI state mapping** required by the existing `CharacterGuide` machine — **not the complete creative expression library**. The owner's production direction includes full expression sheets, poses, animation references, and interaction specifications (§4.1 scope clarification). Creative references remain separate from runtime animation formats (§3).

**Still open (no action until answered):**

1. **B2:** Should the **8 MOXI persona variants** (M2.1/M9) survive as user-selectable *frames* around approved art, be replaced by approved alternates, or retire? (S12, DEP-8.)
2. **B3:** Hosting: owner-controlled asset location vs. delivery into the VIXOR repo? (DEP-5.)
3. **B4:** Is **full-body art** desired for onboarding/first-run moments (S10), or avatar-class assets only for v1?
