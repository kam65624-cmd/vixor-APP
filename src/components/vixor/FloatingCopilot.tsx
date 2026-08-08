import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { motion, useSpring, type PanInfo } from "framer-motion";
import { Bot } from "lucide-react";
import { useCopilot } from "@/hooks/useCopilot";
import { CopilotDrawer } from "./CopilotDrawer";

/**
 * MOXI 3D Orb — A floating, draggable AI assistant orb.
 * Renders globally in AppShell so it is visible on every page.
 */
export const FloatingCopilot = memo(function FloatingCopilot() {
  const { isOpen, openDrawer, closeDrawer, messages, hasNewSignal } = useCopilot();

  const [mounted, setMounted] = useState(false);

  // SSR guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Float animation (continuous sine-wave bobbing via spring) ──
  const floatOffsetY = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    if (isOpen || !mounted) {
      floatOffsetY.set(0);
      return;
    }
    const interval = setInterval(() => {
      floatOffsetY.set(Math.sin(Date.now() / 2500) * 6);
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen, mounted, floatOffsetY]);

  // ── Dynamic glow colour ──
  const glowColor = hasNewSignal ? "#22D3A6" : "#6366F1";

  // ── Unread count (capped at 99) ──
  const unreadCount = Math.min(messages.length, 99);

  // ── Drag end: navigate to /analyze (full experience) ──
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If barely moved, treat as click — open drawer
    if (Math.abs(info.offset.x) < 5 && Math.abs(info.offset.y) < 5) return;
  }, []);

  // ── Click handler ──
  const handleOrbClick = useCallback(() => {
    if (!isOpen) openDrawer();
  }, [isOpen, openDrawer]);

  // ── Drag constraints (SSR-safe) ──
  const dragConstraints = useMemo(() => {
    if (!mounted) return { left: 0, right: 0, top: 0, bottom: 0 };
    return {
      left: -60,
      right: 60,
      top: -60,
      bottom: 20,
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* ── 3D Orb ── */}
      <motion.div
        className="fixed z-[100] cursor-pointer"
        style={{
          width: 64,
          height: 64,
          bottom: 100,
          right: 20,
          y: floatOffsetY,
        }}
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleOrbClick}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        aria-label="Open MOXI AI"
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{ inset: -8 }}
          animate={{
            boxShadow: [
              `0 0 20px ${glowColor}33`,
              `0 0 40px ${glowColor}66`,
              `0 0 20px ${glowColor}33`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main orb sphere */}
        <div
          className={`relative w-16 h-16 rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.15)] ${hasNewSignal ? "animate-pulse" : ""}`}
          style={{
            background: "radial-gradient(circle at 35% 35%, #8B5CF6, #6366F1 50%, #4338CA)",
            boxShadow: `0 8px 40px ${glowColor}66`,
          }}
        >
          {/* Specular highlight (fake 3D shine) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 via-white/15 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-black/20 pointer-events-none" />

          <Bot
            className="w-8 h-8 text-white relative z-10"
            style={{
              filter: "drop-shadow(0 0 12px rgba(99,102,241,0.5))",
            }}
            strokeWidth={1.8}
          />

          {/* Live online dot */}
          <span
            className={`absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#22D3A6] rounded-full border-2 border-[#0A0B10] ${hasNewSignal ? "animate-ping" : "animate-pulse"}`}
            style={{
              boxShadow: "0 0 16px rgba(34,211,166,0.5)",
            }}
          />

          {/* PRO badge */}
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#F0B90B] text-[7px] font-bold text-black rounded-full shadow-[0_0_12px_rgba(240,185,11,0.4)]">
            PRO
          </span>

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -left-2 w-5 h-5 bg-[#FB4667] text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-[0_0_16px_rgba(251,70,103,0.4)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Side Drawer ── */}
      <CopilotDrawer isOpen={isOpen} onClose={closeDrawer} />
    </>
  );
});
