// ── Token Row Component ──────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { withAlpha, blendWithCard } from "@/shared/color-utils";
import type { LivePriceOverlay } from "@/shared/market-data/use-discover-live-prices";
import type { TokenItem } from "./constants";
import { fmtPrice, fmtPct, fmtCompact } from "./constants";
import { SparklineSVG } from "./SparklineSVG";
import { SmartMoneyBar } from "./SmartMoneyBar";
import { NewBadge } from "./NewBadge";

export function TokenRow({
  token,
  onClick,
  livePrice,
}: {
  token: TokenItem;
  onClick: () => void;
  livePrice?: LivePriceOverlay[string];
}) {
  // Use live price if available, otherwise fall back to API price
  const displayPrice = livePrice?.price ?? token.price;
  const displayChange = livePrice?.change24h ?? token.change24h;
  const isUp = (displayChange ?? 0) >= 0;
  const color = isUp ? "var(--color-bullish)" : "var(--color-bearish)";
  const [imgError, setImgError] = useState(false);
  const prevPriceRef = useRef<number | null>(null);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);

  // Flash effect when live price changes
  useEffect(() => {
    if (livePrice && prevPriceRef.current !== null && livePrice.price !== prevPriceRef.current) {
      const flash = livePrice.price > prevPriceRef.current ? "up" : "down";
      setPriceFlash(flash);
      const timer = setTimeout(() => setPriceFlash(null), 400);
      return () => clearTimeout(timer);
    }
    if (livePrice) prevPriceRef.current = livePrice.price;
  }, [livePrice]);
  const hasLogo = token.logoUrl && !imgError;
  const isNew = token.discoveryScore > 80;
  const hasSparkline = token.sparkline && token.sparkline.length >= 2;

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
        padding: "12px 14px",
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "color-mix(in srgb, var(--color-primary) 6%, transparent)";
        e.currentTarget.style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      {/* Left: Token info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: hasLogo ? "var(--color-card)" : blendWithCard(color, 0.15),
            border: `1.5px solid ${withAlpha(color, 0.3)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 800,
            color,
            flexShrink: 0,
            letterSpacing: "-0.02em",
            overflow: "hidden",
            boxShadow: `0 0 12px ${withAlpha(color, 0.15)}`,
          }}
        >
          {hasLogo ? (
            <img
              src={token.logoUrl}
              alt={token.symbol}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            token.symbol.slice(0, 2).toUpperCase()
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {token.symbol}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: "4px",
                background: "color-mix(in srgb, var(--color-muted-foreground) 0.12%, transparent)",
                color: "var(--color-muted-foreground)",
              }}
            >
              {token.chain}
            </span>
            {token.isHoneypot && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "color-mix(in srgb, var(--color-bearish) 15%, transparent)",
                  color: "var(--color-bearish)",
                }}
              >
                ⚠ HONEYPOT
              </span>
            )}
            {isNew && <NewBadge />}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-muted-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "150px",
              marginTop: "2px",
            }}
          >
            {token.name}
          </div>
          {/* Smart Money Bar */}
          {token.smartMoneyPct !== undefined && token.smartMoneyPct !== null && (
            <SmartMoneyBar pct={token.smartMoneyPct} />
          )}
        </div>
      </div>

      {/* Center: Sparkline */}
      {hasSparkline && (
        <div style={{ flexShrink: 0, margin: "0 12px", opacity: 0.85 }}>
          <SparklineSVG data={token.sparkline!} />
        </div>
      )}

      {/* Right: Price + Change + Volume */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-foreground)",
          }}
        >
          <span
            style={{
              color:
                priceFlash === "up"
                  ? "var(--color-bullish)"
                  : priceFlash === "down"
                    ? "var(--color-bearish)"
                    : "var(--color-foreground)",
              transition: "color 0.3s ease",
            }}
          >
            {fmtPrice(displayPrice)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: "flex-end",
            marginTop: "3px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color,
              background: `${color}18`,
              padding: "1px 6px",
              borderRadius: "4px",
            }}
          >
            {fmtPct(displayChange)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "flex-end",
            marginTop: "3px",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
            Vol {fmtCompact(token.volume24h)}
          </span>
          {token.marketCap > 0 && (
            <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
              MC {fmtCompact(token.marketCap)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
