import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/_authenticated/trade/chart')({
  component: LiveChart,
})

function LiveChart() {
  return (
    <div style={{ backgroundColor: "#080B11", color: "white", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Live Chart</h1>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>$64,230.50</div>
          <div style={{ fontSize: "12px", color: "#22D3A6", backgroundColor: "rgba(34,211,166,0.1)", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>+2.4% 24h</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", overflowX: "auto", paddingBottom: "5px" }}>
        {["BTC/USDT", "ETH/USDT", "SOL/USDT"].map((pair, i) => (
          <button key={i} style={{ padding: "8px 16px", backgroundColor: i === 0 ? "rgba(99,102,241,0.2)" : "transparent", color: i === 0 ? "#6366F1" : "#9ca3af", border: i === 0 ? "1px solid #6366F1" : "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", whiteSpace: "nowrap", cursor: "pointer" }}>{pair}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
        {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf, i) => (
          <button key={i} style={{ padding: "6px 12px", backgroundColor: i === 3 ? "rgba(255,255,255,0.1)" : "transparent", color: i === 3 ? "white" : "#9ca3af", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>{tf}</button>
        ))}
      </div>

      <div style={{ width: "100%", height: "300px", background: "linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(8,11,17,1) 100%)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>📈</div>
        <div style={{ color: "#9ca3af" }}>Chart rendering...</div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ padding: "10px 15px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: "#9ca3af", marginRight: "8px" }}>RSI:</span>
          <span style={{ fontWeight: "bold" }}>62</span>
        </div>
        <div style={{ padding: "10px 15px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: "#9ca3af", marginRight: "8px" }}>MACD:</span>
          <span style={{ fontWeight: "bold", color: "#22D3A6" }}>bullish</span>
        </div>
        <div style={{ padding: "10px 15px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "12px" }}>
          <span style={{ color: "#9ca3af", marginRight: "8px" }}>Volume:</span>
          <span style={{ fontWeight: "bold", color: "#F59E0B" }}>high</span>
        </div>
      </div>
    </div>
  );
}
