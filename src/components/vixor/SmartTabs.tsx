import React from "react";
import { motion } from "framer-motion";
import { Flame, Radio, Eye } from "lucide-react";

export type SmartTabKey = "trending" | "signals" | "watchlist";

interface SmartTabsProps {
  activeTab: SmartTabKey;
  onChange: (tab: SmartTabKey) => void;
}

const TABS: { key: SmartTabKey; label: string; Icon: React.ElementType }[] = [
  { key: "trending", label: "الرائج", Icon: Flame },
  { key: "signals", label: "إشاراتي", Icon: Radio },
  { key: "watchlist", label: "قائمتي", Icon: Eye },
];

export const SmartTabs: React.FC<SmartTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#101114] border border-[rgba(255,255,255,0.04)]">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200 ${
              isActive ? "text-white" : "text-[#565A66] hover:text-[#9498A8]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="smartTabIndicator"
                className="absolute inset-0 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/25"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={13} className={isActive ? "text-[#6366F1]" : ""} />
              {label}
            </span>
            {isActive && (
              <motion.span
                layoutId="smartTabDot"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6366F1]"
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
