import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, EmptyState } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: ChartsPage,
});

function ChartsPage() {
  return (
    <PageLayout title="Charts" badge="COMING SOON" badgeColor={"var(--color-neutral-wait)"}>
      <EmptyState
        icon="📈"
        title="Charts"
        message="Advanced charting with real-time candlestick data, technical indicators (RSI, MACD, MA, Bollinger Bands), and multi-timeframe analysis."
      />
    </PageLayout>
  );
}
