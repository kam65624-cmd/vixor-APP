import type { SettingItem } from "./constants";

// ── Setting Row ───────────────────────────────────────────────────────────────
export function SettingRow({ item, children }: { item: SettingItem; children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
      }}
    >
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600 }}>{item.label}</div>
        <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)", marginTop: "2px" }}>
          {item.desc}
        </div>
      </div>
      {children}
    </div>
  );
}
