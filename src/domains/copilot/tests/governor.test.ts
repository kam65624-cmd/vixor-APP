import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildGovernorSystemPrompt,
  buildGovernorUserMessage,
  mapScoreToDecision,
  parseGovernorResponse,
  buildRiskProfile,
} from "../server/governor.agent";

// ── Mock LLM Router ──
const mockLLMRouter = {
  chat: vi.fn(),
};

// ── Mock Memory Store ──
vi.mock("@/shared/memory", () => ({
  MemoryStore: {
    contextForPrompt: vi.fn().mockResolvedValue("No stored memories for this user yet."),
  },
}));

// ── Mock Decision Store ──
vi.mock("../server/decision-store", () => ({
  storeDecision: vi.fn().mockResolvedValue({ id: "test-decision-id", success: true }),
}));

describe("Governor Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Prompt Building ──
  describe("buildGovernorSystemPrompt", () => {
    it("returns a non-empty system prompt", () => {
      const prompt = buildGovernorSystemPrompt();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain("VIXOR Risk Governor");
      expect(prompt).toContain("riskScore");
    });

    it("includes scoring guidelines", () => {
      const prompt = buildGovernorSystemPrompt();
      expect(prompt).toContain("+30");
      expect(prompt).toContain("10%");
    });
  });

  // ── User Message Building ──
  describe("buildGovernorUserMessage", () => {
    it("includes trade parameters", () => {
      const msg = buildGovernorUserMessage(
        {
          action: "buy",
          token: "BTC",
          amount: 0.5,
          currentPrice: 65000,
          portfolioValue: 100000,
        },
        buildRiskProfile("No memories"),
      );
      expect(msg).toContain("BTC");
      expect(msg).toContain("BUY");
      expect(msg).toContain("$32,500");
      expect(msg).toContain("32.50%");
    });

    it("handles zero portfolio value", () => {
      const msg = buildGovernorUserMessage(
        {
          action: "sell",
          token: "ETH",
          amount: 1,
          currentPrice: 3000,
          portfolioValue: 0,
        },
        buildRiskProfile("No memories"),
      );
      expect(msg).toContain("unknown");
    });
  });

  // ── Risk Profile Builder ──
  describe("buildRiskProfile", () => {
    it("returns defaults for no memory", () => {
      const profile = buildRiskProfile("No stored memories for this user yet.");
      expect(profile.style).toBe("unknown");
      expect(profile.tolerance).toBe("medium");
    });

    it("detects scalper style", () => {
      const profile = buildRiskProfile("User prefers scalp trading on 1m timeframe");
      expect(profile.style).toBe("scalper");
    });

    it("detects aggressive risk", () => {
      const profile = buildRiskProfile("User has aggressive high risk approach");
      expect(profile.tolerance).toBe("high");
    });

    it("detects revenge trading weakness", () => {
      const profile = buildRiskProfile("User tends to chase and revenge trade after losses");
      expect(profile.weakness).toContain("Emotional trading");
    });

    it("detects discipline strength", () => {
      const profile = buildRiskProfile("User shows consistent discipline and patience");
      expect(profile.strength).toBe("Disciplined approach");
    });
  });

  // ── Score to Decision Mapping ──
  describe("mapScoreToDecision", () => {
    it("allows low scores (0-25)", () => {
      const result = mapScoreToDecision(10);
      expect(result.decision).toBe("allow");
      expect(result.severity).toBe("low");
    });

    it("warns medium scores (26-40)", () => {
      const result = mapScoreToDecision(35);
      expect(result.decision).toBe("warn");
      expect(result.severity).toBe("low");
    });

    it("warns high-medium scores (41-55)", () => {
      const result = mapScoreToDecision(50);
      expect(result.decision).toBe("warn");
      expect(result.severity).toBe("medium");
    });

    it("blocks high scores (56-70)", () => {
      const result = mapScoreToDecision(65);
      expect(result.decision).toBe("block");
      expect(result.severity).toBe("high");
    });

    it("blocks critical scores (71-100)", () => {
      const result = mapScoreToDecision(85);
      expect(result.decision).toBe("block");
      expect(result.severity).toBe("critical");
    });

    it("handles boundary at 70", () => {
      const result = mapScoreToDecision(70);
      expect(result.decision).toBe("block");
      expect(result.severity).toBe("high");
    });

    it("handles boundary at 25 (still allow)", () => {
      const result = mapScoreToDecision(25);
      expect(result.decision).toBe("allow");
      expect(result.severity).toBe("low");
    });

    it("handles boundary at 26 (first warn)", () => {
      const result = mapScoreToDecision(26);
      expect(result.decision).toBe("warn");
      expect(result.severity).toBe("low");
    });
  });

  // ── Response Parsing ──
  describe("parseGovernorResponse", () => {
    it("parses valid JSON response", () => {
      const raw = JSON.stringify({
        riskScore: 45,
        reason: "Position size is moderate.",
        suggestion: "Keep risk under 5%.",
      });

      const result = parseGovernorResponse(raw, "test-id", buildRiskProfile("No memories"), "BTC");

      expect(result.decisionId).toBe("test-id");
      expect(result.riskScore).toBe(45);
      expect(result.decision).toBe("warn");
      expect(result.severity).toBe("medium");
      expect(result.confidence).toBe(0.75);
    });

    it("parses JSON with code fences", () => {
      const raw = '```json\n{"riskScore": 20, "reason": "Low risk", "suggestion": "Go ahead."}\n```';

      const result = parseGovernorResponse(raw, "test-id", buildRiskProfile("No memories"), "ETH");
      expect(result.riskScore).toBe(20);
      expect(result.decision).toBe("allow");
    });

    it("falls back for invalid JSON", () => {
      const result = parseGovernorResponse("not json", "test-id", buildRiskProfile("No memories"), "BTC");
      expect(result.decision).toBe("warn");
      expect(result.riskScore).toBe(50);
      expect(result.confidence).toBe(0.3);
    });

    it("clamps risk score to 0-100", () => {
      const result = parseGovernorResponse(
        JSON.stringify({ riskScore: 150, reason: "Test" }),
        "test-id",
        buildRiskProfile("No memories"),
        "BTC",
      );
      expect(result.riskScore).toBe(100);
    });

    it("defaults missing fields", () => {
      const result = parseGovernorResponse(
        JSON.stringify({}),
        "test-id",
        buildRiskProfile("No memories"),
        "BTC",
      );
      expect(result.riskScore).toBe(50);
      expect(result.decision).toBe("warn");
    });
  });
});
