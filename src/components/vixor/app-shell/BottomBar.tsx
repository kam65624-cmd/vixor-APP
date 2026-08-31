import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";

import {
  HomeIcon,
  CompassIcon,
  SearchIcon,
  SignalIcon,
  SwapIcon,
  DeskIcon,
  AlphaIcon,
  PortfolioIcon,
  ChartsIcon,
  MoreDotsIcon,
} from "./icons";

// ── Navigation Data ─────────────────────────────────────────────────────────

// ── Dynamic Bottom Dock Navigation ────────────────────────────────────────
// V6: Scrollable dock with grouped items, replacing static 3+More

export interface DockItem {
  to: string;
  label: string;
  icon: ReactNode;
  group?: string;
  isMore?: boolean;
  badge?: string;
  badgeColor?: string;
}

export const dockItems: DockItem[] = [
  // ── Core ──
  { to: "/", label: "Home", icon: <HomeIcon />, group: "core" },
  { to: "/discover", label: "Discover", icon: <CompassIcon />, group: "core" },
  { to: "/analyze", label: "Analyze", icon: <SearchIcon />, group: "core" },
  // ── Separator ──
  // ── Trading ──
  { to: "/signals", label: "Signals", icon: <SignalIcon />, group: "trading" },
  { to: "/swap", label: "Swap", icon: <SwapIcon />, group: "trading" },
  { to: "/trade-desk", label: "Desk", icon: <DeskIcon />, group: "trading" },
  // ── Separator ──
  // ── AI & Portfolio ──
  { to: "/alpha", label: "Alpha", icon: <AlphaIcon />, group: "ai" },
  { to: "/portfolio", label: "Portfolio", icon: <PortfolioIcon />, group: "ai" },
  { to: "/charts", label: "Charts", icon: <ChartsIcon />, group: "ai" },
  // ── Separator ──
  // ── More (opens panel) ──
  { to: "", label: "More", icon: <MoreDotsIcon />, isMore: true, group: "more" },
];

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM DOCK — V6: Dynamic scrollable dock with grouped nav items
// ─────────────────────────────────────────────────────────────────────────────

export interface BottomBarProps {
  onMoreOpen: () => void;
  isTg?: boolean;
}

const groupOrder = ["core", "trading", "ai", "more"];

export const BottomBar = memo(function BottomBar({ onMoreOpen, isTg }: BottomBarProps) {
  const location = useLocation();
  const path = location.pathname;
  const dockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-scroll to active item on mount / route change
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const activeEl = dock.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [path]);

  // Drag-to-scroll handler for horizontal swiping
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const container = dockRef.current;
    if (!container) return;
    const delta = -info.offset.x;
    container.scrollBy({ left: delta * 1.5, behavior: "smooth" });
    setIsDragging(false);
  };

  let lastGroup = "";
  const items: ReactNode[] = [];
  for (const item of dockItems) {
    if (item.group && item.group !== lastGroup && lastGroup !== "") {
      items.push(
        <div key={`sep-${item.group}`} className="w-px h-6 bg-white/[0.06] mx-0.5 flex-shrink-0" />,
      );
    }
    lastGroup = item.group || "";

    const isActive =
      !item.isMore &&
      (path === item.to ||
        (item.to !== "/" && path.startsWith(item.to + "/")) ||
        (item.to === "/" && path === "/"));

    if (item.isMore) {
      items.push(
        <motion.button
          key="more-dock"
          onClick={onMoreOpen}
          className="relative flex flex-col items-center justify-center min-w-[68px] h-[64px] px-2 rounded-2xl transition-all duration-200 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.88 }}
          aria-label="More navigation"
        >
          <span className="vx-dock-icon" style={{ opacity: 0.6 }}>
            {item.icon}
          </span>
          <span className="vx-dock-label">{item.label}</span>
        </motion.button>,
      );
    } else {
      items.push(
        <motion.div
          key={item.to}
          className="relative flex-shrink-0"
          whileHover={{ y: -4, transition: { duration: 0.15 } }}
          whileTap={{ scale: 0.9 }}
        >
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-[var(--color-primary)]/[0.12]"
              layoutId="activeDockGlow"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          {isActive && (
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 16px rgba(99,102,241,0.5)",
              }}
              layoutId="activeDockIndicator"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <Link
            to={item.to}
            data-active={isActive}
            className={`vx-dock-item ${isActive ? "vx-dock-item-active" : ""}`}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`vx-dock-icon transition-all duration-300 ${isActive ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : ""}`}
            >
              {item.icon}
            </span>
            <span className="vx-dock-label">{item.label}</span>
            <div className="vx-dock-dot" />
          </Link>
        </motion.div>,
      );
    }
  }

  return (
    <motion.nav
      className="fixed bottom-0 inset-x-0 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        background: "rgba(10,11,16,0.95)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderTop: "none",
        height: isTg ? "calc(72px + env(safe-area-inset-bottom, 0px))" : "72px",
        display: "flex",
        alignItems: "center",
        paddingBottom: isTg ? "env(safe-area-inset-bottom, 0px)" : "0px",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.4)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(99,102,241,0.35), transparent)",
        }}
      />
      <motion.div
        ref={dockRef}
        className="vx-dock flex items-center gap-0.5 overflow-x-auto px-1"
        style={{
          width: "100%",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        drag="x"
        dragConstraints={{ left: -600, right: 0 }}
        dragElastic={0.08}
        dragMomentum
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {items}
      </motion.div>
    </motion.nav>
  );
});
