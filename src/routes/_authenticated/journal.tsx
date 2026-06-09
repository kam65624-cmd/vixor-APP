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
import { listAnalyses } from "@/lib/vixor.functions";
import {
  listNotes,
  deleteNote,
} from "@/domains/notes/functions";
import type { TradingNote, Mood } from "@/domains/notes/types";
import { NoteEditorDialog } from "@/components/vixor/NoteEditorDialog";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
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
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
  "EUR/USD", "GBP/USD", "USD/JPY", "GBP/JPY", "AUD/USD",
  "XAU/USD", "USD/CHF",
];

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

  const fetchAnalyses = useStableServerFn(listAnalyses);
  const analysesQuery = useQuery({
    queryKey: ["analyses-journal"],
    queryFn: () => fetchAnalyses({ data: { limit: 50 } }),
  });

  const analyses = analysesQuery.data ?? [];
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
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <BookOpen className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">{t("journal.title")}</h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            {t("journal.subtitle")}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap px-2 ${tab === tabKey ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {tab === "journal.overview" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Top Stats — REAL data */}
          <div className="grid grid-cols-3 gap-2">
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {t("journal.trades")}
              </div>
              <div className="text-xl font-bold font-mono text-foreground">{analyses.length}</div>
            </div>
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {t("journal.winRate")}
              </div>
              <div className="text-xl font-bold font-mono text-bullish">
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
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Avg Conf
              </div>
              <div className="text-xl font-bold font-mono text-primary">{avgConfidence}%</div>
            </div>
          </div>

          {/* AI Insight — based on real analyses */}
          <div className="vixor-card p-4 border border-primary/30 bg-primary/5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                AI Insight
              </h3>
            </div>
            <div className="text-sm font-medium leading-relaxed">
              {analyses.length > 0 ? (
                <>
                  <strong className="text-foreground">{analyses.length} analyses completed.</strong>{" "}
                  Your most analyzed pair is {getMostAnalyzedPair(analyses)}. Keep documenting your
                  trades for deeper AI insights and mistake detection.
                </>
              ) : (
                <>
                  <strong className="text-foreground">{t("journal.noTrades")}</strong>{" "}
                  {t("journal.noTradesDesc")}
                </>
              )}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="space-y-2 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {t("journal.recentExecutions")}
            </h3>
            {analyses.length > 0 ? (
              analyses.slice(0, 5).map((a: any) => (
                <a
                  key={a.id}
                  href={`/analysis/${a.id}`}
                  className="vixor-card p-3.5 flex items-center justify-between border-l-4 transition-colors hover:bg-card-hover cursor-pointer block"
                  style={{
                    borderLeftColor:
                      a.recommendation === "BUY"
                        ? "var(--color-bullish)"
                        : a.recommendation === "SELL"
                          ? "var(--color-bearish)"
                          : "var(--color-neutral-wait)",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${a.recommendation === "BUY" ? "bg-bullish/10 text-bullish" : a.recommendation === "SELL" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"}`}
                      >
                        {a.recommendation ?? "WAIT"}
                      </span>
                      <span className="font-bold font-mono text-sm">{a.pair ?? "?"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>{a.timeframe ?? "—"}</span>
                      <span>{a.pattern ?? ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-base">{a.confidence ?? 0}%</div>
                    <div className="text-[10px] font-mono font-bold text-muted-foreground">
                      {relTime(a.created_at)}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="vixor-card p-6 text-center">
                <BookOpen className="size-6 text-muted-foreground/30 mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">{t("journal.noTrades")}</div>
                <a href="/analyze" className="text-xs text-primary font-bold mt-1 inline-block">
                  Analyze your first chart
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "journal.history" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {analyses.length > 0 ? (
            analyses.map((a: any) => (
              <a
                key={a.id}
                href={`/analysis/${a.id}`}
                className="vixor-card p-3.5 flex items-center justify-between border-l-4 transition-colors hover:bg-card-hover cursor-pointer block"
                style={{
                  borderLeftColor:
                    a.recommendation === "BUY"
                      ? "var(--color-bullish)"
                      : a.recommendation === "SELL"
                        ? "var(--color-bearish)"
                        : "var(--color-neutral-wait)",
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${a.recommendation === "BUY" ? "bg-bullish/10 text-bullish" : a.recommendation === "SELL" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"}`}
                    >
                      {a.recommendation ?? "WAIT"}
                    </span>
                    <span className="font-bold font-mono text-sm">{a.pair ?? "?"}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {a.timeframe ?? "—"} · {relTime(a.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold font-mono text-base ${a.recommendation === "BUY" ? "text-bullish" : a.recommendation === "SELL" ? "text-bearish" : "text-neutral-wait"}`}
                  >
                    {a.confidence ?? 0}%
                  </div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground">
                    {a.pattern ?? ""}
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="vixor-card p-6 text-center">
              <BookOpen className="size-6 text-muted-foreground/30 mx-auto mb-2" />
              <div className="text-xs text-muted-foreground">No trade history yet</div>
            </div>
          )}
        </div>
      )}

      {tab === "journal.notes" && <NotesTab />}

      {tab === "journal.reports" && (
        <div className="vixor-card p-8 text-center border-dashed">
          <BarChart3 className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">{t("journal.advancedAnalytics")}</h3>
          <p className="text-sm text-muted-foreground">{t("journal.unlockReports")}</p>
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Pair filter */}
          <select
            value={filterPair}
            onChange={(e) => setFilterPair(e.target.value)}
            className="flex-1 h-8 px-2 rounded-lg bg-card border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            className="flex-1 h-8 px-2 rounded-lg bg-card border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterPinnedOnly
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground"
            }`}
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
            className="text-[10px] font-bold text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Notes list */}
      {notesQuery.isLoading ? (
        <div className="vixor-card p-8 text-center">
          <Loader2 className="size-6 text-primary animate-spin mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">Loading notes...</div>
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="vixor-card p-3.5 transition-colors hover:bg-card-hover cursor-pointer"
              onClick={() => handleEdit(note)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 mb-1">
                    {note.is_pinned && <Pin className="size-3 text-primary shrink-0" />}
                    <span className="font-bold text-sm text-foreground truncate">{note.title || "Untitled"}</span>
                    <span className="text-sm shrink-0">{MOOD_EMOJI[note.mood]}</span>
                  </div>

                  {/* Content preview */}
                  {note.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                      {note.content}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.pair && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {note.pair}
                      </span>
                    )}
                    {note.analysis_id && (
                      <a
                        href={`/analysis/${note.analysis_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground hover:text-primary transition-colors"
                      >
                        📎 Analysis
                      </a>
                    )}
                    {note.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">
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
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-bearish hover:bg-bearish/10 transition-all shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vixor-card p-8 text-center">
          <StickyNote className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-bold mb-1">{t("journal.noNotes")}</h3>
          <p className="text-xs text-muted-foreground">{t("journal.noNotesDesc")}</p>
        </div>
      )}

      {/* FAB — New Note */}
      <button
        onClick={handleCreateNew}
        className="fixed bottom-24 right-6 z-30 size-14 rounded-2xl gradient-primary text-primary-foreground shadow-lg glow-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform sm:right-8"
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
      <DialogContent className="max-w-sm rounded-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Delete Note</DialogTitle>
          <DialogDescription className="text-muted-foreground">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-xl bg-card border border-border font-bold text-sm hover:bg-card-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-bearish text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-bearish/90 active:scale-95 transition-all disabled:opacity-50"
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
