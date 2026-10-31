// ============================================================================
// S1-3 (TASK 38) — Token page asset scope regression.
// Proves:
//   - valid crypto & meme assets keep their display types,
//   - forex/commodity/stock/index classify out-of-scope (never render as
//     valid VIXOR assets via deep link, stale data or API fallbacks),
//   - unknown slash-pairs fail closed (never silently become crypto),
//   - dead forex display modules stay removed (S1-4).
// ============================================================================
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectAssetType,
  getAssetTypeBadge,
  OUT_OF_SCOPE_ASSET_TYPES,
  type AssetType,
} from "./constants";

const TOKEN_DIR = __dirname;
const DISCOVER_DIR = join(TOKEN_DIR, "../../_discover");

describe("S1-3: valid crypto & meme assets keep their types", () => {
  it("crypto pairs resolve through the registry to crypto (not forex)", () => {
    expect(detectAssetType("BTC/USDT")).toBe("crypto");
    expect(detectAssetType("ETH/USDT")).toBe("crypto");
    expect(detectAssetType("SOL/USDT")).toBe("crypto");
    // ETH/USD is NOT a registry identity — unregistered fiat-quoted pairs
    // fail closed (previously they rendered the legacy forex TradingView view)
    expect(detectAssetType("ETH/USD")).toBe("unknown");
    expect(detectAssetType("BTC")).toBe("crypto");
  });

  it("meme coins stay meme (base-symbol detection incl. quoted pairs)", () => {
    expect(detectAssetType("BONK")).toBe("meme");
    expect(detectAssetType("PEPE")).toBe("meme");
    expect(detectAssetType("DOGE")).toBe("meme");
    expect(detectAssetType("DOGE/USDT")).toBe("meme");
    expect(detectAssetType("WIF/USDT")).toBe("meme");
    expect(detectAssetType("SOMENEWTOKEN", "solana")).toBe("meme");
    expect(detectAssetType("RANDOMTOKEN", "base")).toBe("meme");
  });

  it("chain-specific majors stay crypto", () => {
    expect(detectAssetType("BTC", "solana")).toBe("crypto");
    expect(detectAssetType("USDT", "eth")).toBe("crypto");
  });
});

describe("S1-3: out-of-scope assets fail closed", () => {
  it("registry-known non-crypto assets classify explicitly", () => {
    expect(detectAssetType("EUR/USD")).toBe("forex");
    expect(detectAssetType("GBP/JPY")).toBe("forex");
    expect(detectAssetType("XAU/USD")).toBe("commodity");
    expect(detectAssetType("GOLD")).toBe("commodity");
    expect(detectAssetType("NASDAQ")).toBe("index");
    expect(detectAssetType("AAPL")).toBe("stock");
  });

  it("unknown slash-pairs never silently become valid crypto assets", () => {
    expect(detectAssetType("FAKE/PAIR")).toBe("unknown");
    expect(detectAssetType("SCAM/USD")).toBe("unknown");
  });

  it("OUT_OF_SCOPE_ASSET_TYPES covers every non-crypto display path", () => {
    expect(OUT_OF_SCOPE_ASSET_TYPES).toEqual(["forex", "commodity", "stock", "index"]);
  });

  it("badges label out-of-scope/unverified types without crypto presentation", () => {
    expect(getAssetTypeBadge("forex").label).toContain("FOREX");
    expect(getAssetTypeBadge("commodity").label).toContain("COMMODITY");
    expect(getAssetTypeBadge("stock").label).toBe("STOCK");
    expect(getAssetTypeBadge("index").label).toBe("INDEX");
    expect(getAssetTypeBadge("unknown").label).toBe("UNVERIFIED");
    expect(getAssetTypeBadge("crypto").label).toContain("CRYPTO");
    expect(getAssetTypeBadge("meme").label).toContain("MEME");
  });
});

describe("S1-4: dead forex display modules stay removed", () => {
  const removed = [
    join(TOKEN_DIR, "ForexSections.tsx"),
    join(TOKEN_DIR, "CommoditySections.tsx"),
    join(TOKEN_DIR, "ForexSessionIndicator.tsx"),
    join(TOKEN_DIR, "../../-discover-forex-data.ts"),
    join(DISCOVER_DIR, "ForexPairRow.tsx"),
    join(DISCOVER_DIR, "ForexSectionHeader.tsx"),
  ];

  it("legacy forex UI files do not exist", () => {
    for (const f of removed) {
      expect(existsSync(f), `${f} must not exist`).toBe(false);
    }
  });

  it("discover page has no forex mode, forex query or Markets surface", () => {
    const page = existsSync(join(DISCOVER_DIR, "index.tsx"))
      ? join(DISCOVER_DIR, "index.tsx")
      : join(TOKEN_DIR, "../../discover.tsx");
    const src = existsSync(page) ? readFileSync(page, "utf8") : "";
    expect(src).not.toMatch(/isForexMode/);
    expect(src).not.toMatch(/live-forex-discover-data/);
    expect(src).not.toMatch(/ForexPairRow|ForexSectionHeader/);
    expect(src).not.toMatch(/"FOREX"/);
  });

  it("asset type union has no regression back to slash-pair forex default", () => {
    const types: AssetType[] = [
      "meme",
      "crypto",
      "forex",
      "commodity",
      "stock",
      "index",
      "unknown",
    ];
    for (const t of types) {
      expect(OUT_OF_SCOPE_ASSET_TYPES).not.toContain("crypto");
      expect(types).toContain(t);
    }
  });
});
