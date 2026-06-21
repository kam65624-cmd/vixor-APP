"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  Wallet,
  Send,
  ArrowDownLeft,
  ArrowLeftRight,
  Copy,
  ExternalLink,
  Trophy,
  Star,
  Zap,
  Target,
  Gem,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useState, useCallback, memo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type WalletTab = "holdings" | "activity" | "achievements";

interface Holding {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change24h: number;
  icon: string;
}

interface TxnItem {
  id: string;
  type: "send" | "receive" | "swap";
  asset: string;
  amount: string;
  value: string;
  time: string;
  status: "confirmed" | "pending";
  address: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  rarity: "common" | "rare" | "legendary";
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_HOLDINGS: Holding[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: "2.4521",
    value: "$8,432.18",
    change24h: 3.2,
    icon: "Ξ",
  },
  {
    symbol: "PEPE",
    name: "Pepe",
    balance: "45,200,000",
    value: "$557.77",
    change24h: 15.3,
    icon: "🐸",
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    balance: "1,200",
    value: "$2,940.00",
    change24h: 22.1,
    icon: "🐕",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: "5,000.00",
    value: "$5,000.00",
    change24h: 0,
    icon: "$",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    balance: "25,000",
    value: "$3,112.50",
    change24h: -3.2,
    icon: "🐶",
  },
];

const MOCK_TXNS: TxnItem[] = [
  {
    id: "1",
    type: "swap",
    asset: "ETH → PEPE",
    amount: "0.5 ETH",
    value: "$1,720.00",
    time: "2 min ago",
    status: "confirmed",
    address: "0x7xKf...3mWd",
  },
  {
    id: "2",
    type: "receive",
    asset: "ETH",
    amount: "1.0 ETH",
    value: "$3,440.00",
    time: "1 hour ago",
    status: "confirmed",
    address: "0x4pQn...8vRe",
  },
  {
    id: "3",
    type: "send",
    asset: "USDC",
    amount: "500 USDC",
    value: "$500.00",
    time: "3 hours ago",
    status: "confirmed",
    address: "0x9mLt...2jXc",
  },
  {
    id: "4",
    type: "swap",
    asset: "USDC → WIF",
    amount: "1,000 USDC",
    value: "$1,000.00",
    time: "5 hours ago",
    status: "confirmed",
    address: "Uniswap V3",
  },
  {
    id: "5",
    type: "receive",
    asset: "DOGE",
    amount: "10,000 DOGE",
    value: "$1,245.00",
    time: "1 day ago",
    status: "confirmed",
    address: "0x2rWs...6kNp",
  },
  {
    id: "6",
    type: "send",
    asset: "ETH",
    amount: "0.2 ETH",
    value: "$688.00",
    time: "2 days ago",
    status: "confirmed",
    address: "0x5tYg...1bHq",
  },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    title: "First Trade",
    description: "Execute your first swap",
    icon: Zap,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "2",
    title: "Diamond Hands",
    description: "Hold a token for 30+ days",
    icon: Gem,
    unlocked: true,
    rarity: "rare",
  },
  {
    id: "3",
    title: "Smart Money",
    description: "Follow a smart money wallet",
    icon: Target,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "4",
    title: "DeFi Explorer",
    description: "Use 5 different DEXes",
    icon: Shield,
    unlocked: false,
    rarity: "rare",
  },
  {
    id: "5",
    title: "Whale Status",
    description: "Portfolio exceeds $50K",
    icon: Trophy,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: "6",
    title: "Early Bird",
    description: "Buy a token in its first hour",
    icon: Star,
    unlocked: true,
    rarity: "rare",
  },
];

const WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const TOTAL_BALANCE = "$20,042.45";
const CHAIN = "Ethereum";

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/wallet-web3")({
  head: () => ({ meta: [{ title: "Wallet — Vixor Web3 Terminal" }] }),
  component: WalletWeb3Page,
});

// ── Wallet Header ──────────────────────────────────────────────────────────

const WalletHeader = memo(function WalletHeader() {
  const truncatedAddress = `${WALLET_ADDRESS.slice(0, 6)}...${WALLET_ADDRESS.slice(-4)}`;

  const handleCopy = useCallback(() => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(WALLET_ADDRESS);
    }
  }, []);

  return (
    <div
      className="p-4 sm:p-6"
      style={{
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Wallet Icon */}
        <div
          className="size-12 sm:size-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(59,130,246,0.15)" }}
        >
          <Wallet className="size-6 sm:size-7" style={{ color: "#3B82F6" }} />
        </div>

        <div className="flex-1">
          {/* Address Row */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{
                color: "#F0F4FC",
                fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              }}
            >
              {truncatedAddress}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded transition-colors"
              style={{ color: "#7B8BA8" }}
              aria-label="Copy address"
            >
              <Copy className="size-3" />
            </button>
            <button
              className="p-1 rounded transition-colors"
              style={{ color: "#7B8BA8" }}
              aria-label="View on explorer"
            >
              <ExternalLink className="size-3" />
            </button>
          </div>
          {/* Chain Badge */}
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1"
            style={{
              backgroundColor: "rgba(59,130,246,0.15)",
              color: "#3B82F6",
            }}
          >
            {CHAIN}
          </span>
        </div>

        {/* Balance & Actions */}
        <div className="sm:text-right">
          <div
            className="text-2xl sm:text-3xl font-bold"
            style={{
              color: "#F0F4FC",
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
            }}
          >
            {TOTAL_BALANCE}
          </div>
          <div className="flex items-center gap-2 mt-2 sm:justify-end">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: "#3B82F6",
                color: "#fff",
              }}
            >
              <Send className="size-3.5" /> Send
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#F0F4FC",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ArrowDownLeft className="size-3.5" /> Receive
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#F0F4FC",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <ArrowLeftRight className="size-3.5" /> Swap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Holdings Grid ──────────────────────────────────────────────────────────

