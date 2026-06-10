// ============================================================================
// Notes Domain — Server Functions
// ============================================================================
//
// CRUD operations for the trading_notes table.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import type { Mood } from "./types";

// ---------- CREATE NOTE ----------
export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        pair: z.string().max(30).optional().nullable(),
        analysis_id: z.string().uuid().optional().nullable(),
        title: z.string().min(1).max(200),
        content: z.string().max(10000).default(""),
        tags: z.array(z.string().max(30)).max(10).default([]),
        mood: z.enum(["confident", "cautious", "anxious", "neutral"]).default("neutral"),
        is_pinned: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: note, error } = await supabase
      .from("trading_notes")
      .insert({
        user_id: userId,
        pair: data.pair ?? null,
        analysis_id: data.analysis_id ?? null,
        title: data.title,
        content: data.content,
        tags: data.tags,
        mood: data.mood as Mood,
        is_pinned: data.is_pinned,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return note;
  });

// ---------- LIST NOTES ----------
export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        pair: z.string().optional(),
        analysis_id: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
        pinnedOnly: z.boolean().optional(),
        mood: z.enum(["confident", "cautious", "anxious", "neutral"]).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("trading_notes")
      .select("*")
      .eq("user_id", context.userId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.pair) query = query.eq("pair", data.pair);
    if (data.analysis_id) query = query.eq("analysis_id", data.analysis_id);
    if (data.pinnedOnly) query = query.eq("is_pinned", true);
    if (data.mood) query = query.eq("mood", data.mood);
    if (data.tags && data.tags.length > 0) {
      query = query.overlaps("tags", data.tags);
    }

    const { data: notes, error } = await query;
    if (error) throw new Error(error.message);
    return notes ?? [];
  });

// ---------- UPDATE NOTE ----------
export const updateNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        noteId: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().max(10000).optional(),
        tags: z.array(z.string().max(30)).max(10).optional(),
        mood: z.enum(["confident", "cautious", "anxious", "neutral"]).optional(),
        is_pinned: z.boolean().optional(),
        pair: z.string().max(30).optional().nullable(),
        analysis_id: z.string().uuid().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: {
      title?: string;
      content?: string;
      tags?: string[];
      mood?: Mood;
      is_pinned?: boolean;
      pair?: string | null;
      analysis_id?: string | null;
    } = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.content !== undefined) update.content = data.content;
    if (data.tags !== undefined) update.tags = data.tags;
    if (data.mood !== undefined) update.mood = data.mood;
    if (data.is_pinned !== undefined) update.is_pinned = data.is_pinned;
    if (data.pair !== undefined) update.pair = data.pair;
    if (data.analysis_id !== undefined) update.analysis_id = data.analysis_id;

    const { error } = await context.supabase
      .from("trading_notes")
      .update(update)
      .eq("id", data.noteId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- DELETE NOTE ----------
export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trading_notes")
      .delete()
      .eq("id", data.noteId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- GET NOTES BY PAIR ----------
export const getNotesByPair = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ pair: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: notes, error } = await context.supabase
      .from("trading_notes")
      .select("*")
      .eq("user_id", context.userId)
      .eq("pair", data.pair)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return notes ?? [];
  });

// ---------- GET NOTES BY ANALYSIS ----------
export const getNotesByAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ analysisId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: notes, error } = await context.supabase
      .from("trading_notes")
      .select("*")
      .eq("user_id", context.userId)
      .eq("analysis_id", data.analysisId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return notes ?? [];
  });
