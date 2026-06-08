import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft, Share2, Bookmark, AlertTriangle, BookOpen, Layers, Target,
  Loader2, Maximize2, Zap, BrainCircuit, Activity, BarChart2, TrendingUp,
  Newspaper, ShieldCheck, TrendingDown, CheckCircle, ChevronRight, X,
  Eye, EyeOff, MessageSquare, RotateCcw, Compass, ChevronDown, Info,
  Shield, ShieldAlert, ShieldQuestion, Lightbulb, XCircle, ArrowUpRight,
  ArrowDownRight, Minus
} from "lucide-react";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAnalysis } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { SetupStrengthBadge, SetupStrengthBar, BiasIndicator, CollapsibleSection, EducationLayer, highlightSMCTerms, PriceCell, type SetupStrength } from "@/components/vixor/atoms";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Vixor — Trading Intelligence" }] }),
  component: AnalysisResult,
});

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface Thesis {
  why: string;
  confirms: string[];
  invalidates: string[];
}

interface EnhancedScenario {
  name: string;
  story: string;
  trigger: string;
  invalidation_trigger: string;
  probability: number;
  entry: string;
  sl: number;
  tp1: number;
  tp2: number;
  rr: string;
}

interface LegacyScenario {
  name: string;
  probability: number;
  entry: string;
  sl: number;
  tp1: number;
  tp2: number;
  rr: string;
}

