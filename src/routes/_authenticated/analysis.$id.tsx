import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { RecBadge, ConfidenceBar } from "@/components/vixor/atoms";
import {
  ArrowLeft, Share2, Bookmark, AlertTriangle, BookOpen, Layers, Target,
  Loader2, Maximize2, Zap, BrainCircuit, Activity, BarChart2, TrendingUp,
  Newspaper, ShieldCheck, TrendingDown, CheckCircle, ChevronRight, X
} from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAnalysis } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Vixor Signal — Analysis Result" }] }),
  component: AnalysisResult,
});

const TABS = ["Trade Setup", "Market Context", "News Impact", "Management"] as const;
interface Scenario { name: string; probability: number; entry: string; sl: number; tp1: number; tp2: number; rr: string }

// SMC/ICT term highlighter
function highlightSMC(text: string): React.ReactNode[] {
  const smcTerms = ["Order Block", "Fair Value Gap", "FVG", "Liquidity", "BOS", "ChoCh", "CHOCH", "ICT", "SMC", "Sweep", "Mitigation", "Break of Structure", "Change of Character", "Imbalance", "Premium", "Discount", "OB", "NWOG", "NDOG"];
  const regex = new RegExp(`(${smcTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (smcTerms.some(t => t.toLowerCase() === part.toLowerCase())) {
      return <span key={i} className="text-primary font-bold bg-primary/10 px-0.5 rounded">{part}</span>;
    }
    return part;
  });
}

function AnalysisResult() {
  const { id } = useParams({ from: "/_authenticated/analysis/$id" });
  const fetchFn = useServerFn(getAnalysis);
  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchFn({ data: { id } }),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "complete" || s === "failed" ? false : 1200;
    },
  });
  const [tab, setTab] = useState<(typeof TABS)[number]>("Trade Setup");
  const [imgZoom, setImgZoom] = useState(false);

  if (q.isLoading) return <Loading label="Loading your signal…" />;

  const a = q.data;
  if (!a) return <div className="vixor-card p-6 text-center font-medium">Analysis not found.</div>;

  if (a.status === "failed") {
    return (
      <div className="space-y-4">
        <BackHeader />
        <div className="vixor-card p-8 text-center border-bearish/30">
          <div className="size-16 rounded-full bg-bearish/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="size-8 text-bearish" />
          </div>
          <div className="text-lg font-bold">Analysis Failed</div>
          <div className="text-sm text-muted-foreground mt-2">{a.error_message ?? "The AI encountered an issue reading this chart."}</div>
          <Link to="/analyze" className="inline-flex mt-6 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-bold items-center transition-transform active:scale-95">
            Try another chart
          </Link>
        </div>
      </div>
    );
  }

  if (a.status !== "complete") return <Loading label="Vixor AI is generating your signal…" />;

  const signal = a.signal_badge as { direction: "BUY" | "SELL" | "WAIT"; entry: string; stop_loss: string; take_profit: string; rr: string } | null;
  const scenarios = a.scenarios as { conservative: Scenario; balanced: Scenario; aggressive: Scenario } | null;
  const management = (a.management ?? []) as string[];
  const isBullish = a.recommendation === "BUY";
  const isBearish = a.recommendation === "SELL";
  const isWait = a.recommendation === "WAIT";

  const heroColor = isBullish
    ? "border-bullish/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
    : isBearish
    ? "border-bearish/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
    : "border-neutral-wait/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]";

  const heroBg = isBullish
    ? "bg-gradient-to-br from-bullish/8 via-card to-card"
    : isBearish
    ? "bg-gradient-to-br from-bearish/8 via-card to-card"
    : "bg-gradient-to-br from-neutral-wait/8 via-card to-card";

  const recColor = isBullish ? "text-bullish" : isBearish ? "text-bearish" : "text-neutral-wait";
  const recBg = isBullish
    ? "bg-bullish/10 border-bullish/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
    : isBearish
    ? "bg-bearish/10 border-bearish/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
    : "bg-neutral-wait/10 border-neutral-wait/30";

  return (
    <div className="space-y-4 pb-6">
      <BackHeader />

      {/* ═══════════════════════════════════════
          HERO SIGNAL CARD — THE MAIN EVENT
      ═══════════════════════════════════════ */}
      <div className={`vixor-card p-5 border-2 relative overflow-hidden ${heroColor} ${heroBg}`}>
        {/* Animated top bar */}
        <div className={`absolute top-0 inset-x-0 h-0.5 ${isBullish ? "bg-bullish" : isBearish ? "bg-bearish" : "bg-neutral-wait"} animate-pulse`} />

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-card/80 backdrop-blur px-2 py-0.5 rounded border border-border">
                {a.timeframe ?? "AUTO"}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">{relTime(a.created_at)}</span>
            </div>
            <h1 className="text-4xl font-extrabold font-mono tracking-tight leading-none">{a.pair ?? "?"}</h1>
            <div className="text-xs font-bold text-muted-foreground mt-1">{a.pattern ?? "Pattern Analysis"}</div>
          </div>
          {/* Big recommendation pill */}
          <div className={`px-5 py-3 rounded-2xl border-2 font-extrabold text-2xl ${recColor} ${recBg} font-mono tracking-wider`}>
            {a.recommendation ?? "—"}
          </div>
        </div>

        {/* Signal Prices — the core data */}
        {signal && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-card/70 backdrop-blur p-3 rounded-xl border border-border text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Entry</div>
              <div className="font-mono font-bold text-base text-foreground">{signal.entry}</div>
            </div>
            <div className="bg-bearish/5 p-3 rounded-xl border border-bearish/30 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bearish mb-1.5">Stop Loss</div>
              <div className="font-mono font-bold text-base text-bearish">{signal.stop_loss}</div>
            </div>
            <div className="bg-bullish/5 p-3 rounded-xl border border-bullish/30 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bullish mb-1.5">Target</div>
              <div className="font-mono font-bold text-base text-bullish">{signal.take_profit}</div>
            </div>
          </div>
        )}

        {/* RR + Confidence row */}
        <div className="flex items-center gap-3">
          {signal && (
            <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${recBg} ${recColor}`}>
              R:R {signal.rr}
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Confidence</span>
              <span className={`text-xs font-bold font-mono ${recColor}`}>{a.confidence ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isBullish ? "bg-bullish" : isBearish ? "bg-bearish" : "bg-neutral-wait"}`}
                style={{ width: `${a.confidence ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          VIXOR VERDICT BOX
      ═══════════════════════════════════════ */}
      {a.vixor_message && (
        <div className={`vixor-card p-4 border-l-4 ${isBullish ? "border-l-bullish" : isBearish ? "border-l-bearish" : "border-l-neutral-wait"}`}>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className={`size-5 shrink-0 ${isBullish ? "text-bullish" : isBearish ? "text-bearish" : "text-neutral-wait"}`} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Vixor Verdict</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            {highlightSMC(a.vixor_message)}
          </p>
        </div>
      )}

      {/* Chart Image */}
      {a.imageUrl && (
        <div className="vixor-card overflow-hidden relative group cursor-pointer" onClick={() => setImgZoom(!imgZoom)}>
          <img src={a.imageUrl} alt="Analyzed chart" className="w-full max-h-52 object-contain bg-black" />
          <div className="absolute bottom-2 right-2 size-8 rounded-lg bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="size-4" />
          </div>
        </div>
      )}

      {/* Image zoom overlay */}
      {imgZoom && a.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4" onClick={() => setImgZoom(false)}>
          <button className="absolute top-4 right-4 size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <X className="size-5" />
          </button>
          <img src={a.imageUrl} alt="Chart" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/trade-desk" className="h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 glow-primary active:scale-95 transition-transform">
          <Zap className="size-4" /> Use in Calculator
        </Link>
        <Link to="/journal" className="h-12 rounded-xl bg-card border border-border font-bold text-sm flex items-center justify-center gap-2 hover:bg-card-hover active:scale-95 transition-all">
          <BookOpen className="size-4 text-muted-foreground" /> Add to Journal
        </Link>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all px-2 ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ TAB: Trade Setup ═══ */}
      {tab === "Trade Setup" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="vixor-card p-5">
            <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Target className="size-4 text-primary" /> Why This Trade
            </h3>
            <ul className="space-y-3">
              {(a.reasons ?? []).map((r: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-medium">{highlightSMC(r)}</span>
                </li>
              ))}
            </ul>
          </div>

          {scenarios && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs ml-1 uppercase tracking-wider text-muted-foreground">Execution Scenarios</h3>
              {([
                { label: "Conservative", s: scenarios.conservative, color: "text-info", border: "border-l-info/60", bg: "bg-info/5" },
                { label: "Balanced ✦", s: scenarios.balanced, color: "text-primary", border: "border-l-primary/80", bg: "bg-primary/5", glow: true },
                { label: "Aggressive", s: scenarios.aggressive, color: "text-neutral-wait", border: "border-l-neutral-wait/60", bg: "bg-neutral-wait/5" },
              ]).map(({ label, s, color, border, bg, glow }) => (
                <div key={label} className={`vixor-card p-4 border-l-4 ${border} ${bg} ${glow ? "shadow-[0_0_20px_rgba(16,185,129,0.12)]" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">PROB: {s.probability}%</span>
                    </div>
                    <span className="font-mono text-sm font-extrabold bg-card px-2 py-0.5 rounded border border-border">R:R {s.rr}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-card p-2.5 rounded-xl border border-border">
                      <div className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Entry</div>
                      <div className="font-mono text-sm font-bold">{s.entry}</div>
                    </div>
                    <div className="bg-bearish/5 p-2.5 rounded-xl border border-bearish/20">
                      <div className="text-[9px] text-bearish font-bold uppercase mb-1">SL</div>
                      <div className="font-mono text-sm font-bold text-bearish">{s.sl?.toLocaleString()}</div>
                    </div>
                    <div className="bg-bullish/5 p-2.5 rounded-xl border border-bullish/20">
                      <div className="text-[9px] text-bullish font-bold uppercase mb-1">TP</div>
                      <div className="font-mono text-sm font-bold text-bullish">{s.tp2?.toLocaleString()}</div>
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {a.key_levels && (
            <div className="vixor-card p-5">
              <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BarChart2 className="size-4 text-primary" /> Key SMC Levels
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-bearish uppercase tracking-wider">Resistance / BSL</span>
                  {((a.key_levels as any).resistance || []).map((l: number, i: number) => (
                    <div key={i} className="bg-bearish/5 border border-bearish/20 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bearish/90">{l.toLocaleString()}</div>
                  ))}
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-bullish uppercase tracking-wider">Support / SSL</span>
                  {((a.key_levels as any).support || []).map((l: number, i: number) => (
                    <div key={i} className="bg-bullish/5 border border-bullish/20 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bullish/90">{l.toLocaleString()}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {a.liquidity_zones && (
            <div className="vixor-card p-5">
              <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Liquidity Pools
              </h3>
              <div className="space-y-2">
                {((a.liquidity_zones as any).buySide || []).map((l: number, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-bullish/5 border border-bullish/20">
                    <span className="text-xs font-bold text-bullish uppercase">Buy-Side Liquidity (BSL)</span>
                    <span className="font-mono font-bold text-bullish">{l.toLocaleString()}</span>
                  </div>
                ))}
                {((a.liquidity_zones as any).sellSide || []).map((l: number, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-bearish/5 border border-bearish/20">
                    <span className="text-xs font-bold text-bearish uppercase">Sell-Side Liquidity (SSL)</span>
                    <span className="font-mono font-bold text-bearish">{l.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {a.market_structure && (
            <div className="vixor-card p-5">
              <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> Market Structure (SMC)
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Direction", value: (a.market_structure as any).direction },
                  { label: "Structure", value: (a.market_structure as any).structure },
                  ...(a.invalidation_level ? [{ label: "⚠ Invalidation Level", value: a.invalidation_level.toLocaleString(), danger: true }] : []),
                  ...((a.market_structure as any).bos ? [{ label: "BOS Level", value: (a.market_structure as any).bos?.toLocaleString() }] : []),
                ].map(({ label, value, danger }) => (
                  <div key={label} className={`flex justify-between items-center p-3 rounded-xl border ${danger ? "bg-bearish/10 border-bearish/30" : "bg-card border-border"}`}>
                    <span className={`text-xs font-bold uppercase ${danger ? "text-bearish" : "text-muted-foreground"}`}>{label}</span>
                    <span className={`font-mono font-bold ${danger ? "text-bearish" : ""}`}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: News Impact ═══ */}
      {tab === "News Impact" && (
        <NewsImpactSection newsImpact={a.news as any || (a.raw_ai_response as any)?.news_impact} />
      )}

      {/* ═══ TAB: Management ═══ */}
      {tab === "Management" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="vixor-card p-5">
            <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" /> Step-by-Step Management
            </h3>
            <div className="space-y-3">
              {management.map((m, i) => (
                <div key={i} className="flex gap-3 bg-card border border-border p-3.5 rounded-xl">
                  <div className={`size-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold ${i === 0 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className="text-sm font-medium leading-relaxed">{highlightSMC(m)}</div>
                </div>
              ))}
            </div>
          </div>

          {a.risk_reasons && a.risk_reasons.length > 0 && (
            <div className="vixor-card p-5 border-bearish/20">
              <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-bearish flex items-center gap-2">
                <ShieldCheck className="size-4 text-bearish" /> Risk Factors
              </h3>
              <ul className="space-y-2">
                {a.risk_reasons.map((r: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-bearish mt-0.5 shrink-0">•</span>
                    <span className="font-medium text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-wait/10 border border-neutral-wait/20">
            <AlertTriangle className="size-5 text-neutral-wait shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-1">Risk Disclaimer</strong>
              This analysis is generated by Vixor AI based on technical patterns and fundamental data. It is <strong>not financial advice</strong>. Always apply your own risk management and judgment before executing any trade.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ NEWS IMPACT ═══
interface NewsImpact {
  relevant_news: Array<{ headline: string; source: string; impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; explanation: string }>;
  overall_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  verdict: string;
}

function NewsImpactSection({ newsImpact }: { newsImpact: NewsImpact | null }) {
  if (!newsImpact) {
    return (
      <div className="vixor-card p-8 text-center space-y-2 animate-in fade-in duration-300">
        <Newspaper className="size-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No fundamental news analysis for this session.</p>
      </div>
    );
  }

  const { relevant_news = [], overall_sentiment = "NEUTRAL", verdict = "" } = newsImpact;
  const isBullish = overall_sentiment === "BULLISH";
  const isBearish = overall_sentiment === "BEARISH";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Sentiment Overview */}
      <div className="vixor-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Fundamental Sentiment
          </h3>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
            isBullish ? "bg-bullish/10 text-bullish border-bullish/30"
            : isBearish ? "bg-bearish/10 text-bearish border-bearish/30"
            : "bg-neutral-wait/10 text-neutral-wait border-neutral-wait/30"
          }`}>
            {overall_sentiment}
          </span>
        </div>

        <div className={`p-4 rounded-xl border-l-4 ${isBullish ? "border-l-bullish bg-bullish/5" : isBearish ? "border-l-bearish bg-bearish/5" : "border-l-neutral-wait bg-neutral-wait/5"}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">AI Confluence Verdict</span>
          <p className="text-sm font-medium leading-relaxed">{highlightSMC(verdict)}</p>
        </div>
      </div>

      {/* News Articles */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs ml-1 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Newspaper className="size-4 text-primary" /> Key News Drivers
        </h3>
        {relevant_news.map((n, i) => (
          <div key={i} className="vixor-card p-4 relative overflow-hidden space-y-3">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${n.impact === "POSITIVE" ? "bg-bullish" : n.impact === "NEGATIVE" ? "bg-bearish" : "bg-neutral-wait"}`} />
            <div className="flex items-start justify-between gap-3 pl-1">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{n.source}</span>
                <h4 className="font-bold text-sm text-foreground mt-1.5 leading-snug">{n.headline}</h4>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 uppercase ${n.impact === "POSITIVE" ? "bg-bullish/10 text-bullish" : n.impact === "NEGATIVE" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"}`}>
                {n.impact}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border text-xs text-muted-foreground leading-relaxed ml-1">
              <strong className="text-[9px] uppercase tracking-wider text-foreground block mb-1">Technical Impact</strong>
              {highlightSMC(n.explanation)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ HELPERS ═══
function BackHeader() {
  return (
    <div className="flex items-center justify-between pt-2 pb-1">
      <Link to="/" className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors">
        <ArrowLeft className="size-5" />
      </Link>
      <div className="flex gap-2">
        <button className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors">
          <Bookmark className="size-4 text-muted-foreground" />
        </button>
        <button className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors">
          <Share2 className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-4 h-[80vh] flex flex-col">
      <BackHeader />
      <div className="vixor-card p-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
          <div className="relative size-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center">
            <Loader2 className="size-8 text-primary-foreground animate-spin" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-lg font-bold tracking-tight">{label}</div>
        <div className="text-sm font-medium text-muted-foreground mt-2">Connecting to Vixor Intelligence…</div>
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
