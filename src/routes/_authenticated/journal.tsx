import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, AlertTriangle, TrendingUp, TrendingDown, Target, Search, BarChart3, Filter, Clock } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAnalyses } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Vixor" }] }),
  component: Journal,
});

const TABS = ["journal.overview", "journal.history", "journal.reports"] as const;

function getMostAnalyzedPair(analyses: any[]): string {
  const counts: Record<string, number> = {};
  for (const a of analyses) {
    if (a.pair) counts[a.pair] = (counts[a.pair] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "—";
}

function Journal() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("journal.overview");

  const fetchAnalyses = useStableServerFn(listAnalyses);
  const analysesQuery = useQuery({ queryKey: ["analyses-journal"], queryFn: () => fetchAnalyses({ data: { limit: 50 } }) });

  const analyses = analysesQuery.data ?? [];
  const activeSignals = analyses.filter((a: any) => a.recommendation === "BUY" || a.recommendation === "SELL");
  const avgConfidence = analyses.length > 0
    ? Math.round(analyses.reduce((sum: number, a: any) => sum + (a.confidence ?? 0), 0) / analyses.length)
    : 0;

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <BookOpen className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">{t("journal.title")}</h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{t("journal.subtitle")}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        {TABS.map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`flex-1 h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${tab === tabKey ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t(tabKey)}
          </button>
        ))}
      </div>

      {tab === "journal.overview" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Top Stats — REAL data */}
          <div className="grid grid-cols-3 gap-2">
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("journal.trades")}</div>
              <div className="text-xl font-bold font-mono text-foreground">{analyses.length}</div>
            </div>
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("journal.winRate")}</div>
              <div className="text-xl font-bold font-mono text-bullish">
                {activeSignals.length > 0 ? Math.round((activeSignals.filter((a: any) => a.confidence && a.confidence >= 60).length / activeSignals.length) * 100) : 0}%
              </div>
            </div>
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Conf</div>
              <div className="text-xl font-bold font-mono text-primary">{avgConfidence}%</div>
            </div>
          </div>

          {/* AI Insight — based on real analyses */}
          <div className="vixor-card p-4 border border-primary/30 bg-primary/5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Insight</h3>
            </div>
            <div className="text-sm font-medium leading-relaxed">
              {analyses.length > 0 ? (
                <>
                  <strong className="text-foreground">{analyses.length} analyses completed.</strong>{" "}
                  Your most analyzed pair is {getMostAnalyzedPair(analyses)}. Keep documenting your trades for deeper AI insights and mistake detection.
                </>
              ) : (
                <>
                  <strong className="text-foreground">{t("journal.noTrades")}</strong>{" "}
                  {t("journal.noTradesDesc")}
                </>
              )}
            </div>
          </div>
          
          {/* Recent Analyses */}
          <div className="space-y-2 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">{t("journal.recentExecutions")}</h3>
            {analyses.length > 0 ? (
              analyses.slice(0, 5).map((a: any) => (
                <a key={a.id} href={`/analysis/${a.id}`} className="vixor-card p-3.5 flex items-center justify-between border-l-4 transition-colors hover:bg-card-hover cursor-pointer block"
                  style={{ borderLeftColor: a.recommendation === "BUY" ? 'var(--color-bullish)' : a.recommendation === "SELL" ? 'var(--color-bearish)' : 'var(--color-neutral-wait)' }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${a.recommendation === "BUY" ? "bg-bullish/10 text-bullish" : a.recommendation === "SELL" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"}`}>{a.recommendation ?? "WAIT"}</span>
                      <span className="font-bold font-mono text-sm">{a.pair ?? "?"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>{a.timeframe ?? "—"}</span>
                      <span>{a.pattern ?? ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-base">{a.confidence ?? 0}%</div>
                    <div className="text-[10px] font-mono font-bold text-muted-foreground">{relTime(a.created_at)}</div>
                  </div>
                </a>
              ))
            ) : (
              <div className="vixor-card p-6 text-center">
                <BookOpen className="size-6 text-muted-foreground/30 mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">{t("journal.noTrades")}</div>
                <a href="/analyze" className="text-xs text-primary font-bold mt-1 inline-block">Analyze your first chart</a>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "journal.history" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {analyses.length > 0 ? (
            analyses.map((a: any) => (
              <a key={a.id} href={`/analysis/${a.id}`} className="vixor-card p-3.5 flex items-center justify-between border-l-4 transition-colors hover:bg-card-hover cursor-pointer block"
                style={{ borderLeftColor: a.recommendation === "BUY" ? 'var(--color-bullish)' : a.recommendation === "SELL" ? 'var(--color-bearish)' : 'var(--color-neutral-wait)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${a.recommendation === "BUY" ? "bg-bullish/10 text-bullish" : a.recommendation === "SELL" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"}`}>{a.recommendation ?? "WAIT"}</span>
                    <span className="font-bold font-mono text-sm">{a.pair ?? "?"}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{a.timeframe ?? "—"} · {relTime(a.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold font-mono text-base ${a.recommendation === "BUY" ? "text-bullish" : a.recommendation === "SELL" ? "text-bearish" : "text-neutral-wait"}`}>{a.confidence ?? 0}%</div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground">{a.pattern ?? ""}</div>
                </div>
              </a>
            ))
          ) : (
            <div className="vixor-card p-6 text-center">
              <BookOpen className="size-6 text-muted-foreground/30 mx-auto mb-2" />
              <div className="text-xs text-muted-foreground">No trade history yet</div>
            </div>
          )}
        </div>
      )}

      {tab === "journal.reports" && (
        <div className="vixor-card p-8 text-center border-dashed">
          <BarChart3 className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">{t("journal.advancedAnalytics")}</h3>
          <p className="text-sm text-muted-foreground">{t("journal.unlockReports")}</p>
        </div>
      )}
    </div>
  );
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
