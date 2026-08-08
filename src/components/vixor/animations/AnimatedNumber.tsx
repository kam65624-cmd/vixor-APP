// ============================================================================
// VIXOR AnimatedNumber — Flash highlight + spring counting animation
// ============================================================================
// Displays a number with smooth spring interpolation and optional
// color flash effect when the value changes. Used for live data cards.
// ============================================================================

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
  flashColor?: "bullish" | "bearish" | "none";
}

export function AnimatedNumber({
  value,
  format = (v) => v.toFixed(2),
  className = "",
  prefix = "",
  suffix = "",
  flashColor = "none",
}: AnimatedNumberProps) {
  const prevValueRef = useRef(value);
  const [flash, setFlash] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    if (Math.abs(value - startValue) < 0.0001) return;

    // Trigger flash effect
    if (flashColor !== "none") {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 500);
    }

    // Animate value change with ease-out
    const duration = 400; // ms
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = value;
      }
    }

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);

    prevValueRef.current = value;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value, flashColor]);

  const flashClass =
    flash && flashColor !== "none"
      ? flashColor === "bullish"
        ? "animate-flash-bullish"
        : "animate-flash-bearish"
      : "";

  return (
    <span
      className={`inline-block font-mono tabular-nums transition-transform duration-150 ${flashClass} ${className}`}
      style={flash ? { transform: "scale(1.04)" } : undefined}
    >
      {prefix}
      {format(displayValue)}
      {suffix}
    </span>
  );
}
