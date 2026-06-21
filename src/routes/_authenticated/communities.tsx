"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  MessageCircle,
  Hash,
  Globe,
  Send,
  TrendingUp,
  SmilePlus,
  Meh,
  Frown,
  ArrowRight,
  Clock,
  Flame,
} from "lucide-react";
import { useState, useCallback, memo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type CommunityTab = "overview" | "twitter" | "telegram" | "discord" | "reddit";

interface Mention {
  id: string;
  source: string;
  author: string;
  text: string;
  time: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface TrendingTicker {
  symbol: string;
  mentions: number;
  change: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_MENTIONS: Mention[] = [
  {
    id: "1",
    source: "Twitter",
    author: "@crypto_alpha",
    text: "PEPE breaking out of the accumulation zone. Smart money wallets accumulating heavily. This could be the next leg up.",
    time: "2m ago",
    sentiment: "positive",
  },
  {
    id: "2",
    source: "Telegram",
    author: "whale_alert",
    text: "Large WIF transfer detected: 5.2M tokens moved to a new wallet. Could be OTC deal.",
    time: "8m ago",
    sentiment: "neutral",
  },
  {
    id: "3",
    source: "Discord",
    author: "degentrader",
    text: "BONK chart looking bearish on the 4H. RSI divergence forming. Be careful here.",
    time: "15m ago",
    sentiment: "negative",
  },
  {
    id: "4",
    source: "Twitter",
    author: "@onchain_wizard",
    text: "DOGE whale activity up 340% in the last 24h. Something is brewing.",
    time: "22m ago",
    sentiment: "positive",
  },
  {
    id: "5",
    source: "Reddit",
    author: "u/satoshi_fan",
    text: "Has anyone noticed the SHIB burn rate spiking? Community engagement is at all-time highs.",
    time: "30m ago",
    sentiment: "positive",
  },
  {
    id: "6",
    source: "Telegram",
    author: "signal_bot",
    text: "TURBO liquidity added on Uniswap. New pool detected with 42 ETH initial liquidity.",
    time: "45m ago",
    sentiment: "neutral",
  },
  {
    id: "7",
    source: "Twitter",
    author: "@memecoin_king",
    text: "FLOKI ecosystem expanding with new DeFi features. Team seems to be building real utility.",
    time: "1h ago",
    sentiment: "positive",
  },
];

const MOCK_TRENDING: TrendingTicker[] = [
  { symbol: "PEPE", mentions: 2847, change: 15.3 },
  { symbol: "WIF", mentions: 1923, change: 22.1 },
  { symbol: "TURBO", mentions: 1456, change: 45.6 },
  { symbol: "POPCAT", mentions: 1102, change: 33.7 },
  { symbol: "DOGE", mentions: 987, change: -3.2 },
  { symbol: "BRETT", mentions: 856, change: -7.8 },
  { symbol: "SHIB", mentions: 743, change: 8.7 },
  { symbol: "BONK", mentions: 621, change: -1.5 },
];

const TABS: { id: CommunityTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "overview", label: "Overview", icon: Globe },
  { id: "twitter", label: "Twitter", icon: MessageCircle },
  { id: "telegram", label: "Telegram", icon: Send },
  { id: "discord", label: "Discord", icon: Hash },
  { id: "reddit", label: "Reddit", icon: MessageCircle },
];

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/communities")({
  head: () => ({ meta: [{ title: "Communities — Vixor Web3 Terminal" }] }),
  component: CommunitiesPage,
});

// ── Collection Header ──────────────────────────────────────────────────────

