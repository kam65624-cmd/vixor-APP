import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({ meta: [{ title: "Predictions — Vixor" }] }),
  component: PredictionsPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  badge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: "rgba(245,158,11,0.15)", color: "#F59E0B", letterSpacing: "0.05em" },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  card: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", marginBottom: "12px" },
  cardTitle: { fontSize: "13px", fontWeight: 600, color: "#F0F4FC", marginBottom: "12px" },
  oddsBar: { display: "flex", height: "32px", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" },
  oddsUp: { display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.2)", color: "#22C55E", fontSize: "11px", fontWeight: 700, transition: "width 0.3s" },
  oddsDown: { display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.2)", color: "#EF4444", fontSize: "11px", fontWeight: 700, flex: 1 },
  metaRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  metaLabel: { fontSize: "10px", color: "#7B8BA8" },
  metaValue: { fontSize: "10px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
  predictionBadge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px" },
  payoutBadge: { fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  tableWrap: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "20px" },
  tableHeader: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  colRank: { width: "40px", fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colName: { width: "140px", fontSize: "12px", fontWeight: 600 },
  colWl: { width: "80px", textAlign: "center" as const, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
  colWinRate: { width: "80px", textAlign: "right" as const, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colEarnings: { width: "100px", textAlign: "right" as const, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
  historyCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" },
  historyResult: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, flexShrink: 0 },
  historyInfo: { flex: 1, minWidth: 0 },
  historyQuestion: { fontSize: "12px", fontWeight: 600, color: "#F0F4FC", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  historyMeta: { fontSize: "10px", color: "#7B8BA8", marginTop: "2px" },
  historyPnl: { fontSize: "13px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", flexShrink: 0 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
};

const activePredictions = [
  { question: "Will WIF reach $3.00 by end of week?", prediction: "Up", oddsUp: 72, volume: "$45,200", timeLeft: "2d 14h", bet: "50 SOL", payout: "+$142.80" },
  { question: "BONK market cap top 10 Solana tokens?", prediction: "Down", oddsUp: 45, volume: "$23,800", timeLeft: "5d 8h", bet: "25 SOL", payout: "+$68.40" },
  { question: "SOL price exceeds $100 this month?", prediction: "Up", oddsUp: 38, volume: "$120,500", timeLeft: "8d 2h", bet: "100 SOL", payout: "+$389.60" },
  { question: "POPCAT outperforms WIF in 7 days?", prediction: "Up", oddsUp: 56, volume: "$18,300", timeLeft: "1d 20h", bet: "30 SOL", payout: "+$85.70" },
  { question: "JUP price above $1.50 by Friday?", prediction: "Down", oddsUp: 62, volume: "$34,100", timeLeft: "3d 6h", bet: "40 SOL", payout: "+$93.20" },
  { question: "Raydium TVL surpasses $1B next week?", prediction: "Up", oddsUp: 81, volume: "$56,700", timeLeft: "6d 12h", bet: "20 SOL", payout: "+$22.40" },
];

const leaderboard = [
  { rank: 1, name: "SolanaWhale", wl: "14W 2L", winRate: "87.5%", earnings: "+$2,847", earningsColor: "#22C55E" },
  { rank: 2, name: "DegenKing", wl: "12W 3L", winRate: "80.0%", earnings: "+$2,140", earningsColor: "#22C55E" },
  { rank: 3, name: "AlphaChad", wl: "11W 4L", winRate: "73.3%", earnings: "+$1,890", earningsColor: "#22C55E" },
  { rank: 4, name: "MemeLord99", wl: "10W 5L", winRate: "66.7%", earnings: "+$1,520", earningsColor: "#22C55E" },
  { rank: 5, name: "CryptoNova", wl: "9W 4L", winRate: "69.2%", earnings: "+$1,340", earningsColor: "#22C55E" },
];

const history = [
  { question: "WIF above $2.50 by Monday", result: "win", pnl: "+$85.40", date: "Jan 22" },
  { question: "BONK breaks 24h volume record", result: "loss", pnl: "-$30.00", date: "Jan 21" },
  { question: "SOL stays above $85 for 48h", result: "win", pnl: "+$124.60", date: "Jan 20" },
  { question: "POPCAT new ATH this week", result: "win", pnl: "+$67.80", date: "Jan 19" },
  { question: "JUP token unlock below $0.80", result: "loss", pnl: "-$45.00", date: "Jan 18" },
];

const PredictionCard = memo(function PredictionCard({ item }: { item: typeof activePredictions[0] }) {
  const isUp = item.prediction === "Up";
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>{item.question}</div>
      <div style={S.oddsBar}>
        <div style={{ ...S.oddsUp, width: `${item.oddsUp}%` }}>UP {item.oddsUp}%</div>
        <div style={S.oddsDown}>DOWN {100 - item.oddsUp}%</div>
      </div>
      <div style={S.metaRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ ...S.predictionBadge, background: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isUp ? "#22C55E" : "#EF4444" }}>
            {isUp ? "▲ UP" : "▼ DOWN"}
          </span>
          <span style={S.metaLabel}>Bet: <span style={{ color: "#F0F4FC", fontWeight: 600 }}>{item.bet}</span></span>
          <span style={S.payoutBadge}>Payout: {item.payout}</span>
        </div>
        <span style={{ ...S.metaLabel, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" }}>
          ⏱ {item.timeLeft}
        </span>
      </div>
    </div>
  );
});

const LeaderboardRow = memo(function LeaderboardRow({ item }: { item: typeof leaderboard[0] }) {
  return (
    <div style={S.tableRow}>
      <div style={{ ...S.colRank, color: item.rank <= 3 ? "#F59E0B" : "#7B8BA8" }}>#{item.rank}</div>
      <div style={S.colName}>{item.name}</div>
      <div style={S.colWl}>{item.wl}</div>
      <div style={{ ...S.colWinRate, color: "#22C55E" }}>{item.winRate}</div>
      <div style={{ ...S.colEarnings, color: item.earningsColor }}>{item.earnings}</div>
    </div>
  );
});

const HistoryItem = memo(function HistoryItem({ item }: { item: typeof history[0] }) {
  const isWin = item.result === "win";
  return (
    <div style={S.historyCard}>
      <div style={{ ...S.historyResult, background: isWin ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isWin ? "#22C55E" : "#EF4444" }}>
        {isWin ? "W" : "L"}
      </div>
      <div style={S.historyInfo}>
        <div style={S.historyQuestion}>{item.question}</div>
        <div style={S.historyMeta}>{item.date}</div>
      </div>
      <div style={{ ...S.historyPnl, color: isWin ? "#22C55E" : "#EF4444" }}>{item.pnl}</div>
    </div>
  );
});

function PredictionsPage() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Predictions</h1>
        <span style={S.badge}>BETA</span>
      </div>
      <p style={S.subtitle}>Predict market outcomes and earn rewards</p>

      <div style={{ ...S.sectionTitle }}>Active Predictions</div>
      {activePredictions.map((p, i) => (
        <PredictionCard key={i} item={p} />
      ))}

      <div style={S.twoCol}>
        <div>
          <div style={{ ...S.sectionTitle }}>Leaderboard — This Week</div>
          <div style={S.tableWrap}>
            <div style={S.tableHeader}>
              <div style={{ ...S.colRank, color: "#4A5568" }}>#</div>
              <div style={{ ...S.colName, color: "#4A5568" }}>Trader</div>
              <div style={{ ...S.colWl, color: "#4A5568" }}>W/L</div>
              <div style={{ ...S.colWinRate, color: "#4A5568" }}>Win Rate</div>
              <div style={{ ...S.colEarnings, color: "#4A5568" }}>Earnings</div>
            </div>
            {leaderboard.map((l) => (
              <LeaderboardRow key={l.rank} item={l} />
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...S.sectionTitle }}>Your History</div>
          {history.map((h, i) => (
            <HistoryItem key={i} item={h} />
          ))}
        </div>
      </div>
    </div>
  );
}