import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, EmptyState } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <PageLayout title="Discover" badge="COMING SOON" badgeColor={"var(--color-neutral-wait)"}>
      <EmptyState
        icon="🔍"
        title="Discover"
        message="Token discovery with real-time prices, volume, smart money tracking, and DEX screener data for Solana meme coins."
      />
    </PageLayout>
  );
}