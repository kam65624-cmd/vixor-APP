// ── PageLayout V2 — Unified layout for ALL inner pages ────────────────────
// DexScreener-style dark palette (#121212, #1A1A1A, #10B981)
// Consistent structure: Header → Tabs → Stats → Content
// Same visual on desktop and mobile — no jarring responsive shifts
//
// Usage:
//   <PageLayout
//     title="Whale Alerts"
//     badge="WHALE TRACKER"
//     badgeColor={"var(--color-bullish)"}
//     description="Track large transactions..."
//     tabs={["All", "Trades"]}
//     activeTab={tab}
//     onTabChange={setTab}
//     tabCounts={{ All: 10, Trades: 5 }}
//     loading={isLoading}
//     loadingColor={"var(--color-info)"}
//   >
//     <StatsRow stats={[...]} />
//     <SectionTitle title="Active Positions" count={5} />
//     <div className="page-scroll-area">
//       {items.map(...)}
//     </div>
//   </PageLayout>

import type { ReactNode, KeyboardEvent } from "react";
import { memo, useState, useCallback, useRef } from "react";

// ── Design Tokens ─────────────────────────────────────────────────────────
// All colors now use CSS custom properties defined in styles.css.
// This enables proper dark/light theme switching.

// ── Types ───────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  icon?: string;
}

interface PageLayoutProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
  tabs?: readonly string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabCounts?: Record<string, number>;
  loading?: boolean;
  loadingColor?: string;
  children: ReactNode;
  /** Optional banner slot above stats (e.g. accuracy bar) */
  banner?: ReactNode;
}

// ── PageLayout ───────────────────────────────────────────────────────────────

