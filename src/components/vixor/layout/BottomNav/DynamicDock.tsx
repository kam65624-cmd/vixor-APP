import { memo, useState, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  motion,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DockItem {
  to: string;
  label: string;
  icon: ReactNode;
  group?: string;
  isMore?: boolean;
  badge?: string;
  badgeColor?: string;
}

export interface MoreNavCategory {
  title: string;
  items: { to: string; label: string; icon: ReactNode }[];
}

interface DynamicDockProps {
  items: DockItem[];
  moreCategories: MoreNavCategory[];
  isTg?: boolean;
}

// ── Main Component ──────────────────────────────────────────────────────────

export const DynamicDock = memo(function DynamicDock({
  items,
  moreCategories,
  isTg,
}: DynamicDockProps) {
  const location = useLocation();
  const path = location.pathname;
  const dockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Auto-scroll to active item on mount / route change
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const activeEl = dock.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [path]);

  // Close More panel on route change
  useEffect(() => {
    setShowMore(false);
  }, [path]);

  // Drag-to-scroll handler
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const container = dockRef.current;
    if (!container) return;
    const delta = -info.offset.x;
    container.scrollBy({ left: delta * 1.5, behavior: "smooth" });
    setIsDragging(false);
  };

  let lastGroup = "";
  const rendered: ReactNode[] = [];

  for (const item of items) {
    // Group separator
    if (item.group && item.group !== lastGroup && lastGroup !== "") {
      rendered.push(
        <div
          key={`sep-${item.group}`}
          className="w-px h-8 bg-white/[0.06] mx-1 flex-shrink-0"
        />,
      );
    }
    lastGroup = item.group || "";

    const isActive =
      !item.isMore &&
      (path === item.to ||
        (item.to !== "/" && path.startsWith(item.to + "/")) ||
        (item.to === "/" && path === "/"));

    if (item.isMore) {
      rendered.push(
        <motion.button
          key="more-dock"
          onClick={() => setShowMore(true)}
          className="relative flex flex-col items-center justify-center min-w-[72px] h-[68px] px-2 rounded-2xl transition-all duration-200 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.88 }}
          aria-label="More navigation"
        >
          <span className="w-[26px] h-[26px] flex items-center justify-center opacity-60">
            {item.icon}
          </span>
          <span className="text-[9px] font-semibold mt-1 tracking-wide">
            {item.label}
          </span>
        </motion.button>,
      );
    } else {
      rendered.push(
        <motion.div
          key={item.to}
          className="relative flex-shrink-0"
          whileHover={{ y: -6, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.88 }}
        >
          {/* Active glow background */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
              }}
              layoutId="activeDockGlow"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          {/* Active indicator dot (top) */}
          {isActive && (
            <motion.div
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 20px rgba(99,102,241,0.6)",
              }}
              layoutId="activeDockIndicator"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <Link
            to={item.to}
            data-active={isActive}
            className="flex flex-col items-center justify-center min-w-[72px] h-[68px] px-2 rounded-2xl transition-all duration-200"
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`w-[26px] h-[26px] flex items-center justify-center transition-all duration-300 ${isActive ? "drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" : "opacity-60"}`}
            >
              {item.icon}
            </span>
            <span
              className={`text-[9px] font-semibold mt-1 tracking-wide transition-colors duration-200 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}`}
            >
              {item.label}
            </span>
            {/* Active dot below label */}
            {isActive && (
              <span
                className="w-1 h-1 rounded-full mt-0.5"
                style={{
                  background: "var(--color-primary)",
                  boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                }}
              />
            )}
          </Link>
          {/* Badge (e.g. LIVE, PRO) */}
          {item.badge && (
            <span
              className="absolute top-1 right-2 text-[7px] font-bold tracking-wider px-1.5 py-0.5 rounded-md"
              style={{
                background: item.badgeColor
                  ? `color-mix(in srgb, ${item.badgeColor} 15%, transparent)`
                  : "var(--primary-bg)",
                color: item.badgeColor || "var(--color-primary)",
                border: `1px solid color-mix(in srgb, ${item.badgeColor || "var(--color-primary)"} 25%, transparent)`,
              }}
            >
              {item.badge}
            </span>
          )}
        </motion.div>,
      );
    }
  }

  // Count hidden items for More button badge
  const hiddenCount = moreCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0,
  );

  return (
    <>
      <motion.nav
        className="fixed bottom-0 inset-x-0 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          background: "rgba(10,11,16,0.95)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          height: isTg
            ? "calc(72px + env(safe-area-inset-bottom, 0px))"
            : "72px",
          display: "flex",
          alignItems: "center",
          paddingBottom: isTg
            ? "env(safe-area-inset-bottom, 0px)"
            : "0px",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.4)",
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Gradient glow line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.3), transparent)",
          }}
        />
        {/* Scrollable dock area */}
        <motion.div
          ref={dockRef}
          className="flex items-center gap-0.5 overflow-x-auto px-1"
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
          {rendered}
        </motion.div>
      </motion.nav>

      {/* ── More Panel (Slide-up Sheet) ── */}
      <AnimatePresence>
        {showMore && (
          <MorePanel
            currentPath={path}
            categories={moreCategories}
            onClose={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

// ── More Panel ──────────────────────────────────────────────────────────────

interface MorePanelProps {
  currentPath: string;
  categories: MoreNavCategory[];
  onClose: () => void;
}

const MorePanel = memo(function MorePanel({
  currentPath,
  categories,
  onClose,
}: MorePanelProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-3xl border-t border-[var(--color-border)] bg-[var(--color-card)] max-h-[75vh] overflow-y-auto shadow-[0_-8px_60px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "var(--handle-bar)" }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-extrabold text-[var(--color-foreground)]">
              Explore
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-lg"
              style={{
                background: "var(--primary-bg)",
                color: "var(--color-primary)",
                border: "1px solid var(--primary-border)",
              }}
            >
              {totalItems} items
            </span>
          </div>
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--surface-elevated)] border border-[var(--color-border)] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
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
        <div className="p-3">
          {categories.map((category) => (
            <div key={category.title} className="mb-3 last:mb-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)] px-2 pb-1.5">
                {category.title}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {category.items.map((item) => {
                  const isActive =
                    currentPath === item.to ||
                    currentPath.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 p-3 rounded-xl transition-all duration-200 ${isActive ? "bg-[var(--bullish-bg)] border border-[color-mix(in_srgb,var(--color-bullish)_20%,transparent)]" : "bg-[var(--color-muted)] border border-[var(--color-border)]"}`}
                      style={{
                        textDecoration: "none",
                        color: isActive
                          ? "var(--color-primary)"
                          : "var(--color-muted-foreground)",
                        fontSize: "12px",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
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
});
