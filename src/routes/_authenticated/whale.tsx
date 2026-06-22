import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/whale")({
  head: () => ({ meta: [{ title: "Whale Alerts — Vixor Terminal" }] }),
  component: WhalePage,
});

interface WhaleAlert {
  id: string;
  type: "transfer" | "buy" | "sell" | "lp_add" | "lp_remove";
  token: string;
  chain: string;
  amount: string;
  value: string;
  wallet: string;
  walletLabel: string;
  timestamp: string;
  impact: "high" | "medium" | "low";
}

const WHALE_ALERTS: WhaleAlert[] = [
  { id: "1", type: "buy", token: "WIF", chain: "Solana", amount: "500K", value: "$1.2M", wallet: "7xKXtg2...3nPB", walletLabel: "Whale #1", timestamp: "1m ago", impact: "high" },
  { id: "2", type: "sell", token: "GOAT", chain: "Solana", amount: "2.5M", value: "$1.1M", wallet: "4pHDkCK...8vW2", walletLabel: "Dex Trader", timestamp: "3m ago", impact: "high" },
  { id: "3", type: "transfer", token: "POPCAT", chain: "Solana", amount: "10M", value: "$12.3M", wallet: "Bn4TEvx...9kR3", walletLabel: "Top 10 Holder", timestamp: "7m ago", impact: "high" },
  { id: "4", type: "lp_add", token: "SPX", chain: "Solana", amount: "50K SOL", value: "$3.6M", wallet: "Dj8sN2m...4eLk", walletLabel: "MM Bot", timestamp: "12m ago", impact: "medium" },
  { id: "5", type: "buy", token: "BONK", chain: "Solana", amount: "50B", value: "$1.4M", wallet: "Hn2vE7c...6wPj", walletLabel: "Accumulator", timestamp: "15m ago", impact: "medium" },
  { id: "6", type: "sell", token: "MOG", chain: "Solana", amount: "5B", value: "$11.5K", wallet: "Kx9mN3d...7tRq", walletLabel: "Retail Whale", timestamp: "20m ago", impact: "low" },
  { id: "7", type: "lp_remove", token: "TURBO", chain: "Solana", amount: "20K SOL", value: "$1.5M", wallet: "Rt5wP8n...2sKl", walletLabel: "Dev Wallet", timestamp: "25m ago", impact: "high" },
  { id: "8", type: "buy", token: "FLOKI", chain: "Solana", amount: "200M", value: "$35.6K", wallet: "Ys2vD6m...9nBx", walletLabel: "New Whale", timestamp: "30m ago", impact: "low" },
];

function WhalePage() {
  return (
    <div  style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🐋</span>
          <h1 className="text-lg font-bold">Whale Alerts</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>
            ● LIVE
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Track large transactions and smart money moves in real-time</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 grid grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "24h Volume", value: "$2.3B", color: "#22C55E" },
          { label: "Whale Txns", value: "1,847", color: "#3B82F6" },
          { label: "Buys", value: "1,203", color: "#22C55E" },
          { label: "Sells", value: "644", color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="text-center px-2 py-1.5 rounded-lg" style={{ background: "#161b2e" }}>
            <div className="text-[9px]" style={{ color: "#4A5568" }}>{s.label}</div>
            <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alert List */}
      <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {WHALE_ALERTS.map((alert) => (
          <WhaleAlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}

const WhaleAlertCard = memo(function WhaleAlertCard({ alert }: { alert: WhaleAlert }) {
  const typeConfig = {
    buy: { emoji: "🟢", label: "BUY", color: "#22C55E" },
    sell: { emoji: "🔴", label: "SELL", color: "#EF4444" },
    transfer: { emoji: "📤", label: "TRANSFER", color: "#3B82F6" },
    lp_add: { emoji: "💧", label: "LP ADD", color: "#22C55E" },
    lp_remove: { emoji: "💨", label: "LP REMOVE", color: "#EF4444" },
  }[alert.type];

  const impactColors = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#4A5568",
  }[alert.impact];

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{ background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex-shrink-0 text-center" style={{ width: "50px" }}>
        <div className="text-lg">{typeConfig.emoji}</div>
        <div className="text-[8px] font-bold" style={{ color: typeConfig.color }}>{typeConfig.label}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold">{alert.token}</span>
          <span className="text-[9px]" style={{ color: "#7B8BA8" }}>{alert.chain}</span>
          <span
            className="text-[8px] px-1 rounded"
            style={{ background: `${impactColors}20`, color: impactColors }}
          >
            {alert.impact.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-mono" style={{ color: "#F0F4FC" }}>{alert.amount}</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: typeConfig.color }}>{alert.value}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px]" style={{ color: "#60A5FA" }}>{alert.walletLabel}</span>
          <span className="text-[8px] font-mono" style={{ color: "#4A5568" }}>{alert.wallet}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-[9px]" style={{ color: "#4A5568" }}>{alert.timestamp}</span>
      </div>
    </div>
  );
});
