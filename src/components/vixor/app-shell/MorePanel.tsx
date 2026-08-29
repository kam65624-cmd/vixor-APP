import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";

import {
  RadarIcon,
  PulseIcon,
  CurvesIcon,
  PredictionsIcon,
  DailyLoopIcon,
  StrategyLabIcon,
  VisionIcon,
  PerpetualsIcon,
  TrackersIcon,
  ArbitrageIcon,
  PnlIcon,
  JournalIcon,
  BagsIcon,
  SettingsIcon,
  ProfileIcon,
  PremiumIcon,
  RewardsIcon,
  BrokersIcon,
  ReferralIcon,
} from "./icons";

// ── Navigation Data (More Panel — reorganized into 5 smart groups) ──

// "More" panel: organized into categories
export interface MoreNavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export interface MoreNavCategory {
  title: string;
  items: MoreNavItem[];
}

export const moreNavCategories: MoreNavCategory[] = [
  // ── Market Intelligence ──
  {
    title: "Market Intelligence",
    items: [
      { to: "/radar", label: "Radar", icon: <RadarIcon /> },
      { to: "/pulse", label: "Pulse & Whale", icon: <PulseIcon /> },
      { to: "/curves", label: "Bonding Curves", icon: <CurvesIcon /> },
      { to: "/predictions", label: "Predictions", icon: <PredictionsIcon /> },
    ],
  },
  // ── AI & Automation ──
  {
    title: "AI & Automation",
    items: [
      { to: "/daily-loop", label: "Daily Loop", icon: <DailyLoopIcon /> },
      { to: "/backtest", label: "Strategy Lab", icon: <StrategyLabIcon /> },
      { to: "/vision", label: "Vision AI", icon: <VisionIcon /> },
      { to: "/perpetuals", label: "Perpetuals", icon: <PerpetualsIcon /> },
      { to: "/trackers", label: "Trackers", icon: <TrackersIcon /> },
    ],
  },
  // ── Trading ──
  {
    title: "Trading",
    items: [{ to: "/arbitrage", label: "Arbitrage", icon: <ArbitrageIcon /> }],
  },
  // ── Performance ──
  {
    title: "Performance",
    items: [
      { to: "/pnl", label: "PnL Tracker", icon: <PnlIcon /> },
      { to: "/journal", label: "Journal", icon: <JournalIcon /> },
      { to: "/bags", label: "Bags", icon: <BagsIcon /> },
    ],
  },
  // ── Platform ──
  {
    title: "Platform",
    items: [
      { to: "/settings", label: "Settings", icon: <SettingsIcon /> },
      { to: "/profile", label: "Profile", icon: <ProfileIcon /> },
      { to: "/premium", label: "Premium", icon: <PremiumIcon /> },
      { to: "/rewards", label: "Rewards", icon: <RewardsIcon /> },
      { to: "/brokers", label: "Brokers", icon: <BrokersIcon /> },
      { to: "/referral", label: "Referral", icon: <ReferralIcon /> },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MORE PANEL — Slide-up sheet with categorized navigation
// ─────────────────────────────────────────────────────────────────────────────

export interface MorePanelProps {
  currentPath: string;
  onClose: () => void;
}

export function MorePanel({ currentPath, onClose }: MorePanelProps) {
  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 99,
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--color-card)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          borderTop: "1px solid var(--color-border)",
          zIndex: 100,
          maxHeight: "75vh",
          overflowY: "auto",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.5)",
          paddingBottom: "8px",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "10px",
            paddingBottom: "6px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--handle-bar)",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px 10px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2">
            {" "}
            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-foreground)" }}>
              {" "}
              Explore{" "}
            </span>{" "}
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-lg"
              style={{
                background: "var(--primary-bg)",
                color: "var(--color-primary)",
                border: "1px solid var(--primary-border)",
              }}
            >
              {" "}
              {moreNavCategories.reduce((acc, cat) => acc + cat.items.length, 0)} items{" "}
            </span>{" "}
          </div>{" "}
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--surface-elevated)] border border-[var(--color-border)] text-muted-foreground hover:text-foreground hover:border-[var(--border-hover)] transition-all cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </motion.button>
        </div>

        {/* Categories */}
        <div style={{ padding: "8px 12px" }}>
          {moreNavCategories.map((category) => (
            <div key={category.title} style={{ marginBottom: "12px" }}>
              {/* Category Title */}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--color-muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 8px 6px",
                }}
              >
                {category.title}
              </div>

              {/* Items Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                }}
              >
                {category.items.map((item) => {
                  const isActive = currentPath === item.to || currentPath.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px",
                        borderRadius: "12px",
                        background: isActive ? "var(--bullish-bg)" : "var(--color-muted)",
                        border: isActive
                          ? "1px solid color-mix(in srgb, var(--color-bullish) 20%, transparent)"
                          : "1px solid var(--color-border)",
                        textDecoration: "none",
                        color: isActive ? "var(--color-primary)" : "var(--color-muted-foreground)",
                        fontSize: "12px",
                        fontWeight: isActive ? 600 : 500,
                        transition: "all var(--transition-base)",
                      }}
                    >
                      <span
                        style={{
                          color: isActive
                            ? "var(--color-primary)"
                            : "var(--color-muted-foreground)",
                          display: "flex",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
