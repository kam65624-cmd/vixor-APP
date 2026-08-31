import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/_authenticated/trade/signals')({
  component: TradeSignals,
})

function TradeSignals() {
  return (
    <div style={{ backgroundColor: "#080B11", color: "white", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>SIGNALS FEED</h1>
        <div style={{ width: "8px", height: "8px", backgroundColor: "#22D3A6", borderRadius: "50%", boxShadow: "0 0 8px #22D3A6" }}></div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "5px" }}>
        {["All", "Crypto", "Forex", "Stocks"].map((filter, i) => (
          <button key={i} style={{ padding: "8px 16px", backgroundColor: i === 0 ? "rgba(255,255,255,0.1)" : "transparent", color: i === 0 ? "white" : "#9ca3af", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", whiteSpace: "nowrap", cursor: "pointer" }}>{filter}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
        {[
          { pair: "BTC/USDT", dir: "BUY", tf: "1H", entry: "64,100", tp: "65,500", sl: "63,200", conf: 85, time: "2m ago" },
          { pair: "ETH/USDT", dir: "SELL", tf: "4H", entry: "3,450", tp: "3,300", sl: "3,520", conf: 72, time: "15m ago" },
          { pair: "SOL/USDT", dir: "BUY", tf: "15m", entry: "142.50", tp: "148.00", sl: "139.00", conf: 91, time: "1h ago" },
          { pair: "LINK/USDT", dir: "BUY", tf: "1D", entry: "18.20", tp: "21.00", sl: "16.50", conf: 68, time: "3h ago" },
        ].map((sig, i) => (
          <div key={i} style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "bold", fontSize: "16px" }}>{sig.pair}</span>
                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: sig.dir === "BUY" ? "rgba(34,211,166,0.2)" : "rgba(251,70,103,0.2)", color: sig.dir === "BUY" ? "#22D3A6" : "#FB4667", fontWeight: "bold" }}>{sig.dir}</span>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>{sig.tf}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>{sig.time}</div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "15px", color: "#d1d5db" }}>
              <div>Entry: <span style={{ fontWeight: "bold", color: "white" }}>{sig.entry}</span></div>
              <div>TP: <span style={{ fontWeight: "bold", color: "#22D3A6" }}>{sig.tp}</span></div>
              <div>SL: <span style={{ fontWeight: "bold", color: "#FB4667" }}>{sig.sl}</span></div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", width: "40px" }}>Conf.</div>
              <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${sig.conf}%`, backgroundColor: sig.conf > 80 ? "#22D3A6" : "#F59E0B" }}></div>
              </div>
              <div style={{ fontSize: "11px", fontWeight: "bold" }}>{sig.conf}%</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "15px", backgroundColor: "rgba(99,102,241,0.1)", borderRadius: "8px", color: "#6366F1", fontSize: "14px", fontWeight: "bold" }}>
        Signal accuracy this week: 78%
      </div>
    </div>
  );
}
