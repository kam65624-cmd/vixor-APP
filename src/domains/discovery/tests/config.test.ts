/**
 * @module domains/discovery/tests/config
 * @description Unit tests for Discovery domain configuration parsing.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { loadDiscoveryConfig, invalidateDiscoveryConfig, getDiscoveryConfig } from "../config";

describe("Discovery Config", () => {
  beforeEach(() => {
    invalidateDiscoveryConfig();
  });

  it("uses default values when no env vars set", () => {
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_ENABLED).toBe(true);
    expect(config.DISCOVERY_SCAN_INTERVAL_S).toBe(30);
    expect(config.DISCOVERY_PRICE_CACHE_TTL_S).toBe(30);
    expect(config.DISCOVERY_SOCIAL_CACHE_TTL_S).toBe(300);
    expect(config.DISCOVERY_MAX_TOKENS).toBe(100);
    expect(config.DEXSCREENER_API_URL).toBe("https://api.dexscreener.com/latest");
  });

  it("parses DISCOVERY_ENABLED=true from string", () => {
    process.env.DISCOVERY_ENABLED = "true";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_ENABLED).toBe(true);
    delete process.env.DISCOVERY_ENABLED;
  });

  it("parses DISCOVERY_ENABLED=false from string", () => {
    process.env.DISCOVERY_ENABLED = "false";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_ENABLED).toBe(false);
    delete process.env.DISCOVERY_ENABLED;
  });

  it("parses DISCOVERY_ENABLED=0 as false", () => {
    process.env.DISCOVERY_ENABLED = "0";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_ENABLED).toBe(false);
    delete process.env.DISCOVERY_ENABLED;
  });

  it("parses DISCOVERY_SCAN_INTERVAL_S from string", () => {
    process.env.DISCOVERY_SCAN_INTERVAL_S = "60";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_SCAN_INTERVAL_S).toBe(60);
    delete process.env.DISCOVERY_SCAN_INTERVAL_S;
  });

  it("clamps DISCOVERY_SCAN_INTERVAL_S to max 300", () => {
    process.env.DISCOVERY_SCAN_INTERVAL_S = "500";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_SCAN_INTERVAL_S).toBeLessThanOrEqual(300);
    delete process.env.DISCOVERY_SCAN_INTERVAL_S;
  });

  it("clamps DISCOVERY_SCAN_INTERVAL_S to min 5", () => {
    process.env.DISCOVERY_SCAN_INTERVAL_S = "1";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_SCAN_INTERVAL_S).toBeGreaterThanOrEqual(5);
    delete process.env.DISCOVERY_SCAN_INTERVAL_S;
  });

  it("parses DISCOVERY_MAX_TOKENS correctly", () => {
    process.env.DISCOVERY_MAX_TOKENS = "200";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_MAX_TOKENS).toBe(200);
    delete process.env.DISCOVERY_MAX_TOKENS;
  });

  it("clamps DISCOVERY_MAX_TOKENS to max 500", () => {
    process.env.DISCOVERY_MAX_TOKENS = "999";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_MAX_TOKENS).toBeLessThanOrEqual(500);
    delete process.env.DISCOVERY_MAX_TOKENS;
  });

  it("parses boolean DISCOVERY_ENABLED", () => {
    process.env.DISCOVERY_ENABLED = "true";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.DISCOVERY_ENABLED).toBe(true);
    delete process.env.DISCOVERY_ENABLED;
  });

  it("handles empty API keys gracefully", () => {
    const config = loadDiscoveryConfig();
    expect(config.BIRDEYE_API_KEY).toBe("");
    expect(config.HELIUS_RPC_URL).toBe("");
    expect(config.HELIUS_API_KEY).toBe("");
    expect(config.TWITTER_BEARER_TOKEN).toBe("");
    expect(config.LUNARCRUSH_API_KEY).toBe("");
  });

  it("reads API keys from env vars", () => {
    process.env.BIRDEYE_API_KEY = "test-key-123";
    invalidateDiscoveryConfig();
    const config = loadDiscoveryConfig();
    expect(config.BIRDEYE_API_KEY).toBe("test-key-123");
    delete process.env.BIRDEYE_API_KEY;
  });

  it("caches config on subsequent calls", () => {
    invalidateDiscoveryConfig();
    const config1 = getDiscoveryConfig();
    const config2 = getDiscoveryConfig();
    // Same reference (cached)
    expect(config1).toBe(config2);
  });

  it("invalidates cache correctly", () => {
    process.env.DISCOVERY_ENABLED = "true";
    const config1 = loadDiscoveryConfig();
    expect(config1.DISCOVERY_ENABLED).toBe(true);

    process.env.DISCOVERY_ENABLED = "false";
    invalidateDiscoveryConfig();
    const config2 = loadDiscoveryConfig();
    expect(config2.DISCOVERY_ENABLED).toBe(false);

    delete process.env.DISCOVERY_ENABLED;
    invalidateDiscoveryConfig();
  });
});
