// Feedback recording for MOXI agent decisions
export async function recordFeedback(
  decisionId: string,
  _userId: string,
  feedback: { rating?: number; comment?: string } | string,
): Promise<{ success: boolean }> {
  // Accepts either object or string ("accepted"/"rejected")
  const fb =
    typeof feedback === "string"
      ? { rating: feedback === "accepted" ? 5 : 2, comment: feedback }
      : feedback;
  console.log(`[MOXI] Feedback recorded for ${decisionId}:`, fb);
  return { success: true };
}
