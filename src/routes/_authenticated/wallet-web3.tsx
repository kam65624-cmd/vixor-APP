import { createFileRoute } from "@tanstack/react-router";
import { memo, useState, useCallback } from "react";

export const Route = createFileRoute("/_authenticated/wallet-web3")({
  head: () => ({ meta: [{ title: "Wallet — Vixor" }] }),
  component: WalletPage,
});

const TOKEN_BALANCES = [
  { symbol: "SOL", name: "Solana", balance: "12.45", value: "$2,243.50", change: "+3.2%", up: true, icon: "◎" },
  { symbol: "WIF", name: "dogwifhat", balance: "2,500", value: "$6,125.00", change: "+16.7%", up: true, icon: "🐕" },
  { symbol: "POPCAT", name: "Popcat", balance: "8,000", value: "$9,840.00", change: "+29.5%", up: true, icon: "🐱" },
  { symbol: "BONK", name: "Bonk", balance: "150M", value: "$4,335.00", change: "-5.2%", up: false, icon: "🐕" },
  { symbol: "USDC", name: "USD Coin", balance: "850.00", value: "$850.00", change: "0.0%", up: true, icon: "$" },
  { symbol: "JUP", name: "Jupiter", balance: "320", value: "$1,088.00", change: "+4.1%", up: true, icon: "🪐" },
  { symbol: "RAY", name: "Raydium", balance: "150", value: "$245.00", change: "+7.8%", up: true, icon: "☀️" },
];

const RECENT_TXNS = [
  { type: "swap", desc: "Swapped 2 SOL → 8,000 POPCAT", time: "5m ago", amount: "-2 SOL", color: "#3B82F6" },
  { type: "receive", desc: "Received 0.5 SOL from 7xKX...3nPB", time: "2h ago", amount: "+0.5 SOL", color: "#22C55E" },
  { type: "send", desc: "Sent 500 WIF to 4pHD...8vW2", time: "5h ago", amount: "-500 WIF", color: "#EF4444" },
  { type: "buy", desc: "Bought 2,500 WIF on Raydium", time: "8h ago", amount: "-5.25 SOL", color: "#3B82F6" },
  { type: "sell", desc: "Sold 5B GOAT on Jupiter", time: "12h ago", amount: "+0.82 SOL", color: "#22C55E" },
  { type: "stake", desc: "Staked 5 SOL to Marinade", time: "1d ago", amount: "-5 SOL", color: "#F59E0B" },
];

function WalletPage() {
  const [copied, setCopied] = useState(false);
  const walletAddr = "7xKXtg2CWmF...3nPB";

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText("7xKXtg2CWmFxx...3nPB");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>&#128179;</span>
            <span style={{ fontSize: "16px", fontWeight: 800 }}>Wallet</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8", background: "#161b2e", padding: "4px 8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
              {walletAddr}
            </span>
            <button onClick={handleCopy} style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)", color: "#60A5FA", cursor: "pointer", fontWeight: 600 }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* SOL Balance Card */}
      <div style={{ margin: "10px 12px", padding: "16px", borderRadius: "10px", background: "linear-gradient(135deg, #161b2e 0%, #1a2035 100%)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <div style={{ fontSize: "10px", color: "#7B8BA8", marginBottom: "4px" }}>SOL Balance</div>
        <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", color: "#F0F4FC" }}>12.45 SOL</div>
        <div style={{ fontSize: "14px", color: "#22C55E", fontFamily: "monospace", fontWeight: 600, marginTop: "4px" }}>$2,243.50</div>
        <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          <button style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: "#22C55E", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Deposit</button>
          <button style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: "#EF4444", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Withdraw</button>
          <button style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)", color: "#60A5FA", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Swap</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", padding: "0 12px 10px" }}>
        {[
          { label: "Buy Token", icon: "&#128176;", color: "#22C55E" },
          { label: "Bridge", icon: "&#127760;", color: "#3B82F6" },
          { label: "Stake", icon: "&#128200;", color: "#F59E0B" },
          { label: "History", icon: "&#128197;", color: "#8B5CF6" },
        ].map((a) => (
          <div key={a.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 4px", borderRadius: "6px", background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <span style={{ fontSize: "18px" }} dangerouslySetInnerHTML={{ __html: a.icon }} />
            <span style={{ fontSize: "9px", color: "#7B8BA8", fontWeight: 500 }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Token Balances */}
      <div style={{ padding: "0 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700 }}>Token Balances</span>
          <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700 }}>$24,726.50</span>
        </div>
        {TOKEN_BALANCES.map((t) => (
          <div key={t.symbol} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                {t.icon}
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700 }}>{t.symbol}</div>
                <div style={{ fontSize: "9px", color: "#4A5568" }}>{t.balance} {t.name}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>{t.value}</div>
              <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 600, color: t.up ? "#22C55E" : "#EF4444" }}>{t.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: "11px", fontWeight: 700 }}>Recent Transactions</span>
        </div>
        {RECENT_TXNS.map((tx, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${tx.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: tx.color }}>
                {tx.type.toUpperCase().slice(0, 3)}
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#F0F4FC" }}>{tx.desc}</div>
                <div style={{ fontSize: "9px", color: "#4A5568" }}>{tx.time}</div>
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "monospace", color: tx.color }}>{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}