export function PageLayout({
  title,
  badge,
  badgeColor = "var(--color-primary)",
  description,
  tabs,
  activeTab,
  onTabChange,
  tabCounts,
  loading = false,
  loadingColor = "var(--color-primary)",
  children,
  banner,
}: PageLayoutProps) {
  return (
    <div
      style={{
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 16px 10px",
          borderBottom: `1px solid ${"var(--color-border)"}`,
          background: "var(--color-background)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1
            style={{
              fontSize: "15px",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-foreground)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "4px",
                background: `${badgeColor}18`,
                color: badgeColor,
                letterSpacing: "0.04em",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {/* description prop intentionally not rendered — developer notes, not user content */}
      </div>

      {/* ── Sub-tabs ── */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            padding: "0 16px",
            borderBottom: `1px solid ${"var(--color-border)"}`,
            background: "var(--color-muted)",
            height: "36px",
            overflowX: "auto",
            flexShrink: 0,
          }}
          className="scrollbar-hide"
        >
          {tabs.map((t) => {
            const isActive = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => onTabChange?.(t)}
                style={{
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  background: isActive ? "rgba(124,155,196,0.08)" : "transparent",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  borderBottom: isActive
                    ? `2px solid ${"var(--color-primary)"}`
                    : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t}
                {tabCounts?.[t] != null && (
                  <span
                    style={{
                      marginLeft: "4px",
                      fontSize: "12px",
                      color: isActive
                        ? "var(--color-muted-foreground)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {tabCounts[t]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      <div
        data-row-list
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
              flex: 1,
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                border: `2px solid ${"var(--color-border)"}`,
                borderTopColor: loadingColor,
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : (
          <>
            {banner}
            {children}
          </>
        )}
      </div>
    </div>
  );
}

// ── Reusable Sub-components ────────────────────────────────────────────────

/** Compact stats row — sits between tabs and content */
export const StatsRow = memo(function StatsRow({ stats }: { stats: StatItem[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1px",
        background: "var(--color-border)",
        borderBottom: `1px solid ${"var(--color-border)"}`,
        flexShrink: 0,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: "var(--color-card)",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
              marginBottom: "3px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {s.icon && <span style={{ fontSize: "12px" }}>{s.icon}</span>}
            {s.label}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: s.color || "var(--color-foreground)",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {s.value}
          </div>
          {s.sub && (
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-muted-foreground)",
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {s.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

/** Section title with optional count — sits above a scrollable list */
export function PageSectionTitle({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px 6px",
        borderBottom: `1px solid ${"var(--color-border)"}`,
        background: "var(--color-muted)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-foreground)",
          }}
        >
          {title}
        </span>
        {count != null && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-muted-foreground)",
            }}
          >
            ({count})
          </span>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-primary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Progress bar — for accuracy, completion, etc. */
export function ProgressBar({
  value,
  max = 100,
  color,
  height = 4,
  label,
  labelRight,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  labelRight?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = color || (pct >= 50 ? "var(--color-bullish)" : "var(--color-bearish)");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 16px",
        background: "var(--color-card)",
        borderBottom: `1px solid ${"var(--color-border)"}`,
        flexShrink: 0,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          flex: 1,
          height: `${height}px`,
          background: "var(--color-border)",
          borderRadius: `${height / 2}px`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            borderRadius: `${height / 2}px`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      {labelRight && (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color: barColor,
            whiteSpace: "nowrap",
          }}
        >
          {labelRight}
        </span>
      )}
    </div>
  );
}

/** Scrollable content area — consistent across all pages */
export function PageScrollArea({
  children,
  style,
}: {
  children: ReactNode;
  style?: Record<string, unknown>;
}) {
  return (
    <div
      data-row-list
      className="scrollbar-hide"
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        minHeight: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Empty state placeholder (legacy — use @/components/vixor/EmptyState for new code) */
export function PageEmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: string;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "48px 20px",
        background: "var(--color-card)",
        flex: 1,
      }}
    >
      <span style={{ fontSize: "28px", opacity: 0.4 }}>{icon}</span>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--color-muted-foreground)",
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "4px",
            fontSize: "12px",
            fontWeight: 600,
            padding: "8px 20px",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            background: "var(--color-primary)",
            color: "var(--color-background)",
            minHeight: "44px",
            transition: "opacity 0.15s ease",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Small colored badge */
export const PageBadge = memo(function PageBadge({
  label,
  color,
  small = false,
}: {
  label: string;
  color: string;
  small?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 700,
        padding: small ? "1px 6px" : "2px 8px",
        borderRadius: "3px",
        background: `${color}18`,
        color,
        letterSpacing: "0.03em",
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
});

/** Data row — the universal row component for all pages */
export const DataRow = memo(function DataRow({
  children,
  onClick,
  leftAccent,
  style: customStyle,
}: {
  children: ReactNode;
  onClick?: () => void;
  leftAccent?: string;
  style?: Record<string, unknown>;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
        return;
      }

      // ArrowUp/ArrowDown — move focus between sibling DataRow buttons
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const container = ref.current?.closest("[data-row-list]");
        if (!container) return;

        const rows = Array.from(container.querySelectorAll<HTMLButtonElement>("button[data-row]"));
        const idx = rows.indexOf(ref.current!);
        if (idx === -1) return;

        const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
        if (rows[next]) {
          rows[next].focus();
        }
      }
    },
    [onClick],
  );

  return (
    <button
      ref={ref}
      type="button"
      data-row
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid rgba(124,155,196,0.04)",
        background: hovered ? "rgba(124,155,196,0.03)" : "var(--color-card)",
        borderLeft: leftAccent ? `2px solid ${leftAccent}` : undefined,
        transition: "background 0.1s ease",
        ...customStyle,
      }}
    >
      {children}
    </button>
  );
});

/** Row with top + bottom sub-rows — the most common pattern */
export const DataRowTwoLine = memo(function DataRowTwoLine({
  topContent,
  bottomContent,
  onClick,
  leftAccent,
}: {
  topContent: ReactNode;
  bottomContent: ReactNode;
  onClick?: () => void;
  leftAccent?: string;
}) {
  return (
    <DataRow onClick={onClick} leftAccent={leftAccent}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        {topContent}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "4px 12px",
        }}
      >
        {bottomContent}
      </div>
    </DataRow>
  );
});

/** Inline label + value pair (for bottom rows) */
export function LabelValue({
  label,
  value,
  valueColor,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  valueColor?: string;
  mono?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: "12px",
        color: "var(--color-muted-foreground)",
        fontFamily: mono ? "'JetBrains Mono', ui-monospace, monospace" : undefined,
      }}
    >
      {label}{" "}
      <span
        style={{
          color: valueColor || "var(--color-foreground)",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </span>
  );
}

/** Mini progress bar inside a row (e.g. buy/sell ratio) */
export function MiniBar({
  leftPct,
  leftColor = "var(--color-bullish)",
  rightColor = "var(--color-bearish)",
  height = 3,
}: {
  leftPct: number;
  leftColor?: string;
  rightColor?: string;
  height?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1px",
        height: `${height}px`,
        borderRadius: `${height / 2}px`,
        overflow: "hidden",
        margin: "6px 0",
      }}
    >
      <div
        style={{
          width: `${leftPct}%`,
          background: leftColor,
          transition: "width 0.3s ease",
        }}
      />
      <div
        style={{
          width: `${100 - leftPct}%`,
          background: rightColor,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

/** Shimmer skeleton for loading states */
export function SkeletonRow() {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid rgba(124,155,196,0.04)",
        background: "var(--color-card)",
      }}
    >
      <div
        className="shimmer"
        style={{ height: "14px", borderRadius: "4px", width: "60%", marginBottom: "6px" }}
      />
      <div className="shimmer" style={{ height: "10px", borderRadius: "3px", width: "85%" }} />
    </div>
  );
}

/** Table header row (for tabular pages) */
export function TableHeader({
  columns,
}: {
  columns: Array<{ label: string; width?: string; align?: "left" | "right" }>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        height: "32px",
        background: "var(--color-muted)",
        borderBottom: `1px solid ${"var(--color-border)"}`,
        flexShrink: 0,
        overflowX: "auto",
      }}
      className="scrollbar-hide"
    >
      {columns.map((col) => (
        <div
          key={col.label}
          style={{
            width: col.width,
            minWidth: col.width,
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            textAlign: col.align || "left",
            flexShrink: 0,
          }}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}

/** Profile card — used by wallet page */
export function ProfileCard({
  displayName,
  username,
  xp,
  streak,
  tradeCount,
}: {
  displayName?: string;
  username?: string;
  xp?: number;
  streak?: number;
  tradeCount?: number;
}) {
  const initial = (displayName || username || "T").charAt(0).toUpperCase();

  return (
    <div
      style={{
        background: "var(--color-card)",
        borderBottom: `1px solid ${"var(--color-border)"}`,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          background: "rgba(124,155,196,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: 800,
          color: "var(--color-primary)",
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName || username || "Trader"}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
          }}
        >
          {username ? `@${username}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <MiniStat label="XP" value={String(xp ?? 0)} color={"var(--color-neutral-wait)"} />
        <MiniStat label="Streak" value={`${streak ?? 0}d`} color={"var(--color-bearish)"} />
        <MiniStat label="Trades" value={String(tradeCount ?? 0)} color={"var(--color-primary)"} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Backward-compatible aliases (deprecated — use Page* prefix or standalone components) ──
/** @deprecated Use PageSectionTitle */
export const SectionTitle = PageSectionTitle;
/** @deprecated Use PageScrollArea or @/components/ui/scroll-area */
export const ScrollArea = PageScrollArea;
/** @deprecated Use PageEmptyState or @/components/vixor/EmptyState */
export const EmptyState = PageEmptyState;
/** @deprecated Use PageBadge or @/components/ui/badge */
export const Badge = PageBadge;
