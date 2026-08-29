// ── Filter Panel ──────────────────────────────────────────────────────────────

import type { CSSProperties } from "react";
import { SlidersHorizontal, ChevronUp } from "lucide-react";

export function FilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  isOpen,
  onToggle,
}: {
  filters: {
    minLiquidity: string;
    minVolume: string;
    honeypotOnly: boolean;
    smartMoneyMin: number;
  };
  onChange: (key: string, value: string | number | boolean) => void;
  onApply: () => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const inputStyle: CSSProperties = {
    flex: 1,
    background: "var(--color-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    padding: "7px 10px",
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    color: "var(--color-foreground)",
    outline: "none",
    minWidth: 0,
  };

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Filter toggle button */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "10px",
          fontWeight: 600,
          padding: "5px 10px",
          borderRadius: "5px",
          border: "1px solid var(--color-border)",
          cursor: "pointer",
          background: isOpen ? "var(--color-primary)" : "var(--color-card)",
          color: isOpen ? "var(--primary-foreground)" : "var(--color-muted-foreground)",
          transition: "all var(--transition-fast)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <SlidersHorizontal size={11} />
        Filters
        <ChevronUp
          size={11}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
        {(filters.minLiquidity ||
          filters.minVolume ||
          filters.honeypotOnly ||
          filters.smartMoneyMin > 0) && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isOpen ? "var(--color-primary)" : "var(--color-bullish)",
            }}
          />
        )}
      </button>

      {/* Expandable panel */}
      {isOpen && (
        <div
          style={{
            marginTop: "6px",
            padding: "10px 12px",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Row 1: Min Liquidity + Min Volume */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Min Liquidity ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={filters.minLiquidity}
                onChange={(e) => onChange("minLiquidity", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Min Volume ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={filters.minVolume}
                onChange={(e) => onChange("minVolume", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row 2: Honeypot toggle + Smart Money slider */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            {/* Honeypot Only toggle */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "block",
                  marginBottom: "4px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Honeypot Only
              </label>
              <button
                onClick={() => onChange("honeypotOnly", !filters.honeypotOnly)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${filters.honeypotOnly ? "var(--color-bearish)" : "var(--color-border)"}`,
                  background: filters.honeypotOnly
                    ? "color-mix(in srgb, var(--color-bearish) 15%, transparent)"
                    : "var(--color-card)",
                  color: filters.honeypotOnly
                    ? "var(--color-bearish)"
                    : "var(--color-muted-foreground)",
                  fontSize: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all var(--transition-fast)",
                }}
              >
                {filters.honeypotOnly ? "ON" : "OFF"}
              </button>
            </div>

            {/* Smart Money slider */}
            <div style={{ flex: 2 }}>
              <label
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "var(--color-muted-foreground)",
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span>Smart Money &gt;</span>
                <span
                  style={{
                    color: "var(--color-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {filters.smartMoneyMin}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.smartMoneyMin}
                onChange={(e) => onChange("smartMoneyMin", parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  height: "4px",
                  WebkitAppearance: "none",
                  appearance: "none",
                  background: `linear-gradient(to right, var(--color-bullish) 0%, var(--color-bullish) ${filters.smartMoneyMin}%, var(--color-border) ${filters.smartMoneyMin}%, var(--color-border) 100%)`,
                  borderRadius: "2px",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button
              onClick={onReset}
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "5px",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                background: "transparent",
                color: "var(--color-muted-foreground)",
                fontFamily: "var(--font-sans)",
                transition: "all 0.12s ease",
              }}
            >
              Reset
            </button>
            <button
              onClick={onApply}
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "6px 18px",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                background: "var(--color-primary)",
                color: "var(--primary-foreground)",
                fontFamily: "var(--font-sans)",
                transition: "all 0.12s ease",
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
