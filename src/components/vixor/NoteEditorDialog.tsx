"use client";

import { useState, useEffect } from "react";
import { Loader2, Pin, PinOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createNote, updateNote } from "@/domains/notes/functions";
import type { TradingNote, Mood } from "@/domains/notes/types";

const AVAILABLE_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
  "EUR/USD", "GBP/USD", "USD/JPY", "GBP/JPY", "AUD/USD",
  "XAU/USD", "USD/CHF",
];

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "confident", emoji: "💪", label: "Confident" },
  { value: "cautious", emoji: "⚠️", label: "Cautious" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
];

const PRESET_TAGS = ["setup", "lesson", "review", "mistake", "breakout", "swing", "scalp", "news"];

interface NoteEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNote?: TradingNote | null;
  prefillPair?: string | null;
  prefillAnalysisId?: string | null;
  onSuccess?: () => void;
}

export function NoteEditorDialog({
  open,
  onOpenChange,
  existingNote,
  prefillPair,
  prefillAnalysisId,
  onSuccess,
}: NoteEditorDialogProps) {
  const isEditing = !!existingNote;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pair, setPair] = useState<string>("");
  const [customPair, setCustomPair] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNoteFn = useStableServerFn(createNote);
  const updateNoteFn = useStableServerFn(updateNote);

  // Populate form when editing
  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setPair(existingNote.pair ?? "");
      setCustomPair("");
      setTags(existingNote.tags ?? []);
      setMood(existingNote.mood);
      setIsPinned(existingNote.is_pinned);
    } else {
      setTitle("");
      setContent("");
      setPair(prefillPair ?? "");
      setCustomPair("");
      setTags([]);
      setMood("neutral");
      setIsPinned(false);
    }
    setError(null);
  }, [existingNote, prefillPair, open]);

  const effectivePair = pair === "__custom__" ? customPair : pair;

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const togglePresetTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else if (tags.length < 10) {
      setTags([...tags, tag]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isEditing && existingNote) {
        await updateNoteFn({
          data: {
            noteId: existingNote.id,
            title: title.trim(),
            content: content.trim(),
            tags,
            mood,
            is_pinned: isPinned,
            pair: effectivePair || null,
          },
        });
      } else {
        await createNoteFn({
          data: {
            title: title.trim(),
            content: content.trim(),
            pair: effectivePair || null,
            analysis_id: prefillAnalysisId ?? null,
            tags,
            mood,
            is_pinned: isPinned,
          },
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {isEditing ? "Edit Note" : "New Note"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update your trading note" : "Capture your trading thoughts and observations"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BTC breakout setup"
              maxLength={200}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, analysis, lessons..."
              maxLength={10000}
              rows={5}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Pair */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Pair (optional)
            </label>
            <div className="flex gap-2">
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="flex-1 h-9 px-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">None</option>
                {AVAILABLE_PAIRS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="__custom__">Custom...</option>
              </select>
              {pair === "__custom__" && (
                <input
                  type="text"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value)}
                  placeholder="e.g. DOGE/USDT"
                  maxLength={30}
                  className="w-28 h-9 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Mood
            </label>
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    mood === m.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => togglePresetTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    tags.includes(tag)
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                maxLength={30}
                className="flex-1 h-8 px-3 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim()}
                className="h-8 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold hover:bg-card-hover disabled:opacity-40 transition-all"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-bearish transition-colors">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-2">
              {isPinned ? (
                <Pin className="size-4 text-primary" />
              ) : (
                <PinOff className="size-4 text-muted-foreground" />
              )}
              <span className="text-xs font-bold text-foreground">Pin this note</span>
            </div>
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isPinned ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  isPinned ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {prefillAnalysisId && !isEditing && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-medium">
              <span>📌</span> Linked to analysis
            </div>
          )}

          {error && (
            <div className="p-3 bg-bearish/10 border border-bearish/30 text-bearish text-xs font-bold rounded-xl">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : null}
            {isEditing ? "Save Changes" : "Create Note"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
