import { Loader2 } from "lucide-react";
import { STEPS_KEYS } from "./constants";
import type { TranslateFn } from "./UploadStage";

interface AnalyzingStageProps {
  progress: number;
  t: TranslateFn;
}

export function AnalyzingStage({ progress, t }: AnalyzingStageProps) {
  return (
    <div
      style={{
        height: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", marginBottom: 32 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background: "var(--bullish-border)",
            animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        />
        <div
          style={{
            position: "relative",
            width: 96,
            height: 96,
            borderRadius: 12,
            background: "var(--color-bullish)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2
            style={{
              width: 40,
              height: 40,
              color: "var(--color-foreground)",
              animation: "spin 1s linear infinite",
            }}
            strokeWidth={2.5}
          />
        </div>
      </div>

      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--color-foreground)",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        {t("analyze.analyzing")}
      </h2>
      <div
        style={{
          fontSize: 14,
          fontFamily: "var(--font-mono)",
          color: "var(--color-bullish)",
          fontWeight: 700,
        }}
      >
        {t(STEPS_KEYS[progress])}
      </div>

      <div
        style={{
          width: 192,
          height: 6,
          background: "var(--color-muted-foreground)",
          borderRadius: 50,
          marginTop: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "var(--color-bullish)",
            transition: "width 500ms ease-out",
            width: `${((progress + 1) / STEPS_KEYS.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
