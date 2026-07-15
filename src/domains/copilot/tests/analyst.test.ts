import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildAnalystSystemPrompt,
  buildAnalystUserMessage,
  parseAnalystResponse,
} from "../server/analyst.agent";

// ── Mock Memory Store ──
vi.mock("@/shared/memory", () => ({
  MemoryStore: {
    contextForPrompt: vi
      .fn()
      .mockResolvedValue("User prefers scalping, tends to overtrade after losses."),
  },
}));

// ── Mock Decision Store ──
vi.mock("../server/decision-store", () => ({
  storeDecision: vi.fn().mockResolvedValue({ id: "test-decision-id", success: true }),
}));

// ── Mock Supabase ──
vi.mock("@/shared/supabase/client.server", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            count: 12,
            error: null,
          }),
        }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    }),
  },
}));

describe("Analyst Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Prompt Building ──
  describe("buildAnalystSystemPrompt", () => {
    it("returns a non-empty system prompt", () => {
      const prompt = buildAnalystSystemPrompt();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain("VIXOR Behavioral Analyst");
      expect(prompt).toContain("behavioral finance");
    });

    it("specifies all 4 output fields", () => {
      const prompt = buildAnalystSystemPrompt();
      expect(prompt).toContain("statsSummary");
      expect(prompt).toContain("behavioralPatterns");
      expect(prompt).toContain("recommendations");
      expect(prompt).toContain("learningResources");
    });

    it("includes formatting rules", () => {
      const prompt = buildAnalystSystemPrompt();
      expect(prompt).toContain("3-5 sentences");
      expect(prompt).toContain("bullet points");
      expect(prompt).toContain("actionable");
    });
  });

  // ── User Message Building ──
  describe("buildAnalystUserMessage", () => {
    it("includes activity stats", () => {
      const msg = buildAnalystUserMessage("User memories here...", 15, 8, 25000);
      expect(msg).toContain("15");
      expect(msg).toContain("8");
      expect(msg).toContain("$25,000");
      expect(msg).toContain("User memories here...");
    });

    it("includes date range", () => {
      const msg = buildAnalystUserMessage("", 0, 0, 0);
      expect(msg).toContain("Report period:");
    });
  });

  // ── Response Parsing ──
  describe("parseAnalystResponse", () => {
    it("parses valid JSON response", () => {
      const raw = JSON.stringify({
        statsSummary: "Win rate of 62% with 8 trades. Average profit of $150 per trade.",
        behavioralPatterns:
          "- Good discipline on stop losses\n- Tends to overtrade after losses\n- Strong analysis on BTC setups",
        recommendations:
          "1. Set max 3 trades per day\n2. Wait 30 min after a loss before re-entering",
        learningResources: "Study risk-reward optimization and position sizing.",
      });

      const result = parseAnalystResponse(raw, "test-id");

      expect(result.decisionId).toBe("test-id");
      expect(result.statsSummary).toContain("62%");
      expect(result.behavioralPatterns).toContain("overtrade");
      expect(result.recommendations).toContain("3 trades");
      expect(result.learningResources).toContain("risk-reward");
      expect(result.confidence).toBe(0.8);
    });

    it("parses JSON with code fences", () => {
      const raw =
        '```json\n{"statsSummary": "Good week", "behavioralPatterns": "Disciplined", "recommendations": "Keep it up", "learningResources": "None"}\n```';

      const result = parseAnalystResponse(raw, "test-id");
      expect(result.statsSummary).toBe("Good week");
    });

    it("falls back for invalid JSON", () => {
      const result = parseAnalystResponse("broken json", "test-id");
      expect(result.statsSummary).toContain("could not be generated");
      expect(result.behavioralPatterns).toContain("unavailable");
      expect(result.confidence).toBe(0.3);
    });

    it("defaults missing fields", () => {
      const result = parseAnalystResponse(JSON.stringify({}), "test-id");
      expect(result.statsSummary).toBe("Stats summary unavailable.");
      expect(result.recommendations).toBe("No recommendations available.");
    });

    it("handles partial data", () => {
      const result = parseAnalystResponse(
        JSON.stringify({ statsSummary: "Partial data only" }),
        "test-id",
      );
      expect(result.statsSummary).toBe("Partial data only");
      expect(result.behavioralPatterns).toBe("No behavioral patterns identified.");
    });
  });
});
