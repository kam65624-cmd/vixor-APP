import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Upload, Camera, Sparkles, X, Loader2, ArrowLeft, Image as ImageIcon, Clock, ChevronRight, Zap } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createAnalysis, getMe, listAnalyses } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({ meta: [{ title: "Analyze — Vixor" }] }),
  component: Analyze,
});

const TRADING_STYLES = [
  { id: "Scalping", label: "Scalping", desc: "Fast, intra-day" },
  { id: "Day Trading", label: "Day Trading", desc: "Within session" },
  { id: "Swing Trading", label: "Swing", desc: "Multi-day holds" },
];

const STEPS = ["Connecting to Engine", "Extracting Price Action", "Computing Market Structure", "Generating Scenarios"];

function Analyze() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const create = useServerFn(createAnalysis);
  const fetchRecent = useServerFn(listAnalyses);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });
  const recent = useQuery({ queryKey: ["analyses", 5], queryFn: () => fetchRecent({ data: { limit: 5 } }) });
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<"upload" | "preview" | "analyzing">("upload");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>("auto");
  const [tradingStyle, setTradingStyle] = useState<string>("Day Trading");

  const points = me.data?.balance.balance ?? 0;
  const isPremium = !!me.data?.isPremium;

  function pickFile(f: File | null) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setErr("PNG, JPG, or WebP only"); return; }
    if (f.size > 8 * 1024 * 1024) { setErr("Max 8 MB"); return; }
    setErr(null);
    setFile(f);

    const name = f.name.toLowerCase();
    if (name.includes("gold") || name.includes("xau")) setSelectedPair("XAU/USD");
    else if (name.includes("eur")) setSelectedPair("EUR/USD");
    else if (name.includes("btc")) setSelectedPair("BTC/USD");
    else if (name.includes("gbp")) setSelectedPair("GBP/JPY");
    else if (name.includes("nasdaq") || name.includes("ndx")) setSelectedPair("NASDAQ");
    else setSelectedPair("auto");

    const reader = new FileReader();
    reader.onload = () => { setPreview(reader.result as string); setStage("preview"); };
    reader.readAsDataURL(f);
  }

  async function handlePaste() {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find(t => t.startsWith("image/"));
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
    if (!isPremium && points < 10) { setErr("Need at least 10 points. Check your profile."); return; }
    setStage("analyzing"); setProgress(0); setErr(null);
    
    const ticker = setInterval(() => setProgress(p => Math.min(p + 1, STEPS.length - 1)), 2000);
    
    try {
      const { id } = await create({ 
        data: { 
          imageBase64: preview, 
          mimeType: file.type as any,
          fileName: file.name,
          selectedPair: selectedPair === "auto" ? undefined : selectedPair,
          trading_style: tradingStyle
        } 
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
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate({ to: "/" })} className="size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Vixor Intelligence</div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Analyze Chart</h1>
        </div>
        {!isPremium && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg terminal-card text-[10px] font-bold text-foreground">
            <Zap className="size-3 text-primary" /> {points} pts
          </div>
        )}
        {isPremium && (
          <div className="px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
            PRO
          </div>
        )}
      </div>

      {/* Error */}
      {err && (
        <div className="p-3 bg-bearish/8 border border-bearish/20 text-bearish text-xs font-bold rounded-xl animate-in shake">
          {err}
        </div>
      )}

      {/* ═══ UPLOAD STAGE ═══ */}
      {stage === "upload" && (
        <>
          <label className="block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-card/30 hover:bg-card/50 transition-colors cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="size-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="size-7 text-primary" />
              </div>
              <div className="font-bold text-base mb-1">Upload Chart Image</div>
              <div className="text-xs text-muted-foreground">PNG, JPG, WebP · Max 8MB</div>
              <div className="text-[10px] text-muted-foreground mt-2">Or paste from clipboard (Ctrl+V)</div>
            </div>
            <input type="file" ref={fileRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={e => pickFile(e.target.files?.[0] || null)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => fileRef.current?.click()} className="h-14 rounded-xl terminal-card flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors">
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Gallery</span>
            </button>
            <button onClick={handlePaste} className="h-14 rounded-xl terminal-card flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors">
              <Camera className="size-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Paste</span>
            </button>
          </div>

          {/* What you'll get */}
          <div className="terminal-card p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">What Vixor Provides</div>
            <div className="space-y-2.5">
              {[
                { icon: "📊", text: "Market structure & trend analysis" },
                { icon: "🎯", text: "3 scenarios with triggers & invalidations" },
                { icon: "🧠", text: "Trade thesis — why, confirms, invalidates" },
                { icon: "📰", text: "News confluence with technicals" },
                { icon: "📚", text: "SMC/ICT education built-in" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
                  <span className="text-base">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Analyses */}
          {recent.data && recent.data.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Recent Analyses</div>
              <div className="space-y-2">
                {recent.data.slice(0, 3).map((a: any) => (
                  <Link
                    key={a.id}
                    to="/analysis/$id"
                    params={{ id: a.id }}
                    className="terminal-card p-3.5 flex items-center justify-between hover:bg-card-hover transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                        a.recommendation === "BUY" ? "bg-bullish/10 text-bullish"
                        : a.recommendation === "SELL" ? "bg-bearish/10 text-bearish"
                        : "bg-neutral-wait/10 text-neutral-wait"
                      )}>
                        {a.recommendation}
                      </span>
                      <div>
                        <div className="font-bold text-sm font-mono">{a.pair}</div>
                        <div className="text-[10px] text-muted-foreground">{a.timeframe} · {relTime(a.created_at)}</div>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ PREVIEW STAGE ═══ */}
      {stage === "preview" && preview && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-border aspect-[4/3] bg-black group">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            <button onClick={() => { setFile(null); setPreview(null); setStage("upload"); }} className="absolute top-3 right-3 size-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 hover:scale-110 transition-transform text-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="terminal-card p-4 space-y-4">
            {/* Trading Style */}
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-2 block">Trading Style</label>
              <div className="grid grid-cols-3 gap-2">
                {TRADING_STYLES.map(s => (
                  <button key={s.id} onClick={() => setTradingStyle(s.id)}
                    className={cn(
                      "h-14 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5",
                      tradingStyle === s.id
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-card border-border text-muted-foreground hover:bg-card-hover"
                    )}>
                    <span className="font-bold">{s.label}</span>
                    <span className="text-[9px] font-medium opacity-70">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cost indicator */}
            {!isPremium && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <span className="text-xs text-muted-foreground">Analysis Cost</span>
                <span className="text-xs font-bold flex items-center gap-1">
                  <Zap className="size-3 text-primary" /> 10 points
                </span>
              </div>
            )}

            {/* Start Button */}
            <button 
              onClick={startAnalysis} 
              disabled={!isPremium && points < 10} 
              className={cn(
                "w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.97] disabled:opacity-50",
                "bg-primary text-primary-foreground hover:brightness-110"
              )}
            >
              <Sparkles className="size-5" /> Generate Intelligence Report
            </button>
          </div>
        </div>
      )}

      {/* ═══ ANALYZING STAGE ═══ */}
      {stage === "analyzing" && (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-2xl bg-primary/15 animate-ping" />
            <div className="relative size-20 rounded-2xl bg-primary/8 border border-primary/20 flex items-center justify-center">
              <Loader2 className="size-9 text-primary animate-spin" strokeWidth={2} />
            </div>
          </div>
          
          <h2 className="text-xl font-bold tracking-tight mb-2">Generating Intelligence...</h2>
          <div className="text-sm font-mono text-primary font-bold">{STEPS[progress]}</div>
          
          <div className="w-48 h-1.5 bg-muted rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${((progress + 1) / STEPS.length) * 100}%` }} />
          </div>
          
          <p className="text-xs text-muted-foreground mt-4 max-w-[260px]">
            Analyzing structure, building scenarios, and cross-referencing fundamentals
          </p>
        </div>
      )}
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
