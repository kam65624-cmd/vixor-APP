import { createFileRoute, Link, useParams } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState, useMemo } from "react";
import { getAnalysis } from "@/domains/analysis/functions";
import { getNotesByAnalysis, deleteNote } from "@/domains/notes/functions";
import type { TradingNote, Mood } from "@/domains/notes/types";
import { NoteEditorDialog } from "@/components/vixor/NoteEditorDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { PageLayout, THEME, ScrollArea, Badge, ProgressBar } from "@/components/vixor/PageLayout";

// ── Local style constants ──────────────────────────────────────────────
const GREEN_DEEP = "#059669";
const GREEN_GRAD = `linear-gradient(to right, ${THEME.green}, ${GREEN_DEEP})`;

const CARD: React.CSSProperties = {
  background: THEME.surface,
  border: `1px solid ${THEME.border}`,
  borderRadius: "12px",
  boxShadow: "0 4px 24px -8px rgba(0,0,0,0.4)",
};

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;

const LABEL: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: THEME.textMuted,
};

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Vixor Signal — Analysis Result" }] }),
  component: AnalysisResult,
});

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
            color: THEME.green,
            fontWeight: 700,
            background: `${THEME.green}18`,
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

function AnalysisResult() {
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
        return s === "complete" || s === "failed" ? false : 3000;
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

  const recColor = isBullish ? THEME.green : isBearish ? THEME.red : THEME.amber;

  // PageLayout header props
  const pageTitle = a?.pair ?? "Analysis";
  const pageBadge = isComplete ? (a.recommendation ?? undefined) : undefined;
  const pageBadgeColor = isBullish ? THEME.green : isBearish ? THEME.red : THEME.amber;
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
      loadingColor={THEME.green}
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
          <BackHeader />
          <div
            style={{
              ...CARD,
              padding: "32px",
              textAlign: "center",
              borderColor: "rgba(239,68,68,0.30)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={32} style={{ color: THEME.red }} />
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>Analysis Failed</div>
            <div style={{ fontSize: "14px", color: THEME.textSecondary, marginTop: "8px" }}>
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
                color: THEME.text,
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
            <BackHeader />

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
                  ? "rgba(16,185,129,0.50)"
                  : isBearish
                    ? "rgba(239,68,68,0.50)"
                    : "rgba(245,158,11,0.40)",
                boxShadow: isBullish
                  ? "0 0 40px rgba(16,185,129,0.2)"
                  : isBearish
                    ? "0 0 40px rgba(239,68,68,0.2)"
                    : "0 0 30px rgba(245,158,11,0.15)",
                background: isBullish
                  ? `linear-gradient(to bottom right, rgba(16,185,129,0.08), ${THEME.surface}, ${THEME.surface})`
                  : isBearish
                    ? `linear-gradient(to bottom right, rgba(239,68,68,0.08), ${THEME.surface}, ${THEME.surface})`
                    : `linear-gradient(to bottom right, rgba(245,158,11,0.08), ${THEME.surface}, ${THEME.surface})`,
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
                  background: isBullish ? THEME.green : isBearish ? THEME.red : THEME.amber,
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
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: THEME.textSecondary,
                        background: "rgba(26,26,26,0.8)",
                        backdropFilter: "blur(8px)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      {a.timeframe ?? "AUTO"}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: THEME.textSecondary }}>
                      {relTime(a.created_at)}
                    </span>
                  </div>
                  <h1
                    style={{
                      fontSize: "36px",
                      fontWeight: 800,
                      ...MONO,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      color: THEME.text,
                    }}
                  >
                    {a.pair ?? "?"}
                  </h1>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: THEME.textSecondary,
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
                      ? "rgba(16,185,129,0.06)"
                      : isBearish
                        ? "rgba(239,68,68,0.06)"
                        : "rgba(245,158,11,0.06)",
                    borderColor: isBullish
                      ? "rgba(16,185,129,0.30)"
                      : isBearish
                        ? "rgba(239,68,68,0.30)"
                        : "rgba(245,158,11,0.30)",
                    boxShadow: isBullish
                      ? "0 0 20px rgba(16,185,129,0.3)"
                      : isBearish
                        ? "0 0 20px rgba(239,68,68,0.3)"
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
                      background: "rgba(26,26,26,0.70)",
                      backdropFilter: "blur(8px)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: `1px solid ${THEME.border}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...LABEL, marginBottom: "6px" }}>Entry</div>
                    <div style={{ ...MONO, fontWeight: 700, fontSize: "16px", color: THEME.text }}>
                      {signalBadge.entry}
                    </div>
                  </div>
                  {/* Stop Loss */}
                  <div
                    style={{
                      background: "rgba(239,68,68,0.05)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(239,68,68,0.30)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...LABEL, color: THEME.red, marginBottom: "6px" }}>Stop Loss</div>
                    <div style={{ ...MONO, fontWeight: 700, fontSize: "16px", color: THEME.red }}>
                      {signalBadge.stop_loss}
                    </div>
                  </div>
                  {/* Target */}
                  <div
                    style={{
                      background: "rgba(16,185,129,0.05)",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(16,185,129,0.30)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ ...LABEL, color: THEME.green, marginBottom: "6px" }}>Target</div>
                    <div style={{ ...MONO, fontWeight: 700, fontSize: "16px", color: THEME.green }}>
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
                        ? "rgba(16,185,129,0.06)"
                        : isBearish
                          ? "rgba(239,68,68,0.06)"
                          : "rgba(245,158,11,0.06)",
                      borderColor: isBullish
                        ? "rgba(16,185,129,0.30)"
                        : isBearish
                          ? "rgba(239,68,68,0.30)"
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
                      background: THEME.border,
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
                    color: "rgba(255,255,255,0.90)",
                  }}
                >
                  {highlightSMC(vixorMsg)}
                </p>
              </div>
            )}

            {/* Chart Image */}
            {a.imageUrl && (
              <div
                style={{
                  ...CARD,
                  margin: "0 16px 16px",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => setImgZoom(!imgZoom)}
              >
                <img
                  src={a.imageUrl}
                  alt="Analyzed chart"
                  style={{
                    width: "100%",
                    maxHeight: "208px",
                    objectFit: "contain",
                    background: "#000000",
                    display: "block",
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
                    background: "rgba(0,0,0,0.60)",
                    backdropFilter: "blur(8px)",
                    color: THEME.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Maximize2 size={16} />
                </div>
              </div>
            )}

            {/* Image zoom overlay */}
            {imgZoom && a.imageUrl && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                  background: "rgba(0,0,0,0.95)",
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
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.20)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: THEME.text,
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
                  color: THEME.text,
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
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: THEME.text,
                }}
              >
                <BookOpen size={16} style={{ color: THEME.textSecondary }} /> Journal
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
                      color: THEME.textSecondary,
                      marginBottom: "16px",
                    }}
                  >
                    <Target size={16} style={{ color: THEME.green }} /> Why This Trade
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
                          style={{ color: THEME.green, flexShrink: 0, marginTop: "2px" }}
                        />
                        <span style={{ fontWeight: 500, color: THEME.text }}>
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
                        color: THEME.textSecondary,
                        marginLeft: "4px",
                      }}
                    >
                      Execution Scenarios
                    </h3>
                    {[
                      {
                        label: "Conservative",
                        s: scenarios.conservative,
                        color: THEME.cyan,
                        border: THEME.cyan,
                        bg: "rgba(6,182,212,0.05)",
                      },
                      {
                        label: "Balanced ✦",
                        s: scenarios.balanced,
                        color: THEME.green,
                        border: THEME.green,
                        bg: "rgba(16,185,129,0.05)",
                        glow: true,
                      },
                      {
                        label: "Aggressive",
                        s: scenarios.aggressive,
                        color: THEME.amber,
                        border: THEME.amber,
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
                          boxShadow: glow ? "0 0 20px rgba(16,185,129,0.12)" : undefined,
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
                                fontSize: "10px",
                                fontWeight: 700,
                                color: THEME.textSecondary,
                                background: THEME.tabBarBg,
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
                              background: THEME.surface,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              border: `1px solid ${THEME.border}`,
                              color: THEME.text,
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
                              background: THEME.surface,
                              padding: "10px",
                              borderRadius: "12px",
                              border: `1px solid ${THEME.border}`,
                            }}
                          >
                            <div style={{ ...LABEL, marginBottom: "4px" }}>Entry</div>
                            <div
                              style={{
                                ...MONO,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: THEME.text,
                              }}
                            >
                              {s.entry}
                            </div>
                          </div>
                          {/* SL */}
                          <div
                            style={{
                              background: "rgba(239,68,68,0.05)",
                              padding: "10px",
                              borderRadius: "12px",
                              border: "1px solid rgba(239,68,68,0.20)",
                            }}
                          >
                            <div style={{ ...LABEL, color: THEME.red, marginBottom: "4px" }}>
                              SL
                            </div>
                            <div
                              style={{
                                ...MONO,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: THEME.red,
                              }}
                            >
                              {s.sl?.toLocaleString()}
                            </div>
                          </div>
                          {/* TP */}
                          <div
                            style={{
                              background: "rgba(16,185,129,0.05)",
                              padding: "10px",
                              borderRadius: "12px",
                              border: "1px solid rgba(16,185,129,0.20)",
                            }}
                          >
                            <div style={{ ...LABEL, color: THEME.green, marginBottom: "4px" }}>
                              TP
                            </div>
                            <div
                              style={{
                                ...MONO,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: THEME.green,
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
                        color: THEME.textSecondary,
                        marginBottom: "16px",
                      }}
                    >
                      <BarChart2 size={16} style={{ color: THEME.green }} /> Key SMC Levels
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      {/* Resistance / BSL */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: THEME.red,
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
                              background: "rgba(239,68,68,0.05)",
                              border: "1px solid rgba(239,68,68,0.20)",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              ...MONO,
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "rgba(239,68,68,0.90)",
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
                            color: THEME.green,
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
                              background: "rgba(16,185,129,0.05)",
                              border: "1px solid rgba(16,185,129,0.20)",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              ...MONO,
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "rgba(16,185,129,0.90)",
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
                        color: THEME.textSecondary,
                        marginBottom: "16px",
                      }}
                    >
                      <Activity size={16} style={{ color: THEME.green }} /> Liquidity Pools
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
                            background: "rgba(16,185,129,0.05)",
                            border: "1px solid rgba(16,185,129,0.20)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: THEME.green,
                              textTransform: "uppercase",
                            }}
                          >
                            Buy-Side Liquidity (BSL)
                          </span>
                          <span style={{ ...MONO, fontWeight: 700, color: THEME.green }}>
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
                            background: "rgba(239,68,68,0.05)",
                            border: "1px solid rgba(239,68,68,0.20)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: THEME.red,
                              textTransform: "uppercase",
                            }}
                          >
                            Sell-Side Liquidity (SSL)
                          </span>
                          <span style={{ ...MONO, fontWeight: 700, color: THEME.red }}>
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
                        color: THEME.textSecondary,
                        marginBottom: "16px",
                      }}
                    >
                      <TrendingUp size={16} style={{ color: THEME.green }} /> Market Structure (SMC)
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
                            background: danger ? "rgba(239,68,68,0.10)" : THEME.surface,
                            borderColor: danger ? "rgba(239,68,68,0.30)" : THEME.border,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: danger ? THEME.red : THEME.textSecondary,
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              ...MONO,
                              fontWeight: 700,
                              color: danger ? THEME.red : THEME.text,
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
                      color: THEME.textSecondary,
                      marginBottom: "16px",
                    }}
                  >
                    <Layers size={16} style={{ color: THEME.green }} /> Step-by-Step Management
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {management.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: "12px",
                          background: THEME.surface,
                          border: `1px solid ${THEME.border}`,
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
                            background: i === 0 ? GREEN_GRAD : THEME.tabBarBg,
                            color: i === 0 ? THEME.text : THEME.textSecondary,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: 1.6,
                            color: THEME.text,
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
                      borderColor: "rgba(239,68,68,0.20)",
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
                        color: THEME.red,
                        marginBottom: "16px",
                      }}
                    >
                      <ShieldCheck size={16} style={{ color: THEME.red }} /> Risk Factors
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
                          <span style={{ color: THEME.red, marginTop: "2px", flexShrink: 0 }}>
                            •
                          </span>
                          <span style={{ fontWeight: 500, color: THEME.textSecondary }}>{r}</span>
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
                    style={{ color: THEME.amber, flexShrink: 0, marginTop: "2px" }}
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: THEME.textSecondary,
                      lineHeight: 1.6,
                    }}
                  >
                    <strong style={{ color: THEME.text, display: "block", marginBottom: "4px" }}>
                      Risk Disclaimer
                    </strong>
                    This analysis is generated by Vixor AI based on technical patterns and
                    fundamental data. It is{" "}
                    <strong style={{ color: THEME.text }}>not financial advice</strong>. Always
                    apply your own risk management and judgment before executing any trade.
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
          <Newspaper size={40} style={{ color: THEME.textSecondary, margin: "0 auto" }} />
          <p style={{ fontSize: "14px", color: THEME.textSecondary }}>
            No fundamental news analysis for this session.
          </p>
        </div>
      </div>
    );
  }

  const { relevant_news = [], overall_sentiment = "NEUTRAL", verdict = "" } = newsImpact;
  const isBullish = overall_sentiment === "BULLISH";
  const isBearish = overall_sentiment === "BEARISH";

  const sentColor = isBullish ? THEME.green : isBearish ? THEME.red : THEME.amber;

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
              color: THEME.textSecondary,
            }}
          >
            <Activity size={16} style={{ color: THEME.green }} /> Fundamental Sentiment
          </h3>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              border: "1px solid",
              color: sentColor,
              background: isBullish
                ? "rgba(16,185,129,0.06)"
                : isBearish
                  ? "rgba(239,68,68,0.06)"
                  : "rgba(245,158,11,0.06)",
              borderColor: isBullish
                ? "rgba(16,185,129,0.30)"
                : isBearish
                  ? "rgba(239,68,68,0.30)"
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
              ? "rgba(16,185,129,0.05)"
              : isBearish
                ? "rgba(239,68,68,0.05)"
                : "rgba(245,158,11,0.05)",
          }}
        >
          <span style={{ ...LABEL, letterSpacing: "0.1em", display: "block", marginBottom: "4px" }}>
            AI Confluence Verdict
          </span>
          <p style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1.6, color: THEME.text }}>
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
            color: THEME.textSecondary,
            marginLeft: "4px",
          }}
        >
          <Newspaper size={16} style={{ color: THEME.green }} /> Key News Drivers
        </h3>
        {relevant_news.map((n, i) => {
          const impactColor =
            n.impact === "POSITIVE"
              ? THEME.green
              : n.impact === "NEGATIVE"
                ? THEME.red
                : THEME.amber;
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
                      fontSize: "9px",
                      fontWeight: 700,
                      color: THEME.textSecondary,
                      textTransform: "uppercase",
                      background: THEME.tabBarBg,
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
                      color: THEME.text,
                      marginTop: "6px",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.headline}
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: "9px",
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
                  background: "rgba(26,26,26,0.60)",
                  border: `1px solid ${THEME.border}`,
                  fontSize: "12px",
                  color: THEME.textSecondary,
                  lineHeight: 1.6,
                  marginLeft: "4px",
                }}
              >
                <strong
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: THEME.text,
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
const MOOD_EMOJI: Record<Mood, string> = {
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
          background: THEME.surface,
          border: `1px solid ${THEME.border}`,
          fontWeight: 700,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: THEME.text,
          cursor: "pointer",
        }}
      >
        <StickyNote size={16} style={{ color: THEME.green }} /> Notes
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
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: THEME.textSecondary,
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
                color: THEME.text,
                fontSize: "11px",
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
                  color: THEME.green,
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
                          <Pin size={12} style={{ color: THEME.green, flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: THEME.text,
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
                            color: THEME.textSecondary,
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
                              fontSize: "9px",
                              fontWeight: 700,
                              background: THEME.tabBarBg,
                              color: THEME.textSecondary,
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "10px",
                            ...MONO,
                            color: THEME.textSecondary,
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
                        color: THEME.textSecondary,
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
                style={{ color: `${THEME.textSecondary}40`, margin: "0 auto 8px" }}
              />
              <div style={{ fontSize: "12px", color: THEME.textSecondary }}>
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
                borderColor: "rgba(239,68,68,0.30)",
                background: "rgba(239,68,68,0.05)",
              }}
            >
              <span style={{ fontSize: "12px", color: THEME.textSecondary }}>
                Delete this note?
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    background: THEME.surface,
                    border: `1px solid ${THEME.border}`,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: THEME.text,
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
                    background: THEME.red,
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: THEME.text,
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
function BackHeader() {
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
          background: THEME.surface,
          border: `1px solid ${THEME.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: THEME.text,
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
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: THEME.textSecondary,
            cursor: "pointer",
          }}
        >
          <Bookmark size={16} />
        </button>
        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: THEME.textSecondary,
            cursor: "pointer",
          }}
        >
          <Share2 size={16} />
        </button>
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
