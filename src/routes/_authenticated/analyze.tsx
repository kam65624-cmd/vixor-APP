import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Upload,
  Camera,
  Sparkles,
  X,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Clipboard,
  Crosshair,
  Info,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createAnalysis } from "@/domains/analysis/functions";
import { getMe } from "@/domains/user/functions";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({ meta: [{ title: "Analyze — Vixor" }] }),
  component: Analyze,
  validateSearch: (search: Record<string, unknown>) => ({
    screenshot: (search.screenshot as string) || undefined,
    pair: (search.pair as string) || undefined,
  }),
});

// ── Local style constants using THEME ──

const cardStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: 8,
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  color: "var(--color-foreground)",
  borderRadius: 6,
  height: 44,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 14,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

const TRADING_STYLES = [
  { id: "Scalping", icon: "⚡", label: "Scalping" },
  { id: "Day Trading", icon: "☀️", label: "Day Trading" },
  { id: "Swing Trading", icon: "🌊", label: "Swing Trading" },
];

const ANALYSIS_TECHNIQUES = [
  {
    id: "SMC",
    icon: "🏗️",
    label: "SMC",
    desc: "Smart Money Concepts — full BOS, ChoCH, OB, FVG, Liquidity",
  },
  {
    id: "ICT",
    icon: "🎯",
    label: "ICT",
    desc: "Inner Circle Trader — Optimal Trade Entry, Killzones",
  },
  { id: "OB_FVG", icon: "🧱", label: "OB + FVG", desc: "Order Blocks & Fair Value Gaps focus" },
  {
    id: "CLASSIC",
    icon: "📊",
    label: "Classic TA",
    desc: "Traditional indicators: RSI, MACD, Support/Resistance",
  },
];

const POPULAR_PAIRS = [
  { value: "auto", label: "Auto-detect", icon: "🔍" },
  { value: "XAU/USD", label: "XAU/USD", icon: "🥇" },
  { value: "EUR/USD", label: "EUR/USD", icon: "🇪🇺" },
  { value: "GBP/USD", label: "GBP/USD", icon: "🇬🇧" },
  { value: "BTC/USDT", label: "BTC/USDT", icon: "₿" },
  { value: "ETH/USDT", label: "ETH/USDT", icon: "Ξ" },
  { value: "USD/JPY", label: "USD/JPY", icon: "🇯🇵" },
  { value: "GBP/JPY", label: "GBP/JPY", icon: "🇬🇧🇯🇵" },
  { value: "SOL/USDT", label: "SOL/USDT", icon: "◎" },
];

const STEPS_KEYS = [
  "analyze.steps.connecting",
  "analyze.steps.extracting",
  "analyze.steps.computing",
  "analyze.steps.generating",
];

