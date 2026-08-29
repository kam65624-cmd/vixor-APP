function RadarPulse({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--color-bullish)",
        marginRight: 6,
        position: "relative" as const,
        flexShrink: 0,
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute" as const,
            inset: -3,
            borderRadius: "50%",
            border: "1.5px solid var(--color-bullish)",
            animation: "radar-pulse 1.5s ease-out infinite",
          }}
        />
      )}
    </span>
  );
}

export { RadarPulse };
