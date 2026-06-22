// ============================================================================
// VIXOR AI Agents — Decision Storage Helper
// ============================================================================
//
// Shared utility for storing agent decisions in the vixor_decisions table.
// All agents use this to persist their decisions for the feedback loop.
// ============================================================================

import { supabaseAdmin } from "@/shared/supabase/client.server";
import type { Json } from "@/shared/supabase/types";
import type {
  VixorAgentId,
  DecisionType,
  DecisionSeverity,
} from "../types";

/** Parameters for storing a decision. */
export interface StoreDecisionParams {
  userId: string;
  agentId: VixorAgentId;
  decisionType: DecisionType;
  title: string;
  description?: string;
  data?: Json;
  confidence?: number;
  tokenSymbol?: string;
  chain?: string;
  severity?: DecisionSeverity;
  expiresAt?: string;
}

/** Result of storing a decision. */
export interface StoredDecision {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Stores an agent decision in the vixor_decisions table.
 * Uses service role key for server-side writes (bypasses RLS).
 */
export async function storeDecision(
  params: StoreDecisionParams,
): Promise<StoredDecision> {
  const {
    userId,
    agentId,
    decisionType,
    title,
    description = "",
    data = {},
    confidence = 0.5,
    tokenSymbol,
    chain,
    severity = "medium",
    expiresAt,
  } = params;

  try {
    const decisionId = crypto.randomUUID();

    const { error } = await supabaseAdmin.from("vixor_decisions").insert({
      id: decisionId,
      user_id: userId,
      agent_id: agentId,
      decision_type: decisionType,
      title,
      description,
      data,
      confidence: Math.max(0, Math.min(1, confidence)),
      token_symbol: tokenSymbol,
      chain,
      severity,
      expires_at: expiresAt || null,
    });

    if (error) {
      console.error(`[DecisionStore] Insert failed: ${error.message}`);
      return { id: decisionId, success: false, error: error.message };
    }

    return { id: decisionId, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[DecisionStore] Store error:", message);
    return { id: "", success: false, error: message };
  }
}

/**
 * Generates a unique ID for decisions (deterministic for testing).
 * Uses crypto.randomUUID() by default.
 * Exported for test mocking.
 */
export function generateDecisionId(): string {
  return crypto.randomUUID();
}
