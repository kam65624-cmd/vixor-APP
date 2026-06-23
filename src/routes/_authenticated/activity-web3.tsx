import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/activity-web3")({
  head: () => ({ meta: [{ title: "Activity — Vixor" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <div style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: "2px solid rgba(16,185,129,0.15)" }}>
        <span style={{ fontSize: "36px" }}>\uD83D\uDD04</span>
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>On-Chain Activity</h1>
      <p style={{ fontSize: "13px", color: "#9CA3AF", textAlign: "center", maxWidth: "360px", lineHeight: 1.6, marginBottom: "24px" }}>
        View your on-chain transactions, swaps, transfers, and AI-driven activity across Solana with smart insights.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>COMING SOON</span>
        <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", background: "rgba(16,185,129,0.08)", color: "#34D399" }}>Requires: Wallet adapter</span>
      </div>
    </div>
  );
}