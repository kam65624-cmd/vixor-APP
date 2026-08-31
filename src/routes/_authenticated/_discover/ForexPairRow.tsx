// ── Forex Pair Row ──────────────────────────────────────────────────────────

import { withAlpha, blendWithCard } from "@/shared/color-utils";
import { GOLD_COLOR, GOLD_BG, GOLD_BORDER, fmtForexPrice, fmtPct } from "./constants";
import { SparklineSVG } from "./SparklineSVG";
import type { ForexPair } from "../-discover-forex-data";

export function ForexPairRow({ item, onClick }: { item: ForexPair; onClick: () => void }) {
  const changeVal = item.change24h ?? 0;
  const hasChange = item.change24h !== null;
  const isUp = hasChange && changeVal >= 0;
  const color = !hasChange
    ? "var(--color-muted-foreground)"
    : isUp
      ? "var(--color-bullish)"
      : "var(--color-bearish)";
  const isGold = item.type === "gold";
  const accentColor = isGold ? GOLD_COLOR : color;
  const badgeBg = isGold
    ? GOLD_BG
    : "color-mix(in srgb, var(--color-muted-foreground) 0.15%, transparent)";
  const badgeColor = isGold ? GOLD_COLOR : "var(--color-muted-foreground)";
  const hasSparkline = item.sparkline && item.sparkline.length >= 2;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background 0.12s",
        ...(isGold
          ? {
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 0.04%, transparent) 0%, transparent 60%)",
            }
          : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isGold
          ? "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 0.08%, transparent) 0%, var(--color-card-hover) 60%)"
          : "var(--color-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isGold
          ? "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 0.04%, transparent) 0%, transparent 60%)"
          : "transparent";
      }}
    >
      {/* Left: Pair info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: isGold ? "10px" : "50%",
            background: isGold ? GOLD_BG : blendWithCard(accentColor, 0.12),
            border: `1px solid ${isGold ? GOLD_BORDER : withAlpha(accentColor, 0.2)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isGold ? "14px" : "10px",
            fontWeight: 800,
            color: accentColor,
            flexShrink: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {isGold ? " Au " : item.pair.slice(0, 3)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: isGold ? GOLD_COLOR : "var(--color-foreground)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {isGold ? "Gold" : item.pair}
            </span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: "3px",
                background: badgeBg,
                color: badgeColor,
              }}
            >
              {item.badge}
            </span>
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "140px",
              marginTop: "1px",
            }}
          >
            {item.name}
          </div>
        </div>
      </div>

      {/* Center: Sparkline */}
      {hasSparkline && (
        <div style={{ flexShrink: 0, margin: "0 12px", opacity: 0.85 }}>
          <SparklineSVG data={item.sparkline!} color={isGold ? GOLD_COLOR : undefined} />
        </div>
      )}

      {/* Right: Price + Change + Volume */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: isGold ? GOLD_COLOR : "var(--color-foreground)",
          }}
        >
          {fmtForexPrice(item.price)}
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color,
          }}
        >
          {hasChange ? fmtPct(changeVal) : "—"}
        </span>
        <div
          style={{
            fontSize: "8px",
            color: "var(--color-muted-foreground)",
            marginTop: "2px",
          }}
        >
          OTC
        </div>
      </div>
    </div>
  );
}
