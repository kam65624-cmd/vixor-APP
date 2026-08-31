# VIXOR Design Tokens

> Source: `src/styles.css` — VIXOR Design System V6 "Command Center" (2026/2027)
> Updated: 2026-08-06 (Phase 9 — unified token mapping)

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| V5 | 2026-08-02 | Initial documentation (Premium Trading) |
| V6 | 2026-08-06 | Command Center upgrade — bridge tokens, TypeScript constants, unified naming |

---

## Color System

### Surfaces (4-layer depth hierarchy)

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--background` | `#08090c` | `#ffffff` | Page background |
| `--card` | `#101114` | `#ffffff` | Card backgrounds |
| `--card-hover` | `#16171c` | `#f5f5f7` | Card hover state |
| `--surface` | `var(--background)` | `var(--background)` | Bridge: same as background |
| `--surface-2` | `#16171c` | `—` | Secondary surface |
| `--surface-3` | `#1e1f26` | `—` | Tertiary surface |
| `--surface-elevated` | `#16171c` | `#f5f5f7` | Elevated modals/popovers |
| `--surface-hero` | `#0c0d12` | `—` | 4th layer for dynamic backgrounds |
| `--popover` | `#16171c` | `#ffffff` | Dropdown/popover bg |

### Text (3-tier hierarchy)

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--foreground` | `#ffffff` | `#111827` | Primary text |
| `--text-primary` | `#ffffff` | `#111827` | Same as foreground |
| `--text-secondary` | `#9498a8` | `#6b7280` | Secondary/muted text |
| `--text-tertiary` | `#565a66` | `#9ca3af` | Disabled/hint text |
| `--text-muted` | `#565a66` | `#9ca3af` | Same as tertiary |

### Primary Accent

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#6366f1` | Indigo — main brand color |
| `--primary-foreground` | `#ffffff` | Text on primary bg |
| `--primary-glow` | `#818cf8` | Lighter primary for glows |
| `--primary-bg` | `#6366f114` | 8% opacity primary background |
| `--primary-border` | `color-mix(primary 20%, transparent)` | 20% primary border |

### Secondary Accent (V6)

| Token | Value | Usage |
|-------|-------|-------|
| `--secondary-accent` | `#8b5cf6` | Purple for differentiation |
| `--secondary-accent-glow` | `#a78bfa` | Lighter secondary glow |

### Semantic Trading Colors

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bullish` | `#22d3a6` | `#059669` | Profit/buy/positive |
| `--bearish` | `#fb4667` | `#dc2626` | Loss/sell/negative |
| `--destructive` | `#fb4667` | `#dc2626` | Error/destructive |
| `--neutral-wait` | `#f5a623` | `#d97706` | Pending/waiting |
| `--gold` | `#f0c419` | `#f0c419` | Premium/paid features |
| `--info` | `#6366f1` | `#6366f1` | Informational |

### Trading Color Backgrounds (8% opacity)

| Token | Dark | Light |
|-------|------|-------|
| `--bullish-bg` | `#22d3a614` | `#05966914` |
| `--bearish-bg` | `#fb466714` | `#dc262614` |
| `--gold-bg` | `#f0c41914` | `#f0c41914` |
| `--neutral-wait-bg` | `#f5a62314` | `#d9770614` |

### Trading Color Borders (20% opacity)

| Token | Formula |
|-------|--------|
| `--bullish-border` | `color-mix(bullish 20%, transparent)` |
| `--bearish-border` | `color-mix(bearish 20%, transparent)` |
| `--gold-border` | `color-mix(gold 20%, transparent)` |
| `--neutral-wait-border` | `color-mix(neutral-wait 20%, transparent)` |

### TP Levels (bullish spectrum)

| Token | Dark | Light |
|-------|------|-------|
| `--tp1` | `#22d3a6` | `#059669` |
| `--tp2` | `#26d07c` | `#10b981` |
| `--tp3` | `#6ee7b7` | `#34d399` |

### Chart Palette (multi-asset, NOT semantic)

| Token | Value |
|-------|-------|
| `--color-chart-1` | `#6366f1` |
| `--color-chart-2` | `#8c9eff` |
| `--color-chart-3` | `#7b61ff` |

### Borders & Inputs

| Token | Dark | Light |
|-------|------|-------|
| `--border` | `rgba(255,255,255, 0.08)` | `#e5e7eb` |
| `--border-subtle` | `rgba(255,255,255, 0.04)` | `#f3f4f6` |
| `--border-hover` | `rgba(255,255,255, 0.15)` | `#d1d5db` |
| `--input` | `rgba(255,255,255, 0.08)` | `#e5e7eb` |
| `--ring` | `#6366f140` | `#6366f140` |

