import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  StatsRow,
  PageScrollArea,
  DataRow,
  PageBadge,
} from "@/components/vixor/PageLayout";

// ── Mock Data ──────────────────────────────────────────────────────────────

type CaseSeverity = "critical" | "high" | "medium" | "low";
type CaseStatus = "Open" | "Closed" | "Monitoring";

type InvestigationCase = {
  id: string;
  title: string;
  status: CaseStatus;
  tokenName: string;
  severity: CaseSeverity;
  createdAt: string;
  assignee: string;
  description: string;
};

const MOCK_CASES = [
  {
    id: "SH-0042",
    title: "Honeypot Contract — SCAMCOIN on Ethereum",
    status: "Open" as CaseStatus,
    tokenName: "SCAMCOIN",
    severity: "critical" as CaseSeverity,
    createdAt: "2025-01-15T08:00:00Z",
    assignee: "Agent-7",
    description:
      "Sell function contains blacklist mechanism preventing users from selling tokens after purchase.",
  },
  {
    id: "SH-0041",
    title: "Rug Pull Investigation — FAKEPUMP Liquidity Drain",
    status: "Monitoring" as CaseStatus,
    tokenName: "FAKEPUMP",
    severity: "critical" as CaseSeverity,
    createdAt: "2025-01-15T07:30:00Z",
    assignee: "Agent-3",
    description:
      "LP tokens withdrawn from DEX. Liquidity pool depth dropped below 2% of initial value.",
  },
  {
    id: "SH-0040",
    title: "Unlimited Mint Function — INFLATE Token",
    status: "Open" as CaseStatus,
    tokenName: "INFLATE",
    severity: "high" as CaseSeverity,
    createdAt: "2025-01-14T18:00:00Z",
    assignee: "Agent-12",
    description:
      "Owner can mint unlimited tokens without supply cap. Extreme dilution risk identified.",
  },
  {
    id: "SH-0039",
    title: "Suspicious Holder Concentration — WHALEGRAB",
    status: "Closed" as CaseStatus,
    tokenName: "WHALEGRAB",
    severity: "high" as CaseSeverity,
    createdAt: "2025-01-14T12:00:00Z",
    assignee: "Agent-5",
    description:
      "Top 3 wallets accumulated 78% of supply. Pump-and-dump pattern confirmed and resolved.",
  },
  {
    id: "SH-0038",
    title: "Ownership Not Renounced — NEWLAUNCH",
    status: "Closed" as CaseStatus,
    tokenName: "NEWLAUNCH",
    severity: "medium" as CaseSeverity,
    createdAt: "2025-01-13T20:00:00Z",
    assignee: "Agent-9",
    description: "Contract owner retained admin privileges. Team confirmed renouncement timeline.",
  },
  {
    id: "SH-0037",
    title: "High Transaction Tax — TAXTOKEN",
    status: "Closed" as CaseStatus,
    tokenName: "TAXTOKEN",
    severity: "medium" as CaseSeverity,
    createdAt: "2025-01-13T14:00:00Z",
    assignee: "Agent-2",
    description: "Combined buy+sell tax exceeded 15%. Confirmed as intended fee structure by team.",
  },
  {
    id: "SH-0036",
    title: "Unverified Contract Source — OPAQUE",
    status: "Monitoring" as CaseStatus,
    tokenName: "OPAQUE",
    severity: "low" as CaseSeverity,
    createdAt: "2025-01-12T10:00:00Z",
    assignee: "Agent-11",
    description: "Source code not verified on block explorer. Awaiting developer response.",
  },
  {
    id: "SH-0035",
    title: "New Token Limited History — BABYMOON",
    status: "Closed" as CaseStatus,
    tokenName: "BABYMOON",
    severity: "low" as CaseSeverity,
    createdAt: "2025-01-11T22:00:00Z",
    assignee: "Agent-4",
    description:
      "Token launched less than 24h ago. Sufficient trading data gathered after 48h monitoring.",
  },
] as const;

