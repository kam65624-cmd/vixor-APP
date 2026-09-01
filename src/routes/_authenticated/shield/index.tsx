import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useCallback } from "react";
import {
  PageLayout,
  StatsRow,
  PageScrollArea,
  DataRow,
  PageBadge,
  PageSectionTitle,
  ProgressBar,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STATS = {
  tokensScanned: 1847,
  threatsBlocked: 23,
  avgTrustScore: 72.4,
  activeCases: 4,
} as const;

const MOCK_RECENT_ALERTS = [
  {
    id: "r1",
    severity: "critical" as const,
    title: "Honeypot Contract Detected",
    token: "SCAMCOIN",
    timestamp: "2025-01-15T08:23:00Z",
  },
  {
    id: "r2",
    severity: "critical" as const,
    title: "Rug Pull Risk — LP Withdrawn",
    token: "FAKEPUMP",
    timestamp: "2025-01-15T07:45:00Z",
  },
  {
    id: "r3",
    severity: "high" as const,
    title: "Mint Function Unlocked",
    token: "INFLATE",
    timestamp: "2025-01-15T06:12:00Z",
  },
  {
    id: "r4",
    severity: "medium" as const,
    title: "Ownership Not Renounced",
    token: "NEWLAUNCH",
    timestamp: "2025-01-15T04:15:00Z",
  },
  {
    id: "r5",
    severity: "low" as const,
    title: "Unverified Contract Source",
    token: "OPAQUE",
    timestamp: "2025-01-15T02:20:00Z",
  },
] as const;

const MOCK_ACTIVE_CASES = [
  {
    id: "c1",
    title: "SCAMCOIN Honeypot Analysis",
    token: "SCAMCOIN",
    status: "In Progress" as const,
    progress: 65,
    findings: 12,
    severity: "critical" as const,
  },
  {
    id: "c2",
    title: "FAKEPUMP Rug Pull Investigation",
    token: "FAKEPUMP",
    status: "Gathering Evidence" as const,
    progress: 35,
    findings: 7,
    severity: "critical" as const,
  },
  {
    id: "c3",
    title: "INFLATE Mint Function Review",
    token: "INFLATE",
    status: "Under Review" as const,
    progress: 80,
    findings: 5,
    severity: "high" as const,
  },
] as const;

const MOCK_TRUST_DISTRIBUTION = {
  safe: 54,
  caution: 31,
  danger: 15,
} as const;

type Severity = "critical" | "high" | "medium" | "low";

// ── Helpers ────────────────────────────────────────────────────────────────

function severityColor(sev: Severity): string {
  switch (sev) {
    case "critical":
      return "var(--shield-danger)";
    case "high":
      return "var(--shield-suspicious)";
    case "medium":
      return "var(--shield-caution)";
    case "low":
      return "var(--shield-safe)";
    default:
      return "var(--shield-unknown)";
  }
}

function caseStatusColor(status: string): string {
  switch (status) {
    case "In Progress":
      return "var(--shield-caution)";
    case "Gathering Evidence":
      return "var(--shield-suspicious)";
    case "Under Review":
      return "var(--shield-safe)";
    case "Closed":
      return "var(--color-muted-foreground)";
    default:
      return "var(--shield-unknown)";
  }
}

function formatTimeAgo(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/shield/")({
  head: () => ({
    meta: [{ title: "SHIELD — Forensics Dashboard" }],
  }),
  component: ShieldDashboardPage,
});

