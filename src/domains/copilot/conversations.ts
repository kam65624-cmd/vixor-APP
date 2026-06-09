// ============================================================================
// Copilot Domain — Conversation Persistence Server Functions
// ============================================================================
//
// CRUD operations for copilot_conversations and copilot_messages tables.
// Supports chat persistence with multi-agent and consensus modes.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ---------- CREATE CONVERSATION ----------
export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        agent_id: z
          .enum(["auto", "market_analyst", "risk_manager", "news_analyst", "strategy_builder"])
          .default("auto"),
        is_consensus: z.boolean().default(false),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: conversation, error } = await supabase
      .from("copilot_conversations")
      .insert({
        user_id: userId,
        agent_id: data.agent_id,
        is_consensus: data.is_consensus,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return conversation;
  });

// ---------- LIST CONVERSATIONS ----------
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        limit: z.number().min(1).max(100).default(50),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: conversations, error } = await supabase
      .from("copilot_conversations")
      .select("id, title, agent_id, is_consensus, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return conversations ?? [];
  });

// ---------- GET CONVERSATION (with messages) ----------
export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch conversation (RLS ensures user ownership)
    const { data: conversation, error: convError } = await supabase
      .from("copilot_conversations")
      .select("*")
      .eq("id", data.conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (convError) throw new Error(convError.message);
    if (!conversation) throw new Error("Conversation not found");

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from("copilot_messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (msgError) throw new Error(msgError.message);

    return { ...conversation, messages: messages ?? [] };
  });

// ---------- SAVE MESSAGE ----------
export const saveMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        conversation_id: z.string().uuid(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(10000),
        agent_id: z.string().optional().nullable(),
        metadata: z
          .object({
            consensusData: z
              .object({
                responses: z.array(
                  z.object({
                    agent: z.string(),
                    response: z.string(),
                  }),
                ),
                synthesis: z.string(),
              })
              .optional(),
          })
          .passthrough()
          .optional()
          .nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: message, error } = await supabase
      .from("copilot_messages")
      .insert({
        conversation_id: data.conversation_id,
        role: data.role,
        content: data.content,
        agent_id: data.agent_id ?? null,
        metadata: (data.metadata ?? {}) as any,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Touch the conversation's updated_at
    await supabase
      .from("copilot_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversation_id);

    return message;
  });

// ---------- DELETE CONVERSATION ----------
export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("copilot_conversations")
      .delete()
      .eq("id", data.conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- UPDATE CONVERSATION TITLE ----------
export const updateConversationTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        title: z.string().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("copilot_conversations")
      .update({ title: data.title })
      .eq("id", data.conversationId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
