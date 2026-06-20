"use client";

import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Droplets,
  ArrowUpRight,
  ArrowDownLeft,
  Keyboard,
  CandlestickChart,
  Info,
} from "lucide-react";
import { useState, useCallback, memo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type Timeframe = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W";
type BottomTab = "trades" | "positions" | "orders" | "holders";
type OrderSide = "buy" | "sell";

interface TradeItem {
  id: string;
  side: "buy" | "sell";
  price: string;
  amount: string;
  time: string;
  wallet: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_TRADES: TradeItem[] = [
  {
    id: "1",
    side: "buy",
    price: "$0.00001234",
    amount: "5,000,000",
    time: "2s ago",
    wallet: "7xKf...3mWd",
  },
  {
    id: "2",
    side: "sell",
    price: "$0.00001231",
    amount: "2,100,000",
    time: "5s ago",
    wallet: "4pQn...8vRe",
  },
  {
    id: "3",
    side: "buy",
    price: "$0.00001230",
    amount: "10,000,000",
    time: "8s ago",
    wallet: "9mLt...2jXc",
  },
  {
    id: "4",
    side: "buy",
    price: "$0.00001228",
    amount: "1,500,000",
    time: "12s ago",
    wallet: "2rWs...6kNp",
  },
  {
    id: "5",
    side: "sell",
    price: "$0.00001225",
    amount: "8,300,000",
    time: "15s ago",
    wallet: "5tYg...1bHq",
  },
  {
    id: "6",
    side: "buy",
    price: "$0.00001220",
    amount: "3,200,000",
    time: "20s ago",
    wallet: "8vCx...4dFm",
  },
  {
    id: "7",
    side: "sell",
    price: "$0.00001218",
    amount: "6,700,000",
    time: "25s ago",
    wallet: "1nBj...9aKs",
  },
];

const TOKEN_DATA: Record<
  string,
  { name: string; price: string; change: number; volume: string; liquidity: string }
> = {
  PEPE: { name: "Pepe", price: "$0.00001234", change: 15.3, volume: "$89.4M", liquidity: "$120M" },
  DOGE: { name: "Dogecoin", price: "$0.1245", change: -3.2, volume: "$1.2B", liquidity: "$8.5B" },
  WIF: { name: "dogwifhat", price: "$2.45", change: 22.1, volume: "$340M", liquidity: "$180M" },
};

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/token/$symbol")({
  head: () => ({ meta: [{ title: "Token — Vixor Web3 Terminal" }] }),
  component: TokenPage,
});

// ── Timeframe Bar ──────────────────────────────────────────────────────────

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

interface TimeframeBarProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
}

const TimeframeBar = memo(function TimeframeBar({ active, onChange }: TimeframeBarProps) {
  return (
    <div className="flex items-center gap-0.5">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors"
          style={{
            backgroundColor:
              active === tf ? "var(--ws-accent-dim, rgba(0,212,170,0.12))" : "transparent",
            color: active === tf ? "var(--ws-accent)" : "var(--ws-text-secondary)",
          }}
        >
          {tf}
        </button>
      ))}
    </div>
  );
});

// ── Chart Placeholder ──────────────────────────────────────────────────────

const ChartPlaceholder = memo(function ChartPlaceholder() {
  return (
    <div
      className="w-full flex-1 flex flex-col items-center justify-center min-h-[320px] lg:min-h-0"
      style={{
        backgroundColor: "var(--ws-bg-secondary, var(--ws-surface))",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <CandlestickChart
        className="size-10 mb-3"
        style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
      />
      <p className="text-sm font-semibold" style={{ color: "var(--ws-text-secondary)" }}>
        Chart — lightweight-charts
      </p>
      <p
        className="text-[11px] mt-1"
        style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
      >
        Candlestick chart rendering will be connected in Phase B
      </p>
      {/* Fake candlestick bars for visual flavor */}
      <div className="flex items-end gap-1 mt-6 h-24">
        {[40, 65, 30, 80, 55, 90, 45, 70, 35, 85, 60, 95, 50, 75, 42, 88, 58, 72, 38, 82].map(
          (h, i) => (
            <div
              key={i}
              className="w-2 rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor: i % 3 === 0 ? "var(--ws-bearish)" : "var(--ws-bullish)",
                opacity: 0.5,
              }}
            />
          ),
        )}
      </div>
    </div>
  );
});

// ── Order Book Placeholder ─────────────────────────────────────────────────

