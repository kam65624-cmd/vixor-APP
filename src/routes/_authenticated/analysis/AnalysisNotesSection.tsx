import { useState } from "react";
import { StickyNote, Plus, Pin, Trash2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getNotesByAnalysis, deleteNote } from "@/domains/notes/functions";
import type { TradingNote } from "@/domains/notes/types";
import { NoteEditorDialog } from "@/components/vixor/NoteEditorDialog";
import { CARD, MONO, GREEN_GRAD } from "./constants";
import { relTime } from "./utils";

const MOOD_EMOJI: Record<string, string> = {
  bullish: "🟢",
  bearish: "🔴",
  confident: "💪",
  cautious: "⚠️",
  anxious: "😰",
  neutral: "😐",
};

export function AnalysisNotesSection({
  analysisId,
  pair,
}: {
  analysisId: string;
  pair: string | null;
}) {
  const queryClient = useQueryClient();
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TradingNote | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const fetchNotes = useStableServerFn(getNotesByAnalysis);
  const notesQuery = useQuery({
    queryKey: ["analysis-notes", analysisId],
    queryFn: () => fetchNotes({ data: { analysisId } }),
    enabled: showNotes,
  });

  const deleteNoteFn = useStableServerFn(deleteNote);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const notes = (notesQuery.data ?? []) as TradingNote[];

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNoteFn({ data: { noteId } });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["analysis-notes", analysisId] });
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setShowNotes(!showNotes);
          if (!showNotes) {
            queryClient.invalidateQueries({ queryKey: ["analysis-notes", analysisId] });
          }
        }}
        style={{
          height: "48px",
          borderRadius: "12px",
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          fontWeight: 700,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "var(--color-foreground)",
          cursor: "pointer",
        }}
      >
        <StickyNote size={16} style={{ color: "var(--color-bullish)" }} /> Notes
      </button>

      {/* Notes panel below the action buttons */}
      {showNotes && (
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-muted-foreground)",
              }}
            >
              Notes for this analysis
            </h3>
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteEditorOpen(true);
              }}
              style={{
                height: "28px",
                padding: "0 12px",
                borderRadius: "8px",
                background: GREEN_GRAD,
                color: "var(--color-foreground)",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={12} /> Add Note
            </button>
          </div>

          {notesQuery.isLoading ? (
            <div style={{ ...CARD, padding: "16px", textAlign: "center" }}>
              <Loader2
                size={16}
                style={{
                  color: "var(--color-bullish)",
                  margin: "0 auto",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          ) : notes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    ...CARD,
                    padding: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setEditingNote(note);
                    setNoteEditorOpen(true);
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        {note.is_pinned && (
                          <Pin size={12} style={{ color: "var(--color-bullish)", flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "var(--color-foreground)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {note.title || "Untitled"}
                        </span>
                        <span style={{ fontSize: "14px", flexShrink: 0 }}>
                          {MOOD_EMOJI[note.mood]}
                        </span>
                      </div>
                      {note.content && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--color-muted-foreground)",
                            marginBottom: "6px",
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {note.content}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {note.tags?.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "var(--color-muted)",
                              color: "var(--color-muted-foreground)",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "12px",
                            ...MONO,
                            color: "var(--color-muted-foreground)",
                            marginLeft: "auto",
                          }}
                        >
                          {relTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(note.id);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-muted-foreground)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...CARD, padding: "24px", textAlign: "center" }}>
              <StickyNote
                size={24}
                style={{ color: `${"var(--color-muted-foreground)"}40`, margin: "0 auto 8px" }}
              />
              <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                No notes for this analysis yet
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteTarget && (
            <div
              style={{
                ...CARD,
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: "color-mix(in srgb, var(--color-bearish) 30%, transparent)",
                background: "color-mix(in srgb, var(--color-bearish) 5%, transparent)",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                Delete this note?
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setDeleteTarget(null)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    background: "var(--color-card)",
                    border: `1px solid ${"var(--color-border)"}`,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    background: "var(--color-bearish)",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--color-foreground)",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          <NoteEditorDialog
            open={noteEditorOpen}
            onOpenChange={setNoteEditorOpen}
            existingNote={editingNote}
            prefillPair={pair}
            prefillAnalysisId={analysisId}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["analysis-notes", analysisId] })
            }
          />
        </div>
      )}
    </>
  );
}
