import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { assessTokenWithPatterns } from "@/domains/dr-dex/candlestick-analyzer";
import type { CandlestickAnalysisResult } from "@/domains/dr-dex/candlestick-analyzer";
import { card, labelStyle, inputStyle } from "./constants";

const CHAINS = [
  { value: "solana", label: "Solana" },
  { value: "ethereum", label: "Ethereum" },
  { value: "bsc", label: "BNB Chain" },
  { value: "polygon", label: "Polygon" },
  { value: "base", label: "Base" },
];

const TIMEFRAMES = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

const ACTION_COLORS: Record<string, string> = {
  PROCEED: "var(--color-bullish)",
  REDUCE_SIZE: "#f59e0b",
  WAIT: "var(--color-muted-foreground)",
  BLOCK: "var(--color-bearish)",
};

const ACTION_LABELS: Record<string, string> = {
  PROCEED: "PROCEED",
  REDUCE_SIZE: "REDUCE SIZE",
  WAIT: "WAIT",
  BLOCK: "BLOCK",
};

function BiasBadge({ bias }: { bias: string }) {
  const configs: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    BULLISH: {
      icon: <TrendingUp className="size-3" />,
      color: "var(--color-bullish)",
      label: "BULLISH",
    },
    BEARISH: {
      icon: <TrendingDown className="size-3" />,
      color: "var(--color-bearish)",
      label: "BEARISH",
    },
    NEUTRAL: {
      icon: <Minus className="size-3" />,
      color: "var(--color-muted-foreground)",
      label: "NEUTRAL",
    },
    NO_SIGNAL: {
      icon: <Minus className="size-3" />,
      color: "var(--color-muted-foreground)",
      label: "NO SIGNAL",
    },
  };
  const cfg = configs[bias] ?? configs.NEUTRAL;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 700,
        color: cfg.color,
        background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cfg.color} 30%, transparent)`,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function GovernorBadge({ action, reason }: { action: string; reason: string }) {
  const color = ACTION_COLORS[action] ?? "var(--color-muted-foreground)";
  const label = ACTION_LABELS[action] ?? action;
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: "8px",
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <span style={{ ...labelStyle, color, fontSize: "10px" }}>RISK GOVERNOR</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color,
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "var(--color-muted-foreground)",
          lineHeight: 1.4,
        }}
      >
        {reason}
      </p>
    </div>
  );
}

function PatternRow({
  name,
  type,
  reliability,
}: {
  name: string;
  type: string;
  reliability: number;
}) {
  const isBullish = type === "BULLISH";
  const color = isBullish ? "var(--color-bullish)" : "var(--color-bearish)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--color-foreground)" }}>{name}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
          {reliability}%
        </span>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color,
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            padding: "1px 5px",
            borderRadius: "4px",
          }}
        >
          {type}
        </span>
      </div>
    </div>
  );
}

export function TokenAnalysisPanel() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("solana");
  const [interval, setInterval] = useState<"1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d">("1h");
  const [expanded, setExpanded] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);

  const mutation = useMutation({
    mutationFn: (vars: {
      address: string;
      chain: string;
      interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
    }) => assessTokenWithPatterns({ data: vars }),
  });

  const result = mutation.data as CandlestickAnalysisResult | undefined;
  const isLoading = mutation.isPending;
  const error = mutation.error;

  const handleAnalyze = () => {
    if (!address || address.length < 10) return;
    mutation.mutate({ address, chain, interval });
  };

  const patterns = result?.patternAnalysis?.patterns ?? [];
  const topPatterns = patterns.slice(0, 5);
  const hasMore = patterns.length > 5;

  return (
    <div style={{ ...card, padding: "16px", marginBottom: "12px" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: expanded ? "12px" : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3 className="size-4" style={{ color: "var(--color-bullish)" }} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
            }}
          >
            Token Analysis
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "var(--color-muted-foreground)",
              background: "var(--color-border)",
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            DR.DEX
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="size-4" style={{ color: "var(--color-muted-foreground)" }} />
        ) : (
          <ChevronDown className="size-4" style={{ color: "var(--color-muted-foreground)" }} />
        )}
      </button>

      {expanded && (
        <>
          {/* Input row */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Token address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: "120px",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
              }}
            />
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              style={{
                ...inputStyle,
                padding: "6px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {CHAINS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={interval}
              onChange={(e) =>
                setInterval(e.target.value as "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d")
              }
              style={{
                ...inputStyle,
                padding: "6px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !address || address.length < 10}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: isLoading || !address ? "var(--color-border)" : "var(--color-bullish)",
                color: isLoading || !address ? "var(--color-muted-foreground)" : "#000",
                fontSize: "12px",
                fontWeight: 700,
                cursor: isLoading || !address ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3" style={{ animation: "spin 1s linear infinite" }} />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "color-mix(in srgb, var(--color-bearish) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-bearish) 30%, transparent)",
                fontSize: "12px",
                color: "var(--color-bearish)",
                marginBottom: "8px",
              }}
            >
              <AlertTriangle className="size-3" style={{ display: "inline", marginRight: "6px" }} />
              {error instanceof Error ? error.message : "Analysis failed"}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Token info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "color-mix(in srgb, var(--color-foreground) 4%, transparent)",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{result.token.symbol}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-muted-foreground)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {result.token.name}
                  </div>
                </div>
                <BiasBadge bias={result.overallBias} />
              </div>

              {/* Security + Confidence row */}
              <div style={{ display: "flex", gap: "8px" }}>
                {/* Security */}
                <div
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: `1px solid color-mix(in srgb, ${
                      result.securityOk ? "var(--color-bullish)" : "var(--color-bearish)"
                    } 30%, transparent)`,
                    background: `color-mix(in srgb, ${
                      result.securityOk ? "var(--color-bullish)" : "var(--color-bearish)"
                    } 8%, transparent)`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {result.securityOk ? (
                      <ShieldCheck className="size-3" style={{ color: "var(--color-bullish)" }} />
                    ) : (
                      <ShieldAlert className="size-3" style={{ color: "var(--color-bearish)" }} />
                    )}
                    <span
                      style={{
                        ...labelStyle,
                        fontSize: "9px",
                        color: result.securityOk ? "var(--color-bullish)" : "var(--color-bearish)",
                      }}
                    >
                      SECURITY
                    </span>
                  </div>
                  {result.securityOk ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "var(--color-bullish)",
                      }}
                    >
                      <CheckCircle2 className="size-3" />
                      Passed
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        color: "var(--color-bearish)",
                        lineHeight: 1.4,
                      }}
                    >
                      {result.securityError ?? "Security scan failed"}
                    </p>
                  )}
                </div>

                {/* Pattern Stats */}
                <div
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "color-mix(in srgb, var(--color-foreground) 4%, transparent)",
                  }}
                >
                  <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>
                    PATTERNS
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--color-bullish)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {result.patternAnalysis.bullishCount}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      bullish
                    </span>
                    <span style={{ color: "var(--color-border)" }}>|</span>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--color-bearish)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {result.patternAnalysis.bearishCount}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      bearish
                    </span>
                  </div>
                </div>

                {/* Confidence */}
                <div
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "color-mix(in srgb, var(--color-foreground) 4%, transparent)",
                  }}
                >
                  <div style={{ ...labelStyle, fontSize: "9px", marginBottom: "4px" }}>
                    CONFIDENCE
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "var(--color-foreground)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {result.confidenceScore}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Governor Decision */}
              <GovernorBadge
                action={result.governorDecision.action}
                reason={result.governorDecision.reason}
              />

              {/* Pattern List */}
              {patterns.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPatterns(!showPatterns)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ ...labelStyle, fontSize: "10px" }}>
                      TOP PATTERNS ({patterns.length} total)
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                      {showPatterns ? "Hide" : `Show top ${topPatterns.length}`}
                    </span>
                  </button>

                  {showPatterns && (
                    <div style={{ marginTop: "4px" }}>
                      {topPatterns.map((p, i) => (
                        <PatternRow
                          key={i}
                          name={p.name}
                          type={p.type}
                          reliability={p.reliability}
                        />
                      ))}
                      {hasMore && (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "11px",
                            color: "var(--color-muted-foreground)",
                            textAlign: "center",
                          }}
                        >
                          +{patterns.length - 5} more patterns
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Binance status */}
              {!result.patternAnalysis.dataAvailable && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "var(--color-muted-foreground)",
                    fontStyle: "italic",
                  }}
                >
                  Binance data unavailable — showing security check only
                </p>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
