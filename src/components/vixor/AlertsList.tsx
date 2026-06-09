"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlerts, deleteAlert } from "@/lib/vixor.functions";
import { Bell, X, Clock, TrendingUp, TrendingDown, ArrowUpDown, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { SectionTitle } from "./atoms";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { EditAlertDialog } from "./EditAlertDialog";

interface AlertsListProps {
  pair?: string;
  onRefresh?: () => void;
}

const conditionIcons: Record<string, typeof TrendingUp> = {
  above: TrendingUp,
  below: TrendingDown,
  crosses_up: ArrowUpDown,
  crosses_down: ArrowUpDown,
};

const conditionLabels: Record<string, string> = {
  above: "Above",
  below: "Below",
  crosses_up: "Crosses Up",
  crosses_down: "Crosses Down",
};

export function AlertsList({ pair, onRefresh }: AlertsListProps) {
  const queryClient = useQueryClient();
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const listAlertsFn = useStableServerFn(listAlerts);
  const deleteAlertFn = useStableServerFn(deleteAlert);

  const [editAlert, setEditAlert] = useState<{
    id: string;
    pair: string;
    condition: "above" | "below" | "crosses_up" | "crosses_down";
    target_price: number;
    timeframe: string;
    note: string | null;
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: alerts, isLoading } = useQuery(
    useMemo(
      () => ({
        queryKey: ["alerts", pair] as const,
        queryFn: () => listAlertsFn({ data: { pair, status: undefined } }),
        staleTime: 15_000,
      }),
      [listAlertsFn, pair],
    ),
  );

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlertFn({ data: { alertId } });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      onRefresh?.();
    } catch (err) {
      console.error("Failed to cancel alert:", err);
    }
  };

  const handleEdit = (alert: any) => {
    setEditAlert({
      id: alert.id,
      pair: alert.pair,
      condition: alert.condition,
      target_price: alert.target_price,
      timeframe: alert.timeframe,
      note: alert.note,
    });
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <div className="vixor-card p-4">
        <div className="text-sm text-muted-foreground text-center">Loading alerts...</div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="vixor-card p-6 text-center">
        <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
        <div className="text-sm text-muted-foreground">
          No active alerts{pair ? ` for ${pair}` : ""}
        </div>
        <div className="text-xs text-muted-foreground/60 mt-1">
          Set an alert to get notified when price hits your target
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a: any) => a.status === "active");
  const triggeredAlerts = alerts.filter((a: any) => a.status === "triggered").slice(0, 3);

  return (
    <div className="space-y-3">
      {activeAlerts.length > 0 && (
        <div>
          <SectionTitle title={`Active Alerts (${activeAlerts.length})`} />
          <div className="space-y-2">
            {activeAlerts.map((alert: any) => {
              const Icon = conditionIcons[alert.condition] || Bell;
              return (
                <div
                  key={alert.id}
                  className="vixor-card p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center ${
                        alert.condition === "above" || alert.condition === "crosses_up"
                          ? "bg-bullish/10"
                          : "bg-bearish/10"
                      }`}
                    >
                      <Icon
                        className={`size-4 ${
                          alert.condition === "above" || alert.condition === "crosses_up"
                            ? "text-bullish"
                            : "text-bearish"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-mono">{alert.pair}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            alert.condition === "above" || alert.condition === "crosses_up"
                              ? "bg-bullish/10 text-bullish"
                              : "bg-bearish/10 text-bearish"
                          }`}
                        >
                          {conditionLabels[alert.condition]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        $
                        {Number(alert.target_price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: alert.pair?.includes("JPY") ? 2 : 4,
                        })}
                        {alert.timeframe && <span className="ml-2">{alert.timeframe}</span>}
                      </div>
                      {alert.note && (
                        <div className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                          {alert.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(alert)}
                        className="size-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit alert"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="size-8 rounded-lg bg-muted flex items-center justify-center hover:bg-bearish/10 hover:text-bearish transition-colors"
                        title="Cancel alert"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {triggeredAlerts.length > 0 && (
        <div>
          <SectionTitle title="Recently Triggered" />
          <div className="space-y-2">
            {triggeredAlerts.map((alert: any) => (
              <div key={alert.id} className="vixor-card p-3.5 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bell className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm font-mono">{alert.pair}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary">
                        Triggered
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      $
                      {Number(alert.target_price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      <span className="ml-2">
                        <Clock className="size-3 inline -mt-0.5" />{" "}
                        {alert.triggered_at
                          ? new Date(alert.triggered_at).toLocaleTimeString()
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditAlertDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        alert={editAlert}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