const HoldingsGrid = memo(function HoldingsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {MOCK_HOLDINGS.map((holding) => {
        const isPositive = holding.change24h >= 0;
        const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        return (
          <div
            key={holding.symbol}
            className="p-4 cursor-pointer transition-colors"
            style={{
              backgroundColor: "#111827",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                {holding.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: "#F0F4FC" }}>
                    {holding.symbol}
                  </span>
                  <span
                    className="flex items-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: isPositive ? "#22C55E" : "#EF4444" }}
                  >
                    <ChangeIcon className="size-3" />
                    {isPositive ? "+" : ""}
                    {holding.change24h}%
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: "#7B8BA8" }}>
                  {holding.name}
                </span>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className="text-[11px]"
                    style={{
                      color: "#7B8BA8",
                      fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                    }}
                  >
                    {holding.balance}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: "#F0F4FC",
                      fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                    }}
                  >
                    {holding.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ── Activity Timeline ──────────────────────────────────────────────────────

const ActivityTimeline = memo(function ActivityTimeline() {
  const typeIcons = {
    send: ArrowUpRight,
    receive: ArrowDownLeft,
    swap: ArrowLeftRight,
  } as const;

  return (
    <div className="relative space-y-0">
      {/* Timeline Line */}
      <div
        className="absolute left-5 top-4 bottom-4 w-px"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      {MOCK_TXNS.map((txn) => {
        const Icon = typeIcons[txn.type];
        const StatusIcon = txn.status === "confirmed" ? CheckCircle2 : Clock;
        const isConfirmed = txn.status === "confirmed";

        return (
          <div key={txn.id} className="flex gap-3 py-3 relative">
            {/* Icon */}
            <div
              className="relative z-10 size-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <Icon
                className="size-4"
                style={{
                  color:
                    txn.type === "send"
                      ? "#EF4444"
                      : txn.type === "receive"
                        ? "#22C55E"
                        : "#3B82F6",
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize" style={{ color: "#F0F4FC" }}>
                  {txn.type}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusIcon
                    className="size-3"
                    style={{ color: isConfirmed ? "#22C55E" : "#F59E0B" }}
                  />
                  <span className="text-[10px]" style={{ color: "#7B8BA8" }}>
                    {txn.time}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: "#F0F4FC",
                    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                  }}
                >
                  {txn.amount}
                </span>
                <span className="text-[10px]" style={{ color: "#7B8BA8" }}>
                  &middot;
                </span>
                <span
                  className="text-[11px]"
                  style={{
                    color: "#7B8BA8",
                    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                  }}
                >
                  {txn.value}
                </span>
              </div>
              <span
                className="text-[10px] mt-0.5 block"
                style={{
                  color: "#4A5568",
                  fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                }}
              >
                {txn.address}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ── Achievements Grid ──────────────────────────────────────────────────────

const AchievementsGrid = memo(function AchievementsGrid() {
  const rarityColors = {
    common: {
      bg: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.06)",
      text: "#7B8BA8",
      label: "Common",
    },
    rare: {
      bg: "rgba(32,129,226,0.1)",
      border: "rgba(32,129,226,0.25)",
      text: "#3B82F6",
      label: "Rare",
    },
    legendary: {
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.25)",
      text: "#F59E0B",
      label: "Legendary",
    },
  } as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {MOCK_ACHIEVEMENTS.map((ach) => {
        const Icon = ach.icon;
        const rarity = rarityColors[ach.rarity];

        return (
          <div
            key={ach.id}
            className="p-4 text-center transition-colors"
            style={{
              backgroundColor: ach.unlocked ? rarity.bg : "#111827",
              border: `1px solid ${ach.unlocked ? rarity.border : "rgba(255,255,255,0.06)"}`,
              borderRadius: "12px",
              opacity: ach.unlocked ? 1 : 0.4,
            }}
          >
            <div
              className="size-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: ach.unlocked ? rarity.bg : "rgba(255,255,255,0.05)" }}
            >
              <Icon
                className="size-5"
                style={{
                  color: ach.unlocked ? rarity.text : "#4A5568",
                }}
              />
            </div>
            <div className="text-xs font-bold mb-0.5" style={{ color: "#F0F4FC" }}>
              {ach.title}
            </div>
            <div className="text-[10px]" style={{ color: "#7B8BA8" }}>
              {ach.description}
            </div>
            <div className="mt-1.5">
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: rarity.bg,
                  color: rarity.text,
                  border: `1px solid ${rarity.border}`,
                }}
              >
                {rarity.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────

function WalletWeb3Page() {
  const [activeTab, setActiveTab] = useState<WalletTab>("holdings");

  const handleTabChange = useCallback((tab: WalletTab) => setActiveTab(tab), []);

  const TABS: { id: WalletTab; label: string }[] = [
    { id: "holdings", label: "Holdings" },
    { id: "activity", label: "Activity" },
    { id: "achievements", label: "Achievements" },
  ];

  return (
    <div className="space-y-4" style={{ backgroundColor: "#0A0E1A", color: "#F0F4FC" }}>
      {/* Wallet Header */}
      <WalletHeader />

      {/* Tabs */}
      <div
        className="flex items-center gap-0.5 p-1"
        style={{
          backgroundColor: "#111827",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? "rgba(59,130,246,0.15)" : "transparent",
              color: activeTab === tab.id ? "#60A5FA" : "#7B8BA8",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "holdings" && <HoldingsGrid />}
      {activeTab === "activity" && <ActivityTimeline />}
      {activeTab === "achievements" && <AchievementsGrid />}
    </div>
  );
}