const CollectionHeader = memo(function CollectionHeader() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
      }}
    >
      {/* Cover Gradient */}
      <div
        className="h-28 sm:h-36"
        style={{
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, #111827 60%, rgba(34,197,94,0.1) 100%)",
        }}
      />
      {/* Content */}
      <div className="px-4 sm:px-6 pb-4 -mt-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div
            className="size-16 sm:size-20 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg"
            style={{
              backgroundColor: "#3B82F6",
              color: "#fff",
              border: "3px solid #111827",
            }}
          >
            V
          </div>
          <div className="flex-1">
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ color: "#F0F4FC" }}
            >
              Memecoin Community Hub
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#7B8BA8" }}>
              Real-time social sentiment across platforms
            </p>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-4 sm:gap-6">
            <StatItem icon={Users} label="Members" value="124K" />
            <StatItem icon={SmilePlus} label="Sentiment" value="72% Bullish" />
            <StatItem icon={Flame} label="Mentions" value="8.4K/24h" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Stat Item ──────────────────────────────────────────────────────────────

interface StatItemProps {
  icon: typeof Users;
  label: string;
  value: string;
}

const StatItem = memo(function StatItem({ icon: Icon, label, value }: StatItemProps) {
  return (
    <div className="flex flex-col items-center sm:items-end">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5" style={{ color: "#3B82F6" }} />
        <span className="text-sm font-bold" style={{ color: "#F0F4FC" }}>
          {value}
        </span>
      </div>
      <span className="text-[10px]" style={{ color: "#7B8BA8" }}>
        {label}
      </span>
    </div>
  );
});

// ── Sentiment Heatmap ──────────────────────────────────────────────────────

const SentimentHeatmap = memo(function SentimentHeatmap() {
  // Generate 24h of fake heatmap data (24 columns × 6 rows)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const rows = Array.from({ length: 6 }, (_, i) => i);

  const getHeatColor = (hour: number, row: number): string => {
    // Create a pseudo-random but deterministic pattern
    const seed = (hour * 7 + row * 13 + 3) % 100;
    if (seed < 25) return "rgba(239, 68, 68, 0.6)"; // bearish
    if (seed < 50) return "rgba(245, 158, 11, 0.4)"; // neutral-warn
    if (seed < 75) return "rgba(59, 130, 246, 0.3)"; // neutral
    return "rgba(34, 197, 94, 0.5)"; // bullish
  };

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="size-4" style={{ color: "#3B82F6" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F0F4FC" }}>
            Sentiment Heatmap — 24h
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px]" style={{ color: "#7B8BA8" }}>
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.6)" }}
            />{" "}
            Bearish
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ backgroundColor: "rgba(245, 158, 11, 0.4)" }}
            />{" "}
            Cautious
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-sm"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.5)" }}
            />{" "}
            Bullish
          </span>
        </div>
      </div>
      <div className="flex gap-px">
        {/* Y-axis labels */}
        <div className="flex flex-col gap-px mr-1.5 justify-around">
          {["22:00", "16:00", "10:00", "04:00"].map((label) => (
            <span
              key={label}
              className="text-[8px]"
              style={{
                color: "#4A5568",
                fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              }}
            >
              {label}
            </span>
          ))}
        </div>
        {/* Grid */}
        <div
          className="flex-1 grid grid-cols-24 gap-px"
          style={{ gridTemplateColumns: "repeat(24, 1fr)" }}
        >
          {hours.map((h) =>
            rows.map((r) => (
              <div
                key={`${h}-${r}`}
                className="aspect-square rounded-sm min-w-0"
                style={{ backgroundColor: getHeatColor(h, r) }}
                title={`${h}:00 — Row ${r}`}
              />
            )),
          )}
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex gap-px mt-1.5 ml-6" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
        {hours
          .filter((h) => h % 4 === 0)
          .map((h) => (
            <span
              key={h}
              className="text-[8px] flex-1 text-left"
              style={{
                color: "#4A5568",
                fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              }}
            >
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
      </div>
    </div>
  );
});

// ── Trending Tickers ───────────────────────────────────────────────────────

