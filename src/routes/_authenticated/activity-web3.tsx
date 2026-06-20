"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Brain,
  Download,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  BarChart3,
  BookOpen,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useState, useCallback, memo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

type ActivityFilter = "all" | "trades" | "transfers" | "learning" | "ai-decisions";

interface ActivityItem {
  id: string;
  type: "trade" | "transfer" | "learning" | "ai-decision";
  icon: typeof ArrowUpRight;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  timestamp: string;
  value?: string;
  detail?: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  action: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "trade",
    icon: ArrowUpRight,
    iconColor: "var(--ws-bullish)",
    iconBg: "rgba(34,197,94,0.1)",
    title: "Bought PEPE",
    description: "Swapped 0.5 ETH for 45,200,000 PEPE on Uniswap V3",
    timestamp: "2 min ago",
    value: "+$557.77",
    detail: "Avg entry: $0.00001234",
  },
  {
    id: "2",
    type: "ai-decision",
    icon: Brain,
    iconColor: "var(--ws-accent)",
    iconBg: "var(--ws-accent-dim, rgba(59,130,246,0.12))",
    title: "AI Signal: PEPE Buy",
    description:
      "Smart money accumulation detected. Confidence: 78%. Recommended entry zone: $0.00001180-$0.00001220",
    timestamp: "5 min ago",
    value: "78% confidence",
  },
  {
    id: "3",
    type: "trade",
    icon: ArrowDownRight,
    iconColor: "var(--ws-bearish)",
    iconBg: "rgba(239,68,68,0.1)",
    title: "Sold DOGE",
    description: "Sold 10,000 DOGE at $0.1245",
    timestamp: "15 min ago",
    value: "-$1,245.00",
    detail: "P&L: -$82.50 (-6.2%)",
  },
  {
    id: "4",
    type: "transfer",
    icon: ArrowUpRight,
    iconColor: "var(--ws-accent)",
    iconBg: "var(--ws-accent-dim, rgba(59,130,246,0.12))",
    title: "Received ETH",
    description: "Received 1.0 ETH from 0x4pQn...8vRe",
    timestamp: "1 hour ago",
    value: "+$3,440.00",
  },
  {
    id: "5",
    type: "learning",
    icon: BookOpen,
    iconColor: "var(--ws-warning)",
    iconBg: "rgba(245,158,11,0.1)",
    title: "Completed: Smart Money Tracking",
    description:
      "Finished the Smart Money Concepts module. You learned to identify institutional order flow patterns.",
    timestamp: "2 hours ago",
    value: "+50 XP",
  },
  {
    id: "6",
    type: "ai-decision",
    icon: Brain,
    iconColor: "var(--ws-accent)",
    iconBg: "var(--ws-accent-dim, rgba(59,130,246,0.12))",
    title: "AI Alert: WIF Risk",
    description:
      "Volatility spike detected on WIF. Suggesting tighter stop-loss or partial take-profit at $2.80",
    timestamp: "3 hours ago",
    value: "Risk Alert",
  },
  {
    id: "7",
    type: "trade",
    icon: ArrowLeftRight,
    iconColor: "var(--ws-accent)",
    iconBg: "var(--ws-accent-dim, rgba(59,130,246,0.12))",
    title: "Swapped USDC → WIF",
    description: "Swapped 1,000 USDC for 408.16 WIF on Jupiter DEX",
    timestamp: "5 hours ago",
    value: "$1,000.00",
  },
  {
    id: "8",
    type: "transfer",
    icon: ArrowDownRight,
    iconColor: "var(--ws-bearish)",
    iconBg: "rgba(239,68,68,0.1)",
    title: "Sent USDC",
    description: "Sent 500 USDC to 0x9mLt...2jXc",
    timestamp: "6 hours ago",
    value: "-$500.00",
  },
  {
    id: "9",
    type: "learning",
    icon: Sparkles,
    iconColor: "var(--ws-bullish)",
    iconBg: "rgba(34,197,94,0.1)",
    title: "Achievement Unlocked: Early Bird",
    description: "You bought TURBO within the first hour of launch! Rarity: Rare",
    timestamp: "1 day ago",
    value: "Rare Badge",
  },
  {
    id: "10",
    type: "ai-decision",
    icon: Brain,
    iconColor: "var(--ws-accent)",
    iconBg: "var(--ws-accent-dim, rgba(59,130,246,0.12))",
    title: "AI Portfolio Rebalance",
    description:
      "Suggested reducing DOGE exposure by 20% and increasing PEPE allocation. Based on momentum and smart money flow analysis.",
    timestamp: "1 day ago",
    value: "Rebalance",
  },
];

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: "1",
    title: "PEPE Momentum Strong",
    description:
      "3 smart money wallets accumulated 12B PEPE in the last 6h. Volume trending up. Bullish bias maintained.",
    confidence: 82,
    action: "Hold",
  },
  {
    id: "2",
    title: "WIF Overbought Signal",
    description:
      "RSI hit 78 on 4H timeframe. Historically, a pullback follows within 12-24 hours. Consider tightening stops.",
    confidence: 65,
    action: "Caution",
  },
  {
    id: "3",
    title: "DOGE Whale Sell Pressure",
    description:
      "Large DOGE holder moved 50M tokens to exchange. Could indicate upcoming sell pressure on the market.",
    confidence: 71,
    action: "Monitor",
  },
];

