import { useState } from "react";
import type { RadarBlip } from "./server-fn";
import { RadarPulse } from "./RadarPulse";
import { timeAgo } from "./helpers";

function BlipCard({ blip }: { blip: RadarBlip }) {
  const isFresh = Date.now() - blip.timestamp.getTime() < 5 * 60_000;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "color-mix(in srgb, var(--color-primary) 4%, transparent)"
          : "var(--color-card)",
        border: `1px solid ${hovered ? blip.color + "40" : "var(--color-border)"}`,
        borderLeft: `3px solid ${blip.color}`,
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "all var(--transition-base)",
        position: "relative" as const,
        overflow: "hidden",
      }}
    >
      {/* Scan-line overlay for fresh blips */}
      {isFresh && (
        <div
          style={{
            position: "absolute" as const,
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: `linear-gradient(180deg, transparent 0%, ${blip.color}08 50%, transparent 100%)`,
            animation: "radar-scanline 2s ease-in-out infinite",
            pointerEvents: "none" as const,
          }}
        />
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RadarPulse active={isFresh} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
            {blip.icon} {blip.title}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap" as const,
          }}
        >
          {timeAgo(blip.timestamp)}
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)", paddingLeft: 14 }}
      >
        {blip.subtitle}
      </div>

      {/* Detail */}
      <div
        style={{
          fontSize: 11,
          color: "var(--color-muted-foreground)",
          fontFamily: "var(--font-mono)",
          paddingLeft: 14,
        }}
      >
        {blip.detail}
      </div>

      {/* Type badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingLeft: 14 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 3,
            background: `${blip.color}18`,
            color: blip.color,
            letterSpacing: "0.05em",
            textTransform: "uppercase" as const,
          }}
        >
          {blip.type.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

export { BlipCard };
