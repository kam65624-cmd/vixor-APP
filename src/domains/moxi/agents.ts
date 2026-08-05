// ============================================================================
// MOXI — AI Agent Server Functions (Coach, Analyst, Governor, Hunter)
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

import type {
  CoachInput,
  CoachResponse,
  GovernorInput,
  RiskDecision,
  HunterInput,
  HunterScore,
  AnalystReport,
} from "./types";

// ---------- COACH: Real-time Trade Coaching ----------
export const coachTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(1).max(50),
        action: z.enum(["buy", "sell"]),
        amount: z.number().positive(),
        chain: z.string().min(1).max(50),
        currentPrice: z.number().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<CoachResponse> => {
    const { userId } = context;
    const input: CoachInput = { userId, ...data };
    const { coachTrade: runCoach } = await import("./server/coach.agent");
    return runCoach(input);
  });

// ---------- GOVERNOR: Risk Assessment ----------
export const assessRisk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        action: z.enum(["buy", "sell"]),
        token: z.string().min(1).max(50),
        amount: z.number().positive(),
        currentPrice: z.number().positive(),
        portfolioValue: z.number().min(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<RiskDecision> => {
    const { userId } = context;
    const input: GovernorInput = { userId, ...data };
    const { assessRisk: runGovernor } = await import("./server/governor.agent");
    return runGovernor(input);
  });

// ---------- HUNTER: Smart Money Scoring ----------
export const scoreOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(1).max(50),
        chain: z.string().min(1).max(50),
        smartMoneyActivity: z.string().max(4000).optional().default(""),
        priceData: z.string().max(4000).optional().default(""),
        volumeData: z.string().max(4000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<HunterScore> => {
    const { userId } = context;
    const input: HunterInput = {
      token: data.token,
      chain: data.chain,
      smartMoneyActivity: data.smartMoneyActivity,
      priceData: data.priceData,
      volumeData: data.volumeData,
    };
    const { scoreOpportunity: runHunter } = await import("./server/hunter.agent");
    return runHunter(input, { userId });
  });

// ---------- ANALYST: Weekly Behavioral Report ----------
export const generateWeeklyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({}).parse(d))
  .handler(async ({ context }): Promise<AnalystReport> => {
    const { userId } = context;
    const { generateWeeklyReport: runAnalyst } = await import("./server/analyst.agent");
    return runAnalyst(userId);
  });

// ---------- FEEDBACK: Accept/Reject Agent Decision ----------
export const submitDecisionFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        feedback: z.enum(["accepted", "rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { recordFeedback } = await import("./server/feedback");
    return recordFeedback(data.decisionId, userId, data.feedback);
  });

// ---------- DECISIONS: Get recent decisions for a user ----------
export const getRecentDecisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        limit: z.number().min(1).max(50).default(20),
        agentId: z.enum(["coach", "analyst", "governor", "hunter"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    let query = supabaseAdmin
      .from("vixor_decisions")
      .select(
        "id, agent_id, decision_type, title, description, data, confidence, severity, token_symbol, feedback, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data.agentId) {
      query = query.eq("agent_id", data.agentId);
    }

    const { data: decisions, error } = await query.limit(data.limit);

    if (error) {
      console.error(`[Decisions] Fetch error: ${error.message}`);
      return { decisions: [], error: error.message };
    }

    return { decisions: decisions || [] };
  });
