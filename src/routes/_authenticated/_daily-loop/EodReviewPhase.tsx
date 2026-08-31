"use client";

import { useState, useCallback } from "react";
import { Moon, Lightbulb, Brain, Loader2 } from "lucide-react";
import type { DailyLoop, EmotionalState } from "@/domains/daily-loop/types";
import { ExpandableWidget } from "@/components/vixor/ExpandableWidget";
import {
  GRADIENT_BTN_STYLE,
  INPUT_STYLE,
  TEXTAREA_STYLE,
  LABEL_STYLE,
  SECTION_LABEL_STYLE,
  EMOTIONAL_STATES,
} from "./constants";

// ═══════════════════════════════════════════════
// PHASE 3: EOD REVIEW
// ═══════════════════════════════════════════════

export function EodReviewPhase({
  loop,
  isCompleted,
  isSaving,
  onSubmit,
}: {
  loop: DailyLoop | undefined;
  isCompleted: boolean;
  isSaving: boolean;
  onSubmit: (data: {
    emotional_state: EmotionalState;
    lessons_learned: string;
    tomorrow_plan: string;
    daily_pnl?: number | null;
    trades_taken?: number;
    rules_followed?: number;
    rules_broken?: number;
  }) => void;
}) {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(
    loop?.emotional_state ?? "calm",
  );
  const [lessons, setLessons] = useState(loop?.lessons_learned ?? "");
  const [tomorrowPlan, setTomorrowPlan] = useState(loop?.tomorrow_plan ?? "");
  const [dailyPnl, setDailyPnl] = useState(loop?.daily_pnl?.toString() ?? "");
  const [tradesTaken, setTradesTaken] = useState(loop?.trades_taken?.toString() ?? "0");
  const [rulesFollowed, setRulesFollowed] = useState(loop?.rules_followed?.toString() ?? "0");
  const [rulesBroken, setRulesBroken] = useState(loop?.rules_broken?.toString() ?? "0");

  const handleSubmit = useCallback(() => {
    onSubmit({
      emotional_state: emotionalState,
      lessons_learned: lessons,
      tomorrow_plan: tomorrowPlan,
      daily_pnl: dailyPnl ? parseFloat(dailyPnl) : null,
      trades_taken: parseInt(tradesTaken) || 0,
      rules_followed: parseInt(rulesFollowed) || 0,
      rules_broken: parseInt(rulesBroken) || 0,
    });
  }, [
    emotionalState,
    lessons,
    tomorrowPlan,
    dailyPnl,
    tradesTaken,
    rulesFollowed,
    rulesBroken,
    onSubmit,
  ]);

  return (
    <ExpandableWidget
      title="End of Day Review"
      subtitle={isCompleted ? "Completed ✓" : "Reflect on your trading day"}
      icon={Moon}
      variant={isCompleted ? "bullish" : "neutral"}
      defaultExpanded={!isCompleted}
      badge={isCompleted ? "DONE" : undefined}
    >
      {isCompleted ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loop?.daily_pnl != null && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={SECTION_LABEL_STYLE}>Daily P&L</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: loop.daily_pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                }}
              >
                {loop.daily_pnl >= 0 ? "+" : ""}${Number(loop.daily_pnl).toFixed(2)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              textAlign: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-foreground)",
                }}
              >
                {loop?.trades_taken ?? 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-muted-foreground)" }}>Trades</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-bullish)",
                }}
              >
                {loop?.rules_followed ?? 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-muted-foreground)" }}>Rules ✓</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-bearish)",
                }}
              >
                {loop?.rules_broken ?? 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-muted-foreground)" }}>Rules ✗</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={SECTION_LABEL_STYLE}>Mood:</span>
            <span style={{ fontSize: 12, color: "var(--color-foreground)" }}>
              {EMOTIONAL_STATES.find((e) => e.value === loop?.emotional_state)?.emoji}{" "}
              {EMOTIONAL_STATES.find((e) => e.value === loop?.emotional_state)?.label}
            </span>
          </div>
          {loop?.lessons_learned && (
            <div>
              <span style={{ ...LABEL_STYLE, marginBottom: 4 }}>Lessons</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {loop.lessons_learned}
              </p>
            </div>
          )}
          {loop?.tomorrow_plan && (
            <div>
              <span style={{ ...LABEL_STYLE, marginBottom: 4 }}>Tomorrow&apos;s Plan</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {loop.tomorrow_plan}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Daily P&L */}
          <div>
            <label style={LABEL_STYLE}>Daily P&L</label>
            <input
              type="number"
              step="0.01"
              value={dailyPnl}
              onChange={(e) => setDailyPnl(e.target.value)}
              placeholder="0.00"
              style={{ ...INPUT_STYLE, fontFamily: "var(--font-mono)" }}
            />
          </div>

          {/* Trades / Rules */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            <div>
              <label style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>Trades</label>
              <input
                type="number"
                min="0"
                value={tradesTaken}
                onChange={(e) => setTradesTaken(e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>Rules ✓</label>
              <input
                type="number"
                min="0"
                value={rulesFollowed}
                onChange={(e) => setRulesFollowed(e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-bullish)",
                }}
              />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>Rules ✗</label>
              <input
                type="number"
                min="0"
                value={rulesBroken}
                onChange={(e) => setRulesBroken(e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-bearish)",
                }}
              />
            </div>
          </div>

          {/* Emotional State */}
          <div>
            <label style={LABEL_STYLE}>How are you feeling?</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {EMOTIONAL_STATES.map((state) => {
                const isSelected = emotionalState === state.value;
                return (
                  <button
                    key={state.value}
                    onClick={() => setEmotionalState(state.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? state.color.border : "var(--color-border)"}`,
                      fontSize: 10,
                      fontWeight: 700,
                      background: isSelected ? state.color.bg : "var(--color-card)",
                      color: isSelected ? state.color.text : "var(--color-muted-foreground)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span>{state.emoji}</span>
                    {state.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lessons Learned */}
          <div>
            <label style={LABEL_STYLE}>
              <Lightbulb
                size={10}
                style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}
              />
              Lessons Learned
            </label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What did you learn today?"
              style={TEXTAREA_STYLE}
            />
          </div>

          {/* Tomorrow's Plan */}
          <div>
            <label style={LABEL_STYLE}>
              <Brain
                size={10}
                style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}
              />
              Tomorrow&apos;s Plan
            </label>
            <textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="What will you focus on tomorrow?"
              style={TEXTAREA_STYLE}
            />
          </div>

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
              <Moon size={12} />
            )}
            Complete EOD Review
          </button>
        </div>
      )}
    </ExpandableWidget>
  );
}
