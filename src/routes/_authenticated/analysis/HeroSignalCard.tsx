import { Link } from "@tanstack/react-router";
import {
  Loader2,
  Radio,
  BrainCircuit,
  Activity,
  AlertTriangle,
  Zap,
  CheckCircle,
} from "lucide-react";
import { CARD, LABEL, MONO, GREEN_GRAD } from "./constants";
import { relTime, highlightSMC } from "./utils";

type AnalysisSource = "openrouter" | "local_engine" | "local_fallback" | null;

interface DataQuality {
  candleCount: number;
  dataSource: string;
  usedRealData: boolean;
}

interface SignalBadge {
  direction: "BUY" | "SELL" | "WAIT";
  entry: string;
  stop_loss: string;
  take_profit: string;
  rr: string;
}

interface HeroSignalCardProps {
  a: any;
  recColor: string;
  isBullish: boolean;
  isBearish: boolean;
  isWait: boolean;
  signalBadge: SignalBadge | null;
  vixorMsg: string | null;
  analysisSource: AnalysisSource;
  dataQuality: DataQuality | null;
  trackMutation: { isPending: boolean; isSuccess: boolean; mutate: () => void };
}

export function HeroSignalCard({
  a,
  recColor,
  isBullish,
  isBearish,
  isWait,
  signalBadge,
  vixorMsg,
  analysisSource,
  dataQuality,
  trackMutation,
}: HeroSignalCardProps) {
  return (
    <div
      style={{
        ...CARD,
        padding: "20px",
        borderWidth: "2px",
        position: "relative",
        overflow: "hidden",
        margin: "0 16px 16px",
        borderColor: isBullish
          ? "color-mix(in srgb, var(--color-bullish) 50%, transparent)"
          : isBearish
            ? "color-mix(in srgb, var(--color-bearish) 50%, transparent)"
            : "color-mix(in srgb, var(--color-neutral-wait) 40%, transparent)",
        boxShadow: isBullish
          ? "0 0 40px var(--bullish-border)"
          : isBearish
            ? "0 0 40px color-mix(in srgb, var(--color-bearish) 20%, transparent)"
            : "0 0 30px color-mix(in srgb, var(--color-neutral-wait) 15%, transparent)",
        background: isBullish
          ? `linear-gradient(to bottom right, var(--bullish-bg), ${"var(--color-card)"}, ${"var(--color-card)"})`
          : isBearish
            ? `linear-gradient(to bottom right, var(--bearish-bg), ${"var(--color-card)"}, ${"var(--color-card)"})`
            : `linear-gradient(to bottom right, var(--neutral-wait-bg), ${"var(--color-card)"}, ${"var(--color-card)"})`,
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
                background: "var(--overlay)",
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
              ? "color-mix(in srgb, var(--color-bullish) 6%, transparent)"
              : isBearish
                ? "color-mix(in srgb, var(--color-bearish) 6%, transparent)"
                : "color-mix(in srgb, var(--color-neutral-wait) 6%, transparent)",
            borderColor: isBullish
              ? "color-mix(in srgb, var(--color-bullish) 30%, transparent)"
              : isBearish
                ? "color-mix(in srgb, var(--color-bearish) 30%, transparent)"
                : "color-mix(in srgb, var(--color-neutral-wait) 30%, transparent)",
            boxShadow: isBullish
              ? "0 0 20px color-mix(in srgb, var(--color-bullish) 30%, transparent)"
              : isBearish
                ? "0 0 20px color-mix(in srgb, var(--color-bearish) 30%, transparent)"
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
              background: "var(--overlay-secondary)",
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
              background: "color-mix(in srgb, var(--color-bearish) 5%, transparent)",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid color-mix(in srgb, var(--color-bearish) 30%, transparent)",
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
              background: "color-mix(in srgb, var(--color-bullish) 5%, transparent)",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid color-mix(in srgb, var(--color-bullish) 30%, transparent)",
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
                ? "color-mix(in srgb, var(--color-bullish) 6%, transparent)"
                : isBearish
                  ? "color-mix(in srgb, var(--color-bearish) 6%, transparent)"
                  : "color-mix(in srgb, var(--color-neutral-wait) 6%, transparent)",
              borderColor: isBullish
                ? "color-mix(in srgb, var(--color-bullish) 30%, transparent)"
                : isBearish
                  ? "color-mix(in srgb, var(--color-bearish) 30%, transparent)"
                  : "color-mix(in srgb, var(--color-neutral-wait) 30%, transparent)",
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

      {/* ── Analysis Source Badge + Data Quality ── */}
      {(analysisSource || dataQuality) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "color-mix(in srgb, var(--color-primary) 5%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 12%, transparent)",
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
          }}
        >
          {analysisSource && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background:
                  analysisSource === "openrouter"
                    ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                    : "color-mix(in srgb, var(--color-muted-foreground) 10%, transparent)",
                color:
                  analysisSource === "openrouter"
                    ? "var(--color-info)"
                    : "var(--color-muted-foreground)",
              }}
            >
              {analysisSource === "openrouter" ? (
                <>
                  <BrainCircuit size={12} /> AI Analysis
                </>
              ) : analysisSource === "local_engine" ? (
                <>
                  <Activity size={12} /> Local Engine
                </>
              ) : (
                <>
                  <AlertTriangle size={12} /> Limited Data
                </>
              )}
            </span>
          )}
          {dataQuality && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              {dataQuality.candleCount} candles
              {dataQuality.usedRealData ? "" : " (simulated)"}
              {dataQuality.dataSource !== "none" ? ` · ${dataQuality.dataSource}` : ""}
            </span>
          )}
        </div>
      )}

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
              background: trackMutation.isSuccess
                ? "color-mix(in srgb, var(--color-bullish) 15%, transparent)"
                : GREEN_GRAD,
              color: "var(--color-background)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: trackMutation.isPending || trackMutation.isSuccess ? "default" : "pointer",
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
  );
}

/** Vixor Verdict box rendered below the hero card. */
export function VixorVerdictBox({
  a,
  recColor,
  vixorMsg,
}: {
  a: any;
  recColor: string;
  vixorMsg: string;
}) {
  return (
    <div
      style={{
        ...CARD,
        padding: "16px",
        margin: "0 16px 16px",
        borderLeft: `4px solid ${recColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <BrainCircuit size={20} style={{ color: recColor, flexShrink: 0 }} />
        <span style={{ ...LABEL, letterSpacing: "0.1em" }}>Vixor Verdict</span>
      </div>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: 1.6,
          color: "color-mix(in srgb, var(--color-primary) 90%, transparent)",
        }}
      >
        {highlightSMC(vixorMsg)}
      </p>
      <div
        style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
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
            background:
              "linear-gradient(135deg, var(--color-bullish), color-mix(in srgb, var(--color-bullish) 70%, transparent))",
            color: "var(--color-foreground)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            textDecoration: "none",
            boxShadow: "0 4px 12px color-mix(in srgb, var(--color-bullish) 25%, transparent)",
            transition: "transform 0.15s ease",
          }}
        >
          <Zap size={16} />
          Trade This Signal
        </Link>
      </div>
    </div>
  );
}
