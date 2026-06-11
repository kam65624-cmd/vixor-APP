// ============================================================================
// Vixor Debate Engine — Core Engine
// ============================================================================
//
// Runs the multi-agent debate:
//   1. Collect votes from all 4 agents (Analyst, Strategist, RiskGuard, Contrarian)
//   2. Calculate weighted scores per side (BULL, BEAR, NEUTRAL)
//   3. Winner = side with highest weighted score
//   4. Final confidence = winner's share of total score (as percentage)
//   5. Consensus = 3+ agents agree
//   6. Risk override = RiskGuard vetoed a HIGH risk signal
//
// The engine NEVER throws — all errors are caught and produce a fallback result.
// ============================================================================

import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";
import type { AgentSide, AgentVote, DebateResult } from "../types";
import { analystVote } from "../agents/analyst.agent";
import { strategistVote } from "../agents/strategist.agent";
import { riskGuardVote } from "../agents/risk-guard.agent";
import { contrarianVote } from "../agents/contrarian.agent";

export class DebateEngine {
  /**
   * Run the multi-agent debate on an analysis result.
   * Never throws — returns a fallback DebateResult on error.
   */
  async run(result: AnalysisResult): Promise<DebateResult> {
    try {
      // ── Step 1: Collect votes from all agents ──
      const votes: AgentVote[] = [
        analystVote(result),
        strategistVote(result),
        riskGuardVote(result),
        contrarianVote(result),
      ];

      // ── Step 2: Calculate weighted scores per side ──
      const sideScores: Record<AgentSide, number> = {
        BULL: 0,
        BEAR: 0,
        NEUTRAL: 0,
      };

      for (const vote of votes) {
        sideScores[vote.side] += vote.confidence * vote.weight;
      }

      // ── Step 3: Determine winner ──
      const totalScore = sideScores.BULL + sideScores.BEAR + sideScores.NEUTRAL;
      const sortedSides = (["BULL", "BEAR", "NEUTRAL"] as AgentSide[]).sort(
        (a, b) => sideScores[b] - sideScores[a],
      );
      const winner = sortedSides[0];

      // ── Step 4: Calculate final confidence ──
      const finalConfidence = totalScore > 0
        ? Math.round((sideScores[winner] / totalScore) * 100)
        : 0;

      // ── Step 5: Check consensus ──
      const winnerVoteCount = votes.filter((v) => v.side === winner).length;
      const consensus = winnerVoteCount >= 3;

      // ── Step 6: Check risk override ──
      const riskGuard = votes.find((v) => v.agent === "RiskGuard")!;
      const riskOverride =
        riskGuard.side === "NEUTRAL" && result.risk_level === "HIGH";

      // ── Step 7: Build summary ──
      const summary = buildSummary(votes, winner, winnerVoteCount, riskOverride, finalConfidence);

      return {
        finalSide: winner,
        finalConfidence,
        consensus,
        riskOverride,
        votes,
        summary,
      };
    } catch (err) {
      // NEVER throw — return a safe fallback
      console.error(
        "[DebateEngine] Debate failed, returning fallback:",
        err instanceof Error ? err.message : String(err),
      );
      return {
        finalSide: "NEUTRAL",
        finalConfidence: 0,
        consensus: false,
        riskOverride: false,
        votes: [],
        summary: "Debate engine encountered an error — no consensus reached.",
      };
    }
  }
}

/**
 * Build a human-readable summary of the debate outcome.
 */
function buildSummary(
  votes: AgentVote[],
  winner: AgentSide,
  winnerVoteCount: number,
  riskOverride: boolean,
  finalConfidence: number,
): string {
  const parts: string[] = [];

  // Consensus indicator
  if (winnerVoteCount >= 3) {
    parts.push(`${winnerVoteCount}/4 agents agree: ${winner}`);
  } else if (winnerVoteCount === 2) {
    parts.push(`Split decision: ${winner} leads with 2/4 votes`);
  } else {
    parts.push(`No clear consensus — ${winner} has only 1/4 votes`);
  }

  // Risk guard note
  const riskGuard = votes.find((v) => v.agent === "RiskGuard");
  if (riskOverride) {
    parts.push("RiskGuard: VETO (high risk)");
  } else if (riskGuard?.side === "NEUTRAL") {
    parts.push("RiskGuard: caution");
  }

  // Confidence
  parts.push(`confidence: ${finalConfidence}%`);

  return parts.join(" | ");
}
