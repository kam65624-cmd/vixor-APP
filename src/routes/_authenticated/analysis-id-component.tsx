import { Link, useParams } from "@tanstack/react-router";
import { RecBadge, ConfidenceBar } from "@/components/vixor/atoms";
import {
  ArrowLeft,
  Share2,
  Bookmark,
  AlertTriangle,
  BookOpen,
  Layers,
  Target,
  Loader2,
  Maximize2,
  Zap,
  BrainCircuit,
  Activity,
  BarChart2,
  TrendingUp,
  Newspaper,
  ShieldCheck,
  TrendingDown,
  CheckCircle,
  ChevronRight,
  X,
  StickyNote,
  Plus,
  Pin,
  Trash2,
  Radio,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { getAnalysis } from "@/domains/analysis/functions";
import { getNotesByAnalysis, deleteNote } from "@/domains/notes/functions";
import type { TradingNote, Mood } from "@/domains/notes/types";
import { NoteEditorDialog } from "@/components/vixor/NoteEditorDialog";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { PageLayout, ScrollArea, Badge, ProgressBar } from "@/components/vixor/PageLayout";
import { shareOnX, shareOnTelegram } from "@/shared/share";
import type { ShareableSignal } from "@/shared/share";
import { createSignalTracking } from "@/domains/signal-tracking/functions";

// ── Local style constants ──────────────────────────────────────────────
const GREEN_DEEP = "var(--color-bullish)";
const GREEN_GRAD = `linear-gradient(to right, ${"var(--color-bullish)"}, ${GREEN_DEEP})`;

const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: "12px",
  boxShadow: "0 4px 24px -8px oklch(0 0 0 / 0.4)",
};

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

const LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-muted-foreground)",
};

const TABS = ["Trade Setup", "Market Context", "News Impact", "Management"] as const;
interface Scenario {
  name: string;
  probability: number;
  entry: string;
  sl: number;
  tp1: number;
  tp2: number;
  rr: string;
}

