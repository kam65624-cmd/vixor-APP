"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import type { DailyLoop } from "@/domains/daily-loop/types";
import { CARD_STYLE, SECTION_LABEL_STYLE } from "./constants";

export function StreakWidget({
  streak,
  history,
}: {
  streak:
    | { current_streak: number; longest_streak: number; last_completed_date: string | null }
    | null
    | undefined;
  history: DailyLoop[];
}) {
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;

  // Generate last 30 days heatmap
  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const loop = history.find((l) => l.date === dateStr);
      const completion = loop?.completion_percentage ?? 0;
      days.push({
        date: dateStr,
        day: d.toLocaleDateString([], { weekday: "short" }),
        completion,
      });
    }
    return days;
  }, [history]);

  return (
    <div style={{ ...CARD_STYLE, padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flame
            size={14}
            style={{
              color:
                currentStreak > 0 ? "var(--color-neutral-wait)" : "var(--color-muted-foreground)",
            }}
          />
          <span style={SECTION_LABEL_STYLE}>Streak</span>
        </div>
        {currentStreak > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-neutral-wait)" }}>
            🔥 {currentStreak} day{currentStreak !== 1 ? "s" : ""} in a row!
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-foreground)",
            }}
          >
            {currentStreak}
          </div>
          <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9 }}>Current</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-bullish)",
            }}
          >
            {longestStreak}
          </div>
          <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9 }}>Longest</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-bullish)",
            }}
          >
            {history.filter((l) => l.completion_percentage >= 100).length}
          </div>
          <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9 }}>Completed</div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9, marginBottom: 8 }}>Last 30 Days</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 4,
          }}
        >
          {heatmapDays.map((day) => {
            const bg =
              day.completion >= 100
                ? "var(--color-bullish)"
                : day.completion >= 66
                  ? `${"var(--color-bullish)"}99`
                  : day.completion >= 33
                    ? `${"var(--color-bullish)"}4D`
                    : "color-mix(in srgb, var(--color-foreground) 5%, transparent)";
            return (
              <div
                key={day.date}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: bg,
                }}
                title={`${day.date}: ${day.completion}%`}
              />
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 8, color: "var(--color-muted-foreground)" }}>Less</span>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: "color-mix(in srgb, var(--color-foreground) 5%, transparent)",
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: `${"var(--color-bullish)"}4D`,
            }}
          />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: `${"var(--color-bullish)"}99`,
            }}
          />
          <div
            style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-bullish)" }}
          />
          <span style={{ fontSize: 8, color: "var(--color-muted-foreground)" }}>More</span>
        </div>
      </div>
    </div>
  );
}
