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

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({ meta: [{ title: "Analyze — Vixor" }] }),
  component: Analyze,
  validateSearch: (search: Record<string, unknown>) => ({
    screenshot: (search.screenshot as string) || undefined,
    pair: (search.pair as string) || undefined,
  }),
});

const TRADING_STYLES = [
  { id: "Scalping", icon: "⚡", label: "Scalping" },
  { id: "Day Trading", icon: "☀️", label: "Day Trading" },
  { id: "Swing Trading", icon: "🌊", label: "Swing Trading" },
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

  const [stage, setStage] = useState<"upload" | "preview" | "analyzing">("upload");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>("auto");
  const [tradingStyle, setTradingStyle] = useState<string>("Day Trading");
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
    if (!file || !preview) return;
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
    <div className="space-y-5 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            {t("analyze.subtitle")}
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-none">{t("analyze.title")}</h1>
        </div>
      </div>

      {err && (
        <div className="p-3 bg-bearish/10 border border-bearish/30 text-bearish text-xs font-bold rounded-xl animate-in shake">
          {err}
        </div>
      )}

      {stage === "upload" && (
        <>
          <label className="block w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-card/50 hover:bg-card/80 transition-colors cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="size-8 text-primary" />
              </div>
              <div className="font-bold text-lg mb-1">{t("analyze.tapToUpload")}</div>
              <div className="text-xs text-muted-foreground">PNG, JPG, WebP (Max 8MB)</div>
            </div>
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* Pair Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide flex items-center gap-1.5">
              <Crosshair className="size-3" /> Pair / Instrument
            </label>
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="h-11 rounded-xl bg-card border border-border text-sm font-mono">
                <SelectValue placeholder="Select pair" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_PAIRS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center gap-2 font-mono">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-bold">{p.label}</span>
                      {p.value === "auto" && (
                        <span className="text-[10px] text-muted-foreground ml-1">(VLM detect)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPair !== "auto" && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Crosshair className="size-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">Analyzing: {selectedPair}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="h-14 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors"
            >
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {t("analyze.gallery")}
              </span>
            </button>
            <button
              onClick={handlePaste}
              className="h-14 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors"
            >
              <Clipboard className="size-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {t("analyze.paste")}
              </span>
            </button>
          </div>
        </>
      )}

      {stage === "preview" && preview && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border aspect-[4/3] bg-black group">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setStage("upload");
              }}
              className="absolute top-3 right-3 size-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 hover:scale-110 transition-transform text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="vixor-card p-4 space-y-4">
            {/* Pair Selection (in preview too) */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                <Crosshair className="size-3" /> Pair / Instrument
              </label>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="h-11 rounded-xl bg-card border border-border text-sm font-mono">
                  <SelectValue placeholder="Select pair" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_PAIRS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2 font-mono">
                        <span className="text-base">{p.icon}</span>
                        <span className="font-bold">{p.label}</span>
                        {p.value === "auto" && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            (VLM detect)
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPair !== "auto" && (
                <div className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Crosshair className="size-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">Analyzing: {selectedPair}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                Trading Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TRADING_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTradingStyle(s.id)}
                    className={`h-12 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${tradingStyle === s.id ? "bg-primary text-primary-foreground border-primary glow-primary" : "bg-card border-border text-muted-foreground hover:bg-card-hover"}`}
                  >
                    <span className="text-base">{s.icon}</span>{" "}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SMC/ICT Engine Note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-info/5 border border-info/20">
              <Info className="size-4 text-info shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Analysis powered by the{" "}
                <span className="font-bold text-foreground">local SMC/ICT engine</span> — Smart
                Money Concepts &amp; Inner Circle Trader methodology for order blocks, FVGs,
                liquidity zones, and more.
              </p>
            </div>

            <button
              onClick={startAnalysis}
              disabled={!isPremium && points < 10}
              className="w-full h-16 rounded-2xl gradient-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-primary/25"
            >
              <Sparkles className="size-6" /> {t("analyze.startAnalysis")}
              {!isPremium && (
                <span className="ml-2 text-xs bg-black/20 px-2 py-0.5 rounded-full">-10 pts</span>
              )}
            </button>
          </div>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping" />
            <div className="relative size-24 rounded-3xl gradient-primary glow-primary flex items-center justify-center">
              <Loader2 className="size-10 text-white animate-spin" strokeWidth={2.5} />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-2">{t("analyze.analyzing")}</h2>
          <div className="text-sm font-mono text-primary font-bold">{t(STEPS_KEYS[progress])}</div>

          <div className="w-48 h-1.5 bg-muted rounded-full mt-6 overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-500 ease-out"
              style={{ width: `${((progress + 1) / STEPS_KEYS.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