### Overlays

| Token | Dark | Light |
|-------|------|-------|
| `--overlay` | `rgba(8,9,12, 0.75)` | `rgba(0,0,0, 0.3)` |
| `--overlay-secondary` | `rgba(10,10,13, 0.6)` | `rgba(0,0,0, 0.25)` |

### Gradients

| Token | Value |
|-------|-------|
| `--gradient-primary` | `135deg, #6366f1 → #818cf8` |
| `--gradient-hero` | `135deg, #6366f1 → #8b5cf6` |
| `--gradient-hero-glow` | `135deg, primary@40% → secondary@20%` |
| `--gradient-bullish` | `135deg, bullish@18% → bullish@2%` |
| `--gradient-bearish` | `135deg, bearish@18% → bearish@2%` |
| `--gradient-glass` | `135deg, white@4% → white@1%` |
| `--gradient-accent-bg` | `radial, primary@6% → transparent@60%` |

---

## Bridge Tokens (Tailwind Integration)

All `--color-*` tokens are registered in the `@theme inline` block so Tailwind can resolve them. These bridge tokens map CSS custom properties to Tailwind's `text-*`, `bg-*`, `border-*` utilities.

### Core Bridge Tokens

| Bridge Token | Maps To |
|-------------|---------|
| `--color-primary` | `var(--primary)` |
| `--color-primary-glow` | `var(--primary-glow)` |
| `--color-bullish` | `var(--bullish)` |
| `--color-bearish` | `var(--bearish)` |
| `--color-neutral-wait` | `var(--neutral-wait)` |
| `--color-gold` | `var(--gold)` |
| `--color-info` | `var(--info)` |
| `--color-tp1/tp2/tp3` | `var(--tp1/tp2/tp3)` |
| `--color-destructive` | `var(--destructive)` |

### Surface Bridge Tokens (V6)

| Bridge Token | Maps To |
|-------------|---------|
| `--color-surface` | `var(--surface)` |
| `--color-surface-2` | `var(--surface-2)` |
| `--color-surface-3` | `var(--surface-3)` |
| `--color-surface-elevated` | `var(--surface-elevated)` |

### Overlay Bridge Tokens (V6)

| Bridge Token | Maps To |
|-------------|---------|
| `--color-overlay` | `var(--overlay)` |
| `--color-overlay-secondary` | `var(--overlay-secondary)` |

### Gradient Bridge Tokens (V6)

| Bridge Token | Maps To |
|-------------|---------|
| `--color-gradient-primary` | `var(--gradient-primary)` |
| `--color-gradient-hero` | `var(--gradient-hero)` |
| `--color-gradient-bullish` | `var(--gradient-bullish)` |
| `--color-gradient-bearish` | `var(--gradient-bearish)` |
| `--color-gradient-glass` | `var(--gradient-glass)` |

---

## Shadows (V6 — 6 levels)

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--shadow-resting` | `0 1px 2px rgba(0,0,0,0.4)` | `0 1px 3px rgba(0,0,0,0.08)` | Default card |
| `--shadow-elevated` | `0 8px 24px rgba(0,0,0,0.5)` | `0 4px 12px rgba(0,0,0,0.06)` | Modals/dropdowns |
| `--shadow-glow` | `0 0 16px -4px #6366f125` | `0 0 16px -4px #6366f120` | Primary glow effect |
| `--shadow-floating` | `0 16px 48px -8px ...` | `—` | Floating panels |
| `--shadow-card-glow` | `0 0 0 1px rgba(99,102,241,0.1), ...` | `—` | Premium card glow |
| `--shadow-gold-glow` | `0 0 0 1px rgba(240,185,11,0.15), ...` | `—` | Gold premium glow |

