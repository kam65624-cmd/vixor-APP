import { CheckCircle, BarChart2, Target } from "lucide-react";
import { CARD, LABEL, MONO } from "./constants";
import type { Scenario } from "./constants";
import { highlightSMC } from "./utils";

interface TradeSetupTabProps {
  a: any;
  scenarios: {
    conservative: Scenario;
    balanced: Scenario;
    aggressive: Scenario;
  } | null;
  reasoningTrail: Array<{
    claim: string;
    sourceField: string;
  }> | null;
}

export function TradeSetupTab({ a, scenarios, reasoningTrail }: TradeSetupTabProps) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ margin: "0 16px" }}
    >
      <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-muted-foreground)",
            marginBottom: "16px",
          }}
        >
          <Target size={16} style={{ color: "var(--color-bullish)" }} /> Why This Trade
        </h3>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {(a.reasons ?? []).map((r: string, i: number) => (
            <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px" }}>
              <CheckCircle
                size={16}
                style={{ color: "var(--color-bullish)", flexShrink: 0, marginTop: "2px" }}
              />
              <span style={{ fontWeight: 500, color: "var(--color-foreground)" }}>
                {highlightSMC(r)}
              </span>
            </li>
          ))}
        </ul>

        {/* ── Reasoning Trail (grounded analysis v2) ── */}
        {reasoningTrail && reasoningTrail.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-muted-foreground)",
                marginBottom: "10px",
                marginLeft: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <BarChart2 size={14} /> Data Reasoning Trail
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {reasoningTrail.map((r, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontSize: "13px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "color-mix(in srgb, var(--color-primary) 4%, transparent)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "color-mix(in srgb, var(--color-info) 15%, transparent)",
                      color: "var(--color-info)",
                      fontWeight: 600,
                      flexShrink: 0,
                      marginTop: "1px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.sourceField}
                  </span>
                  <span
                    style={{
                      color: "color-mix(in srgb, var(--color-foreground) 85%, transparent)",
                    }}
                  >
                    {r.claim}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {scenarios && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-muted-foreground)",
              marginLeft: "4px",
            }}
          >
            Execution Scenarios
          </h3>
          {[
            {
              label: "Conservative",
              s: scenarios.conservative,
              color: "var(--color-info)",
              border: "var(--color-info)",
              bg: "color-mix(in srgb, var(--color-primary) 5%, transparent)",
            },
            {
              label: "Balanced ✦",
              s: scenarios.balanced,
              color: "var(--color-bullish)",
              border: "var(--color-bullish)",
              bg: "color-mix(in srgb, var(--color-bullish) 5%, transparent)",
              glow: true,
            },
            {
              label: "Aggressive",
              s: scenarios.aggressive,
              color: "var(--color-neutral-wait)",
              border: "var(--color-neutral-wait)",
              bg: "color-mix(in srgb, var(--color-neutral-wait) 5%, transparent)",
            },
          ].map(({ label, s, color, border, bg, glow }) => (
            <div
              key={label}
              style={{
                ...CARD,
                padding: "16px",
                borderLeft: `4px solid ${border}`,
                background: bg,
                boxShadow: glow
                  ? "0 0 20px color-mix(in srgb, var(--color-bullish) 12%, transparent)"
                  : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-muted-foreground)",
                      background: "var(--color-muted)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    PROB: {s.probability}%
                  </span>
                </div>
                <span
                  style={{
                    ...MONO,
                    fontSize: "14px",
                    fontWeight: 800,
                    background: "var(--color-card)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: `1px solid ${"var(--color-border)"}`,
                    color: "var(--color-foreground)",
                  }}
                >
                  R:R {s.rr}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {/* Entry */}
                <div
                  style={{
                    background: "var(--color-card)",
                    padding: "10px",
                    borderRadius: "12px",
                    border: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <div style={{ ...LABEL, marginBottom: "4px" }}>Entry</div>
                  <div
                    style={{
                      ...MONO,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {s.entry}
                  </div>
                </div>
                {/* SL */}
                <div
                  style={{
                    background: "color-mix(in srgb, var(--color-bearish) 5%, transparent)",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid color-mix(in srgb, var(--color-bearish) 20%, transparent)",
                  }}
                >
                  <div
                    style={{
                      ...LABEL,
                      color: "var(--color-bearish)",
                      marginBottom: "4px",
                    }}
                  >
                    SL
                  </div>
                  <div
                    style={{
                      ...MONO,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-bearish)",
                    }}
                  >
                    {s.sl?.toLocaleString()}
                  </div>
                </div>
                {/* TP */}
                <div
                  style={{
                    background: "color-mix(in srgb, var(--color-bullish) 5%, transparent)",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid var(--bullish-border)",
                  }}
                >
                  <div
                    style={{
                      ...LABEL,
                      color: "var(--color-bullish)",
                      marginBottom: "4px",
                    }}
                  >
                    TP
                  </div>
                  <div
                    style={{
                      ...MONO,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-bullish)",
                    }}
                  >
                    {s.tp2?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
