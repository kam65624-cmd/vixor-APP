import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo } from "react";

export const Route = createFileRoute("/_authenticated/whale")({
  head: () => ({ meta: [{ title: "Whale Alerts — Vixor" }] }),
  component: WhalePage,
});

function WhalePage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(59,130,246,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: "2px solid rgba(59,130,246,0.15)" }}>
        <span style={{ fontSize: "36px" }}>\uD83D\uDC0B</span>
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Whale Alerts</h1>
      <p style={{ fontSize: "13px", color: "#7B8BA8", textAlign: "center", maxWidth: "360px", lineHeight: 1.6, marginBottom: "24px" }}>
        Real-time whale transaction monitoring across Solana DEXs. Track large transfers, smart money movements, and whale accumulation patterns.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>COMING SOON</span>
        <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", background: "rgba(59,130,246,0.08)", color: "#60A5FA" }}>Requires: whale_alerts table</span>
      </div>
      <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxWidth: "400px" }}>
        {[
          { icon: "\uD83D\uDCCA", label: "24h Volume", value: "—" },
          { icon: "\uD83D\uDC0B", label: "Whale Txns", value: "—" },
          { icon: "\uD83D\uDD25", label: "Alerts", value: "—" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#161b2e", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "18px" }}>{s.icon}</span>
            <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: "monospace", marginTop: "4px" }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "#4A5568", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}