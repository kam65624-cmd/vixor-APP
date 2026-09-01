import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import {
  PageLayout,
  StatsRow,
  PageScrollArea,
  DataRow,
  PageBadge,
  ProgressBar,
} from "@/components/vixor/PageLayout";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getWatchlist } from "@/domains/shield/functions";

// ── Mock Data ──────────────────────────────────────────────────────────────

type RiskLevel = "Safe" | "Caution" | "Danger";

const FILTER_OPTIONS = ["All", "Safe", "Caution", "Danger"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function riskColor(level: RiskLevel): string {
  switch (level) {
    case "Safe":
      return "var(--shield-safe)";
    case "Caution":
      return "var(--shield-caution)";
    case "Danger":
      return "var(--shield-danger)";
  }
}

function riskBarColor(score: number): string {
  if (score >= 70) return "var(--shield-safe)";
  if (score >= 40) return "var(--shield-caution)";
  return "var(--shield-danger)";
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/shield/exposure")({
  head: () => ({
    meta: [{ title: "Exposure Monitor — SHIELD" }],
  }),
  component: ExposurePage,
});

function ExposurePage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const stableWatchlist = useStableServerFn(getWatchlist);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => stableWatchlist(),
    staleTime: 60_000,
  });

  const tokensData = (data?.tokens ?? []).map((t: any) => ({
    id: t.id,
    name: t.token_name ?? "Unknown",
    symbol: t.token_symbol ?? "???",
    chain: t.chain,
    exposure: 0,
    riskLevel: "Safe" as RiskLevel,
    riskScore: 80,
    allocation: 0,
  }));

  const totalExposure = tokensData.reduce((sum: number, t: any) => sum + t.exposure, 0);
  const atRiskTokens = tokensData.filter((t: any) => t.riskLevel !== "Safe").length;
  const highRiskPct =
    tokensData.length > 0
      ? (tokensData.filter((t: any) => t.riskLevel === "Danger").length / tokensData.length) * 100
      : 0;
  const protectedTokens = tokensData.filter((t: any) => t.riskLevel === "Safe").length;

  const filteredTokens = tokensData.filter((t: any) => {
    if (activeFilter === "All") return true;
    return t.riskLevel === activeFilter;
  });

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  return (
    <PageLayout
      title="Exposure Monitor"
      badge="RISK"
      badgeColor="var(--char-sly)"
      loadingColor="var(--char-sly)"
    >
      <StatsRow
        stats={[
          {
            label: "Total Exposure",
            value: formatUSD(totalExposure),
            color: "var(--char-sly)",
          },
          {
            label: "At Risk Tokens",
            value: String(atRiskTokens),
            color: "var(--shield-suspicious)",
          },
          {
            label: "High Risk %",
            value: `${highRiskPct.toFixed(1)}%`,
            color: "var(--shield-danger)",
          },
          {
            label: "Protected Tokens",
            value: String(protectedTokens),
            color: "var(--shield-safe)",
          },
        ]}
      />

      <style>{`
        @keyframes alert-stagger {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Filter bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-muted)",
          flexShrink: 0,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            marginRight: "4px",
            flexShrink: 0,
          }}
        >
          Filter:
        </span>
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilter === opt;
          const optColor =
            opt === "Safe"
              ? "var(--shield-safe)"
              : opt === "Caution"
                ? "var(--shield-caution)"
                : opt === "Danger"
                  ? "var(--shield-danger)"
                  : "var(--char-sly)";
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleFilterChange(opt)}
              style={{
                fontSize: "11px",
                fontWeight: isActive ? 700 : 600,
                padding: "6px 14px",
                borderRadius: "8px",
                border: isActive ? `1px solid ${optColor}44` : "1px solid var(--color-border)",
                background: isActive ? `${optColor}18` : "transparent",
                color: isActive ? optColor : "var(--color-muted-foreground)",
                cursor: "pointer",
                minHeight: "44px",
                minWidth: "44px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* ── Table header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          height: "32px",
          background: "var(--color-muted)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            flex: "1 1 0",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          TOKEN
        </span>
        <span
          style={{
            width: "80px",
            textAlign: "right",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          EXPOSURE
        </span>
        <span
          style={{
            width: "60px",
            textAlign: "center",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          RISK
        </span>
        <span
          style={{
            width: "50px",
            textAlign: "right",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          %
        </span>
      </div>

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
            Error loading watchlist.
          </div>
        )}
        {filteredTokens.length > 0 && !isLoading
          ? filteredTokens.map((token: any, i: number) => (
              <ExposureRow key={token.id} token={token} index={i} />
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
                  &#x1F4CA;
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>
                  No tokens match this filter
                </span>
                <span style={{ fontSize: "12px", marginTop: "4px" }}>
                  Try selecting a different risk level
                </span>
              </div>
            )}

        {/* Footer: Scan All Tokens button */}
        <div style={{ padding: "16px" }}>
          <button
            type="button"
            style={{
              width: "100%",
              minHeight: "48px",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              borderRadius: "10px",
              border: `1px solid var(--char-sly-border)`,
              background: "var(--char-sly)14",
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
            Scan All Tokens
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
          VIX +5.2% ON EXPOSURE ANALYSIS
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Exposure Row Component ──────────────────────────────────────────────────

interface ExposureRowProps {
  token: any;
  index: number;
}

const ExposureRow = memo(function ExposureRow({ token, index }: ExposureRowProps) {
  const rlColor = riskColor(token.riskLevel);
  const barColor = riskBarColor(token.riskScore);

  return (
    <DataRow
      leftAccent={rlColor}
      style={
        {
          animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
        } as any
      }
    >
      {/* Token info + chain */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {token.name}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--char-sly)",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            {token.symbol}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            padding: "2px 8px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.04)",
            flexShrink: 0,
            marginLeft: "8px",
          }}
        >
          {token.chain}
        </span>
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-foreground)",
          }}
        >
          {formatUSD(token.exposure)}
        </span>
        <PageBadge label={token.riskLevel} color={rlColor} small />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted-foreground)",
          }}
        >
          {token.allocation}%
        </span>
      </div>

      {/* Risk score bar */}
      <ProgressBar
        value={token.riskScore}
        color={barColor}
        height={4}
        label="Score"
        labelRight={`${token.riskScore}`}
      />
    </DataRow>
  );
});
