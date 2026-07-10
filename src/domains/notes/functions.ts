import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

export const getNotesByAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ analysisId: z.string() }))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("trading_notes")
      .select("*")
      .eq("analysis_id", data.analysisId)
      .order("created_at", { ascending: false });
    return (rows as unknown[]) as any[];
  });

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      analysisId: z.string(),
      content: z.string().min(1),
      mood: z.string().default("neutral"),
      title: z.string().optional(),
      pair: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("trading_notes")
      .insert({
        user_id: context.userId,
        analysisId: data.analysisId,
        title: data.title ?? "",
        content: data.content,
        mood: data.mood || "neutral",
        pair: data.pair ?? "",
        tags: data.tags ?? [],
        is_pinned: false,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      noteId: z.string(),
      content: z.string().optional(),
      mood: z.string().optional(),
      title: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      is_pinned: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.content !== undefined) updates.content = data.content;
    if (data.mood !== undefined) updates.mood = data.mood;
    if (data.title !== undefined) updates.title = data.title ?? null;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.is_pinned !== undefined) updates.is_pinned = data.is_pinned;
    await context.supabase
      .from("trading_notes")
      .update(updates as any)
      .eq("id", data.noteId)
      .eq("user_id", context.userId);
    return { success: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ noteId: z.string() }))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("trading_notes")
      .delete()
      .eq("id", data.noteId)
      .eq("user_id", context.userId);
    return { success: true };
  });