function Analyze() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const search = useSearch({ strict: false }) as { screenshot?: string; pair?: string };
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetchMe = useStableServerFn(getMe);
  const create = useStableServerFn(createAnalysis);

  const me = useQuery(
    useMemo(
      () => ({ queryKey: ["me"] as const, queryFn: () => fetchMe({}), staleTime: 30_000 }),
      [fetchMe],
    ),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<"upload" | "preview" | "analyzing">("upload");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>("auto");
  const [tradingStyle, setTradingStyle] = useState<string>("Day Trading");
  const [analysisTechnique, setAnalysisTechnique] = useState<string>("SMC");
  const [screenshotProcessed, setScreenshotProcessed] = useState(false);

  const points = me.data?.balance.balance ?? 0;
  const isPremium = !!me.data?.isPremium;

  // Handle incoming screenshot from charts page
  useEffect(() => {
    if (screenshotProcessed) return;
    if (search.screenshot && search.screenshot.length > 100) {
      setScreenshotProcessed(true);
      const screenshotData = search.screenshot;

      // Set the preview directly with the screenshot base64 data
      setPreview(screenshotData);
      setStage("preview");

      // Set the pair if provided
      if (search.pair) {
        setSelectedPair(search.pair);
      }

      // Create a File object from the screenshot for the analysis
      try {
        const b64 = screenshotData.includes(",") ? screenshotData.split(",")[1] : screenshotData;
        const byteString = atob(b64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: "image/png" });
        const f = new File([blob], `chart-${search.pair || "screenshot"}.png`, {
          type: "image/png",
        });
        setFile(f);
      } catch (e) {
        console.warn("[Analyze] Failed to create file from screenshot:", e);
      }

      // Clean the URL to remove the large screenshot data
      window.history.replaceState({}, "", "/analyze");
    }
  }, [search.screenshot, search.pair, screenshotProcessed]);

  function pickFile(f: File | null) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) {
      setErr("PNG, JPG, or WebP only");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErr("Max 8 MB");
      return;
    }
    setErr(null);
    setFile(f);

    const name = f.name.toLowerCase();
    if (name.includes("gold") || name.includes("xau")) setSelectedPair("XAU/USD");
    else if (name.includes("eur")) setSelectedPair("EUR/USD");
    else if (name.includes("btc")) setSelectedPair("BTC/USD");
    else setSelectedPair("auto");

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setStage("preview");
    };
    reader.readAsDataURL(f);
  }

  async function handlePaste() {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await it.getType(type);
          pickFile(new File([blob], "pasted.png", { type }));
          return;
        }
      }
      setErr("No image found on clipboard");
    } catch {
      setErr("Clipboard access denied. Please paste manually (Ctrl+V)");
    }
  }

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) pickFile(blob);
          break;
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  async function startAnalysis() {
    if (!file || !preview) {
      setErr("Please upload a chart image first.");
      return;
    }
    if (!isPremium && points < 10) {
      setErr("Need at least 10 points. Check your profile.");
      return;
    }
    setStage("analyzing");
    setProgress(0);
    setErr(null);

    const ticker = setInterval(
      () => setProgress((p) => Math.min(p + 1, STEPS_KEYS.length - 1)),
      2000,
    );

    try {
      const { id } = await create({
        data: {
          imageBase64: preview,
          mimeType: file.type as any,
          fileName: file.name,
          selectedPair: selectedPair === "auto" ? undefined : selectedPair,
          tradingStyle: tradingStyle,
          analysisStyle: analysisTechnique,
        },
      });
      clearInterval(ticker);
      navigate({ to: "/analysis/$id", params: { id } });
    } catch (e) {
      clearInterval(ticker);
      setErr(e instanceof Error ? e.message : "Failed to analyze");
      setStage("preview");
    }
  }

  return (
    <PageLayout
      title={t("analyze.title") || "Chart Analysis"}
      badge={t("analyze.subtitle") || "AI ANALYSIS"}
      badgeColor={"var(--color-bullish)"}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 32 }}>
        {/* Back button */}
        <button
          onClick={() => navigate({ to: "/" })}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            ...cardStyle,
            border: `1px solid ${"var(--color-border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--color-muted-foreground)",
          }}
        >
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>

        {err && (
          <div
            style={{
              padding: 12,
              background: "rgba(246,70,93,0.10)",
              border: "1px solid rgba(246,70,93,0.30)",
              color: "var(--color-bearish)",
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            {err}
          </div>
        )}

        {stage === "upload" && (
          <>
            {/* Hidden file inputs — one for gallery, one for camera */}
            <input
              id="chart-upload-input"
              type="file"
              ref={fileRef}
              style={{ display: "none" }}
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
            <input
              id="chart-camera-input"
              type="file"
              ref={cameraRef}
              style={{ display: "none" }}
              accept="image/*"
              capture="environment"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
            {/* Upload dropzone — uses htmlFor only (no onClick) to prevent double-trigger on mobile */}
            <label
              htmlFor="chart-upload-input"
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "4/3",
                borderRadius: 16,
                border: "2px dashed var(--color-border)",
                background: "rgba(255, 255, 255, 0.04)",
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
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
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: "rgba(14,203,129,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    boxShadow: "0 0 20px rgba(14,203,129,0.1)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <Upload style={{ width: 36, height: 36, color: "var(--color-bullish)" }} />
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 20,
                    color: "var(--color-foreground)",
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--color-muted-foreground)",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Crosshair style={{ width: 12, height: 12 }} /> Pair / Instrument
              </label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
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
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "rgba(14,203,129,0.10)",
                    border: "1px solid rgba(14,203,129,0.20)",
                  }}
                >
                  <Crosshair style={{ width: 14, height: 14, color: "var(--color-bullish)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-bullish)" }}>
                    Analyzing: {selectedPair}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {/* Gallery — uses label htmlFor instead of programmatic click for mobile compatibility */}
              <label
                htmlFor="chart-upload-input"
                style={{
                  height: 56,
                  borderRadius: 8,
                  ...cardStyle,
                  border: `1px solid ${"var(--color-border)"}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <ImageIcon
                  style={{ width: 20, height: 20, color: "var(--color-muted-foreground)" }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {t("analyze.gallery") || "Gallery"}
                </span>
              </label>
              {/* Camera — uses separate input with capture attribute */}
              <label
                htmlFor="chart-camera-input"
                style={{
                  height: 56,
                  borderRadius: 8,
                  ...cardStyle,
                  border: `1px solid ${"var(--color-border)"}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <Camera style={{ width: 20, height: 20, color: "var(--color-muted-foreground)" }} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  Camera
                </span>
              </label>
              {/* Paste from clipboard */}
              <button
                type="button"
                onClick={handlePaste}
                style={{
                  height: 56,
                  borderRadius: 8,
                  ...cardStyle,
                  border: `1px solid ${"var(--color-border)"}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <Clipboard
                  style={{ width: 20, height: 20, color: "var(--color-muted-foreground)" }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {t("analyze.paste") || "Paste"}
                </span>
              </button>
            </div>
          </>
        )}

        {stage === "preview" && preview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${"var(--color-border)"}`,
                aspectRatio: "4/3",
                background: "rgba(124,155,196,0.05)",
              }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setStage("upload");
                }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
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
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger
                    style={{
                      ...inputStyle,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
                      borderRadius: 6,
                      background: "rgba(14,203,129,0.10)",
                      border: "1px solid rgba(14,203,129,0.20)",
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
                      onClick={() => setTradingStyle(s.id)}
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
                          tradingStyle === s.id ? "rgba(14,203,129,0.15)" : "var(--color-card)",
                        borderColor:
                          tradingStyle === s.id ? "rgba(14,203,129,0.30)" : "var(--color-border)",
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
                  {ANALYSIS_TECHNIQUES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAnalysisTechnique(t.id)}
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
                          analysisTechnique === t.id
                            ? "rgba(124,155,196,0.15)"
                            : "var(--color-card)",
                        borderColor:
                          analysisTechnique === t.id
                            ? "var(--color-primary)"
                            : "var(--color-border)",
                        color:
                          analysisTechnique === t.id
                            ? "var(--color-primary)"
                            : "var(--color-muted-foreground)",
                        textAlign: "left" as const,
                      }}
                    >
                      <span style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: "var(--color-muted-foreground)",
                          lineHeight: 1.4,
                        }}
                      >
                        {t.desc}
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
                  background: "rgba(14,203,129,0.05)",
                  border: "1px solid rgba(14,203,129,0.15)",
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
                  — Smart Money Concepts &amp; Inner Circle Trader methodology for order blocks,
                  FVGs, liquidity zones, and more.
                </p>
              </div>

              <button
                onClick={startAnalysis}
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
                      background: "rgba(0,0,0,0.2)",
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
        )}

        {stage === "analyzing" && (
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
                  background: "rgba(14,203,129,0.20)",
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
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
        )}
      </div>
    </PageLayout>
  );
}
