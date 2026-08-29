import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Layers, Maximize2, X } from "lucide-react";
import { CARD } from "./constants";

export interface ChartWithAnnotationsProps {
  imageUrl: string;
  analysis: any;
  isBullish: boolean;
  isBearish: boolean;
}

/**
 * ChartWithAnnotations
 *
 * Renders a chart image with a canvas overlay that draws price-based annotations
 * (FVG, Order Blocks, S/R levels, Liquidity levels, Entry/SL/TP lines)
 * using price-to-pixel mapping derived from chart high/low.
 */
export function ChartWithAnnotations({
  imageUrl,
  analysis,
  isBullish,
  isBearish,
}: ChartWithAnnotationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgZoomLocal, setImgZoomLocal] = useState(false);

  const fvgs = useMemo(() => {
    const raw = analysis?.raw_ai_response ?? {};
    return (analysis?.fvgs ?? raw.fvgs ?? []) as Array<{
      type: "bullish" | "bearish";
      top: number;
      bottom: number;
      start_bar?: number;
      end_bar?: number;
    }>;
  }, [analysis]);

  const orderBlocks = useMemo(() => {
    const raw = analysis?.raw_ai_response ?? {};
    return (analysis?.order_blocks ??
      raw.order_blocks ??
      analysis?.orderBlocks ??
      raw.orderBlocks ??
      []) as Array<{
      type: "bullish" | "bearish";
      top: number;
      bottom: number;
      bar?: number;
      strength?: string;
    }>;
  }, [analysis]);

  const srLevels = useMemo(() => {
    const raw = analysis?.raw_ai_response ?? {};
    return (analysis?.sr_levels ??
      raw.sr_levels ??
      analysis?.srLevels ??
      raw.srLevels ??
      []) as Array<{
      type: "support" | "resistance";
      price: number;
      strength?: string;
    }>;
  }, [analysis]);

  const liquidityZones = useMemo(() => {
    const raw = analysis?.raw_ai_response ?? {};
    return (analysis?.liquidity_zones ??
      raw.liquidity_zones ??
      analysis?.liquidityZones ??
      raw.liquidityZones ??
      []) as Array<{
      type: "buy_side" | "sell_side";
      price: number;
    }>;
  }, [analysis]);

  const priceRange = useMemo(() => {
    const raw = analysis?.raw_ai_response ?? {};
    return {
      high:
        analysis?.high_price ?? raw.high_price ?? analysis?.chart_high ?? raw.chart_high ?? null,
      low: analysis?.low_price ?? raw.low_price ?? analysis?.chart_low ?? raw.chart_low ?? null,
    };
  }, [analysis]);

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const W = img.clientWidth;
    const H = img.clientHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    if (!showAnnotations) return;

    const high = priceRange.high;
    const low = priceRange.low;
    const hasPrice = high != null && low != null && high > low;

    const priceToY = (price: number): number => {
      if (!hasPrice) return 0;
      return H - ((price - low!) / (high! - low!)) * H;
    };

    // ── Draw FVGs ──────────────────────────────────────────────────────────
    fvgs.forEach((fvg) => {
      if (!hasPrice) return;
      const y1 = priceToY(fvg.top);
      const y2 = priceToY(fvg.bottom);
      const rectH = Math.abs(y2 - y1);
      const rectY = Math.min(y1, y2);
      const color = fvg.type === "bullish" ? "var(--color-bullish)" : "var(--color-bearish)";

      ctx.fillStyle =
        fvg.type === "bullish"
          ? "color-mix(in srgb, var(--color-bullish) 12%, transparent)"
          : "color-mix(in srgb, var(--color-bearish) 12%, transparent)";
      ctx.fillRect(0, rectY, W, rectH);

      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(0, rectY, W, rectH);
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(`FVG ${fvg.type === "bullish" ? "▲" : "▼"}`, 6, rectY + 12);
    });

    // ── Draw Order Blocks ──────────────────────────────────────────────────
    orderBlocks.forEach((ob) => {
      if (!hasPrice) return;
      const y1 = priceToY(ob.top);
      const y2 = priceToY(ob.bottom);
      const rectH = Math.abs(y2 - y1);
      const rectY = Math.min(y1, y2);
      const color = ob.type === "bullish" ? "var(--color-primary)" : "var(--color-neutral-wait)";

      ctx.fillStyle =
        ob.type === "bullish"
          ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
          : "color-mix(in srgb, var(--color-neutral-wait) 15%, transparent)";
      ctx.fillRect(0, rectY, W, rectH);

      ctx.fillStyle = color;
      ctx.fillRect(0, rectY, 3, rectH);

      ctx.fillStyle = color;
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(`OB ${ob.type === "bullish" ? "▲" : "▼"}`, 8, rectY + 12);
    });

    // ── Draw S/R Levels ───────────────────────────────────────────────────
    srLevels.forEach((sr) => {
      if (!hasPrice) return;
      const y = priceToY(sr.price);
      const color = sr.type === "support" ? "var(--color-bullish)" : "var(--color-bearish)";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = sr.type === "support" ? "S" : "R";
      const price = sr.price.toFixed(2);
      ctx.fillStyle = color + "22";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const pillW = 50,
        pillH = 14;
      ctx.roundRect(W - pillW - 4, y - pillH / 2, pillW, pillH, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "bold 9px 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${label} ${price}`, W - 7, y + 4);
      ctx.textAlign = "left";
    });

    // ── Draw Liquidity Levels ─────────────────────────────────────────────
    liquidityZones.forEach((liq) => {
      if (!hasPrice) return;
      const y = priceToY(liq.price);
      const color = liq.type === "buy_side" ? "var(--color-bullish)" : "var(--color-bearish)";
      const label = liq.type === "buy_side" ? "BSL" : "SSL";

      ctx.strokeStyle = color + "99";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font = "bold 9px 'Inter', sans-serif";
      ctx.fillText(label, 6, y - 3);
    });

    // ── Draw Entry/SL/TP lines if we have price data ──────────────────────
    const entry = typeof analysis?.entry === "number" ? analysis.entry : null;
    const sl = typeof analysis?.stop_loss === "number" ? analysis.stop_loss : null;
    const tps = Array.isArray(analysis?.take_profit) ? analysis.take_profit : null;

    if (hasPrice && entry) {
      const ey = priceToY(entry);
      ctx.strokeStyle = "var(--color-primary)";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, ey);
      ctx.lineTo(W, ey);
      ctx.stroke();
      ctx.fillStyle = "color-mix(in srgb, var(--color-primary) 15%, transparent)";
      ctx.fillRect(W - 54, ey - 9, 50, 16);
      ctx.fillStyle = "var(--color-primary)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`ENT ${entry.toFixed(2)}`, W - 6, ey + 4);
      ctx.textAlign = "left";
    }

    if (hasPrice && sl) {
      const sy = priceToY(sl);
      ctx.strokeStyle = "var(--color-bearish)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(W, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "var(--color-bearish)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`SL ${sl.toFixed(2)}`, W - 6, sy - 3);
      ctx.textAlign = "left";
    }

    if (hasPrice && tps) {
      const tpColors = ["var(--color-bullish)", "var(--color-tp2)", "var(--color-tp3)"];
      (tps as number[]).forEach((tp, i) => {
        if (typeof tp !== "number") return;
        const ty = priceToY(tp);
        const color = tpColors[i] ?? "var(--color-bullish)";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(W, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`TP${i + 1} ${tp.toFixed(2)}`, W - 6, ty - 3);
        ctx.textAlign = "left";
      });
    }
  }, [
    showAnnotations,
    imgLoaded,
    fvgs,
    orderBlocks,
    srLevels,
    liquidityZones,
    priceRange,
    analysis,
  ]);

  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  useEffect(() => {
    const ro = new ResizeObserver(() => drawAnnotations());
    if (imgRef.current) ro.observe(imgRef.current);
    return () => ro.disconnect();
  }, [drawAnnotations]);

  const hasAnyAnnotations =
    fvgs.length > 0 || orderBlocks.length > 0 || srLevels.length > 0 || liquidityZones.length > 0;
  const recColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";

  return (
    <div style={{ ...CARD, margin: "0 16px 16px", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={14} style={{ color: recColor }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
            Chart Analysis
          </span>
          {hasAnyAnnotations && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
                background: "var(--color-muted)",
                padding: "1px 7px",
                borderRadius: 20,
              }}
            >
              {fvgs.length + orderBlocks.length + srLevels.length + liquidityZones.length} zones
            </span>
          )}
        </div>
        {hasAnyAnnotations && (
          <button
            onClick={() => setShowAnnotations((v) => !v)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: showAnnotations ? recColor : "var(--color-muted-foreground)",
              background: showAnnotations ? `${recColor}18` : "var(--color-muted)",
              border: `1px solid ${showAnnotations ? `${recColor}40` : "var(--color-border)"}`,
              borderRadius: 20,
              padding: "3px 10px",
              cursor: "pointer",
              transition: "all var(--transition-base)",
            }}
          >
            {showAnnotations ? "Hide Zones" : "Show Zones"}
          </button>
        )}
      </div>

      {/* Image + Canvas overlay */}
      <div
        ref={containerRef}
        style={{ position: "relative", cursor: "pointer", background: "var(--color-foreground)" }}
        onClick={() => setImgZoomLocal(true)}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Analyzed chart"
          onLoad={() => {
            setImgLoaded(true);
          }}
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
            inset: 0,
            pointerEvents: "none",
          }}
        />
        <button
          type="button"
          aria-label="Zoom chart"
          onClick={(e) => {
            e.stopPropagation();
            setImgZoomLocal(true);
          }}
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--overlay)",
            backdropFilter: "blur(8px)",
            color: "var(--color-foreground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Maximize2 size={20} />
        </button>
      </div>

      {/* Legend */}
      {hasAnyAnnotations && showAnnotations && (
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "8px 12px",
            borderTop: "1px solid var(--color-border)",
            flexWrap: "wrap",
          }}
        >
          {fvgs.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: "color-mix(in srgb, var(--color-bullish) 30%, transparent)",
                  border: "1px dashed var(--color-bullish)",
                  display: "inline-block",
                  borderRadius: 2,
                }}
              />
              <span style={{ color: "var(--color-muted-foreground)" }}>FVG ({fvgs.length})</span>
            </span>
          )}
          {orderBlocks.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                  borderLeft: "3px solid var(--color-primary)",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "var(--color-muted-foreground)" }}>
                OB ({orderBlocks.length})
              </span>
            </span>
          )}
          {srLevels.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span
                style={{
                  width: 12,
                  height: 2,
                  background: "var(--color-bullish)",
                  display: "inline-block",
                  borderRadius: 1,
                }}
              />
              <span style={{ color: "var(--color-muted-foreground)" }}>
                S/R ({srLevels.length})
              </span>
            </span>
          )}
          {liquidityZones.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span
                style={{
                  width: 12,
                  height: 1,
                  background: "var(--color-neutral-wait)",
                  borderTop: "1px dotted var(--color-neutral-wait)",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "var(--color-muted-foreground)" }}>
                Liquidity ({liquidityZones.length})
              </span>
            </span>
          )}
        </div>
      )}

      {/* Full-screen zoom */}
      {imgZoomLocal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "color-mix(in srgb, var(--color-background) 96%, transparent)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setImgZoomLocal(false)}
        >
          <button
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-foreground)",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
          <img
            src={imageUrl}
            alt="Chart (full screen)"
            style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
}
