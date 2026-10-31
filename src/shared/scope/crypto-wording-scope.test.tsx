// ============================================================================
// S1-1 (TASK 38) — Research-language presentation scope regression.
// Proves:
//   1. VIXOR does not present BUY/SELL recommendations as user trading
//      instructions (badges, share copy, i18n, feed/sheet labels).
//   2. Whale BUY/SELL events remain available as wallet intelligence.
//   3. No user trade record or execution is created from a whale event
//      (whale surfaces never import the trades/execution domains).
// Machine-readable BUY|SELL|WAIT values remain as historical data
// identifiers (DB CHECK constraint, API payloads) by design decision S1-1.
// ============================================================================
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SignalBadge from "@/components/vixor/SignalBadge";
import { RecBadge } from "@/components/vixor/atoms";
import {
  formatSignalText,
  formatSignalTelegramHtml,
  researchDirectionLabel,
} from "@/shared/share/format-signal";
import enTranslations from "@/shared/i18n/translations/en";
import arTranslations from "@/shared/i18n/translations/ar";

const SRC = join(__dirname, "../..");
const readSrc = (rel: string) => readFileSync(join(SRC, rel), "utf8");

describe("S1-1: signal presentation uses neutral research language", () => {
  it("SignalBadge renders BULLISH/BEARISH/NEUTRAL — never BUY/SELL instructions", () => {
    const { container, unmount } = render(<SignalBadge signal="BUY" />);
    expect(screen.getByText("BULLISH")).toBeTruthy();
    expect(container.textContent).not.toMatch(/\bBUY\b/);
    unmount();

    const { container: c2, unmount: u2 } = render(<SignalBadge signal="SELL" />);
    expect(screen.getByText("BEARISH")).toBeTruthy();
    expect(c2.textContent).not.toMatch(/\bSELL\b/);
    u2();

    const { container: c3, unmount: u3 } = render(<SignalBadge signal="WAIT" />);
    expect(screen.getByText("NEUTRAL")).toBeTruthy();
    u3();

    const { container: c4, unmount: u4 } = render(<SignalBadge signal="STRONG_BUY" />);
    expect(screen.getByText("STRONG BULLISH")).toBeTruthy();
    expect(c4.textContent).not.toMatch(/\bBUY\b/);
    u4();

    const { container: c5, unmount: u5 } = render(<SignalBadge signal="STRONG_SELL" />);
    expect(screen.getByText("STRONG BEARISH")).toBeTruthy();
    expect(c5.textContent).not.toMatch(/\bSELL\b/);
    u5();
  });

  it("RecBadge maps every machine value to a research label", () => {
    const cases: Array<["BUY" | "SELL" | "WAIT", string]> = [
      ["BUY", "BULLISH"],
      ["SELL", "BEARISH"],
      ["WAIT", "NEUTRAL"],
    ];
    for (const [rec, label] of cases) {
      const { unmount } = render(<RecBadge rec={rec} />);
      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    }
  });

  it("share copy contains no BUY/SELL instructions and carries research attribution", () => {
    const signal = {
      pair: "BTC/USDT",
      direction: "BUY" as const,
      confidence: 82,
      entry: 100000,
      stopLoss: 97000,
      takeProfit: [105000, 110000],
    };
    for (const text of [formatSignalText(signal), formatSignalTelegramHtml(signal)]) {
      expect(text).toMatch(/\bBULLISH\b/);
      expect(text).not.toMatch(/\b(BUY|SELL)\b/);
      expect(text).toContain("Not financial advice");
      expect(text).not.toMatch(/Trade Intelligence/);
    }
    expect(researchDirectionLabel("SELL")).toBe("BEARISH");
    expect(researchDirectionLabel("WAIT")).toBe("NEUTRAL");
  });

  it("i18n signals labels are research language (en + ar)", () => {
    expect((enTranslations as any).signals.buy).toBe("Bullish");
    expect((enTranslations as any).signals.sell).toBe("Bearish");
    expect((enTranslations as any).signals.wait).toBe("Neutral");
    expect((arTranslations as any).signals.buy).toBe("صاعد");
    expect((arTranslations as any).signals.sell).toBe("هابط");
    expect((arTranslations as any).signals.wait).toBe("محايد");
  });

  it("SmartBottomSheet and UnifiedFeed no longer render شراء/بيع instructions", () => {
    const sheet = readSrc("components/vixor/SmartBottomSheet.tsx");
    expect(sheet).toContain("اتجاه صاعد");
    expect(sheet).toContain("اتجاه هابط");
    expect(sheet).not.toMatch(/>\s*شراء\s*</);
    expect(sheet).not.toMatch(/>\s*بيع\s*</);
    const feed = readSrc("components/vixor/UnifiedFeed.tsx");
    expect(feed).toContain("اتجاه صاعد");
    expect(feed).not.toMatch(/>\s*شراء\s*</);
  });
});

describe("S1-1: whale BUY/SELL stays wallet intelligence, not user trading", () => {
  it("APP whale page preserves on-chain BUY/SELL/TRANSFER event typing", () => {
    const whales = readSrc("routes/_authenticated/hunt/whales.tsx");
    expect(whales).toContain('type TradeType = "BUY" | "SELL" | "TRANSFER"');
  });

  it("whale surfaces never import trades/execution domains (no user trade record or execution from a whale event)", () => {
    const whales = readSrc("routes/_authenticated/hunt/whales.tsx");
    expect(whales).not.toMatch(/from "@\/domains\/trades/);
    expect(whales).not.toMatch(/from "@\/domains\/trading/);
    expect(whales).not.toMatch(/executeTrade|createTrade|swapTransaction/i);
    // whale page is read-only intelligence: the hunt domain has no execution
    const huntDomain = readSrc("domains/hunt/functions.ts");
    expect(huntDomain).not.toMatch(
      /executeTrade|createTrade|getJupiterSwapTransaction|get1inchSwapTransaction/,
    );
  });
});
