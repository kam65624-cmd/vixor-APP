import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/trackers")({
  head: () => ({ meta: [{ title: "Trackers — Vixor" }] }),
  component: TrackersPage,
});

const TABS = ["Smart Money", "Top Traders", "Watchlist"] as const;

// ── Smart Money Data ──

interface SmartWallet {
  id: string;
  rank: number;
  address: string;
  label: string;
  tokensHeld: number;
  totalValue: string;
  pnl24h: string;
  pnl24hPct: number;
  winRate: number;
  avgHoldTime: string;
  topToken: string;
}

const SMART_MONEY: SmartWallet[] = [
  { id: "1", rank: 1, address: "7xKXtg2CW3m...3nPB", label: "Whale Alpha", tokensHeld: 12, totalValue: "$4.2M", pnl24h: "+$142K", pnl24hPct: 8.4, winRate: 82, avgHoldTime: "6h 12m", topToken: "WIF" },
  { id: "2", rank: 2, address: "4pHDkCK9vBn...8vW2", label: "Degen King", tokensHeld: 8, totalValue: "$2.8M", pnl24h: "+$98K", pnl24hPct: 5.1, winRate: 74, avgHoldTime: "3h 45m", topToken: "POPCAT" },
  { id: "3", rank: 3, address: "Bn4TEvxR7mK...9kR3", label: "Accumulator", tokensHeld: 15, totalValue: "$1.9M", pnl24h: "+$85K", pnl24hPct: 4.7, winRate: 71, avgHoldTime: "12h 30m", topToken: "BONK" },
  { id: "4", rank: 4, address: "Dj8sN2mTq4h...4eLk", label: "MM Bot", tokensHeld: 22, totalValue: "$8.5M", pnl24h: "+$312K", pnl24hPct: 2.3, winRate: 68, avgHoldTime: "1h 15m", topToken: "SOL" },
  { id: "5", rank: 5, address: "Hn2vE7cPk9w...6wPj", label: "Early Bird", tokensHeld: 6, totalValue: "$1.1M", pnl24h: "+$56K", pnl24hPct: 12.1, winRate: 65, avgHoldTime: "8h 20m", topToken: "SPX" },
  { id: "6", rank: 6, address: "Kx9mN3dRt8q...7tRq", label: "Sniper Pro", tokensHeld: 9, totalValue: "$950K", pnl24h: "+$34K", pnl24hPct: 6.8, winRate: 78, avgHoldTime: "45m", topToken: "TURBO" },
  { id: "7", rank: 7, address: "Rt5wP8nYs2v...2sKl", label: "Dev Hunter", tokensHeld: 11, totalValue: "$720K", pnl24h: "+$22K", pnl24hPct: 3.5, winRate: 60, avgHoldTime: "18h 40m", topToken: "GOAT" },
  { id: "8", rank: 8, address: "Ys2vD6mBn7x...9nBx", label: "Copy Master", tokensHeld: 7, totalValue: "$1.5M", pnl24h: "+$78K", pnl24hPct: 7.2, winRate: 73, avgHoldTime: "5h 50m", topToken: "MEW" },
];

// ── Top Traders Data ──

interface TopTrader {
  id: string;
  rank: number;
  wallet: string;
  label: string;
  pnl24h: string;
  pnl24hPct: number;
  totalTrades: number;
  winRate: number;
  avgPnl: string;
  bestTrade: string;
  streak: number;
}

const TOP_TRADERS: TopTrader[] = [
  { id: "1", rank: 1, wallet: "Hn2vE7cPk9w...6wPj", label: "MegaDegen", pnl24h: "+$142K", pnl24hPct: 284, totalTrades: 34, winRate: 82, avgPnl: "+$4.2K", bestTrade: "+$48K (WIF)", streak: 8 },
  { id: "2", rank: 2, wallet: "Bn4TEvxR7mK...9kR3", label: "SolSniper", pnl24h: "+$98K", pnl24hPct: 196, totalTrades: 28, winRate: 75, avgPnl: "+$3.5K", bestTrade: "+$32K (POPCAT)", streak: 5 },
  { id: "3", rank: 3, wallet: "Kx9mN3dRt8q...7tRq", label: "WhaleWatcher", pnl24h: "+$85K", pnl24hPct: 170, totalTrades: 41, winRate: 68, avgPnl: "+$2.1K", bestTrade: "+$28K (SPX)", streak: 4 },
  { id: "4", rank: 4, wallet: "Ys2vD6mBn7x...9nBx", label: "AlphaSeer", pnl24h: "+$67K", pnl24hPct: 134, totalTrades: 19, winRate: 84, avgPnl: "+$3.5K", bestTrade: "+$25K (BONK)", streak: 6 },
  { id: "5", rank: 5, wallet: "Rt5wP8nYs2v...2sKl", label: "PumpKing", pnl24h: "+$54K", pnl24hPct: 108, totalTrades: 52, winRate: 63, avgPnl: "+$1.0K", bestTrade: "+$18K (TURBO)", streak: 3 },
  { id: "6", rank: 6, wallet: "7xKXtg2CW3m...3nPB", label: "DexLord", pnl24h: "+$41K", pnl24hPct: 82, totalTrades: 37, winRate: 70, avgPnl: "+$1.1K", bestTrade: "+$15K (GOAT)", streak: 4 },
  { id: "7", rank: 7, wallet: "4pHDkCK9vBn...8vW2", label: "TokenHunter", pnl24h: "+$33K", pnl24hPct: 66, totalTrades: 24, winRate: 67, avgPnl: "+$1.4K", bestTrade: "+$12K (MEW)", streak: 2 },
  { id: "8", rank: 8, wallet: "Dj8sN2mTq4h...4eLk", label: "CurveRider", pnl24h: "+$28K", pnl24hPct: 56, totalTrades: 15, winRate: 80, avgPnl: "+$1.9K", bestTrade: "+$10K (FLOKI)", streak: 3 },
];