const OrderBookPlaceholder = memo(function OrderBookPlaceholder() {
  const asks = [
    { price: "0.00001240", amount: "2.4M", total: "48.2%" },
    { price: "0.00001238", amount: "1.8M", total: "36.2%" },
    { price: "0.00001236", amount: "3.1M", total: "62.3%" },
    { price: "0.00001235", amount: "900K", total: "18.1%" },
    { price: "0.00001234", amount: "5.0M", total: "100%" },
  ];
  const bids = [
    { price: "0.00001233", amount: "1.2M", total: "24.0%" },
    { price: "0.00001230", amount: "4.5M", total: "90.1%" },
    { price: "0.00001228", amount: "2.8M", total: "56.2%" },
    { price: "0.00001225", amount: "6.3M", total: "100%" },
    { price: "0.00001220", amount: "3.7M", total: "74.1%" },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: "var(--ws-border)" }}>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--ws-text-secondary)" }}
        >
          Order Book
        </span>
      </div>
      <div
        className="px-3 py-1.5 grid grid-cols-3 text-[9px] font-bold uppercase tracking-wider"
        style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
      >
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>
      {/* Asks (reversed — lowest at bottom) */}
      <div className="space-y-px px-3">
        {[...asks].reverse().map((row, i) => (
          <div
            key={`a-${i}`}
            className="grid grid-cols-3 py-1 text-[11px] relative"
            style={{ fontFamily: "var(--ws-mono-font-family, monospace)" }}
          >
            <div
              className="absolute inset-0 opacity-10 rounded"
              style={{ backgroundColor: "var(--ws-bearish)", width: row.total }}
            />
            <span className="relative" style={{ color: "var(--ws-bearish)" }}>
              {row.price}
            </span>
            <span className="relative text-right" style={{ color: "var(--ws-text-secondary)" }}>
              {row.amount}
            </span>
            <span
              className="relative text-right"
              style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
            >
              {row.total}
            </span>
          </div>
        ))}
      </div>
      {/* Spread */}
      <div className="px-3 py-1.5 text-center border-y" style={{ borderColor: "var(--ws-border)" }}>
        <span
          className="text-sm font-bold"
          style={{ color: "var(--ws-accent)", fontFamily: "var(--ws-mono-font-family, monospace)" }}
        >
          0.00001234
        </span>
      </div>
      {/* Bids */}
      <div className="space-y-px px-3 pb-3">
        {bids.map((row, i) => (
          <div
            key={`b-${i}`}
            className="grid grid-cols-3 py-1 text-[11px] relative"
            style={{ fontFamily: "var(--ws-mono-font-family, monospace)" }}
          >
            <div
              className="absolute inset-0 opacity-10 rounded"
              style={{ backgroundColor: "var(--ws-bullish)", width: row.total }}
            />
            <span className="relative" style={{ color: "var(--ws-bullish)" }}>
              {row.price}
            </span>
            <span className="relative text-right" style={{ color: "var(--ws-text-secondary)" }}>
              {row.amount}
            </span>
            <span
              className="relative text-right"
              style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
            >
              {row.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Order Entry ────────────────────────────────────────────────────────────

interface OrderEntryProps {
  side: OrderSide;
  onSideChange: (side: OrderSide) => void;
  symbol: string;
}

const OrderEntry = memo(function OrderEntry({ side, onSideChange, symbol }: OrderEntryProps) {
  const [amount, setAmount] = useState("");

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  }, []);

  return (
    <div
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: "var(--ws-border)" }}>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--ws-text-secondary)" }}
        >
          Place Order
        </span>
      </div>
      <div className="p-3 space-y-3">
        {/* Buy/Sell Toggle */}
        <div
          className="grid grid-cols-2 gap-1 p-1"
          style={{
            backgroundColor: "var(--ws-bg-secondary, var(--ws-surface))",
            borderRadius: "var(--ws-radius)",
          }}
        >
          <button
            onClick={() => onSideChange("buy")}
            className="py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: side === "buy" ? "var(--ws-bullish)" : "transparent",
              color: side === "buy" ? "#fff" : "var(--ws-text-secondary)",
            }}
          >
            Buy
          </button>
          <button
            onClick={() => onSideChange("sell")}
            className="py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: side === "sell" ? "var(--ws-bearish)" : "transparent",
              color: side === "sell" ? "#fff" : "var(--ws-text-secondary)",
            }}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label
            className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
            style={{ color: "var(--ws-text-secondary)" }}
          >
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors placeholder:opacity-30"
            style={{
              backgroundColor: "var(--ws-bg-secondary, var(--ws-surface))",
              border: "1px solid var(--ws-border)",
              color: "var(--ws-text-primary)",
              fontFamily: "var(--ws-mono-font-family, monospace)",
            }}
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {["25%", "50%", "75%", "MAX"].map((pct) => (
            <button
              key={pct}
              onClick={() => setAmount(pct === "MAX" ? "10000000" : pct)}
              className="py-1.5 rounded text-[10px] font-bold transition-colors"
              style={{
                backgroundColor: "var(--ws-surface-hover)",
                color: "var(--ws-text-secondary)",
                border: "1px solid var(--ws-border)",
              }}
            >
              {pct}
            </button>
          ))}
        </div>

        {/* Execute Button */}
        <button
          className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
          style={{
            backgroundColor: side === "buy" ? "var(--ws-bullish)" : "var(--ws-bearish)",
            color: "#fff",
            borderRadius: "var(--ws-radius)",
          }}
        >
          {side === "buy" ? (
            <span className="flex items-center justify-center gap-1.5">
              <ArrowUpRight className="size-4" /> Buy {symbol}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <ArrowDownLeft className="size-4" /> Sell {symbol}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});

