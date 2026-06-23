import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Zap, Shield, Activity, TrendingUp, AlertTriangle } from "lucide-react";

interface BotStats {
  totalScans: number; opportunitiesFound: number; tradesExecuted: number;
  tradesSucceeded: number; totalProfitLamports: string; consecutiveFailures: number;
  circuitBreakerOpen: boolean;
}

const card = { background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" };
const labelStyle = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#9CA3AF" };

function ArbDashboard() {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stats] = useState<BotStats | null>(null);

  // No API endpoint exists yet — show Coming Soon
  useEffect(() => {
    setError("Arbitrage scanner API endpoint not yet implemented");
  }, []);

  return (
    <div className="w-full" style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "24px 0" }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F59E0B" }}>Arbitrage Terminal</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>Cross-DEX + Triangular + CEX-DEX opportunities</p>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-3 p-4" style={{ ...card, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
        <Shield className="size-4 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
        <div className="text-sm" style={{ color: "#FDE68A" }}>
          <strong>Safety:</strong> Bot runs in <strong>DRY_RUN=true</strong> mode by default. No real funds are moved.
        </div>
      </div>

      {/* Coming Soon */}
      <div className="mt-6" style={{ ...card, padding: "60px 20px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(245,158,11,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: "2px solid rgba(245,158,11,0.15)" }}>
          <Zap style={{ width: 36, height: 36, color: "#F59E0B" }} />
        </div>
        <h3 className="text-xl font-bold mb-2">Arbitrage Scanner</h3>
        <p className="text-sm mb-4" style={{ color: "#9CA3AF", maxWidth: "400px", margin: "0 auto 16px" }}>
          Automated arbitrage detection across Solana DEXs. Scans for cross-DEX, triangular, and CEX-DEX opportunities.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>COMING SOON</span>
          <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", background: "rgba(16,185,129,0.08)", color: "#34D399" }}>Requires: Scanner backend</span>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/arbitrage")({
  component: ArbDashboard,
});