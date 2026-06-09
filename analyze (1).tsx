import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Upload,
  Image as ImageIcon,
  Camera,
  Clipboard,
  Calculator,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAnalysis, getMe } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({ meta: [{ title: "Analyze — Vixor" }] }),
  component: Analyze,
});

const STEPS = [
  "Validating chart",
  "Analyzing patterns",
  "Generating trade setup",
  "Finalizing results",
];

function Analyze() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const create = useServerFn(createAnalysis);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<"upload" | "preview" | "analyzing">("upload");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const points = me.data?.balance.balance ?? 0;
  const isPremium = !!me.data?.isPremium;

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
      setErr("No image on clipboard");
    } catch {
      setErr("Clipboard access denied");
    }
  }

  async function startAnalysis() {
    if (!file || !preview) return;
    if (!isPremium && points < 10) {
      setErr("Need at least 10 points");
      return;
    }
    setStage("analyzing");
    setProgress(0);
    setErr(null);
    const ticker = setInterval(() => setProgress((p) => Math.min(p + 1, STEPS.length - 1)), 1500);
    try {
      const { id } = await create({ data: { imageBase64: preview, mimeType: file.type as any } });
      clearInterval(ticker);
      setProgress(STEPS.length);
      setTimeout(() => navigate({ to: "/analysis/$id", params: { id } }), 400);
    } catch (e) {
      clearInterval(ticker);
      setErr(e instanceof Error ? e.message : "Analysis failed");
      setStage("preview");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analyze chart</h1>
        <p className="text-sm text-muted-foreground">
          Drop any chart screenshot. We'll do the rest.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {stage === "upload" && (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            className="vixor-card border-dashed border-2 border-border p-8 text-center vixor-card-hover cursor-pointer"
          >
            <div className="size-16 rounded-2xl gradient-primary glow-primary mx-auto flex items-center justify-center mb-4">
              <Upload className="size-7 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="font-semibold mb-1">Drop chart here</div>
            <div className="text-xs text-muted-foreground">PNG, JPG, or WebP — up to 8 MB</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="vixor-card vixor-card-hover p-3 flex flex-col items-center gap-2"
            >
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium">Gallery</span>
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.setAttribute("capture", "environment");
                  fileRef.current.click();
                }
              }}
              className="vixor-card vixor-card-hover p-3 flex flex-col items-center gap-2"
            >
              <Camera className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium">Camera</span>
            </button>
            <button
              onClick={handlePaste}
              className="vixor-card vixor-card-hover p-3 flex flex-col items-center gap-2"
            >
              <Clipboard className="size-5 text-muted-foreground" />
              <span className="text-xs font-medium">Paste</span>
            </button>
          </div>

          <div className="vixor-card p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-info/15 flex items-center justify-center">
              <Calculator className="size-5 text-info" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Lot calculator</div>
              <div className="text-xs text-muted-foreground">Size your trade with proper risk</div>
            </div>
            <button
              onClick={() => navigate({ to: "/lot-calculator" })}
              className="text-xs text-primary font-semibold"
            >
              Open
            </button>
          </div>

          {err && <div className="text-xs text-bearish text-center">{err}</div>}
          <div className="text-xs text-muted-foreground text-center">
            {isPremium
              ? "Premium · unlimited analyses"
              : `Each analysis costs 10 points · You have ${points} pts`}
          </div>
        </>
      )}

      {stage === "preview" && preview && (
        <>
          <div className="vixor-card overflow-hidden">
            <div className="aspect-[4/3] bg-card-hover flex items-center justify-center relative">
              <img src={preview} alt="Chart preview" className="w-full h-full object-contain" />
              <button
                onClick={() => {
                  setStage("upload");
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute top-2 right-2 size-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-3 text-xs text-muted-foreground truncate">
              {file?.name} · {file ? Math.round(file.size / 1024) : 0} KB
            </div>
          </div>
          {err && <div className="text-xs text-bearish text-center">{err}</div>}
          <button
            onClick={startAnalysis}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary"
          >
            <Sparkles className="size-4" /> Analyze chart {isPremium ? "" : "· 10 pts"}
          </button>
        </>
      )}

      {stage === "analyzing" && (
        <div className="vixor-card p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="size-16 rounded-2xl gradient-primary glow-primary mx-auto flex items-center justify-center">
              <Loader2 className="size-7 text-primary-foreground animate-spin" />
            </div>
            <h2 className="font-bold">Analyzing your chart</h2>
            <p className="text-xs text-muted-foreground">Vixor AI is reading the price action…</p>
          </div>
          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const done = i < progress;
              const active = i === progress;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "bg-primary/20 text-primary border border-primary animate-pulse"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
