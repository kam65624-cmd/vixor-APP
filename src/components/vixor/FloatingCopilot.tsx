import { memo, useEffect } from "react";
import { motion, useSpring } from "framer-motion";
import { Bot } from "lucide-react";

export const FloatingCopilot = memo(function FloatingCopilot() {
  const floatY = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const interval = setInterval(() => {
      floatY.set(Math.sin(Date.now() / 2000) * 8);
    }, 50);
    return () => clearInterval(interval);
  }, [floatY]);

  return (
    <motion.button
      className="fixed bottom-24 right-4 z-40 group md:bottom-8"
      style={{ y: floatY }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Open MOXI AI"
      onClick={() => {
        window.location.href = "/analyze";
      }}
    >
      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_8px_40px_rgba(99,102,241,0.4)] flex items-center justify-center border border-[rgba(255,255,255,0.1)]">
        {/* Pulsing glow background */}
        <motion.span
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl bg-[#6366F1] opacity-30"
        />
        <Bot className="w-7 h-7 text-white relative z-10" strokeWidth={1.8} />
        {/* Live dot */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#22D3A6] rounded-full border-2 border-[#0A0B10] animate-pulse shadow-[0_0_16px_rgba(34,211,166,0.5)]" />
        {/* PRO badge */}
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#F0B90B] text-[7px] font-bold text-black rounded-full">
          PRO
        </span>
      </div>
    </motion.button>
  );
});