// ── Route ──────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/activity-web3")({
  head: () => ({ meta: [{ title: "Activity — Vixor Web3 Terminal" }] }),
  component: ActivityWeb3Page,
});

// ── Filter Bar ─────────────────────────────────────────────────────────────

interface FilterBarProps {
  active: ActivityFilter;
  onChange: (filter: ActivityFilter) => void;
  onExport: () => void;
}

const FILTERS: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trades", label: "Trades" },
  { id: "transfers", label: "Transfers" },
  { id: "learning", label: "Learning" },
  { id: "ai-decisions", label: "AI Decisions" },
];

const FilterBar = memo(function FilterBar({ active, onChange, onExport }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div
        className="flex items-center gap-0.5 p-1"
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          borderRadius: "var(--ws-radius)",
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={{
              backgroundColor:
                active === f.id ? "var(--ws-accent-dim, rgba(32,129,226,0.12))" : "transparent",
              color: active === f.id ? "var(--ws-accent)" : "var(--ws-text-secondary)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
        style={{
          backgroundColor: "var(--ws-surface)",
          border: "1px solid var(--ws-border)",
          color: "var(--ws-text-secondary)",
          borderRadius: "var(--ws-radius)",
        }}
      >
        <Download className="size-3.5" />
        Export CSV
      </button>
    </div>
  );
});

// ── Activity Feed Item ─────────────────────────────────────────────────────

interface ActivityFeedItemProps {
  item: ActivityItem;
}

const ActivityFeedItem = memo(function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const Icon = item.icon;

  return (
    <div
      className="flex gap-3 p-3 transition-colors cursor-pointer"
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 size-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: item.iconBg }}
      >
        <Icon className="size-4" style={{ color: item.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-semibold" style={{ color: "var(--ws-text-primary)" }}>
              {item.title}
            </span>
            {item.value && (
              <span
                className="ml-2 text-xs font-bold"
                style={{
                  color: item.value.startsWith("+")
                    ? "var(--ws-bullish)"
                    : item.value.startsWith("-")
                      ? "var(--ws-bearish)"
                      : "var(--ws-accent)",
                  fontFamily: "var(--ws-mono-font-family, monospace)",
                }}
              >
                {item.value}
              </span>
            )}
          </div>
          <span
            className="flex items-center gap-1 text-[10px] flex-shrink-0"
            style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
          >
            <Clock className="size-2.5" />
            {item.timestamp}
          </span>
        </div>
        <p className="text-xs leading-relaxed mt-0.5" style={{ color: "var(--ws-text-secondary)" }}>
          {item.description}
        </p>
        {item.detail && (
          <span
            className="inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--ws-surface-hover)",
              color: "var(--ws-text-secondary)",
              fontFamily: "var(--ws-mono-font-family, monospace)",
            }}
          >
            {item.detail}
          </span>
        )}
      </div>
    </div>
  );
});

