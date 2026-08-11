// ── Opportunities Page ────────────────────────────────────────────────
// Shows market opportunities from the opportunity scanner.
// Uses useScanOpportunities() mutation to trigger a scan.
// Results sorted by confidence descending.
// ─────────────────────────────────────────────────────────────────────────────

import { createFileRoute } from "@tanstack/react-router";
import { memo, useState, useMemo } from "react";
import { useScanOpportunities } from "@/domains/analysis/hooks";
import type { ScannedOpportunity } from "@/domains/analysis/opportunity-scanner";
import {
  PageLayout,
  StatsRow,
  SectionTitle,
  EmptyState,
  ScrollArea,
  SkeletonRow,
} from "@/components/vixor/PageLayout";
import { Search, TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — Vixor" }] }),
  component: OpportunitiesPage,
});

// ── Page ─────────────────────────────────────────────────────────────────

function OpportunitiesPage() {
  const scanMutation = useScanOpportunities();
  const [results, setResults] = useState<ScannedOpportunity[]>([]);
  const [scanMeta, setScanMeta] = useState<{ totalScanned: number; scanDurationMs: number } | null>(
    null,
  );

  const isScanning = scanMutation.isPending;

  const handleScan = async () => {
    try {
      const res = await scanMutation.mutateAsync({});
      setResults(res.opportunities);
      setScanMeta({ totalScanned: res.totalScanned, scanDurationMs: res.scanDurationMs });
    } catch {
      // Error handled by mutation state
    }
  };

  // Sort by confidence descending (server already does this, but re-verify)
  const sorted = useMemo(() => {
    return [...results].sort((a, b) => b.confidence - a.confidence);
  }, [results]);

  const avgConfidence =
    sorted.length > 0
      ? Math.round(sorted.reduce((s, o) => s + o.confidence, 0) / sorted.length)
      : 0;

  return (
    <PageLayout
      title="Opportunities"
      badge="SCANNER"
      badgeColor="var(--color-primary)"
      loading={false}
    >
      <StatsRow
        stats={[
          {
            label: "Found",
            value: String(sorted.length),
            icon: "🎯",
            color: "var(--color-bullish)",
          },
          {
            label: "Avg Confidence",
            value: `${avgConfidence}%`,
            icon: "📊",
            color: avgConfidence >= 70 ? "var(--color-bullish)" : "var(--color-neutral-wait)",
          },
          ...(scanMeta
            ? [
                {
                  label: "Scanned",
                  value: `${scanMeta.totalScanned} pairs`,
                  icon: "🔍",
                  color: "var(--color-muted-foreground)",
                  sub: `${(scanMeta.scanDurationMs / 1000).toFixed(1)}s`,
                },
              ]
            : []),
        ]}
      />

      {/* Scan button */}
      <div style={{ padding: "8px 16px" }}>
        <button
          onClick={handleScan}
          disabled={isScanning}
          style={{
            width: "100%",
            height: "44px",
            borderRadius: "12px",
            border: "none",
            background: isScanning
              ? "color-mix(in srgb, var(--color-primary) 50%, transparent)"
              : "var(--color-primary)",
            color: "var(--color-background)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: isScanning ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all var(--transition-normal)",
            minHeight: "44px",
          }}
        >
          {isScanning ? (
            <>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid color-mix(in srgb, var(--color-background) 40%, transparent)",
                  borderTopColor: "var(--color-background)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Scanning Market…
            </>
          ) : (
            <>
              <Search size={16} />
              Scan Market
            </>
          )}
        </button>
      </div>

      <SectionTitle title="Opportunities" count={sorted.length} />

      <ScrollArea>
        {isScanning ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : sorted.length > 0 ? (
          sorted.map((opp, i) => (
            <OpportunityCard key={`${opp.pair}-${opp.timeframe}-${i}`} opportunity={opp} />
          ))
        ) : (
          <EmptyState
            icon="🔭"
            title="No Opportunities Yet"
            message={
              'Click "Scan Market" to find high-confidence setups across 15+ pairs and multiple timeframes.'
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────

const OpportunityCard = memo(function OpportunityCard({
  opportunity,
}: {
  opportunity: ScannedOpportunity;
}) {
  const opp = opportunity;
  const isBuy = opp.direction === "BUY";
  const dirColor = isBuy ? "var(--color-bullish)" : "var(--color-bearish)";
  const DirIcon = isBuy ? TrendingUp : TrendingDown;

  const fmtPrice = (n: number) =>
    n >= 1000 ? `$${n.toFixed(1)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`;

  return (
    <div
      style={{
        margin: "0 16px 10px",
        padding: "14px 16px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${dirColor}`,
        borderRadius: "14px",
        boxShadow: "var(--shadow-card)",
        transition: "all var(--transition-normal)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "5px",
              background: `${dirColor}14`,
              color: dirColor,
              letterSpacing: "0.04em",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <DirIcon size={10} /> {opp.direction}
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {opp.pair}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "5px",
              background: "color-mix(in srgb, var(--color-foreground) 5%, transparent)",
              color: "var(--color-muted-foreground)",
            }}
          >
            {opp.timeframe}
          </span>
        </div>

        {/* Confidence + R:R */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {opp.riskReward > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--color-foreground)",
                opacity: 0.7,
              }}
            >
              R:R {opp.riskReward.toFixed(1)}
            </span>
          )}
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: dirColor,
              fontFamily: "var(--font-mono)",
              lineHeight: 1,
            }}
          >
            {opp.confidence}%
          </span>
        </div>
      </div>

      {/* Price grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
          marginBottom: "10px",
        }}
      >
        <PriceCell label="Entry" value={fmtPrice(opp.entryPrice)} />
        <PriceCell label="SL" value={fmtPrice(opp.stopLoss)} valueColor="var(--color-bearish)" />
        <PriceCell
          label="TP"
          value={opp.takeProfits[0] ? fmtPrice(opp.takeProfits[0]) : "—"}
          valueColor="var(--color-bullish)"
        />
      </div>

      {/* Key signals + regime */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {opp.regime && opp.regime !== "unknown" && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-muted-foreground)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Zap size={10} style={{ color: "var(--color-primary)" }} />
            <span style={{ fontWeight: 600 }}>Regime:</span> {opp.regime}
          </div>
        )}
        {opp.keySignals.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            {opp.keySignals.map((s, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Small price cell ──────────────────────────────────────────────────────

function PriceCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        padding: "6px 8px",
        borderRadius: "8px",
        background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          letterSpacing: "0.04em",
          marginBottom: "2px",
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: valueColor ?? "var(--color-foreground)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