// ── Watchlist Data ──

interface WatchlistToken {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  change1h: number;
  volume24h: string;
  marketCap: string;
  alertStatus: "none" | "above" | "below" | "breakout";
  alertPrice?: string;
  notes: string;
}

const WATCHLIST: WatchlistToken[] = [
  { id: "1", symbol: "WIF", name: "dogwifhat", price: "$2.45", change24h: 22.1, change1h: 8.5, volume24h: "$340M", marketCap: "$2.4B", alertStatus: "breakout", notes: "Watch for $3.00 resistance" },
  { id: "2", symbol: "POPCAT", name: "Popcat", price: "$1.23", change24h: 33.7, change1h: 12.3, volume24h: "$95M", marketCap: "$890M", alertStatus: "above", alertPrice: "$1.50", notes: "Volume surging" },
  { id: "3", symbol: "SPX", name: "SPX6900", price: "$0.89", change24h: 18.9, change1h: 5.4, volume24h: "$56M", marketCap: "$340M", alertStatus: "none", notes: "Accumulating" },
  { id: "4", symbol: "BONK", name: "Bonk", price: "$0.0000289", change24h: -1.5, change1h: -2.1, volume24h: "$210M", marketCap: "$1.8B", alertStatus: "below", alertPrice: "$0.0000250", notes: "Possible rebound" },
  { id: "5", symbol: "TURBO", name: "Turbo", price: "$0.0089", change24h: 45.6, change1h: 15.7, volume24h: "$78M", marketCap: "$56M", alertStatus: "breakout", notes: "New ATH imminent" },
  { id: "6", symbol: "GOAT", name: "GOAT", price: "$0.45", change24h: -12.3, change1h: -8.2, volume24h: "$185M", marketCap: "$450M", alertStatus: "below", alertPrice: "$0.40", notes: "Dev selling, cautious" },
  { id: "7", symbol: "MEW", name: "cat in a dogs world", price: "$0.012", change24h: 15.4, change1h: 4.2, volume24h: "$42M", marketCap: "$120M", alertStatus: "above", alertPrice: "$0.015", notes: "Cat narrative play" },
  { id: "8", symbol: "MOG", name: "Mog Coin", price: "$0.0000012", change24h: 28.3, change1h: 9.8, volume24h: "$38M", marketCap: "$92M", alertStatus: "none", notes: "Smart money accumulating" },
];

// ── Page Component ──

function TrackersPage() {
  const [activeTab, setActiveTab] = useState<string>("Smart Money");

  return (
    <div style={{ width: "100%", height: "100%", background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>📊</span>
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Trackers</h1>
        </div>
        <p style={{ fontSize: "11px", marginTop: "2px", color: "#7B8BA8", margin: 0 }}>Monitor smart money wallets and top traders</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: "11px", fontWeight: 600, padding: "6px 14px", borderRadius: "6px",
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
              color: activeTab === tab ? "#60A5FA" : "#7B8BA8",
              background: activeTab === tab ? "rgba(59,130,246,0.15)" : "transparent",
              borderBottom: activeTab === tab ? "2px solid #3B82F6" : "2px solid transparent",
              marginBottom: "-9px",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ overflowY: "auto", padding: "12px 16px", maxHeight: "calc(100vh - 160px)" }}>
        {activeTab === "Smart Money" && <SmartMoneyTab />}
        {activeTab === "Top Traders" && <TopTradersTab />}
        {activeTab === "Watchlist" && <WatchlistTab />}
      </div>
    </div>
  );
}

