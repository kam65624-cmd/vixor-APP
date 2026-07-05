import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, EmptyState } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/arbitrage")({
  component: ArbDashboard,
});

function ArbDashboard() {
  return (
    <PageLayout
      title="Arbitrage Scanner"
      badge="COMING SOON"
      badgeColor={"var(--color-neutral-wait)"}
    >
      <EmptyState
        icon="⚡"
        title="Arbitrage Scanner"
        message="Automated arbitrage detection across Solana DEXs. Scans for cross-DEX, triangular, and CEX-DEX opportunities."
      />
    </PageLayout>
  );
}