interface NewsImpact {
  relevant_news: Array<{ headline: string; source: string; impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; explanation: string }>;
  overall_sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  verdict: string;
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function deriveSetupStrength(confidence: number | null): SetupStrength {
  if (confidence === null || confidence === undefined) return "MODERATE";
  if (confidence >= 70) return "STRONG";
  if (confidence >= 40) return "MODERATE";
  return "WEAK";
}

function deriveThesis(reasons: string[], invalidationLevel: number | null, trend: string | null): Thesis {
  return {
    why: reasons.length > 0
      ? `${reasons.slice(0, 2).join(". ")}. The market structure supports a ${trend?.toLowerCase() || "directional"} bias.`
      : "Setup identified based on technical analysis of price action and market structure.",
    confirms: reasons.slice(0, 3).map(r => r.replace(/\.$/, "")),
    invalidates: [
      ...(invalidationLevel ? [`Price breaks below ${invalidationLevel.toLocaleString()} invalidation level`] : []),
      "Conflicting fundamental catalyst or major news event",
      "Price action shows rejection at key structural level"
    ],
  };
}

function extractTermsFromAnalysis(a: any): string[] {
  const text = [
    ...(a.reasons || []),
    a.pattern || "",
    (a.raw_ai_response as any)?.vixor_message || "",
    JSON.stringify(a.market_structure || {}),
    JSON.stringify(a.liquidity_zones || {}),
  ].join(" ");
  
  const terms = [
    "Order Block", "Fair Value Gap", "FVG", "Liquidity", "BOS", "ChoCh", "CHOCH",
    "ICT", "SMC", "Sweep", "Mitigation", "Break of Structure", "Change of Character",
    "Imbalance", "Premium", "Discount", "OB", "NWOG", "NDOG", "BSL", "SSL",
    "Equal Highs", "Equal Lows"
  ];
  
  return terms.filter(t => text.toLowerCase().includes(t.toLowerCase()));
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

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
  const [imgZoom, setImgZoom] = useState(false);

  if (q.isLoading) return <LoadingState />;

  const a = q.data;
  if (!a) return <div className="vixor-card p-6 text-center font-medium">Analysis not found.</div>;

  if (a.status === "failed") {
    return (
      <div className="space-y-4">
        <BackHeader />
        <div className="terminal-card p-8 text-center border-bearish/30">
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

  if (a.status !== "complete") return <LoadingState />;

  // ═══ DERIVED DATA ═══
  const raw = a.raw_ai_response as any || {};
  const isBullish = a.recommendation === "BUY";
  const isBearish = a.recommendation === "SELL";
  
  // Setup Strength - from new field or derived from confidence
  const setupStrength: SetupStrength = raw.setup_strength || deriveSetupStrength(a.confidence);
  
  // Thesis - from new field or derived
  const thesis: Thesis = raw.thesis || deriveThesis(a.reasons || [], a.invalidation_level, a.trend);
  
  // Scenarios - detect format
  const hasNewScenarios = raw.scenarios?.primary !== undefined;
  const newScenarios: { primary: EnhancedScenario; alternative: EnhancedScenario; counter: EnhancedScenario } | null = hasNewScenarios ? raw.scenarios : null;
  const legacyScenarios: { conservative: LegacyScenario; balanced: LegacyScenario; aggressive: LegacyScenario } | null = !hasNewScenarios ? a.scenarios as any : null;
  
  // Signal data - read from raw_ai_response (where it's actually stored)
  const signal = raw.signal_badge as { direction: "BUY" | "SELL" | "WAIT"; entry: string; stop_loss: string; take_profit: string; rr: string } | null;
  const management = (a.management ?? []) as string[];
  const newsImpact = (a.news || raw.news_impact) as NewsImpact | null;
  
  // Education terms
  const smcTerms = useMemo(() => extractTermsFromAnalysis(a), [a]);

  return (
    <div className="space-y-4 pb-8">
      <BackHeader />

      {/* ═══════════════════════════════════════
          SECTION 1: ASSET INTELLIGENCE HEADER
          Professional, no glow, Bloomberg style
      ═══════════════════════════════════════ */}
      <div className="terminal-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-card-hover px-2 py-0.5 rounded border border-border">
                {a.timeframe ?? "AUTO"}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">{relTime(a.created_at)}</span>
            </div>
            <h1 className="text-3xl font-extrabold font-mono tracking-tight leading-none mb-1">{a.pair ?? "?"}</h1>
            <p className="text-xs font-medium text-muted-foreground">{a.pattern ?? "Pattern Analysis"}</p>
          </div>
          <BiasIndicator direction={(a.trend || (isBullish ? "BULLISH" : isBearish ? "BEARISH" : "NEUTRAL")) as "BULLISH" | "BEARISH" | "NEUTRAL"} />
        </div>
        
        {/* Setup Strength */}
        <div className="space-y-2">
          <SetupStrengthBadge strength={setupStrength} size="md" />
          <SetupStrengthBar strength={setupStrength} />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2: SIGNAL SUMMARY GRID
          Clean Bloomberg data grid
      ═══════════════════════════════════════ */}
      {signal && (
        <div className="terminal-card overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="flex flex-col items-center gap-1 p-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Entry</span>
              <span className="text-mono text-base font-bold text-foreground">{signal.entry}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-bearish">Stop Loss</span>
              <span className="text-mono text-base font-bold text-bearish">{signal.stop_loss}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-bullish">Target</span>
              <span className="text-mono text-base font-bold text-bullish">{signal.take_profit}</span>
            </div>
          </div>
          <div className="border-t border-border p-2.5 flex items-center justify-center">
            <span className={cn(
              "text-mono text-sm font-bold px-3 py-1 rounded-md border",
              isBullish ? "text-bullish bg-bullish/8 border-bullish/20"
              : isBearish ? "text-bearish bg-bearish/8 border-bearish/20"
              : "text-neutral-wait bg-neutral-wait/8 border-neutral-wait/20"
            )}>
              R:R {signal.rr}
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          SECTION 3: CHART IMAGE
      ═══════════════════════════════════════ */}
      {a.imageUrl && (
        <div className="terminal-card overflow-hidden relative group cursor-pointer" onClick={() => setImgZoom(!imgZoom)}>
          <img src={a.imageUrl} alt="Analyzed chart" className="w-full max-h-48 object-contain bg-black" />
          <div className="absolute bottom-2 right-2 size-7 rounded-md bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="size-3.5" />
          </div>
        </div>
      )}

      {imgZoom && a.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4" onClick={() => setImgZoom(false)}>
          <button className="absolute top-4 right-4 size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <X className="size-5" />
          </button>
          <img src={a.imageUrl} alt="Chart" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}

      {/* ═══════════════════════════════════════
          SECTION 4: TRADE THESIS
          The premium feature - WHY, CONFIRMS, INVALIDATES
      ═══════════════════════════════════════ */}
      <div className="terminal-card-accent p-5">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="size-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Trade Thesis</span>
        </div>
        
        {/* Why this setup exists */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Why This Setup Exists</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            {highlightSMCTerms(thesis.why)}
          </p>
        </div>

        {/* Confirmation triggers */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <CheckCircle className="size-3.5 text-bullish" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-bullish">Confirmation Triggers</span>
          </div>
          <ul className="space-y-2">
            {thesis.confirms.map((c, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="size-1.5 rounded-full bg-bullish mt-2 shrink-0" />
                <span className="font-medium text-foreground/85">{highlightSMCTerms(c)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Invalidation triggers */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <XCircle className="size-3.5 text-bearish" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-bearish">Invalidation Triggers</span>
          </div>
          <ul className="space-y-2">
            {thesis.invalidates.map((inv, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="size-1.5 rounded-full bg-bearish mt-2 shrink-0" />
                <span className="font-medium text-foreground/85">{highlightSMCTerms(inv)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Invalidation Level - Critical */}
        {a.invalidation_level && (
          <div className="mt-4 p-3 rounded-lg bg-bearish/5 border border-bearish/15">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-bearish">Critical Invalidation</span>
              <span className="text-mono text-sm font-bold text-bearish">{a.invalidation_level.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          SECTION 5: SCENARIO ENGINE
          The premium differentiator
      ═══════════════════════════════════════ */}
      <div className="terminal-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="size-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Scenario Engine</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">Three market paths — think in probabilities, not predictions</p>

        {newScenarios ? (
          <div className="space-y-3">
            <ScenarioCardV2
              scenario={newScenarios.primary}
              type="primary"
              label="Primary"
              isBullish={isBullish}
            />
            <ScenarioCardV2
              scenario={newScenarios.alternative}
              type="alternative"
              label="Alternative"
              isBullish={isBullish}
            />
            <ScenarioCardV2
              scenario={newScenarios.counter}
              type="counter"
              label="Counter"
              isBullish={isBullish}
            />
          </div>
        ) : legacyScenarios ? (
          <div className="space-y-3">
            <LegacyScenarioCard scenario={legacyScenarios.conservative} label="Conservative" color="text-info" borderColor="border-l-info/60" />
            <LegacyScenarioCard scenario={legacyScenarios.balanced} label="Balanced" color="text-primary" borderColor="border-l-primary/80" />
            <LegacyScenarioCard scenario={legacyScenarios.aggressive} label="Aggressive" color="text-neutral-wait" borderColor="border-l-neutral-wait/60" />
          </div>
        ) : null}
      </div>

      {/* ═══════════════════════════════════════
          SECTION 6: VIXOR VERDICT
      ═══════════════════════════════════════ */}
      {raw.vixor_message && (
        <div className={cn(
          "terminal-card p-4 border-l-3",
          isBullish ? "border-l-bullish" : isBearish ? "border-l-bearish" : "border-l-neutral-wait"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className={cn("size-4 shrink-0", isBullish ? "text-bullish" : isBearish ? "text-bearish" : "text-neutral-wait")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vixor Intelligence</span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            {highlightSMCTerms(raw.vixor_message)}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════
          SECTION 7: COLLAPSIBLE SECTIONS
          Market Context / News / Management
      ═══════════════════════════════════════ */}
      
      {/* Market Context */}
      <CollapsibleSection title="Market Context" icon={TrendingUp} defaultOpen={false}>
        {a.key_levels && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Key SMC Levels</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-bearish uppercase tracking-wider">Resistance / BSL</span>
                {((a.key_levels as any).resistance || []).map((l: number, i: number) => (
                  <div key={i} className="bg-bearish/5 border border-bearish/15 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bearish/90">{l.toLocaleString()}</div>
                ))}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-bullish uppercase tracking-wider">Support / SSL</span>
                {((a.key_levels as any).support || []).map((l: number, i: number) => (
                  <div key={i} className="bg-bullish/5 border border-bullish/15 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bullish/90">{l.toLocaleString()}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {a.liquidity_zones && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Liquidity Pools</h4>
            <div className="space-y-2">
              {((a.liquidity_zones as any).buySide || []).map((l: number, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bullish/5 border border-bullish/15">
                  <span className="text-[11px] font-bold text-bullish uppercase">Buy-Side Liquidity</span>
                  <span className="font-mono font-bold text-bullish text-sm">{l.toLocaleString()}</span>
                </div>
              ))}
              {((a.liquidity_zones as any).sellSide || []).map((l: number, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bearish/5 border border-bearish/15">
                  <span className="text-[11px] font-bold text-bearish uppercase">Sell-Side Liquidity</span>
                  <span className="font-mono font-bold text-bearish text-sm">{l.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(a as any).market_structure && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Market Structure</h4>
            <div className="space-y-2">
              {[
                { label: "Direction", value: ((a as any).market_structure as any).direction },
                { label: "Structure", value: ((a as any).market_structure as any).structure },
                ...(a.invalidation_level ? [{ label: "Invalidation", value: a.invalidation_level.toLocaleString(), danger: true }] : []),
                ...(((a as any).market_structure as any).bos ? [{ label: "BOS Level", value: ((a as any).market_structure as any).bos?.toLocaleString(), danger: false }] : []),
              ].map(({ label, value, danger }) => (
                <div key={label} className={cn(
                  "flex justify-between items-center p-3 rounded-lg border",
                  danger ? "bg-bearish/5 border-bearish/15" : "bg-card border-border"
                )}>
                  <span className={cn("text-[11px] font-bold uppercase", danger ? "text-bearish" : "text-muted-foreground")}>{label}</span>
                  <span className={cn("font-mono font-bold text-sm", danger ? "text-bearish" : "")}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* News Confluence */}
      <CollapsibleSection 
        title="News Confluence" 
        icon={Newspaper} 
        defaultOpen={false}
        badge={newsImpact ? (
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ml-1",
            newsImpact.overall_sentiment === "BULLISH" ? "bg-bullish/10 text-bullish border-bullish/25"
            : newsImpact.overall_sentiment === "BEARISH" ? "bg-bearish/10 text-bearish border-bearish/25"
            : "bg-neutral-wait/10 text-neutral-wait border-neutral-wait/25"
          )}>
            {newsImpact.overall_sentiment}
          </span>
        ) : undefined}
      >
        {newsImpact ? (
          <>
            <div className={cn(
              "p-3 rounded-lg border-l-3",
              newsImpact.overall_sentiment === "BULLISH" ? "border-l-bullish bg-bullish/3"
              : newsImpact.overall_sentiment === "BEARISH" ? "border-l-bearish bg-bearish/3"
              : "border-l-neutral-wait bg-neutral-wait/3"
            )}>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Tech + Fundies Verdict</span>
              <p className="text-sm font-medium leading-relaxed">{highlightSMCTerms(newsImpact.verdict)}</p>
            </div>
            
            <div className="space-y-3 mt-3">
              {(newsImpact.relevant_news || []).map((n, i) => (
                <div key={i} className="terminal-card p-3.5 relative overflow-hidden space-y-2">
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    n.impact === "POSITIVE" ? "bg-bullish" : n.impact === "NEGATIVE" ? "bg-bearish" : "bg-neutral-wait"
                  )} />
                  <div className="flex items-start justify-between gap-2 pl-1">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{n.source}</span>
                      <h4 className="font-bold text-sm text-foreground mt-1 leading-snug">{n.headline}</h4>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded shrink-0 uppercase",
                      n.impact === "POSITIVE" ? "bg-bullish/10 text-bullish" : n.impact === "NEGATIVE" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"
                    )}>
                      {n.impact}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md bg-card/60 border border-border text-xs text-muted-foreground leading-relaxed ml-1">
                    {highlightSMCTerms(n.explanation)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Newspaper className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No fundamental news analysis available.</p>
          </div>
        )}
      </CollapsibleSection>

      {/* Risk & Management */}
      <CollapsibleSection title="Risk & Management" icon={ShieldCheck} defaultOpen={false}
        badge={a.risk_level ? (
          <span className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ml-1",
            a.risk_level === "LOW" ? "bg-bullish/10 text-bullish border-bullish/25"
            : a.risk_level === "HIGH" ? "bg-bearish/10 text-bearish border-bearish/25"
            : "bg-neutral-wait/10 text-neutral-wait border-neutral-wait/25"
          )}>
            {a.risk_level} RISK
          </span>
        ) : undefined}
      >
        {/* Risk Factors */}
        {a.risk_reasons && a.risk_reasons.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-bearish mb-2.5">Risk Factors</h4>
            <ul className="space-y-2">
              {(a.risk_reasons as string[]).map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="text-bearish mt-0.5 shrink-0">•</span>
                  <span className="font-medium text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step-by-step Management */}
        <div className="mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Step-by-Step Management</h4>
          <div className="space-y-2.5">
            {management.map((m, i) => (
              <div key={i} className="flex gap-3 bg-card border border-border p-3 rounded-lg">
                <div className={cn(
                  "size-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold",
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {i + 1}
                </div>
                <div className="text-sm font-medium leading-relaxed">{highlightSMCTerms(m)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-wait/5 border border-neutral-wait/15">
          <AlertTriangle className="size-4 text-neutral-wait shrink-0 mt-0.5" />
          <div className="text-[11px] font-medium text-muted-foreground leading-relaxed">
            <strong className="text-foreground block mb-0.5">Risk Disclaimer</strong>
            This analysis is generated by Vixor AI based on technical patterns and fundamental data. It is <strong>not financial advice</strong>. Always apply your own risk management.
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══════════════════════════════════════
          SECTION 8: EDUCATION LAYER
      ═══════════════════════════════════════ */}
      <EducationLayer terms={smcTerms} />

      {/* ═══════════════════════════════════════
          SECTION 9: ACTION BAR
          Professional, thumb-friendly
      ═══════════════════════════════════════ */}
      <div className="space-y-3 pt-2">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/trade-desk" className="h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
            <Zap className="size-4" /> Open Trade
          </Link>
          <Link to="/journal" className="h-12 rounded-xl terminal-card font-bold text-sm flex items-center justify-center gap-2 hover:bg-card-hover active:scale-[0.97] transition-all">
            <BookOpen className="size-4 text-muted-foreground" /> Add to Journal
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button className="h-10 rounded-lg terminal-card text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 hover:bg-card-hover active:scale-[0.97] transition-all">
            <Bookmark className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Save</span>
          </button>
          <Link to="/discover" className="h-10 rounded-lg terminal-card text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 hover:bg-card-hover active:scale-[0.97] transition-all">
            <Compass className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Watchlist</span>
          </Link>
          <button className="h-10 rounded-lg terminal-card text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 hover:bg-card-hover active:scale-[0.97] transition-all">
            <MessageSquare className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Copilot</span>
          </button>
        </div>

        {/* Re-analyze */}
        <Link to="/analyze" className="w-full h-10 rounded-lg border border-dashed border-border text-[11px] font-semibold flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-[0.97]">
          <RotateCcw className="size-3.5" /> Analyze Another Chart
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SCENARIO CARD V2 (Premium - with story, trigger, invalidation)
// ═══════════════════════════════════════════════

function ScenarioCardV2({ 
  scenario, type, label, isBullish 
}: { 
  scenario: EnhancedScenario; 
  type: "primary" | "alternative" | "counter"; 
  label: string; 
  isBullish: boolean;
}) {
  const [expanded, setExpanded] = useState(type === "primary");
  
  const styleMap = {
    primary: {
      container: "scenario-primary",
      labelColor: "text-primary",
      probBg: "bg-primary/10 text-primary border-primary/25",
      icon: Target,
    },
    alternative: {
      container: "scenario-alternative",
      labelColor: "text-info",
      probBg: "bg-info/10 text-info border-info/25",
      icon: Layers,
    },
    counter: {
      container: "scenario-counter",
      labelColor: "text-bearish",
      probBg: "bg-bearish/10 text-bearish border-bearish/25",
      icon: AlertTriangle,
    },
  };

  const style = styleMap[type];
  const Icon = style.icon;

  return (
    <div className={cn("rounded-lg border border-border p-4", style.container)}>
      {/* Header - Always visible */}
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", style.labelColor)} />
          <span className={cn("text-xs font-bold uppercase tracking-wider", style.labelColor)}>{label}</span>
          <span className="text-xs font-bold text-foreground/70">{scenario.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", style.probBg)}>
            {scenario.probability}%
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Story */}
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">What could happen</span>
            <p className="text-sm font-medium text-foreground/85 leading-relaxed">{highlightSMCTerms(scenario.story)}</p>
          </div>

          {/* Trigger + Invalidation */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-bullish/5 border border-bullish/10">
              <CheckCircle className="size-3.5 text-bullish shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-bullish block mb-0.5">Trigger</span>
                <span className="text-xs font-medium text-foreground/80">{highlightSMCTerms(scenario.trigger)}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-bearish/5 border border-bearish/10">
              <XCircle className="size-3.5 text-bearish shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-bearish block mb-0.5">Invalidation</span>
                <span className="text-xs font-medium text-foreground/80">{highlightSMCTerms(scenario.invalidation_trigger)}</span>
              </div>
            </div>
          </div>

          {/* Price Levels */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-card p-2 rounded-md border border-border text-center">
              <div className="text-[8px] text-muted-foreground font-bold uppercase mb-0.5">Entry</div>
              <div className="font-mono text-xs font-bold">{scenario.entry}</div>
            </div>
            <div className="bg-bearish/5 p-2 rounded-md border border-bearish/15 text-center">
              <div className="text-[8px] text-bearish font-bold uppercase mb-0.5">SL</div>
              <div className="font-mono text-xs font-bold text-bearish">{scenario.sl?.toLocaleString()}</div>
            </div>
            <div className="bg-bullish/5 p-2 rounded-md border border-bullish/15 text-center">
              <div className="text-[8px] text-bullish font-bold uppercase mb-0.5">TP1</div>
              <div className="font-mono text-xs font-bold text-bullish">{scenario.tp1?.toLocaleString()}</div>
            </div>
            <div className="bg-bullish/5 p-2 rounded-md border border-bullish/15 text-center">
              <div className="text-[8px] text-bullish font-bold uppercase mb-0.5">TP2</div>
              <div className="font-mono text-xs font-bold text-bullish">{scenario.tp2?.toLocaleString()}</div>
            </div>
          </div>

          {/* RR Badge */}
          <div className="flex items-center justify-between">
            <span className="text-mono text-sm font-bold bg-card px-2.5 py-1 rounded-md border border-border">R:R {scenario.rr}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// LEGACY SCENARIO CARD (backward compatibility)
// ═══════════════════════════════════════════════

function LegacyScenarioCard({ scenario, label, color, borderColor }: { scenario: LegacyScenario; label: string; color: string; borderColor: string }) {
  return (
    <div className={cn("terminal-card p-4 border-l-3", borderColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold uppercase tracking-wider", color)}>{label}</span>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">PROB: {scenario.probability}%</span>
        </div>
        <span className="font-mono text-sm font-extrabold bg-card px-2 py-0.5 rounded border border-border">R:R {scenario.rr}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card p-2.5 rounded-lg border border-border">
          <div className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Entry</div>
          <div className="font-mono text-sm font-bold">{scenario.entry}</div>
        </div>
        <div className="bg-bearish/5 p-2.5 rounded-lg border border-bearish/15">
          <div className="text-[9px] text-bearish font-bold uppercase mb-1">SL</div>
          <div className="font-mono text-sm font-bold text-bearish">{scenario.sl?.toLocaleString()}</div>
        </div>
        <div className="bg-bullish/5 p-2.5 rounded-lg border border-bullish/15">
          <div className="text-[9px] text-bullish font-bold uppercase mb-1">TP</div>
          <div className="font-mono text-sm font-bold text-bullish">{scenario.tp2?.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// BACK HEADER
// ═══════════════════════════════════════════════

function BackHeader() {
  return (
    <div className="flex items-center justify-between pt-2 pb-1">
      <Link to="/" className="size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors">
        <ArrowLeft className="size-5" />
      </Link>
      <div className="flex gap-2">
        <button className="size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors">
          <Bookmark className="size-4 text-muted-foreground" />
        </button>
        <button className="size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors">
          <Share2 className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="space-y-4 h-[80vh] flex flex-col">
      <BackHeader />
      <div className="terminal-card p-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-primary/15 animate-ping" />
          <div className="relative size-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Loader2 className="size-8 text-primary animate-spin" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-lg font-bold tracking-tight">Generating Intelligence Report...</div>
        <div className="text-sm font-medium text-muted-foreground mt-2">Vixor is analyzing market structure and scenarios</div>
        <div className="w-48 h-1 bg-muted rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
