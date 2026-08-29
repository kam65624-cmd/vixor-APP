import { useRef, useEffect } from "react";
import { Maximize2 } from "lucide-react";
import { CARD } from "./constants";

/**
 * ChartCanvasOverlay
 *
 * Renders a chart image with a canvas overlay that draws FVG, Order Blocks,
 * Liquidity Zones, Support/Resistance lines, and Pivots based on bounding-box
 * data embedded in the analysis object.
 */
export function ChartCanvasOverlay({
  analysis,
  imageUrl,
  onZoom,
}: {
  analysis: any;
  imageUrl: string;
  onZoom: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !analysis) return;

    const draw = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      const getRect = (box: any) => {
        if (Array.isArray(box) && box.length >= 4) {
          return {
            y: box[0] * h,
            x: box[1] * w,
            h: (box[2] - box[0]) * h,
            w: (box[3] - box[1]) * w,
          };
        }
        if (typeof box === "object" && box !== null) {
          const ymin = box.ymin ?? box.y1 ?? box.top ?? 0;
          const xmin = box.xmin ?? box.x1 ?? box.left ?? 0;
          const ymax = box.ymax ?? box.y2 ?? box.bottom ?? 0;
          const xmax = box.xmax ?? box.x2 ?? box.right ?? 0;
          const scaleY = ymin <= 1 && ymax <= 1 ? h : 1;
          const scaleX = xmin <= 1 && xmax <= 1 ? w : 1;
          return {
            y: ymin * scaleY,
            x: xmin * scaleX,
            h: Math.abs(ymax - ymin) * scaleY,
            w: Math.abs(xmax - xmin) * scaleX,
          };
        }
        return null;
      };

      // FVG (Fair Value Gaps) - Green/Red boxes
      if (Array.isArray(analysis.fvgs)) {
        analysis.fvgs.forEach((fvg: any) => {
          const rect = getRect(fvg.box || fvg);
          if (!rect) return;
          const isBullish = fvg.type === "bullish" || fvg.direction === "up";
          ctx.fillStyle = isBullish ? "rgba(34,211,166,0.2)" : "rgba(251,70,103,0.2)";
          ctx.strokeStyle = isBullish ? "rgba(34,211,166,0.8)" : "rgba(251,70,103,0.8)";
          ctx.lineWidth = 2;
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = "bold 14px sans-serif";
          ctx.fillText("FVG", rect.x + 4, rect.y + 16);
        });
      }

      // Order Blocks (OB) - Solid dashed boxes
      if (Array.isArray(analysis.orderBlocks)) {
        analysis.orderBlocks.forEach((ob: any) => {
          const rect = getRect(ob.box || ob);
          if (!rect) return;
          const isBullish = ob.type === "bullish" || ob.direction === "up";
          ctx.fillStyle = isBullish
            ? "color-mix(in srgb, var(--color-bullish) 15%, transparent)"
            : "color-mix(in srgb, var(--color-bearish) 15%, transparent)";
          ctx.strokeStyle = isBullish ? "rgba(34,211,166,1)" : "rgba(251,70,103,1)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
          ctx.setLineDash([]);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = "bold 14px sans-serif";
          ctx.fillText("OB", rect.x + 4, rect.y + 16);
        });
      }

      // Liquidity Zones - Yellow/Orange filled areas
      if (Array.isArray(analysis.liquidityZones)) {
        analysis.liquidityZones.forEach((lz: any) => {
          const rect = getRect(lz.box || lz);
          if (!rect) return;
          ctx.fillStyle = "rgba(245,166,35,0.2)";
          ctx.strokeStyle = "rgba(245,166,35,0.8)";
          ctx.lineWidth = 2;
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = "bold 14px sans-serif";
          ctx.fillText("Liquidity", rect.x + 4, rect.y + 16);
        });
      }

      // Support / Resistance Levels (Lines)
      if (Array.isArray(analysis.srLevels)) {
        analysis.srLevels.forEach((sr: any) => {
          const rect = getRect(sr.box || sr);
          const y = rect ? rect.y : (sr.y ?? sr.price ?? 0) * (sr.y <= 1 ? h : 1);
          if (y === 0) return;
          ctx.strokeStyle = sr.type === "support" ? "rgba(34,211,166,0.8)" : "rgba(251,70,103,0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = "bold 14px sans-serif";
          ctx.fillText(sr.type === "support" ? "Support" : "Resistance", 10, y - 4);
        });
      }

      // Pivots (Tops / Bottoms)
      if (Array.isArray(analysis.pivots)) {
        analysis.pivots.forEach((pivot: any) => {
          const rect = getRect(pivot.box || pivot);
          const y = rect ? rect.y : (pivot.y ?? pivot.price ?? 0) * (pivot.y <= 1 ? h : 1);
          const x = rect ? rect.x + rect.w / 2 : (pivot.x ?? w / 2);
          if (y === 0) return;
          ctx.fillStyle = pivot.type === "top" ? "rgba(251,70,103,1)" : "rgba(34,211,166,1)";
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = "bold 12px sans-serif";
          ctx.fillText(pivot.type === "top" ? "Top" : "Bottom", x + 10, y + 4);
        });
      }
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [analysis, imageUrl]);

  return (
    <div
      style={{
        ...CARD,
        margin: "0 16px 16px",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        background: "oklch(0 0 0)",
      }}
      onClick={onZoom}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Analyzed chart"
        style={{
          width: "100%",
          maxHeight: "240px",
          objectFit: "contain",
          display: "block",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "oklch(0 0 0 / 0.60)",
          backdropFilter: "blur(8px)",
          color: "var(--color-foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Maximize2 size={16} />
      </div>
    </div>
  );
}
