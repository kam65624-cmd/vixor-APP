import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/yield")({
  head: () => ({ meta: [{ title: "Yield — Vixor" }] }),
  component: YieldPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  badge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: "rgba(34,197,94,0.15)", color: "#22C55E", letterSpacing: "0.05em", textTransform: "uppercase" as const },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  earnedCard: { background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)", borderRadius: "14px", border: "1px solid rgba(34,197,94,0.15)", padding: "20px", marginBottom: "24px" },
  earnedLabel: { fontSize: "11px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  earnedValue: { fontSize: "36px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#22C55E", margin: "4px 0" },
  earnedSub: { fontSize: "11px", color: "#7B8BA8" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  card: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" },
  tableHeader: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" },
  tableRowHover: { background: "#1e2438" },
  colProtocol: { width: "140px" },
  colPair: { width: "110px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
  colApy: { width: "80px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 700 },
  colDeposited: { width: "100px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colEarned: { width: "90px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colIL: { width: "90px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colTvl: { width: "90px", textAlign: "right" as const, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colRisk: { width: "60px", textAlign: "right" as const },
  colAction: { width: "80px", textAlign: "right" as const },
  protocolName: { fontSize: "12px", fontWeight: 600, color: "#F0F4FC" },
  protocolSub: { fontSize: "10px", color: "#7B8BA8" },
  btn: { fontSize: "11px", fontWeight: 600, padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer" },
  riskBadge: { fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" },
  statCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", textAlign: "center" as const },
  statLabel: { fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "6px" },
  statValue: { fontSize: "20px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
};

const activePositions = [
  { protocol: "Raydium", sub: "CLMM", pair: "SOL/WIF", apy: "45.2%", deposited: "$2,400", earned: "$187.30", il: "-$12.40" },
  { protocol: "Orca", sub: "Whirlpool", pair: "SOL/POPCAT", apy: "67.8%", deposited: "$1,800", earned: "$245.60", il: "-$34.20" },
  { protocol: "Meteora", sub: "DLMM", pair: "SOL/BONK", apy: "23.1%", deposited: "$3,200", earned: "$98.40", il: "-$8.10" },
  { protocol: "Raydium", sub: "Stable AMM", pair: "USDC/USDT", apy: "8.5%", deposited: "$5,000", earned: "$106.20", il: "$0.00" },
  { protocol: "Kamino", sub: "Vault", pair: "SOL/JTO", apy: "31.4%", deposited: "$1,500", earned: "$123.80", il: "-$22.60" },
];

const availablePools = [
  { protocol: "Raydium", sub: "CLMM", pair: "JUP/SOL", apy: "52.3%", tvl: "$8.2M", risk: "Medium", riskColor: "#F59E0B" },
  { protocol: "Meteora", sub: "DLMM", pair: "WIF/SOL", apy: "38.7%", tvl: "$14.5M", risk: "Low", riskColor: "#22C55E" },
  { protocol: "Orca", sub: "Whirlpool", pair: "BONK/SOL", apy: "28.4%", tvl: "$6.8M", risk: "Low", riskColor: "#22C55E" },
  { protocol: "Raydium", sub: "CLMM", pair: "TENSOR/SOL", apy: "74.1%", tvl: "$2.1M", risk: "High", riskColor: "#EF4444" },
  { protocol: "Kamino", sub: "Vault", pair: "RAY/SOL", apy: "19.6%", tvl: "$22.3M", risk: "Low", riskColor: "#22C55E" },
];

const ActivePositionRow = memo(function ActivePositionRow({ item }: { item: typeof activePositions[0] }) {
  return (
    <div style={S.tableRow}>
      <div style={S.colProtocol}>
        <div style={S.protocolName}>{item.protocol}</div>
        <div style={S.protocolSub}>{item.sub}</div>
      </div>
      <div style={S.colPair}>{item.pair}</div>
      <div style={{ ...S.colApy, color: "#22C55E" }}>{item.apy}</div>
      <div style={S.colDeposited}>{item.deposited}</div>
      <div style={{ ...S.colEarned, color: "#22C55E" }}>+{item.earned}</div>
      <div style={{ ...S.colIL, color: item.il === "$0.00" ? "#7B8BA8" : "#EF4444" }}>{item.il}</div>
    </div>
  );
});

const AvailablePoolRow = memo(function AvailablePoolRow({ item }: { item: typeof availablePools[0] }) {
  return (
    <div style={S.tableRow}>
      <div style={S.colProtocol}>
        <div style={S.protocolName}>{item.protocol}</div>
        <div style={S.protocolSub}>{item.sub}</div>
      </div>
      <div style={S.colPair}>{item.pair}</div>
      <div style={{ ...S.colApy, color: "#22C55E" }}>{item.apy}</div>
      <div style={S.colTvl}>{item.tvl}</div>
      <div style={S.colRisk}>
        <span style={{ ...S.riskBadge, background: `${item.riskColor}18`, color: item.riskColor }}>{item.risk}</span>
      </div>
      <div style={S.colAction}>
        <button style={{ ...S.btn, background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>Join</button>
      </div>
    </div>
  );
});

function YieldPage() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Yield</h1>
        <span style={S.badge}>Earn</span>
      </div>
      <p style={S.subtitle}>Maximize returns across Solana DeFi protocols</p>

      <div style={S.earnedCard}>
        <div style={S.earnedLabel}>Total Earned</div>
        <div style={S.earnedValue}>$1,247.50</div>
        <div style={S.earnedSub}>+$186.40 this week · Across 5 active positions</div>
      </div>

      <div style={S.statsGrid}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Active Positions</div>
          <div style={{ ...S.statValue, color: "#3B82F6" }}>5</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Total Deposited</div>
          <div style={{ ...S.statValue, color: "#F0F4FC" }}>$13,900</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Avg. APY</div>
          <div style={{ ...S.statValue, color: "#22C55E" }}>35.2%</div>
        </div>
      </div>

      <div style={{ ...S.sectionTitle }}>Active Positions</div>
      <div style={{ ...S.card, marginBottom: "24px" }}>
        <div style={S.tableHeader}>
          <div style={{ ...S.colProtocol, color: "#4A5568" }}>Protocol</div>
          <div style={{ ...S.colPair, color: "#4A5568" }}>Pair</div>
          <div style={{ ...S.colApy, color: "#4A5568" }}>APY</div>
          <div style={{ ...S.colDeposited, color: "#4A5568" }}>Deposited</div>
          <div style={{ ...S.colEarned, color: "#4A5568" }}>Earned</div>
          <div style={{ ...S.colIL, color: "#4A5568" }}>Imp. Loss</div>
        </div>
        {activePositions.map((p) => (
          <ActivePositionRow key={p.pair} item={p} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Available Pools</div>
      <div style={S.card}>
        <div style={S.tableHeader}>
          <div style={{ ...S.colProtocol, color: "#4A5568" }}>Protocol</div>
          <div style={{ ...S.colPair, color: "#4A5568" }}>Pair</div>
          <div style={{ ...S.colApy, color: "#4A5568" }}>APY</div>
          <div style={{ ...S.colTvl, color: "#4A5568" }}>TVL</div>
          <div style={{ ...S.colRisk, color: "#4A5568" }}>Risk</div>
          <div style={{ ...S.colAction, color: "#4A5568" }}>Action</div>
        </div>
        {availablePools.map((p) => (
          <AvailablePoolRow key={p.protocol + p.pair} item={p} />
        ))}
      </div>
    </div>
  );
}