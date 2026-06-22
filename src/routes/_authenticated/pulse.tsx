import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getPulseData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/pulse")({
  head: () => ({ meta: [{ title: "Pulse — Vixor" }] }),
  component: PulsePage,
});

const TABS = ["All", "Trades", "Signals"] as const;

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PulsePage() {
  const fetchPulseData = useStableServerFn(getPulseData);
  const [activeTab, setActiveTab] = useState<string>("All");

  const query = useQuery({
    queryKey: ["pulse-data"],
    queryFn: () => fetchPulseData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const feed = query.data?.feed ?? [];
  const stats = query.data?.stats ?? {
    tradesToday: 0,
    signalsToday: 0,
    mostActivePair: "—",
    totalTrades: 0,
    totalSignals: 0,
  };

  const filteredFeed = activeTab === "All"
    ? feed
    : feed.filter((item: any) => item.type === (activeTab === "Trades" ? "trade" : "signal"));

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🩺</span>
          <h1 className="text-lg font-bold">Market Pulse</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>LIVE FEED</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          Real-time activity feed — trades and signals as they happen
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Trades Today</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#3B82F6" }}>{stats.tradesToday}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Signals Today</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#F59E0B" }}>{stats.signalsToday}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Most Active</div>
              <div className="text-[11px] font-bold" style={{ color: "#22C55E" }}>{stats.mostActivePair}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total Activity</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#7B8BA8" }}>{stats.totalTrades + stats.totalSignals}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "4px",
                border: "none", cursor: "pointer",
                color: activeTab === t ? "#fff" : "#7B8BA8",
                background: activeTab === t ? "rgba(139,92,246,0.15)" : "transparent",
              }}>{t} ({activeTab === "All" ? feed.length : activeTab === "Trades" ? stats.totalTrades : stats.totalSignals})</button>
            ))}
          </div>

          {/* Pulse Feed */}
          <div className="px-4 py-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {filteredFeed.length > 0 ? (
              <div className="space-y-1">
                {filteredFeed.map((item: any) => (
                  <PulseRow key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                <span style={{ fontSize: "24px" }}>🩺</span>
                <p style={{ fontSize: "12px", color: "#7B8BA8" }}>
                  {feed.length === 0
                    ? "No market activity yet. Start trading or run analyses to see activity here."
                    : "No activity matches this filter."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const PulseRow = memo(function PulseRow({ item }: { item: any }) {
  const isTrade = item.type === "trade";

  // Trade styling
  const actionColor = isTrade
    ? item.action === "BOUGHT" ? "#22C55E" : "#EF4444"
    : item.action === "BUY" ? "#22C55E" : item.action === "SELL" ? "#EF4444" : "#F59E0B";

  const typeColor = isTrade ? "#3B82F6" : "#8B5CF6";
  const typeLabel = isTrade ? "TRADE" : "SIGNAL";

  return (
    <div
      className="flex items-center px-3 py-2 rounded-lg"
      style={{ background: "#161b2e", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      {/* Type indicator dot */}
      <div className="mr-2.5 flex flex-col items-center gap-1">
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: typeColor }} />
      </div>

      {/* Type label */}
      <div className="mr-2" style={{ width: "44px" }}>
        <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: `${typeColor}18`, color: typeColor }}>
          {typeLabel}
        </span>
      </div>

      {/* Action + Pair */}
      <div className="mr-2" style={{ width: "80px" }}>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold" style={{ color: actionColor }}>{item.action}</span>
        </div>
        <span className="text-[11px] font-bold">{item.pair}</span>
      </div>

      {/* Details */}
      <div className="flex-1 text-[10px]" style={{ color: "#7B8BA8" }}>
        {isTrade ? (
          <span className="font-mono">
            {item.price != null && `$${item.price.toFixed(2)}`}
            {item.quantity != null && item.price != null && " · "}
            {item.quantity != null && `${item.quantity} qty`}
            {item.pnl != null && (
              <span style={{ color: item.pnl >= 0 ? "#22C55E" : "#EF4444", marginLeft: 8, fontWeight: 700 }}>
                {item.pnl >= 0 ? "+" : ""}{item.pnl.toFixed(2)}
              </span>
            )}
          </span>
        ) : (
          <span>
            {item.confidence != null && (
              <span className="font-mono" style={{ color: "#F59E0B" }}>{item.confidence}%</span>
            )}
            {item.pattern && (
              <span className="ml-2 text-[9px]" style={{ color: "#4A5568" }}>{item.pattern}</span>
            )}
          </span>
        )}
      </div>

      {/* Time ago */}
      <div className="text-[10px]" style={{ color: "#4A5568", minWidth: "55px", textAlign: "right" }}>
        {formatTimeAgo(item.createdAt)}
      </div>
    </div>
  );
});