import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  PageLayout,
  StatsRow,
  PageSectionTitle,
  PageScrollArea,
  DataRow,
  PageBadge,
  SkeletonRow,
} from "@/components/vixor/PageLayout";
import { scanArbitrage, type ArbitrageScanResponse } from "@/shared/data";

export const Route = createFileRoute("/_authenticated/arbitrage")({
  component: ArbDashboard,
});

const STRATEGY_COLORS: Record<string, string> = {
  "cross-dex": "var(--color-bullish)",
  triangular: "var(--color-primary)",
  "cex-dex": "var(--color-info)",
};

function ArbDashboard() {
  const [data, setData] = useState<ArbitrageScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    try {
      const result = await scanArbitrage();
      setData(result);
    } catch {
      console.warn("[Arbitrage] UI scan error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-scan toggle
  useEffect(() => {
    if (autoScan) {
      runScan();
      intervalRef.current = setInterval(runScan, 10000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoScan, runScan]);

  const oppCount = data?.opportunities.length ?? 0;
  const rejectedCount = data?.rejected.length ?? 0;
  const lastDuration = data ? `${data.durationMs}ms` : "—";

  return (
    <PageLayout
      title="Arbitrage Scanner"
      badge={data?.mode === "mock" ? "MOCK MODE" : "LIVE"}
      badgeColor={data?.mode === "mock" ? "var(--color-neutral-wait)" : "var(--color-bullish)"}
      loading={loading && !data}
    >
      {/* Stats */}
      <StatsRow
        stats={[
          { label: "Found", value: String(oppCount), color: "var(--color-bullish)" },
          { label: "Rejected", value: String(rejectedCount), color: "var(--color-bearish)" },
          { label: "Last Scan", value: lastDuration },
          {
            label: "Auto",
            value: autoScan ? "ON" : "OFF",
            color: autoScan ? "var(--color-bullish)" : "var(--color-muted-foreground)",
          },
        ]}
      />

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-card)",
        }}
      >
        <button
          onClick={runScan}
          disabled={loading}
          style={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "7px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: loading ? "wait" : "pointer",
            background: loading ? "var(--color-muted)" : "var(--color-bullish)",
            color: loading ? "var(--color-muted-foreground)" : "#000",
            transition: "all 0.15s ease",
          }}
        >
          {loading ? "Scanning..." : "Scan Now"}
        </button>
        <button
          onClick={() => setAutoScan(!autoScan)}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "7px 12px",
            borderRadius: "6px",
            border: `1px solid ${autoScan ? "var(--color-bullish)" : "var(--color-border)"}`,
            cursor: "pointer",
            background: autoScan ? "rgba(16,185,129,0.1)" : "transparent",
            color: autoScan ? "var(--color-bullish)" : "var(--color-muted-foreground)",
            transition: "all 0.15s ease",
          }}
        >
          {autoScan ? "Auto: ON (10s)" : "Auto Scan"}
        </button>
        {data?.scannedAt && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              color: "var(--color-muted-foreground)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {new Date(data.scannedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <PageScrollArea>
        {/* API keys required notice */}
        {!data && !loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 20px",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "32px", opacity: 0.3 }}>&#9889;</span>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
              }}
            >
              Arbitrage Scanner
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-muted-foreground)",
                textAlign: "center",
                maxWidth: "280px",
                lineHeight: 1.5,
              }}
            >
              Scans Solana DEXs for cross-DEX, triangular, and CEX-DEX arbitrage opportunities.
              Requires Axiom API key and Helius RPC to operate in live mode. Configure
              ARBITRAGE_AXIOM_API_KEY and ARBITRAGE_SOLANA_RPC_URL in your environment.
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {/* Opportunities */}
        {data && data.opportunities.length > 0 && (
          <>
            <PageSectionTitle title="Opportunities" count={data.opportunities.length} />
            {data.opportunities.map((opp) => (
              <DataRow key={opp.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--color-foreground)",
                      }}
                    >
                      {opp.startToken} &#8594; {opp.endToken}
                    </span>
                    <PageBadge
                      label={opp.strategy}
                      color={STRATEGY_COLORS[opp.strategy] || "var(--color-muted-foreground)"}
                      small
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      color: "var(--color-bullish)",
                    }}
                  >
                    +{opp.netProfitBps.toFixed(1)} bps
                  </span>
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
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    {opp.legs.map((l, i) => (
                      <span key={i}>
                        {i > 0 && " &#8594; "}
                        <span style={{ color: "var(--color-foreground)", fontWeight: 600 }}>
                          {l.venue}
                        </span>{" "}
                        {l.inputSymbol}/{l.outputSymbol}
                      </span>
                    ))}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                    Confidence:{" "}
                    <span style={{ color: "var(--color-foreground)", fontWeight: 700 }}>
                      {(opp.confidence * 100).toFixed(0)}%
                    </span>
                    {" · "}
                    Gross:{" "}
                    <span style={{ fontWeight: 600 }}>{opp.grossProfitBps.toFixed(1)} bps</span>
                  </span>
                </div>
              </DataRow>
            ))}
          </>
        )}

        {/* Rejected */}
        {data && data.rejected.length > 0 && (
          <>
            <PageSectionTitle title="Rejected" count={data.rejected.length} />
            {data.rejected.map((r, i) => (
              <DataRow key={i}>
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <PageBadge
                      label={r.strategy}
                      color={STRATEGY_COLORS[r.strategy] || "var(--color-muted-foreground)"}
                      small
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-bearish)",
                      maxWidth: "60%",
                      textAlign: "right",
                    }}
                  >
                    {r.reason}
                  </span>
                </div>
              </DataRow>
            ))}
          </>
        )}

        {/* No opportunities found */}
        {data && data.opportunities.length === 0 && data.rejected.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              gap: "8px",
            }}
          >
            <span
              style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
            >
              No opportunities found
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
              Price spreads are too tight. Try again in a few seconds.
            </span>
          </div>
        )}
      </PageScrollArea>
    </PageLayout>
  );
}
