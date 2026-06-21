import { describe, it, expect } from "vitest";
import {
  generateNonce,
  generateChallengeMessage,
  isValidWalletAddress,
  CHAIN_CONFIGS,
  WALLET_SESSION_TTL_SECONDS,
  MAX_WALLET_SESSIONS_PER_USER,
  CHALLENGE_EXPIRY_SECONDS,
} from "../config";

describe("wallet config", () => {
  describe("generateNonce", () => {
    it("generates a 32-character hex nonce", () => {
      const nonce = generateNonce();
      expect(nonce).toHaveLength(32);
      expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    });

    it("generates unique nonces", () => {
      const nonces = new Set(Array.from({ length: 100 }, () => generateNonce()));
      expect(nonces.size).toBe(100);
    });
  });

  describe("generateChallengeMessage", () => {
    it("includes the nonce in the message", () => {
      const nonce = generateNonce();
      const message = generateChallengeMessage(nonce);
      expect(message).toContain(nonce);
    });

    it("includes VIXOR branding", () => {
      const nonce = generateNonce();
      const message = generateChallengeMessage(nonce);
      expect(message).toContain("VIXOR");
    });

    it("includes gas-free disclaimer", () => {
      const nonce = generateNonce();
      const message = generateChallengeMessage(nonce);
      expect(message).toContain("gas");
    });
  });

  describe("isValidWalletAddress", () => {
    it("validates Solana addresses correctly", () => {
      // Real Solana addresses (base58, 32-44 chars)
      expect(isValidWalletAddress("So11111111111111111111111111111111111111112", "solana")).toBe(
        true,
      );
      expect(isValidWalletAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "solana")).toBe(
        true,
      );
      expect(isValidWalletAddress("9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b", "solana")).toBe(
        true,
      );
    });

    it("rejects invalid Solana addresses", () => {
      expect(isValidWalletAddress("", "solana")).toBe(false);
      expect(isValidWalletAddress("0x1234", "solana")).toBe(false);
      expect(isValidWalletAddress("too_short", "solana")).toBe(false);
      expect(isValidWalletAddress("has spaces in it", "solana")).toBe(false);
    });

    it("validates EVM addresses correctly", () => {
      expect(isValidWalletAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F", "evm")).toBe(true);
      expect(isValidWalletAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "evm")).toBe(true);
    });

    it("rejects invalid EVM addresses", () => {
      expect(isValidWalletAddress("", "evm")).toBe(false);
      expect(isValidWalletAddress("0x1234", "evm")).toBe(false);
      expect(isValidWalletAddress("no_prefix", "evm")).toBe(false);
    });

    it("rejects null/undefined inputs", () => {
      expect(isValidWalletAddress("" as unknown as string, "solana")).toBe(false);
      expect(isValidWalletAddress(undefined as unknown as string, "evm")).toBe(false);
    });
  });

  describe("constants", () => {
    it("has correct session TTL (7 days)", () => {
      expect(WALLET_SESSION_TTL_SECONDS).toBe(7 * 24 * 60 * 60);
    });

    it("has reasonable max sessions per user", () => {
      expect(MAX_WALLET_SESSIONS_PER_USER).toBeGreaterThanOrEqual(3);
      expect(MAX_WALLET_SESSIONS_PER_USER).toBeLessThanOrEqual(10);
    });

    it("has reasonable challenge expiry (5 minutes)", () => {
      expect(CHALLENGE_EXPIRY_SECONDS).toBe(5 * 60);
    });

    it("has chain configs for solana and evm", () => {
      expect(CHAIN_CONFIGS).toHaveProperty("solana");
      expect(CHAIN_CONFIGS).toHaveProperty("evm");
      expect(CHAIN_CONFIGS.solana.nativeSymbol).toBe("SOL");
      expect(CHAIN_CONFIGS.evm.nativeSymbol).toBe("ETH");
      expect(CHAIN_CONFIGS.solana.nativeDecimals).toBe(9);
      expect(CHAIN_CONFIGS.evm.nativeDecimals).toBe(18);
      expect(CHAIN_CONFIGS.solana.explorerUrl).toContain("solscan.io");
      expect(CHAIN_CONFIGS.evm.explorerUrl).toContain("etherscan.io");
    });
  });
});
