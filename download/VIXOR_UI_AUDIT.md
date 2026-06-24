# VIXOR — UI/UX Audit Report

**التاريخ:** 2026-06-24
**الـ Auditor:** z.ai Core Flow Agent
**الـ Repo:** vixor-app.vercel.app
**الـ Stack:** TanStack Start + React 19 + Tailwind v4 + shadcn/ui + Supabase

---

## Executive Summary

| Metric | Value |
|--------|-------|
| إجمالي الصفحات | 36 (+ /auth) |
| إجمالي الـ components | 62 ملف (~9,886 سطر) |
| عدد الـ hardcoded colors | 339 تكرار في 29 ملف |
| عدد الـ max-w-* constraints | 5 (مناسب) |
| عدد الـ silent error catches | 15+ client-side |
| عدد الصفحات بدون AppShell | 0 (الكل مع AppShell) |
| Pages بـ Empty State | 25 من 27 |
| Pages بـ Loading State | 25 (كامل مع PageLayout) |
| Pages بـ Error State | 2 فقط (auth + copilot) |

### أكبر 5 مشاكل:

1. **Dual Design System** — 4 أنظمة ألوان مختلفة (CSS vars + THEME constant + inline hex + Tailwind color overrides) بتتعارض مع بعض
2. **Fonts مش محملة** — Inter و JetBrains Mono معرّفين في CSS لكن مفيش `<link>` tag بيحمّلهم فعلاً
3. **DataRow `<div>` مش `<button>`** — كل الـ lists في التطبيق غير قابلة للوصول بالكيبورد
4. **Systemic sub-12px text** — 90% من النصوص بحجم 8-10px، صعب القراءة على الموبيل
5. **15+ silent catch blocks** — أخطاء copilot/settings/onboarding بتبتلع من غير ما المستخدم يعرف

### الـ readiness لتصميم Stitch: **MEDIUM**
التطبيق شغال واكمل لكن محتاج **إعادة هيكلة الـ Design Tokens** و**توحيد الأنظمة** قبل ما التصميم الجديد يطبق.

---

## Project Map

### Routes

| # | Route Path | File Path | Auth | In Nav? |
|---|------------|-----------|------|---------|
| 1 | `/` | `_authenticated/index.tsx` | ✅ | Bottom: Home |
| 2 | `/auth` | `auth.tsx` | ❌ | — |
| 3 | `/analyze` | `_authenticated/analyze.tsx` | ✅ | Bottom: Analyze (كان) |
| 4 | `/analysis/:id` | `_authenticated/analysis.$id.tsx` | ✅ | Dynamic |
| 5 | `/alpha` | `_authenticated/alpha.tsx` | ✅ | More → Analytics |
| 6 | `/arbitrage` | `_authenticated/arbitrage.tsx` | ✅ | — |
| 7 | `/bags` | `_authenticated/bags.tsx` | ✅ | More → Portfolio |
| 8 | `/backtest` | `_authenticated/backtest.tsx` | ✅ | — |
| 9 | `/charts` | `_authenticated/charts.tsx` | ✅ | — |
| 10 | `/communities` | `_authenticated/communities.tsx` | ✅ | More → Social |
| 11 | `/copilot` | `_authenticated/copilot.tsx` | ✅ | Bottom: Copilot |
| 12 | `/curves` | `_authenticated/curves.tsx` | ✅ | More → DeFi |
| 13 | `/daily-loop` | `_authenticated/daily-loop.tsx` | ✅ | — |
| 14 | `/discover` | `_authenticated/discover.tsx` | ✅ | Bottom: Discover |
| 15 | `/experiments` | `_authenticated/experiments.tsx` | ✅ | — |
| 16 | `/journal` | `_authenticated/journal.tsx` | ✅ | — |
| 17 | `/notifications` | `_authenticated/notifications.tsx` | ✅ | Bell icon |
| 18 | `/pnl` | `_authenticated/pnl.tsx` | ✅ | More → Portfolio |
| 19 | `/portfolio` | `_authenticated/portfolio.tsx` | ✅ | More → Portfolio |
| 20 | `/predictions` | `_authenticated/predictions.tsx` | ✅ | More → Analytics |
| 21 | `/premium` | `_authenticated/premium.tsx` | ✅ | — |
| 22 | `/perpetuals` | `_authenticated/perpetuals.tsx` | ✅ | More → DeFi |
| 23 | `/profile` | `_authenticated/profile.tsx` | ✅ | Avatar icon |
| 24 | `/pulse` | `_authenticated/pulse.tsx` | ✅ | Bottom: Pulse |
| 25 | `/referral` | `_authenticated/referral.tsx` | ✅ | — |
| 26 | `/rewards` | `_authenticated/rewards.tsx` | ✅ | More → Social |
| 27 | `/settings` | `_authenticated/settings.tsx` | ✅ | — |
| 28 | `/signals` | `_authenticated/signals.tsx` | ✅ | More → Social |
| 29 | `/token/:symbol` | `_authenticated/token.$symbol.tsx` | ✅ | Dynamic |
| 30 | `/trade-desk` | `_authenticated/trade-desk.tsx` | ✅ | — |
| 31 | `/trackers` | `_authenticated/trackers.tsx` | ✅ | More → Analytics |
| 32 | `/vision` | `_authenticated/vision.tsx` | ✅ | More → Social |
| 33 | `/wallet-web3` | `_authenticated/wallet-web3.tsx` | ✅ | More → Portfolio |
| 34 | `/whale` | `_authenticated/whale.tsx` | ✅ | More → Analytics |
| 35 | `/yield` | `_authenticated/yield.tsx` | ✅ | More → DeFi |
| 36 | `/activity-web3` | `_authenticated/activity-web3.tsx` | ✅ | — |
| 37 | `/admin/api-keys` | `_authenticated/admin/api-keys.tsx` | ✅ | Admin only |

