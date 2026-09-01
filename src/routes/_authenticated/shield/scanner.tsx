import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, memo } from "react";
import { PageLayout, PageScrollArea, PageBadge, ProgressBar } from "@/components/vixor/PageLayout";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scanToken } from "@/domains/shield/functions";
import type { ScanTokenResult } from "@/domains/shield/functions";

// ── Mock Data ──────────────────────────────────────────────────────────────

const CHAINS = ["Solana", "Ethereum", "BSC", "Base", "Arbitrum"] as const;

type Verdict = "SAFE" | "CAUTION" | "SUSPICIOUS" | "DANGER";

type SecurityFlag = {
  name: string;
  passed: boolean;
  description: string;
};

type RugPullFlag = {
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function verdictColor(v: Verdict): string {
  switch (v) {
    case "SAFE":
      return "var(--shield-safe)";
    case "CAUTION":
      return "var(--shield-caution)";
    case "SUSPICIOUS":
      return "var(--shield-suspicious)";
    case "DANGER":
      return "var(--shield-danger)";
    default:
      return "var(--shield-unknown)";
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

function riskScoreColor(score: number): string {
  if (score >= 75) return "var(--shield-safe)";
  if (score >= 50) return "var(--shield-caution)";
  if (score >= 25) return "var(--shield-suspicious)";
  return "var(--shield-danger)";
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/shield/scanner")({
  head: () => ({
    meta: [{ title: "Contract Scanner — SHIELD" }],
  }),
  component: ShieldScannerPage,
});

function ShieldScannerPage() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<string>("Solana");
  const [chainOpen, setChainOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [pasted, setPasted] = useState(false);

  const [scanResult, setScanResult] = useState<ScanTokenResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const stableScan = useStableServerFn(scanToken);

  const scanMutation = useMutation({
    mutationFn: (input: { address: string; chain: string }) => stableScan({ data: input }),
    onSuccess: (result) => {
      setScanResult(result);
      setScanError(null);
      setScanned(true);
      setRawExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
    },
    onError: (err: Error) => {
      setScanError(err.message);
      setScanned(false);
    },
  });

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text.trim());
      setPasted(true);
      setTimeout(() => setPasted(false), 1200);
    } catch {
      /* clipboard access denied */
    }
  }, []);

  const handleScan = useCallback(() => {
    if (address.length < 10) return;
    scanMutation.mutate({ address, chain: chain.toLowerCase() });
  }, [address, chain, scanMutation]);

  const result = scanResult
    ? {
        verdict: (scanResult.trustScore.level === "safe"
          ? "SAFE"
          : scanResult.trustScore.level === "low"
            ? "CAUTION"
            : scanResult.trustScore.level === "medium"
              ? "SUSPICIOUS"
              : "DANGER") as Verdict,
        riskScore: 100 - scanResult.trustScore.score,
        flags: scanResult.trustScore.factors.map((f) => ({
          name: f.name,
          passed: f.status === "pass",
          description: f.detail,
        })),
        buyTax: scanResult.security.buyTax,
        sellTax: scanResult.security.sellTax,
        topHoldersPct: scanResult.security.top10HolderPct ?? 0,
        totalHolders: scanResult.market.holders,
        lpLockedPct: 0,
        rugPullFlags: scanResult.security.risks.map((r) => ({
          name: r,
          severity: "high" as any,
          description: r,
        })),
        rawData: scanResult,
      }
    : null;

  const vColor = result ? verdictColor(result.verdict) : "var(--shield-unknown)";

  return (
    <PageLayout
      title="Contract Scanner"
      badge="SCAN"
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
        {/* ── Input Section ── */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {/* Contract Address Input */}
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
            Contract Address
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter or paste contract address..."
              aria-label="Contract address input"
              style={{
                flex: 1,
                minHeight: "48px",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--color-foreground)",
                background: "var(--color-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0 14px",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "var(--char-sly-border)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "var(--color-border)";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleScan();
              }}
            />
            <button
              type="button"
              onClick={handlePaste}
              aria-label="Paste from clipboard"
              style={{
                minHeight: "48px",
                minWidth: "48px",
                fontSize: "12px",
                fontWeight: 700,
                color: pasted ? "var(--shield-safe)" : "var(--char-sly)",
                background: pasted ? "var(--shield-safe)14" : "var(--char-sly)14",
                border: `1px solid ${pasted ? "var(--shield-safe)" : "var(--char-sly-border)"}`,
                borderRadius: "10px",
                padding: "0 14px",
                cursor: "pointer",
                transition: "background 0.15s ease, transform 0.1s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--char-sly)22";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = pasted
                  ? "var(--shield-safe)14"
                  : "var(--char-sly)14";
              }}
            >
              {pasted ? "✓" : "Paste"}
            </button>
          </div>

          {/* Chain Selector */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
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
              Chain
            </div>
            <button
              type="button"
              onClick={() => setChainOpen(!chainOpen)}
              aria-label="Select chain"
              aria-expanded={chainOpen}
              style={{
                width: "100%",
                minHeight: "48px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                background: "var(--color-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--char-sly-border)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
            >
              <span>{chain}</span>
              <span
                aria-hidden="true"
                style={{
                  fontSize: "10px",
                  color: "var(--color-muted-foreground)",
                  transition: "transform 0.2s ease",
                  transform: chainOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ▼
              </span>
            </button>
            {chainOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  marginTop: "4px",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {CHAINS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setChain(c);
                      setChainOpen(false);
                    }}
                    style={{
                      width: "100%",
                      minHeight: "44px",
                      fontSize: "13px",
                      fontWeight: chain === c ? 700 : 500,
                      color: chain === c ? "var(--char-sly)" : "var(--color-foreground)",
                      background: chain === c ? "var(--char-sly)14" : "transparent",
                      border: "none",
                      borderBottom:
                        c !== CHAINS[CHAINS.length - 1] ? "1px solid var(--color-border)" : "none",
                      padding: "0 14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (chain !== c)
                        (e.currentTarget as HTMLElement).style.background = "var(--color-muted)";
                    }}
                    onMouseLeave={(e) => {
                      if (chain !== c)
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scan Button */}
          <button
            type="button"
            onClick={handleScan}
            disabled={address.length < 10}
            aria-label="Scan contract"
            style={{
              width: "100%",
              minHeight: "52px",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              borderRadius: "12px",
              border: "none",
              background: address.length < 10 ? "var(--color-muted)" : "var(--char-sly)",
              color:
                address.length < 10 ? "var(--color-muted-foreground)" : "var(--color-background)",
              cursor: address.length < 10 ? "not-allowed" : "pointer",
              boxShadow: address.length >= 10 ? "0 0 20px var(--char-sly-glow)" : "none",
              transition: "background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (address.length >= 10) {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.01)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px var(--char-sly-glow)";
              }
            }}
            onMouseLeave={(e) => {
              if (address.length >= 10) {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px var(--char-sly-glow)";
              }
            }}
          >
            SCAN CONTRACT
          </button>
        </div>

        {/* ── Scan Results ── */}
        {scanMutation.isPending ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: "var(--color-muted-foreground)" }}
          >
            Loading...
          </div>
        ) : scanError ? (
          <div style={{ padding: "20px", color: "var(--shield-danger)" }}>{scanError}</div>
        ) : (
          scanned &&
          result && (
            <div>
              {/* Verdict Banner */}
              <div
                style={{
                  padding: "16px",
                  background: `${vColor}12`,
                  borderBottom: `1px solid ${vColor}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-muted-foreground)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "4px",
                    }}
                  >
                    Verdict
                  </div>
                  <PageBadge label={result.verdict} color={vColor} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      fontFamily: "var(--font-mono)",
                      color: vColor,
                    }}
                  >
                    {result.riskScore}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    /100
                  </span>
                </div>
              </div>

              {/* Risk Score ProgressBar */}
              <div style={{ padding: "12px 16px" }}>
                <ProgressBar
                  value={result.riskScore}
                  max={100}
                  color={riskScoreColor(result.riskScore)}
                  height={6}
                  label="Risk Score"
                  labelRight={`${result.riskScore}/100`}
                />
              </div>

              {/* Security Flags 2x2 Grid */}
              <div
                style={{
                  padding: "0 16px 12px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {result.flags.map((flag, i) => (
                  <SecurityFlagCard key={flag.name} flag={flag} index={i} />
                ))}
              </div>

              {/* Tax Info */}
              <div
                style={{
                  padding: "0 16px 12px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <TaxCard label="Buy Tax" value={result.buyTax} index={4} />
                <TaxCard label="Sell Tax" value={result.sellTax} index={5} />
              </div>

              {/* Holder Analysis */}
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--color-card)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span aria-hidden="true" style={{ marginRight: "6px" }}>
                    &#x1F465;
                  </span>
                  Holder Analysis
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    Top 10 Holders
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color:
                        result.topHoldersPct > 50
                          ? "var(--shield-danger)"
                          : result.topHoldersPct > 30
                            ? "var(--shield-caution)"
                            : "var(--shield-safe)",
                    }}
                  >
                    {result.topHoldersPct.toFixed(1)}%
                  </span>
                </div>
                <ProgressBar
                  value={result.topHoldersPct}
                  max={100}
                  color={
                    result.topHoldersPct > 50
                      ? "var(--shield-danger)"
                      : result.topHoldersPct > 30
                        ? "var(--shield-caution)"
                        : "var(--shield-safe)"
                  }
                  height={4}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    Total Holders
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--char-sly)",
                    }}
                  >
                    {result.totalHolders.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    LP Locked
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color:
                        result.lpLockedPct >= 80
                          ? "var(--shield-safe)"
                          : result.lpLockedPct >= 50
                            ? "var(--shield-caution)"
                            : "var(--shield-danger)",
                    }}
                  >
                    {result.lpLockedPct.toFixed(1)}%
                  </span>
                </div>
                <ProgressBar
                  value={result.lpLockedPct}
                  max={100}
                  color={
                    result.lpLockedPct >= 80
                      ? "var(--shield-safe)"
                      : result.lpLockedPct >= 50
                        ? "var(--shield-caution)"
                        : "var(--shield-danger)"
                  }
                  height={4}
                />
              </div>

              {/* Rug Pull Flags */}
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--color-card)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span aria-hidden="true" style={{ marginRight: "6px" }}>
                    &#x26A0;
                  </span>
                  Rug Pull Flags
                </div>
                {result.rugPullFlags.map((flag, i) => (
                  <RugPullFlagRow key={flag.name} flag={flag} index={i} />
                ))}
              </div>

              {/* Raw Data Expandable */}
              <div
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setRawExpanded(!rawExpanded)}
                  aria-label={
                    rawExpanded ? "Collapse raw contract data" : "Expand raw contract data"
                  }
                  aria-expanded={rawExpanded}
                  style={{
                    width: "100%",
                    minHeight: "48px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-muted-foreground)",
                    background: "transparent",
                    border: "none",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)";
                  }}
                >
                  <span>Raw Contract Data</span>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: "10px",
                      transition: "transform 0.2s ease",
                      transform: rawExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>
                {rawExpanded && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--color-muted-foreground)",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      background: "var(--color-muted)",
                      margin: "0 16px 12px",
                      borderRadius: "8px",
                    }}
                  >
                    {JSON.stringify(result.rawData, null, 2)}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ── VIX micro-moment ── */}
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
          VIX +8.2% ON SHIELD SCANS TODAY
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}

// ── Security Flag Card ──────────────────────────────────────────────────────

interface SecurityFlagCardProps {
  flag: SecurityFlag;
  index: number;
}

const SecurityFlagCard = memo(function SecurityFlagCard({ flag, index }: SecurityFlagCardProps) {
  const passColor = flag.passed ? "var(--shield-safe)" : "var(--shield-danger)";

  return (
    <div
      style={{
        padding: "12px",
        background: "var(--color-card)",
        border: `1px solid ${passColor}33`,
        borderRadius: "10px",
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-foreground)",
          }}
        >
          {flag.name}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontSize: "16px",
            lineHeight: 1,
            color: passColor,
          }}
        >
          {flag.passed ? "✓" : "✗"}
        </span>
      </div>
      <span
        style={{
          fontSize: "11px",
          color: "var(--color-muted-foreground)",
          lineHeight: 1.4,
        }}
      >
        {flag.description}
      </span>
    </div>
  );
});

// ── Tax Card ────────────────────────────────────────────────────────────────

interface TaxCardProps {
  label: string;
  value: number;
  index: number;
}

const TaxCard = memo(function TaxCard({ label, value, index }: TaxCardProps) {
  const taxColor =
    value > 10
      ? "var(--shield-danger)"
      : value > 5
        ? "var(--shield-caution)"
        : "var(--shield-safe)";

  return (
    <div
      style={{
        flex: 1,
        padding: "12px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        animation: `alert-stagger 0.3s ease-out ${index * 0.04}s both`,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 900,
          fontFamily: "var(--font-mono)",
          color: taxColor,
        }}
      >
        {value.toFixed(1)}%
      </div>
    </div>
  );
});

// ── Rug Pull Flag Row ───────────────────────────────────────────────────────

interface RugPullFlagRowProps {
  flag: RugPullFlag;
  index: number;
}

const RugPullFlagRow = memo(function RugPullFlagRow({ flag, index }: RugPullFlagRowProps) {
  const sevColor = flagSeverityColor(flag.severity);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
        animation: `alert-stagger 0.3s ease-out ${(index + 6) * 0.04}s both`,
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
            lineHeight: 1.4,
          }}
        >
          {flag.description}
        </div>
      </div>
    </div>
  );
});
