import type { RadarBlip } from "./server-fn";
import { RadarPulse } from "./RadarPulse";
import { timeAgo } from "./helpers";

function AlertsLogEntry({ blip, index }: { blip: RadarBlip; index: number }) {
  const isFresh = Date.now() - blip.timestamp.getTime() < 5 * 60_000;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid color-mix(in srgb, var(--color-primary) 4%, transparent)",
        background:
          index % 2 === 0
            ? "var(--color-card)"
            : "color-mix(in srgb, var(--color-primary) 2%, transparent)",
        transition: "background 0.1s ease",
      }}
    >
      {/* Timestamp */}
      <span
        style={{
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--color-muted-foreground)",
          minWidth: 48,
          flexShrink: 0,
        }}
      >
        {timeAgo(blip.timestamp)}
      </span>

      {/* Pulse + Icon */}
      <RadarPulse active={isFresh} />
      <span style={{ fontSize: 14, flexShrink: 0 }}>{blip.icon}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-foreground)",
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {blip.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {blip.subtitle} — {blip.detail}
        </div>
      </div>

      {/* Color indicator */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: blip.color,
          flexShrink: 0,
        }}
      />
    </div>
  );
}

export { AlertsLogEntry };