// SMC/ICT term highlighter
function highlightSMC(text: string): React.ReactNode[] {
  const smcTerms = [
    "Order Block",
    "Fair Value Gap",
    "FVG",
    "Liquidity",
    "BOS",
    "ChoCh",
    "CHOCH",
    "ICT",
    "SMC",
    "Sweep",
    "Mitigation",
    "Break of Structure",
    "Change of Character",
    "Imbalance",
    "Premium",
    "Discount",
    "OB",
    "NWOG",
    "NDOG",
  ];
  const regex = new RegExp(
    `(${smcTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (smcTerms.some((t) => t.toLowerCase() === part.toLowerCase())) {
      return (
        <span
          key={i}
          style={{
            color: "var(--color-bullish)",
            fontWeight: 700,
            background: `rgba(14,203,129,0.10)`,
            padding: "0 2px",
            borderRadius: "2px",
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function ChartCanvasOverlay({
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
      // Match canvas internal resolution to the image natural resolution
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Helper to parse normalized bounding box [ymin, xmin, ymax, xmax] or [y1, x1, y2, x2]
      const getRect = (box: any) => {
        if (Array.isArray(box) && box.length >= 4) {
          // Check if it's [ymin, xmin, ymax, xmax]
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
          // If values are <= 1, assume normalized, otherwise pixel values
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
          ctx.fillStyle = isBullish ? "rgba(14,203,129,0.2)" : "rgba(246,70,93,0.2)";
          ctx.strokeStyle = isBullish ? "rgba(14,203,129,0.8)" : "rgba(246,70,93,0.8)";
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
          ctx.fillStyle = isBullish ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)";
          ctx.strokeStyle = isBullish ? "rgba(14,203,129,1)" : "rgba(246,70,93,1)";
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
          ctx.fillStyle = "rgba(245,158,11,0.2)";
          ctx.strokeStyle = "rgba(245,158,11,0.8)";
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
          ctx.strokeStyle = sr.type === "support" ? "rgba(14,203,129,0.8)" : "rgba(246,70,93,0.8)";
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
          ctx.fillStyle = pivot.type === "top" ? "rgba(246,70,93,1)" : "rgba(14,203,129,1)";
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

// ── Chart with Canvas Annotations ────────────────────────────────────────────
// Draws FVG, Order Blocks, Support/Resistance, and Liquidity zones
// directly on the chart image using HTML5 Canvas API.

interface AnnotationConfig {
  imageUrl: string;
  analysis: any;
  isBullish: boolean;
  isBearish: boolean;
}

function ChartWithAnnotations({ imageUrl, analysis, isBullish, isBearish }: AnnotationConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgZoomLocal, setImgZoomLocal] = useState(false);

  // Extract annotation data from analysis
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

    // Price-to-pixel helper
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
      const color = fvg.type === "bullish" ? "#0ECB81" : "#F6465D";

      // Fill box
      ctx.fillStyle = fvg.type === "bullish" ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)";
      ctx.fillRect(0, rectY, W, rectH);

      // Top border
      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(0, rectY, W, rectH);
      ctx.setLineDash([]);

      // Label
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
      const color = ob.type === "bullish" ? "#7C9BC4" : "#F59E0B";

      ctx.fillStyle = ob.type === "bullish" ? "rgba(124,155,196,0.15)" : "rgba(245,158,11,0.15)";
      ctx.fillRect(0, rectY, W, rectH);

      // Left accent bar
      ctx.fillStyle = color;
      ctx.fillRect(0, rectY, 3, rectH);

      // Label
      ctx.fillStyle = color;
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(`OB ${ob.type === "bullish" ? "▲" : "▼"}`, 8, rectY + 12);
    });

    // ── Draw S/R Levels ───────────────────────────────────────────────────
    srLevels.forEach((sr) => {
      if (!hasPrice) return;
      const y = priceToY(sr.price);
      const color = sr.type === "support" ? "#0ECB81" : "#F6465D";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label pill
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
      const color = liq.type === "buy_side" ? "#0ECB81" : "#F6465D";
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
      ctx.strokeStyle = "#7C9BC4";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, ey);
      ctx.lineTo(W, ey);
      ctx.stroke();
      ctx.fillStyle = "rgba(124,155,196,0.15)";
      ctx.fillRect(W - 54, ey - 9, 50, 16);
      ctx.fillStyle = "#7C9BC4";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`ENT ${entry.toFixed(2)}`, W - 6, ey + 4);
      ctx.textAlign = "left";
    }

    if (hasPrice && sl) {
      const sy = priceToY(sl);
      ctx.strokeStyle = "#F6465D";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(W, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#F6465D";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`SL ${sl.toFixed(2)}`, W - 6, sy - 3);
      ctx.textAlign = "left";
    }

    if (hasPrice && tps) {
      const tpColors = ["#0ECB81", "#34D399", "#6EE7B7"];
      (tps as number[]).forEach((tp, i) => {
        if (typeof tp !== "number") return;
        const ty = priceToY(tp);
        const color = tpColors[i] ?? "#0ECB81";
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

  // Redraw whenever data or toggle changes
  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  // Redraw on window resize
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
              transition: "all 0.2s ease",
            }}
          >
            {showAnnotations ? "Hide Zones" : "Show Zones"}
          </button>
        )}
      </div>

      {/* Image + Canvas overlay */}
      <div
        ref={containerRef}
        style={{ position: "relative", cursor: "pointer", background: "#000" }}
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
        {/* Expand button */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(0,0,0,0.65)",
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
                  background: "rgba(14,203,129,0.3)",
                  border: "1px dashed #0ECB81",
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
                  background: "rgba(124,155,196,0.3)",
                  borderLeft: "3px solid #7C9BC4",
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
                  background: "#0ECB81",
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
                  background: "#F59E0B",
                  borderTop: "1px dotted #F59E0B",
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
            background: "rgba(0,0,0,0.96)",
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
              background: "rgba(124,155,196,0.10)",
              border: "1px solid rgba(124,155,196,0.20)",
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

export function AnalysisResult() {
  const { id } = useParams({ from: "/_authenticated/analysis/$id" });
  // Use stable server function reference to prevent infinite re-render loop (React error #310)
  const fetchAnalysis = useStableServerFn(getAnalysis);

  // Memoize the query arguments to prevent re-renders from new object references
  const queryOpts = useMemo(
    () => ({
      queryKey: ["analysis", id] as const,
      queryFn: () => fetchAnalysis({ data: { id } }),
      enabled: !!id,
      staleTime: 10_000,
      // REMOVED: placeholderData: (prev) => prev — caused re-render loops
      // because each fetch returns a new object reference, and placeholderData
      // kept the old ref alive, confusing React's reconciliation → React #310.
      refetchInterval: (query: { state: { data?: { status?: string } } }) => {
        const s = query.state.data?.status;
        if (s === "complete") return 300_000; // Refresh every 5 min for completed analyses (keeps tracked signals current)
        if (s === "failed") return false;
        return 3000;
      },
    }),
    [id, fetchAnalysis],
  );

  const q = useQuery(queryOpts);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Trade Setup");
  const [imgZoom, setImgZoom] = useState(false);

  const a = q.data as any;
  const isLoading = q.isLoading || !a || (a.status !== "complete" && a.status !== "failed");
  const isFailed = a?.status === "failed";
  const isComplete = a?.status === "complete";

  // signal_badge may be in a top-level column or inside raw_ai_response
  const raw = (a?.raw_ai_response ?? {}) as Record<string, any>;
  const signalBadge = (a?.signal_badge ?? raw.signal_badge ?? null) as {
    direction: "BUY" | "SELL" | "WAIT";
    entry: string;
    stop_loss: string;
    take_profit: string;
    rr: string;
  } | null;
  const vixorMsg = a?.vixor_message ?? raw.vixor_message ?? null;
  const scenarios = (a?.scenarios ?? raw.scenarios ?? null) as {
    conservative: Scenario;
    balanced: Scenario;
    aggressive: Scenario;
  } | null;
  const management = (a?.management ?? raw.management ?? []) as string[];
  const isBullish = a?.recommendation === "BUY";
  const isBearish = a?.recommendation === "SELL";
  const isWait = a?.recommendation === "WAIT";

  const [shareOpen, setShareOpen] = useState(false);

  // Share handler — formats analysis data and opens X/Telegram share
  const shareSignal: ShareableSignal = useMemo(
    () => ({
      pair: a?.pair ?? "",
      direction: (a?.recommendation ?? "WAIT") as "BUY" | "SELL" | "WAIT",
      confidence: a?.confidence ?? undefined,
      entry: typeof a?.entry === "number" ? a.entry : null,
      stopLoss: typeof a?.stop_loss === "number" ? a.stop_loss : null,
      takeProfit: Array.isArray(a?.take_profit) ? a.take_profit : null,
      pattern: a?.pattern ?? null,
      reasons: Array.isArray(a?.reasons) ? a.reasons : null,
      timeframe: a?.timeframe ?? undefined,
      source: "VIXOR AI",
    }),
    [a],
  );

  const handleShareX = useCallback(() => {
    shareOnX(shareSignal);
    setShareOpen(false);
  }, [shareSignal]);

  const handleShareTelegram = useCallback(() => {
    shareOnTelegram(shareSignal);
    setShareOpen(false);
  }, [shareSignal]);

  // ── Track as Signal mutation ──
  const stableCreateTracking = useStableServerFn(createSignalTracking);
  const trackMutation = useMutation({
    mutationFn: () =>
      stableCreateTracking({
        data: {
          pair: a.pair,
          direction: a.recommendation as "BUY" | "SELL",
          sourceType: "analysis",
          signalId: id,
          entryPrice: a.entry != null ? parseFloat(String(a.entry)) : undefined,
          stopLoss: a.stop_loss != null ? parseFloat(String(a.stop_loss)) : undefined,
          takeProfit: Array.isArray(a.take_profit)
            ? a.take_profit.map((v: unknown) => parseFloat(String(v)))
            : undefined,
        },
      }),
  });

  const recColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";

  // PageLayout header props
  const pageTitle = a?.pair ?? "Analysis";
  const pageBadge = isComplete ? (a.recommendation ?? undefined) : undefined;
  const pageBadgeColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";
  const pageDescription = isComplete ? (a.pattern ?? "Signal Analysis") : undefined;

  return (
    <PageLayout
      title={pageTitle}
      badge={pageBadge}
      badgeColor={pageBadgeColor}
      description={pageDescription}
      tabs={[...TABS]}
      activeTab={tab}
      onTabChange={(t) => setTab(t as (typeof TABS)[number])}
      loading={isLoading}
      loadingColor={"var(--color-bullish)"}
    >
      {/* ── Not Found ── */}
      {!q.isLoading && !a && (
        <div style={{ padding: "40px 16px", textAlign: "center" }}>
          <div style={{ ...CARD, padding: "24px", fontWeight: 500 }}>Analysis not found.</div>
        </div>
      )}

      {/* ── Failed State ── */}
      {isFailed && (
        <div style={{ padding: "16px" }}>
          <BackHeader
            shareOpen={shareOpen}
            setShareOpen={setShareOpen}
            isComplete={isComplete}
            handleShareX={handleShareX}
            handleShareTelegram={handleShareTelegram}
          />
          <div
            style={{
              ...CARD,
              padding: "32px",
              textAlign: "center",
              borderColor: "rgba(246,70,93,0.30)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(246,70,93,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={32} style={{ color: "var(--color-bearish)" }} />
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>Analysis Failed</div>
            <div
              style={{ fontSize: "14px", color: "var(--color-muted-foreground)", marginTop: "8px" }}
            >
              {a.error_message ?? "The AI encountered an issue reading this chart."}
            </div>
            <Link
              to="/analyze"
              search={{ screenshot: undefined, pair: undefined }}
              style={{
                display: "inline-flex",
                marginTop: "24px",
                padding: "0 24px",
                height: "48px",
                borderRadius: "12px",
                background: GREEN_GRAD,
                color: "var(--color-foreground)",
                fontWeight: 700,
                alignItems: "center",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Try another chart
            </Link>
          </div>
        </div>
      )}

      {/* ── Complete State ── */}
      {isComplete && (
        <ScrollArea>
          <div style={{ padding: "0 0 24px" }}>
            {/* ── Back Header ── */}
            <BackHeader
              shareOpen={shareOpen}
              setShareOpen={setShareOpen}
              isComplete={isComplete}
              handleShareX={handleShareX}
              handleShareTelegram={handleShareTelegram}
            />

            {/* ═══════════════════════════════════════
                HERO SIGNAL CARD — THE MAIN EVENT
            ═══════════════════════════════════════ */}
            <div
              style={{
                ...CARD,
                padding: "20px",
                borderWidth: "2px",
                position: "relative",
                overflow: "hidden",
                margin: "0 16px 16px",
                borderColor: isBullish
                  ? "rgba(14,203,129,0.50)"
                  : isBearish
                    ? "rgba(246,70,93,0.50)"
                    : "rgba(245,158,11,0.40)",
                boxShadow: isBullish
                  ? "0 0 40px rgba(14,203,129,0.20)"
                  : isBearish
                    ? "0 0 40px rgba(246,70,93,0.20)"
                    : "0 0 30px rgba(245,158,11,0.15)",
                background: isBullish
                  ? `linear-gradient(to bottom right, rgba(14,203,129,0.08), ${"var(--color-card)"}, ${"var(--color-card)"})`
                  : isBearish
                    ? `linear-gradient(to bottom right, rgba(246,70,93,0.08), ${"var(--color-card)"}, ${"var(--color-card)"})`
                    : `linear-gradient(to bottom right, rgba(245,158,11,0.08), ${"var(--color-card)"}, ${"var(--color-card)"})`,
              }}
            >
              {/* Animated top bar */}
              <div
                className="animate-pulse"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: isBullish
                    ? "var(--color-bullish)"
                    : isBearish
                      ? "var(--color-bearish)"
                      : "var(--color-neutral-wait)",
                }}
              />

              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--color-muted-foreground)",
                        background: "rgba(11,13,16,0.80)",
                        backdropFilter: "blur(8px)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: `1px solid ${"var(--color-border)"}`,
                      }}
                    >
                      {a.timeframe ?? "AUTO"}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      {relTime(a.created_at)}
                    </span>
                    {a.updated_at && a.updated_at !== a.created_at && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--color-muted-foreground)",
                          opacity: 0.7,
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Radio size={10} />
                        Updated {relTime(a.updated_at)}
                      </span>
                    )}
                  </div>
                  <h1
                    style={{
                      fontSize: "36px",
                      fontWeight: 800,
                      ...MONO,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {a.pair ?? "?"}
                  </h1>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-muted-foreground)",
                      marginTop: "4px",
                    }}
                  >
                    {a.pattern ?? "Pattern Analysis"}
                  </div>
                </div>
                {/* Big recommendation pill */}
                <div
                  style={{
                    padding: "12px 20px",
                    borderRadius: "16px",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    fontWeight: 800,
                    fontSize: "24px",
                    color: recColor,
                    ...MONO,
                    letterSpacing: "0.05em",
                    background: isBullish
                      ? "rgba(14,203,129,0.06)"
                      : isBearish
                        ? "rgba(246,70,93,0.06)"
                        : "rgba(245,158,11,0.06)",
                    borderColor: isBullish
                      ? "rgba(14,203,129,0.30)"
                      : isBearish
                        ? "rgba(246,70,93,0.30)"
                        : "rgba(245,158,11,0.30)",
                    boxShadow: isBullish
                      ? "0 0 20px rgba(14,203,129,0.30)"
                      : isBearish
                        ? "0 0 20px rgba(246,70,93,0.30)"
                        : "none",
                  }}
                >
                  {a.recommendation ?? "—"}
                </div>
              </div>

              {/* Signal Prices — the core data */}
              {signalBadge && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {/* Entry */}
                  <div
                    style={{
                      background: "rgba(11,13,16,0.70)",
                      backdropFilter: "blur(8px)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: `1px solid ${"var(--color-border)"}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...LABEL, marginBottom: "6px" }}>Entry</div>
                    <div
                      style={{
                        ...MONO,
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "var(--color-foreground)",
                      }}
                    >
                      {signalBadge.entry}
                    </div>
                  </div>
                  {/* Stop Loss */}
                  <div
                    style={{
                      background: "rgba(246,70,93,0.05)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(246,70,93,0.30)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...LABEL, color: "var(--color-bearish)", marginBottom: "6px" }}>
                      Stop Loss
                    </div>
                    <div
                      style={{
                        ...MONO,
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "var(--color-bearish)",
                      }}
                    >
                      {signalBadge.stop_loss}
                    </div>
                  </div>
                  {/* Target */}
                  <div
                    style={{
                      background: "rgba(14,203,129,0.05)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(14,203,129,0.30)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...LABEL, color: "var(--color-bullish)", marginBottom: "6px" }}>
                      Target
                    </div>
                    <div
                      style={{
                        ...MONO,
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "var(--color-bullish)",
                      }}
                    >
                      {signalBadge.take_profit}
                    </div>
                  </div>
                </div>
              )}

              {/* RR + Confidence row */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {signalBadge && (
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderStyle: "solid",
                      ...MONO,
                      fontWeight: 700,
                      fontSize: "14px",
                      color: recColor,
                      background: isBullish
                        ? "rgba(14,203,129,0.06)"
                        : isBearish
                          ? "rgba(246,70,93,0.06)"
                          : "rgba(245,158,11,0.06)",
                      borderColor: isBullish
                        ? "rgba(14,203,129,0.30)"
                        : isBearish
                          ? "rgba(246,70,93,0.30)"
                          : "rgba(245,158,11,0.30)",
                    }}
                  >
                    R:R {signalBadge.rr}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ ...LABEL }}>Confidence</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, ...MONO, color: recColor }}>
                      {a.confidence ?? 0}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "var(--color-border)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "9999px",
                        background: recColor,
                        transition: "width 0.7s ease",
                        width: `${a.confidence ?? 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Track as Signal button — only for BUY/SELL */}
              {!isWait && (
                <div style={{ marginTop: "16px" }}>
                  <button
                    onClick={() => trackMutation.mutate()}
                    disabled={trackMutation.isPending || trackMutation.isSuccess}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background: trackMutation.isSuccess ? "rgba(14,203,129,0.15)" : GREEN_GRAD,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor:
                        trackMutation.isPending || trackMutation.isSuccess ? "default" : "pointer",
                      opacity: trackMutation.isPending || trackMutation.isSuccess ? 0.85 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {trackMutation.isPending ? (
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    ) : trackMutation.isSuccess ? (
                      <CheckCircle size={16} />
                    ) : (
                      <Radio size={16} />
                    )}
                    {trackMutation.isPending
                      ? "Tracking…"
                      : trackMutation.isSuccess
                        ? "Tracking"
                        : "Track Signal"}
                  </button>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════
                VIXOR VERDICT BOX
            ═══════════════════════════════════════ */}
            {vixorMsg && (
              <div
                style={{
                  ...CARD,
                  padding: "16px",
                  margin: "0 16px 16px",
                  borderLeft: `4px solid ${recColor}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}
                >
                  <BrainCircuit size={20} style={{ color: recColor, flexShrink: 0 }} />
                  <span style={{ ...LABEL, letterSpacing: "0.1em" }}>Vixor Verdict</span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    lineHeight: 1.6,
                    color: "rgba(124,155,196,0.90)",
                  }}
                >
                  {highlightSMC(vixorMsg)}
                </p>
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                  <Link
                    to="/trade-desk"
                    search={{
                      symbol: a.pair?.replace("/", ""),
                      direction: a.recommendation === "BUY" ? "long" : "short",
                      price: a.entry != null ? String(a.entry) : undefined,
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      height: "44px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, var(--color-bullish), rgba(14,203,129,0.70))",
                      color: "var(--color-foreground)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(14,203,129,0.25)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <Zap size={16} />
                    Trade This Signal
                  </Link>
                </div>
              </div>
            )}

            {/* Chart Image with Canvas Annotations */}
            {a.imageUrl && (
              <ChartCanvasOverlay
                imageUrl={a.imageUrl}
                analysis={a}
                onZoom={() => setImgZoom(!imgZoom)}
              />
            )}

            {/* Image zoom overlay */}
            {imgZoom && a.imageUrl && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                  background: "oklch(0 0 0 / 0.95)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                }}
                onClick={() => setImgZoom(false)}
              >
                <button
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(124,155,196,0.10)",
                    border: "1px solid rgba(124,155,196,0.20)",
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
                  src={a.imageUrl}
                  alt="Chart"
                  style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain" }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                margin: "0 16px 16px",
              }}
            >
              <Link
                to="/trade-desk"
                style={{
                  height: "48px",
                  borderRadius: "12px",
                  background: GREEN_GRAD,
                  color: "var(--color-foreground)",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <Zap size={16} /> Use in Calculator
              </Link>
              <Link
                to="/journal"
                style={{
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--color-card)",
                  border: `1px solid ${"var(--color-border)"}`,
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: "var(--color-foreground)",
                }}
              >
                <BookOpen size={16} style={{ color: "var(--color-muted-foreground)" }} /> Journal
              </Link>
              <AnalysisNotesSection analysisId={id} pair={a.pair} />
            </div>

            {/* ═══ TAB: Trade Setup ═══ */}
            {tab === "Trade Setup" && (
              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ margin: "0 16px" }}
              >
                <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
                  <h3
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      marginBottom: "16px",
                    }}
                  >
                    <Target size={16} style={{ color: "var(--color-bullish)" }} /> Why This Trade
                  </h3>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {(a.reasons ?? []).map((r: string, i: number) => (
                      <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px" }}>
                        <CheckCircle
                          size={16}
                          style={{ color: "var(--color-bullish)", flexShrink: 0, marginTop: "2px" }}
                        />
                        <span style={{ fontWeight: 500, color: "var(--color-foreground)" }}>
                          {highlightSMC(r)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {scenarios && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h3
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-muted-foreground)",
                        marginLeft: "4px",
                      }}
                    >
                      Execution Scenarios
                    </h3>
                    {[
                      {
                        label: "Conservative",
                        s: scenarios.conservative,
                        color: "var(--color-info)",
                        border: "var(--color-info)",
                        bg: "rgba(59,130,246,0.05)",
                      },
                      {
                        label: "Balanced ✦",
                        s: scenarios.balanced,
                        color: "var(--color-bullish)",
                        border: "var(--color-bullish)",
                        bg: "rgba(14,203,129,0.05)",
                        glow: true,
                      },
                      {
                        label: "Aggressive",
                        s: scenarios.aggressive,
                        color: "var(--color-neutral-wait)",
                        border: "var(--color-neutral-wait)",
                        bg: "rgba(245,158,11,0.05)",
                      },
                    ].map(({ label, s, color, border, bg, glow }) => (
                      <div
                        key={label}
                        style={{
                          ...CARD,
                          padding: "16px",
                          borderLeft: `4px solid ${border}`,
                          background: bg,
                          boxShadow: glow ? "0 0 20px rgba(14,203,129,0.12)" : undefined,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color,
                              }}
                            >
                              {label}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "var(--color-muted-foreground)",
                                background: "var(--color-muted)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              PROB: {s.probability}%
                            </span>
                          </div>
                          <span
                            style={{
                              ...MONO,
                              fontSize: "14px",
                              fontWeight: 800,
                              background: "var(--color-card)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              border: `1px solid ${"var(--color-border)"}`,
                              color: "var(--color-foreground)",
                            }}
                          >
                            R:R {s.rr}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "8px",
                          }}
                        >
                          {/* Entry */}
                          <div
                            style={{
                              background: "var(--color-card)",
                              padding: "10px",
                              borderRadius: "12px",
                              border: `1px solid ${"var(--color-border)"}`,
                            }}
                          >
                            <div style={{ ...LABEL, marginBottom: "4px" }}>Entry</div>
                            <div
                              style={{
                                ...MONO,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--color-foreground)",
                              }}
                            >
                              {s.entry}
                            </div>
                          </div>
                          {/* SL */}
                          <div
                            style={{
                              background: "rgba(246,70,93,0.05)",
                              padding: "10px",
                              borderRadius: "12px",
                              border: "1px solid rgba(246,70,93,0.20)",
                            }}
                          >
                            <div
                              style={{
                                ...LABEL,
                                color: "var(--color-bearish)",
                                marginBottom: "4px",
                              }}
                            >
                              SL
                            </div>
                            <div
                              style={{
                                ...MONO,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--color-bearish)",
                              }}
                            >
                              {s.sl?.toLocaleString()}
                            </div>
                          </div>
                          {/* TP */}
                          <div
                            style={{
                              background: "rgba(14,203,129,0.05)",
                              padding: "10px",
                              borderRadius: "12px",
                              border: "1px solid rgba(14,203,129,0.20)",
                            }}
                          >
                            <div
                              style={{
                                ...LABEL,
                                color: "var(--color-bullish)",
                                marginBottom: "4px",
                              }}
                            >
                              TP
                            </div>
                            <div
                              style={{
                                ...MONO,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--color-bullish)",
                              }}
                            >
                              {s.tp2?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ TAB: Market Context ═══ */}
            {tab === "Market Context" && (
              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ margin: "0 16px" }}
              >
                {a.key_levels && (
                  <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
                    <h3
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-muted-foreground)",
                        marginBottom: "16px",
                      }}
                    >
                      <BarChart2 size={16} style={{ color: "var(--color-bullish)" }} /> Key SMC
                      Levels
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      {/* Resistance / BSL */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--color-bearish)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Resistance / BSL
                        </span>
                        {((a.key_levels as any).resistance || []).map((l: number, i: number) => (
                          <div
                            key={i}
                            style={{
                              background: "rgba(246,70,93,0.05)",
                              border: "1px solid rgba(246,70,93,0.20)",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              ...MONO,
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "rgba(246,70,93,0.90)",
                            }}
                          >
                            {l.toLocaleString()}
                          </div>
                        ))}
                      </div>
                      {/* Support / SSL */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--color-bullish)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Support / SSL
                        </span>
                        {((a.key_levels as any).support || []).map((l: number, i: number) => (
                          <div
                            key={i}
                            style={{
                              background: "rgba(14,203,129,0.05)",
                              border: "1px solid rgba(14,203,129,0.20)",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              ...MONO,
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "rgba(14,203,129,0.90)",
                            }}
                          >
                            {l.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {a.liquidity_zones && (
                  <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
                    <h3
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-muted-foreground)",
                        marginBottom: "16px",
                      }}
                    >
                      <Activity size={16} style={{ color: "var(--color-bullish)" }} /> Liquidity
                      Pools
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {((a.liquidity_zones as any).buySide || []).map((l: number, i: number) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px",
                            borderRadius: "12px",
                            background: "rgba(14,203,129,0.05)",
                            border: "1px solid rgba(14,203,129,0.20)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--color-bullish)",
                              textTransform: "uppercase",
                            }}
                          >
                            Buy-Side Liquidity (BSL)
                          </span>
                          <span style={{ ...MONO, fontWeight: 700, color: "var(--color-bullish)" }}>
                            {l.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {((a.liquidity_zones as any).sellSide || []).map((l: number, i: number) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px",
                            borderRadius: "12px",
                            background: "rgba(246,70,93,0.05)",
                            border: "1px solid rgba(246,70,93,0.20)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--color-bearish)",
                              textTransform: "uppercase",
                            }}
                          >
                            Sell-Side Liquidity (SSL)
                          </span>
                          <span style={{ ...MONO, fontWeight: 700, color: "var(--color-bearish)" }}>
                            {l.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {a.market_structure && (
                  <div style={{ ...CARD, padding: "20px" }}>
                    <h3
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-muted-foreground)",
                        marginBottom: "16px",
                      }}
                    >
                      <TrendingUp size={16} style={{ color: "var(--color-bullish)" }} /> Market
                      Structure (SMC)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { label: "Direction", value: (a.market_structure as any).direction },
                        { label: "Structure", value: (a.market_structure as any).structure },
                        ...(a.invalidation_level
                          ? [
                              {
                                label: "⚠ Invalidation Level",
                                value: a.invalidation_level.toLocaleString(),
                                danger: true,
                              },
                            ]
                          : []),
                        ...((a.market_structure as any).bos
                          ? [
                              {
                                label: "BOS Level",
                                value: (a.market_structure as any).bos?.toLocaleString(),
                              },
                            ]
                          : []),
                      ].map(({ label, value, danger }) => (
                        <div
                          key={label}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px",
                            borderRadius: "12px",
                            border: "1px solid",
                            background: danger ? "rgba(246,70,93,0.10)" : "var(--color-card)",
                            borderColor: danger ? "rgba(246,70,93,0.30)" : "var(--color-border)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: danger
                                ? "var(--color-bearish)"
                                : "var(--color-muted-foreground)",
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              ...MONO,
                              fontWeight: 700,
                              color: danger ? "var(--color-bearish)" : "var(--color-foreground)",
                            }}
                          >
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ TAB: News Impact ═══ */}
            {tab === "News Impact" && (
              <NewsImpactSection
                newsImpact={(a.news as any) || (a.raw_ai_response as any)?.news_impact}
              />
            )}

            {/* ═══ TAB: Management ═══ */}
            {tab === "Management" && (
              <div
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ margin: "0 16px" }}
              >
                <div style={{ ...CARD, padding: "20px", marginBottom: "16px" }}>
                  <h3
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      marginBottom: "16px",
                    }}
                  >
                    <Layers size={16} style={{ color: "var(--color-bullish)" }} /> Step-by-Step
                    Management
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {management.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: "12px",
                          background: "var(--color-card)",
                          border: `1px solid ${"var(--color-border)"}`,
                          padding: "14px",
                          borderRadius: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            ...MONO,
                            fontSize: "12px",
                            fontWeight: 700,
                            background: i === 0 ? GREEN_GRAD : "var(--color-muted)",
                            color:
                              i === 0 ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                          }}
                        >
                          {i + 1}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: 1.6,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {highlightSMC(m)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {a.risk_reasons && a.risk_reasons.length > 0 && (
                  <div
                    style={{
                      ...CARD,
                      padding: "20px",
                      marginBottom: "16px",
                      borderColor: "rgba(246,70,93,0.20)",
                    }}
                  >
                    <h3
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-bearish)",
                        marginBottom: "16px",
                      }}
                    >
                      <ShieldCheck size={16} style={{ color: "var(--color-bearish)" }} /> Risk
                      Factors
                    </h3>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {a.risk_reasons.map((r: string, i: number) => (
                        <li key={i} style={{ display: "flex", gap: "8px", fontSize: "14px" }}>
                          <span
                            style={{
                              color: "var(--color-bearish)",
                              marginTop: "2px",
                              flexShrink: 0,
                            }}
                          >
                            •
                          </span>
                          <span style={{ fontWeight: 500, color: "var(--color-muted-foreground)" }}>
                            {r}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.20)",
                  }}
                >
                  <AlertTriangle
                    size={20}
                    style={{ color: "var(--color-neutral-wait)", flexShrink: 0, marginTop: "2px" }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--color-muted-foreground)",
                      lineHeight: 1.6,
                    }}
                  >
                    <strong
                      style={{
                        color: "var(--color-foreground)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Risk Disclaimer
                    </strong>
                    This analysis is generated by Vixor AI based on technical patterns and
                    fundamental data. It is{" "}
                    <strong style={{ color: "var(--color-foreground)" }}>
                      not financial advice
                    </strong>
                    . Always apply your own risk management and judgment before executing any trade.
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </PageLayout>
  );
}

