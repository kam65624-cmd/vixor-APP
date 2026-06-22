import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/vision")({
  head: () => ({ meta: [{ title: "Vision — Vixor" }] }),
  component: VisionPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  badge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: "rgba(59,130,246,0.15)", color: "#60A5FA", letterSpacing: "0.05em", textTransform: "uppercase" as const },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" },
  card: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px" },
  cardLabel: { fontSize: "10px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "8px" },
  cardValue: { fontSize: "28px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  cardSub: { fontSize: "11px", color: "#7B8BA8", marginTop: "4px" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  summaryCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "20px" },
  summaryText: { fontSize: "13px", lineHeight: 1.7, color: "#7B8BA8" },
  tableWrap: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "20px" },
  tableHeader: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "12px", transition: "background 0.15s" },
  colSector: { width: "130px", fontWeight: 600 },
  colChange: { width: "100px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
  colVolume: { width: "100px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colTrend: { width: "80px", textAlign: "right" as const },
  eventsCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px" },
  eventItem: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  eventDot: { width: "8px", height: "8px", borderRadius: "50%", marginTop: "4px", flexShrink: 0 },
  eventTitle: { fontSize: "12px", fontWeight: 600, color: "#F0F4FC" },
  eventMeta: { fontSize: "10px", color: "#7B8BA8", marginTop: "2px" },
  gaugeContainer: { display: "flex", alignItems: "center", gap: "12px" },
  gaugeBar: { width: "100%", height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)" },
  gaugeFill: { height: "100%", borderRadius: "4px" },
};

const overviewCards = [
  { label: "Fear & Greed Index", value: "72", sub: "Greed", color: "#22C55E", bgColor: "rgba(34,197,94,0.15)", pct: 72 },
  { label: "Market Momentum", value: "Bullish", sub: "+12.4% weekly", color: "#22C55E", bgColor: "rgba(34,197,94,0.15)", pct: 78 },
  { label: "Solana TVL", value: "$4.8B", sub: "+$340M this week", color: "#3B82F6", bgColor: "rgba(59,130,246,0.15)", pct: 65 },
  { label: "Active Wallets", value: "1.2M", sub: "+18% from last week", color: "#F59E0B", bgColor: "rgba(245,158,11,0.15)", pct: 82 },
];

const sectors = [
  { sector: "Meme Coins", change: "+24.7%", volume: "$2.1B", trend: "🔥 Hot", trendColor: "#EF4444", changeColor: "#22C55E" },
  { sector: "AI Tokens", change: "+18.3%", volume: "$890M", trend: "↑ Rising", trendColor: "#22C55E", changeColor: "#22C55E" },
  { sector: "DeFi", change: "+5.2%", volume: "$3.4B", trend: "→ Stable", trendColor: "#F59E0B", changeColor: "#22C55E" },
  { sector: "Gaming", change: "-3.1%", volume: "$420M", trend: "↓ Cooling", trendColor: "#EF4444", changeColor: "#EF4444" },
  { sector: "NFTs", change: "-8.5%", volume: "$180M", trend: "❄️ Cold", trendColor: "#60A5FA", changeColor: "#EF4444" },
];

const events = [
  { title: "WIF Staking Launch", meta: "Tomorrow, 14:00 UTC · Expected TVL: $50M+", color: "#3B82F6" },
  { title: "BONK Season 3 Airdrop", meta: "Jan 28 · 2.5B tokens to eligible holders", color: "#22C55E" },
  { title: "JUP Governance Vote #12", meta: "Jan 27 · Fee structure proposal", color: "#F59E0B" },
  { title: "POPCAT x Raydium LP Incentives", meta: "Jan 29 · 500K RAY rewards pool", color: "#3B82F6" },
  { title: "TENSOR NFT Marketplace v3", meta: "Feb 1 · New listing mechanics", color: "#60A5FA" },
  { title: "SOL ETF Decision Window", meta: "Feb 5–15 · Expected positive catalyst", color: "#22C55E" },
];

const OverviewCard = memo(function OverviewCard({ item }: { item: typeof overviewCards[0] }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{item.label}</div>
      <div style={{ ...S.cardValue, color: item.color }}>{item.value}</div>
      <div style={S.cardSub}>{item.sub}</div>
      <div style={{ ...S.gaugeContainer, marginTop: "10px" }}>
        <div style={S.gaugeBar}>
          <div style={{ ...S.gaugeFill, width: `${item.pct}%`, background: item.color }} />
        </div>
      </div>
    </div>
  );
});

const SectorRow = memo(function SectorRow({ item }: { item: typeof sectors[0] }) {
  return (
    <div style={S.tableRow}>
      <div style={S.colSector}>{item.sector}</div>
      <div style={{ ...S.colChange, color: item.changeColor }}>{item.change}</div>
      <div style={S.colVolume}>{item.volume}</div>
      <div style={{ ...S.colTrend, color: item.trendColor, fontSize: "11px", fontWeight: 600 }}>{item.trend}</div>
    </div>
  );
});

const EventItem = memo(function EventItem({ item }: { item: typeof events[0] }) {
  return (
    <div style={S.eventItem}>
      <div style={{ ...S.eventDot, background: item.color }} />
      <div style={{ flex: 1 }}>
        <div style={S.eventTitle}>{item.title}</div>
        <div style={S.eventMeta}>{item.meta}</div>
      </div>
    </div>
  );
});

function VisionPage() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Vision</h1>
        <span style={S.badge}>AI Analysis</span>
      </div>
      <p style={S.subtitle}>AI-powered market analysis &amp; sentiment overview for Solana ecosystem</p>

      <div style={S.grid}>
        {overviewCards.map((c) => (
          <OverviewCard key={c.label} item={c} />
        ))}
      </div>

      <div style={S.summaryCard}>
        <div style={{ ...S.sectionTitle, marginBottom: "12px" }}>AI Market Summary</div>
        <p style={S.summaryText}>
          The Solana ecosystem is experiencing strong bullish momentum driven by meme coin mania and increasing institutional interest. 
          WIF and BONK continue to lead volume on DEXs, while AI-related tokens are seeing renewed attention following the launch of 
          several on-chain AI agents. Network activity is at a 6-month high with 1.2M active wallets. The Fear &amp; Greed index at 72 
          indicates greed territory, suggesting potential short-term consolidation before the next leg up. Key catalysts include the 
          upcoming WIF staking launch and SOL ETF decision window in early February. DeFi TVL continues to recover with Raydium and 
          Meteora capturing significant liquidity. Gaming and NFT sectors remain under pressure but show early signs of bottoming.
        </p>
      </div>

      <div style={{ ...S.sectionTitle }}>Sector Rotation</div>
      <div style={S.tableWrap}>
        <div style={S.tableHeader}>
          <div style={S.colSector}>Sector</div>
          <div style={{ ...S.colChange, color: "#4A5568" }}>24h Change</div>
          <div style={{ ...S.colVolume, color: "#4A5568" }}>Volume</div>
          <div style={{ ...S.colTrend, color: "#4A5568" }}>Trend</div>
        </div>
        {sectors.map((s) => (
          <SectorRow key={s.sector} item={s} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Upcoming Events</div>
      <div style={S.eventsCard}>
        {events.map((e) => (
          <EventItem key={e.title} item={e} />
        ))}
      </div>
    </div>
  );
}