### API Routes: 17+ endpoints

### Components

| # | Component | File | Category | Reusable? |
|---|-----------|------|----------|-----------|
| 1 | AppShell | `components/vixor/AppShell.tsx` (884 lines) | Layout | No |
| 2 | PageLayout (+ 14 sub-components) | `components/vixor/PageLayout.tsx` (899 lines) | Layout | Yes |
| 3 | atoms (12 exports) | `components/vixor/atoms.tsx` (441 lines) | UI | Yes |
| 4 | TradingViewChart | `components/vixor/TradingViewChart.tsx` (233 lines) | Chart | Yes |
| 5 | AlertsList | `components/vixor/AlertsList.tsx` (239 lines) | Data | Partial |
| 6 | CreateAlertDialog | `components/vixor/CreateAlertDialog.tsx` (239 lines) | Form | Partial |
| 7 | EditAlertDialog | `components/vixor/EditAlertDialog.tsx` (258 lines) | Form | Partial |
| 8 | NoteEditorDialog | `components/vixor/NoteEditorDialog.tsx` (369 lines) | Form | Partial |
| 9 | ExpandableWidget (+ MiniWidget, WidgetGroup) | `components/vixor/ExpandableWidget.tsx` (317 lines) | Layout | Yes |
| 10 | HunterScoreCard | `components/vixor/HunterScoreCard.tsx` (372 lines) | Feature | Partial |
| 11 | CoachOverlay | `components/vixor/CoachOverlay.tsx` (337 lines) | Feature | Partial |
| 12 | GovernorRiskPanel | `components/vixor/GovernorRiskPanel.tsx` (383 lines) | Feature | Partial |
| 13 | AnalystReportPanel | `components/vixor/AnalystReportPanel.tsx` (272 lines) | Feature | Partial |
| 14 | OnboardingModal | `components/vixor/OnboardingModal.tsx` (108 lines) | Feature | No |
| 15 | PaginationBar | `components/vixor/PaginationBar.tsx` (175 lines) | UI | Yes |
| 16-53 | shadcn/ui (38 files) | `components/ui/*` | UI | Yes |

### Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useRenderGuard` | `shared/hooks/use-render-guard.ts` | Detects infinite render loops |
| `useStableServerFn` | `shared/hooks/use-stable-server-fn.ts` | Stabilizes server function refs |
| `useIsMobile` | `shared/hooks/use-mobile.ts` | Viewport < 1024px check |

---

## Design System Status

### CSS Variables — 55+ custom properties

**Dark Mode (Default):** 18 semantic color vars + 7 trading vars + 5 gradients/shadows
**Light Mode:** 18 overrides (⚠️ missing overrides for `--bullish`, `--bearish`, `--neutral-wait`, `--info`, `--tp1/2/3`, `--gradient-*`, `--shadow-*`)

