import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getJournalEntries, getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Trading Journal — Vixor" }] }),
  component: JournalPage,
});

// Server function to create a journal entry
export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      pair: z.string().optional().nullable(),
      mood: z.enum(["confident", "cautious", "anxious", "neutral"]).default("neutral"),
      tags: z.array(z.string()).default([]),
    }).parse(d),
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

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%", padding: "20px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  addBtn: { padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: "12px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", gap: "6px" },
  tabs: { display: "flex", gap: "4px", marginBottom: "20px", background: "#161b2e", borderRadius: "10px", padding: "4px", border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" },
  tab: { fontSize: "12px", fontWeight: 600, padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#7B8BA8", background: "transparent", fontFamily: "'Inter', system-ui, sans-serif" },
  tabActive: { background: "#1e2438", color: "#F0F4FC" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" },
  summaryCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px" },
  summaryLabel: { fontSize: "10px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "6px" },
  summaryValue: { fontSize: "22px", fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  summarySub: { fontSize: "10px", color: "#7B8BA8", marginTop: "4px" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableWrap: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" },
  tableHeader: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "pointer" },
  colDate: { width: "85px", fontSize: "11px", color: "#7B8BA8" },
  colToken: { width: "80px", fontSize: "12px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colMood: { width: "80px" },
  colEntry: { width: "85px", textAlign: "right" as const, fontSize: "11px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colNotes: { flex: 1, fontSize: "11px", color: "#7B8BA8", paddingLeft: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  colAction: { width: "30px", textAlign: "center" as const },
  moodBadge: { fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", display: "inline-block" },
};

const tabs = ["All", "Confident", "Cautious", "Anxious", "With Tags"];

const moodColors: Record<string, string> = {
  confident: "#22C55E",
  cautious: "#F59E0B",
  anxious: "#EF4444",
  neutral: "#4A5568",
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
  const [formData, setFormData] = useState<{ title: string; content: string; pair: string; mood: "confident" | "cautious" | "anxious" | "neutral"; tags: string }>({ title: "", content: "", pair: "", mood: "neutral", tags: "" });

  const entries = journalQuery.data?.entries ?? [];

  // Compute summary stats
  const pinnedCount = entries.filter((e) => e.is_pinned).length;
  const uniquePairs = new Set(entries.map((e) => e.pair).filter(Boolean)).size;
  const moodCount = (mood: string) => entries.filter((e) => e.mood === mood).length;
  const topMood = ["confident", "cautious", "anxious", "neutral"].sort((a, b) => moodCount(b) - moodCount(a))[0];

  const monthlySummary = [
    { label: "Total Notes", value: String(entries.length), sub: `${pinnedCount} pinned`, color: "#3B82F6" },
    { label: "Pairs Covered", value: String(uniquePairs), sub: "Unique pairs", color: "#60A5FA" },
    { label: "Top Mood", value: topMood?.charAt(0).toUpperCase() + topMood?.slice(1) || "—", sub: `${moodCount(topMood || "")} entries`, color: moodColors[topMood || "neutral"] || "#7B8BA8" },
    { label: "This Week", value: String(entries.filter((e) => new Date(e.created_at) > new Date(Date.now() - 7 * 86400000)).length), sub: "Last 7 days", color: "#F59E0B" },
  ];

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
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      },
    });
    setFormData({ title: "", content: "", pair: "", mood: "neutral", tags: "" });
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <h1 style={S.title}>Trading Journal</h1>
        </div>
        <button style={S.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Close" : "+ New Entry"}
        </button>
      </div>
      <p style={S.subtitle}>Track your trades, review performance, and improve your strategy</p>

      {/* New Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#161b2e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input
              placeholder="Title (e.g. SOL long analysis)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{ background: "#0f1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F0F4FC", fontSize: 13, outline: "none", fontFamily: "'Inter', system-ui, sans-serif" }}
            />
            <input
              placeholder="Pair (e.g. SOL/USDT)"
              value={formData.pair}
              onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
              style={{ background: "#0f1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F0F4FC", fontSize: 13, outline: "none", fontFamily: "'Inter', system-ui, sans-serif" }}
            />
          </div>
          <textarea
            placeholder="Write your journal entry here..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={4}
            style={{ background: "#0f1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F0F4FC", fontSize: 13, outline: "none", width: "100%", resize: "vertical", marginBottom: 12, fontFamily: "'Inter', system-ui, sans-serif" }}
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value as "confident" | "cautious" | "anxious" | "neutral" })}
              style={{ background: "#0f1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#F0F4FC", fontSize: 12, outline: "none" }}
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
              style={{ background: "#0f1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#F0F4FC", fontSize: 12, outline: "none", flex: 1, fontFamily: "'Inter', system-ui, sans-serif" }}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none", cursor: createMutation.isPending ? "wait" : "pointer",
                background: createMutation.isPending ? "#1e2438" : "linear-gradient(135deg, #3B82F6, #2563EB)",
                color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {createMutation.isPending ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      )}

      <div style={{ ...S.sectionTitle }}>Journal Overview</div>
      <div style={S.summaryGrid}>
        {monthlySummary.map((s) => (
          <SummaryCard key={s.label} item={s} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Journal Entries</div>
      <div style={S.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >{t}</button>
        ))}
      </div>

      {journalQuery.isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: "40px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={S.tableWrap}>
          <div style={S.tableHeader}>
            <div style={{ ...S.colDate, color: "#4A5568" }}>Date</div>
            <div style={{ ...S.colToken, color: "#4A5568" }}>Pair</div>
            <div style={{ ...S.colMood, color: "#4A5568" }}>Mood</div>
            <div style={{ ...S.colNotes, color: "#4A5568", paddingLeft: 16 }}>Title / Content</div>
            <div style={{ ...S.colAction, color: "#4A5568" }}></div>
          </div>
          {filteredEntries.length > 0 ? (
            filteredEntries.map((e, i) => (
              <JournalRow key={e.id} entry={e} index={i} fmtDate={fmtDate} />
            ))
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#7B8BA8", fontSize: 13 }}>
              {entries.length === 0 ? "No journal entries yet. Click '+ New Entry' to start." : "No entries match this filter."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SummaryCard = memo(function SummaryCard({ item }: { item: { label: string; value: string; sub: string; color: string } }) {
  return (
    <div style={S.summaryCard}>
      <div style={S.summaryLabel}>{item.label}</div>
      <div style={{ ...S.summaryValue, color: item.color }}>{item.value}</div>
      <div style={S.summarySub}>{item.sub}</div>
    </div>
  );
});

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
  const moodColor = moodColors[entry.mood] || "#4A5568";
  const moodEmoji: Record<string, string> = {
    confident: "😎",
    cautious: "🤔",
    anxious: "😰",
    neutral: "😐",
  };

  return (
    <div style={S.tableRow}>
      <div style={S.colDate}>{fmtDate(entry.created_at)}</div>
      <div style={S.colToken}>{entry.pair || "—"}</div>
      <div style={S.colMood}>
        <span
          style={{
            ...S.moodBadge,
            background: `${moodColor}20`,
            color: moodColor,
          }}
        >
          {moodEmoji[entry.mood] || "😐"} {entry.mood}
        </span>
      </div>
      <div style={S.colNotes} title={entry.content}>
        <span style={{ color: "#F0F4FC", fontWeight: 600 }}>{entry.title}</span>
        {entry.is_pinned && <span style={{ marginLeft: 6, color: "#F59E0B" }}>📌</span>}
        {entry.tags && entry.tags.length > 0 && (
          <span style={{ marginLeft: 8, fontSize: 9, color: "#4A5568" }}>
            {entry.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
          </span>
        )}
      </div>
      <div style={S.colAction}>
        <span style={{ fontSize: "14px", color: "#4A5568", cursor: "pointer" }}>›</span>
      </div>
    </div>
  );
});