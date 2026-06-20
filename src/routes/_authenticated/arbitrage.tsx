import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Zap, Shield, Activity, TrendingUp, AlertTriangle } from "lucide-react";

// ============================================================================
// VIXOR Arbitrage Dashboard
// ============================================================================
//
// Displays:
//   - Bot status (mode, dry-run, execution enabled)
//   - Latest scan results (opportunities found)
//   - Bot stats (total scans, trades, profit)
//   - Manual scan trigger button
//   - Safety warnings (dry-run mode, etc.)
//
// Security:
//   - Page is under _authenticated/ so only logged-in users can access
//   - Manual scan calls server function with user context
//   - Live execution requires admin role (future)
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">Arbitrage Terminal</h1>
          <p className="text-sm text-muted-foreground">
            Cross-DEX + Triangular + CEX-DEX opportunities (ported from axiom-arbitrage)
          </p>
        </div>
        <Button onClick={runScan} disabled={scanning} variant="default">
          {scanning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Scan Now
            </>
          )}
        </Button>
      </div>

      {/* Safety Warning */}
      <Alert className="border-yellow-500/30 bg-yellow-500/5">
        <Shield className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          <strong>Safety:</strong> Bot runs in <strong>DRY_RUN=true</strong> mode by default. No real
          funds are moved. To enable live execution, set{" "}
          <code className="rounded bg-muted px-1">ARBITRAGE_EXECUTION_ENABLED=true</code> and{" "}
          <code className="rounded bg-muted px-1">ARBITRAGE_DRY_RUN=false</code> in env vars.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" /> Total Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.opportunitiesFound}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" /> Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.tradesExecuted}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({stats.tradesSucceeded} ✓)
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" /> Circuit Breaker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.circuitBreakerOpen ? (
                  <span className="text-red-400">OPEN</span>
                ) : (
                  <span className="text-green-400">CLOSED</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.consecutiveFailures} failures
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Opportunities ({opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No opportunities detected. Click "Scan Now" to run a manual scan.
            </p>
          ) : (
            <div className="space-y-2">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        opp.strategy === "cross-dex"
                          ? "default"
                          : opp.strategy === "triangular"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {opp.strategy}
                    </Badge>
                    <div>
                      <div className="font-mono text-sm">
                        {opp.startToken.symbol} → {opp.endToken.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {opp.legs.length} legs · confidence {opp.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-green-400">
                      +{opp.netProfitBps} bps
                    </div>
                    <div className="text-xs text-muted-foreground">net profit</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Mode Indicator */}
      <div className="text-center text-xs text-muted-foreground">
        Bot Mode: <Badge variant="outline">{botMode}</Badge> · Ported from axiom-arbitrage-trading-bot
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/arbitrage")({
  component: ArbDashboard,
});
