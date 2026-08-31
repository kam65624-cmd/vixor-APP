# VIXOR Component Library

## New Components (Phase B)

### SignalBadge

**File:** `SignalBadge.tsx`
**Props:**

- `signal: SignalKind` (required) — `STRONG_BUY` | `BUY` | `WAIT` | `SELL` | `STRONG_SELL`
- `size?: "sm" | "md" | "lg"` — default: `md`
- `variant?: "full" | "short" | "icon-only"` — default: `full`
- `showIcon?: boolean` — default: `true`
- `className?: string`

```tsx
<SignalBadge signal="BUY" size="md" />
<SignalBadge signal="STRONG_SELL" variant="icon-only" />
<SignalBadge signal="WAIT" size="sm" variant="short" />
```

### LiveDot

**File:** `LiveDot.tsx`
**Props:**

- `color?: "bull" | "bear" | "neutral" | "info"` — default: `bull`
- `size?: number` — default: `6`
- `pulse?: boolean` — default: `true`
- `label?: string` — ARIA label override
- `className?: string`

```tsx
<LiveDot color="bull" size={8} />
<LiveDot color="bear" pulse={false} />
```

### StatCard

**File:** `StatCard.tsx`
**Props:**

- `label: string` (required)
- `value: string | number` (required)
- `sub?: string` — secondary text
- `trend?: number` — percentage, auto-colored bull/bear
- `color?: string` — CSS var override for value
- `live?: boolean` — shows pulsing LiveDot
- `icon?: ReactNode`
- `className?: string`

```tsx
<StatCard label="Win Rate" value="68%" trend={2.4} live />
<StatCard label="P&L" value="+$1,240" trend={5.1} />
<StatCard label="Drawdown" value="-3.2%" trend={-1.1} />
```

### EmptyState

**File:** `EmptyState.tsx`
**Props:**

- `title: string` (required)
- `description?: string`
- `icon?: ReactNode`
- `action?: { label: string; onClick: () => void; variant?: "default" | "primary" }`
- `className?: string`

```tsx
<EmptyState
  title="No signals yet"
  description="Run analysis to generate signals"
  action={{ label: "Analyze now", onClick: handleAnalyze, variant: "primary" }}
/>
```

### EquityChart

**File:** `EquityChart.tsx` (`"use client"`)
**Props:**

- `data: { day: number | string; equity: number; pnl?: number }[]` (required)
- `height?: number` — default: `240`
- `showAxis?: boolean` — default: `true`
- `className?: string`

```tsx
<EquityChart data={equityData} height={200} showAxis={false} />
```

### MiniSparkline

**File:** `MiniSparkline.tsx` (`"use client"`)
**Props:**

- `data: number[]` (required)
- `color?: string` — CSS var, default: `var(--bullish)`
- `width?: number` — default: `80`
- `height?: number` — default: `24`
- `className?: string`

```tsx
<MiniSparkline data={[1, 2, 1.5, 3, 2.8, 4]} color="var(--bearish)" />
```

### BaseFeaturePanel

**File:** `BaseFeaturePanel.tsx`
**Props:**

- `title: string` (required)
- `subtitle?: string`
- `icon?: ReactNode`
- `status?: "active" | "warning" | "danger" | "neutral"` — controls icon bg + status dot
- `metrics?: { label: string; value: string | number; color?: string }[]`
- `children?: ReactNode`
- `className?: string`

```tsx
<BaseFeaturePanel
  title="Hunter Score"
  subtitle="Rank: Gold"
  status="active"
  icon={<Crosshair className="size-4" />}
  metrics={[
    { label: "Score", value: 78, color: "var(--bullish)" },
    { label: "Wins", value: 42 },
  ]}
>
  {/* Custom body content */}
</BaseFeaturePanel>
```

## Existing Components (Pre-Phase B)

### PageLayout (`PageLayout.tsx`)

Main layout wrapper for all 22 inner pages. Exports multiple sub-components:

| Export             | Note                                     |
| ------------------ | ---------------------------------------- |
| `PageLayout`       | Main wrapper                             |
| `PageSectionTitle` | Renamed from `SectionTitle` (alias kept) |
| `PageScrollArea`   | Renamed from `ScrollArea` (alias kept)   |
| `PageEmptyState`   | Renamed from `EmptyState` (alias kept)   |
| `PageBadge`        | Renamed from `Badge` (alias kept)        |
| `DataRow`          | Universal row                            |
| `DataRowTwoLine`   | Two-line row                             |
| `StatsRow`         | Stats bar                                |
| `ProgressBar`      | Horizontal progress                      |
| `LabelValue`       | Inline label+value                       |
| `MiniBar`          | Split bar                                |
| `TableHeader`      | Column headers                           |
| `ProfileCard`      | User profile                             |
| `SkeletonRow`      | Loading shimmer                          |
| `THEME`            | Legacy color constants (deprecated)      |

### atoms.tsx

Shared atomic components: `SectionTitle`, `RecBadge`, `ConfidenceBar`, `Stat`, `SetupStrengthBadge`, `SetupStrengthBar`, `BiasIndicator`, `CollapsibleSection`, `EducationLayer`, `PriceCell`.

### Feature Panels

- `HunterScoreCard.tsx` — Smart money scoring (372 lines, complex mutations)
- `CoachOverlay.tsx` — Trade coaching (337 lines, complex mutations)
- `GovernorRiskPanel.tsx` — Risk assessment (383 lines, complex mutations)
- `AnalystReportPanel.tsx` — AI analysis (272 lines)

## Color System (CSS Variables)

All new components use CSS variables with fallbacks:

| Variable                                                  | Purpose               |
| --------------------------------------------------------- | --------------------- |
| `--bullish` / `--bullish-bg`                              | Buy/positive signals  |
| `--bearish` / `--bearish-bg`                              | Sell/negative signals |
| `--neutral-wait` / `--neutral-wait-bg`                    | Hold/wait signals     |
| `--info` / `--info-bg`                                    | Informational         |
| `--surface` / `--surface-2`                               | Backgrounds           |
| `--text-primary` / `--text-secondary` / `--text-tertiary` | Text hierarchy        |
| `--border` / `--border-hover`                             | Borders               |

## Design Rules

1. All numbers use `font-mono` (JetBrains Mono)
2. All text uses `font-sans` (Inter)
3. No hardcoded colors — CSS variables only
4. All interactive elements: touch target >= 44px
5. All interactive elements: ARIA label + keyboard accessible
6. All components: TypeScript typed + `forwardRef` where applicable