// ── Smart Money Tab ──

function SmartMoneyTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🧠</span>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>Smart Money Wallets</span>
          <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}>{SMART_MONEY.length} tracked</span>
        </div>
      </div>
      {/* Column Headers */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 12px", fontSize: "9px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <div style={{ width: "24px" }}></div>
        <div style={{ flex: 1, minWidth: 0 }}>Wallet</div>
        <div style={{ width: "70px", textAlign: "right" }}>Tokens</div>
        <div style={{ width: "80px", textAlign: "right" }}>Value</div>
        <div style={{ width: "90px", textAlign: "right" }}>24h PnL</div>
        <div style={{ width: "65px", textAlign: "right" }}>Win Rate</div>
        <div style={{ width: "80px", textAlign: "right" }}>Hold Time</div>
      </div>
      {SMART_MONEY.map((w) => (
        <SmartMoneyRow key={w.id} wallet={w} />
      ))}
    </div>
  );
}

const SmartMoneyRow = memo(function SmartMoneyRow({ wallet }: { wallet: SmartWallet }) {
  const isPositive = wallet.pnl24hPct >= 0;
  const rankBg = wallet.rank <= 3 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)";
  const rankColor = wallet.rank <= 3 ? "#F59E0B" : "#7B8BA8";

  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "8px",
        background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer", transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2438"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#161b2e"; }}
    >
      <div style={{ width: "24px" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: rankBg, color: rankColor, fontFamily: "monospace" }}>
          #{wallet.rank}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{wallet.address}</span>
          <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}>{wallet.label}</span>
        </div>
        <div style={{ fontSize: "9px", color: "#4A5568", marginTop: "2px" }}>Top: {wallet.topToken}</div>
      </div>
      <div style={{ width: "70px", textAlign: "right", fontSize: "11px", fontWeight: 600 }}>{wallet.tokensHeld}</div>
      <div style={{ width: "80px", textAlign: "right", fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>{wallet.totalValue}</div>
      <div style={{ width: "90px", textAlign: "right" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: isPositive ? "#22C55E" : "#EF4444" }}>{wallet.pnl24h}</div>
        <div style={{ fontSize: "9px", fontFamily: "monospace", color: isPositive ? "#22C55E" : "#EF4444" }}>{isPositive ? "+" : ""}{wallet.pnl24hPct}%</div>
      </div>
      <div style={{ width: "65px", textAlign: "right" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: wallet.winRate >= 75 ? "#22C55E" : wallet.winRate >= 65 ? "#F59E0B" : "#EF4444" }}>{wallet.winRate}%</div>
      </div>
      <div style={{ width: "80px", textAlign: "right", fontSize: "10px", color: "#7B8BA8" }}>{wallet.avgHoldTime}</div>
    </div>
  );
});

// ── Top Traders Tab ──

function TopTradersTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🏆</span>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>Top Traders (24h)</span>
          <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>LIVE RANKINGS</span>
        </div>
      </div>
      {/* Column Headers */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 12px", fontSize: "9px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <div style={{ width: "24px" }}></div>
        <div style={{ flex: 1, minWidth: 0 }}>Trader</div>
        <div style={{ width: "90px", textAlign: "right" }}>24h PnL</div>
        <div style={{ width: "60px", textAlign: "right" }}>Trades</div>
        <div style={{ width: "65px", textAlign: "right" }}>Win Rate</div>
        <div style={{ width: "80px", textAlign: "right" }}>Avg PnL</div>
        <div style={{ width: "100px", textAlign: "right" }}>Best Trade</div>
        <div style={{ width: "50px", textAlign: "right" }}>Streak</div>
      </div>
      {TOP_TRADERS.map((t) => (
        <TopTraderRow key={t.id} trader={t} />
      ))}
    </div>
  );
}

