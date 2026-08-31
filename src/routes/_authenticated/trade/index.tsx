import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Zap, BarChart2, Activity } from "lucide-react";

export const Route = createFileRoute('/_authenticated/trade/')({
  component: TradeDesk,
})

function TradeDesk() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#080B11", color: "white", minHeight: "100vh", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
        <Zap style={{ color: "#F59E0B" }} size={28} />
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>TRADE DESK</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>BTC Price</div>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>$64,230.50</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>Total PnL</div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#22D3A6" }}>+$2,430.00</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "5px" }}>Win Rate</div>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>72%</div>
        </div>
      </div>

      <div style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>Quick Trade</h2>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button style={{ flex: 1, padding: "10px", backgroundColor: "#22D3A6", color: "black", fontWeight: "bold", borderRadius: "8px", border: "none", cursor: "pointer" }}>Buy</button>
          <button style={{ flex: 1, padding: "10px", backgroundColor: "transparent", color: "#FB4667", fontWeight: "bold", borderRadius: "8px", border: "1px solid #FB4667", cursor: "pointer" }}>Sell</button>
        </div>
        <div style={{ marginBottom: "15px" }}>
          <select style={{ width: "100%", padding: "12px", backgroundColor: "rgba(0,0,0,0.5)", color: "white", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }}>
            <option>BTC/USDT</option>
            <option>ETH/USDT</option>
            <option>SOL/USDT</option>
          </select>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <input type="number" placeholder="Amount (USDT)" style={{ width: "100%", padding: "12px", backgroundColor: "rgba(0,0,0,0.5)", color: "white", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }} />
        </div>
        <button style={{ width: "100%", padding: "15px", backgroundColor: "#6366F1", color: "white", fontWeight: "bold", borderRadius: "8px", border: "none", cursor: "pointer" }}>Execute Trade</button>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>Recent Positions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { pair: "BTC/USDT", dir: "LONG", pnl: "+$450", pnlColor: "#22D3A6", status: "Active" },
            { pair: "ETH/USDT", dir: "SHORT", pnl: "-$120", pnlColor: "#FB4667", status: "Closed" },
            { pair: "SOL/USDT", dir: "LONG", pnl: "+$890", pnlColor: "#22D3A6", status: "Active" }
          ].map((pos, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: "12px 15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{pos.pair}</div>
                <div style={{ fontSize: "10px", marginTop: "4px", display: "inline-block", padding: "2px 6px", borderRadius: "4px", backgroundColor: pos.dir === "LONG" ? "rgba(34,211,166,0.2)" : "rgba(251,70,103,0.2)", color: pos.dir === "LONG" ? "#22D3A6" : "#FB4667" }}>{pos.dir}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold", color: pos.pnlColor }}>{pos.pnl}</div>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>{pos.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => navigate({ to: "/trade/chart" })} style={{ flex: 1, padding: "12px", backgroundColor: "rgba(255,255,255,0.1)", color: "white", borderRadius: "8px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
          <BarChart2 size={16} /> Live Chart
        </button>
        <button onClick={() => navigate({ to: "/trade/signals" })} style={{ flex: 1, padding: "12px", backgroundColor: "rgba(255,255,255,0.1)", color: "white", borderRadius: "8px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
          <Activity size={16} /> Signals
        </button>
      </div>
    </div>
  );
}
