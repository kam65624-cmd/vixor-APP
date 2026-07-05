import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getJournalEntries, getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import {
  PageLayout, 
  StatsRow,
  ScrollArea,
  Badge,
  EmptyState,
  DataRow,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Trading Journal — Vixor" }] }),
  component: JournalPage,
});

// Server function to create a journal entry
export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        pair: z.string().optional().nullable(),
        mood: z.enum(["confident", "cautious", "anxious", "neutral"]).default("neutral"),
        tags: z.array(z.string()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("trading_notes").insert({
      user_id: userId,
      title: data.title,
      content: data.content,
      pair: data.pair,
      mood: data.mood,
      tags: data.tags,
      is_pinned: false,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

const journalTabs = ["All", "Confident", "Cautious", "Anxious", "With Tags"];

const moodColors: Record<string, string> = {
  confident: "var(--color-bullish)",
  cautious: "var(--color-neutral-wait)",
  anxious: "var(--color-bearish)",
  neutral: "var(--color-muted-foreground)",
};

/** Shared style for table header columns */
const thCol: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

/** Base style for form inputs */
const inputBase: React.CSSProperties = {
  background: "var(--color-background)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--color-foreground)",
  fontSize: 13,
  outline: "none",
  fontFamily: "'Inter', system-ui, sans-serif",
};

function JournalPage() {
  const navigate = useNavigate();
  const fetchJournal = useStableServerFn(getJournalEntries);
  const queryClient = useQueryClient();

  const journalQuery = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => fetchJournal({}),
    staleTime: 15_000,
  });

  const createMutation = useMutation({
    mutationFn: useStableServerFn(createJournalEntry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      setShowForm(false);
    },
  });

  const [activeTab, setActiveTab] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    pair: string;
    mood: "confident" | "cautious" | "anxious" | "neutral";
    tags: string;
  }>({
    title: "",
    content: "",
    pair: "",
    mood: "neutral",
    tags: "",
  });

  const entries = journalQuery.data?.entries ?? [];

  // Compute summary stats
  const pinnedCount = entries.filter((e) => e.is_pinned).length;
  const uniquePairs = new Set(entries.map((e) => e.pair).filter(Boolean)).size;
  const moodCount = (mood: string) => entries.filter((e) => e.mood === mood).length;
  const topMood = ["confident", "cautious", "anxious", "neutral"].sort(
    (a, b) => moodCount(b) - moodCount(a),
  )[0];

  const monthlySummary = [
    {
      label: "Total Notes",
      value: String(entries.length),
      sub: `${pinnedCount} pinned`,
      color: "var(--color-bullish)",
    },
    {
      label: "Pairs Covered",
      value: String(uniquePairs),
      sub: "Unique pairs",
      color: "var(--color-primary)",
    },
    {
      label: "Top Mood",
      value: topMood?.charAt(0).toUpperCase() + topMood?.slice(1) || "—",
      sub: `${moodCount(topMood || "")} entries`,
      color: moodColors[topMood || "neutral"] || "var(--color-muted-foreground)",
    },
    {
      label: "This Week",
      value: String(
        entries.filter((e) => new Date(e.created_at) > new Date(Date.now() - 7 * 86400000)).length,
      ),
      sub: "Last 7 days",
      color: "var(--color-neutral-wait)",
    },
  ];

  // Tab counts
  const tabCounts: Record<string, number> = {
    All: entries.length,
    Confident: moodCount("confident"),
    Cautious: moodCount("cautious"),
    Anxious: moodCount("anxious"),
    "With Tags": entries.filter((e) => e.tags && e.tags.length > 0).length,
  };

  const filteredEntries = entries.filter((e) => {
    if (activeTab === "All") return true;
    if (activeTab === "With Tags") return e.tags && e.tags.length > 0;
    return e.mood === activeTab.toLowerCase();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        title: formData.title,
        content: formData.content,
        pair: formData.pair || null,
        mood: formData.mood,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      },
    });
    setFormData({
      title: "",
      content: "",
      pair: "",
      mood: "neutral",
      tags: "",
    });
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <PageLayout
      title="Trading Journal"
      badge="JOURNAL"
      badgeColor={"var(--color-bullish)"}
      tabs={journalTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabCounts={tabCounts}
    >
      {/* New Entry Button Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "8px 16px",
          borderBottom: `1px solid ${"var(--color-border)"}`,
          background: "var(--color-muted)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: "var(--color-bullish)",
            color: "var(--color-foreground)",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'Inter', system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {showForm ? "✕ Close" : "+ New Entry"}
        </button>
      </div>

      <ScrollArea>
        {/* New Entry Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: "var(--color-card-hover)",
              borderRadius: 12,
              border: `1px solid ${"var(--color-border)"}`,
              padding: 16,
              margin: "16px 16px 0",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
              <input
                placeholder="Title (e.g. SOL long analysis)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{ ...inputBase, width: "100%" }}
              />
              <input
                placeholder="Pair (e.g. SOL/USDT)"
                value={formData.pair}
                onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
                style={{ ...inputBase, width: "100%" }}
              />
            </div>
            <textarea
              placeholder="Write your journal entry here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={4}
              style={{
                ...inputBase,
                width: "100%",
                resize: "vertical",
                marginBottom: 12,
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <select
                value={formData.mood}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mood: e.target.value as "confident" | "cautious" | "anxious" | "neutral",
                  })
                }
                style={{
                  ...inputBase,
                  padding: "8px 12px",
                  fontSize: 12,
                }}
              >
                <option value="neutral">😐 Neutral</option>
                <option value="confident">😎 Confident</option>
                <option value="cautious">🤔 Cautious</option>
                <option value="anxious">😰 Anxious</option>
              </select>
              <input
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                style={{
                  ...inputBase,
                  padding: "8px 12px",
                  fontSize: 12,
                  flex: 1,
                  minWidth: 120,
                }}
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: createMutation.isPending ? "wait" : "pointer",
                  background: createMutation.isPending ? "var(--color-card-hover)" : "var(--color-bullish)",
                  color: "var(--color-foreground)",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {createMutation.isPending ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Journal Overview Stats */}
        <StatsRow stats={monthlySummary} />

        {/* Journal Entries Table */}
        {journalQuery.isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: `2px solid ${"var(--color-border)"}`,
                borderTopColor: "var(--color-bullish)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : filteredEntries.length > 0 ? (
          <>
            {/* Table header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                height: "32px",
                background: "var(--color-muted)",
                borderBottom: `1px solid ${"var(--color-border)"}`,
                flexShrink: 0,
                overflowX: "auto",
              }}
              className="scrollbar-hide"
            >
              <div style={{ width: "85px", minWidth: 70, ...thCol }}>Date</div>
              <div
                style={{
                  width: "80px",
                  minWidth: 65,
                  ...thCol,
                }}
              >
                Pair
              </div>
              <div style={{ width: "80px", minWidth: 70, ...thCol }}>Mood</div>
              <div
                style={{
                  flex: 1,
                  minWidth: 120,
                  paddingLeft: 16,
                  ...thCol,
                }}
              >
                Title / Content
              </div>
              <div style={{ width: "30px", minWidth: 30, ...thCol }}> </div>
            </div>

            {/* Table rows */}
            {filteredEntries.map((e, i) => (
              <JournalRow key={e.id} entry={e} index={i} fmtDate={fmtDate} />
            ))}
          </>
        ) : (
          <EmptyState
            icon="📓"
            title={entries.length === 0 ? "No Journal Entries" : "No Matching Entries"}
            message={
              entries.length === 0
                ? 'Click "+ New Entry" to start your trading journal.'
                : "No entries match this filter."
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

/** Column styles for journal rows */
const COL = {
  date: {
    width: "85px",
    minWidth: 70,
    fontSize: "11px",
    color: "var(--color-muted-foreground)",
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    flexShrink: 0,
  },
  token: {
    width: "80px",
    minWidth: 65,
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    color: "var(--color-foreground)",
    flexShrink: 0,
  },
  mood: {
    width: "80px",
    minWidth: 70,
    flexShrink: 0,
  },
  notes: {
    flex: 1,
    minWidth: 120,
    fontSize: "11px",
    color: "var(--color-muted-foreground)",
    paddingLeft: "16px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  action: {
    width: "30px",
    minWidth: 30,
    textAlign: "center" as const,
    flexShrink: 0,
  },
};

const JournalRow = memo(function JournalRow({
  entry,
  index,
  fmtDate,
}: {
  entry: {
    id: string;
    pair: string | null;
    title: string;
    content: string;
    mood: string;
    tags: string[];
    is_pinned: boolean;
    created_at: string;
  };
  index: number;
  fmtDate: (d: string) => string;
}) {
  const moodColor = moodColors[entry.mood] || "var(--color-muted-foreground)";
  const moodEmoji: Record<string, string> = {
    confident: "😎",
    cautious: "🤔",
    anxious: "😰",
    neutral: "😐",
  };

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          overflowX: "auto",
          cursor: "pointer",
        }}
        className="scrollbar-hide"
      >
        <div style={COL.date}>{fmtDate(entry.created_at)}</div>
        <div style={COL.token}>{entry.pair || "—"}</div>
        <div style={COL.mood}>
          <Badge label={`${moodEmoji[entry.mood] || "😐"} ${entry.mood}`} color={moodColor} small />
        </div>
        <div style={COL.notes} title={entry.content}>
          <span style={{ color: "var(--color-foreground)", fontWeight: 600 }}>{entry.title}</span>
          {entry.is_pinned && <span style={{ marginLeft: 6, color: "var(--color-neutral-wait)" }}>📌</span>}
          {entry.tags && entry.tags.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 9,
                color: "var(--color-muted-foreground)",
              }}
            >
              {entry.tags
                .slice(0, 3)
                .map((t) => `#${t}`)
                .join(" ")}
            </span>
          )}
        </div>
        <div style={COL.action}>
          <span
            style={{
              fontSize: "14px",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            ›
          </span>
        </div>
      </div>
    </DataRow>
  );
});
