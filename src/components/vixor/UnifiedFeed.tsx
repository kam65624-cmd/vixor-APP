import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Eye, Bot, RefreshCw } from "lucide-react";
import type { HomeTickerItem } from "@/shared/data";
import type { SmartTabKey } from "./SmartTabs";

interface UnifiedFeedProps {
  tab: SmartTabKey;
  tickers: HomeTickerItem[];
  isLoading?: boolean;
  onAssetClick: (ticker: HomeTickerItem) => void;
  onAnalyzeClick?: (ticker: HomeTickerItem) => void;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-[#101114] rounded-2xl border border-[rgba(255,255,255,0.04)] animate-pulse"
        >
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-24 bg-white/[0.04] rounded" />
            <div className="h-3 w-36 bg-white/[0.04] rounded" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04]" />
            <div className="w-16 h-8 rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Decision Card ───────────────────────────────────────────────────────────

function DecisionCard({
  ticker,
  index,
  onClick,
  onAnalyze,
}: {
  ticker: HomeTickerItem;
  index: number;
  onClick: () => void;
  onAnalyze: () => void;
}) {
  const isPositive = ticker.change24h >= 0;
  const momentumWidth = Math.min(Math.abs(ticker.change24h) / 10, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ scale: 1.01, borderColor: "rgba(99,102,241,0.3)" }}
      onClick={onClick}
      className="relative flex items-center gap-4 p-4 bg-[#101114] rounded-2xl border border-[rgba(255,255,255,0.04)] cursor-pointer transition-all duration-200 group"
    >
      {/* Coin Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
        style={{
          background: isPositive
            ? "color-mix(in srgb, var(--color-bullish) 10%, #16171C)"
            : "color-mix(in srgb, var(--color-bearish) 10%, #16171C)",
          border: `1px solid ${isPositive ? "rgba(34,211,166,0.15)" : "rgba(251,70,103,0.15)"}`,
        }}
      >
        {ticker.symbol.slice(0, 2)}
      </div>

      {/* Core Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{ticker.symbol}</span>
          {Math.abs(ticker.change24h) > 5 && (
            <Zap className="w-3 h-3 text-[#F0B90B] fill-[#F0B90B]" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-mono font-bold text-white tabular-nums">
            $
            {ticker.price >= 1
              ? ticker.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
              : ticker.price.toFixed(6)}
          </span>
          <span
            className={`text-xs font-mono font-medium px-2 py-0.5 rounded-lg ${
              isPositive ? "text-[#22D3A6] bg-[#22D3A6]/10" : "text-[#FB4667] bg-[#FB4667]/10"
            }`}
          >
            {isPositive ? "+" : ""}
            {ticker.change24h.toFixed(2)}%
          </span>
          {/* Mini Momentum Bar */}
          <div className="flex-1 max-w-[80px] h-1.5 bg-[#16171C] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${momentumWidth}%` }}
              transition={{ delay: index * 0.04 + 0.2, duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${isPositive ? "bg-[#22D3A6]" : "bg-[#FB4667]"}`}
            />
          </div>
        </div>
        {/* Volume */}
        {ticker.volume24h && ticker.volume24h > 0 && (
          <div className="text-[10px] text-[#565A66] font-mono mt-1">
            Vol: ${formatCompactVolume(ticker.volume24h)}
          </div>
        )}
      </div>

      {/* Inline Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze();
          }}
          className="p-2 rounded-xl bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1]/20 transition-colors border border-[#6366F1]/20"
          aria-label="تحليل بالذكاء الاصطناعي"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
            isPositive
              ? "bg-[#22D3A6] text-black shadow-[#22D3A6]/30 hover:bg-[#1a9d7c]"
              : "bg-[#6366F1] text-white shadow-[#6366F1]/30 hover:bg-[#4F46E5]"
          }`}
        >
          {isPositive ? "شراء" : "تحليل"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyTabState({ tab }: { tab: SmartTabKey }) {
  const messages: Record<SmartTabKey, { title: string; desc: string }> = {
    trending: {
      title: "جاري تحميل البيانات...",
      desc: "سيتم عرض الأصول الأكثر نشاطاً هنا",
    },
    signals: {
      title: "لا توجد إشارات حالياً",
      desc: "عندما يرسل MOXI إشارة جديدة، ستظهر هنا",
    },
    watchlist: {
      title: "قائمة المتابعة فارغة",
      desc: "أضف أصولاً من صفحة الاستكشاف لمتابعتها",
    },
  };
  const msg = messages[tab];
  return (
    <div className="text-center py-16 bg-[#101114] rounded-3xl border border-dashed border-[rgba(255,255,255,0.06)]">
      <div className="w-14 h-14 rounded-2xl bg-[#16171C] flex items-center justify-center mx-auto mb-4">
        <Bot className="w-6 h-6 text-[#565A66]" />
      </div>
      <p className="text-sm font-semibold text-[#9498A8]">{msg.title}</p>
      <p className="text-xs text-[#565A66] mt-1">{msg.desc}</p>
    </div>
  );
}

// ─── Main Unified Feed ───────────────────────────────────────────────────────

export const UnifiedFeed: React.FC<UnifiedFeedProps> = ({
  tab,
  tickers,
  isLoading,
  onAssetClick,
  onAnalyzeClick,
}) => {
  const [displayTickers, setDisplayTickers] = useState<HomeTickerItem[]>([]);

  useEffect(() => {
    if (isLoading || !tickers.length) {
      setDisplayTickers([]);
      return;
    }

    let filtered: HomeTickerItem[];
    switch (tab) {
      case "trending":
        // Sort by absolute change to show most volatile first
        filtered = [...tickers].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        break;
      case "signals":
        // For now, show tickers with > 3% change as proxy for "signals"
        filtered = tickers.filter((t) => Math.abs(t.change24h) > 3);
        break;
      case "watchlist":
        // For now show top 5 as placeholder until watchlist is connected
        filtered = tickers.slice(0, 5);
        break;
      default:
        filtered = tickers;
    }

    setDisplayTickers(filtered);
  }, [tab, tickers, isLoading]);

  if (isLoading) return <FeedSkeleton />;

  return (
    <AnimatePresence mode="popLayout">
      {displayTickers.length > 0 ? (
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {displayTickers.map((ticker, index) => (
            <DecisionCard
              key={ticker.symbol}
              ticker={ticker}
              index={index}
              onClick={() => onAssetClick(ticker)}
              onAnalyze={() => onAnalyzeClick?.(ticker)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key={`empty-${tab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <EmptyTabState tab={tab} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCompactVolume(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(0);
}
