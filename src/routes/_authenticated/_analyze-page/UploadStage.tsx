import { type RefObject } from "react";
import { Upload, Camera, Image as ImageIcon, Clipboard, Crosshair } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputStyle, POPULAR_PAIRS } from "./constants";

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface UploadStageProps {
  fileRef: RefObject<HTMLInputElement | null>;
  cameraRef: RefObject<HTMLInputElement | null>;
  selectedPair: string;
  onPairChange: (value: string) => void;
  onPickFile: (f: File | null) => void;
  onPaste: () => void;
  t: TranslateFn;
}

export function UploadStage({
  fileRef,
  cameraRef,
  selectedPair,
  onPairChange,
  onPickFile,
  onPaste,
  t,
}: UploadStageProps) {
  return (
    <>
      {/* Hidden file inputs — one for gallery, one for camera */}
      <input
        id="chart-upload-input"
        type="file"
        ref={fileRef}
        style={{ display: "none" }}
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => onPickFile(e.target.files?.[0] || null)}
      />
      <input
        id="chart-camera-input"
        type="file"
        ref={cameraRef}
        style={{ display: "none" }}
        accept="image/*"
        capture="environment"
        onChange={(e) => onPickFile(e.target.files?.[0] || null)}
      />
      {/* Upload dropzone */}
      <label
        htmlFor="chart-upload-input"
        className="animate-slide-up"
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "4/3",
          borderRadius: 16,
          border: "2px dashed color-mix(in srgb, var(--color-foreground) 15%, transparent)",
          background: "color-mix(in srgb, var(--color-foreground) 2%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "inset 0 0 40px var(--overlay)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
          e.currentTarget.style.background =
            "color-mix(in srgb, var(--color-primary) 8%, transparent)";
          e.currentTarget.style.boxShadow =
            "inset 0 0 60px color-mix(in srgb, var(--color-primary) 15%, transparent), 0 8px 30px -4px var(--overlay-secondary)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor =
            "color-mix(in srgb, var(--color-foreground) 15%, transparent)";
          e.currentTarget.style.background =
            "color-mix(in srgb, var(--color-foreground) 2%, transparent)";
          e.currentTarget.style.boxShadow = "inset 0 0 40px var(--overlay)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div
            className="animate-subtle-bounce"
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--color-bullish) 15%, transparent), color-mix(in srgb, var(--color-bullish) 5%, transparent))",
              border: "1px solid var(--bullish-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow:
                "0 12px 32px color-mix(in srgb, var(--color-bullish) 15%, transparent), inset 0 2px 0 color-mix(in srgb, var(--color-foreground) 10%, transparent)",
            }}
          >
            <Upload style={{ width: 36, height: 36, color: "var(--color-bullish)" }} />
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: "var(--color-foreground)",
              marginBottom: 8,
              letterSpacing: "-0.01em",
              textShadow: "0 2px 10px color-mix(in srgb, var(--color-background) 50%, transparent)",
            }}
          >
            {t("analyze.tapToUpload") || "Tap to Upload Chart"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--color-muted-foreground)",
              maxWidth: "240px",
              lineHeight: 1.5,
            }}
          >
            PNG, JPG, WebP up to 8MB
          </div>
        </div>
      </label>

      {/* Pair Selection Dropdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        <label
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Crosshair style={{ width: 14, height: 14, color: "var(--color-primary)" }} /> Pair /
          Instrument
        </label>
        <Select value={selectedPair} onValueChange={onPairChange}>
          <SelectTrigger
            style={{
              ...inputStyle,
              fontFamily: "var(--font-mono)",
              height: 48,
              background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-foreground) 10%, transparent)",
              borderRadius: 12,
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
            className="animate-slide-up"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--bullish-bg)",
              border: "1px solid var(--bullish-border)",
            }}
          >
            <Crosshair style={{ width: 14, height: 14, color: "var(--color-bullish)" }} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-bullish)",
                letterSpacing: "0.02em",
              }}
            >
              Analyzing: {selectedPair}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginTop: 4,
        }}
      >
        {/* Gallery */}
        <label
          htmlFor="chart-upload-input"
          className="vixor-card-hover"
          style={{
            height: 64,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            cursor: "pointer",
            background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-foreground) 8%, transparent)",
          }}
        >
          <ImageIcon
            style={{
              width: 22,
              height: 22,
              color: "var(--color-primary-glow)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-foreground)",
            }}
          >
            {t("analyze.gallery") || "Gallery"}
          </span>
        </label>
        {/* Camera */}
        <label
          htmlFor="chart-camera-input"
          className="vixor-card-hover"
          style={{
            height: 64,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            cursor: "pointer",
            background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-foreground) 8%, transparent)",
          }}
        >
          <Camera
            style={{
              width: 22,
              height: 22,
              color: "var(--color-primary-glow)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-foreground)",
            }}
          >
            Camera
          </span>
        </label>
        {/* Paste */}
        <button
          type="button"
          onClick={onPaste}
          className="vixor-card-hover"
          style={{
            height: 64,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            cursor: "pointer",
            background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-foreground) 8%, transparent)",
          }}
        >
          <Clipboard
            style={{
              width: 22,
              height: 22,
              color: "var(--color-primary-glow)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-foreground)",
            }}
          >
            {t("analyze.paste") || "Paste"}
          </span>
        </button>
      </div>
    </>
  );
}