const TopTraderRow = memo(function TopTraderRow({ trader }: { trader: TopTrader }) {
  const isPositive = trader.pnl24hPct >= 0;
  const rankBg = trader.rank === 1 ? "rgba(245,158,11,0.2)" : trader.rank === 2 ? "rgba(148,163,184,0.15)" : trader.rank === 3 ? "rgba(180,83,9,0.15)" : "rgba(255,255,255,0.04)";
  const rankColor = trader.rank === 1 ? "#F59E0B" : trader.rank === 2 ? "#94A3B8" : trader.rank === 3 ? "#B45309" : "#7B8BA8";
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "8px",
        background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer", transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2438"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#161b2e"; }}
    >
      <div style={{ width: "24px" }}>
        <span style={{ fontSize: trader.rank <= 3 ? "14px" : "9px", fontWeight: 700, padding: trader.rank <= 3 ? "0" : "2px 6px", borderRadius: "4px", background: trader.rank <= 3 ? "transparent" : "rgba(255,255,255,0.04)", color: rankColor, fontFamily: "monospace" }}>
          {trader.rank <= 3 ? medals[trader.rank - 1] : `#${trader.rank}`}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{trader.wallet}</span>
          <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>{trader.label}</span>
        </div>
      </div>
      <div style={{ width: "90px", textAlign: "right" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: isPositive ? "#22C55E" : "#EF4444" }}>{trader.pnl24h}</div>
        <div style={{ fontSize: "9px", fontFamily: "monospace", color: isPositive ? "#22C55E" : "#EF4444" }}>{isPositive ? "+" : ""}{trader.pnl24hPct}%</div>
      </div>
      <div style={{ width: "60px", textAlign: "right", fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>{trader.totalTrades}</div>
      <div style={{ width: "65px", textAlign: "right" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: trader.winRate >= 75 ? "#22C55E" : trader.winRate >= 65 ? "#F59E0B" : "#EF4444" }}>{trader.winRate}%</div>
      </div>
      <div style={{ width: "80px", textAlign: "right", fontSize: "11px", fontWeight: 600, fontFamily: "monospace", color: "#F0F4FC" }}>{trader.avgPnl}</div>
      <div style={{ width: "100px", textAlign: "right", fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8" }}>{trader.bestTrade}</div>
      <div style={{ width: "50px", textAlign: "right" }}>
        <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: trader.streak >= 5 ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.12)", color: trader.streak >= 5 ? "#22C55E" : "#F59E0B", fontWeight: 700 }}>
          🔥 {trader.streak}
        </span>
      </div>
    </div>
  );
});

// ── Watchlist Tab ──

function WatchlistTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>👀</span>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>Token Watchlist</span>
          <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}>{WATCHLIST.length} tokens</span>
        </div>
      </div>
      {/* Column Headers */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 12px", fontSize: "9px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <div style={{ width: "32px" }}></div>
        <div style={{ flex: 1, minWidth: 0 }}>Token</div>
        <div style={{ width: "90px", textAlign: "right" }}>Price</div>
        <div style={{ width: "70px", textAlign: "right" }}>24h</div>
        <div style={{ width: "70px", textAlign: "right" }}>1h</div>
        <div style={{ width: "80px", textAlign: "right" }}>Volume</div>
        <div style={{ width: "80px", textAlign: "right" }}>Mkt Cap</div>
        <div style={{ width: "70px", textAlign: "right" }}>Alert</div>
      </div>
      {WATCHLIST.map((t) => (
        <WatchlistRow key={t.id} token={t} />
      ))}
    </div>
  );
}

const WatchlistRow = memo(function WatchlistRow({ token }: { token: WatchlistToken }) {
  const alertConfig = {
    none: { bg: "transparent", color: "#4A5568", label: "—" },
    above: { bg: "rgba(59,130,246,0.12)", color: "#60A5FA", label: `> ${token.alertPrice}` },
    below: { bg: "rgba(239,68,68,0.12)", color: "#EF4444", label: `< ${token.alertPrice}` },
    breakout: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", label: "BREAK" },
  }[token.alertStatus];

  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "8px",
        background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer", transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2438"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#161b2e"; }}
    >
      <div style={{ width: "32px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: token.change24h >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: token.change24h >= 0 ? "#22C55E" : "#EF4444" }}>
          {token.symbol.slice(0, 2)}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>{token.symbol}</span>
          <span style={{ fontSize: "9px", color: "#4A5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>{token.name}</span>
        </div>
        <div style={{ fontSize: "9px", color: "#4A5568", marginTop: "1px" }}>{token.notes}</div>
      </div>
      <div style={{ width: "90px", textAlign: "right", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#F0F4FC" }}>{token.price}</div>
      <div style={{ width: "70px", textAlign: "right", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: token.change24h >= 0 ? "#22C55E" : "#EF4444" }}>
        {token.change24h >= 0 ? "+" : ""}{token.change24h}%
      </div>
      <div style={{ width: "70px", textAlign: "right", fontSize: "10px", fontWeight: 600, fontFamily: "monospace", color: token.change1h >= 0 ? "#22C55E" : "#EF4444" }}>
        {token.change1h >= 0 ? "+" : ""}{token.change1h}%
      </div>
      <div style={{ width: "80px", textAlign: "right", fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8" }}>{token.volume24h}</div>
      <div style={{ width: "80px", textAlign: "right", fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8" }}>{token.marketCap}</div>
      <div style={{ width: "70px", textAlign: "right" }}>
        <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: alertConfig.bg, color: alertConfig.color }}>
          {alertConfig.label}
        </span>
      </div>
    </div>
  );
});