### Fonts

| Token | Value | Loaded? |
|-------|-------|---------|
| `--font-sans` | "Inter", ui-sans-serif, system-ui | 🔴 **NO `<link>` tag** |
| `--font-mono` | "JetBrains Mono", ui-monospace | 🔴 **NO `<link>` tag** |

> **CRITICAL:** Fonts declared but never loaded. App uses system fallbacks.

### Dual Token Systems

| System | Location | Components Using |
|--------|----------|-----------------|
| CSS Variables | `styles.css` → `--color-*` | atoms.tsx, ExpandableWidget, AlertsList |
| THEME Constant | `PageLayout.tsx` inline | PageLayout, StatsRow, DataRow, ProfileCard |
| Inline Hex | `AppShell.tsx` `style={{}}` | AppShell (TopNav, BottomBar, MorePanel) |
| Tailwind Override | `text-emerald-400`, `text-red-400` | HunterScoreCard, CoachOverlay, GovernorRiskPanel |

### Hardcoded Colors — 339 occurrences in 29 files

| File | Count | Severity |
|------|-------|----------|
| `analysis.$id.tsx` | 76 | 🔴 Critical |
| `AppShell.tsx` | 37 | 🔴 High |
| `PageLayout.tsx` | 25 | 🟠 High |
| `__root.tsx` (error/404) | 20 | 🟠 High |
| `experiments.tsx` | 19 | 🟠 High |
| `analyze.tsx` | 16 | 🟠 High |
| `daily-loop.tsx` | 13 | 🟠 Medium |

---

## Component Library Audit

### Critical Issues

| Component | Issue |
|-----------|-------|
| **AppShell** | 37 hardcoded colors, no ARIA landmarks, no focus trap on More panel, inline SVG duplication (~20 icons) |
| **PageLayout** | 25 hardcoded colors, THEME constant duplicates CSS vars, name collisions with atoms.tsx (SectionTitle, Badge) |
| **DataRow** | `<div onClick>` not `<button>` — used 100+ times, not keyboard accessible, no ARIA |
| **ToggleSwitch** | `<div>` not `<button>`, no role="switch", no ARIA, 36×20px touch target |
| **HunterScoreCard / CoachOverlay / GovernorRiskPanel** | ~80% duplicated code, use `text-emerald-400` instead of `text-bullish` |

### Missing Components

| Expected | Status |
|----------|--------|
| SignalBadge | Not standalone; inline in HunterScoreCard |
| PriceDisplay | Partially — `PriceCell` in atoms.tsx |
| LiveDot | ❌ Not found |
| StatCard | Partially — `Stat` in atoms.tsx |
| EquityChart | ❌ Not found |
| MiniSparkline | ❌ Not found |

### Name Collisions

| Name | File 1 | File 2 | Conflict |
|------|--------|--------|----------|
| `SectionTitle` | `atoms.tsx` | `PageLayout.tsx` | Different APIs |
| `Badge` | `PageLayout.tsx` | `ui/badge.tsx` | Different APIs |
| `ScrollArea` | `PageLayout.tsx` | `ui/scroll-area.tsx` | Different APIs |

---

## Layout Issues

### Max-Width Constraints
Only 5 instances, all appropriate (copilot chat input, onboarding modal, shadcn dialogs).

### Fixed Dimensions
9 instances, mostly from shadcn. One magic number: `max-h-[1000px]` in ExpandableWidget.

### Spacing
**Well-disciplined** — almost entirely standard Tailwind scale. Only `p-[1px]` in scroll-area as arbitrary value.

### AppShell Coverage
**All routes** wrapped in AppShell via `__root.tsx`. Zero pages without it.

---

## UX Flaws

### Empty States
- ✅ 25 of 27 pages have `<EmptyState>` component
- ❌ Only 3 have action buttons (PnL, Bags, Portfolio)
- ❌ Trackers page uses inline text instead of EmptyState

### Loading States
- ✅ All pages use `PageLayout loading` prop (full-page spinner)
- ⚠️ No skeleton→content transition — layout jump when data arrives
- ⚠️ Dashboard shows "..." placeholder text instead of skeletons
- ⚠️ Profile page uses inline "Loading…" text

