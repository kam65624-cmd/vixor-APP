import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  StatsRow,
  PageScrollArea,
  DataRow,
  PageBadge,
} from "@/components/vixor/PageLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getShieldAlerts, acknowledgeAlert } from "@/domains/shield/functions";

const TABS = ["All", "Critical", "High", "Medium", "Low"] as const;

type Severity = "critical" | "high" | "medium" | "low";
type Status = "New" | "Investigating" | "Resolved";

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

function statusColor(status: Status): string {
  switch (status) {
    case "New":
      return "var(--char-sly)";
    case "Investigating":
      return "var(--shield-caution)";
    case "Resolved":
      return "var(--shield-safe)";
    default:
      return "var(--shield-unknown)";
  }
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts: string): string {
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

export const Route = createFileRoute("/_authenticated/shield/alerts")({
  head: () => ({
    meta: [{ title: "Security Alerts — SHIELD" }],
  }),
  component: ShieldAlertsPage,
});

function ShieldAlertsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((id: string, address: string) => {
    navigator.clipboard.writeText(address).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const queryClient = useQueryClient();
  const stableAlerts = useStableServerFn(getShieldAlerts);
  const stableAck = useStableServerFn(acknowledgeAlert);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shield-alerts", "all"],
    queryFn: () => stableAlerts({ data: { limit: 50 } }),
    staleTime: 30_000,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId: string) => stableAck({ data: { alertId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shield-alerts"] }),
  });

  const alertsData = (data?.alerts ?? []).map((a: any) => ({
    id: a.id,
    severity: a.severity as Severity,
    title: a.title,
    token: a.description ?? "",
    address: "0x0000000000000000000000000000000000000000",
    description: a.description ?? "",
    timestamp: a.created_at,
    status: a.status as Status,
  }));

  const filteredAlerts = alertsData.filter((a: any) => {
    if (activeTab === "All") return true;
    return a.severity === activeTab.toLowerCase();
  });

  const totalCount = alertsData.length;
  const criticalCount = alertsData.filter((a: any) => a.severity === "critical").length;
  const resolvedCount = alertsData.filter((a: any) => a.status === "Resolved").length;
  const pendingCount = alertsData.filter((a: any) => a.status !== "Resolved").length;

  const tabCounts: Record<string, number> = {
    All: totalCount,
    Critical: criticalCount,
    High: alertsData.filter((a: any) => a.severity === "high").length,
    Medium: alertsData.filter((a: any) => a.severity === "medium").length,
    Low: alertsData.filter((a: any) => a.severity === "low").length,
  };

  return (
    <PageLayout
      title="Security Alerts"
      badge="SHIELD"
      badgeColor="var(--char-sly)"
      tabs={[...TABS]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabCounts={tabCounts}
      loadingColor="var(--char-sly)"
    >
      <StatsRow
        stats={[
          {
            label: "Total Alerts",
            value: String(totalCount),
            color: "var(--char-sly)",
          },
          {
            label: "Critical",
            value: String(criticalCount),
            color: "var(--shield-danger)",
          },
          {
            label: "Resolved",
            value: String(resolvedCount),
            color: "var(--shield-safe)",
          },
          {
            label: "Pending",
            value: String(pendingCount),
            color: "var(--shield-caution)",
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
        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>
            Error loading alerts.
          </div>
        )}
        {filteredAlerts.length > 0 && !isLoading
          ? filteredAlerts.map((alert: any, i: number) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                index={i}
                copiedId={copiedId}
                onCopy={handleCopy}
                onNavigate={() =>
                  navigate({
                    to: "/hunt/token/$address",
                    params: { address: alert.address },
                  })
                }
                onAcknowledge={() => ackMutation.mutate(alert.id)}
              />
            ))
          : !isLoading &&
            !isError && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  color: "var(--color-muted-foreground)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ fontSize: "32px", opacity: 0.3, marginBottom: "8px" }}
                >
                  &#x1F6E1;
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>
                  No alerts in this category
                </span>
                <span style={{ fontSize: "12px", marginTop: "4px" }}>
                  Try a different filter tab
                </span>
              </div>
            )}

        {/* View All in HUNT button */}
        <div style={{ padding: "16px" }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/hunt/radar" })}
            style={{
              width: "100%",
              minHeight: "48px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              borderRadius: "10px",
              border: `1px solid var(--char-sly-border)`,
              background: `var(--char-sly)14`,
              color: "var(--char-sly)",
              cursor: "pointer",
              transition: "background 0.15s ease, transform 0.1s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--char-sly)22";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--char-sly)14";
            }}
          >
            View All in HUNT
          </button>
        </div>

        {/* Activity micro-moment */}
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
          +12.4% ON SHIELD ALERTS TODAY
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Alert Row Component ─────────────────────────────────────────────────────

interface AlertRowProps {
  alert: any;
  index: number;
  copiedId: string | null;
  onCopy: (id: string, address: string) => void;
  onNavigate: () => void;
  onAcknowledge: () => void;
}

const AlertRow = memo(function AlertRow({
  alert,
  index,
  copiedId,
  onCopy,
  onNavigate,
  onAcknowledge,
}: AlertRowProps) {
  const sevColor = severityColor(alert.severity);
  const stColor = statusColor(alert.status);
  const isCopied = copiedId === alert.id;

  return (
    <DataRow
      leftAccent={sevColor}
      onClick={onNavigate}
      style={
        {
          animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
        } as any
      }
    >
      {/* Top line: severity dot + title + status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "6px",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: sevColor,
            boxShadow: `0 0 6px ${sevColor}66`,
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
        {alert.status !== "Resolved" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAcknowledge();
            }}
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "var(--char-sly)14",
              border: "1px solid var(--char-sly-border)",
              color: "var(--char-sly)",
              cursor: "pointer",
            }}
          >
            Ack
          </button>
        )}
        <PageBadge label={alert.status} color={stColor} small />
      </div>

      {/* Token name + truncated address */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "6px",
          paddingLeft: "16px",
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
          {alert.token}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(alert.id, alert.address);
          }}
          style={{
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted-foreground)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            padding: "2px 8px",
            cursor: "pointer",
            minHeight: "28px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)";
          }}
          aria-label={`Copy contract address ${alert.address}`}
        >
          {isCopied ? "Copied!" : truncateAddress(alert.address)}
          <span aria-hidden="true" style={{ fontSize: "10px" }}>
            {isCopied ? "✓" : "📋"}
          </span>
        </button>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-muted-foreground)",
          lineHeight: 1.5,
          paddingLeft: "16px",
          marginBottom: "4px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {alert.description}
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-muted-foreground)",
          paddingLeft: "16px",
          fontFamily: "var(--font-mono)",
          opacity: 0.7,
        }}
      >
        {formatTimestamp(alert.timestamp)}
      </div>
    </DataRow>
  );
});
