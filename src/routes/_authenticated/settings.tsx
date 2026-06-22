import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});

interface ToggleSetting {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
}

function SettingsPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    priceAlerts: true,
    whaleAlerts: true,
    signalNotifications: true,
    tradeConfirmations: true,
    soundEnabled: false,
    darkMode: true,
    compactMode: false,
    showChartOnHover: true,
    autoRefresh: true,
    twoFactor: false,
  });

  const toggle = (id: string) => setToggles((prev) => ({ ...prev, [id]: !prev[id] }));

  const sections: { title: string; items: { type: "toggle"; id: string; label: string; desc: string } | { type: "select"; label: string; desc: string; options: string[]; current: number } | { type: "button"; label: string; desc: string; btnText: string; btnColor: string } }[] }[] = [
    {
      title: "Trading",
      items: [
        { type: "select", label: "Default Slippage", desc: "Maximum slippage tolerance for trades", options: ["0.5%", "1.0%", "2.0%", "3.0%"], current: 1 },
        { type: "select", label: "Default Chain", desc: "Blockchain for trading", options: ["Solana", "Ethereum", "Base", "Arbitrum"], current: 0 },
        { type: "toggle", id: "tradeConfirmations", label: "Trade Confirmations", desc: "Show confirmation dialog before executing trades" },
        { type: "toggle", id: "autoRefresh", label: "Auto Refresh Data", desc: "Automatically refresh token prices and data" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { type: "toggle", id: "priceAlerts", label: "Price Alerts", desc: "Get notified when tokens hit your price targets" },
        { type: "toggle", id: "whaleAlerts", label: "Whale Alerts", desc: "Large transaction notifications" },
        { type: "toggle", id: "signalNotifications", label: "AI Signal Alerts", desc: "New AI trading signal notifications" },
        { type: "toggle", id: "soundEnabled", label: "Sound Effects", desc: "Play sounds for notifications and alerts" },
      ],
    },
    {
      title: "Display",
      items: [
        { type: "toggle", id: "darkMode", label: "Dark Mode", desc: "Use dark theme (recommended for trading)" },
        { type: "toggle", id: "compactMode", label: "Compact Mode", desc: "Reduce spacing for more data density" },
        { type: "toggle", id: "showChartOnHover", label: "Chart on Hover", desc: "Show mini chart when hovering over tokens" },
      ],
    },
    {
      title: "Security & Account",
      items: [
        { type: "toggle", id: "twoFactor", label: "Two-Factor Auth", desc: "Add an extra layer of security to your account" },
        { type: "button", label: "Change Password", desc: "Update your account password", btnText: "Change", btnColor: "#3B82F6" },
        { type: "button", label: "Export Data", desc: "Download your trading history and portfolio data", btnText: "Export", btnColor: "#22C55E" },
        { type: "button", label: "Delete Account", desc: "Permanently delete your account and all data", btnText: "Delete", btnColor: "#EF4444" },
      ],
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#9881;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Settings</span>
        </div>
      </div>

      <div style={{ padding: "8px 12px", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#7B8BA8", padding: "6px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {section.title}
            </div>
            <div style={{ background: "#161b2e", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              {section.items.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: i < section.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: "9px", color: "#7B8BA8", marginTop: "2px" }}>{item.desc}</div>
                  </div>
                  {item.type === "toggle" ? (
                    <div onClick={() => toggle(item.id)} style={{
                      width: "36px", height: "20px", borderRadius: "10px", cursor: "pointer",
                      background: toggles[item.id] ? "#3B82F6" : "rgba(255,255,255,0.1)",
                      position: "relative", transition: "background 0.2s", flexShrink: 0,
                    }}>
                      <div style={{
                        width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                        position: "absolute", top: "2px",
                        left: toggles[item.id] ? "18px" : "2px",
                        transition: "left 0.2s",
                      }} />
                    </div>
                  ) : item.type === "select" ? (
                    <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                      {item.options.map((opt, oi) => (
                        <button key={opt} style={{
                          fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
                          color: oi === item.current ? "#fff" : "#7B8BA8",
                          background: oi === item.current ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                        }}>{opt}</button>
                      ))}
                    </div>
                  ) : (
                    <button style={{
                      fontSize: "10px", fontWeight: 600, padding: "4px 12px", borderRadius: "4px", border: "none",
                      background: `${item.btnColor}20`, color: item.btnColor, cursor: "pointer",
                    }}>{item.btnText}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}