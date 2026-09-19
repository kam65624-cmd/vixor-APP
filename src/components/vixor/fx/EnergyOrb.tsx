// ============================================================================
// VIXOR FX — EnergyOrb
// ============================================================================
//
// Ambient "AI core" glow (ThreeUI-inspired, v2 P2 3D layer). Pure CSS:
// layered radial gradients + soft pulse — zero canvas, zero WebGL, zero JS
// after mount, so it is free on mobile batteries.
//
// Behavior contract:
//   - Color resolves from a canonical --char-* token (never a hex prop)
//   - Pulse is disabled under prefers-reduced-motion
//   - aria-hidden + pointer-events-none: decorative only
//
// Usage: parent MUST be positioned (relative/absolute).
//
//   <div className="relative">
//     <EnergyOrb colorVar="--char-moxi" size={260} />
//     …content…
//   </div>
//
// ============================================================================

import { memo } from "react";

import { cn } from "@/shared/utils/cn";

export interface EnergyOrbProps {
  /** Canonical token, e.g. "--char-moxi". Must exist in src/styles.css. */
  colorVar?: string;
  /** Diameter in px. Default 240. */
  size?: number;
  /** Overall opacity. Default 0.5. */
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const EnergyOrb = memo(function EnergyOrb({
  colorVar = "--char-moxi",
  size = 240,
  opacity = 0.5,
  className,
  style,
}: EnergyOrbProps) {
  return (
    <div
      aria-hidden="true"
      data-fx="energy-orb"
      data-fx-color={colorVar}
      className={cn("pointer-events-none absolute z-0 rounded-full", "vixor-energy-orb", className)}
      style={{
        width: size,
        height: size,
        opacity,
        // Core: bright center → color halo → fully transparent edge
        background: `radial-gradient(circle at 50% 50%,
          color-mix(in srgb, var(${colorVar}) 55%, transparent) 0%,
          color-mix(in srgb, var(${colorVar}) 22%, transparent) 38%,
          transparent 70%)`,
        filter: "blur(18px)",
        ...style,
      }}
    />
  );
});
