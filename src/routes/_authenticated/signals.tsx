import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getDailySignals } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({ meta: [{ title: "Signals — Vixor" }] }),
  component: SignalsPage,
});

type Signal = {
  id: string; pair: string; timeframe: string; recommendation: "BUY" | "SELL" | "WAIT";
  confidence: number; entry: number | null; stop_loss: number | null;
  take_profit: number[] | null; reasons: string[] | null; pattern: string | null;
  signal_date: string; created_at: string;
};

const TABS = ["All", "BUY", "SELL", "WAIT"] as const;

function SignalsPage() {
  const fetchSignals = useStableServerFn(getDailySignals);
  const [activeTab, setActiveTab] = useState<string>("All");

  const query = useQuery({
    queryKey: ["daily-signals"],
    queryFn: () => fetchSignals({}),
    staleTime: 60_000,
  });

  const signals: Signal[] = query.data?.signals ?? [];
  const isLoading = query.isLoading;

  const filtered = activeTab === "All" ? signals : signals.filter((s) => s.recommendation === activeTab);

  const buyCount = signals.filter((s) => s.recommendation === "BUY").length;
  const sellCount = signals.filter((s) => s.recommendation === "SELL").length;
  const avgConfidence = signals.length > 0 ? Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length) : 0;

  const recColor = (rec: string) => rec === "BUY" ? "#22C55E" : rec === "SELL" ? "#EF4444" : "#F59E0B";

  return (
    <div style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">\uD83D\uDE80</span>
          <h1 className="text-lg font-bold">Signals</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}>AI-POWERED</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
          Daily technical analysis signals across all tracked pairs
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { label: "Total Signals", value: String(signals.length), color: "#10B981" },
              { label: "Buy Signals", value: String(buyCount), color: "#22C55E" },
              { label: "Sell Signals", value: String(sellCount), color: "#EF4444" },
              { label: "Avg Confidence", value: `${avgConfidence}%`, color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2 rounded-lg" style={{ background: "#1E1E1E" }}>
                <div className="text-[9px]" style={{ color: "#6B7280" }}>{s.label}</div>
                <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px",
                border: "none", cursor: "pointer",
                color: activeTab === t ? "#fff" : "#9CA3AF",
                background: activeTab === t ? "rgba(16,185,129,0.15)" : "transparent",
              }}>{t}</button>
            ))}
          </div>

          {/* Signals List */}
          <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {filtered.length > 0 ? filtered.map((sig) => (
              <SignalCard key={sig.id} signal={sig} recColor={recColor} />
            )) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                  {signals.length === 0 ? "No signals generated yet. Run analyses to populate signals." : "No signals match this filter."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const SignalCard = memo(function SignalCard({ signal, recColor }: { signal: Signal; recColor: (r: string) => string }) {
  const color = recColor(signal.recommendation);
  return (
    <div className="rounded-lg p-3" style={{ background: "#1E1E1E", border: `1px solid ${color}15` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
            background: `${color}20`, color,
          }}>{signal.recommendation}</span>
          <span className="text-[13px] font-bold">{signal.pair}</span>
          <span className="text-[9px]" style={{ color: "#6B7280" }}>{signal.timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          {signal.pattern && <span className="text-[9px]" style={{ color: "#9CA3AF" }}>{signal.pattern}</span>}
          <span className="text-[11px] font-bold font-mono" style={{ color: "#F59E0B" }}>{signal.confidence}%</span>
        </div>
      </div>
      {signal.reasons && signal.reasons.length > 0 && (
        <div className="text-[10px] mb-2" style={{ color: "#9CA3AF", lineHeight: 1.5 }}>
          {signal.reasons.join(" · ")}
        </div>
      )}
      <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: "#9CA3AF" }}>
        {signal.entry != null && <span>Entry: <span style={{ color: "#FFFFFF" }}>${signal.entry}</span></span>}
        {signal.stop_loss != null && <span>SL: <span style={{ color: "#EF4444" }}>${signal.stop_loss}</span></span>}
        {signal.take_profit && signal.take_profit.length > 0 && (
          <span>TP: <span style={{ color: "#22C55E" }}>{signal.take_profit.map((t) => `$${t}`).join(", ")}</span></span>
        )}
        <span className="ml-auto">{new Date(signal.signal_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
});