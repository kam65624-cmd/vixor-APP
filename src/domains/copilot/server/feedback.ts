// ============================================================================
// VIXOR AI Agents — Feedback Loop
// ============================================================================
//
// Allows users to accept or reject agent decisions, creating a learning loop
// that improves future agent accuracy.
// ============================================================================

import { supabaseAdmin } from "@/shared/supabase/client.server";

/**
 * Records user feedback on an agent decision.
 * Updates the feedback column in vixor_decisions.
 *
 * @param decisionId - The ID of the decision to update
 * @param userId - The user ID (for ownership verification)
 * @param feedback - The feedback value: "accepted" or "rejected"
 * @throws Error if the decision is not found or doesn't belong to the user
 */
export async function recordFeedback(
  decisionId: string,
  userId: string,
  feedback: "accepted" | "rejected",
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the decision belongs to this user
    const { data: decision, error: fetchError } = await supabaseAdmin
      .from("vixor_decisions")
      .select("id, user_id")
      .eq("id", decisionId)
      .maybeSingle();

    if (fetchError) {
      console.error(`[Feedback] Fetch error: ${fetchError.message}`);
      return { success: false, error: fetchError.message };
    }

    if (!decision) {
      return { success: false, error: "Decision not found." };
    }

    if (decision.user_id !== userId) {
      return { success: false, error: "Unauthorized: decision does not belong to this user." };
    }

    // Update the feedback
    const { error: updateError } = await supabaseAdmin
      .from("vixor_decisions")
      .update({ feedback })
      .eq("id", decisionId)
      .eq("user_id", userId);

    if (updateError) {
      console.error(`[Feedback] Update error: ${updateError.message}`);
      return { success: false, error: updateError.message };
    }

    // Learn from the feedback using MemoryStore
    try {
      const { MemoryStore } = await import("@/shared/memory");

      // Fetch the decision details for learning
      const { data: fullDecision } = await supabaseAdmin
        .from("vixor_decisions")
        .select("agent_id, decision_type, data, token_symbol")
        .eq("id", decisionId)
        .maybeSingle();

      if (fullDecision) {
        const decisionData = fullDecision.data as Record<string, unknown> | null;
        const learningKey = `feedback_${fullDecision.agent_id}_${fullDecision.decision_type}`;

        await MemoryStore.learn(
          userId,
          "insight",
          learningKey,
          {
            decisionId,
            feedback,
            agent: fullDecision.agent_id,
            type: fullDecision.decision_type,
            token: fullDecision.token_symbol,
            context: decisionData,
            timestamp: new Date().toISOString(),
          },
          "agent_feedback",
        );
      }
    } catch {
      // Learning from feedback is non-critical — don't fail the main operation
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Feedback] Error:", message);
    return { success: false, error: message };
  }
}

/**
 * Accepts a decision — records "accepted" feedback.
 *
 * @param decisionId - The ID of the decision to accept
 * @param userId - The user ID (for ownership verification)
 */
export async function acceptDecision(
  decisionId: string,
  userId: string,
): Promise<void> {
  const result = await recordFeedback(decisionId, userId, "accepted");
  if (!result.success) {
    throw new Error(result.error || "Failed to accept decision.");
  }
}

/**
 * Rejects a decision — records "rejected" feedback.
 *
 * @param decisionId - The ID of the decision to reject
 * @param userId - The user ID (for ownership verification)
 */
export async function rejectDecision(
  decisionId: string,
  userId: string,
): Promise<void> {
  const result = await recordFeedback(decisionId, userId, "rejected");
  if (!result.success) {
    throw new Error(result.error || "Failed to reject decision.");
  }
}
