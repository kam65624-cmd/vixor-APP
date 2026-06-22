import { memo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Trading Journal — Vixor" }] }),
  component: JournalPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" },
 headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  addBtn: { padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: "12px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", gap: "6px" },
  tabs: { display: "flex", gap: "4px", marginBottom: "20px", background: "#161b2e", borderRadius: "10px", padding: "4px", border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" },
  tab: { fontSize: "12px", fontWeight: 600, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#7B8BA8", background: "transparent", fontFamily: "'Inter', system-ui, sans-serif" },
  tabActive: { background: "#1e2438", color: "#F0F4FC" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" },
  summaryCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" },
  summaryLabel: { fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "6px" },
  summaryValue: { fontSize: "22px", fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  summarySub: { fontSize: "10px", color: "#7B8BA8", marginTop: "4px" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableWrap: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" },
  tableHeader: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" },
  colDate: { width: "85px", fontSize: "11px", color: "#7B8BA8" },
  colToken: { width: "80px", fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colType: { width: "60px" },
  colEntry: { width: "85px", textAlign: "right" as const, fontSize: "11px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colExit: { width: "85px", textAlign: "right" as const, fontSize: "11px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colPnl: { width: "100px", textAlign: "right" as const, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 700 },
  colNotes: { flex: 1, fontSize: "11px", color: "#7B8BA8", paddingLeft: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  colAction: { width: "30px", textAlign: "center" as const },
  typeBadge: { fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", display: "inline-block" },
  monthlyLabel: { fontSize: "11px", fontWeight: 600, color: "#7B8BA8", padding: "8px 16px", background: "#1a2035", borderBottom: "1px solid rgba(255,255,255,0.06)" },
};

const monthlySummary = [
  { label: "Total Trades", value: "34", sub: "This month", color: "#3B82F6" },
  { label: "Win Rate", value: "67.6%", sub: "23W / 11L", color: "#22C55E" },
  { label: "Total PnL", value: "+$1,847", sub: "+12.4% ROI", color: "#22C55E" },
  { label: "Avg. Trade", value: "+$54.32", sub: "Best: +$420", color: "#F59E0B" },
];

const journalEntries = [
  { date: "Jan 24", token: "WIF", type: "Long", entry: "$2.28", exit: "$2.52", pnl: "+$120.00", pnlColor: "#22C55E", notes: "Bought on the dip after whale accumulation spotted on-chain. Strong support at $2.20 held." },
  { date: "Jan 24", token: "BONK", type: "Short", entry: "$0.0000301", exit: "$0.0000289", pnl: "+$48.00", pnlColor: "#22C55E", notes: "Overextended on 1h RSI. Volume declining. Targeted previous support level." },
  { date: "Jan 23", token: "POPCAT", type: "Long", entry: "$1.18", exit: "$1.05", pnl: "-$78.00", pnlColor: "#EF4444", notes: "Entry too early. Should have waited for confirmation above $1.20 resistance. Cut loss at mental stop." },
  { date: "Jan 23", token: "SOL", type: "Long", entry: "$89.50", exit: "$93.20", pnl: "+$420.00", pnlColor: "#22C55E", notes: "SOL ETF narrative building. Accumulated on pullback with tight stop. Let winner run to target." },
  { date: "Jan 22", token: "JUP", type: "Long", entry: "$0.82", exit: "$0.91", pnl: "+$180.00", pnlColor: "#22C55E", notes: "Governance vote catalyst. Strong community sentiment. 3x leverage on perps for higher returns." },
  { date: "Jan 22", token: "WIF", type: "Short", entry: "$2.65", exit: "$2.58", pnl: "+$35.00", pnlColor: "#22C55E", notes: "Quick scalp on rejection at resistance. 15-minute chart showed bearish divergence on RSI." },
  { date: "Jan 21", token: "TENSOR", type: "Long", entry: "$0.45", exit: "$0.38", pnl: "-$140.00", pnlColor: "#EF4444", notes: "NFT sector weakness. Should have respected sector-level analysis. Overexposed to single narrative play." },
  { date: "Jan 20", token: "BONK", type: "Long", entry: "$0.0000275", exit: "$0.0000298", pnl: "+$230.00", pnlColor: "#22C55E", notes: "BONK season 3 airdrop hype. Large wallet activity detected. Perfect entry on 4h support bounce." },
  { date: "Jan 19", token: "RAY", type: "Long", entry: "$2.08", exit: "$2.15", pnl: "+$70.00", pnlColor: "#22C55E", notes: "Raydium TVL growth narrative. Steady DEX volume increase. Low risk, steady gain trade." },
  { date: "Jan 18", token: "POPCAT", type: "Short", entry: "$1.30", exit: "$1.35", pnl: "-$50.00", pnlColor: "#EF4444", notes: "Failed short. Cat meta stronger than expected. Wrong read on social sentiment reversal." },
];

const tabs = ["All", "Winners", "Losers", "With Notes"];

const SummaryCard = memo(function SummaryCard({ item }: { item: typeof monthlySummary[0] }) {
  return (
    <div style={S.summaryCard}>
      <div style={S.summaryLabel}>{item.label}</div>
      <div style={{ ...S.summaryValue, color: item.color }}>{item.value}</div>
      <div style={S.summarySub}>{item.sub}</div>
    </div>
  );
});

const JournalRow = memo(function JournalRow({ item }: { item: typeof journalEntries[0] }) {
  const isLong = item.type === "Long";
  return (
    <div style={S.tableRow}>
      <div style={S.colDate}>{item.date}</div>
      <div style={S.colToken}>{item.token}</div>
      <div style={S.colType}>
        <span style={{
          ...S.typeBadge,
          background: isLong ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          color: isLong ? "#22C55E" : "#EF4444",
        }}>{item.type}</span>
      </div>
      <div style={S.colEntry}>{item.entry}</div>
      <div style={S.colExit}>{item.exit}</div>
      <div style={{ ...S.colPnl, color: item.pnlColor }}>{item.pnl}</div>
      <div style={S.colNotes} title={item.notes}>{item.notes}</div>
      <div style={S.colAction}>
        <span style={{ fontSize: "14px", color: "#4A5568", cursor: "pointer" }}>›</span>
      </div>
    </div>
  );
});

function JournalPage() {
  const [activeTab, setActiveTab] = useState("All");

  const filteredEntries = journalEntries.filter((e) => {
    if (activeTab === "All") return true;
    if (activeTab === "Winners") return e.pnl.startsWith("+");
    if (activeTab === "Losers") return e.pnl.startsWith("-");
    if (activeTab === "With Notes") return e.notes.length > 0;
    return true;
  });

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <h1 style={S.title}>Trading Journal</h1>
        </div>
        <button style={S.addBtn}>+ New Entry</button>
      </div>
      <p style={S.subtitle}>Track your trades, review performance, and improve your strategy</p>

      <div style={{ ...S.sectionTitle }}>Monthly Performance — January 2025</div>
      <div style={S.summaryGrid}>
        {monthlySummary.map((s) => (
          <SummaryCard key={s.label} item={s} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Journal Entries</div>
      <div style={S.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >{t}</button>
        ))}
      </div>

      <div style={S.tableWrap}>
        <div style={S.tableHeader}>
          <div style={{ ...S.colDate, color: "#4A5568" }}>Date</div>
          <div style={{ ...S.colToken, color: "#4A5568" }}>Token</div>
          <div style={{ ...S.colType, color: "#4A5568" }}>Type</div>
          <div style={{ ...S.colEntry, color: "#4A5568" }}>Entry</div>
          <div style={{ ...S.colExit, color: "#4A5568" }}>Exit</div>
          <div style={{ ...S.colPnl, color: "#4A5568" }}>PnL</div>
          <div style={{ ...S.colNotes, color: "#4A5568" }}>Notes</div>
          <div style={{ ...S.colAction, color: "#4A5568" }}></div>
        </div>
        {filteredEntries.map((e, i) => (
          <JournalRow key={e.date + e.token + i} item={e} />
        ))}
      </div>
    </div>
  );
}