---

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-instant` | `100ms ease` | Micro-interactions |
| `--transition-fast` | `180ms ease` | Hover/focus |
| `--transition-base` | `240ms ease-in-out` | Standard transitions |
| `--transition-normal` | `240ms ease-in-out` | Alias for base |
| `--transition-slow` | `400ms ease-out` | Page transitions |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material standard |
| `--ease-decelerate` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter animations |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |

---

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `4px` | Focus rings, small elements |
| `--radius-sm` | `8px` | Buttons, inputs |
| `--radius-md` | `12px` | Cards, dialogs |
| `--radius-lg` | `16px` | Large cards, modals |
| `--radius-xl` | `20px` | Hero sections |
| `--radius-2xl` | `24px` | Special containers |
| `--radius-pill` | `9999px` | Pills, badges |
| `--radius-full` | `9999px` | Circular elements |

---

## Spacing (4px base)

| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `12px` |
| `--space-lg` | `16px` |
| `--space-xl` | `24px` |
| `--space-2xl` | `32px` |
| `--space-3xl` | `48px` |

---

## Typography

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, system-ui | Body text, UI |
| `--font-display` | Inter, system-ui | Headings |
| `--font-mono` | JetBrains Mono, SF Mono | Numbers, prices, code |

### Type Scale (V5 — 8 levels)

| Token | Size | Usage |
|-------|------|-------|
| `--text-display` | `32px` | Hero titles |
| `--text-h1` | `24px` | Page titles |
| `--text-h2` | `20px` | Section headings |
| `--text-h3` | `16px` | Sub-headings |
| `--text-body-lg` | `15px` | Emphasized body |
| `--text-body` | `13px` | Default body text |
| `--text-caption` | `12px` | Captions, labels |
| `--text-micro` | `11px` | Micro labels, footnotes |

### Legacy Aliases (deprecated — use V5 scale)

| Legacy | V5 Equivalent |
|--------|---------------|
| `--text-xs` (11px) | `--text-micro` |
| `--text-sm` (12px) | `--text-caption` |
| `--text-base` (14px) | — |
| `--text-md` (16px) | `--text-h3` |
| `--text-lg` (18px) | — |
| `--text-xl` (20px) | `--text-h2` |
| `--text-2xl` (24px) | `--text-h1` |

---

## Background Pattern

| Token | Value |
|-------|-------|
| `--bg-grid` | `1px white/2% grid` (dark) / `none` (light) |
| `--bg-grid-size` | `40px × 40px` |

---

## Glassmorphism 2.0 (V6)

| Token | Value |
|-------|-------|
| `--glass-bg` | `rgba(16, 17, 20, 0.6)` (dark) |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` (dark) |
| `--glass-blur` | `blur(20px) saturate(180%)` |

---

## Utility Classes

Prefix: `vx-` — VIXOR component primitives.

| Class | Description |
|-------|-------------|
| `.vx-card` | Dark card with border + shadow-resting |
| `.vx-card-hover:hover` | Elevated card hover effect |
| `.vx-card-interactive` | Clickable card with active press state |
| `.vx-glass` | Glass-morphism card with blur |
| `.vx-input` | Dark input field with focus ring |
| `.vx-badge` | Semantic badge base |
| `.vx-badge-bullish/bearish/wait/primary/muted` | Colored badge variants |
| `.vx-btn` | Button base with transitions |
| `.vx-btn-primary` | Primary indigo filled button |
| `.vx-btn-sm` | Small button variant |

---

## TypeScript Token Constants

Source: `src/shared/design/tokens.ts` — mirrors CSS custom properties for use in inline `style={{}}`.

```typescript
import { COLORS, SPACING, RADII, MOTION, SHADOWS, GRADIENTS } from '@/shared/design/tokens';

// Usage in inline styles:
style={{ backgroundColor: COLORS.bullish, padding: SPACING.lg, borderRadius: RADII.md }}
```

| Constant | Contains |
|----------|----------|
| `COLORS` | primary, primaryGlow, bullish, bearish, neutralWait, foreground, muted, border, card, cardHover, background, gold, info, tp1–tp3, destructive, surface, surface2, surface3, overlay |
| `SPACING` | xs (4px), sm (8px), md (12px), lg (16px), xl (24px), 2xl (32px), 3xl (48px) |
| `RADII` | xs (4px), sm (8px), md (12px), lg (16px), xl (20px), 2xl (24px), pill (9999px) |
| `MOTION` | instant (100ms ease), fast (180ms ease), base (240ms ease-in-out), slow (400ms ease-out) |
| `SHADOWS` | resting, elevated, glow, floating, cardGlow |
| `GRADIENTS` | primary, hero, bullish, bearish, glass |

---

## Usage Rules

1. **Canvas rendering**: HTML5 Canvas cannot resolve `var(--css-var)` — use hardcoded hex/rgba
2. **Always use `--color-*` prefix** for Tailwind integration (e.g., `text-bullish` resolves to `--color-bullish`)
3. **Trading colors are semantic**: bullish = profit/buy, bearish = loss/sell — never use raw green/red
4. **Gold is premium-only**: Reserve `--gold` for paid features, badges, premium states
5. **4-layer surface depth**: background → card → surface-elevated → surface-hero — maintain visual hierarchy
6. **JetBrains Mono for all financial numbers**: prices, percentages, volumes, PnL values
7. **Prefer TypeScript token constants for inline styles**: Import from `@/shared/design/tokens` instead of hardcoding values