### Error Handling
- ✅ Error boundary in `__root.tsx` with recovery
- ❌ **15+ silent `catch {}` blocks** — copilot (7), settings (2), onboarding (3), AppShell (2), referral (1)
- ❌ Users have no way to know copilot messages, settings, conversations failed

### Forms
- ✅ Auth form: proper validation, labels, disabled state, error display
- ⚠️ Journal: no `<label>` elements, no inline validation
- ⚠️ Settings: 3 buttons with NO onClick ("Change Password", "Export Data", "Delete Account")
- ❌ Copilot input: no `<label>`, no `aria-label`
- ❌ Daily Loop: no form-level validation

### Accessibility
- ❌ **DataRow** (used 100+ times) — not keyboard accessible
- ❌ **ToggleSwitch** — no ARIA, not keyboard accessible
- ❌ **PageLayout tabs** — no `role="tablist"`, no `role="tab"`
- ❌ **No skip-to-content link**
- ✅ Images all have `alt` attributes
- ✅ shadcn components have proper ARIA (28 components)

### Mobile UX
- 🔴 **Systemic sub-12px text** — 8px found in daily-loop, 9px in 50+ instances, 10px in 40+ instances
- 🔴 **Touch targets below 44px**: ToggleSwitch (36×20), tabs (~28×28), image zoom (32×32), select options (~24×20)
- ✅ No unintended horizontal scroll
- ✅ Proper viewport meta with `viewport-fit=cover`

### Placeholder / Stub Pages

| Page | Status |
|------|--------|
| `/charts` | Pure stub — "COMING SOON" |
| `/token/:symbol` chart | "Chart requires OHLCV data feed" + "COMING SOON" |
| OKX adapter (9 methods) | Entire file is unimplemented stubs |
| Bybit adapter (9 methods) | Entire file is unimplemented stubs |
| Settings 3 buttons | Render but do nothing on click |

---

## Gap Analysis (vs Expected VIXOR Design System)

| Element | Expected | Current State | Gap |
|---------|----------|---------------|-----|
| CSS tokens | ~18 variables | 55+ variables (good) | ✅ Exceeded |
| Font loading | Inter + JetBrains Mono loaded | Declared but NOT loaded | 🔴 Full gap |
| Single color system | One source of truth | 4 competing systems | 🔴 Full gap |
| SignalBadge | Standalone component with 5 variants | Inline in HunterScoreCard only | 🟠 Missing |
| PriceDisplay | Mono font, colored change | PriceCell in atoms (partial) | 🟠 Partial |
| LiveDot | Pulse animation | Not found | 🔴 Missing |
| StatCard | Label + value + trend | Stat in atoms (no trend) | 🟠 Partial |
| EmptyState | Icon + title + action | Icon + title only (19/22 no CTA) | 🟠 Partial |
| TradingView on Charts | Full-width embed | Charts page is stub | 🔴 Missing |
| AppShell dark mode | Theme-aware | All hardcoded hex | 🔴 No theme support |
| Keyboard accessibility | Full keyboard nav | DataRow/tabs not focusable | 🔴 Missing |
| Mobile touch targets | 44px minimum | 36×20 to 28×28 | 🔴 Systemic issue |

---

## Critical Issues (P0)

| # | Location | Issue | Impact | Fix |
|---|----------|-------|--------|-----|
| 1 | `__root.tsx` | **Fonts never loaded** — no `<link>` for Inter/JetBrains Mono | Entire app uses system fonts | Add `<link>` tags to head |
| 2 | `AppShell.tsx` + `PageLayout.tsx` | **4 competing color systems** — CSS vars, THEME constant, inline hex, Tailwind overrides | Theme switching broken, rebranding impossible | Unify to CSS vars only |
| 3 | `PageLayout.tsx:602` | **DataRow is `<div>` not `<button>`** — 100+ instances | Entire app inaccessible to keyboard users | Change to `<button>` or add role/tabIndex |
| 4 | `styles.css` `.light {}` | **Light mode missing 10+ token overrides** | Trading colors leak dark values in light mode | Add all missing light-mode vars |
| 5 | `analysis.$id.tsx` | **76 hardcoded colors** | Analysis page breaks in any theme | Convert to design tokens |

## High Priority (P1)

