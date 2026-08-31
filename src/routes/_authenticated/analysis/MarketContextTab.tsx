import { BarChart2, Activity, TrendingUp } from "lucide-react";
import { CARD, MONO } from "./constants";

interface MarketContextTabProps {
  a: any;
}

export function MarketContextTab({ a }: MarketContextTabProps) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ margin: "0 16px" }}
    >
      {a.key_levels && (
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
            <BarChart2 size={16} style={{ color: "var(--color-bullish)" }} /> Key SMC Levels
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Resistance / BSL */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-bearish)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Resistance / BSL
              </span>
              {((a.key_levels as any).resistance || []).map((l: number, i: number) => (
                <div
                  key={i}
                  style={{
                    background: "color-mix(in srgb, var(--color-bearish) 5%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--color-bearish) 20%, transparent)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    ...MONO,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "color-mix(in srgb, var(--color-bearish) 90%, transparent)",
                  }}
                >
                  {l.toLocaleString()}
                </div>
              ))}
            </div>
            {/* Support / SSL */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-bullish)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Support / SSL
              </span>
              {((a.key_levels as any).support || []).map((l: number, i: number) => (
                <div
                  key={i}
                  style={{
                    background: "color-mix(in srgb, var(--color-bullish) 5%, transparent)",
                    border: "1px solid var(--bullish-border)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    ...MONO,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "color-mix(in srgb, var(--color-bullish) 90%, transparent)",
                  }}
                >
                  {l.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {a.liquidity_zones && (
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
            <Activity size={16} style={{ color: "var(--color-bullish)" }} /> Liquidity Pools
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {((a.liquidity_zones as any).buySide || []).map((l: number, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "color-mix(in srgb, var(--color-bullish) 5%, transparent)",
                  border: "1px solid var(--bullish-border)",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-bullish)",
                    textTransform: "uppercase",
                  }}
                >
                  Buy-Side Liquidity (BSL)
                </span>
                <span style={{ ...MONO, fontWeight: 700, color: "var(--color-bullish)" }}>
                  {l.toLocaleString()}
                </span>
              </div>
            ))}
            {((a.liquidity_zones as any).sellSide || []).map((l: number, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "color-mix(in srgb, var(--color-bearish) 5%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-bearish) 20%, transparent)",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-bearish)",
                    textTransform: "uppercase",
                  }}
                >
                  Sell-Side Liquidity (SSL)
                </span>
                <span style={{ ...MONO, fontWeight: 700, color: "var(--color-bearish)" }}>
                  {l.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {a.market_structure && (
        <div style={{ ...CARD, padding: "20px" }}>
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
            <TrendingUp size={16} style={{ color: "var(--color-bullish)" }} /> Market Structure
            (SMC)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Direction", value: (a.market_structure as any).direction },
              { label: "Structure", value: (a.market_structure as any).structure },
              ...(a.invalidation_level
                ? [
                    {
                      label: "⚠ Invalidation Level",
                      value: a.invalidation_level.toLocaleString(),
                      danger: true,
                    },
                  ]
                : []),
              ...((a.market_structure as any).bos
                ? [
                    {
                      label: "BOS Level",
                      value: (a.market_structure as any).bos?.toLocaleString(),
                    },
                  ]
                : []),
            ].map(({ label, value, danger }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid",
                  background: danger
                    ? "color-mix(in srgb, var(--color-bearish) 10%, transparent)"
                    : "var(--color-card)",
                  borderColor: danger
                    ? "color-mix(in srgb, var(--color-bearish) 30%, transparent)"
                    : "var(--color-border)",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: danger ? "var(--color-bearish)" : "var(--color-muted-foreground)",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    ...MONO,
                    fontWeight: 700,
                    color: danger ? "var(--color-bearish)" : "var(--color-foreground)",
                  }}
                >
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
