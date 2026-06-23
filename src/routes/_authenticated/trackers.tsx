import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getWatchlistData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/trackers")({
  head: () => ({ meta: [{ title: "Trackers — Vixor" }] }),
  component: TrackersPage,
});

const TABS = ["Watchlist", "Price Alerts"];

function TrackersPage() {
  const fetchData = useStableServerFn(getWatchlistData);
  const [activeTab, setActiveTab] = useState(0);

  const query = useQuery({
    queryKey: ["watchlist-data"],
    queryFn: () => fetchData({}),
    staleTime: 30_000,
  });

  const isLoading = query.isLoading;
  const watchlists = query.data?.watchlists ?? [];
  const items = query.data?.watchlistItems ?? [];
  const alerts = query.data?.priceAlerts ?? [];

  return (
    <div style={{ background: "#121212", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">\uD83D\uDCCA</span>
          <h1 className="text-lg font-bold">Trackers</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
          {items.length} watchlist items · {alerts.length} price alerts
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            fontSize: "11px", fontWeight: 700, padding: "6px 14px", borderRadius: "6px",
            border: "none", cursor: "pointer",
            color: activeTab === i ? "#fff" : "#9CA3AF",
            background: activeTab === i ? "#1e2438" : "transparent",
          }}>{t} ({activeTab === 0 ? items.length : alerts.length})</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : activeTab === 0 ? (
        /* Watchlist Tab */
        <div className="px-4 py-2">
          {watchlists.length > 0 && (
            <div className="text-[11px] font-bold mb-2" style={{ color: "#9CA3AF" }}>
              Watchlists ({watchlists.length})
            </div>
          )}
          {watchlists.map((wl) => (
            <div key={wl.id} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-bold">{wl.name}</span>
                {wl.is_default && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.12)", color: "#34D399" }}>DEFAULT</span>
                )}
              </div>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6B7280", background: "#1E1E1E", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: "30%" }}>Symbol</div>
                  <div style={{ width: "25%" }} className="text-right">Entry Price</div>
                  <div style={{ width: "25%" }} className="text-right">Target</div>
                  <div style={{ width: "20%" }} className="text-right">Added</div>
                </div>
                {items.filter((item) => item.watchlist_id === wl.id).map((item) => (
                  <WatchlistItemRow key={item.id} item={item} />
                ))}
                {items.filter((item) => item.watchlist_id === wl.id).length === 0 && (
                  <div className="px-3 py-4 text-center text-[11px]" style={{ color: "#6B7280", background: "#1E1E1E" }}>Empty watchlist</div>
                )}
              </div>
            </div>
          ))}
          {watchlists.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
              <span style={{ fontSize: "24px" }}>\uD83D\uDCCC</span>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>No watchlists yet. Create one from the Discover page.</p>
            </div>
          )}
        </div>
      ) : (
        /* Price Alerts Tab */
        <div className="px-4 py-2">
          {alerts.length > 0 ? (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6B7280", background: "#1E1E1E", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: "25%" }}>Symbol</div>
                <div style={{ width: "20%" }}>Condition</div>
                <div style={{ width: "20%" }} className="text-right">Target</div>
                <div style={{ width: "15%" }} className="text-right">Status</div>
                <div style={{ width: "20%" }} className="text-right">Created</div>
              </div>
              {alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
              <span style={{ fontSize: "24px" }}>\uD83D\uDD14</span>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>No price alerts set. Add alerts from token pages.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const WatchlistItemRow = memo(function WatchlistItemRow({ item }: { item: any }) {
  return (
    <div className="flex items-center px-3 py-2 text-[11px]" style={{ background: "#1E1E1E", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: "30%", fontWeight: 700 }}>{item.symbol || "—"}</div>
      <div style={{ width: "25%", textAlign: "right", fontFamily: "monospace", color: "#9CA3AF" }}>{item.entry_price ?? "—"}</div>
      <div style={{ width: "25%", textAlign: "right", fontFamily: "monospace", color: "#22C55E" }}>{item.target_price ?? "—"}</div>
      <div style={{ width: "20%", textAlign: "right", color: "#6B7280", fontSize: "10px" }}>
        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
});

const AlertRow = memo(function AlertRow({ alert }: { alert: any }) {
  const statusColor = alert.status === "active" ? "#22C55E" : alert.status === "triggered" ? "#F59E0B" : "#6B7280";
  const condColor = alert.condition === "above" || alert.condition === "crosses_up" ? "#22C55E" : "#EF4444";
  return (
    <div className="flex items-center px-3 py-2 text-[11px]" style={{ background: "#1E1E1E", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: "25%", fontWeight: 700 }}>{alert.symbol}</div>
      <div style={{ width: "20%" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${condColor}15`, color: condColor }}>{alert.condition}</span>
      </div>
      <div style={{ width: "20%", textAlign: "right", fontFamily: "monospace" }}>${alert.target_price}</div>
      <div style={{ width: "15%", textAlign: "right" }}>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${statusColor}15`, color: statusColor }}>{alert.status}</span>
      </div>
      <div style={{ width: "20%", textAlign: "right", color: "#6B7280", fontSize: "10px" }}>
        {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
    </div>
  );
});