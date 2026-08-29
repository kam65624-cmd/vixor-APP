import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createAnalysis } from "@/domains/analysis/functions";
import { getMe } from "@/domains/user/functions";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { PageLayout } from "@/components/vixor/PageLayout";
import { cardStyle, STEPS_KEYS } from "./constants";
import { UploadStage } from "./UploadStage";
import { PreviewStage } from "./PreviewStage";
import { AnalyzingStage } from "./AnalyzingStage";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({ meta: [{ title: "Analyze — Vixor" }] }),
  component: Analyze,
  validateSearch: (search: Record<string, unknown>) => ({
    screenshot: (search.screenshot as string) || undefined,
    pair: (search.pair as string) || undefined,
  }),
});

export function Analyze() {
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

  const pickFile = useCallback((f: File | null) => {
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
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((tp) => tp.startsWith("image/"));
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
  }, [pickFile]);

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
  }, [pickFile]);

  const startAnalysis = useCallback(async () => {
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
  }, [
    file,
    preview,
    isPremium,
    points,
    create,
    navigate,
    selectedPair,
    tradingStyle,
    analysisTechnique,
  ]);

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
              background: "color-mix(in srgb, var(--color-bearish) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-bearish) 30%, transparent)",
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
          <UploadStage
            fileRef={fileRef}
            cameraRef={cameraRef}
            selectedPair={selectedPair}
            onPairChange={setSelectedPair}
            onPickFile={pickFile}
            onPaste={handlePaste}
            t={t}
          />
        )}

        {stage === "preview" && preview && (
          <PreviewStage
            preview={preview}
            selectedPair={selectedPair}
            tradingStyle={tradingStyle}
            analysisTechnique={analysisTechnique}
            isPremium={isPremium}
            points={points}
            onPairChange={setSelectedPair}
            onTradingStyleChange={setTradingStyle}
            onAnalysisTechniqueChange={setAnalysisTechnique}
            onClearImage={() => {
              setFile(null);
              setPreview(null);
              setStage("upload");
            }}
            onStartAnalysis={startAnalysis}
            t={t}
          />
        )}

        {stage === "analyzing" && <AnalyzingStage progress={progress} t={t} />}
      </div>
    </PageLayout>
  );
}
