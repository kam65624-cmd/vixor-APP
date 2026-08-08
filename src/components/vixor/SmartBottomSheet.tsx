import React, { useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, TrendingUp, TrendingDown, Bell, ArrowUpRight } from "lucide-react";
import type { HomeTickerItem } from "@/shared/data";

interface SmartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  asset: HomeTickerItem | null;
  onAnalyze?: (ticker: HomeTickerItem) => void;
  onNavigate?: (path: string) => void;
}

export const SmartBottomSheet: React.FC<SmartBottomSheetProps> = ({
  isOpen,
  onClose,
  asset,
  onAnalyze,
  onNavigate,
}) => {
  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 300) {
        onClose();
      }
    },
    [onClose],
  );

  if (!asset) return null;

  const isPositive = asset.change24h >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-[#101114] rounded-t-3xl border border-[rgba(255,255,255,0.06)] p-6 pb-10 max-h-[75vh] overflow-y-auto"
          >
            {/* Drag Handle */}
            <div className="flex justify-center mb-5">
              <div className="w-12 h-1.5 bg-[#565A66] rounded-full" />
            </div>

            {/* Asset Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{
                    background: isPositive
                      ? "color-mix(in srgb, var(--color-bullish) 10%, #16171C)"
                      : "color-mix(in srgb, var(--color-bearish) 10%, #16171C)",
                    border: `1px solid ${isPositive ? "rgba(34,211,166,0.15)" : "rgba(251,70,103,0.15)"}`,
                  }}
                >
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{asset.symbol}</h3>
                  <span className="text-sm text-[#9498A8] font-mono">/USDT</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-[#9498A8]" />
              </button>
            </div>

            {/* Price + Change */}
            <div className="flex items-end gap-4 mb-6">
              <span className="text-3xl font-mono font-bold text-white tabular-nums">
                $
                {asset.price >= 1
                  ? asset.price.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })
                  : asset.price.toFixed(6)}
              </span>
              <span
                className={`text-sm font-mono font-medium px-3 py-1 rounded-xl ${
                  isPositive ? "text-[#22D3A6] bg-[#22D3A6]/10" : "text-[#FB4667] bg-[#FB4667]/10"
                }`}
              >
                {isPositive ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </span>
            </div>

            {/* Price Range Bar */}
            {(asset.high24h || asset.low24h) && (
              <div className="mb-6 p-3.5 rounded-2xl bg-[#16171C] border border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between text-[10px] text-[#565A66] font-mono mb-2">
                  <span>24h Low</span>
                  <span>24h High</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#FB4667]">
                    ${asset.low24h?.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[#22D3A6]">
                    ${asset.high24h?.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Range visual bar */}
                <div className="mt-2 h-1.5 bg-[#0A0B10] rounded-full overflow-hidden relative">
                  <div
                    className="absolute h-full bg-gradient-to-r from-[#FB4667] via-[#6366F1] to-[#22D3A6] rounded-full"
                    style={{ width: "100%" }}
                  />
                  <div
                    className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] -top-0.5"
                    style={{
                      left:
                        asset.high24h && asset.low24h && asset.high24h !== asset.low24h
                          ? `${((asset.price - asset.low24h) / (asset.high24h - asset.low24h)) * 100}%`
                          : "50%",
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <button className="flex-1 py-3.5 bg-[#22D3A6] text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(34,211,166,0.3)] flex items-center justify-center gap-2 text-sm hover:brightness-110 transition-all">
                <TrendingUp className="w-4 h-4" /> شراء
              </button>
              <button className="flex-1 py-3.5 bg-[#FB4667] text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(251,70,103,0.3)] flex items-center justify-center gap-2 text-sm hover:brightness-110 transition-all">
                <TrendingDown className="w-4 h-4" /> بيع
              </button>
              <button className="flex-1 py-3.5 bg-[#16171C] text-[#9498A8] font-bold rounded-xl border border-[rgba(255,255,255,0.04)] flex items-center justify-center gap-2 text-sm hover:text-white hover:bg-[#1e1f26] transition-all">
                <Bell className="w-4 h-4" /> تنبيه
              </button>
            </div>

            {/* MOXI Analysis Button */}
            {onAnalyze && (
              <button
                onClick={() => {
                  onAnalyze(asset);
                  onClose();
                }}
                className="w-full py-3 bg-[#6366F1]/10 text-[#6366F1] text-sm font-bold rounded-xl border border-[#6366F1]/20 flex items-center justify-center gap-2 hover:bg-[#6366F1]/20 transition-all"
              >
                <ArrowUpRight className="w-4 h-4" /> تحليل متقدم بواسطة MOXI
              </button>
            )}

            {/* Volume Info */}
            {asset.volume24h && asset.volume24h > 0 && (
              <div className="mt-4 flex items-center justify-between text-xs text-[#565A66]">
                <span>حجم التداول 24h</span>
                <span className="font-mono text-[#9498A8]">
                  $
                  {asset.volume24h >= 1e9
                    ? `${(asset.volume24h / 1e9).toFixed(2)}B`
                    : asset.volume24h >= 1e6
                      ? `${(asset.volume24h / 1e6).toFixed(2)}M`
                      : asset.volume24h.toLocaleString()}
                </span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
