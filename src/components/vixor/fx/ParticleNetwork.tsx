// ============================================================================
// VIXOR FX — ParticleNetwork
// ============================================================================
//
// Ambient "signal web" backdrop (ThreeUI-inspired, v2 P2 3D layer).
// Lightweight 2D-canvas implementation — deliberately NOT three.js:
//   - Mobile-first budget: ~2KB logic vs ~600KB WebGL runtime
//   - 90% of the visual effect at 60fps on mid-range phones
//
// Behavior contract:
//   - Color resolves from a canonical --char-* token (never a hex prop)
//   - Particle count scales with area and is capped for small screens
//   - Pauses when offscreen (IntersectionObserver) or tab hidden
//   - prefers-reduced-motion → renders a single static frame, no RAF loop
//   - Destroys observers/listeners/RAF on unmount
//
// Usage: parent MUST be positioned (relative/absolute). The canvas renders
// behind siblings — place it first and give content `position: relative`.
//
//   <div className="relative">
//     <ParticleNetwork colorVar="--char-vigo" />
//     <CharacterGuide character="mrVigo" />
//   </div>
//
// ============================================================================

import { memo, useEffect, useRef } from "react";

import { cn } from "@/shared/utils/cn";

export interface ParticleNetworkProps {
  /** Canonical token, e.g. "--char-vigo". Must exist in src/styles.css. */
  colorVar?: string;
  /** Density multiplier (0.5 = half particles). Default 1. */
  density?: number;
  /** Overall canvas opacity. Default 0.55. */
  opacity?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const LINK_DISTANCE = 110;
const AREA_PER_PARTICLE = 16_000;
const MAX_PARTICLES = 70;
const MAX_PARTICLES_SMALL = 30; // cap for viewports under 420px wide

function readTokenColor(colorVar: string): string {
  if (typeof window === "undefined") return "#06b6d4";
  const raw = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim();
  return raw || "#06b6d4";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export const ParticleNetwork = memo(function ParticleNetwork({
  colorVar = "--char-moxi",
  density = 1,
  opacity = 0.55,
  className,
}: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom / very old browsers — render nothing, never crash

    const color = readTokenColor(colorVar);
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let visible = true;
    let disposed = false;

    const spawn = (w: number, h: number): Particle[] => {
      const small = w < 420;
      const cap = small ? MAX_PARTICLES_SMALL : MAX_PARTICLES;
      const count = Math.min(cap, Math.max(12, Math.floor((w * h) / AREA_PER_PARTICLE)));
      const n = Math.max(8, Math.round(count * density));
      const out: Particle[] = [];
      for (let i = 0; i < n; i++) {
        out.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.6,
        });
      }
      return out;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = spawn(w, h);
      if (!running) drawFrame(true); // static frame for reduced-motion / paused
    };

    const drawFrame = (final = false) => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Links first, particles on top
      ctx.strokeStyle = color;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
            const alpha = (1 - Math.sqrt(d2) / LINK_DISTANCE) * 0.35;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      for (const p of particles) {
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (final) running = false;
    };

    const step = () => {
      if (!running || disposed) return;
      const w = canvas.parentElement?.clientWidth ?? 0;
      const h = canvas.parentElement?.clientHeight ?? 0;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;
        if (p.y < -8) p.y = h + 8;
        if (p.y > h + 8) p.y = -8;
      }
      drawFrame();
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || disposed || !visible || document.hidden) return;
      if (prefersReducedMotion()) {
        drawFrame(true); // one static frame, no loop
        return;
      }
      running = true;
      raf = requestAnimationFrame(step);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => resize());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    resize();
    start();

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [colorVar, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-fx="particle-network"
      data-fx-color={colorVar}
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
      style={{ opacity }}
    />
  );
});