// ── Side Panel ─────────────────────────────────────────────────────────────

const SidePanel = memo(function SidePanel() {
  const hotkeys = [
    { key: "B", action: "Buy" },
    { key: "S", action: "Sell" },
    { key: "1-7", action: "Timeframes" },
    { key: "F", action: "Fullscreen Chart" },
    { key: "Esc", action: "Close Panel" },
    { key: "Ctrl+K", action: "Command Palette" },
  ];

  return (
    <div className="space-y-3">
      {/* Hotkeys */}
      <div
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          borderRadius: "var(--ws-radius)",
        }}
      >
        <div
          className="px-3 py-2 border-b flex items-center gap-1.5"
          style={{ borderColor: "var(--ws-border)" }}
        >
          <Keyboard className="size-3" style={{ color: "var(--ws-accent)" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--ws-text-secondary)" }}
          >
            Hotkeys
          </span>
        </div>
        <div className="p-3 space-y-1.5">
          {hotkeys.map((h) => (
            <div key={h.key} className="flex items-center justify-between text-[11px]">
              <span style={{ color: "var(--ws-text-secondary)" }}>{h.action}</span>
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  backgroundColor: "var(--ws-surface-hover)",
                  color: "var(--ws-accent)",
                  border: "1px solid var(--ws-border)",
                  fontFamily: "var(--ws-mono-font-family, monospace)",
                }}
              >
                {h.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Token Info */}
      <div
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          borderRadius: "var(--ws-radius)",
        }}
      >
        <div
          className="px-3 py-2 border-b flex items-center gap-1.5"
          style={{ borderColor: "var(--ws-border)" }}
        >
          <Info className="size-3" style={{ color: "var(--ws-accent)" }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--ws-text-secondary)" }}
          >
            Token Info
          </span>
        </div>
        <div className="p-3 space-y-2.5 text-[11px]">
          <div className="flex justify-between">
            <span style={{ color: "var(--ws-text-secondary)" }}>Network</span>
            <span className="font-semibold" style={{ color: "var(--ws-text-primary)" }}>
              Ethereum
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--ws-text-secondary)" }}>Created</span>
            <span style={{ color: "var(--ws-text-primary)" }}>Apr 2023</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--ws-text-secondary)" }}>Holders</span>
            <span style={{ color: "var(--ws-text-primary)" }}>245K+</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--ws-text-secondary)" }}>Txns 24h</span>
            <span style={{ color: "var(--ws-text-primary)" }}>18.2K</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Bottom Tabs Content ────────────────────────────────────────────────────

const BOTTOM_TABS: { id: BottomTab; label: string }[] = [
  { id: "trades", label: "Trades" },
  { id: "positions", label: "Positions" },
  { id: "orders", label: "Orders" },
  { id: "holders", label: "Holders" },
];

interface TradesTabProps {
  trades: TradeItem[];
}

const TradesTab = memo(function TradesTab({ trades }: TradesTabProps) {
  return (
    <div className="max-h-48 overflow-y-auto">
      <div
        className="px-3 py-1.5 grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider sticky top-0"
        style={{
          color: "var(--ws-text-tertiary, var(--ws-text-secondary))",
          backgroundColor: "var(--ws-surface)",
        }}
      >
        <span>Side</span>
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="px-3 grid grid-cols-4 py-1.5 text-[11px] border-b"
          style={{
            borderColor: "var(--ws-border)",
            fontFamily: "var(--ws-mono-font-family, monospace)",
          }}
        >
          <span
            className="font-bold uppercase"
            style={{ color: trade.side === "buy" ? "var(--ws-bullish)" : "var(--ws-bearish)" }}
          >
            {trade.side}
          </span>
          <span style={{ color: "var(--ws-text-primary)" }}>{trade.price}</span>
          <span className="text-right" style={{ color: "var(--ws-text-secondary)" }}>
            {trade.amount}
          </span>
          <span
            className="text-right"
            style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
          >
            {trade.time}
          </span>
        </div>
      ))}
    </div>
  );
});