const TrendingTickers = memo(function TrendingTickers() {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4" style={{ color: "#3B82F6" }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F0F4FC" }}>
          Trending Tickers
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {MOCK_TRENDING.map((ticker) => (
          <div
            key={ticker.symbol}
            className="flex-shrink-0 px-3 py-2 rounded-lg flex flex-col gap-1 cursor-pointer transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              minWidth: "100px",
            }}
          >
            <span className="text-xs font-bold" style={{ color: "#F0F4FC" }}>
              {ticker.symbol}
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{
                color: ticker.change >= 0 ? "#22C55E" : "#EF4444",
                fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              }}
            >
              {ticker.change >= 0 ? "+" : ""}
              {ticker.change}%
            </span>
            <span className="text-[9px]" style={{ color: "#7B8BA8" }}>
              {ticker.mentions.toLocaleString()} mentions
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Mention Item ───────────────────────────────────────────────────────────

interface MentionItemProps {
  mention: Mention;
}

const MentionItem = memo(function MentionItem({ mention }: MentionItemProps) {
  const sentimentConfig = {
    positive: { color: "#22C55E", Icon: SmilePlus, bg: "rgba(34,197,94,0.1)" },
    neutral: { color: "#7B8BA8", Icon: Meh, bg: "rgba(255,255,255,0.05)" },
    negative: { color: "#EF4444", Icon: Frown, bg: "rgba(239,68,68,0.1)" },
  } as const;

  const sentiment = sentimentConfig[mention.sentiment];
  const SentIcon = sentiment.Icon;

  return (
    <div
      className="p-3 flex gap-3 transition-colors cursor-pointer"
      style={{
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
      }}
    >
      <div
        className="flex-shrink-0 size-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: sentiment.bg }}
      >
        <SentIcon className="size-4" style={{ color: sentiment.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#3B82F6" }}
          >
            {mention.source}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "#7B8BA8" }}>
            {mention.author}
          </span>
          <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: "#4A5568" }}>
            {mention.time}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#F0F4FC" }}>
          {mention.text}
        </p>
      </div>
    </div>
  );
});

// ── Coming Soon Tab ────────────────────────────────────────────────────────

const ComingSoonTab = memo(function ComingSoonTab({ platform }: { platform: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center"
      style={{
        backgroundColor: "#111827",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
      }}
    >
      <div
        className="size-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "rgba(59,130,246,0.15)" }}
      >
        <Globe className="size-6" style={{ color: "#3B82F6" }} />
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: "#F0F4FC" }}>
        {platform} Integration
      </h3>
      <p className="text-xs max-w-xs" style={{ color: "#7B8BA8" }}>
        Coming soon in Phase C. Full {platform.toLowerCase()} feed with sentiment analysis, trending
        topics, and community insights.
      </p>
    </div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────

function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("overview");

  const handleTabChange = useCallback((tab: CommunityTab) => setActiveTab(tab), []);

  return (
    <div className="space-y-4" style={{ backgroundColor: "#0A0E1A", color: "#F0F4FC" }}>
      {/* Collection Header */}
      <CollectionHeader />

      {/* Tabs */}
      <div
        className="flex items-center gap-0.5 p-1"
        style={{
          backgroundColor: "#111827",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                color: isActive ? "#3B82F6" : "#7B8BA8",
              }}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <SentimentHeatmap />
          <TrendingTickers />

          {/* Top Mentions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4" style={{ color: "#3B82F6" }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "#F0F4FC" }}
                >
                  Top Mentions
                </span>
              </div>
              <button
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: "#3B82F6" }}
              >
                View All <ArrowRight className="size-3" />
              </button>
            </div>
            <div className="space-y-2">
              {MOCK_MENTIONS.map((mention) => (
                <MentionItem key={mention.id} mention={mention} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "twitter" && <ComingSoonTab platform="Twitter" />}
      {activeTab === "telegram" && <ComingSoonTab platform="Telegram" />}
      {activeTab === "discord" && <ComingSoonTab platform="Discord" />}
      {activeTab === "reddit" && <ComingSoonTab platform="Reddit" />}
    </div>
  );
}
