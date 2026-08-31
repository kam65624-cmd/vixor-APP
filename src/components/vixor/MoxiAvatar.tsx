// ============================================================================
// MOXI — Avatar Component
// ============================================================================
//
// Renders MOXI's 2.5D-style avatar as a gradient circle with the
// variant's symbol. Supports 8 visual variants via persona system.
//
// Usage:
//   <MoxiAvatar variant="flame" size={40} />
//   <MoxiAvatar variant="default" size={56} pulse />
// ============================================================================

import { memo } from "react";
import type { MoxiAvatarVariant } from "@/domains/moxi/types";
import { AVATAR_VARIANTS } from "@/domains/moxi/persona";

interface MoxiAvatarProps {
  /** Which visual variant to render */
  variant?: MoxiAvatarVariant;
  /** Size in pixels (square) */
  size?: number;
  /** Show a pulsing glow animation (e.g., when MOXI is "thinking") */
  pulse?: boolean;
  /** Optional CSS style overrides */
  style?: React.CSSProperties;
  /** Optional className */
  className?: string;
}

export const MoxiAvatar = memo(function MoxiAvatar({
  variant = "default",
  size = 40,
  pulse = false,
  style: customStyle,
  className,
}: MoxiAvatarProps) {
  const config = AVATAR_VARIANTS[variant] || AVATAR_VARIANTS.default;
  const [g1, g2] = config.gradient;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${g1}, ${g2})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        boxShadow: pulse ? `0 0 0 0 rgba(${hexToRgb(g1)}, 0.4)` : `0 2px 8px rgba(0,0,0,0.3)`,
        animation: pulse ? "moxi-avatar-pulse 2s ease-in-out infinite" : undefined,
        ...customStyle,
      }}
    >
      {/* Inner 2.5D effect — subtle highlight */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "15%",
          width: "40%",
          height: "30%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          filter: "blur(3px)",
          pointerEvents: "none",
        }}
      />
      {/* Symbol */}
      <span
        style={{
          fontSize: Math.round(size * 0.4),
          fontWeight: 800,
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          lineHeight: 1,
          zIndex: 1,
        }}
      >
        {config.symbol}
      </span>

      {/* Pulse animation keyframes — injected once */}
      {pulse && <MoxiPulseStyle />}
    </div>
  );
});

/** Injects the pulse keyframes (only when pulse=true) */
function MoxiPulseStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes moxi-avatar-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(167,139,250,0); }
}
@media (prefers-reduced-motion: reduce) {
  .moxi-avatar-pulse { animation: none !important; }
}`,
      }}
    />
  );
}

// ── Utility ────────────────────────────────────────────────────────────────

/** Convert hex color to "r,g,b" string for rgba() usage */
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
