import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Filter } from "lucide-react";
import { RecBadge } from "@/components/vixor/atoms";
import { useServerFn } from "@tanstack/react-start";
import { listAnalyses } from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Vixor" }] }),
  component: History,
});

function History() {
  const fn = useServerFn(listAnalyses);
  const q = useQuery({ queryKey: ["analyses", 50], queryFn: () => fn({ data: { limit: 50 } }) });
  const all = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-semibold">Analysis history</h1>
        <button className="size-9 rounded-xl bg-card border border-border flex items-center justify-center">
          <Filter className="size-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {["All", "BUY", "SELL", "WAIT"].map((f, i) => (
          <button
            key={f}
            className={`px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {q.isLoading && (
          <div className="vixor-card p-6 text-center text-xs text-muted-foreground">Loading…</div>
        )}
        {!q.isLoading && all.length === 0 && (
          <Link to="/analyze" className="vixor-card vixor-card-hover p-6 text-center block">
            <div className="text-sm font-semibold">No analyses yet</div>
            <div className="text-xs text-muted-foreground mt-1">
              Start your first chart analysis
            </div>
          </Link>
        )}
        {all.map((a) => (
          <Link
            key={a.id}
            to="/analysis/$id"
            params={{ id: a.id }}
            className="vixor-card vixor-card-hover p-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-mono">{a.pair ?? "Pending"}</span>
                {a.timeframe && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {a.timeframe}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{a.pattern ?? a.status}</div>
            </div>
            <div className="text-right space-y-1">
              {a.recommendation && <RecBadge rec={a.recommendation} />}
              <div className="text-[10px] text-muted-foreground text-mono">
                {a.confidence ?? 0}%
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
