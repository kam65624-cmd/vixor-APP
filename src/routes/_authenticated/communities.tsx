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
  DataRowTwoLine,
  LabelValue,
  SectionTitle,
  THEME,
} from "@/components/vixor/PageLayout";
import {
  formatCurrency,
  formatPnL,
  formatCompact,
  formatPercent,
  formatPercentRaw,
  formatNumber,
  formatQuantity,
  formatRMultiple,
  formatTimeAgo,
  formatDateShort,
  formatDateFull,
  formatRelative,
  formatPrice,
  safeDiv,
  calcPnlPercent,
} from "@/shared/utils/formatters";

export const Route = createFileRoute("/_authenticated/communities")({
  component: CommunitiesPage,
});

const moodConfig: Record<string, { emoji: string; color: string; label: string }> = {
  confident: { emoji: "\uD83D\uDCAA", color: THEME.green, label: "Confident" },
  cautious: { emoji: "\u26A0\uFE0F", color: THEME.amber, label: "Cautious" },
  anxious: { emoji: "\uD83D\uDE30", color: THEME.red, label: "Anxious" },
  neutral: { emoji: "\uD83D\uDE10", color: THEME.textSecondary, label: "Neutral" },
};

const riskConfig: Record<string, { color: string }> = {
  low: { color: THEME.green },
  medium: { color: THEME.amber },
  high: { color: THEME.red },
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
  const riskColor = riskConfig[strategy.riskTolerance]?.color ?? THEME.textSecondary;

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
              color: THEME.text,
            }}
          >
            {strategy.name}
          </span>
          <span
            style={{
              fontSize: 12,
              color: THEME.textSecondary,
            }}
          >
            {strategy.tradingStyle}
          </span>
          {strategy.isActive && (
            <Badge label="ACTIVE" color={THEME.green} />
          )}
          <Badge
            label={strategy.riskTolerance.toUpperCase()}
            color={riskColor}
          />
        </div>
      </div>

      {/* Middle: pair badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {displayedPairs.map((pair) => (
          <Badge key={pair} label={pair} color={THEME.blue} />
        ))}
        {morePairs > 0 && (
          <Badge label={`+${morePairs} more`} color={THEME.textMuted} />
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
            <Badge key={tf} label={tf} color={THEME.purple} />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            color: THEME.textMuted,
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
    post.content.length > 140
      ? post.content.slice(0, 140) + "…"
      : post.content;

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
              color: THEME.text,
            }}
          >
            {post.title}
          </span>
          <Badge
            label={`${mood.emoji} ${mood.label}`}
            color={mood.color}
          />
          {post.isPinned && (
            <Badge label="PINNED" color={THEME.amber} />
          )}
        </div>
      </div>

      {/* Middle: pair badge */}
      {post.pair && (
        <div style={{ marginBottom: 6 }}>
          <Badge label={post.pair} color={THEME.blue} />
        </div>
      )}

      {/* Content: truncated text */}
      <div
        style={{
          fontSize: 13,
          color: THEME.textSecondary,
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
            <Badge key={tag} label={tag} color={THEME.purple} />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            color: THEME.textMuted,
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

  const [activeTab, setActiveTab] = useState(0);

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
      valueColor: THEME.green,
    },
    {
      label: "Community Posts",
      value: formatNumber(postCount),
      valueColor: THEME.blue,
    },
    {
      label: "Active Traders",
      value: formatNumber(activeTraders),
      valueColor: THEME.amber,
    },
    {
      label: "Total Activity",
      value: formatNumber(totalActivity),
      valueColor: THEME.purple,
    },
  ];

  return (
    <PageLayout
      title="Communities"
      badge="COMMUNITY"
      badgeColor={THEME.purple}
      description="Shared trading strategies and community activity"
      tabs={["Strategies", "Activity"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={isLoading}
    >
      <StatsRow stats={stats} />

      {activeTab === 0 && (
        <>
          <SectionTitle label="Strategies" count={strategies.length} />
          <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
            {strategies.length === 0 ? (
              <EmptyState message="No strategies shared yet" />
            ) : (
              strategies.map((s) => <StrategyCard key={s.id} strategy={s} />)
            )}
          </ScrollArea>
        </>
      )}

      {activeTab === 1 && (
        <>
          <SectionTitle label="Activity" count={posts.length} />
          <ScrollArea style={{ flex: 1, overflowY: "auto" }}>
            {posts.length === 0 ? (
              <EmptyState message="No community posts yet" />
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </ScrollArea>
        </>
      )}
    </PageLayout>
  );
}