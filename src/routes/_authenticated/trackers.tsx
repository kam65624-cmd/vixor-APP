import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getWatchlistData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  THEME,
  TableHeader,
  DataRow,
  Badge,
  EmptyState,
  ScrollArea,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/trackers")({
  head: () => ({ meta: [{ title: "Trackers — Vixor" }] }),
  component: TrackersPage,
});

const TABS = ["Watchlist", "Price Alerts"] as const;

function TrackersPage() {
  const fetchData = useStableServerFn(getWatchlistData);
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);

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
    <PageLayout
      title="Trackers"
      badge="TRACKER"
      badgeColor={THEME.amber}
      description={`${items.length} watchlist items · ${alerts.length} price alerts`}
      tabs={[...TABS]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabCounts={{
        Watchlist: items.length,
        "Price Alerts": alerts.length,
      }}
      loading={isLoading}
      loadingColor={THEME.amber}
    >
      {activeTab === "Watchlist" ? (
        <ScrollArea>
          {watchlists.length > 0 ? (
            watchlists.map((wl: any) => {
              const wlItems = (items as any[]).filter((item: any) => item.watchlist_id === wl.id);
              return (
                <div key={wl.id}>
                  {/* ── Watchlist Section Header ── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px 6px",
                      borderBottom: `1px solid ${THEME.border}`,
                      background: THEME.tabBarBg,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: THEME.text,
                      }}
                    >
                      {wl.name}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 500,
                        color: THEME.textMuted,
                      }}
                    >
                      ({wlItems.length})
                    </span>
                    {wl.is_default && <Badge label="DEFAULT" color={THEME.accent} small />}
                  </div>

                  {/* ── Table Header ── */}
                  <TableHeader
                    columns={[
                      { label: "Symbol", width: "30%" },
                      {
                        label: "Entry Price",
                        width: "25%",
                        align: "right",
                      },
                      { label: "Target", width: "25%", align: "right" },
                      { label: "Added", width: "20%", align: "right" },
                    ]}
                  />

                  {/* ── Rows ── */}
                  {wlItems.length > 0 ? (
                    wlItems.map((item: any) => <WatchlistItemRow key={item.id} item={item} />)
                  ) : (
                    <div
                      style={{
                        padding: "20px 16px",
                        textAlign: "center",
                        fontSize: "11px",
                        color: THEME.textMuted,
                        background: THEME.surface,
                      }}
                    >
                      Empty watchlist
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon="📌"
              title="No watchlists yet"
              message="No watchlists yet. Create one from the Discover page."
            />
          )}
        </ScrollArea>
      ) : (
        <ScrollArea>
          {alerts.length > 0 ? (
            <>
              <TableHeader
                columns={[
                  { label: "Symbol", width: "25%" },
                  { label: "Condition", width: "20%" },
                  { label: "Target", width: "20%", align: "right" },
                  { label: "Status", width: "15%", align: "right" },
                  { label: "Created", width: "20%", align: "right" },
                ]}
              />
              {(alerts as any[]).map((alert: any) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </>
          ) : (
            <EmptyState
              icon="🔔"
              title="No price alerts"
              message="No price alerts set. Add alerts from token pages."
            />
          )}
        </ScrollArea>
      )}
    </PageLayout>
  );
}

/* ── Watchlist Item Row ─────────────────────────────────────────────────── */

const WatchlistItemRow = memo(function WatchlistItemRow({ item }: { item: any }) {
  return (
    <DataRow>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "30%",
            fontWeight: 700,
            fontSize: "11px",
            color: THEME.text,
          }}
        >
          {item.symbol || "—"}
        </div>
        <div
          style={{
            width: "25%",
            textAlign: "right",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color: THEME.textSecondary,
            fontSize: "11px",
          }}
        >
          {item.entry_price ?? "—"}
        </div>
        <div
          style={{
            width: "25%",
            textAlign: "right",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            color: THEME.green,
            fontSize: "11px",
          }}
        >
          {item.target_price ?? "—"}
        </div>
        <div
          style={{
            width: "20%",
            textAlign: "right",
            color: THEME.textMuted,
            fontSize: "10px",
          }}
        >
          {new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </DataRow>
  );
});

/* ── Alert Row ──────────────────────────────────────────────────────────── */

const AlertRow = memo(function AlertRow({ alert }: { alert: any }) {
  const statusColor =
    alert.status === "active"
      ? THEME.green
      : alert.status === "triggered"
        ? THEME.amber
        : THEME.textMuted;
  const condColor =
    alert.condition === "above" || alert.condition === "crosses_up" ? THEME.green : THEME.red;

  return (
    <DataRow>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "25%",
            fontWeight: 700,
            fontSize: "11px",
            color: THEME.text,
          }}
        >
          {alert.symbol}
        </div>
        <div style={{ width: "20%" }}>
          <Badge label={alert.condition} color={condColor} small />
        </div>
        <div
          style={{
            width: "20%",
            textAlign: "right",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "11px",
            color: THEME.text,
          }}
        >
          ${alert.target_price}
        </div>
        <div
          style={{
            width: "15%",
            textAlign: "right",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Badge label={alert.status} color={statusColor} small />
        </div>
        <div
          style={{
            width: "20%",
            textAlign: "right",
            color: THEME.textMuted,
            fontSize: "10px",
          }}
        >
          {new Date(alert.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </DataRow>
  );
});
