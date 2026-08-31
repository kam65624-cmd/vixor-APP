import { PULL_THRESHOLD } from "@/shared/hooks/use-pull-to-refresh";
import { RefreshCw } from "lucide-react";

/**
 * Visual indicator shown above the content during a pull-to-refresh gesture.
 * Pair with `usePullToRefresh` hook.
 */
export function PullIndicator({
  distance,
  isRefreshing,
}: {
  distance: number;
  isRefreshing: boolean;
}) {
  if (distance === 0 && !isRefreshing) return null;

  const rotation = Math.min((distance / PULL_THRESHOLD) * 180, 180);
  const isThresholdMet = distance >= PULL_THRESHOLD;

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `1.5px solid ${isThresholdMet || isRefreshing ? "var(--color-bullish)" : "var(--color-muted-foreground)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(distance / 30, 1),
          transition: isRefreshing ? "none" : undefined,
        }}
      >
        <RefreshCw
          size={12}
          style={{
            color:
              isThresholdMet || isRefreshing
                ? "var(--color-bullish)"
                : "var(--color-muted-foreground)",
            transform: isRefreshing ? "rotate(360deg)" : `rotate(${rotation}deg)`,
            transition: isRefreshing ? "transform 0.6s ease" : "transform 0.1s ease",
            animation: isRefreshing ? "spin 0.7s linear infinite" : undefined,
          }}
        />
      </div>
    </div>
  );
}
