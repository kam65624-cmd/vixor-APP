import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Zap, Shield, Activity, TrendingUp, AlertTriangle } from "lucide-react";

// ============================================================================
// VIXOR Arbitrage Dashboard
// ============================================================================

interface ArbitrageOpportunity {
  id: string;
  strategy: string;
  legs: Array<{ venue: string; inputMint: string; outputMint: string }>;
  startToken: { symbol: string };
  endToken: { symbol: string };
  inputAmount: string;
  expectedOutput: string;
  grossProfitBps: number;
  netProfitBps: number;
  confidence: number;
  detectedAt: number;
  expiresAt: number;
}

interface BotStats {
  totalScans: number;
  opportunitiesFound: number;
  tradesExecuted: number;
  tradesSucceeded: number;
  totalProfitLamports: string;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
  lastScanAt?: number;
}

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};
const mono = { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" };
const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#7B8BA8",
};

function ArbDashboard() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [stats, setStats] = useState<BotStats | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botMode] = useState<"mock" | "live">(() => {
    // Client-side env hint (real config is server-side)
    return "mock";
  });

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      // Server function call (placeholder — needs server fn implementation)
      const res = await fetch("/api/arbitrage/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
      const data = await res.json();
      setOpportunities(data.opportunities ?? []);
      setStats(data.stats ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    runScan();
  }, [runScan]);

  return (
    <div
      className="w-full"
      style={{
        background: "#0A0E1A",
        color: "#F0F4FC",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "24px 0" }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F59E0B" }}>
            Arbitrage Terminal
          </h1>
          <p className="text-sm" style={{ color: "#7B8BA8" }}>
            Cross-DEX + Triangular + CEX-DEX opportunities (ported from axiom-arbitrage)
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
          style={{
            background: scanning
              ? "rgba(255,255,255,0.05)"
              : "linear-gradient(135deg, #3B82F6, #2563EB)",
            color: scanning ? "#7B8BA8" : "#fff",
            border: scanning ? "1px solid rgba(255,255,255,0.06)" : "none",
            opacity: scanning ? 0.7 : 1,
          }}
        >
          {scanning ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="size-4" />
              Scan Now
            </>
          )}
        </button>
      </div>

      {/* Safety Warning */}
      <div
        className="flex items-start gap-3 p-4"
        style={{
          ...card,
          border: "1px solid rgba(245,158,11,0.3)",
          background: "rgba(245,158,11,0.05)",
        }}
      >
        <Shield className="size-4 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
        <div className="text-sm" style={{ color: "#FDE68A" }}>
          <strong>Safety:</strong> Bot runs in <strong>DRY_RUN=true</strong> mode by default. No
          real funds are moved. To enable live execution, set{" "}
          <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>
            ARBITRAGE_EXECUTION_ENABLED=true
          </code>{" "}
          and{" "}
          <code className="px-1 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>
            ARBITRAGE_DRY_RUN=false
          </code>{" "}
          in env vars.
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4" style={{ marginTop: "20px" }}>
          {[
            {
              icon: Activity,
              label: "Total Scans",
              value: String(stats.totalScans),
              color: "#F0F4FC",
            },
            {
              icon: TrendingUp,
              label: "Opportunities",
              value: String(stats.opportunitiesFound),
              color: "#22C55E",
            },
            {
              icon: Zap,
              label: "Trades",
              value: `${stats.tradesExecuted} (${stats.tradesSucceeded} ✓)`,
              color: "#F0F4FC",
            },
            {
              icon: AlertTriangle,
              label: "Circuit Breaker",
              value: stats.circuitBreakerOpen ? "OPEN" : "CLOSED",
              color: stats.circuitBreakerOpen ? "#EF4444" : "#22C55E",
              sub: `${stats.consecutiveFailures} failures`,
            },
          ].map((s) => (
            <div key={s.label} className="p-4" style={card}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="size-3" style={{ color: "#7B8BA8" }} />
                <span style={labelStyle}>{s.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              {s.sub && (
                <div className="text-xs mt-1" style={{ color: "#7B8BA8" }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-4"
          style={{
            ...card,
            marginTop: "20px",
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.05)",
          }}
        >
          <span style={{ color: "#EF4444" }}>{error}</span>
        </div>
      )}

      {/* Opportunities */}
      <div className="mt-6" style={card}>
        <div className="p-4 pb-0">
          <h3 className="text-sm font-bold">Latest Opportunities ({opportunities.length})</h3>
        </div>
        <div className="p-4">
          {opportunities.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#7B8BA8" }}>
              No opportunities detected. Click "Scan Now" to run a manual scan.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-3"
                  style={{
                    background: "rgba(17,24,39,0.5)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          opp.strategy === "cross-dex"
                            ? "rgba(59,130,246,0.15)"
                            : opp.strategy === "triangular"
                              ? "rgba(245,158,11,0.15)"
                              : "transparent",
                        border:
                          opp.strategy === "cross-dex"
                            ? "1px solid rgba(59,130,246,0.3)"
                            : opp.strategy === "triangular"
                              ? "1px solid rgba(245,158,11,0.3)"
                              : "1px solid rgba(255,255,255,0.1)",
                        color:
                          opp.strategy === "cross-dex"
                            ? "#60A5FA"
                            : opp.strategy === "triangular"
                              ? "#F59E0B"
                              : "#7B8BA8",
                      }}
                    >
                      {opp.strategy}
                    </span>
                    <div>
                      <div className="text-sm" style={mono}>
                        {opp.startToken.symbol} → {opp.endToken.symbol}
                      </div>
                      <div className="text-xs" style={{ color: "#7B8BA8" }}>
                        {opp.legs.length} legs · confidence {opp.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ ...mono, color: "#22C55E" }}>
                      +{opp.netProfitBps} bps
                    </div>
                    <div className="text-xs" style={{ color: "#7B8BA8" }}>
                      net profit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bot Mode Indicator */}
      <div className="text-center text-xs py-4" style={{ color: "#4A5568" }}>
        Bot Mode:{" "}
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#7B8BA8" }}
        >
          {botMode}
        </span>{" "}
        · Ported from axiom-arbitrage-trading-bot
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/arbitrage")({
  component: ArbDashboard,
});