// ═══ NEWS IMPACT ═══
interface NewsImpact {
  relevant_news: Array<{
    headline: string;
    source: string;
    impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    explanation: string;
  }>;
  overall_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  verdict: string;
}

function NewsImpactSection({ newsImpact }: { newsImpact: NewsImpact | null }) {
  if (!newsImpact) {
    return (
      <div className="animate-in fade-in duration-300" style={{ padding: "16px" }}>
        <div
          style={{
            ...CARD,
            padding: "32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Newspaper
            size={40}
            style={{ color: "var(--color-muted-foreground)", margin: "0 auto" }}
          />
          <p style={{ fontSize: "14px", color: "var(--color-muted-foreground)" }}>
            No fundamental news analysis for this session.
          </p>
        </div>
      </div>
    );
  }

  const { relevant_news = [], overall_sentiment = "NEUTRAL", verdict = "" } = newsImpact;
  const isBullish = overall_sentiment === "BULLISH";
  const isBearish = overall_sentiment === "BEARISH";

  const sentColor = isBullish
    ? "var(--color-bullish)"
    : isBearish
      ? "var(--color-bearish)"
      : "var(--color-neutral-wait)";

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ padding: "0 16px" }}
    >
      {/* Sentiment Overview */}
      <div
        style={{
          ...CARD,
          padding: "20px",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-muted-foreground)",
            }}
          >
            <Activity size={16} style={{ color: "var(--color-bullish)" }} /> Fundamental Sentiment
          </h3>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              border: "1px solid",
              color: sentColor,
              background: isBullish
                ? "rgba(14,203,129,0.06)"
                : isBearish
                  ? "rgba(246,70,93,0.06)"
                  : "rgba(245,158,11,0.06)",
              borderColor: isBullish
                ? "rgba(14,203,129,0.30)"
                : isBearish
                  ? "rgba(246,70,93,0.30)"
                  : "rgba(245,158,11,0.30)",
            }}
          >
            {overall_sentiment}
          </span>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            borderLeft: `4px solid ${sentColor}`,
            background: isBullish
              ? "rgba(14,203,129,0.05)"
              : isBearish
                ? "rgba(246,70,93,0.05)"
                : "rgba(245,158,11,0.05)",
          }}
        >
          <span style={{ ...LABEL, letterSpacing: "0.1em", display: "block", marginBottom: "4px" }}>
            AI Confluence Verdict
          </span>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.6,
              color: "var(--color-foreground)",
            }}
          >
            {highlightSMC(verdict)}
          </p>
        </div>
      </div>

      {/* News Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-muted-foreground)",
            marginLeft: "4px",
          }}
        >
          <Newspaper size={16} style={{ color: "var(--color-bullish)" }} /> Key News Drivers
        </h3>
        {relevant_news.map((n, i) => {
          const impactColor =
            n.impact === "POSITIVE"
              ? "var(--color-bullish)"
              : n.impact === "NEGATIVE"
                ? "var(--color-bearish)"
                : "var(--color-neutral-wait)";
          return (
            <div
              key={i}
              style={{
                ...CARD,
                padding: "16px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  background: impactColor,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  paddingLeft: "4px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-muted-foreground)",
                      textTransform: "uppercase",
                      background: "var(--color-muted)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {n.source}
                  </span>
                  <h4
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "var(--color-foreground)",
                      marginTop: "6px",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.headline}
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    flexShrink: 0,
                    textTransform: "uppercase",
                    color: impactColor,
                    background: `${impactColor}15`,
                  }}
                >
                  {n.impact}
                </span>
              </div>
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(11,13,16,0.60)",
                  border: `1px solid ${"var(--color-border)"}`,
                  fontSize: "12px",
                  color: "var(--color-muted-foreground)",
                  lineHeight: 1.6,
                  marginLeft: "4px",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-foreground)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Technical Impact
                </strong>
                {highlightSMC(n.explanation)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ ANALYSIS NOTES SECTION ═══
const MOOD_EMOJI: Record<string, string> = {
  bullish: "🟢",
  bearish: "🔴",
  confident: "💪",
  cautious: "⚠️",
  anxious: "😰",
  neutral: "😐",
};

function AnalysisNotesSection({ analysisId, pair }: { analysisId: string; pair: string | null }) {
  const queryClient = useQueryClient();
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TradingNote | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const fetchNotes = useStableServerFn(getNotesByAnalysis);
  const notesQuery = useQuery({
    queryKey: ["analysis-notes", analysisId],
    queryFn: () => fetchNotes({ data: { analysisId } }),
    enabled: showNotes,
  });

  const deleteNoteFn = useStableServerFn(deleteNote);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const notes = (notesQuery.data ?? []) as TradingNote[];

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNoteFn({ data: { noteId } });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["analysis-notes", analysisId] });
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setShowNotes(!showNotes);
          if (!showNotes) {
            queryClient.invalidateQueries({ queryKey: ["analysis-notes", analysisId] });
          }
        }}
        style={{
          height: "48px",
          borderRadius: "12px",
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          fontWeight: 700,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "var(--color-foreground)",
          cursor: "pointer",
        }}
      >
        <StickyNote size={16} style={{ color: "var(--color-bullish)" }} /> Notes
      </button>

      {/* Notes panel below the action buttons */}
      {showNotes && (
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-muted-foreground)",
              }}
            >
              Notes for this analysis
            </h3>
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteEditorOpen(true);
              }}
              style={{
                height: "28px",
                padding: "0 12px",
                borderRadius: "8px",
                background: GREEN_GRAD,
                color: "var(--color-foreground)",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={12} /> Add Note
            </button>
          </div>

          {notesQuery.isLoading ? (
            <div style={{ ...CARD, padding: "16px", textAlign: "center" }}>
              <Loader2
                size={16}
                style={{
                  color: "var(--color-bullish)",
                  margin: "0 auto",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : notes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    ...CARD,
                    padding: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setEditingNote(note);
                    setNoteEditorOpen(true);
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        {note.is_pinned && (
                          <Pin size={12} style={{ color: "var(--color-bullish)", flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "var(--color-foreground)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {note.title || "Untitled"}
                        </span>
                        <span style={{ fontSize: "14px", flexShrink: 0 }}>
                          {MOOD_EMOJI[note.mood]}
                        </span>
                      </div>
                      {note.content && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-muted-foreground)",
                            marginBottom: "6px",
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {note.content}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {note.tags?.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "var(--color-muted)",
                              color: "var(--color-muted-foreground)",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "12px",
                            ...MONO,
                            color: "var(--color-muted-foreground)",
                            marginLeft: "auto",
                          }}
                        >
                          {relTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(note.id);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-muted-foreground)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...CARD, padding: "24px", textAlign: "center" }}>
              <StickyNote
                size={24}
                style={{ color: `${"var(--color-muted-foreground)"}40`, margin: "0 auto 8px" }}
              />
              <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                No notes for this analysis yet
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteTarget && (
            <div
              style={{
                ...CARD,
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: "rgba(246,70,93,0.30)",
                background: "rgba(246,70,93,0.05)",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                Delete this note?
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    background: "var(--color-card)",
                    border: `1px solid ${"var(--color-border)"}`,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    background: "var(--color-bearish)",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          <NoteEditorDialog
            open={noteEditorOpen}
            onOpenChange={setNoteEditorOpen}
            existingNote={editingNote}
            prefillPair={pair}
            prefillAnalysisId={analysisId}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["analysis-notes", analysisId] })
            }
          />
        </div>
      )}
    </>
  );
}

// ═══ HELPERS ═══
function BackHeader({
  shareOpen,
  setShareOpen,
  isComplete,
  handleShareX,
  handleShareTelegram,
}: {
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  isComplete: boolean;
  handleShareX: () => void;
  handleShareTelegram: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px 4px",
      }}
    >
      <Link
        to="/"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-foreground)",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={20} />
      </Link>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--color-card)",
            border: `1px solid ${"var(--color-border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-muted-foreground)",
            cursor: "pointer",
          }}
        >
          <Bookmark size={16} />
        </button>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShareOpen(!shareOpen)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--color-card)",
              border: `1px solid ${"var(--color-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            <Share2 size={16} />
          </button>
          {shareOpen && isComplete && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
                background: "var(--color-card)",
                border: `1px solid var(--color-border)`,
                borderRadius: "12px",
                boxShadow: "0 8px 32px -8px oklch(0 0 0 / 0.5)",
                padding: "6px",
                zIndex: 50,
                minWidth: "140px",
              }}
            >
              <button
                onClick={handleShareX}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                X (Twitter)
              </button>
              <button
                onClick={handleShareTelegram}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Telegram
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
