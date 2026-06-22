import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/communities")({
  head: () => ({ meta: [{ title: "Communities — Vixor" }] }),
  component: CommunitiesPage,
});

const COMMUNITIES = [
  { name: "WIF Army", members: "124K", posts: "2.4K", sentiment: 82, active: "5m ago", growing: true, icon: "🐕", desc: "dogwifhat holders & traders" },
  { name: "Bonk Nation", members: "98K", posts: "1.8K", sentiment: 65, active: "12m ago", growing: true, icon: "🐕", desc: "The original Solana dog coin" },
  { name: "POPCAT Fam", members: "87K", posts: "1.5K", sentiment: 91, active: "2m ago", growing: true, icon: "🐱", desc: "Popcat community - to the moon" },
  { name: "SPX Degens", members: "45K", posts: "890", sentiment: 73, active: "8m ago", growing: false, icon: "📊", desc: "SPX6900 chart traders" },
  { name: "Solana Meme OGs", members: "210K", posts: "3.2K", sentiment: 58, active: "1m ago", growing: true, icon: "⚡", desc: "Original Solana meme traders" },
  { name: "GOAT Watch", members: "34K", posts: "620", sentiment: 32, active: "25m ago", growing: false, icon: "🐐", desc: "GOAT token analysis & discussion" },
  { name: "New Token Hunters", members: "156K", posts: "4.1K", sentiment: 78, active: "30s ago", growing: true, icon: "🔍", desc: "Early discovery of new launches" },
  { name: "Whale Watchers", members: "67K", posts: "1.1K", sentiment: 70, active: "3m ago", growing: true, icon: "🐋", desc: "Tracking smart money movements" },
];

function CommunitiesPage() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Trending", "New", "My Communities"] as const;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#128101;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Communities</span>
          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontWeight: 600, animation: "pulse 2s infinite" }}>&#9679; LIVE</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Active Communities", value: "1,247", color: "#3B82F6" },
          { label: "Members Online", value: "45.2K", color: "#22C55E" },
          { label: "Posts Today", value: "8,934", color: "#F59E0B" },
          { label: "Sentiment", value: "72% Bullish", color: "#22C55E" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#161b2e", borderRadius: "6px", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "9px", color: "#4A5568" }}>{s.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: s.color, marginTop: "2px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "4px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: "10px", fontWeight: 600, padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer",
            color: filter === f ? "#fff" : "#7B8BA8",
            background: filter === f ? "rgba(59,130,246,0.15)" : "transparent",
            borderBottom: filter === f ? "2px solid #3B82F6" : "2px solid transparent",
          }}>{f}</button>
        ))}
      </div>

      {/* Community List */}
      <div style={{ padding: "4px 8px" }}>
        {COMMUNITIES.map((c) => (
          <CommunityCard key={c.name} community={c} />
        ))}
      </div>
    </div>
  );
}

const CommunityCard = memo(function CommunityCard({ community: c }: { community: typeof COMMUNITIES[0] }) {
  const sentColor = c.sentiment >= 70 ? "#22C55E" : c.sentiment >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "10px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", borderRadius: "6px",
      transition: "background 0.1s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
        {c.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>{c.name}</span>
          {c.growing && <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 4px", borderRadius: "3px", background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>&#9650; GROWING</span>}
        </div>
        <div style={{ fontSize: "10px", color: "#7B8BA8", marginTop: "2px" }}>{c.desc}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          <span style={{ fontSize: "9px", color: "#4A5568" }}>{c.members} members</span>
          <span style={{ fontSize: "9px", color: "#4A5568" }}>{c.posts} posts</span>
          <span style={{ fontSize: "9px", color: "#4A5568" }}>Active {c.active}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "9px", color: "#4A5568", marginBottom: "2px" }}>Sentiment</div>
        <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: sentColor }}>{c.sentiment}%</div>
        <div style={{ width: "60px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", marginTop: "3px" }}>
          <div style={{ width: `${c.sentiment}%`, height: "100%", borderRadius: "2px", background: sentColor }} />
        </div>
      </div>
    </div>
  );
});