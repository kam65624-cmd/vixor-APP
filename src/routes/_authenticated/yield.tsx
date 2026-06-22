import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/yield")({
  head: () => ({ meta: [{ title: "Yield — Vixor" }] }),
  component: YieldPage,
});

function YieldPage() {
  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: "2px solid rgba(34,197,94,0.15)" }}>
        <span style={{ fontSize: "36px" }}>\uD83C\uDF51</span>
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Yield Farming</h1>
      <p style={{ fontSize: "13px", color: "#7B8BA8", textAlign: "center", maxWidth: "360px", lineHeight: 1.6, marginBottom: "24px" }}>
        Earn yield on your Solana assets. Browse LP pools across Raydium, Orca, Meteora, and Kamino with APY tracking and position management.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>COMING SOON</span>
        <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", background: "rgba(34,197,94,0.08)", color: "#22C55E" }}>Requires: yield_positions table</span>
      </div>
    </div>
  );
}