const TABS = ["All", "Open", "Closed", "Monitoring"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function severityColor(s: CaseSeverity): string {
  switch (s) {
    case "critical":
      return "var(--shield-danger)";
    case "high":
      return "var(--shield-suspicious)";
    case "medium":
      return "var(--shield-caution)";
    case "low":
      return "var(--shield-safe)";
  }
}

function statusColor(s: CaseStatus): string {
  switch (s) {
    case "Open":
      return "var(--char-sly)";
    case "Monitoring":
      return "var(--shield-caution)";
    case "Closed":
      return "var(--shield-safe)";
  }
}

function formatCaseDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/shield/cases")({
  head: () => ({
    meta: [{ title: "Investigation Cases — SHIELD" }],
  }),
  component: InvestigationCasesPage,
});

function InvestigationCasesPage() {
  const [activeTab, setActiveTab] = useState<string>("All");

  const filteredCases = MOCK_CASES.filter((c) => {
    if (activeTab === "All") return true;
    return c.status === activeTab;
  });

  const totalCount = MOCK_CASES.length;
  const openCount = MOCK_CASES.filter((c) => c.status === "Open").length;
  const closedCount = MOCK_CASES.filter((c) => c.status === "Closed").length;
  const monitoringCount = MOCK_CASES.filter((c) => c.status === "Monitoring").length;

  const tabCounts: Record<string, number> = {
    All: totalCount,
    Open: openCount,
    Closed: closedCount,
    Monitoring: monitoringCount,
  };

  return (
    <PageLayout
      title="Investigation Cases"
      badge="CASES"
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
            label: "Total Cases",
            value: String(totalCount),
            color: "var(--char-sly)",
          },
          {
            label: "Open",
            value: String(openCount),
            color: "var(--shield-danger)",
          },
          {
            label: "Closed",
            value: String(closedCount),
            color: "var(--shield-safe)",
          },
          {
            label: "Avg Resolution",
            value: "18.4h",
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
        {filteredCases.length > 0 ? (
          filteredCases.map((caseItem, i) => (
            <CaseRow key={caseItem.id} caseItem={caseItem} index={i} />
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
              style={{
                fontSize: "32px",
                opacity: 0.3,
                marginBottom: "8px",
              }}
            >
              &#x1F50D;
            </span>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>No cases match this filter</span>
            <span style={{ fontSize: "12px", marginTop: "4px" }}>
              Try selecting a different tab
            </span>
          </div>
        )}

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
          VIX +9.1% ON ACTIVE INVESTIGATIONS
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Case Row Component ─────────────────────────────────────────────────────

interface CaseRowProps {
  caseItem: (typeof MOCK_CASES)[number];
  index: number;
}

const CaseRow = memo(function CaseRow({ caseItem, index }: CaseRowProps) {
  const sevColor = severityColor(caseItem.severity);
  const stColor = statusColor(caseItem.status);

  const handleClick = useCallback(() => {
    console.log(`[SHIELD] Navigate to case detail: ${caseItem.id}`);
  }, [caseItem.id]);

  return (
    <DataRow
      leftAccent={sevColor}
      onClick={handleClick}
<<<<<<< HEAD
      style={
        {
          animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
        } as any
      }
=======
      style={{
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
>>>>>>> c396228006949df31235762324e150be52553ecb
    >
      {/* Top line: Case ID + Status Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: "var(--char-sly)",
          }}
        >
          {caseItem.id}
        </span>
        <PageBadge label={caseItem.status} color={stColor} small />
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--color-foreground)",
          marginBottom: "6px",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {caseItem.title}
      </div>

      {/* Bottom line: Token + Severity + Date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--char-sly)",
          }}
        >
          {caseItem.tokenName}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: sevColor,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "2px 8px",
            borderRadius: "4px",
            background: `${sevColor}14`,
          }}
        >
          {caseItem.severity}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted-foreground)",
            marginLeft: "auto",
          }}
        >
          {formatCaseDate(caseItem.createdAt)}
        </span>
      </div>
    </DataRow>
  );
});
