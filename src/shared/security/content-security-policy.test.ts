import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "./content-security-policy";

describe("Content Security Policy", () => {
  it("allows the Telegram login widget frame observed by the auth page", () => {
    expect(CONTENT_SECURITY_POLICY).toContain(
      "frame-src https://oauth.telegram.org https://telegram.org https://web.telegram.org https://t.me",
    );
  });

  it("allows the Binance market-data websocket endpoint", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("wss://stream.binance.com:9443");
  });
});