const PlaceholderTab = memo(function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-xs" style={{ color: "var(--ws-text-secondary)" }}>
        {label} data will appear here
      </p>
    </div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────

function TokenPage() {
  const { symbol } = useParams({ strict: false }) as { symbol: string };
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [activeTab, setActiveTab] = useState<BottomTab>("trades");
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");

  const token = TOKEN_DATA[symbol] ?? {
    name: symbol,
    price: "$0.00",
    change: 0,
    volume: "$0",
    liquidity: "$0",
  };

  const isPositive = token.change >= 0;
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  const handleTimeframeChange = useCallback((tf: Timeframe) => setTimeframe(tf), []);
  const handleTabChange = useCallback((tab: BottomTab) => setActiveTab(tab), []);
  const handleSideChange = useCallback((s: OrderSide) => setOrderSide(s), []);

  return (
    <div
      className="space-y-3"
      style={{ backgroundColor: "var(--ws-bg)", color: "var(--ws-text-primary)" }}
    >
      {/* Top Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3"
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          borderRadius: "var(--ws-radius)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: "var(--ws-accent-dim, rgba(0,212,170,0.12))",
              color: "var(--ws-accent)",
            }}
          >
            {symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/discover"
                className="text-[10px] font-medium hover:underline"
                style={{ color: "var(--ws-text-secondary)" }}
              >
                Discover
              </Link>
              <span
                className="text-[10px]"
                style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
              >
                /
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--ws-text-primary)" }}>
                {symbol}
              </span>
              <span className="text-xs" style={{ color: "var(--ws-text-secondary)" }}>
                {token.name}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span
                className="text-lg font-bold"
                style={{
                  color: "var(--ws-text-primary)",
                  fontFamily: "var(--ws-mono-font-family, monospace)",
                }}
              >
                {token.price}
              </span>
              <span
                className="flex items-center gap-0.5 text-xs font-semibold"
                style={{ color: isPositive ? "var(--ws-bullish)" : "var(--ws-bearish)" }}
              >
                <ChangeIcon className="size-3" />
                {isPositive ? "+" : ""}
                {token.change}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:ml-auto">
          <div className="flex items-center gap-1.5 text-[11px]">
            <BarChart3 className="size-3" style={{ color: "var(--ws-text-secondary)" }} />
            <span style={{ color: "var(--ws-text-secondary)" }}>Vol</span>
            <span
              className="font-semibold"
              style={{
                color: "var(--ws-text-primary)",
                fontFamily: "var(--ws-mono-font-family, monospace)",
              }}
            >
              {token.volume}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Droplets className="size-3" style={{ color: "var(--ws-text-secondary)" }} />
            <span style={{ color: "var(--ws-text-secondary)" }}>Liq</span>
            <span
              className="font-semibold"
              style={{
                color: "var(--ws-text-primary)",
                fontFamily: "var(--ws-mono-font-family, monospace)",
              }}
            >
              {token.liquidity}
            </span>
          </div>
        </div>
      </div>

      {/* Timeframe Bar */}
      <div className="flex items-center justify-between">
        <TimeframeBar active={timeframe} onChange={handleTimeframeChange} />
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3" style={{ minHeight: "400px" }}>
        {/* Left — Chart (3 cols = 60%) */}
        <div className="lg:col-span-3 flex flex-col">
          <ChartPlaceholder />
        </div>

        {/* Middle — Order Book + Order Entry (1 col = 20%) */}
        <div className="lg:col-span-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <OrderBookPlaceholder />
          </div>
          <OrderEntry side={orderSide} onSideChange={handleSideChange} symbol={symbol} />
        </div>

        {/* Right — Side Panel (1 col = 20%) */}
        <div className="lg:col-span-1 hidden lg:block">
          <SidePanel />
        </div>
      </div>

      {/* Bottom Tabs */}
      <div
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          borderRadius: "var(--ws-radius)",
        }}
      >
        <div className="flex border-b" style={{ borderColor: "var(--ws-border)" }}>
          {BOTTOM_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors relative"
              style={{
                color: activeTab === tab.id ? "var(--ws-accent)" : "var(--ws-text-secondary)",
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5"
                  style={{ backgroundColor: "var(--ws-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
        <div>
          {activeTab === "trades" && <TradesTab trades={MOCK_TRADES} />}
          {activeTab === "positions" && <PlaceholderTab label="Positions" />}
          {activeTab === "orders" && <PlaceholderTab label="Open orders" />}
          {activeTab === "holders" && <PlaceholderTab label="Top holders" />}
        </div>
      </div>
    </div>
  );
}
