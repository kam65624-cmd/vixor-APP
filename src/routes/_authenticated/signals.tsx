import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getDailySignals } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout, 
  StatsRow,
  SectionTitle,
  DataRow,
  Badge,
  EmptyState,
  SkeletonRow,
  ScrollArea,
} from "@/components/vixor/PageLayout";

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

  const recColor = (rec: string) =>
    rec === "BUY" ? "var(--color-bullish)" : rec === "SELL" ? "var(--color-bearish)" : "var(--color-neutral-wait)";

  return (
    <PageLayout
      title="Signals"
      badge="AI SIGNALS"
      badgeColor={"var(--color-neutral-wait)"}
      description="Daily technical analysis signals across all tracked pairs"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={isLoading}
    >
      <StatsRow
        stats={[
          { label: "Total Signals", value: String(signals.length), color: "var(--color-bullish)" },
          { label: "Buy Signals", value: String(buyCount), color: "var(--color-bullish)" },
          { label: "Sell Signals", value: String(sellCount), color: "var(--color-bearish)" },
          { label: "Avg Confidence", value: `${avgConfidence}%`, color: "var(--color-neutral-wait)" },
        ]}
      />

      <SectionTitle title="Active Signals" count={filtered.length} />

      <ScrollArea style={{ padding: "0" }}>
        {filtered.length > 0 ? (
          filtered.map((sig) => (
            <SignalRow key={sig.id} signal={sig} recColor={recColor} />
          ))
        ) : (
          <EmptyState
            icon="📡"
            title="No Signals"
            message={
              signals.length === 0
                ? "No signals generated yet. Run analyses to populate signals."
                : "No signals match this filter."
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const SignalRow = memo(function SignalRow({
  signal,
  recColor,
}: {
  signal: Signal;
  recColor: (r: string) => string;
}) {
  const color = recColor(signal.recommendation);

  return (
    <DataRow leftAccent={color}>
      {/* Top line — pair info, pattern, confidence */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: signal.reasons && signal.reasons.length > 0 ? "6px" : "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          <Badge label={signal.recommendation} color={color} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {signal.pair}
          </span>
          <span style={{ fontSize: "9px", color: "var(--color-muted-foreground)", flexShrink: 0 }}>{signal.timeframe}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {signal.pattern && (
            <span style={{ fontSize: "9px", color: "var(--color-muted-foreground)" }}>{signal.pattern}</span>
          )}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "var(--color-neutral-wait)",
            }}
          >
            {signal.confidence}%
          </span>
        </div>
      </div>

      {/* Reasons */}
      {signal.reasons && signal.reasons.length > 0 && (
        <div style={{ fontSize: "10px", color: "var(--color-muted-foreground)", lineHeight: 1.5, marginBottom: "6px" }}>
          {signal.reasons.join(" · ")}
        </div>
      )}

      {/* Bottom line — entry, SL, TP, date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "10px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          color: "var(--color-muted-foreground)",
          flexWrap: "wrap",
        }}
      >
        {signal.entry != null && (
          <span>
            Entry: <span style={{ color: "var(--color-foreground)" }}>${signal.entry}</span>
          </span>
        )}
        {signal.stop_loss != null && (
          <span>
            SL: <span style={{ color: "var(--color-bearish)" }}>${signal.stop_loss}</span>
          </span>
        )}
        {signal.take_profit && signal.take_profit.length > 0 && (
          <span>
            TP:{" "}
            <span style={{ color: "var(--color-bullish)" }}>
              {signal.take_profit.map((t) => `$${t}`).join(", ")}
            </span>
          </span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {new Date(signal.signal_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </DataRow>
  );
});