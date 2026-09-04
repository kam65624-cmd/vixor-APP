import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { PageLayout, PageScrollArea, PageBadge, ProgressBar } from "@/components/vixor/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { scanToken } from "@/domains/shield/functions";

// ── Mock Data ──────────────────────────────────────────────────────────────

type TrustCategory = {
  name: string;
  score: number;
  description: string;
};

type RiskFlag = {
  id: string;
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: string;
};

type RelatedAlert = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  timeAgo: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function verdictColor(v: string): string {
  switch (v) {
    case "SAFE TO TRADE":
      return "var(--shield-safe)";
    case "EXERCISE CAUTION":
      return "var(--shield-caution)";
    case "HIGH RISK":
      return "var(--shield-danger)";
    default:
      return "var(--shield-unknown)";
  }
}

function verdictBg(v: string): string {
  switch (v) {
    case "SAFE TO TRADE":
      return "var(--shield-safe)14";
    case "EXERCISE CAUTION":
      return "var(--shield-caution)14";
    case "HIGH RISK":
      return "var(--shield-danger)14";
    default:
      return "var(--shield-unknown)14";
  }
}

function flagSeverityColor(s: "low" | "medium" | "high" | "critical"): string {
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

function categoryColor(score: number): string {
  if (score >= 75) return "var(--shield-safe)";
  if (score >= 50) return "var(--shield-caution)";
  if (score >= 25) return "var(--shield-suspicious)";
  return "var(--shield-danger)";
}

function overallGaugeColor(score: number): string {
  if (score >= 75) return "var(--shield-safe)";
  if (score >= 50) return "var(--shield-caution)";
  if (score >= 25) return "var(--shield-suspicious)";
  return "var(--shield-danger)";
}

function formatDetectedTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHr = Math.floor(diffMs / 3_600_000);
  if (diffHr < 1) return "Just now";
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/shield/trust/$address")({
  head: () => ({
    meta: [{ title: "Trust Score — SHIELD" }],
  }),
  component: TrustScorePage,
});

