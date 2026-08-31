import type { TokenItem } from "./constants";
import { fmtCompact } from "./constants";
import { MetricCard, MetricCardLabel } from "./TokenMetrics";

export function CryptoSections({ tokenData }: { tokenData: TokenItem | null }) {
  // Simulated on-chain data (labeled as estimated)
  const volume = tokenData?.volume24h ?? 0;
  const dexVol = Math.round(volume * 0.62);
  const cexVol = Math.round(volume * 0.38);
  const holderCount = tokenData?.marketCap ? Math.round(tokenData.marketCap * 0.001 + 500) : 0;
  const whaleTxCount = Math.max(1, Math.round(volume / 5000000));

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
        ⛓️ On-Chain Metrics{" "}
        <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(est.)</span>
      </div>

      {/* Holder Count */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <MetricCard>
          <MetricCardLabel>Holders</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--color-foreground)",
              }}
            >
              {holderCount.toLocaleString()}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>DEX Vol</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--color-primary)",
              }}
            >
              {fmtCompact(dexVol)}
            </span>
          </div>
        </MetricCard>
        <MetricCard>
          <MetricCardLabel>CEX Vol</MetricCardLabel>
          <div style={{ marginTop: "6px" }}>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: "var(--color-gold)",
              }}
            >
              {fmtCompact(cexVol)}
            </span>
          </div>
        </MetricCard>
      </div>

      {/* DEX vs CEX comparison bar */}
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            marginBottom: "4px",
          }}
        >
          <span>DEX {volume > 0 ? Math.round((dexVol / volume) * 100) : 0}%</span>
          <span>CEX {volume > 0 ? Math.round((cexVol / volume) * 100) : 0}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            borderRadius: "4px",
            background: "var(--color-background)",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${volume > 0 ? (dexVol / volume) * 100 : 50}%`,
              height: "100%",
              background: "var(--color-primary)",
            }}
          />
          <div
            style={{
              width: `${volume > 0 ? (cexVol / volume) * 100 : 50}%`,
              height: "100%",
              background: "var(--color-gold)",
            }}
          />
        </div>
      </div>

      {/* Whale Activity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "var(--color-background)",
          border: `1px solid var(--color-border)`,
        }}
      >
        <span style={{ fontSize: "16px" }}>🐋</span>
        <div>
          <div
            style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
          >
            Whale Activity (24h)
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
              marginTop: "2px",
            }}
          >
            {whaleTxCount} large tx{whaleTxCount !== 1 ? "s" : ""} detected
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-muted-foreground)",
                marginLeft: "6px",
              }}
            >
              (simulated)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
