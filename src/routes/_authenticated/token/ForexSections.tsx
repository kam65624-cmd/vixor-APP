import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getEconomicCalendar } from "@/domains/market/functions";
import { ForexSessionIndicator } from "./ForexSessionIndicator";

export function ForexSections({ symbol }: { symbol: string }) {
  const pair = symbol.toUpperCase();

  // Fetch real economic events from server API
  const fetchCalendar = useStableServerFn(async () => {
    return getEconomicCalendar({ data: { days: 7 } });
  });

  const calendarQuery = useQuery({
    queryKey: ["forex-economic-calendar"],
    queryFn: fetchCalendar,
    staleTime: 300_000, // 5 min
  });

  const events = Array.isArray(calendarQuery.data)
    ? calendarQuery.data
        .filter((e: any) => e && e.event && e.impact)
        .slice(0, 8)
        .map((e: any) => ({
          time: e.time || "",
          currency: e.currency || "USD",
          event: e.event || "Unknown",
          impact: (e.impact || "medium").toLowerCase() as "high" | "medium" | "low",
          forecast: e.forecast || "—",
          previous: e.previous || "—",
        }))
    : [];

  // Simulated currency strength (0-100)
  const strengthData: Record<string, number> = {
    USD: 72,
    EUR: 65,
    GBP: 58,
    JPY: 45,
    AUD: 51,
    NZD: 48,
    CAD: 54,
    CHF: 61,
  };

  const impactStyle = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return {
          bg: "color-mix(in srgb, var(--color-bearish) 15%, transparent)",
          border: "var(--color-bearish)",
          color: "var(--color-bearish)",
        };
      case "medium":
        return {
          bg: "color-mix(in srgb, var(--color-gold) 0.15%, transparent)",
          border: "var(--color-gold)",
          color: "var(--color-gold)",
        };
      default:
        return {
          bg: "color-mix(in srgb, var(--color-bullish) 15%, transparent)",
          border: "var(--color-bullish)",
          color: "var(--color-bullish)",
        };
    }
  };

  // Extract base/quote from pair like "EUR/USD"
  const currencies = pair.split("/");
  const base = currencies[0] || "";
  const quote = currencies[1] || "";

  return (
    <>
      {/* Session Indicator */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          🌍 Market Sessions
        </div>
        <ForexSessionIndicator />
      </div>

      {/* Economic Calendar */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          📅 Economic Calendar{" "}
          {events.length === 0 && (
            <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(no data)</span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {events.map((evt, i) => {
            const imp = impactStyle(evt.impact);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--color-background)",
                  border: `1px solid var(--color-border)`,
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-foreground)",
                    width: "40px",
                    flexShrink: 0,
                  }}
                >
                  {evt.time}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    width: "28px",
                    flexShrink: 0,
                  }}
                >
                  {evt.currency}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {evt.event}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-muted-foreground)",
                      marginTop: "1px",
                    }}
                  >
                    Fcst: {evt.forecast} · Prev: {evt.previous}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: imp.bg,
                    color: imp.color,
                    border: `1px solid ${imp.border}`,
                    flexShrink: 0,
                  }}
                >
                  {evt.impact}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currency Strength Meter */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid var(--color-border)`,
          background: "var(--color-card)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          💪 Currency Strength{" "}
          <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.6 }}>(simulated)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Object.entries(strengthData)
            .sort((a, b) => b[1] - a[1])
            .map(([cur, str]) => {
              const isRelevant = cur === base || cur === quote;
              return (
                <div
                  key={cur}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: isRelevant ? "6px 8px" : "4px 8px",
                    borderRadius: "6px",
                    background: isRelevant
                      ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                      : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isRelevant ? "var(--color-primary)" : "var(--color-muted-foreground)",
                      width: "28px",
                      flexShrink: 0,
                    }}
                  >
                    {cur}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      borderRadius: "3px",
                      background: "var(--color-background)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${str}%`,
                        height: "100%",
                        borderRadius: "3px",
                        background:
                          str >= 65
                            ? "var(--color-bullish)"
                            : str >= 50
                              ? "var(--color-gold)"
                              : "var(--color-bearish)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                      width: "24px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {str}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
