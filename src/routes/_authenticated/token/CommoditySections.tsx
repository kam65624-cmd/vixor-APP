import type { TokenItem } from "./constants";
import { fmtPrice } from "./constants";
import { MetricCard, MetricCardLabel } from "./TokenMetrics";

export function CommoditySections({
  tokenData,
  symbol,
}: {
  tokenData: TokenItem | null;
  symbol: string;
}) {
  const s = symbol.toUpperCase();
  const price = tokenData?.price ?? 0;

  // Determine correlation target based on symbol
  const correlationTarget =
    s.includes("XAU") || s.includes("GOLD")
      ? "DXY"
      : s.includes("XAG") || s.includes("SILVER")
        ? "XAU"
        : "US10Y";
  const correlationValue =
    s.includes("XAU") || s.includes("GOLD") ? -0.87 : s.includes("XAG") ? 0.92 : -0.45;

  // Simulated key levels based on price
  const resistance = price > 0 ? +(price * 1.035).toFixed(2) : 0;
  const support = price > 0 ? +(price * 0.965).toFixed(2) : 0;
  const pivot = price > 0 ? +(price * 1.0).toFixed(2) : 0;

  // Determine session
  const hour = new Date().getUTCHours();
  const session =
    hour >= 0 && hour < 6
      ? "Asian Session"
      : hour >= 6 && hour < 14
        ? "London Session"
        : hour >= 14 && hour < 21
          ? "New York Session"
          : "After-Hours (Low Liquidity)";

  const sessionColor = hour >= 6 && hour < 21 ? "var(--color-bullish)" : "var(--color-bearish)";

  return (
    <div
      style={{
        padding: "16px",
        borderBottom: `1px solid var(--color-border)`,
        background: "var(--color-card)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "14px",
        }}
      >
        🏭 Commodity Insights
      </div>

      {/* Current Session */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--color-background)",
          border: `1px solid var(--color-border)`,
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "14px" }}>🕐</span>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            Current Session
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: sessionColor, marginTop: "2px" }}>
            {session}
          </div>
        </div>
      </div>

      {/* Correlation Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--color-background)",
          border: `1px solid var(--color-border)`,
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "14px" }}>🔗</span>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            Correlation <span style={{ fontSize: "9px", opacity: 0.6 }}>(est.)</span>
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              marginTop: "2px",
              color: "var(--color-foreground)",
            }}
          >
            {s} ↔ {correlationTarget}:{" "}
            <span
              style={{
                color: correlationValue < 0 ? "var(--color-bearish)" : "var(--color-bullish)",
              }}
            >
              {correlationValue > 0 ? "+" : ""}
              {correlationValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Key Levels */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        Key Levels <span style={{ fontSize: "9px", opacity: 0.6, fontWeight: 500 }}>(est.)</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
        }}
      >
        <MetricCard>
          <MetricCardLabel>Resistance</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--color-bearish)",
              }}
            >
              {resistance > 0 ? fmtPrice(resistance) : "—"}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>Pivot</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--color-primary)",
              }}
            >
              {pivot > 0 ? fmtPrice(pivot) : "—"}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>Support</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--color-bullish)",
              }}
            >
              {support > 0 ? fmtPrice(support) : "—"}
            </span>
          </div>
        </MetricCard>
      </div>
    </div>
  );
}
