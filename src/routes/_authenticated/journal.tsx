import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  AlertTriangle,
  BarChart3,
  Plus,
  StickyNote,
  Pin,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAnalyses } from "@/domains/analysis/functions";
import { listNotes, deleteNote } from "@/domains/notes/functions";
import type { TradingNote, Mood } from "@/domains/notes/types";
import { NoteEditorDialog } from "@/components/vixor/NoteEditorDialog";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Vixor" }] }),
  component: Journal,
});

const TABS = ["journal.overview", "journal.history", "journal.notes", "journal.reports"] as const;

const MOOD_EMOJI: Record<Mood, string> = {
  confident: "💪",
  cautious: "⚠️",
  anxious: "😰",
  neutral: "😐",
};

const AVAILABLE_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "GBP/JPY",
  "AUD/USD",
  "XAU/USD",
  "USD/CHF",
];

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};
const mono = { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" };
const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#7B8BA8",
};

function getMostAnalyzedPair(analyses: any[]): string {
  const counts: Record<string, number> = {};
  for (const a of analyses) {
    if (a.pair) counts[a.pair] = (counts[a.pair] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "—";
}

function Journal() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("journal.overview");

  // Pagination state for history tab
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  const fetchAnalyses = useStableServerFn(listAnalyses);
  const analysesQuery = useQuery({
    queryKey: ["analyses-journal", historyPage],
    queryFn: () =>
      fetchAnalyses({
        data: {
          limit: HISTORY_PAGE_SIZE,
          offset: (historyPage - 1) * HISTORY_PAGE_SIZE,
        },
      }),
  });

  const analysesRaw = analysesQuery.data as
    | { items: any[]; total: number; hasMore: boolean }
    | undefined;
  const analyses = analysesRaw?.items ?? [];
  const analysesTotal = analysesRaw?.total ?? 0;
  const activeSignals = analyses.filter(
    (a: any) => a.recommendation === "BUY" || a.recommendation === "SELL",
  );
  const avgConfidence =
    analyses.length > 0
      ? Math.round(
          analyses.reduce((sum: number, a: any) => sum + (a.confidence ?? 0), 0) / analyses.length,
        )
      : 0;

  return (
    <div
      className="w-full"
      style={{
        background: "#0A0E1A",
        color: "#F0F4FC",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center" style={card}>
          <BookOpen className="size-5" style={{ color: "#3B82F6" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">{t("journal.title")}</h1>
          <div className="mt-1" style={{ ...labelStyle, fontSize: "10px" }}>
            {t("journal.subtitle")}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div
        className="flex gap-1 p-1 overflow-x-auto no-scrollbar"
        style={{ ...card, marginTop: "24px" }}
      >
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className="flex-1 h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap px-2"
            style={{
              background: tab === tabKey ? "rgba(59,130,246,0.15)" : "transparent",
              color: tab === tabKey ? "#60A5FA" : "#7B8BA8",
            }}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {tab === "journal.overview" && (
        <div className="flex flex-col gap-4" style={{ marginTop: "16px" }}>
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-4" style={card}>
              <div className="mb-1" style={labelStyle}>
                {t("journal.trades")}
              </div>
              <div className="text-xl font-bold" style={mono}>
                {analyses.length}
              </div>
            </div>
            <div className="p-4" style={card}>
              <div className="mb-1" style={labelStyle}>
                {t("journal.winRate")}
              </div>
              <div className="text-xl font-bold" style={{ ...mono, color: "#22C55E" }}>
                {activeSignals.length > 0
                  ? Math.round(
                      (activeSignals.filter((a: any) => a.confidence && a.confidence >= 60).length /
                        activeSignals.length) *
                        100,
                    )
                  : 0}
                %
              </div>
            </div>
            <div className="p-4" style={card}>
              <div className="mb-1" style={labelStyle}>
                Avg Conf
              </div>
              <div className="text-xl font-bold" style={{ ...mono, color: "#3B82F6" }}>
                {avgConfidence}%
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div
            className="p-4 relative overflow-hidden"
            style={{
              ...card,
              borderLeft: "4px solid #3B82F6",
              background: "rgba(59,130,246,0.05)",
              borderColor: "rgba(59,130,246,0.3)",
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "#3B82F6" }} />
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4" style={{ color: "#3B82F6" }} />
              <h3 style={{ ...labelStyle, color: "#3B82F6" }}>AI Insight</h3>
            </div>
            <div className="text-sm font-medium leading-relaxed">
              {analyses.length > 0 ? (
                <>
                  <strong style={{ color: "#F0F4FC" }}>
                    {analyses.length} analyses completed.
                  </strong>{" "}
                  Your most analyzed pair is {getMostAnalyzedPair(analyses)}. Keep documenting your
                  trades for deeper AI insights and mistake detection.
                </>
              ) : (
                <>
                  <strong style={{ color: "#F0F4FC" }}>{t("journal.noTrades")}</strong>{" "}
                  {t("journal.noTradesDesc")}
                </>
              )}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="flex flex-col gap-2" style={{ marginTop: "8px" }}>
            <h3 className="mb-3 px-1" style={labelStyle}>
              {t("journal.recentExecutions")}
            </h3>
            {analyses.length > 0 ? (
              analyses.slice(0, 5).map((a: any) => (
                <a
                  key={a.id}
                  href={`/analysis/${a.id}`}
                  className="p-3.5 flex items-center justify-between transition-colors cursor-pointer block"
                  style={{
                    ...card,
                    borderLeft: `4px solid ${
                      a.recommendation === "BUY"
                        ? "#22C55E"
                        : a.recommendation === "SELL"
                          ? "#EF4444"
                          : "#F59E0B"
                    }`,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{
                          background:
                            a.recommendation === "BUY"
                              ? "rgba(34,197,94,0.15)"
                              : a.recommendation === "SELL"
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(245,158,11,0.15)",
                          color:
                            a.recommendation === "BUY"
                              ? "#22C55E"
                              : a.recommendation === "SELL"
                                ? "#EF4444"
                                : "#F59E0B",
                        }}
                      >
                        {a.recommendation ?? "WAIT"}
                      </span>
                      <span className="font-bold text-sm" style={mono}>
                        {a.pair ?? "?"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 text-[10px]"
                      style={{ ...mono, color: "#7B8BA8" }}
                    >
                      <span>{a.timeframe ?? "—"}</span>
                      <span>{a.pattern ?? ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-base" style={mono}>
                      {a.confidence ?? 0}%
                    </div>
                    <div className="text-[10px] font-bold" style={{ ...mono, color: "#7B8BA8" }}>
                      {relTime(a.created_at)}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="p-6 text-center" style={card}>
                <BookOpen
                  className="size-6 mx-auto mb-2"
                  style={{ color: "rgba(123,139,168,0.3)" }}
                />
                <div className="text-xs" style={{ color: "#7B8BA8" }}>
                  {t("journal.noTrades")}
                </div>
                <a
                  href="/analyze"
                  className="text-xs font-bold mt-1 inline-block"
                  style={{ color: "#3B82F6" }}
                >
                  Analyze your first chart
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "journal.history" && (
        <div className="flex flex-col gap-2" style={{ marginTop: "16px" }}>
          {analyses.length > 0 ? (
            analyses.map((a: any) => (
              <a
                key={a.id}
                href={`/analysis/${a.id}`}
                className="p-3.5 flex items-center justify-between transition-colors cursor-pointer block"
                style={{
                  ...card,
                  borderLeft: `4px solid ${
                    a.recommendation === "BUY"
                      ? "#22C55E"
                      : a.recommendation === "SELL"
                        ? "#EF4444"
                        : "#F59E0B"
                  }`,
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                      style={{
                        background:
                          a.recommendation === "BUY"
                            ? "rgba(34,197,94,0.15)"
                            : a.recommendation === "SELL"
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(245,158,11,0.15)",
                        color:
                          a.recommendation === "BUY"
                            ? "#22C55E"
                            : a.recommendation === "SELL"
                              ? "#EF4444"
                              : "#F59E0B",
                      }}
                    >
                      {a.recommendation ?? "WAIT"}
                    </span>
                    <span className="font-bold text-sm" style={mono}>
                      {a.pair ?? "?"}
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ ...mono, color: "#7B8BA8" }}>
                    {a.timeframe ?? "—"} · {relTime(a.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-bold text-base"
                    style={{
                      ...mono,
                      color:
                        a.recommendation === "BUY"
                          ? "#22C55E"
                          : a.recommendation === "SELL"
                            ? "#EF4444"
                            : "#F59E0B",
                    }}
                  >
                    {a.confidence ?? 0}%
                  </div>
                  <div className="text-[10px] font-bold" style={{ ...mono, color: "#7B8BA8" }}>
                    {a.pattern ?? ""}
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="p-6 text-center" style={card}>
              <BookOpen
                className="size-6 mx-auto mb-2"
                style={{ color: "rgba(123,139,168,0.3)" }}
              />
              <div className="text-xs" style={{ color: "#7B8BA8" }}>
                No trade history yet
              </div>
            </div>
          )}

          {/* Pagination */}
          {analysesTotal > HISTORY_PAGE_SIZE && (
            <PaginationBar
              page={historyPage}
              pageSize={HISTORY_PAGE_SIZE}
              total={analysesTotal}
              onPageChange={setHistoryPage}
            />
          )}
        </div>
      )}

      {tab === "journal.notes" && <NotesTab />}

      {tab === "journal.reports" && (
        <div
          className="p-8 text-center"
          style={{ ...card, marginTop: "16px", borderStyle: "dashed" }}
        >
          <BarChart3 className="size-10 mx-auto mb-3" style={{ color: "rgba(123,139,168,0.5)" }} />
          <h3 className="text-lg font-bold mb-1">{t("journal.advancedAnalytics")}</h3>
          <p className="text-sm" style={{ color: "#7B8BA8" }}>
            {t("journal.unlockReports")}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NOTES TAB
// ═══════════════════════════════════════════════════════════
function NotesTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Filters
  const [filterPair, setFilterPair] = useState<string>("");
  const [filterMood, setFilterMood] = useState<string>("");
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);

  // Dialog state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TradingNote | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch notes
  const fetchNotes = useStableServerFn(listNotes);
  const notesQuery = useQuery({
    queryKey: ["trading-notes", filterPair, filterMood, filterPinnedOnly],
    queryFn: () =>
      fetchNotes({
        data: {
          pair: filterPair || undefined,
          mood: (filterMood || undefined) as Mood | undefined,
          pinnedOnly: filterPinnedOnly || undefined,
        },
      }),
  });

  const notes = (notesQuery.data ?? []) as TradingNote[];

  // Delete note
  const deleteNoteFn = useStableServerFn(deleteNote);

  const handleDelete = async (noteId: string) => {
    setDeleting(true);
    try {
      await deleteNoteFn({ data: { noteId } });
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["trading-notes"] });
    } catch (err) {
      console.error("Failed to delete note:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (note: TradingNote) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["trading-notes"] });
  };

  // Collect unique pairs and tags from notes for filter options
  const uniquePairs = useMemo(() => {
    const pairs = new Set<string>();
    notes.forEach((n) => {
      if (n.pair) pairs.add(n.pair);
    });
    return Array.from(pairs).sort();
  }, [notes]);

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  return (
    <div className="flex flex-col gap-4" style={{ marginTop: "16px" }}>
      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Pair filter */}
          <select
            value={filterPair}
            onChange={(e) => setFilterPair(e.target.value)}
            className="flex-1 h-8 px-2 rounded-lg text-xs font-medium outline-none"
            style={{ ...card, background: "#111827", color: "#F0F4FC" }}
          >
            <option value="">{t("journal.allPairs")}</option>
            {AVAILABLE_PAIRS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Mood filter */}
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="flex-1 h-8 px-2 rounded-lg text-xs font-medium outline-none"
            style={{ ...card, background: "#111827", color: "#F0F4FC" }}
          >
            <option value="">{t("journal.allMoods")}</option>
            <option value="confident">💪 Confident</option>
            <option value="cautious">⚠️ Cautious</option>
            <option value="anxious">😰 Anxious</option>
            <option value="neutral">😐 Neutral</option>
          </select>

          {/* Pinned only toggle */}
          <button
            onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
            className="h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            style={{
              background: filterPinnedOnly ? "#3B82F6" : "#111827",
              border: filterPinnedOnly ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
              color: filterPinnedOnly ? "#fff" : "#7B8BA8",
            }}
          >
            <Pin className="size-3" />
          </button>
        </div>

        {/* Clear filters */}
        {(filterPair || filterMood || filterPinnedOnly) && (
          <button
            onClick={() => {
              setFilterPair("");
              setFilterMood("");
              setFilterPinnedOnly(false);
            }}
            className="text-[10px] font-bold"
            style={{ color: "#3B82F6" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Notes list */}
      {notesQuery.isLoading ? (
        <div className="p-8 text-center" style={card}>
          <Loader2 className="size-6 animate-spin mx-auto mb-2" style={{ color: "#3B82F6" }} />
          <div className="text-xs" style={{ color: "#7B8BA8" }}>
            Loading notes...
          </div>
        </div>
      ) : notes.length > 0 ? (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3.5 transition-colors cursor-pointer"
              style={card}
              onClick={() => handleEdit(note)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 mb-1">
                    {note.is_pinned && (
                      <Pin className="size-3 shrink-0" style={{ color: "#3B82F6" }} />
                    )}
                    <span className="font-bold text-sm truncate" style={{ color: "#F0F4FC" }}>
                      {note.title || "Untitled"}
                    </span>
                    <span className="text-sm shrink-0">{MOOD_EMOJI[note.mood]}</span>
                  </div>

                  {/* Content preview */}
                  {note.content && (
                    <p
                      className="text-xs line-clamp-2 mb-2 leading-relaxed"
                      style={{ color: "#7B8BA8" }}
                    >
                      {note.content}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.pair && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "#3B82F6",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}
                      >
                        {note.pair}
                      </span>
                    )}
                    {note.analysis_id && (
                      <a
                        href={`/analysis/${note.analysis_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#7B8BA8" }}
                      >
                        📎 Analysis
                      </a>
                    )}
                    {note.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#7B8BA8" }}
                      >
                        #{tag}
                      </span>
                    ))}
                    <span className="text-[10px] ml-auto" style={{ ...mono, color: "#7B8BA8" }}>
                      {relTime(note.created_at)}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(note.id);
                  }}
                  className="size-8 rounded-lg flex items-center justify-center transition-all shrink-0"
                  style={{ color: "#7B8BA8", background: "transparent" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#EF4444";
                    (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#7B8BA8";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center" style={card}>
          <StickyNote className="size-8 mx-auto mb-3" style={{ color: "rgba(123,139,168,0.3)" }} />
          <h3 className="text-sm font-bold mb-1">{t("journal.noNotes")}</h3>
          <p className="text-xs" style={{ color: "#7B8BA8" }}>
            {t("journal.noNotesDesc")}
          </p>
        </div>
      )}

      {/* FAB — New Note */}
      <button
        onClick={handleCreateNew}
        className="fixed bottom-24 right-6 z-30 size-14 rounded-2xl flex items-center justify-center sm:right-8 transition-transform"
        style={{
          background: "linear-gradient(135deg, #3B82F6, #2563EB)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(59,130,246,0.3)",
        }}
      >
        <Plus className="size-6" />
      </button>

      {/* Note Editor Dialog */}
      <NoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        existingNote={editingNote}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        loading={deleting}
        message={t("journal.confirmDelete")}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIRM DELETE DIALOG
// ═══════════════════════════════════════════════════════════
function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  message,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
  message: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#F0F4FC" }}>Delete Note</DialogTitle>
          <DialogDescription style={{ color: "#7B8BA8" }}>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-xl font-bold text-sm transition-colors"
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#F0F4FC",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: "#EF4444", color: "#fff", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
