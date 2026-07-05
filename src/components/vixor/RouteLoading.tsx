import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Shimmer keyframes (injected once)                                  */
/* ------------------------------------------------------------------ */

const STYLE_ID = "vixor-shimmer";

const SHIMMER_CSS = `
@keyframes vixor-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function injectShimmerStyle(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = SHIMMER_CSS;
  document.head.appendChild(tag);
}

/* ------------------------------------------------------------------ */
/*  Skeleton bar configuration                                         */
/* ------------------------------------------------------------------ */

const BARS = [
  { width: "70%" },
  { width: "50%" },
  { width: "85%" },
  { width: "60%" },
  { width: "40%" },
  { width: "75%" },
] as const;

const BAR_HEIGHT = 12;
const BAR_RADIUS = 6;
const BAR_GAP = 12;
const BAR_BG = "#1E2028";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Full-screen shimmer skeleton used during route transitions.
 *
 * Renders 6 skeleton bars with varying widths on a dark (#0B0D10)
 * background. The shimmer animation CSS is injected exactly once
 * (identified by `<style id="vixor-shimmer">`).
 */
export default function RouteLoading() {
  useEffect(() => {
    injectShimmerStyle();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0B0D10",
        padding: 40,
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: BAR_GAP,
          maxWidth: 400,
          width: "100%",
        }}
      >
        {BARS.map(({ width }, i) => (
          <div
            key={i}
            style={{
              height: BAR_HEIGHT,
              width,
              borderRadius: BAR_RADIUS,
              backgroundColor: BAR_BG,
              backgroundImage: "linear-gradient(90deg, #1E2028 25%, #2A2D37 50%, #1E2028 75%)",
              backgroundSize: "800px 100%",
              animation: "vixor-shimmer 1.6s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}
