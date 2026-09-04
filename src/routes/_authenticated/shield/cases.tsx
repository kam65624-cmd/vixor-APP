import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  StatsRow,
  PageScrollArea,
  DataRow,
  PageBadge,
} from "@/components/vixor/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getScanHistory } from "@/domains/shield/functions";

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

  const stableHistory = useStableServerFn(getScanHistory);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["scan-history"],
    queryFn: () => stableHistory({ data: { page: 0, limit: 50 } }),
    staleTime: 60_000,
  });

  const casesData = (data?.scans ?? [])
    .filter((s: any) => s.verdict === "DANGER" || s.verdict === "SUSPICIOUS")
    .map((s: any) => ({
      id: s.id,
      title: s.token_name ?? s.contract_address.slice(0, 8),
      tokenName: s.token_symbol ?? "???",
      status: (s.verdict === "DANGER" ? "Open" : "Monitoring") as CaseStatus,
      severity: (s.verdict === "DANGER" ? "critical" : "high") as CaseSeverity,
      createdAt: s.created_at,
      assignee: "Auto",
      description: "",
    }));

  const filteredCases = casesData.filter((c: any) => {
    if (activeTab === "All") return true;
    return c.status === activeTab;
  });

  const totalCount = casesData.length;
  const openCount = casesData.filter((c: any) => c.status === "Open").length;
  const closedCount = casesData.filter((c: any) => c.status === "Closed").length;
  const monitoringCount = casesData.filter((c: any) => c.status === "Monitoring").length;

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
        {isLoading && (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading...
          </div>
        )}
        {isError && (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>Error loading cases.</div>
        )}
        {filteredCases.length > 0 && !isLoading
          ? filteredCases.map((caseItem: any, i: number) => (
              <CaseRow key={caseItem.id} caseItem={caseItem} index={i} />
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
                  style={{
                    fontSize: "32px",
                    opacity: 0.3,
                    marginBottom: "8px",
                  }}
                >
                  &#x1F50D;
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>
                  No cases match this filter
                </span>
                <span style={{ fontSize: "12px", marginTop: "4px" }}>
                  Try selecting a different tab
                </span>
              </div>
            )}

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
          +9.1% ON ACTIVE INVESTIGATIONS
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Case Row Component ─────────────────────────────────────────────────────

interface CaseRowProps {
  caseItem: any;
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
      style={
        {
          animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
        } as any
      }
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