function ShieldDashboardPage() {
  const navigate = useNavigate();
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const handleActionHover = useCallback((id: string | null) => {
    setHoveredAction(id);
  }, []);

  return (
    <PageLayout
      title="SHIELD"
      badge="FORENSICS"
      badgeColor="var(--char-sly)"
      loadingColor="var(--char-sly)"
    >
      <StatsRow
        stats={[
          {
            label: "Tokens Scanned",
            value: String(MOCK_STATS.tokensScanned),
            color: "var(--char-sly)",
            icon: "🔍",
          },
          {
            label: "Threats Blocked",
            value: String(MOCK_STATS.threatsBlocked),
            color: "var(--shield-danger)",
            icon: "🛡",
          },
          {
            label: "Avg Trust Score",
            value: `${MOCK_STATS.avgTrustScore}`,
            color: "var(--shield-safe)",
            icon: "✓",
          },
          {
            label: "Active Cases",
            value: String(MOCK_STATS.activeCases),
            color: "var(--shield-caution)",
            icon: "📂",
          },
        ]}
      />

      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageScrollArea>
        {/* ── Recent Alerts ── */}
        <PageSectionTitle
          title="Recent Alerts"
          count={MOCK_RECENT_ALERTS.length}
          action={{
            label: "View All",
            onClick: () => navigate({ to: "/shield/alerts" }),
          }}
        />

        {MOCK_RECENT_ALERTS.map((alert, i) => (
          <DataRow
            key={alert.id}
            leftAccent={severityColor(alert.severity)}
            onClick={() => navigate({ to: "/shield/alerts" })}
<<<<<<< HEAD
            style={
              {
                animation: `alert-stagger 0.3s ease-out ${i * 0.04}s both`,
              } as any
            }
=======
            style={{
              animation: `alert-stagger 0.3s ease-out ${i * 0.04}s both`,
            }}
>>>>>>> c396228006949df31235762324e150be52553ecb
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: severityColor(alert.severity),
                  boxShadow: `0 0 6px ${severityColor(alert.severity)}66`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.title}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-muted-foreground)",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {formatTimeAgo(alert.timestamp)}
              </span>
            </div>
            <div style={{ paddingLeft: "16px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--char-sly)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {alert.token}
              </span>
            </div>
          </DataRow>
        ))}

        {/* ── Quick Actions ── */}
        <PageSectionTitle title="Quick Actions" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "var(--color-border)",
          }}
        >
          <QuickActionButton
            id="scan"
            label="Scan Token"
            icon="🔍"
            isActive={hoveredAction === "scan"}
            onHover={handleActionHover}
            onClick={() => navigate({ to: "/shield/scanner" })}
          />
          <QuickActionButton
            id="exposure"
            label="View Exposure"
            icon="📊"
            isActive={hoveredAction === "exposure"}
            onHover={handleActionHover}
            onClick={() => navigate({ to: "/shield/exposure" })}
          />
          <QuickActionButton
            id="trust"
            label="Check Trust Score"
            icon="✓"
            isActive={hoveredAction === "trust"}
            onHover={handleActionHover}
            onClick={() => navigate({ to: "/shield/scanner" })}
          />
        </div>

        {/* ── Active Cases ── */}
        <PageSectionTitle title="Active Cases" count={MOCK_ACTIVE_CASES.length} />

        {MOCK_ACTIVE_CASES.map((c, i) => (
          <CaseCard key={c.id} caseItem={c} index={i} />
        ))}

        {/* ── Trust Score Distribution ── */}
        <PageSectionTitle title="Trust Score Distribution" />
        <div
          style={{
            padding: "16px",
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <TrustDistributionChart distribution={MOCK_TRUST_DISTRIBUTION} />
        </div>

        {/* ── Footer CTA ── */}
        <div style={{ padding: "16px" }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/shield/scanner" })}
            style={{
              width: "100%",
              minHeight: "48px",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              borderRadius: "10px",
              border: "none",
              background: "var(--char-sly)",
              color: "var(--color-background)",
              cursor: "pointer",
              transition: "opacity 0.15s ease, transform 0.1s ease",
              boxShadow: `0 4px 16px var(--char-sly-glow)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            Scan a Token
          </button>
        </div>

        {/* VIX micro-moment */}
        <div
          style={{
            textAlign: "center",
            padding: "8px 16px 24px",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-bullish)",
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}
        >
          VIX +8.7% ON SHIELD SCANS TODAY
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Quick Action Button ────────────────────────────────────────────────────

interface QuickActionProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

const QuickActionButton = memo(function QuickActionButton({
  id,
  label,
  icon,
  isActive,
  onHover,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "16px 8px",
        minHeight: "80px",
        background: isActive ? "var(--color-card-hover)" : "var(--color-card)",
        border: "none",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: "20px",
          filter: isActive ? "drop-shadow(0 0 4px var(--char-sly-glow))" : "none",
          transition: "filter 0.15s ease",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: isActive ? "var(--char-sly)" : "var(--color-foreground)",
          letterSpacing: "0.02em",
          transition: "color 0.15s ease",
        }}
      >
        {label}
      </span>
    </button>
  );
});

// ── Case Card ──────────────────────────────────────────────────────────────

interface CaseCardProps {
  caseItem: (typeof MOCK_ACTIVE_CASES)[number];
  index: number;
}

const CaseCard = memo(function CaseCard({ caseItem, index }: CaseCardProps) {
  const statusCol = caseStatusColor(caseItem.status);
  const sevCol = severityColor(caseItem.severity);

  return (
    <div
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-card)",
        borderLeft: `3px solid ${sevCol}`,
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {caseItem.title}
        </span>
        <PageBadge label={caseItem.status} color={statusCol} small />
      </div>

      {/* Token + findings */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--char-sly)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {caseItem.token}
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
          }}
        >
          {caseItem.findings} findings
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={caseItem.progress}
        color={sevCol}
        height={6}
        label="Progress"
        labelRight={`${caseItem.progress}%`}
      />
    </div>
  );
});

// ── Trust Distribution Chart ───────────────────────────────────────────────

interface TrustDistribution {
  safe: number;
  caution: number;
  danger: number;
}

const TrustDistributionChart = memo(function TrustDistributionChart({
  distribution,
}: {
  distribution: TrustDistribution;
}) {
  const barHeight = 22;
  const maxPct = Math.max(distribution.safe, distribution.caution, distribution.danger);
  const total = distribution.safe + distribution.caution + distribution.danger;

  const bars: Array<{ label: string; value: number; color: string }> = [
    { label: "Safe", value: distribution.safe, color: "var(--shield-safe)" },
    { label: "Caution", value: distribution.caution, color: "var(--shield-caution)" },
    { label: "Danger", value: distribution.danger, color: "var(--shield-danger)" },
  ];

  return (
    <div>
      {/* SVG horizontal bars */}
      <svg
        width="100%"
        height={bars.length * (barHeight + 24) + 8}
        viewBox="0 0 300 138"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Trust score distribution chart"
      >
        {bars.map((bar, i) => {
          const y = i * (barHeight + 24);
          const barWidth = Math.max(4, (bar.value / 100) * 220);
          return (
            <g key={bar.label}>
              {/* Label */}
              <text
                x="0"
                y={y + 12}
                fill="var(--color-muted-foreground)"
                fontSize="11"
                fontWeight="600"
                letterSpacing="0.04em"
              >
                {bar.label.toUpperCase()}
              </text>
              {/* Background track */}
              <rect
                x="70"
                y={y + 16}
                width="220"
                height={barHeight}
                rx="4"
                fill="var(--color-border)"
              />
              {/* Filled bar */}
              <rect
                x="70"
                y={y + 16}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={bar.color}
                opacity="0.85"
              >
                <animate
                  attributeName="width"
                  from="0"
                  to={String(barWidth)}
                  dur="0.6s"
                  fill="freeze"
                />
              </rect>
              {/* Value text */}
              <text
                x={70 + barWidth + 8}
                y={y + 16 + barHeight / 2 + 4}
                fill={bar.color}
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {bar.value}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Summary text below chart */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
          }}
        >
          Based on{" "}
          <span
            style={{
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
            }}
          >
            {total}
          </span>{" "}
          scanned tokens
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--char-sly)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {maxPct}% max
        </span>
      </div>
    </div>
  );
});
