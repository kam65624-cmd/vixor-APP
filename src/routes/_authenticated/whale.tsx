import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getWhaleData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/whale")({
  head: () => ({ meta: [{ title: "Whale Alerts — Vixor" }] }),
  component: WhalePage,
});

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatValue(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

function WhalePage() {
  const fetchWhaleData = useStableServerFn(getWhaleData);

  const query = useQuery({
    queryKey: ["whale-data"],
    queryFn: () => fetchWhaleData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const whaleTrades = query.data?.whaleTrades ?? [];
  const stats = query.data?.stats ?? {
    volume24h: 0,
    largeTradeCount: 0,
    biggestTrade: 0,
    biggestPair: "—",
  };

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🐋</span>
          <h1 className="text-lg font-bold">Whale Alerts</h1>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>WHALE TRACKER</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          Largest trades sorted by value — spot whale-like activity
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>24h Volume</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#3B82F6" }}>{formatValue(stats.volume24h)}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Large Trades</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#F59E0B" }}>{stats.largeTradeCount}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Biggest Trade</div>
              <div className="text-sm font-bold font-mono" style={{ color: "#22C55E" }}>{formatValue(stats.biggestTrade)}</div>
              <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{stats.biggestPair}</div>
            </div>
          </div>

          {/* Whale Trades List */}
          <div className="px-4 py-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {whaleTrades.length > 0 ? (
              <div className="space-y-2">
                {whaleTrades.map((trade: any, index: number) => (
                  <WhaleCard key={trade.id} trade={trade} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
                <span style={{ fontSize: "24px" }}>🐋</span>
                <p style={{ fontSize: "12px", color: "#7B8BA8" }}>No trades yet. Start trading to see whale activity.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const WhaleCard = memo(function WhaleCard({ trade, index }: { trade: any; index: number }) {
  const isLong = trade.direction === "long";
  const value = trade.tradeValue || (trade.quantity || 1) * (trade.entry_price || 0);
  const directionColor = isLong ? "#22C55E" : "#EF4444";
  const directionLabel = isLong ? "LONG" : "SHORT";

  // Size indicator based on rank
  const sizeIntensity = Math.max(0.08, 1 - index * 0.04);

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "#161b2e",
        border: `1px solid ${directionColor}${Math.round(sizeIntensity * 40).toString(16).padStart(2, "0")}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${directionColor}20`, color: directionColor }}
          >
            {directionLabel}
          </span>
          <span className="text-[13px] font-bold">{trade.pair || "—"}</span>
          {index === 0 && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
              🔥 BIGGEST
            </span>
          )}
        </div>
        <span className="text-[10px]" style={{ color: "#4A5568" }}>{formatTimeAgo(trade.created_at)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: "#7B8BA8" }}>
          <span>Size: <span style={{ color: "#F0F4FC" }}>{trade.quantity || "—"}</span></span>
          <span>Price: <span style={{ color: "#F0F4FC" }}>${trade.entry_price?.toFixed(2) || "—"}</span></span>
        </div>
        <span className="text-[12px] font-bold font-mono" style={{ color: directionColor }}>
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
});