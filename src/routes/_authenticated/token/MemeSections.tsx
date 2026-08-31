import type { TokenItem } from "./constants";
import { fmtCompact } from "./constants";
import { GaugeBar } from "./GaugeBar";

export function MemeSections({ tokenData }: { tokenData: TokenItem | null }) {
  const socialScore = tokenData?.socialScore ?? 0;
  const volume = tokenData?.volume24h ?? 0;
  const smartMoneyPct = tokenData?.smartMoneyPct ?? 0;
  const liquidity = tokenData?.liquidity ?? 0;
  const isHoneypot = tokenData?.isHoneypot ?? false;

  // Calculate hype level from social + volume
  const hypeRaw = Math.min(
    Math.round(socialScore * 0.6 + Math.min(volume / 100000, 40) * 0.4),
    100,
  );
  const hypeLevel =
    hypeRaw >= 80
      ? { label: "FRENZY", color: "var(--color-bearish)" }
      : hypeRaw >= 60
        ? { label: "HIGH", color: "#F7931A" }
        : hypeRaw >= 40
          ? { label: "MODERATE", color: "var(--color-gold)" }
          : hypeRaw >= 20
            ? { label: "LOW", color: "var(--color-primary)" }
            : { label: "DORMANT", color: "var(--color-muted-foreground)" };

  return (
    <>
      {/* Community Sentiment */}
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
          🐕 Community Sentiment
        </div>

        {/* Social Score Bar */}
        <GaugeBar
          value={socialScore}
          color={
            socialScore >= 60
              ? "var(--color-bullish)"
              : socialScore >= 30
                ? "var(--color-gold)"
                : "var(--color-bearish)"
          }
          label="Social Score"
        />

        {/* Hype Level */}
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}
            >
              Hype Level
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: hypeLevel.color,
              }}
            >
              {hypeLevel.label} ({hypeRaw})
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              background: "var(--color-background)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${hypeRaw}%`,
                height: "100%",
                borderRadius: "3px",
                background: `linear-gradient(90deg, var(--color-primary), ${hypeLevel.color})`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Smart Money Gauge */}
        <div style={{ marginTop: "14px" }}>
          <GaugeBar
            value={smartMoneyPct}
            color={
              smartMoneyPct >= 50
                ? "var(--color-bullish)"
                : smartMoneyPct >= 25
                  ? "var(--color-gold)"
                  : "var(--color-bearish)"
            }
            label="Smart Money % (est.)"
          />
        </div>
      </div>

      {/* Risk Flags */}
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
            marginBottom: "12px",
          }}
        >
          ⚠️ Risk Flags
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {isHoneypot && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "var(--bearish-bg)",
                border: `1px solid color-mix(in srgb, var(--color-bearish) 25%, transparent)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>🚫</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-bearish)" }}>
                  HONEYPOT DETECTED
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
                  You may not be able to sell this token
                </div>
              </div>
            </div>
          )}

          {liquidity > 0 && liquidity < 50000 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "color-mix(in srgb, var(--color-gold) 0.12%, transparent)",
                border: `1px solid color-mix(in srgb, var(--color-gold) 0.25%, transparent)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>💧</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-gold)" }}>
                  LOW LIQUIDITY
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
                  Only {fmtCompact(liquidity)} — high slippage risk
                </div>
              </div>
            </div>
          )}

          {!isHoneypot && liquidity >= 50000 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "var(--bullish-bg)",
                border: `1px solid var(--bullish-border)`,
              }}
            >
              <span style={{ fontSize: "14px" }}>✓</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-bullish)" }}>
                  NO MAJOR FLAGS
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
                  Always DYOR before trading meme tokens
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
