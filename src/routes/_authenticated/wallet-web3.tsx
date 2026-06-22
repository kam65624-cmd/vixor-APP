import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/wallet-web3")({
  head: () => ({ meta: [{ title: "Wallet — Vixor" }] }),
  component: WalletPage,
});

function WalletPage() {
  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(59,130,246,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: "2px solid rgba(59,130,246,0.15)" }}>
        <span style={{ fontSize: "36px" }}>\uD83D\uDC5B</span>
      </div>
      <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Web3 Wallet</h1>
      <p style={{ fontSize: "13px", color: "#7B8BA8", textAlign: "center", maxWidth: "360px", lineHeight: 1.6, marginBottom: "24px" }}>
        Connect your Solana wallet to view token balances, transaction history, and manage your on-chain assets directly from Vixor.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>COMING SOON</span>
        <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", background: "rgba(59,130,246,0.08)", color: "#60A5FA" }}>Requires: Wallet adapter</span>
      </div>
    </div>
  );
}