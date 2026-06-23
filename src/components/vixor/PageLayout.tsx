// ── PageLayout V2 — Unified layout for ALL inner pages ────────────────────
// DexScreener-style dark palette (#121212, #1A1A1A, #10B981)
// Consistent structure: Header → Tabs → Stats → Content
// Same visual on desktop and mobile — no jarring responsive shifts
//
// Usage:
//   <PageLayout
//     title="Whale Alerts"
//     badge="WHALE TRACKER"
//     badgeColor={THEME.green}
//     description="Track large transactions..."
//     tabs={["All", "Trades"]}
//     activeTab={tab}
//     onTabChange={setTab}
//     tabCounts={{ All: 10, Trades: 5 }}
//     loading={isLoading}
//     loadingColor={THEME.purple}
//   >
//     <StatsRow stats={[...]} />
//     <SectionTitle title="Active Positions" count={5} />
//     <div className="page-scroll-area">
//       {items.map(...)}
//     </div>
//   </PageLayout>

import type { ReactNode } from "react";
import { memo, useState, useCallback } from "react";

// ── Design Tokens — DexScreener-style dark palette ─────────────────────
export const THEME = {
  // Backgrounds
  bg: "#121212",
  surface: "#1A1A1A",
  surfaceAlt: "#1E1E1E",
  headerBg: "#121212",
  tabBarBg: "#161616",
  rowHover: "rgba(255,255,255,0.03)",
  rowHoverStrong: "rgba(255,255,255,0.06)",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.04)",
  borderAccent: "rgba(52,211,153,0.15)",

  // Text
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  textFaint: "#374151",

  // Semantic colors
  green: "#10B981",
  red: "#EF4444",
  blue: "#34D399",
  blueDeep: "#10B981",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  pink: "#EC4899",
  cyan: "#06B6D4",
  orange: "#F97316",
} as const;

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
  badgeColor = THEME.blue,
  description,
  tabs,
  activeTab,
  onTabChange,
  tabCounts,
  loading = false,
  loadingColor = THEME.blue,
  children,
  banner,
}: PageLayoutProps) {
  return (
    <div
      style={{
        background: THEME.bg,
        color: THEME.text,
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
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.headerBg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1
            style={{
              fontSize: "15px",
              fontWeight: 700,
              margin: 0,
              color: THEME.text,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
          {badge && (
            <span
              style={{
                fontSize: "9px",
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
        {description && (
          <p
            style={{
              fontSize: "11px",
              color: THEME.textSecondary,
              margin: "4px 0 0",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* ── Sub-tabs ── */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            padding: "0 16px",
            borderBottom: `1px solid ${THEME.border}`,
            background: THEME.tabBarBg,
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
                  fontSize: "11px",
                  fontWeight: isActive ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? THEME.text : THEME.textSecondary,
                  background: isActive
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  borderBottom: isActive
                    ? `2px solid ${THEME.blue}`
                    : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t}
                {tabCounts?.[t] != null && (
                  <span
                    style={{
                      marginLeft: "4px",
                      fontSize: "10px",
                      color: isActive ? THEME.textMuted : THEME.textMuted,
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
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
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
                border: `2px solid ${THEME.border}`,
                borderTopColor: loadingColor,
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ── Reusable Sub-components ────────────────────────────────────────────────

/** Compact stats row — sits between tabs and content */
export const StatsRow = memo(function StatsRow({
  stats,
}: {
  stats: StatItem[];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1px",
        background: THEME.border,
        borderBottom: `1px solid ${THEME.border}`,
        flexShrink: 0,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            padding: "10px 12px",
            background: THEME.surface,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: THEME.textMuted,
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
              marginBottom: "3px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {s.icon && <span style={{ fontSize: "10px" }}>{s.icon}</span>}
            {s.label}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: s.color || THEME.text,
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
                fontSize: "9px",
                color: THEME.textSecondary,
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
export function SectionTitle({
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
        borderBottom: `1px solid ${THEME.border}`,
        background: THEME.tabBarBg,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: THEME.text,
          }}
        >
          {title}
        </span>
        {count != null && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: THEME.textMuted,
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
            fontSize: "10px",
            fontWeight: 600,
            color: THEME.blue,
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
  const barColor = color || (pct >= 50 ? THEME.green : THEME.red);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 16px",
        background: THEME.surface,
        borderBottom: `1px solid ${THEME.border}`,
        flexShrink: 0,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: THEME.textSecondary,
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
          background: THEME.border,
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
export function ScrollArea({
  children,
  style,
}: {
  children: ReactNode;
  style?: Record<string, unknown>;
}) {
  return (
    <div
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

/** Empty state placeholder */
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
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
        background: THEME.surface,
        flex: 1,
      }}
    >
      <span style={{ fontSize: "28px", opacity: 0.4 }}>{icon}</span>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: THEME.textSecondary,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: THEME.textMuted,
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
    </div>
  );
}

/** Small colored badge */
export const Badge = memo(function Badge({
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
        fontSize: small ? "8px" : "9px",
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

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        padding: "10px 16px",
        borderBottom: `1px solid ${THEME.borderLight}`,
        background: hovered ? THEME.rowHover : THEME.surface,
        borderLeft: leftAccent ? `2px solid ${leftAccent}` : undefined,
        transition: "background 0.1s ease",
        cursor: onClick ? "pointer" : "default",
        ...customStyle,
      }}
    >
      {children}
    </div>
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
        fontSize: "10px",
        color: THEME.textSecondary,
        fontFamily: mono ? "'JetBrains Mono', ui-monospace, monospace" : undefined,
      }}
    >
      {label}{" "}
      <span
        style={{
          color: valueColor || THEME.text,
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
  leftColor = THEME.green,
  rightColor = THEME.red,
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
        borderBottom: `1px solid ${THEME.borderLight}`,
        background: THEME.surface,
      }}
    >
      <div className="shimmer" style={{ height: "14px", borderRadius: "4px", width: "60%", marginBottom: "6px" }} />
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
        background: THEME.tabBarBg,
        borderBottom: `1px solid ${THEME.border}`,
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
            fontSize: "9px",
            fontWeight: 700,
            color: THEME.textMuted,
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
        background: THEME.surface,
        borderBottom: `1px solid ${THEME.border}`,
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
          background: `${THEME.blue}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: 800,
          color: THEME.blue,
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
            color: THEME.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName || username || "Trader"}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: THEME.textSecondary,
          }}
        >
          {username ? `@${username}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <MiniStat label="XP" value={String(xp ?? 0)} color={THEME.amber} />
        <MiniStat label="Streak" value={`${streak ?? 0}d`} color={THEME.pink} />
        <MiniStat label="Trades" value={String(tradeCount ?? 0)} color={THEME.blue} />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "9px",
          color: THEME.textMuted,
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