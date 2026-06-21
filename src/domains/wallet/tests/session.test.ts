import { describe, it, expect } from "vitest";
import { signWalletJwt, verifyWalletJwt } from "../functions";
import type { WalletJwtPayload } from "../types";

describe("wallet session JWT", () => {
  // Note: These tests use the real signWalletJwt/verifyWalletJwt functions
  // which depend on CREDENTIAL_ENCRYPTION_KEY env var.
  // If not set, signWalletJwt will throw.

  const validPayload: WalletJwtPayload = {
    sid: "test-session-id",
    uid: "test-user-id",
    wallet: "So11111111111111111111111111111111111111112",
    chain: "solana",
    ip: "127.0.0.1",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
  };

  describe("signWalletJwt", () => {
    it("throws if CREDENTIAL_ENCRYPTION_KEY is not set", async () => {
      const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
      delete process.env.CREDENTIAL_ENCRYPTION_KEY;
      delete process.env.WALLET_JWT_SECRET;

      await expect(signWalletJwt(validPayload)).rejects.toThrow("Wallet JWT secret not configured");

      // Restore
      if (originalKey) process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
    });

    it("returns a JWT string with 3 parts when key is set", async () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = "test-secret-key-for-unit-tests-only";
      const token = await signWalletJwt(validPayload);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("produces different tokens for different payloads", async () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = "test-secret-key-for-unit-tests-only";
      const payload2: WalletJwtPayload = {
        ...validPayload,
        sid: "different-session-id",
      };

      const token1 = await signWalletJwt(validPayload);
      const token2 = await signWalletJwt(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyWalletJwt", () => {
    it("returns null if CREDENTIAL_ENCRYPTION_KEY is not set", async () => {
      const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
      delete process.env.CREDENTIAL_ENCRYPTION_KEY;
      delete process.env.WALLET_JWT_SECRET;

      const result = await verifyWalletJwt("any.token.here");
      expect(result).toBeNull();

      if (originalKey) process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
    });

    it("returns the payload for a valid token", async () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = "test-secret-key-for-unit-tests-only";
      const token = await signWalletJwt(validPayload);
      const payload = await verifyWalletJwt(token);

      expect(payload).not.toBeNull();
      expect(payload!.sid).toBe("test-session-id");
      expect(payload!.uid).toBe("test-user-id");
      expect(payload!.wallet).toBe("So11111111111111111111111111111111111111112");
      expect(payload!.chain).toBe("solana");
    });

    it("returns null for an expired token", async () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = "test-secret-key-for-unit-tests-only";
      const expiredPayload: WalletJwtPayload = {
        ...validPayload,
        iat: Math.floor(Date.now() / 1000) - 1200,
        exp: Math.floor(Date.now() / 1000) - 600, // Expired 10 minutes ago
      };

      const token = await signWalletJwt(expiredPayload);
      const result = await verifyWalletJwt(token);

      expect(result).toBeNull();
    });

    it("returns null for a tampered token", async () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = "test-secret-key-for-unit-tests-only";
      const token = await signWalletJwt(validPayload);
      const [header, body] = token.split(".");
      const tamperedToken = `${header}.${body}.deadbeef`;

      const result = await verifyWalletJwt(tamperedToken);
      expect(result).toBeNull();
    });

    it("returns null for a malformed token", async () => {
      process.env.CREDENTIAL_ENCRYPTION_KEY = "test-secret-key-for-unit-tests-only";
      expect(await verifyWalletJwt("not-a-jwt")).toBeNull();
      expect(await verifyWalletJwt("a.b")).toBeNull();
      expect(await verifyWalletJwt("")).toBeNull();
    });
  });
});
