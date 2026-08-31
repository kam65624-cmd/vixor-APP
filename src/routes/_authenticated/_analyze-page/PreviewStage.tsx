import { X, Sparkles, Crosshair, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cardStyle,
  inputStyle,
  POPULAR_PAIRS,
  TRADING_STYLES,
  ANALYSIS_TECHNIQUES,
} from "./constants";
import type { TranslateFn } from "./UploadStage";

interface PreviewStageProps {
  preview: string;
  selectedPair: string;
  tradingStyle: string;
  analysisTechnique: string;
  isPremium: boolean;
  points: number;
  onPairChange: (value: string) => void;
  onTradingStyleChange: (value: string) => void;
  onAnalysisTechniqueChange: (value: string) => void;
  onClearImage: () => void;
  onStartAnalysis: () => void;
  t: TranslateFn;
}

export function PreviewStage({
  preview,
  selectedPair,
  tradingStyle,
  analysisTechnique,
  isPremium,
  points,
  onPairChange,
  onTradingStyleChange,
  onAnalysisTechniqueChange,
  onClearImage,
  onStartAnalysis,
  t,
}: PreviewStageProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${"var(--color-border)"}`,
          aspectRatio: "4/3",
          background: "color-mix(in srgb, var(--color-primary) 5%, transparent)",
        }}
      >
        <img
          src={preview}
          alt="Preview"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        <button
          onClick={onClearImage}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--overlay-secondary)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            color: "var(--color-foreground)",
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div
        style={{
          ...cardStyle,
          border: `1px solid ${"var(--color-border)"}`,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Pair Selection (in preview too) */}
        <div>
          <label
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
              display: "block",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Crosshair style={{ width: 12, height: 12 }} /> Pair / Instrument
          </label>
          <Select value={selectedPair} onValueChange={onPairChange}>
            <SelectTrigger
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono)",
              }}
            >
              <SelectValue placeholder="Select pair" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_PAIRS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
                      {p.label}
                    </span>
                    {p.value === "auto" && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-muted-foreground)",
                          marginLeft: 4,
                        }}
                      >
                        (VLM detect)
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPair !== "auto" && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 8,
                background: "color-mix(in srgb, var(--color-bullish) 10%, transparent)",
                border: "1px solid var(--bullish-border)",
              }}
            >
              <Crosshair style={{ width: 14, height: 14, color: "var(--color-bullish)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-bullish)" }}>
                Analyzing: {selectedPair}
              </span>
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
              display: "block",
            }}
          >
            Trading Style
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {TRADING_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => onTradingStyleChange(s.id)}
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  background:
                    tradingStyle === s.id
                      ? "color-mix(in srgb, var(--color-bullish) 15%, transparent)"
                      : "var(--color-card)",
                  borderColor:
                    tradingStyle === s.id
                      ? "color-mix(in srgb, var(--color-bullish) 30%, transparent)"
                      : "var(--color-border)",
                  color:
                    tradingStyle === s.id
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)",
                }}
              >
                <span style={{ fontSize: 16 }}>{s.icon}</span>{" "}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
              display: "block",
            }}
          >
            Analysis Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ANALYSIS_TECHNIQUES.map((tech) => (
              <button
                key={tech.id}
                onClick={() => onAnalysisTechniqueChange(tech.id)}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  cursor: "pointer",
                  padding: "10px 12px",
                  background:
                    analysisTechnique === tech.id
                      ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                      : "var(--color-card)",
                  borderColor:
                    analysisTechnique === tech.id ? "var(--color-primary)" : "var(--color-border)",
                  color:
                    analysisTechnique === tech.id
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)",
                  textAlign: "left" as const,
                }}
              >
                <span style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{tech.icon}</span> {tech.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: "var(--color-muted-foreground)",
                    lineHeight: 1.4,
                  }}
                >
                  {tech.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SMC/ICT Engine Note */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: 12,
            borderRadius: 8,
            background: "color-mix(in srgb, var(--color-bullish) 5%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-bullish) 15%, transparent)",
          }}
        >
          <Info
            style={{
              width: 16,
              height: 16,
              color: "var(--color-bullish)",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <p
            style={{
              fontSize: 13,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Analysis powered by the{" "}
            <span style={{ fontWeight: 700, color: "var(--color-foreground)" }}>
              local SMC/ICT engine
            </span>{" "}
            — Smart Money Concepts &amp; Inner Circle Trader methodology for order blocks, FVGs,
            liquidity zones, and more.
          </p>
        </div>

        <button
          onClick={onStartAnalysis}
          disabled={!isPremium && points < 10}
          style={{
            width: "100%",
            height: 64,
            borderRadius: 8,
            background: "var(--color-bullish)",
            color: "var(--color-foreground)",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "none",
            cursor: "pointer",
            opacity: !isPremium && points < 10 ? 0.5 : 1,
          }}
        >
          <Sparkles style={{ width: 24, height: 24 }} /> {t("analyze.startAnalysis")}
          {!isPremium && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                background: "color-mix(in srgb, var(--color-background) 80%, transparent)",
                padding: "2px 8px",
                borderRadius: "50px",
              }}
            >
              -10 pts
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
