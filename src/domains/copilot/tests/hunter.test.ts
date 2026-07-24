import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildHunterSystemPrompt,
  buildHunterUserMessage,
  parseHunterResponse,
} from "../server/hunter.agent";

// ── Mock Decision Store ──
vi.mock("../server/decision-store", () => ({
  storeDecision: vi.fn().mockResolvedValue({ id: "test-decision-id", success: true }),
}));

describe("Hunter Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Prompt Building ──
  describe("buildHunterSystemPrompt", () => {
    it("returns a non-empty system prompt", () => {
      const prompt = buildHunterSystemPrompt();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain("VIXOR Smart Money Hunter");
      expect(prompt).toContain("score");
      expect(prompt).toContain("smart money");
    });

    it("includes scoring guidelines", () => {
      const prompt = buildHunterSystemPrompt();
      expect(prompt).toContain("+30");
      expect(prompt).toContain("3+");
      expect(prompt).toContain("strong_buy");
    });
  });

  // ── User Message Building ──
  describe("buildHunterUserMessage", () => {
    it("includes token and chain info", () => {
      const msg = buildHunterUserMessage({
        token: "PEPE",
        chain: "Ethereum",
        smartMoneyActivity: "3 whale wallets bought",
        priceData: "$0.00001234, +15% 24h",
        volumeData: "$89M volume, 4x average",
      });
      expect(msg).toContain("PEPE");
      expect(msg).toContain("Ethereum");
      expect(msg).toContain("3 whale wallets bought");
      expect(msg).toContain("$0.00001234");
      expect(msg).toContain("$89M volume");
    });

    it("handles missing optional data", () => {
      const msg = buildHunterUserMessage({
        token: "DOGE",
        chain: "Ethereum",
        smartMoneyActivity: "",
        priceData: "",
        volumeData: "",
      });
      expect(msg).toContain("DOGE");
      expect(msg).toContain("No smart money data available");
      expect(msg).toContain("No price data available");
      expect(msg).toContain("No volume data available");
    });
  });

  // ── Response Parsing ──
  describe("parseHunterResponse", () => {
    it("parses valid JSON with strong_buy signal", () => {
      const raw = JSON.stringify({
        score: 85,
        signal: "strong_buy",
        reasoning: "3 whale wallets accumulated. Volume spike detected.",
        wallets: ["addr1", "addr2", "addr3"],
      });

      const result = parseHunterResponse(raw, "test-id");

      expect(result.decisionId).toBe("test-id");
      expect(result.score).toBe(85);
      expect(result.signal).toBe("strong_buy");
      expect(result.reasoning).toContain("whale");
      expect(result.wallets).toHaveLength(3);
      expect(result.confidence).toBe(0.85);
    });

    it("parses valid JSON with hold signal", () => {
      const raw = JSON.stringify({
        score: 45,
        signal: "hold",
        reasoning: "Mixed signals, insufficient data.",
        wallets: [],
      });

      const result = parseHunterResponse(raw, "test-id");
      expect(result.score).toBe(45);
      expect(result.signal).toBe("hold");
    });

    it("maps score to signal when signal is invalid", () => {
      const raw = JSON.stringify({
        score: 90,
        signal: "invalid_signal",
        reasoning: "Test",
      });

      const result = parseHunterResponse(raw, "test-id");
      expect(result.signal).toBe("strong_buy");
    });

    it("parses JSON with code fences", () => {
      const raw = '```json\n{"score": 72, "signal": "buy", "reasoning": "Good setup"}\n```';

      const result = parseHunterResponse(raw, "test-id");
      expect(result.score).toBe(72);
      expect(result.signal).toBe("buy");
    });

    it("falls back for invalid JSON", () => {
      const result = parseHunterResponse("not json at all", "test-id");
      expect(result.score).toBe(50);
      expect(result.signal).toBe("hold");
      expect(result.confidence).toBe(0.2);
      expect(result.wallets).toEqual([]);
    });

    it("clamps score to 0-100", () => {
      const result = parseHunterResponse(JSON.stringify({ score: -10 }), "test-id");
      expect(result.score).toBe(0);

      const result2 = parseHunterResponse(JSON.stringify({ score: 200 }), "test-id");
      expect(result2.score).toBe(100);
    });

    it("filters non-string wallets", () => {
      const raw = JSON.stringify({
        score: 60,
        signal: "buy",
        reasoning: "Test",
        wallets: ["addr1", 123, null, "addr2", {}, "addr3"],
      });

      const result = parseHunterResponse(raw, "test-id");
      expect(result.wallets).toEqual(["addr1", "addr2", "addr3"]);
    });

    it("defaults missing fields", () => {
      const result = parseHunterResponse(JSON.stringify({}), "test-id");
      expect(result.score).toBe(50);
      expect(result.signal).toBe("hold");
      expect(result.reasoning).toContain("50");
    });
  });
});