function TrustScorePage() {
  const navigate = useNavigate();
  const { address } = useParams({ strict: false }) as { address: string };
  const [selectedChain, setSelectedChain] = useState("solana");
  const [copied, setCopied] = useState(false);

  const stableScan = useStableServerFn(scanToken);
  const {
    data: scanResult,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["trust-scan", address, selectedChain],
    queryFn: () => stableScan({ data: { address, chain: selectedChain } }),
    staleTime: 300_000,
    retry: 1,
  });

  const data = scanResult
    ? {
        tokenName: scanResult.tokenName ?? "Unknown",
        symbol: scanResult.tokenSymbol ?? "???",
        chain: scanResult.chain ?? selectedChain,
        contractAddress: scanResult.tokenAddress ?? address,
        overallScore: scanResult.trustScore.score,
        verdict: (scanResult.trustScore.level === "safe"
          ? "SAFE TO TRADE"
          : scanResult.trustScore.level === "low"
            ? "EXERCISE CAUTION"
            : scanResult.trustScore.level === "medium"
              ? "HIGH RISK"
              : "HIGH RISK") as any,
        categories: scanResult.trustScore.factors.map((f) => ({
          name: f.name,
          score: f.status === "pass" ? 100 : 0,
          description: f.detail,
        })),
        riskFlags: scanResult.security.risks.map((r, i) => ({
          id: `rf${i}`,
          name: r,
          severity: "high" as any,
          description: r,
          detectedAt: new Date().toISOString(),
        })),
        relatedAlerts: [] as RelatedAlert[],
      }
    : null;

  const displayAddress = data?.contractAddress ?? address;
  const vColor = data ? verdictColor(data.verdict) : "var(--shield-unknown)";
  const vBg = data ? verdictBg(data.verdict) : "transparent";
  const gaugeColor = data ? overallGaugeColor(data.overallScore) : "var(--color-muted)";

  // SVG gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((data?.overallScore ?? 0) / 100) * circumference;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [displayAddress]);

  const handleBack = useCallback(() => {
    navigate({ to: "/shield/scanner" });
  }, [navigate]);

  if (isLoading) {
    return (
      <PageLayout
        title="Trust Score"
        badge="ANALYSIS"
        badgeColor="var(--char-sly)"
        loadingColor="var(--char-sly)"
      >
        <PageScrollArea>
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "var(--color-muted-foreground)",
            }}
          >
            <div
              style={{ fontSize: "24px", marginBottom: "16px", animation: "pulse 1.5s infinite" }}
            >
              Scanning...
            </div>
            Loading trust data...
          </div>
        </PageScrollArea>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout
        title="Trust Score"
        badge="ANALYSIS"
        badgeColor="var(--char-sly)"
        loadingColor="var(--char-sly)"
      >
        <PageScrollArea>
          <div style={{ padding: "40px", color: "var(--shield-danger)" }}>
            Error: {error?.message}
          </div>
        </PageScrollArea>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout
        title="Trust Score"
        badge="ANALYSIS"
        badgeColor="var(--char-sly)"
        loadingColor="var(--char-sly)"
      >
        <PageScrollArea>
          <div style={{ padding: "40px", color: "var(--color-muted-foreground)" }}>
            No scan data found.
          </div>
        </PageScrollArea>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Trust Score"
      badge="ANALYSIS"
      badgeColor="var(--char-sly)"
      loadingColor="var(--char-sly)"
    >
      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageScrollArea>
        {/* ── Back Button ── */}
        <div style={{ padding: "12px 16px 0" }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back to scanner"
            style={{
              minHeight: "44px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--char-sly)",
              background: "var(--char-sly)14",
              border: "1px solid var(--char-sly-border)",
              borderRadius: "10px",
              padding: "0 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--char-sly)22";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--char-sly)14";
            }}
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>

        {/* ── Token Header ── */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--color-foreground)",
              }}
            >
              {data.tokenName}
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--char-sly)",
              }}
            >
              ${data.symbol}
            </span>
            <PageBadge label={data.chain} color="var(--char-sly-dim)" small />
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy contract address ${displayAddress}`}
            style={{
              minHeight: "32px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: copied ? "var(--shield-safe)" : "var(--color-muted-foreground)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "4px 10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
            }}
          >
            {copied ? "Copied!" : truncateAddress(displayAddress)}
            <span aria-hidden="true" style={{ fontSize: "10px" }}>
              {copied ? "✓" : "📋"}
            </span>
          </button>
        </div>

        {/* ── Overall Trust Score with SVG Gauge ── */}
        <div
          style={{
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ position: "relative", width: "130px", height: "130px" }}>
            <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
              {/* Background circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 65 65)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: gaugeColor,
                  lineHeight: 1,
                }}
              >
                {data.overallScore}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  marginTop: "2px",
                }}
              >
                / 100
              </div>
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <PageBadge label={data.verdict} color={vColor} />
          </div>
        </div>

        {/* ── Trust Breakdown Categories ── */}
        <div
          style={{
            padding: "12px 16px 0",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span aria-hidden="true">&#x1F4CA;</span>
          Trust Breakdown
        </div>
        {data.categories.map((cat, i) => (
          <TrustCategoryRow key={cat.name} category={cat} index={i} />
        ))}

        {/* ── Risk Flags ── */}
        <div
          style={{
            padding: "12px 16px 0",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span aria-hidden="true">&#x26A0;</span>
          Risk Flags
        </div>
        {data.riskFlags.map((flag, i) => (
          <RiskFlagRow key={flag.id} flag={flag} index={i} />
        ))}

        {/* ── Recommendation Box ── */}
        <div
          style={{
            margin: "16px",
            padding: "16px",
            borderRadius: "12px",
            background: vBg,
            border: `1px solid ${vColor}33`,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            Recommendation
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: vColor,
              marginBottom: "6px",
            }}
          >
            {data.verdict}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-muted-foreground)",
              lineHeight: 1.6,
            }}
          >
            {String(data.verdict) === "SAFE TO TRADE" &&
              "This token passes all major safety checks. Normal trading activity detected with healthy distribution."}
            {String(data.verdict) === "EXERCISE CAUTION" &&
              "Some risk factors detected. Review the flags above before committing capital. Consider position sizing carefully."}
            {String(data.verdict) === "HIGH RISK" &&
              "Multiple severe risk indicators present. Strongly recommend avoiding this token or limiting exposure to minimal amounts."}
          </div>
        </div>

        {/* ── Related SHIELD Alerts ── */}
        <div
          style={{
            padding: "12px 16px 0",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span aria-hidden="true">&#x1F6E1;</span>
          Related SHIELD Alerts
        </div>
        {data.relatedAlerts.map((alert, i) => (
          <RelatedAlertRow key={alert.id} alert={alert} index={i} />
        ))}

        {/* ── Activity micro-moment ── */}
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
          +5.7% ON TRUST SCORE QUERIES TODAY
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Trust Category Row ─────────────────────────────────────────────────────

interface TrustCategoryRowProps {
  category: any;
  index: number;
}

const TrustCategoryRow = memo(function TrustCategoryRow({
  category,
  index,
}: TrustCategoryRowProps) {
  const color = categoryColor(category.score);

  return (
    <div
      style={{
        padding: "10px 16px",
        background: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
          }}
        >
          {category.name}
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color,
          }}
        >
          {category.score}
        </span>
      </div>
      <ProgressBar value={category.score} max={100} color={color} height={4} />
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-muted-foreground)",
          marginTop: "4px",
        }}
      >
        {category.description}
      </div>
    </div>
  );
});

// ── Risk Flag Row ──────────────────────────────────────────────────────────

interface RiskFlagRowProps {
  flag: any;
  index: number;
}

const RiskFlagRow = memo(function RiskFlagRow({ flag, index }: RiskFlagRowProps) {
  const sevColor = flagSeverityColor(flag.severity);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 16px",
        background: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
        animation: `alert-stagger 0.3s ease-out ${(index + 5) * 0.04}s both`,
      }}
    >
      <PageBadge label={flag.severity.toUpperCase()} color={sevColor} small />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            marginBottom: "2px",
          }}
        >
          {flag.name}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
            lineHeight: 1.5,
            marginBottom: "4px",
          }}
        >
          {flag.description}
        </div>
        <div
          style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted-foreground)",
            opacity: 0.7,
          }}
        >
          Detected {formatDetectedTime(flag.detectedAt)}
        </div>
      </div>
    </div>
  );
});

// ── Related Alert Row ──────────────────────────────────────────────────────

interface RelatedAlertRowProps {
  alert: any;
  index: number;
}

const RelatedAlertRow = memo(function RelatedAlertRow({ alert, index }: RelatedAlertRowProps) {
  const sevColor =
    alert.severity === "critical"
      ? "var(--shield-danger)"
      : alert.severity === "high"
        ? "var(--shield-suspicious)"
        : "var(--shield-caution)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        background: "var(--color-card)",
        borderBottom: "1px solid var(--color-border)",
        animation: `alert-stagger 0.3s ease-out ${(index + 9) * 0.04}s both`,
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
          {alert.title}
        </div>
      </div>
      <span
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--color-muted-foreground)",
          flexShrink: 0,
        }}
      >
        {alert.timeAgo}
      </span>
    </div>
  );
});
