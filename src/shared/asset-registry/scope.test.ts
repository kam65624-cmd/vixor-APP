/**
 * Stage 1 scope boundary tests (TASK 37) — VIXOR is Crypto-only.
 *
 * Proves the classifications recorded in the Stage 1 Scope Enforcement
 * Matrix (deliverable A):
 *   T-01  Crypto asset acceptance (registry + signal pipeline source)
 *   T-02  Non-crypto rejection (forex/gold/index/stock can enter nothing)
 *   T-03  Unknown asset classification (never silently valid)
 *   T-04  Meme coin acceptance (meme coins remain supported)
 *   T-06  Execution paths stay blocked (executeTrade, swap builders)
 *   T-05  Entry-point guards present (watchlist, trade journal)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AssetRegistry, POPULAR_PAIRS, ALL_KNOWN_PAIRS } from "./index";

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("T-01 crypto asset acceptance", () => {
  it("resolves canonical crypto pairs as active crypto assets", () => {
    for (const pair of ["BTC/USDT", "ETH/USDT", "SOL/USDT"]) {
      const asset = AssetRegistry.get(pair);
      expect(asset.category).toBe("crypto");
      expect(asset.active).toBe(true);
    }
  });

  it("signal generation pairs are crypto-only and non-empty", () => {
    const pairs = AssetRegistry.signalPairs();
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      expect(AssetRegistry.isCrypto(pair)).toBe(true);
    }
  });

  it("assertCryptoPair accepts crypto pairs (case/whitespace tolerant)", () => {
    expect(AssetRegistry.assertCryptoPair("BTC/USDT").pair).toBe("BTC/USDT");
    expect(AssetRegistry.assertCryptoPair(" btc/usdt ").pair).toBe("BTC/USDT");
  });
});

describe("T-02 non-crypto asset rejection", () => {
  const NON_CRYPTO = [
    "XAU/USD", // gold commodity
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "GBP/JPY",
    "AUD/USD",
    "NZD/USD",
    "USD/CAD",
    "USD/CHF",
    "EUR/GBP",
    "EUR/JPY", // forex
    "NASDAQ", // index
    "AAPL", // stock
  ];

  it("deactivates every forex/commodity/index/stock definition", () => {
    for (const pair of NON_CRYPTO) {
      const asset = AssetRegistry.find(pair);
      expect(asset, pair).toBeDefined();
      expect(asset!.active, `${pair} must be inactive`).toBe(false);
      expect(asset!.category, `${pair} must not be crypto`).not.toBe("crypto");
    }
  });

  it("excludes non-crypto from pairs, popular, signals and cache lists", () => {
    const active = new Set(AssetRegistry.pairs());
    const popular = new Set(AssetRegistry.popularPairs());
    const signals = new Set(AssetRegistry.signalPairs());
    const cacheable = new Set(AssetRegistry.cacheablePairs());
    for (const pair of NON_CRYPTO) {
      expect(active.has(pair), pair).toBe(false);
      expect(popular.has(pair), pair).toBe(false);
      expect(signals.has(pair), pair).toBe(false);
      expect(cacheable.has(pair), pair).toBe(false);
    }
  });

  it("POPULAR_PAIRS export is crypto-only", () => {
    expect(POPULAR_PAIRS.map((p) => p.pair)).not.toContain("XAU/USD");
    expect(POPULAR_PAIRS.map((p) => p.pair)).not.toContain("EUR/USD");
    for (const p of POPULAR_PAIRS) expect(AssetRegistry.isCrypto(p.pair)).toBe(true);
  });

  it("ALL_KNOWN_PAIRS export is crypto-only", () => {
    for (const pair of ALL_KNOWN_PAIRS) expect(AssetRegistry.isCrypto(pair)).toBe(true);
  });

  it("assertCryptoPair rejects non-crypto with SCOPE_NON_CRYPTO", () => {
    for (const pair of ["XAU/USD", "EUR/USD", "NASDAQ", "AAPL"]) {
      expect(() => AssetRegistry.assertCryptoPair(pair)).toThrowError(/SCOPE_NON_CRYPTO/);
    }
  });
});

describe("T-03 unknown asset classification", () => {
  it("never silently accepts unknown pairs", () => {
    expect(AssetRegistry.find("FAKE/PAIR")).toBeUndefined();
    expect(() => AssetRegistry.assertCryptoPair("FAKE/PAIR")).toThrowError(/SCOPE_UNKNOWN_ASSET/);
    // desk-style non-crypto symbols normalize to unknown registry pairs → rejected
    expect(() => AssetRegistry.assertCryptoPair("XAUUSD/USDT")).toThrowError(/SCOPE_/);
  });

  it("desk-style crypto symbols normalize into the crypto boundary", () => {
    // "BTCUSD" desk format → "BTC/USDT" registry pair must resolve crypto
    const normalized = "BTCUSD".replace(/USD$/i, "");
    expect(() => AssetRegistry.assertCryptoPair(`${normalized}/USDT`)).not.toThrow();
  });
});

describe("T-04 meme coin acceptance", () => {
  it("keeps meme coins supported in the crypto registry (DOGE/USDT)", () => {
    const doge = AssetRegistry.get("DOGE/USDT");
    expect(doge.category).toBe("crypto");
    expect(doge.active).toBe(true);
  });

  it("token page asset typing still classifies meme coins as meme", async () => {
    const { detectAssetType } = await import("@/routes/_authenticated/token/constants");
    expect(detectAssetType("BONK")).toBe("meme");
    expect(detectAssetType("PEPE")).toBe("meme");
    expect(detectAssetType("BTC")).toBe("crypto");
  });
});

describe("T-05 entry-point guards present (watchlist, trade journal)", () => {
  it("watchlist accepts crypto category only and asserts crypto pairs", () => {
    const src = read("src/domains/watchlist/functions.ts");
    expect(src).toContain('category: z.enum(["crypto"])');
    expect(src).not.toContain('"forex"');
    expect(src).toContain("assertCryptoPair(data.pair)");
  });

  it("trade journal asserts crypto pairs before insert", () => {
    const src = read("src/domains/trades/functions.ts");
    expect(src).toContain("assertCryptoPair(data.pair)");
  });
});

describe("T-06 execution paths stay blocked (no user trade execution)", () => {
  it("legacy execution boundary is enabled (compile-time block)", async () => {
    const { LEGACY_EXECUTION_DISABLED } = await import("@/shared/security/legacy-execution");
    expect(LEGACY_EXECUTION_DISABLED).toBe(true);
  });

  it("executeTrade applies crypto scope + execution guard before adapters", () => {
    const src = read("src/domains/trading/gateway/functions.ts");
    const handler = src.slice(src.indexOf("export const executeTrade"));
    const assertIdx = handler.indexOf("assertCryptoPair(");
    const legacyIdx = handler.indexOf("assertLegacyExecutionEnabled()");
    const adapterIdx = handler.indexOf("createAdapterById");
    expect(assertIdx).toBeGreaterThan(-1);
    expect(legacyIdx).toBeGreaterThan(assertIdx); // scope first, then execution guard
    expect(adapterIdx).toBeGreaterThan(legacyIdx); // guards before any adapter use
  });

  it("swap transaction builders are guarded by the shared execution boundary", () => {
    const src = read("src/domains/trade/functions.ts");
    for (const fn of ["getJupiterSwapTransaction", "get1inchSwapTransaction"]) {
      const chunk = src.slice(src.indexOf(`export const ${fn}`));
      const body = chunk.slice(0, chunk.indexOf("});"));
      expect(body, `${fn} must call assertLegacyExecutionEnabled`).toContain(
        "assertLegacyExecutionEnabled()",
      );
    }
  });

  it("no real exchange adapter is reachable while execution is disabled", async () => {
    const { assertLegacyExecutionEnabled } = await import("@/shared/security/legacy-execution");
    expect(() => assertLegacyExecutionEnabled()).toThrowError(
      /Real financial execution is temporarily disabled/,
    );
  });
});

describe("chain/asset identity edge cases", () => {
  it("find() is exact-pair (no fuzzy non-crypto leakage)", () => {
    expect(AssetRegistry.find("BTC")).toBeUndefined();
    expect(AssetRegistry.find("BTCUSDT")).toBeUndefined();
    expect(AssetRegistry.find("BTC/USDT")).toBeDefined();
  });

  it("crypto count in registry matches the approved 12 crypto definitions", () => {
    const cryptoDefs = AssetRegistry.all().filter((a) => a.category === "crypto" && a.active);
    expect(cryptoDefs.length).toBe(12);
  });
});
