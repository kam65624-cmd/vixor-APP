import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { getCommunitiesData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/communities")({
  head: () => ({ meta: [{ title: "Communities — Vixor" }] }),
  component: CommunitiesPage,
});

function CommunitiesPage() {
  const fetchData = useStableServerFn(getCommunitiesData);

  const query = useQuery({
    queryKey: ["communities-data"],
    queryFn: () => fetchData({}),
    staleTime: 30_000,
  });

  const d = query.data;
  const isLoading = query.isLoading;

  const stats = [
    { label: "Shared Strategies", value: String(d?.strategyCount ?? 0), color: "#8B5CF6" },
    { label: "Community Posts", value: String(d?.postCount ?? 0), color: "#3B82F6" },
    { label: "Active Traders", value: String(d?.activeTraders ?? 0), color: "#22C55E" },
    { label: "Total Activity", value: String((d?.strategyCount ?? 0) + (d?.postCount ?? 0)), color: "#EC4899" },
  ];

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Communities</h1>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>COMMUNITY HUB</span>
      </div>
      <p style={{ fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" }}>
        Community strategies and trading discussions. Share insights and learn from collective trading activity.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strategies */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Community Strategies
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#4A5568", marginLeft: "8px" }}>
                  ({d?.strategyCount ?? 0})
                </span>
              </div>
              {(d?.strategies ?? []).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "480px", overflowY: "auto" }}>
                  {d!.strategies.map((s: any) => (
                    <StrategyCard key={s.id} strategy={s} />
                  ))}
                </div>
              ) : (
                <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "36px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.5 }}>📋</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>No strategies yet</div>
                  <div style={{ fontSize: "11px", color: "#7B8BA8" }}>Create trading strategies to share with the community.</div>
                </div>
              )}
            </div>

            {/* Community Posts / Discussions */}
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Community Activity
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#4A5568", marginLeft: "8px" }}>
                  ({d?.postCount ?? 0})
                </span>
              </div>
              {(d?.posts ?? []).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "480px", overflowY: "auto" }}>
                  {d!.posts.map((p: any) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              ) : (
                <div style={{ background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "36px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.5 }}>💬</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>No community activity yet</div>
                  <div style={{ fontSize: "11px", color: "#7B8BA8" }}>Write journal entries to contribute to the community feed.</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const moodConfig: Record<string, { emoji: string; color: string; label: string }> = {
  confident: { emoji: "💪", color: "#22C55E", label: "Confident" },
  cautious: { emoji: "⚠️", color: "#F59E0B", label: "Cautious" },
  anxious: { emoji: "😰", color: "#EF4444", label: "Anxious" },
  neutral: { emoji: "😐", color: "#7B8BA8", label: "Neutral" },
};

const riskConfig: Record<string, { color: string }> = {
  low: { color: "#22C55E" },
  medium: { color: "#F59E0B" },
  high: { color: "#EF4444" },
};

const StrategyCard = memo(function StrategyCard({ strategy }: { strategy: any }) {
  const risk = riskConfig[strategy.riskTolerance] || { color: "#7B8BA8" };

  return (
    <div style={{ background: "#1a2035", borderRadius: "12px", border: "1px solid rgba(139,92,246,0.1)", padding: "16px", transition: "border-color 0.15s", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.1)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>{strategy.name || "Untitled Strategy"}</div>
          <div style={{ fontSize: "10px", color: "#7B8BA8" }}>{strategy.tradingStyle || "—"} style</div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {strategy.isActive && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>ACTIVE</span>
          )}
          {strategy.riskTolerance && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${risk.color}15`, color: risk.color }}>{strategy.riskTolerance.toUpperCase()}</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        {strategy.pairs.slice(0, 5).map((pair: string) => (
          <span key={pair} className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
            {pair}
          </span>
        ))}
        {strategy.pairs.length > 5 && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#7B8BA8" }}>
            +{strategy.pairs.length - 5} more
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {strategy.timeframes.map((tf: string) => (
          <span key={tf} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B" }}>
            {tf}
          </span>
        ))}
      </div>

      <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: "10px", color: "#4A5568" }}>
        {new Date(strategy.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
});

const PostCard = memo(function PostCard({ post }: { post: any }) {
  const mood = moodConfig[post.mood] || moodConfig.neutral;
  const truncated = post.content.length > 140 ? post.content.slice(0, 140) + "..." : post.content;

  return (
    <div style={{ background: "#1e2438", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", transition: "border-color 0.15s", cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.3, flex: 1, marginRight: "8px" }}>
          {post.title || "Untitled Note"}
          {post.isPinned && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-2" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>PINNED</span>
          )}
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${mood.color}15`, color: mood.color }}>
          {mood.emoji} {mood.label}
        </span>
      </div>

      {post.pair && (
        <div style={{ marginBottom: "6px" }}>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}>{post.pair}</span>
        </div>
      )}

      <div style={{ fontSize: "11px", color: "#7B8BA8", lineHeight: 1.5, marginBottom: "10px" }}>
        {truncated}
      </div>

      {post.tags.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
          {post.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[8px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#7B8BA8" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: "10px", color: "#4A5568" }}>
        {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
});