import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, EmptyState } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/activity-web3")({
  head: () => ({ meta: [{ title: "Activity — Vixor" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <PageLayout
      title="On-Chain Activity"
      badge="COMING SOON"
      badgeColor={"var(--color-neutral-wait)"}
    >
      <EmptyState
        icon="🔄"
        title="On-Chain Activity"
        message="View your on-chain transactions, swaps, transfers, and AI-driven activity across Solana with smart insights."
      />
    </PageLayout>
  );
}
