"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Filter,
  ExternalLink,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────────────────────────

interface DiscoverToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change5m: number;
  change1h: number;
  volume24h: number;
  liquidity: number;
  smartMoneyPct: number;
  devWalletPct: number;
  whaleHoldingsPct: number;
  txCount24h: number;
  risk: "low" | "medium" | "high";
  chain: string;
  marketCap: number;
  paid: boolean;
  pumpfunLink?: string;
  raydiumLink?: string;
  twitterLink?: string;
  communityLink?: string;
  youtubeLink?: string;
  counter?: number;
}

// ── Mock Data — Solana Memecoins ────────────────────────────────────────────

const MOCK_TOKENS: DiscoverToken[] = [
  {
    symbol: "WIF", name: "dogwifhat", price: 2.45, change24h: 22.1, change5m: 1.2, change1h: 8.5,
    volume24h: 340_000_000, liquidity: 180_000_000, smartMoneyPct: 55, devWalletPct: 3, whaleHoldingsPct: 42,
    txCount24h: 28500, risk: "high", chain: "Solana", marketCap: 2_400_000_000, paid: false, counter: 45,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "BONK", name: "Bonk", price: 0.0000289, change24h: -1.5, change5m: -0.3, change1h: 2.1,
    volume24h: 210_000_000, liquidity: 95_000_000, smartMoneyPct: 18, devWalletPct: 1, whaleHoldingsPct: 28,
    txCount24h: 18200, risk: "medium", chain: "Solana", marketCap: 1_900_000_000, paid: false, counter: 26,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "POPCAT", name: "Popcat", price: 1.23, change24h: 33.7, change5m: 4.5, change1h: 15.2,
    volume24h: 95_000_000, liquidity: 28_000_000, smartMoneyPct: 71, devWalletPct: 8, whaleHoldingsPct: 55,
    txCount24h: 12400, risk: "high", chain: "Solana", marketCap: 1_200_000_000, paid: true, counter: 12,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "MEW", name: "cat in a dogs world", price: 0.0089, change24h: 45.6, change5m: 2.8, change1h: 18.3,
    volume24h: 78_000_000, liquidity: 42_000_000, smartMoneyPct: 62, devWalletPct: 5, whaleHoldingsPct: 48,
    txCount24h: 9800, risk: "high", chain: "Solana", marketCap: 580_000_000, paid: false, counter: 8,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "BRETT", name: "Brett", price: 0.156, change24h: -7.8, change5m: -1.2, change1h: -3.5,
    volume24h: 120_000_000, liquidity: 65_000_000, smartMoneyPct: 48, devWalletPct: 2, whaleHoldingsPct: 38,
    txCount24h: 15600, risk: "high", chain: "Solana", marketCap: 1_500_000_000, paid: true, counter: 33,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "MOG", name: "Mog Coin", price: 0.0000023, change24h: 5.2, change5m: 0.4, change1h: 2.8,
    volume24h: 45_000_000, liquidity: 38_000_000, smartMoneyPct: 31, devWalletPct: 1, whaleHoldingsPct: 22,
    txCount24h: 5200, risk: "medium", chain: "Solana", marketCap: 890_000_000, paid: false, counter: 15,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "TURBO", name: "Turbo", price: 0.0089, change24h: 45.6, change5m: 3.1, change1h: 12.7,
    volume24h: 78_000_000, liquidity: 42_000_000, smartMoneyPct: 62, devWalletPct: 4, whaleHoldingsPct: 51,
    txCount24h: 8900, risk: "high", chain: "Solana", marketCap: 580_000_000, paid: false, counter: 7,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "FLOKI", name: "Floki Inu", price: 0.000178, change24h: 12.4, change5m: 0.8, change1h: 5.3,
    volume24h: 290_000_000, liquidity: 150_000_000, smartMoneyPct: 22, devWalletPct: 2, whaleHoldingsPct: 30,
    txCount24h: 22100, risk: "low", chain: "Solana", marketCap: 1_700_000_000, paid: true, counter: 41,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "SPX", name: "SPX6900", price: 0.89, change24h: 18.9, change5m: 1.5, change1h: 7.2,
    volume24h: 56_000_000, liquidity: 35_000_000, smartMoneyPct: 45, devWalletPct: 1, whaleHoldingsPct: 36,
    txCount24h: 7300, risk: "medium", chain: "Solana", marketCap: 780_000_000, paid: false, counter: 19,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
  {
    symbol: "GOAT", name: "GOAT", price: 0.45, change24h: -12.3, change5m: -2.1, change1h: -5.8,
    volume24h: 185_000_000, liquidity: 72_000_000, smartMoneyPct: 38, devWalletPct: 6, whaleHoldingsPct: 44,
    txCount24h: 14200, risk: "high", chain: "Solana", marketCap: 450_000_000, paid: false, counter: 22,
    pumpfunLink: "https://pump.fun", raydiumLink: "https://raydium.io", twitterLink: "https://x.com",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(10)}`;
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  if (price < 100) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatTxCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor Terminal" }] }),
  component: DiscoverPage,
});

// ── Tabs Configuration ─────────────────────────────────────────────────────

const TOKEN_TABS = ["Top", "Trending", "Surge", "DEX Screener", "Pump Live"] as const;
const TIME_FRAMES = ["1m", "5m", "30m", "1h"] as const;

// ── Main Page ──────────────────────────────────────────────────────────────

function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [chain, setChain] = useState("Solana");
  const [activeTab, setActiveTab] = useState<string>("Trending");
  const [timeFrame, setTimeFrame] = useState<string>("5m");
  const [sortBy, setSortBy] = useState("volume");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [showLobby, setShowLobby] = useState(true);

  const { data: tokens, isLoading } = useQuery<DiscoverToken[]>({
    queryKey: ["discover-tokens", chain, sortBy, search],
    queryFn: async () => {
      try {
        // Primary: DexScreener (free, real-time Solana data)
        const params = new URLSearchParams({ chain: chain.toLowerCase(), sortBy, limit: "100" });
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/dexscreener?${params}`);
        const json = await res.json();
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data as DiscoverToken[];
        }
        // Fallback: Discovery pipeline
        const res2 = await fetch("/api/discover");
        const json2 = await res2.json();
        if (json2 && Array.isArray(json2.data)) return json2.data as DiscoverToken[];
        if (Array.isArray(json2)) return json2 as DiscoverToken[];
        return MOCK_TOKENS;
      } catch {
        return MOCK_TOKENS;
      }
    },
    refetchInterval: 60000,
  });

  const filteredTokens = (() => {
    if (!tokens) return [];
    let result = [...tokens];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
      );
    }
    switch (sortBy) {
      case "volume": result.sort((a, b) => b.volume24h - a.volume24h); break;
      case "change": result.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)); break;
      case "liquidity": result.sort((a, b) => b.liquidity - a.liquidity); break;
      case "smart": result.sort((a, b) => b.smartMoneyPct - a.smartMoneyPct); break;
      case "mcap": result.sort((a, b) => b.marketCap - a.marketCap); break;
    }
    return result;
  })();

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Multi-Pane Layout ── */}
      <div className="flex-1 flex" style={{ minHeight: "calc(100vh - 92px)" }}>
        {/* ── LEFT: Chart + Token Table ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TradingView Chart Area */}
          <div
            className="flex-shrink-0"
            style={{
              height: "280px",
              background: "#111827",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              position: "relative",
            }}
          >
            {/* Chart placeholder — TradingView would render here */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {selectedSymbol ? (
                <div className="text-center">
                  <div className="text-sm font-bold" style={{ color: "#F0F4FC" }}>{selectedSymbol}/SOL</div>
                  <div className="text-xs" style={{ color: "#7B8BA8" }}>TradingView Chart</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg mb-1">📊</div>
                  <div className="text-xs" style={{ color: "#4A5568" }}>Select a token to view chart</div>
                  <div className="text-[10px] mt-1" style={{ color: "#4A5568" }}>Or click any token below</div>
                </div>
              )}
            </div>

            {/* Chart controls overlay */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}>
                1D
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "#4A5568" }}>
                5D
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "#4A5568" }}>
                1M
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "#4A5568" }}>
                ALL
              </span>
            </div>
          </div>

          {/* ── Tab Bar + Time Frames + Filter ── */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-3 py-2"
            style={{
              background: "#0D1117",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {TOKEN_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                  style={{
                    background: activeTab === tab ? "rgba(59,130,246,0.15)" : "transparent",
                    color: activeTab === tab ? "#60A5FA" : "#7B8BA8",
                    border: activeTab === tab ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Time Frames */}
            <div className="flex items-center gap-1">
              {TIME_FRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors"
                  style={{
                    color: timeFrame === tf ? "#60A5FA" : "#4A5568",
                    background: timeFrame === tf ? "rgba(59,130,246,0.1)" : "transparent",
                  }}
                >
                  {tf}
                </button>
              ))}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
                style={{ color: "#7B8BA8", background: "rgba(255,255,255,0.05)" }}
              >
                <Filter className="size-3" />
                Filter
              </button>
            </div>
          </div>

          {/* ── Search Bar ── */}
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#4A5568" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] outline-none"
                  style={{
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#F0F4FC",
                  }}
                />
              </div>
              <button
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#7B8BA8" }}
                onClick={() => {
                  const order = sortBy === "volume" ? "change" : "volume";
                  setSortBy(order);
                }}
              >
                <ArrowUpDown className="size-3" />
                Sort
              </button>
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px]" style={{ color: "#22C55E" }}>
                <RefreshCw className="size-3" />
                30s
              </div>
            </div>
          </div>

          {/* ── Token Table Header ── */}
          <div
            className="flex items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              color: "#4A5568",
              background: "#0D1117",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ width: "180px" }}>Token</div>
            <div style={{ width: "80px", textAlign: "right" }}>Price</div>
            <div style={{ width: "70px", textAlign: "right" }}>MCap</div>
            <div style={{ width: "60px", textAlign: "right" }}>Change</div>
            <div style={{ width: "70px", textAlign: "right" }}>Liquidity</div>
            <div style={{ width: "70px", textAlign: "right" }}>Volume</div>
            <div style={{ width: "55px", textAlign: "right" }}>TXs</div>
            <div style={{ width: "40px", textAlign: "center" }}>Status</div>
            <div style={{ width: "35px", textAlign: "center" }}>🔗</div>
            <div style={{ width: "65px", textAlign: "center" }}>Action</div>
          </div>

          {/* ── Token Table Body ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-4 animate-spin" style={{ color: "#3B82F6" }} />
                  <span className="text-xs" style={{ color: "#7B8BA8" }}>Loading tokens...</span>
                </div>
              </div>
            ) : (
              filteredTokens.map((token, idx) => (
                <TokenRow
                  key={token.symbol}
                  token={token}
                  index={idx}
                  selected={selectedSymbol === token.symbol}
                  onSelect={() => setSelectedSymbol(selectedSymbol === token.symbol ? null : token.symbol)}
                />
              ))
            )}

            {filteredTokens.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="text-2xl mb-2">🔍</span>
                <span className="text-xs" style={{ color: "#7B8BA8" }}>No tokens match your search</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Social Lobby Panel ── */}
        {showLobby && (
          <div
            className="hidden lg:flex flex-col flex-shrink-0"
            style={{
              width: "280px",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              background: "#0D1117",
            }}
          >
            {/* Lobby Header */}
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <span className="text-sm">💬</span>
                <div>
                  <div className="text-[11px] font-bold" style={{ color: "#F0F4FC" }}>Trading Lobby</div>
                  <div className="text-[9px]" style={{ color: "#22C55E" }}>● 24 online</div>
                </div>
              </div>
              <button
                onClick={() => setShowLobby(false)}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ color: "#4A5568", background: "rgba(255,255,255,0.05)" }}
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
              <ChatMessage user="trader_sam" msg="Just took a bag of WIF at $2.40 🚀" time="2m" />
              <ChatMessage user="sol_whale" msg="POPCAT volume surging — looks like smart money accumulation" time="5m" />
              <ChatMessage user="memeking" msg="Anyone else seeing the BONK chart setup? Looks bullish to me" time="8m" />
              <ChatMessage user="defi_nina" msg="SPX breaking out on the 5m timeframe 🔥" time="12m" />
              <ChatMessage user="alpha_hunter" msg="New token on pump.fun looking interesting. Dev burned 80% of supply" time="15m" />
              <ChatMessage user="crypto_max" msg="GOAT getting wrecked right now. Cut losses early folks" time="18m" />
              <ChatMessage user="sol_degen" msg="TURBO just hit new ATH on low timeframes. watching closely" time="22m" />
            </div>

            {/* Chat Input */}
            <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-1.5 rounded-lg text-[11px] outline-none"
                  style={{
                    background: "#111827",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#F0F4FC",
                  }}
                />
                <button
                  className="px-2 py-1.5 rounded-lg text-[11px] font-bold"
                  style={{ background: "#3B82F6", color: "white" }}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Friends List */}
            <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4A5568" }}>Friends</span>
                <button className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "#3B82F6", background: "rgba(59,130,246,0.1)" }}>
                  + Add Friend
                </button>
              </div>
              <div className="flex items-center gap-2">
                {["👤", "👤", "👤"].map((avatar, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <span className="text-xs">{avatar}</span>
                    <div className="flex items-center gap-1">
                      <div className="size-1.5 rounded-full" style={{ background: "#22C55E" }} />
                      <span className="text-[9px]" style={{ color: "#7B8BA8" }}>
                        {["alex_sol", "jess_trade", "mark_d"][i]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Lobby Button (when closed) */}
        {!showLobby && (
          <button
            onClick={() => setShowLobby(true)}
            className="hidden lg:flex fixed items-center justify-center"
            style={{
              right: "8px",
              bottom: "60px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#3B82F6",
              color: "white",
              fontSize: "16px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
            }}
          >
            💬
          </button>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// TOKEN ROW — Dense data row like Axiom's token table
// ───────────────────────────────────────────────────────────────────────────

interface TokenRowProps {
  token: DiscoverToken;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

const TokenRow = memo(function TokenRow({ token, index, selected, onSelect }: TokenRowProps) {
  const isPositive = token.change24h >= 0;
  const changeColor = isPositive ? "#22C55E" : "#EF4444";

  return (
    <div
      onClick={onSelect}
      className="flex items-center px-3 py-2 text-[11px] cursor-pointer transition-colors"
      style={{
        background: selected ? "rgba(59,130,246,0.08)" : index % 2 === 0 ? "#0A0E1A" : "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      }}
    >
      {/* Token Name + Links */}
      <div className="flex items-center gap-2" style={{ width: "180px" }}>
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: "28px",
            height: "28px",
            background: "rgba(59,130,246,0.12)",
            fontSize: "9px",
            fontWeight: 800,
            color: "#60A5FA",
          }}
        >
          {token.symbol.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[11px] truncate" style={{ color: "#F0F4FC" }}>{token.symbol}</span>
            <span className="text-[9px] truncate" style={{ color: "#4A5568" }}>{token.name}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {token.twitterLink && <SocialIcon type="x" />}
            {token.pumpfunLink && <SocialIcon type="pump" />}
            {token.communityLink && <SocialIcon type="community" />}
            {token.youtubeLink && <SocialIcon type="youtube" />}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-right font-bold" style={{ width: "80px", color: "#F0F4FC", fontSize: "11px" }}>
        {formatPrice(token.price)}
      </div>

      {/* Market Cap */}
      <div className="text-right" style={{ width: "70px", color: "#7B8BA8", fontSize: "10px" }}>
        {formatLargeNum(token.marketCap)}
      </div>

      {/* Change */}
      <div className="text-right font-bold" style={{ width: "60px", color: changeColor, fontSize: "10px" }}>
        {isPositive ? "+" : ""}{token.change24h.toFixed(1)}%
      </div>

      {/* Liquidity */}
      <div className="text-right" style={{ width: "70px", color: "#7B8BA8", fontSize: "10px" }}>
        {formatLargeNum(token.liquidity)}
      </div>

      {/* Volume */}
      <div className="text-right" style={{ width: "70px", color: "#7B8BA8", fontSize: "10px" }}>
        {formatLargeNum(token.volume24h)}
      </div>

      {/* TXs */}
      <div className="text-right" style={{ width: "55px", color: "#7B8BA8", fontSize: "10px" }}>
        {formatTxCount(token.txCount24h)}
      </div>

      {/* On-chain metrics */}
      <div className="flex items-center justify-center" style={{ width: "40px" }}>
        <div className="flex items-center gap-0.5">
          <OnChainMetric value={token.whaleHoldingsPct} type="whale" />
          <OnChainMetric value={token.smartMoneyPct} type="smart" />
          <OnChainMetric value={token.devWalletPct} type="dev" />
        </div>
      </div>

      {/* Paid/Unpaid + Counter */}
      <div className="flex flex-col items-center" style={{ width: "35px" }}>
        <span
          className="text-[8px] font-bold px-1 rounded"
          style={{
            background: token.paid ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: token.paid ? "#22C55E" : "#EF4444",
          }}
        >
          {token.paid ? "Paid" : "Unpaid"}
        </span>
        {token.counter && (
          <span className="text-[8px] font-mono" style={{ color: "#4A5568" }}>{token.counter}</span>
        )}
      </div>

      {/* Action: Buy Button */}
      <div className="flex items-center justify-center gap-1" style={{ width: "65px" }}>
        <button
          className="px-2 py-0.5 rounded text-[9px] font-bold transition-colors"
          style={{
            background: "linear-gradient(135deg, #22C55E, #16A34A)",
            color: "white",
            border: "none",
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(token.raydiumLink || "https://raydium.io", "_blank");
          }}
        >
          Buy
        </button>
        <button
          className="px-2 py-0.5 rounded text-[9px] font-bold transition-colors"
          style={{
            background: "rgba(59,130,246,0.15)",
            color: "#60A5FA",
            border: "1px solid rgba(59,130,246,0.3)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(token.pumpfunLink || "https://pump.fun", "_blank");
          }}
        >
          Quick
        </button>
      </div>
    </div>
  );
});

// ───────────────────────────────────────────────────────────────────────────
// SOCIAL ICON — X / Pump.fun / Community / YouTube
// ───────────────────────────────────────────────────────────────────────────

function SocialIcon({ type }: { type: "x" | "pump" | "community" | "youtube" }) {
  const config = {
    x: { label: "𝕏", color: "#F0F4FC" },
    pump: { label: "🅿️", color: "#7B8BA8" },
    community: { label: "👥", color: "#7B8BA8" },
    youtube: { label: "▶", color: "#EF4444" },
  }[type];
  return <span style={{ fontSize: "9px" }}>{config.label}</span>;
}

// ───────────────────────────────────────────────────────────────────────────
// ON-CHAIN METRIC — Small colored indicator
// ───────────────────────────────────────────────────────────────────────────

function OnChainMetric({ value, type }: { value: number; type: "whale" | "smart" | "dev" }) {
  const config = {
    whale: { color: value > 40 ? "#3B82F6" : value > 20 ? "#F59E0B" : "#4A5568", label: "🐋" },
    smart: { color: value > 50 ? "#22C55E" : value > 25 ? "#F59E0B" : "#4A5568", label: "🧠" },
    dev: { color: value < 3 ? "#22C55E" : value < 6 ? "#F59E0B" : "#EF4444", label: "👨‍💻" },
  }[type];
  return (
    <span
      title={`${config.label} ${value}%`}
      className="rounded-sm"
      style={{
        fontSize: "8px",
        lineHeight: 1,
        width: "14px",
        height: "14px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: `${config.color}15`,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// CHAT MESSAGE — Social lobby message bubble
// ───────────────────────────────────────────────────────────────────────────

function ChatMessage({ user, msg, time }: { user: string; msg: string; time: string }) {
  return (
    <div className="group">
      <div className="flex items-start gap-2">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{ width: "22px", height: "22px", background: "rgba(59,130,246,0.12)", fontSize: "10px" }}
        >
          👤
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold" style={{ color: "#60A5FA" }}>{user}</span>
            <span className="text-[8px]" style={{ color: "#4A5568" }}>{time} ago</span>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "#C8D1E0" }}>
            {msg}
          </p>
        </div>
      </div>
    </div>
  );
}
