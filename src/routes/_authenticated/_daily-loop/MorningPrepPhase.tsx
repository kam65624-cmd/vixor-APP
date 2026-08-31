"use client";

import { useState, useCallback } from "react";
import { Sun, CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { DailyLoop, MarketBias } from "@/domains/daily-loop/types";
import { ExpandableWidget } from "@/components/vixor/ExpandableWidget";
import {
  CARD_STYLE,
  GRADIENT_BTN_STYLE,
  INPUT_STYLE,
  TEXTAREA_STYLE,
  LABEL_STYLE,
  SECTION_LABEL_STYLE,
  biasColors,
} from "./constants";

export function MorningPrepPhase({
  loop,
  isCompleted,
  isSaving,
  onSubmit,
}: {
  loop: DailyLoop | undefined;
  isCompleted: boolean;
  isSaving: boolean;
  onSubmit: (data: {
    market_bias: MarketBias;
    key_levels: string;
    watchlist_reviewed: boolean;
  }) => void;
}) {
  const [bias, setBias] = useState<MarketBias>((loop?.market_bias as MarketBias) ?? "neutral");
  const [keyLevels, setKeyLevels] = useState(loop?.key_levels ?? "");
  const [watchlistReviewed, setWatchlistReviewed] = useState(loop?.watchlist_reviewed ?? false);

  const handleSubmit = useCallback(() => {
    if (!loop) return;
    onSubmit({ market_bias: bias, key_levels: keyLevels, watchlist_reviewed: watchlistReviewed });
  }, [loop, bias, keyLevels, watchlistReviewed, onSubmit]);

  return (
    <ExpandableWidget
      title="Morning Prep"
      subtitle={isCompleted ? "Completed ✓" : "Set your daily bias & levels"}
      icon={Sun}
      variant={isCompleted ? "bullish" : "info"}
      defaultExpanded={!isCompleted}
      badge={isCompleted ? "DONE" : undefined}
    >
      {isCompleted ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={SECTION_LABEL_STYLE}>Market Bias:</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                border: `1px solid ${biasColors(loop?.market_bias).border}`,
                background: biasColors(loop?.market_bias).bg,
                color: biasColors(loop?.market_bias).text,
              }}
            >
              {loop?.market_bias === "bullish"
                ? "📈 Bullish"
                : loop?.market_bias === "bearish"
                  ? "📉 Bearish"
                  : "↔️ Neutral"}
            </span>
          </div>
          {loop?.key_levels && (
            <div>
              <span style={{ ...LABEL_STYLE, marginBottom: 4 }}>Key Levels</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {loop.key_levels}
              </p>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={12} style={{ color: "var(--color-bullish)" }} />
            <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
              Watchlist {loop?.watchlist_reviewed ? "reviewed" : "not reviewed"}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Market Bias */}
          <div>
            <label style={LABEL_STYLE}>Market Bias</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {(
                [
                  { value: "bullish" as MarketBias, emoji: "📈", label: "Bullish" },
                  { value: "bearish" as MarketBias, emoji: "📉", label: "Bearish" },
                  { value: "neutral" as MarketBias, emoji: "↔️", label: "Neutral" },
                ] as const
              ).map((opt) => {
                const colors = biasColors(opt.value);
                const isSelected = bias === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setBias(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? colors.border : "var(--color-border)"}`,
                      fontSize: 12,
                      fontWeight: 700,
                      background: isSelected ? colors.bg : "var(--color-card)",
                      color: isSelected ? colors.text : "var(--color-muted-foreground)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Levels */}
          <div>
            <label style={LABEL_STYLE}>Key Support / Resistance Levels</label>
            <textarea
              value={keyLevels}
              onChange={(e) => setKeyLevels(e.target.value)}
              placeholder="e.g. S: 1.0850, 1.0820 | R: 1.0900, 1.0940"
              style={TEXTAREA_STYLE}
            />
          </div>

          {/* Watchlist Reviewed */}
          <button
            type="button"
            onClick={() => setWatchlistReviewed(!watchlistReviewed)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {watchlistReviewed ? (
              <CheckCircle2 size={14} style={{ color: "var(--color-bullish)" }} />
            ) : (
              <Circle size={14} style={{ color: "var(--color-muted-foreground)" }} />
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: watchlistReviewed ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              }}
            >
              Watchlist Reviewed
            </span>
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              ...GRADIENT_BTN_STYLE,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              transition: "transform 0.15s ease",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            {isSaving ? (
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sun size={12} />
            )}
            Complete Morning Prep
          </button>
        </div>
      )}
    </ExpandableWidget>
  );
}
