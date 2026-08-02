// ============================================================================
// MOXI — 3D Side Character
// ============================================================================
//
// A pure-CSS 3D AI companion that floats on the right side of the screen.
// Uses CSS transforms (perspective, rotateY) for the 3D look.
// Clicking opens the copilot with optional pre-filled prompt.
//
// Usage:
//   <MoxiCharacter3D onChatOpen={(prompt) => navigate(...)} />
// ============================================================================

import { memo, useState, useCallback, useEffect } from "react";
import type { MoxiAvatarVariant } from "@/domains/moxi/types";
import { AVATAR_VARIANTS } from "@/domains/moxi/persona";

interface MoxiCharacter3DProps {
  variant?: MoxiAvatarVariant;
  onChatOpen?: (prompt?: string) => void;
  className?: string;
}

export const MoxiCharacter3D = memo(function MoxiCharacter3D({
  variant = "default",
  onChatOpen,
  className,
}: MoxiCharacter3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(true);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Auto-hide speech bubble after 6s
  useEffect(() => {
    const t = setTimeout(() => setShowBubble(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    onChatOpen?.();
    setTimeout(() => setIsClicked(false), 400);
    setShowBubble(false);
  }, [onChatOpen]);

  const config = AVATAR_VARIANTS[variant] || AVATAR_VARIANTS.default;
  const [c1, c2] = config.gradient;

  return (
    <>
      <MoxiCharacterStyles c1={c1} c2={c2} />
      <div
        className={`moxi-3d-wrapper ${isVisible ? "moxi-visible" : "moxi-hidden"} ${className ?? ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Open MOXI chat"
      >
        {/* Speech bubble */}
        {showBubble && !isClicked && (
          <div className="moxi-speech-bubble">
            <span>Hey! Ask me anything</span>
            <div className="moxi-bubble-tail" />
          </div>
        )}

        {/* 3D Character Container */}
        <div className={`moxi-3d-scene ${isHovered ? "moxi-hovered" : ""} ${isClicked ? "moxi-clicked" : ""}`}>
          <div className="moxi-3d-model">
            {/* ── Antenna ──────────────────────────── */}
            <div className="moxi-antenna">
              <div className="moxi-antenna-stem" />
              <div className="moxi-antenna-tip" />
            </div>

            {/* ── Head ─────────────────────────────── */}
            <div className="moxi-head">
              {/* Visor / Face plate */}
              <div className="moxi-visor">
                {/* Left Eye */}
                <div className="moxi-eye moxi-eye-left">
                  <div className="moxi-pupil" />
                </div>
                {/* Right Eye */}
                <div className="moxi-eye moxi-eye-right">
                  <div className="moxi-pupil" />
                </div>
                {/* Mouth */}
                <div className="moxi-mouth">
                  <div className="moxi-mouth-bar" />
                  <div className="moxi-mouth-bar moxi-mouth-bar-short" />
                </div>
              </div>

              {/* Head side panels for 3D depth */}
              <div className="moxi-head-panel moxi-head-panel-left" />
              <div className="moxi-head-panel moxi-head-panel-right" />

              {/* Ear pieces */}
              <div className="moxi-ear moxi-ear-left" />
              <div className="moxi-ear moxi-ear-right" />
            </div>

            {/* ── Neck ─────────────────────────────── */}
            <div className="moxi-neck" />

            {/* ── Body / Torso ─────────────────────── */}
            <div className="moxi-body">
              {/* Core glow */}
              <div className="moxi-core">
                <div className="moxi-core-inner" />
              </div>
              {/* Chest lines */}
              <div className="moxi-chest-line moxi-chest-line-1" />
              <div className="moxi-chest-line moxi-chest-line-2" />
              {/* Body side panels */}
              <div className="moxi-body-panel moxi-body-panel-left" />
              <div className="moxi-body-panel moxi-body-panel-right" />
            </div>

            {/* ── Floating particles ────────────────── */}
            <div className="moxi-particle moxi-particle-1" />
            <div className="moxi-particle moxi-particle-2" />
            <div className="moxi-particle moxi-particle-3" />
          </div>
        </div>

        {/* Glow ring beneath character */}
        <div className="moxi-glow-ring" />
      </div>
    </>
  );
});

// ── Injected Styles ──────────────────────────────────────────────────────────

function MoxiCharacterStyles({ c1, c2 }: { c1: string; c2: string }) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ═══ Wrapper ═══ */
.moxi-3d-wrapper {
  position: fixed;
  right: 8px;
  bottom: 72px;
  z-index: 40;
  cursor: pointer;
  outline: none;
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.moxi-hidden {
  opacity: 0;
  transform: translateX(30px) scale(0.8);
  pointer-events: none;
}
.moxi-visible {
  opacity: 1;
  transform: translateX(0) scale(1);
  pointer-events: auto;
}

/* ═══ Speech Bubble ═══ */
.moxi-speech-bubble {
  position: absolute;
  bottom: calc(100% + 10px);
  right: -4px;
  background: var(--color-card, #1a1a2e);
  border: 1px solid color-mix(in srgb, ${c1} 25%, transparent);
  border-radius: 12px 12px 4px 12px;
  padding: 8px 14px;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 30px -10px ${c1};
  animation: moxi-bubble-in 0.5s ease 0.8s both;
}
.moxi-speech-bubble span {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-foreground, #e0e0e0);
}
.moxi-bubble-tail {
  position: absolute;
  bottom: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background: var(--color-card, #1a1a2e);
  border-right: 1px solid color-mix(in srgb, ${c1} 25%, transparent);
  border-bottom: 1px solid color-mix(in srgb, ${c1} 25%, transparent);
  transform: rotate(45deg);
}

/* ═══ 3D Scene ═══ */
.moxi-3d-scene {
  perspective: 400px;
  perspective-origin: 50% 50%;
  transition: transform 0.4s ease;
}
.moxi-hovered .moxi-3d-scene {
  transform: scale(1.08);
}
.moxi-clicked .moxi-3d-scene {
  animation: moxi-bounce 0.4s ease;
}

/* ═══ 3D Model ═══ */
.moxi-3d-model {
  position: relative;
  width: 64px;
  height: 96px;
  transform-style: preserve-3d;
  transform: rotateY(-12deg) rotateX(2deg);
  animation: moxi-float 3s ease-in-out infinite;
  transition: transform 0.4s ease;
}
.moxi-hovered .moxi-3d-model {
  transform: rotateY(-5deg) rotateX(1deg) scale(1.05);
}

/* ═══ Antenna ═══ */
.moxi-antenna {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
}
.moxi-antenna-stem {
  width: 2px;
  height: 10px;
  background: linear-gradient(to top, ${c1}, ${c2});
  margin: 0 auto;
  border-radius: 1px;
}
.moxi-antenna-tip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${c2};
  margin: -1px auto 0;
  box-shadow: 0 0 8px ${c2}, 0 0 16px ${c1};
  animation: moxi-antenna-pulse 2s ease-in-out infinite;
}

/* ═══ Head ═══ */
.moxi-head {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%) rotateY(0deg);
  width: 40px;
  height: 32px;
  background: linear-gradient(160deg, #2a2a3e 0%, #1a1a2e 40%, #151525 100%);
  border-radius: 12px 12px 8px 8px;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow:
    0 2px 8px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.05);
  transform-style: preserve-3d;
}

/* Head side panels — gives 3D depth */
.moxi-head-panel {
  position: absolute;
  top: 2px;
  width: 6px;
  height: 28px;
  background: linear-gradient(180deg, #1e1e32, #141424);
  border-radius: 3px;
  border: 1px solid rgba(255,255,255,0.03);
}
.moxi-head-panel-left {
  left: -5px;
  transform: rotateY(-30deg) translateZ(-2px);
}
.moxi-head-panel-right {
  right: -5px;
  transform: rotateY(30deg) translateZ(-2px);
}

/* Ear pieces */
.moxi-ear {
  position: absolute;
  top: 10px;
  width: 5px;
  height: 12px;
  background: linear-gradient(180deg, ${c1}, ${c2});
  border-radius: 2px;
  opacity: 0.7;
}
.moxi-ear-left {
  left: -7px;
  transform: rotateY(-20deg);
  box-shadow: 0 0 6px ${c1};
}
.moxi-ear-right {
  right: -7px;
  transform: rotateY(20deg);
  box-shadow: 0 0 6px ${c2};
}

/* ═══ Visor / Face ═══ */
.moxi-visor {
  position: absolute;
  top: 5px;
  left: 4px;
  right: 4px;
  height: 22px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgba(255,255,255,0.04);
  overflow: hidden;
}

/* ═══ Eyes ═══ */
.moxi-eye {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, ${c1}, ${c2});
  box-shadow: 0 0 10px ${c1}, 0 0 20px rgba(${hexToRgb(c1)}, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: moxi-blink 4s ease-in-out infinite;
  position: relative;
}
.moxi-pupil {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 4px #fff;
}

/* ═══ Mouth ═══ */
.moxi-mouth {
  display: flex;
  flex-direction: column;
  align-items: center;
   gap: 2px;
  margin-top: 1px;
}
.moxi-mouth-bar {
  width: 10px;
  height: 1.5px;
  border-radius: 1px;
  background: ${c1};
  opacity: 0.5;
  box-shadow: 0 0 4px ${c1};
}
.moxi-mouth-bar-short {
  width: 6px;
}

/* ═══ Neck ═══ */
.moxi-neck {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 6px;
  background: linear-gradient(180deg, #1a1a2e, #222238);
  border-radius: 0 0 2px 2px;
}

/* ═══ Body / Torso ═══ */
.moxi-body {
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 42px;
  background: linear-gradient(170deg, #282842 0%, #1c1c30 30%, #161626 100%);
  border-radius: 6px 6px 10px 10px;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  transform-style: preserve-3d;
}

/* Body side panels — 3D depth */
.moxi-body-panel {
  position: absolute;
  top: 3px;
  width: 5px;
  height: 36px;
  background: linear-gradient(180deg, #1a1a30, #121222);
  border-radius: 2px;
  border: 1px solid rgba(255,255,255,0.02);
}
.moxi-body-panel-left {
  left: -4px;
  transform: rotateY(-25deg) translateZ(-2px);
}
.moxi-body-panel-right {
  right: -4px;
  transform: rotateY(25deg) translateZ(-2px);
}

/* Core energy */
.moxi-core {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, ${c1} 0%, ${c2} 50%, transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: moxi-core-pulse 2.5s ease-in-out infinite;
}
.moxi-core-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px ${c1}, 0 0 16px ${c2};
}

/* Chest detail lines */
.moxi-chest-line {
  position: absolute;
  left: 6px;
  right: 6px;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${c1}, transparent);
  opacity: 0.15;
}
.moxi-chest-line-1 { top: 26px; }
.moxi-chest-line-2 { top: 30px; }

/* ═══ Floating Particles ═══ */
.moxi-particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${c1};
  opacity: 0;
}
.moxi-particle-1 {
  top: 15px;
  right: -8px;
  animation: moxi-particle-float 3s ease-in-out 0.5s infinite;
}
.moxi-particle-2 {
  top: 50px;
  left: -10px;
  animation: moxi-particle-float 3.5s ease-in-out 1.2s infinite;
  background: ${c2};
}
.moxi-particle-3 {
  bottom: 10px;
  right: -6px;
  animation: moxi-particle-float 2.8s ease-in-out 0.8s infinite;
  width: 2px;
  height: 2px;
}

/* ═══ Glow Ring (shadow beneath) ═══ */
.moxi-glow-ring {
  width: 48px;
  height: 10px;
  margin: 4px auto 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, ${c1}40, transparent 70%);
  filter: blur(3px);
  animation: moxi-glow-breathe 3s ease-in-out infinite;
}

/* ═══ Keyframes ═══ */
@keyframes moxi-float {
  0%, 100% { transform: rotateY(-12deg) rotateX(2deg) translateY(0); }
  50% { transform: rotateY(-12deg) rotateX(2deg) translateY(-6px); }
}

@keyframes moxi-blink {
  0%, 42%, 48%, 100% { transform: scaleY(1); }
  45% { transform: scaleY(0.1); }
}

@keyframes moxi-antenna-pulse {
  0%, 100% { box-shadow: 0 0 8px ${c2}, 0 0 16px ${c1}; opacity: 0.8; }
  50% { box-shadow: 0 0 14px ${c2}, 0 0 28px ${c1}; opacity: 1; }
}

@keyframes moxi-core-pulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; }
 50% { transform: translateX(-50%) scale(1.15); opacity: 1; }
}

@keyframes moxi-particle-float {
  0% { opacity: 0; transform: translateY(0) scale(0.5); }
  30% { opacity: 0.7; }
  70% { opacity: 0.5; }
  100% { opacity: 0; transform: translateY(-20px) scale(0); }
}

@keyframes moxi-glow-breathe {
  0%, 100% { opacity: 0.4; transform: scaleX(1); }
  50% { opacity: 0.7; transform: scaleX(1.1); }
}

@keyframes moxi-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(0.9); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}

@keyframes moxi-bubble-in {
  0% { opacity: 0; transform: translateY(8px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* ═══ Reduced motion ═══ */
@media (prefers-reduced-motion: reduce) {
  .moxi-3d-model,
  .moxi-eye,
  .moxi-antenna-tip,
  .moxi-core,
  .moxi-particle,
  .moxi-glow-ring,
  .moxi-speech-bubble {
    animation: none !important;
  }
}
`,
      }}
    />
  );
}

// ── Utility ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
