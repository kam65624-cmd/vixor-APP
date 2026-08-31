import { useState, useEffect } from "react";

export function ForexSessionIndicator() {
  const [now, setNow] = useState(() => {
    const d = new Date();
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNow(d.getUTCHours() * 60 + d.getUTCMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const sessions = [
    { name: "Tokyo", start: 0, end: 540, color: "var(--color-gold)" },
    { name: "London", start: 480, end: 1020, color: "var(--color-primary)" },
    { name: "New York", start: 780, end: 1320, color: "var(--color-bullish)" },
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      {sessions.map((s) => {
        const isActive = now >= s.start && now < s.end;
        const minsUntil = now < s.start ? s.start - now : now >= s.end ? 1440 - now + s.start : 0;
        const status = isActive ? "active" : minsUntil <= 120 ? "upcoming" : "closed";
        const dotColor =
          status === "active"
            ? s.color
            : status === "upcoming"
              ? "var(--color-gold)"
              : "var(--color-muted-foreground)";
        return (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 600,
              color:
                status === "active" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: dotColor,
                boxShadow: status === "active" ? `0 0 6px ${dotColor}` : "none",
                flexShrink: 0,
              }}
            />
            {s.name}
            {status === "active" && (
              <span style={{ color: s.color, fontSize: "10px" }}>(LIVE)</span>
            )}
            {status === "upcoming" && (
              <span style={{ fontSize: "10px" }}>({Math.floor(minsUntil / 60)}h)</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
