import { describe, it, expect, vi, beforeEach } from "vitest";
import { withAlpha, blendWithCard } from "./color-utils";

describe("color-utils", () => {
  beforeEach(() => {
    // Default to dark mode
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  });

  describe("withAlpha", () => {
    it("returns rgba for known bullish var in dark mode", () => {
      const result = withAlpha("var(--color-bullish)", 0.2);
      expect(result).toBe("rgba(34,211,166,0.2)");
    });

    it("returns rgba for known bearish var in dark mode", () => {
      const result = withAlpha("var(--color-bearish)", 0.5);
      expect(result).toBe("rgba(251,70,103,0.5)");
    });

    it("returns rgba for bare var name (without var())", () => {
      const result = withAlpha("--color-bullish", 0.1);
      expect(result).toBe("rgba(34,211,166,0.1)");
    });

    it("returns rgba for known var in light mode", () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      const result = withAlpha("var(--color-bullish)", 0.3);
      expect(result).toBe("rgba(5,150,105,0.3)");
    });

    it("falls back to color-mix for unknown vars", () => {
      const result = withAlpha("var(--color-unknown)", 0.15);
      expect(result).toContain("color-mix");
      expect(result).toContain("15%");
    });
  });

  describe("blendWithCard", () => {
    it("blends bullish with dark card background", () => {
      const result = blendWithCard("var(--color-bullish)", 0.1);
      // card = [16,17,20], bullish = [34,211,166]
      // r = 16 + 0.1 * (34-16) = 17.8 → 18
      // g = 17 + 0.1 * (211-17) = 36.4 → 36
      // b = 20 + 0.1 * (166-20) = 34.6 → 35
      expect(result).toBe("rgb(18,36,35)");
    });

    it("blends bearish with dark card background", () => {
      const result = blendWithCard("var(--color-bearish)", 0.2);
      // card = [16,17,20], bearish = [251,70,103]
      // r = 16 + 0.2 * (251-16) = 63 → 63
      // g = 17 + 0.2 * (70-17) = 27.6 → 28
      // b = 20 + 0.2 * (103-20) = 36.6 → 37
      expect(result).toBe("rgb(63,28,37)");
    });

    it("falls back to color-mix for unknown vars", () => {
      const result = blendWithCard("var(--color-unknown)", 0.15);
      expect(result).toContain("color-mix");
    });
  });
});
