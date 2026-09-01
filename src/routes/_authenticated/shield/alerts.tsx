import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  StatsRow,
  PageScrollArea,
  DataRow,
  PageBadge,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ALERTS = [
  {
    id: "a1",
    severity: "critical" as const,
    title: "Honeypot Contract Detected",
    token: "SCAMCOIN",
    address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    description:
      "Sell function contains blacklist mechanism. Users cannot sell after buying. 97% sell tax on transfer.",
    timestamp: "2025-01-15T08:23:00Z",
    status: "New" as const,
  },
  {
    id: "a2",
    severity: "critical" as const,
    title: "Rug Pull Risk — Liquidity Withdrawn",
    token: "FAKEPUMP",
    address: "0x388C818CA8B9251b393131C08a736A67ccB19297",
    description:
      "LP tokens were withdrawn from DEX. Liquidity pool now has less than 2% of initial depth. High probability of exit scam.",
    timestamp: "2025-01-15T07:45:00Z",
    status: "Investigating" as const,
  },
  {
    id: "a3",
    severity: "high" as const,
    title: "Mint Function Unlocked",
    token: "INFLATE",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    description:
      "Owner can mint unlimited tokens. No supply cap enforced. Dilution risk is extreme.",
    timestamp: "2025-01-15T06:12:00Z",
    status: "New" as const,
  },
  {
    id: "a4",
    severity: "high" as const,
    title: "Suspicious Holder Concentration",
    token: "WHALEGRAB",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    description:
      "Top 3 wallets hold 78% of supply. One wallet accumulated 45% in the last hour. Pump-and-dump pattern detected.",
    timestamp: "2025-01-15T05:30:00Z",
    status: "Investigating" as const,
  },
  {
    id: "a5",
    severity: "medium" as const,
    title: "Ownership Not Renounced",
    token: "NEWLAUNCH",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    description:
      "Contract owner can pause trading, change fees, or blacklist addresses. Review before large positions.",
    timestamp: "2025-01-15T04:15:00Z",
    status: "Resolved" as const,
  },
  {
    id: "a6",
    severity: "medium" as const,
    title: "High Transaction Tax",
    token: "TAXTOKEN",
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    description:
      "Combined buy+sell tax exceeds 15%. Each trade loses significant value to fees. Not suitable for short-term trades.",
    timestamp: "2025-01-15T03:50:00Z",
    status: "Resolved" as const,
  },
  {
    id: "a7",
    severity: "low" as const,
    title: "Unverified Contract Source",
    token: "OPAQUE",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    description:
      "Source code has not been verified on block explorer. Cannot fully audit logic. Treat with caution.",
    timestamp: "2025-01-15T02:20:00Z",
    status: "Resolved" as const,
  },
  {
    id: "a8",
    severity: "low" as const,
    title: "New Token — Limited History",
    token: "BABYMOON",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    description:
      "Token launched less than 24 hours ago. Insufficient trading data for full analysis. Monitor closely.",
    timestamp: "2025-01-15T01:00:00Z",
    status: "New" as const,
  },
  {
    id: "a9",
    severity: "critical" as const,
    title: "Proxy Contract — Upgradeable Risk",
    token: "SHADOWPROXY",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    description:
      "Contract uses proxy pattern with upgradable implementation. Owner can change contract logic post-deployment.",
    timestamp: "2025-01-14T22:10:00Z",
    status: "Investigating" as const,
  },
  {
    id: "a10",
    severity: "medium" as const,
    title: "LP Locked for Short Duration",
    token: "TEMPCOIN",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    description:
      "Liquidity is locked for only 7 days. After unlock, LP can be withdrawn. Consider the time horizon of your position.",
    timestamp: "2025-01-14T20:45:00Z",
    status: "New" as const,
  },
] as const;

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

  const filteredAlerts = MOCK_ALERTS.filter((a) => {
    if (activeTab === "All") return true;
    return a.severity === activeTab.toLowerCase();
  });

  const totalCount = MOCK_ALERTS.length;
  const criticalCount = MOCK_ALERTS.filter((a) => a.severity === "critical").length;
  const resolvedCount = MOCK_ALERTS.filter((a) => a.status === "Resolved").length;
  const pendingCount = MOCK_ALERTS.filter((a) => a.status !== "Resolved").length;

  const tabCounts: Record<string, number> = {
    All: totalCount,
    Critical: criticalCount,
    High: MOCK_ALERTS.filter((a) => a.severity === "high").length,
    Medium: MOCK_ALERTS.filter((a) => a.severity === "medium").length,
    Low: MOCK_ALERTS.filter((a) => a.severity === "low").length,
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
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, i) => (
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
            />
          ))
        ) : (
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
            <span style={{ fontSize: "13px", fontWeight: 600 }}>No alerts in this category</span>
            <span style={{ fontSize: "12px", marginTop: "4px" }}>Try a different filter tab</span>
          </div>
        )}

        {/* View All in HUNT button */}
        <div style={{ padding: "16px" }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/hunt" })}
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
          VIX +12.4% ON SHIELD ALERTS TODAY
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Alert Row Component ─────────────────────────────────────────────────────

interface AlertRowProps {
  alert: (typeof MOCK_ALERTS)[number];
  index: number;
  copiedId: string | null;
  onCopy: (id: string, address: string) => void;
  onNavigate: () => void;
}

const AlertRow = memo(function AlertRow({
  alert,
  index,
  copiedId,
  onCopy,
  onNavigate,
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