// ── AI Insights Panel ──────────────────────────────────────────────────────

const AIInsightsPanel = memo(function AIInsightsPanel() {
  return (
    <div
      className="hidden lg:block"
      style={{
        backgroundColor: "var(--ws-surface)",
        border: "1px solid var(--ws-border)",
        borderRadius: "var(--ws-radius)",
      }}
    >
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: "var(--ws-border)" }}
      >
        <Brain className="size-4" style={{ color: "var(--ws-accent)" }} />
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--ws-text-primary)" }}
        >
          VIXOR AI Insights
        </span>
      </div>
      <div className="p-4 space-y-3">
        {MOCK_INSIGHTS.map((insight) => {
          const confidenceColor =
            insight.confidence >= 75
              ? "var(--ws-bullish)"
              : insight.confidence >= 50
                ? "var(--ws-warning)"
                : "var(--ws-bearish)";

          return (
            <div
              key={insight.id}
              className="p-3 space-y-2"
              style={{
                backgroundColor: "var(--ws-surface-hover)",
                borderRadius: "var(--ws-radius)",
                border: "1px solid var(--ws-border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: "var(--ws-text-primary)" }}>
                  {insight.title}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${confidenceColor}15`, color: confidenceColor }}
                >
                  {insight.action}
                </span>
              </div>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--ws-text-secondary)" }}
              >
                {insight.description}
              </p>
              {/* Confidence Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
                  >
                    Confidence
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{
                      color: confidenceColor,
                      fontFamily: "var(--ws-mono-font-family, monospace)",
                    }}
                  >
                    {insight.confidence}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--ws-bg-secondary, var(--ws-surface))" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${insight.confidence}%`, backgroundColor: confidenceColor }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <button
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            backgroundColor: "var(--ws-accent-dim, rgba(32,129,226,0.08))",
            color: "var(--ws-accent)",
            border: "1px solid var(--ws-border-accent, var(--ws-border))",
          }}
        >
          View Full AI Dashboard <ArrowRight className="size-3" />
        </button>
      </div>
    </div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────

function ActivityWeb3Page() {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");

  const handleFilterChange = useCallback((filter: ActivityFilter) => setActiveFilter(filter), []);
  const handleExport = useCallback(() => {
    // Export placeholder — no-op for now
  }, []);

  const filteredActivities =
    activeFilter === "all"
      ? MOCK_ACTIVITIES
      : MOCK_ACTIVITIES.filter((a) => a.type === activeFilter);

  return (
    <div
      className="space-y-4"
      style={{ backgroundColor: "var(--ws-bg)", color: "var(--ws-text-primary)" }}
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--ws-text-primary)" }}
          >
            Activity
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--ws-text-secondary)" }}>
            Your trading activity, AI decisions & learning progress
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar active={activeFilter} onChange={handleFilterChange} onExport={handleExport} />

      {/* Content: Feed + AI Panel */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Activity Feed */}
        <div className="flex-1 space-y-2">
          {filteredActivities.map((item) => (
            <ActivityFeedItem key={item.id} item={item} />
          ))}
          {filteredActivities.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{
                backgroundColor: "var(--ws-surface)",
                border: "1px solid var(--ws-border)",
                borderRadius: "var(--ws-radius)",
              }}
            >
              <BarChart3
                className="size-8 mb-3"
                style={{ color: "var(--ws-text-tertiary, var(--ws-text-secondary))" }}
              />
              <p className="text-sm font-medium" style={{ color: "var(--ws-text-secondary)" }}>
                No activities in this category
              </p>
            </div>
          )}
        </div>

        {/* AI Insights Panel — Desktop Only */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <AIInsightsPanel />
        </div>
      </div>
    </div>
  );
}
