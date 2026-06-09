import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { RecBadge, ConfidenceBar, Stat } from "@/components/vixor/atoms";
import { ArrowLeft, Share2, Bookmark, Copy, RefreshCw, AlertTriangle, BookOpen, Layers, Target, Loader2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAnalysis } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Analysis — Vixor" }] }),
  component: AnalysisResult,
});

const TABS = ["Summary", "Scenarios", "Management"] as const;

interface Scenario { entry: number; target: number; rr: string }

function AnalysisResult() {
  const { id } = useParams({ from: "/_authenticated/analysis/$id" });
  const fetch = useServerFn(getAnalysis);
  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetch({ data: { id } }),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "complete" || s === "failed" ? false : 1200;
    },
  });
  const [tab, setTab] = useState<(typeof TABS)[number]>("Summary");

  if (q.isLoading) {
    return <Loading label="Loading analysis…" />;
  }
  const a = q.data;
  if (!a) return <div className="vixor-card p-6 text-center text-sm">Not found.</div>;

  if (a.status === "failed") {
    return (
      <div className="space-y-4">
        <BackHeader />
        <div className="vixor-card p-6 text-center">
          <AlertTriangle className="size-8 mx-auto text-bearish mb-2" />
          <div className="font-semibold">Analysis failed</div>
          <div className="text-xs text-muted-foreground mt-1">{a.error_message ?? "Unknown error"}</div>
          <Link to="/analyze" className="inline-flex mt-4 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold items-center">Try again</Link>
        </div>
      </div>
    );
  }

  if (a.status !== "complete") {
    return <Loading label="Vixor AI is analyzing your chart…" />;
  }

  const tps = (a.take_profit ?? []) as number[];
  const scenarios = a.scenarios as { conservative: Scenario; balanced: Scenario; aggressive: Scenario } | null;
  const management = (a.management ?? []) as string[];

  return (
    <div className="space-y-4">
      <BackHeader />

      <div className={`vixor-card p-5 relative overflow-hidden ${a.recommendation === "BUY" ? "gradient-bullish" : a.recommendation === "SELL" ? "gradient-bearish" : ""}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground">{a.timeframe ?? "—"} · {relTime(a.created_at)}</div>
            <h1 className="text-2xl font-bold text-mono">{a.pair ?? "—"}</h1>
          </div>
          {a.recommendation && <RecBadge rec={a.recommendation} size="lg" />}
        </div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span className="text-mono font-bold text-lg">{a.confidence ?? 0}%</span>
        </div>
        <ConfidenceBar value={a.confidence ?? 0} />
        {a.pattern && <p className="text-xs text-muted-foreground mt-2">{a.pattern}</p>}
      </div>

      {a.imageUrl && (
        <div className="vixor-card overflow-hidden">
          <img src={a.imageUrl} alt="Analyzed chart" className="w-full max-h-80 object-contain bg-card-hover" />
        </div>
      )}

      <div className="vixor-card p-4 grid grid-cols-3 gap-3">
        <Stat label="Entry" value={a.entry?.toLocaleString() ?? "—"} accent="info" />
        <Stat label="Stop loss" value={a.stop_loss?.toLocaleString() ?? "—"} accent="bearish" />
        <Stat label="R:R" value={a.rr ?? "—"} accent="bullish" />
      </div>

      {tps.length === 3 && (
        <div className="vixor-card p-4 grid grid-cols-3 gap-3">
          <Stat label="TP 1" value={tps[0].toLocaleString()} accent="bullish" />
          <Stat label="TP 2" value={tps[1].toLocaleString()} accent="bullish" />
          <Stat label="TP 3" value={tps[2].toLocaleString()} accent="bullish" />
        </div>
      )}

      <div className="flex gap-1 vixor-card p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "Summary" && (
        <div className="vixor-card p-4 space-y-3">
          <div className="flex items-center gap-2"><Target className="size-4 text-primary"/><h3 className="font-semibold text-sm">Reasons for trade</h3></div>
          <ul className="space-y-2">
            {(a.reasons ?? []).map((r: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary mt-0.5">✓</span><span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "Scenarios" && scenarios && (
        <div className="space-y-3">
          {([
            { label: "Conservative", s: scenarios.conservative },
            { label: "Balanced", s: scenarios.balanced },
            { label: "Aggressive", s: scenarios.aggressive },
          ]).map(({ label, s }) => (
            <div key={label} className="vixor-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase">{label}</span>
                <span className="text-mono text-xs text-muted-foreground">R:R {s.rr}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Entry" value={s.entry.toLocaleString()} accent="info" />
                <Stat label="Target" value={s.target.toLocaleString()} accent="bullish" />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Management" && (
        <div className="vixor-card p-4 space-y-3">
          <div className="flex items-center gap-2"><Layers className="size-4 text-primary"/><h3 className="font-semibold text-sm">How to manage</h3></div>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            {management.map((m, i) => <li key={i}>{m}</li>)}
          </ol>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-wait/10 border border-neutral-wait/30">
            <AlertTriangle className="size-4 text-neutral-wait shrink-0"/>
            <span className="text-xs text-muted-foreground">Risk no more than 1% of account per trade. This is AI guidance, not financial advice.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {[Copy, Share2, Bookmark, BookOpen].map((Icon, i) => (
          <button key={i} className="vixor-card vixor-card-hover p-3 flex flex-col items-center gap-1">
            <Icon className="size-4 text-muted-foreground"/>
            <span className="text-[10px] font-medium">{["Copy","Share","Save","Journal"][i]}</span>
          </button>
        ))}
      </div>

      <Link to="/analyze" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary">
        <RefreshCw className="size-4"/> New analysis
      </Link>
    </div>
  );
}

function BackHeader() {
  return (
    <div className="flex items-center justify-between">
      <Link to="/" className="size-9 rounded-xl bg-card border border-border flex items-center justify-center">
        <ArrowLeft className="size-4" />
      </Link>
      <div className="flex gap-2">
        <button className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"><Bookmark className="size-4" /></button>
        <button className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"><Share2 className="size-4" /></button>
      </div>
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <BackHeader />
      <div className="vixor-card p-10 text-center">
        <Loader2 className="size-8 mx-auto text-primary animate-spin mb-3" />
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">Usually 8-15 seconds</div>
      </div>
    </div>
  );
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
