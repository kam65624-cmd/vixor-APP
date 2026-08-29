// ── Toggle Switch ─────────────────────────────────────────────────────────────
export function ToggleSwitch({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        cursor: "pointer",
        background: enabled ? "var(--color-bullish)" : "var(--color-border)",
        position: "relative",
        transition: "background var(--transition-normal)",
        flexShrink: 0,
        boxShadow: enabled ? "0 0 8px rgba(46,204,113,0.3)" : "none",
        border: "none",
        padding: 0,
      }}
    >
      <span
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "var(--color-foreground)",
          position: "absolute",
          top: "2px",
          left: enabled ? "22px" : "2px",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}
