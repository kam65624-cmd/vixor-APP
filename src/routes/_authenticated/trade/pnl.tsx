import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/_authenticated/trade/pnl')({
  component: PnLTracker,
})

function PnLTracker() {
  return (
    <div style={{ backgroundColor: "#080B11", color: "white", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "bold" }}>PnL Tracker</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>Total PnL</div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#22D3A6" }}>+$2,430</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>Win Rate</div>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>72%</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>Best Trade</div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#22D3A6" }}>+$850</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>Current Streak</div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#F59E0B" }}>5W</div>
        </div>
      </div>

      <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "15px" }}>Weekly PnL</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px", paddingTop: "10px" }}>
          {[
            { day: "M", val: 40, pos: true },
            { day: "T", val: 20, pos: false },
            { day: "W", val: 60, pos: true },
            { day: "T", val: 80, pos: true },
            { day: "F", val: 10, pos: false },
            { day: "S", val: 30, pos: true },
            { day: "S", val: 50, pos: true },
          ].map((bar, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "100%", height: `${bar.val}px`, backgroundColor: bar.pos ? "#22D3A6" : "#FB4667", borderRadius: "4px" }}></div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>{bar.day}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>Trade History</h2>
          <button style={{ padding: "6px 12px", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>Export</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { pair: "BTC/USDT", date: "Oct 24", dir: "LONG", pnl: "+$320", pos: true },
            { pair: "ETH/USDT", date: "Oct 23", dir: "SHORT", pnl: "-$150", pos: false },
            { pair: "SOL/USDT", date: "Oct 21", dir: "LONG", pnl: "+$850", pos: true },
            { pair: "DOGE/USDT", date: "Oct 20", dir: "LONG", pnl: "+$45", pos: true },
            { pair: "LINK/USDT", date: "Oct 19", dir: "SHORT", pnl: "-$80", pos: false },
          ].map((trade, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{trade.pair}</div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{trade.date} • {trade.dir}</div>
              </div>
              <div style={{ fontWeight: "bold", color: trade.pos ? "#22D3A6" : "#FB4667" }}>
                {trade.pnl}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
