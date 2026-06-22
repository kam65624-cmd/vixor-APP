import { memo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perpetuals")({
  head: () => ({ meta: [{ title: "Perpetuals — Vixor" }] }),
  component: PerpetualsPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  badge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", background: "rgba(239,68,68,0.15)", color: "#EF4444", letterSpacing: "0.05em" },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  tabs: { display: "flex", gap: "4px", marginBottom: "20px", background: "#161b2e", borderRadius: "10px", padding: "4px", border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" },
  tab: { fontSize: "12px", fontWeight: 600, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#7B8BA8", background: "transparent", fontFamily: "'Inter', system-ui, sans-serif" },
  tabActive: { background: "#1e2438", color: "#F0F4FC" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" },
  leftCol: { display: "flex", flexDirection: "column" as const, gap: "16px" },
  rightCol: { display: "flex", flexDirection: "column" as const, gap: "16px" },
  card: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  cardTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  cardBody: { padding: "16px" },
  tableHeader: { display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "11px" },
  col: { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  sideButtons: { display: "flex", gap: "8px", marginBottom: "16px" },
  sideBtn: { flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", transition: "opacity 0.15s" },
  longBtn: { background: "rgba(34,197,94,0.2)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" },
  shortBtn: { background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" },
  fieldGroup: { marginBottom: "12px" },
  fieldLabel: { fontSize: "10px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "6px" },
  fieldValue: { fontSize: "16px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#F0F4FC" },
  input: { width: "100%", background: "#1a2035", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 12px", color: "#F0F4FC", fontSize: "14px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", outline: "none", boxSizing: "border-box" as const },
  leverageRow: { display: "flex", gap: "6px", flexWrap: "wrap" as const },
  leverageBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "#1a2035", color: "#7B8BA8", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  leverageBtnActive: { background: "rgba(59,130,246,0.15)", color: "#60A5FA", borderColor: "rgba(59,130,246,0.3)" },
  executeBtn: { width: "100%", padding: "14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", marginTop: "8px" },
  obRow: { display: "flex", alignItems: "center", height: "26px", position: "relative" as const, fontSize: "11px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  obBg: { position: "absolute" as const, top: 0, bottom: 0, right: 0, transition: "width 0.3s" },
  obText: { position: "relative" as const, zIndex: 1, display: "flex", justifyContent: "space-between", padding: "0 12px", width: "100%", boxSizing: "border-box" as const },
  obPrice: { width: "90px" },
  obSize: { width: "80px", textAlign: "right" as const },
  obTotal: { width: "90px", textAlign: "right" as const, color: "#7B8BA8" },
  obSpread: { textAlign: "center" as const, padding: "4px", fontSize: "10px", fontWeight: 600, color: "#F59E0B", background: "rgba(245,158,11,0.06)" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" },
  summaryLabel: { fontSize: "11px", color: "#7B8BA8" },
  summaryValue: { fontSize: "11px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
};

const openPositions = [
  { pair: "WIF-PERP", side: "Long", size: "500 WIF", entry: "$2.38", mark: "$2.52", pnl: "+$70.00", pnlPct: "+5.9%", leverage: "5x", liqPrice: "$1.78" },
  { pair: "BONK-PERP", side: "Short", size: "10M BONK", entry: "$0.0000298", mark: "$0.0000289", pnl: "+$9.00", pnlPct: "+3.0%", leverage: "10x", liqPrice: "$0.0000358" },
  { pair: "SOL-PERP", side: "Long", size: "5 SOL", entry: "$88.40", mark: "$93.20", pnl: "+$24.00", pnlPct: "+5.4%", leverage: "3x", liqPrice: "$72.10" },
  { pair: "WIF-PERP", side: "Short", size: "200 WIF", entry: "$2.61", mark: "$2.52", pnl: "+$18.00", pnlPct: "+3.4%", leverage: "5x", liqPrice: "$3.08" },
];

const orderBookBids = [
  { price: "2.5100", size: "1,240", total: "14,820" },
  { price: "2.5080", size: "890", total: "13,580" },
  { price: "2.5060", size: "2,100", total: "12,690" },
  { price: "2.5040", size: "560", total: "10,590" },
  { price: "2.5020", size: "1,800", total: "10,030" },
  { price: "2.5000", size: "3,200", total: "8,230" },
  { price: "2.4980", size: "780", total: "5,030" },
  { price: "2.4960", size: "1,450", total: "4,250" },
];

const orderBookAsks = [
  { price: "2.5120", size: "920", total: "4,180" },
  { price: "2.5140", size: "1,100", total: "5,280" },
  { price: "2.5160", size: "670", total: "6,380" },
  { price: "2.5180", size: "2,400", total: "7,850" },
  { price: "2.5200", size: "1,680", total: "9,250" },
  { price: "2.5220", size: "3,100", total: "11,430" },
  { price: "2.5240", size: "890", total: "12,780" },
  { price: "2.5260", size: "2,040", total: "14,820" },
];

const pairTabs = ["WIF-PERP", "BONK-PERP", "SOL-PERP"];
const leverageOptions = ["1x", "2x", "5x", "10x", "25x", "50x"];

const PositionRow = memo(function PositionRow({ item }: { item: typeof openPositions[0] }) {
  const isLong = item.side === "Long";
  const isProfit = item.pnl.startsWith("+");
  return (
    <div style={S.tableRow}>
      <div style={{ width: "90px", fontWeight: 600, ...S.col }}>{item.pair}</div>
      <div style={{ width: "55px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: isLong ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isLong ? "#22C55E" : "#EF4444" }}>{item.side}</span>
      </div>
      <div style={{ width: "90px", ...S.col }}>{item.size}</div>
      <div style={{ width: "85px", ...S.col, color: "#7B8BA8" }}>{item.entry}</div>
      <div style={{ width: "75px", ...S.col, color: "#F0F4FC" }}>{item.mark}</div>
      <div style={{ width: "90px", ...S.col, color: isProfit ? "#22C55E" : "#EF4444", fontWeight: 700 }}>{item.pnl} <span style={{ fontSize: "9px" }}>({item.pnlPct})</span></div>
      <div style={{ width: "45px", ...S.col, color: "#F59E0B" }}>{item.leverage}</div>
      <div style={{ width: "80px", ...S.col, color: "#EF4444", fontSize: "10px" }}>{item.liqPrice}</div>
    </div>
  );
});

const OrderBookRow = memo(function OrderBookRow({ item, side, maxTotal }: { item: typeof orderBookBids[0]; side: "bid" | "ask"; maxTotal: number }) {
  const pct = (parseFloat(item.total) / maxTotal) * 100;
  return (
    <div style={S.obRow}>
      <div style={{ ...S.obBg, width: `${pct}%`, background: side === "bid" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)" }} />
      <div style={S.obText}>
        <span style={{ ...S.obPrice, color: side === "bid" ? "#22C55E" : "#EF4444" }}>{item.price}</span>
        <span style={S.obSize}>{item.size}</span>
        <span style={S.obTotal}>{item.total}</span>
      </div>
    </div>
  );
});

function PerpetualsPage() {
  const [activeTab, setActiveTab] = useState("WIF-PERP");
  const [activeLeverage, setActiveLeverage] = useState("5x");
  const [isLong, setIsLong] = useState(true);

  const maxBidTotal = Math.max(...orderBookBids.map((b) => parseFloat(b.total)));
  const maxAskTotal = Math.max(...orderBookAsks.map((a) => parseFloat(a.total)));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Perpetuals</h1>
        <span style={S.badge}>LIVE</span>
      </div>
      <p style={S.subtitle}>Trade perpetual futures on Solana meme coins with leverage</p>

      <div style={S.tabs}>
        {pairTabs.map((tab) => (
          <button
            key={tab}
            style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Open Positions */}
      <div style={{ ...S.card, marginBottom: "16px" }}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>Open Positions</span>
          <span style={{ fontSize: "11px", color: "#7B8BA8", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" }}>4 positions</span>
        </div>
        <div style={S.tableHeader}>
          <div style={{ width: "90px", color: "#4A5568" }}>Pair</div>
          <div style={{ width: "55px", color: "#4A5568" }}>Side</div>
          <div style={{ width: "90px", color: "#4A5568" }}>Size</div>
          <div style={{ width: "85px", color: "#4A5568", textAlign: "right" }}>Entry</div>
          <div style={{ width: "75px", color: "#4A5568", textAlign: "right" }}>Mark</div>
          <div style={{ width: "90px", color: "#4A5568", textAlign: "right" }}>PnL</div>
          <div style={{ width: "45px", color: "#4A5568", textAlign: "center" }}>Lev.</div>
          <div style={{ width: "80px", color: "#4A5568", textAlign: "right" }}>Liq. Price</div>
        </div>
        {openPositions.map((p) => (
          <PositionRow key={p.pair + p.side} item={p} />
        ))}
      </div>

      <div style={S.mainGrid}>
        {/* Order Book */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Order Book</span>
            <span style={{ fontSize: "11px", ...S.col, color: "#F0F4FC" }}>$2.5110</span>
          </div>
          <div style={{ ...S.tableHeader, padding: "6px 12px" }}>
            <span style={{ width: "90px" }}>Price</span>
            <span style={{ width: "80px", textAlign: "right" }}>Size</span>
            <span style={{ width: "90px", textAlign: "right" }}>Total</span>
          </div>
          {[...orderBookAsks].reverse().map((a) => (
            <OrderBookRow key={"a" + a.price} item={a} side="ask" maxTotal={maxAskTotal} />
          ))}
          <div style={S.obSpread}>Spread: $0.0020 (0.08%)</div>
          {orderBookBids.map((b) => (
            <OrderBookRow key={"b" + b.price} item={b} side="bid" maxTotal={maxBidTotal} />
          ))}
        </div>

        {/* Trading Panel */}
        <div style={{ ...S.card }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>Trade {activeTab}</span>
          </div>
          <div style={S.cardBody}>
            <div style={S.sideButtons}>
              <button
                style={{ ...S.sideBtn, ...S.longBtn, opacity: isLong ? 1 : 0.4 }}
                onClick={() => setIsLong(true)}
              >Long</button>
              <button
                style={{ ...S.sideBtn, ...S.shortBtn, opacity: !isLong ? 1 : 0.4 }}
                onClick={() => setIsLong(false)}
              >Short</button>
            </div>

            <div style={S.fieldGroup}>
              <div style={S.fieldLabel}>Entry Price</div>
              <div style={S.fieldValue}>$2.5110</div>
            </div>

            <div style={S.fieldGroup}>
              <div style={S.fieldLabel}>Size (WIF)</div>
              <input style={S.input} type="text" placeholder="0.00" defaultValue="" />
            </div>

            <div style={S.fieldGroup}>
              <div style={S.fieldLabel}>Leverage</div>
              <div style={S.leverageRow}>
                {leverageOptions.map((lv) => (
                  <button
                    key={lv}
                    style={{ ...S.leverageBtn, ...(activeLeverage === lv ? S.leverageBtnActive : {}) }}
                    onClick={() => setActiveLeverage(lv)}
                  >{lv}</button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "4px" }}>
              <div style={S.summaryRow}>
                <span style={S.summaryLabel}>Est. Margin</span>
                <span style={{ ...S.summaryValue, color: "#F0F4FC" }}>~$0.00</span>
              </div>
              <div style={S.summaryRow}>
                <span style={S.summaryLabel}>Fee (0.05%)</span>
                <span style={{ ...S.summaryValue, color: "#7B8BA8" }}>~$0.00</span>
              </div>
              <div style={S.summaryRow}>
                <span style={S.summaryLabel}>Liq. Price</span>
                <span style={{ ...S.summaryValue, color: "#EF4444" }}>~$0.00</span>
              </div>
            </div>

            <button style={{ ...S.executeBtn, background: isLong ? "#22C55E" : "#EF4444", color: "#0f1424" }}>
              {isLong ? "Open Long" : "Open Short"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}