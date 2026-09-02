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
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getShieldAlerts, getScanHistory } from "@/domains/shield/functions";

// ── Mock Data ──────────────────────────────────────────────────────────────

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

  const stableAlerts = useStableServerFn(getShieldAlerts);
  const stableHistory = useStableServerFn(getScanHistory);

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["shield-alerts"],
    queryFn: () => stableAlerts({ data: { unreadOnly: false, limit: 5 } }),
    staleTime: 30_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["scan-history"],
    queryFn: () => stableHistory({ data: { page: 0, limit: 20 } }),
    staleTime: 60_000,
  });

  const alerts = alertsData?.alerts ?? [];
  const scans = historyData?.scans ?? [];

  const tokensScanned = historyData?.total ?? 0;
  const threatsBlocked = scans.filter((s: any) => s.verdict === "DANGER").length;
  const activeCases = scans.filter(
    (s: any) => s.verdict === "SUSPICIOUS" || s.verdict === "DANGER",
  ).length;
  const avgTrustScore =
    scans.length > 0
      ? (
          scans.reduce((sum: number, s: any) => sum + (100 - (s.risk_score ?? 0)), 0) / scans.length
        ).toFixed(1)
      : "0.0";

  const activeCasesList = scans
    .filter((s: any) => s.verdict === "SUSPICIOUS" || s.verdict === "DANGER")
    .map((s: any) => ({
      id: s.id,
      title: `${s.token_name ?? s.contract_address.slice(0, 8)} ${s.verdict === "DANGER" ? "Honeypot Analysis" : "Security Review"}`,
      token: s.token_symbol ?? "???",
      status: s.verdict === "DANGER" ? ("In Progress" as const) : ("Under Review" as const),
      progress: s.risk_score ?? 50,
      findings: 1,
      severity: s.verdict === "DANGER" ? ("critical" as const) : ("high" as const),
    }));

  const trustDist = {
    safe: scans.filter((s: any) => s.verdict === "SAFE").length,
    caution: scans.filter((s: any) => s.verdict === "CAUTION").length,
    danger: scans.filter((s: any) => s.verdict === "DANGER" || s.verdict === "SUSPICIOUS").length,
  };

  const loading = alertsLoading || historyLoading;

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
            value: String(tokensScanned),
            color: "var(--char-sly)",
            icon: "🔍",
          },
          {
            label: "Threats Blocked",
            value: String(threatsBlocked),
            color: "var(--shield-danger)",
            icon: "🛡",
          },
          {
            label: "Avg Trust Score",
            value: `${avgTrustScore}`,
            color: "var(--shield-safe)",
            icon: "✓",
          },
          {
            label: "Active Cases",
            value: String(activeCases),
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
        {loading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading...
          </div>
        )}
        {/* ── Recent Alerts ── */}
        <PageSectionTitle
          title="Recent Alerts"
          count={alerts.length}
          action={{
            label: "View All",
            onClick: () => navigate({ to: "/shield/alerts" }),
          }}
        />

        {alerts.map((alert: any, i: number) => (
          <DataRow
            key={alert.id}
            leftAccent={severityColor(alert.severity)}
            onClick={() => navigate({ to: "/shield/alerts" })}
            style={
              {
                animation: `alert-stagger 0.3s ease-out ${i * 0.04}s both`,
              } as any
            }
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
                {alert.title ?? "Alert"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-muted-foreground)",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {formatTimeAgo(alert.created_at)}
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
                {alert.description ?? ""}
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
        <PageSectionTitle title="Active Cases" count={activeCasesList.length} />

        {activeCasesList.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
              fontSize: "12px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            No active threat cases
          </div>
        ) : (
          activeCasesList.map((c: any, i: number) => <CaseCard key={c.id} caseItem={c} index={i} />)
        )}

        {/* ── Trust Score Distribution ── */}
        <PageSectionTitle title="Trust Score Distribution" />
        <div
          style={{
            padding: "16px",
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <TrustDistributionChart distribution={trustDist} />
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
  caseItem: {
    id: string;
    title: string;
    token: string;
    status: string;
    progress: number;
    findings: number;
    severity: Severity;
  };
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
