import { memo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getCommunitiesData } from "@/shared/data";
import {
  PageLayout,
  StatsRow,
  ScrollArea,
  EmptyState,
  Badge,
  DataRow,
  LabelValue,
  SectionTitle,
} from "@/components/vixor/PageLayout";
import { formatNumber, formatRelative } from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/communities")({
  component: CommunitiesPage,
});

const moodConfig: Record<string, { emoji: string; color: string; label: string }> = {
  confident: { emoji: "\uD83D\uDCAA", color: "var(--color-bullish)", label: "Confident" },
  cautious: { emoji: "\u26A0\uFE0F", color: "var(--color-neutral-wait)", label: "Cautious" },
  anxious: { emoji: "\uD83D\uDE30", color: "var(--color-bearish)", label: "Anxious" },
  neutral: { emoji: "\uD83D\uDE10", color: "var(--color-muted-foreground)", label: "Neutral" },
};

const riskConfig: Record<string, { color: string }> = {
  low: { color: "var(--color-bullish)" },
  medium: { color: "var(--color-neutral-wait)" },
  high: { color: "var(--color-bearish)" },
};

const StrategyCard = memo(function StrategyCard({
  strategy,
}: {
  strategy: {
    id: string;
    name: string;
    tradingStyle: string;
    pairs: string[];
    timeframes: string[];
    riskTolerance: string;
    isActive: boolean;
    createdAt: string;
  };
}) {
  const displayedPairs = strategy.pairs.slice(0, 5);
  const morePairs = strategy.pairs.length - 5;
  const riskColor = riskConfig[strategy.riskTolerance]?.color ?? "var(--color-muted-foreground)";

  return (
    <DataRow>
      {/* Top: name + tradingStyle + badges */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-foreground)",
            }}
          >
            {strategy.name}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-muted-foreground)",
            }}
          >
            {strategy.tradingStyle}
          </span>
          {strategy.isActive && <Badge label="ACTIVE" color={"var(--color-bullish)"} />}
          <Badge label={strategy.riskTolerance.toUpperCase()} color={riskColor} />
        </div>
      </div>

      {/* Middle: pair badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {displayedPairs.map((pair) => (
          <Badge key={pair} label={pair} color={"var(--color-primary)"} />
        ))}
        {morePairs > 0 && (
          <Badge label={`+${morePairs} more`} color={"var(--color-muted-foreground)"} />
        )}
      </div>

      {/* Bottom: timeframe badges + date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {strategy.timeframes.map((tf) => (
            <Badge key={tf} label={tf} color={"var(--color-info)"} />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            flexShrink: 0,
          }}
        >
          {formatRelative(strategy.createdAt)}
        </span>
      </div>
    </DataRow>
  );
});

const PostCard = memo(function PostCard({
  post,
}: {
  post: {
    id: string;
    title: string;
    content: string;
    mood: "confident" | "cautious" | "anxious" | "neutral";
    pair: string;
    tags: string[];
    isPinned: boolean;
    createdAt: string;
  };
}) {
  const mood = moodConfig[post.mood] ?? moodConfig.neutral;
  const truncatedContent =
    post.content.length > 140 ? post.content.slice(0, 140) + "…" : post.content;

  return (
    <DataRow>
      {/* Top: title + mood badge + pinned badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-foreground)",
            }}
          >
            {post.title}
          </span>
          <Badge label={`${mood.emoji} ${mood.label}`} color={mood.color} />
          {post.isPinned && <Badge label="PINNED" color={"var(--color-neutral-wait)"} />}
        </div>
      </div>

      {/* Middle: pair badge */}
      {post.pair && (
        <div style={{ marginBottom: 6 }}>
          <Badge label={post.pair} color={"var(--color-primary)"} />
        </div>
      )}

      {/* Content: truncated text */}
      <div
        style={{
          fontSize: 13,
          color: "var(--color-muted-foreground)",
          lineHeight: 1.5,
          marginBottom: 8,
        }}
      >
        {truncatedContent}
      </div>

      {/* Bottom: tag badges + date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {post.tags.map((tag) => (
            <Badge key={tag} label={tag} color={"var(--color-info)"} />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            flexShrink: 0,
          }}
        >
          {formatRelative(post.createdAt)}
        </span>
      </div>
    </DataRow>
  );
});

function CommunitiesPage() {
  const getFn = useStableServerFn(getCommunitiesData);

  const { data, isLoading } = useQuery({
    queryKey: ["communitiesData"],
    queryFn: getFn,
    staleTime: 30_000,
  });

  const [activeTab, setActiveTab] = useState("Strategies");

  const strategyCount = data?.strategyCount ?? 0;
  const postCount = data?.postCount ?? 0;
  const activeTraders = data?.activeTraders ?? 0;
  const strategies = data?.strategies ?? [];
  const posts = data?.posts ?? [];
  const totalActivity = strategyCount + postCount;

  const stats = [
    {
      label: "Shared Strategies",
      value: formatNumber(strategyCount),
      color: "var(--color-bullish)",
    },
    {
      label: "Community Posts",
      value: formatNumber(postCount),
      color: "var(--color-primary)",
    },
    {
      label: "Active Traders",
      value: formatNumber(activeTraders),
      color: "var(--color-neutral-wait)",
    },
    {
      label: "Total Activity",
      value: formatNumber(totalActivity),
      color: "var(--color-info)",
    },
  ];

  return (
    <PageLayout
      title="Communities"
      badge="COMMUNITY"
      badgeColor={"var(--color-info)"}
      tabs={["Strategies", "Activity"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={isLoading}
    >
      <StatsRow stats={stats} />

      {activeTab === "Strategies" && (
        <>
          <SectionTitle title="Strategies" count={strategies.length} />
          <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
            {strategies.length === 0 ? (
              <EmptyState
                icon="🎯"
                title="No Strategies"
                message="No strategies have been shared yet. Be the first to share your trading approach."
              />
            ) : (
              strategies.map((s) => <StrategyCard key={s.id} strategy={s} />)
            )}
          </ScrollArea>
        </>
      )}

      {activeTab === "Activity" && (
        <>
          <SectionTitle title="Activity" count={posts.length} />
          <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
            {posts.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No Activity"
                message="No community posts yet. Share your thoughts and trading ideas."
              />
            ) : (
              posts.map((p: any) => <PostCard key={p.id} post={p} />)
            )}
          </ScrollArea>
        </>
      )}
    </PageLayout>
  );
}