| # | Location | Issue |
|---|----------|-------|
| 6 | `settings.tsx:342-357` | 3 buttons ("Change Password", "Export Data", "Delete Account") have no onClick |
| 7 | `copilot.tsx` (7 instances) | Silent catch blocks — copilot messages/conversations fail silently |
| 8 | 15+ pages | Text sizes 8-10px — below WCAG 12px minimum |
| 9 | `settings.tsx:62` | ToggleSwitch 36×20px — below 44px touch target, no ARIA |
| 10 | 19 pages | EmptyState has no CTA button — users stuck with no action |
| 11 | `atoms.tsx` + `PageLayout.tsx` | Name collisions: SectionTitle, Badge, ScrollArea |
| 12 | `HunterScoreCard/CoachOverlay/GovernorRiskPanel` | 80% duplicated code, wrong color tokens |
| 13 | `CreateAlertDialog` + `EditAlertDialog` | 80% identical code — should share form |
| 14 | `OnboardingModal` | No focus trap, no `role="dialog"`, no Escape key |
| 15 | `experience/styles/*` | Parallel token system (`--ws-*`) not integrated with main CSS vars |

## Medium Priority (P2)

| # | Location | Issue |
|---|----------|-------|
| 16 | All pages | Loading spinner replaces content — no skeleton transition |
| 17 | `index.tsx:194` | Dashboard stats show "..." instead of skeletons |
| 18 | `ExpandableWidget.tsx:222` | `max-h-[1000px]` magic number |
| 19 | `analysis.$id.tsx:580` | Image zoom button 32×32px — below touch target |
| 20 | `copilot.tsx`, `journal.tsx`, `daily-loop.tsx` | Forms missing `<label>` and `aria-label` |
| 21 | `Charts` page, `Token` page | Stubs — TradingViewChart exists but not used |
| 22 | OKX/Bybit adapters | 18 TODO stubs — entire files unimplemented |
| 23 | `__root.tsx` error/404 | 20 hardcoded inline colors bypass design system |
| 24 | `rewards.tsx` | Different mono font stack than rest of app |
| 25 | `WalletConnectButton.tsx:180` | `text-[10px]` — below minimum readable size |

---

## Recommendations for Stitch Designer

### الأولوية 1 — Design Tokens (أساس كل حاجة)
1. **أضف `<link>` tags** لـ Google Fonts (Inter + JetBrains Mono) في `__root.tsx`
2. **وحّد على CSS Variables بس** — احذف THEME constant من PageLayout، حوّل كل inline hex في AppShell لـ CSS vars
3. **أكمل light mode overrides** — أضف `--bullish`, `--bearish`, `--neutral-wait`, `--info`, `--gradient-*`, `--shadow-*` لـ `.light {}`
4. **أنشئ `tokens.ts`** ملف مركزي بكل القيم

### الأولوية 2 — Layout Shell
1. **AppShell** — حوّل كل inline styles لـ Tailwind classes + CSS vars
2. **أضف ARIA landmarks** — `role="navigation"` على البارين، `role="main"` على المحتوى
3. **أضف safe area handling** للتليجرام (موجود الآن)
4. **Bottom nav** — Home + 4 أيقونات (تم إصلاحه)

### الأولوية 3 — Component Library
1. **أنشئ المكونات الناقصة:** SignalBadge, LiveDot, StatCard (مع trend), EquityChart
2. **وحّد HunterScoreCard / CoachOverlay / GovernorRiskPanel** في base component واحد
3. **وحّد CreateAlertDialog / EditAlertDialog** في shared form
4. **حل name collisions** — أعد تسمية أو اتصل بالـ barrel export

### الأولوية 4 — Typography & Mobile
1. **ارفع كل نصوص 8-10px لـ 12px كحد أدنى** — استخدم `text-xs` (12px) كبداية
2. **Touch targets** — كل clickable elements minimum 44×44px
3. **DataRow** — حول لـ `<button>` أو أضف `role="button" tabIndex={0} onKeyDown`

### الأولوية 5 — UX Polish
1. **EmptyState** — أضف `action` prop بـ CTA button
2. **Loading** — استخدم skeletons بدل spinner كامل
3. **Settings buttons** — أضف onClick handlers أو أزلهمو
4. **Silent catches** — أضف toast/notification للأخطاء اللي بتأثر على المستخدم

---

*Report generated by z.ai — Full codebase audit, 0 files modified.*