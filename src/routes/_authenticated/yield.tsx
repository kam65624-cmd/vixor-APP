import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getYieldData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/yield")({
  head: () => ({ meta: [{ title: "Yield — Vixor" }] }),
  component: YieldPage,
});

function YieldPage() {
  const fetchData = useStableServerFn(getYieldData);

  const query = useQuery({
    queryKey: ["yield-data"],
    queryFn: () => fetchData({}),
    staleTime: 30_000,
  });

  const d = query.data;
  const isLoading = query.isLoading;

  const stats = [
    { label: "Total Yield", value: `$${(d?.totalYield ?? 0).toFixed(2)}`, color: "#22C55E" },
    { label: "Avg Yield / Trade", value: `$${(d?.avgYield ?? 0).toFixed(2)}`, color: "#3B82F6" },
    { label: "Best Yield", value: d?.bestTrade ? `$${d.bestTrade.yield.toFixed(2)}` : "—", color: "#F59E0B", sub: d?.bestTrade?.pair },
    { label: "Yield Trades", value: `${d?.yieldCount ?? 0} / ${d?.totalClosed ?? 0}`, color: "#8B5CF6", sub: "profitable / total closed" },
  ];

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Yield Farming</h1>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>YIELD TRACKER</span>
      </div>
      <p style={{ fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" }}>
        Track yield generated from your profitable closed trades. Every winning trade counts as yield.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#22C55E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: s.color }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: "10px", color: "#4A5568", marginTop: "4px" }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Yield Positions */}
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Yield Positions
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#4A5568", marginLeft: "8px" }}>
              ({d?.positions?.length ?? 0} trades)
            </span>
          </div>

          {(d?.positions ?? []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ maxHeight: "480px", overflowY: "auto" }}>
              {d!.positions.map((pos) => (
                <YieldCard key={pos.id} pos={pos} />
              ))}
            </div>
          ) : (
            <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "48px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>🌱</div>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>No yield yet</div>
              <div style={{ fontSize: "12px", color: "#7B8BA8" }}>
                {d?.totalClosed === 0
                  ? "Close some trades with profit to start generating yield."
                  : "None of your closed trades were profitable yet. Keep refining your entries!"}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const YieldCard = memo(function YieldCard({ pos }: { pos: any }) {
  const dirLabel = pos.direction === "long" ? "LONG" : "SHORT";
  const dirColor = pos.direction === "long" ? "#22C55E" : "#EF4444";

  return (
    <div style={{ background: "#1a2035", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.1)", padding: "16px", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.1)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>{pos.pair}</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-2" style={{ background: `${dirColor}15`, color: dirColor }}>{dirLabel}</span>
        </div>
        <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: "monospace", color: "#22C55E" }}>
          +${pos.yield.toFixed(2)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Yield %</div>
          <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "monospace", color: "#22C55E" }}>
            +{pos.yieldPct.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Duration</div>
          <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "monospace", color: "#7B8BA8" }}>
            {pos.duration}d
          </div>
        </div>
        <div>
          <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Entry</div>
          <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#7B8BA8" }}>
            ${pos.entryPrice.toFixed(pos.entryPrice < 1 ? 6 : 2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Exit</div>
          <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#7B8BA8" }}>
            ${pos.exitPrice.toFixed(pos.exitPrice < 1 ? 6 : 2)}
          </div>
        </div>
        {pos.rMultiple != null && (
          <div>
            <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>R-Multiple</div>
            <div style={{ fontSize: "11px", fontFamily: "monospace", color: pos.rMultiple > 0 ? "#22C55E" : "#EF4444" }}>
              {pos.rMultiple > 0 ? "+" : ""}{pos.rMultiple.toFixed(1)}R
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: "9px", color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</div>
          <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#7B8BA8" }}>
            {pos.quantity}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: "10px", color: "#4A5568" }}>
        {new Date(pos.exitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
});