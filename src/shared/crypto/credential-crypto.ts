// ============================================================================
// VIXOR Credential Crypto — AES-256-GCM Encryption for User API Keys
// ============================================================================
//
// Uses Node.js `crypto` module for AES-256-GCM encryption with scrypt key
// derivation from `process.env.SECRET_KEY`.
//
// Wire format (base64url-encoded):
//   [12-byte IV] [N-byte ciphertext] [16-byte GCM auth tag]
//
// Usage:
//   import { encryptCredential, decryptCredential, maskApiKey } from "@/shared/crypto";
//   const token = encryptCredential({ apiKey: "sk-abc123" });
//   const data = decryptCredential<{ apiKey: string }>(token);
//   console.log(maskApiKey("sk-abc123def456")); // "sk-a...f456"
// ============================================================================

import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from "node:crypto";

// ── Constants ───────────────────────────────────────────────────────────────

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV is the GCM standard
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256-bit key
const SCRYPT_SALT = "vixor-credential-crypto-v1";

// ── Key derivation ──────────────────────────────────────────────────────────

let cachedKey: Buffer | null = null;
let cachedKeyFor: string | null = null;

/**
 * Derive a 32-byte AES key from `process.env.SECRET_KEY` using scrypt.
 *
 * Uses scrypt with N=2^15, r=8, p=1 per OWASP 2023 guidance for
 * interactive workloads. The result is cached to avoid recomputing
 * the expensive key derivation on every call.
 *
 * @returns A 32-byte Buffer suitable for AES-256-GCM.
 * @throws Error if `SECRET_KEY` is not set.
 */
export function getDerivedKey(): Buffer {
  const passphrase = process.env.SECRET_KEY ?? "";

  if (cachedKey && cachedKeyFor === passphrase) return cachedKey;

  if (!passphrase || passphrase.length === 0) {
    throw new Error(
      "SECRET_KEY is not set; cannot encrypt or decrypt credentials. " +
        "Set it to a 32-byte hex string (e.g. `openssl rand -hex 32`).",
    );
  }

  // If the passphrase looks like a 64-char hex string, use it directly
  if (/^[0-9a-fA-F]{64}$/.test(passphrase)) {
    const key = Buffer.from(passphrase, "hex");
    cachedKey = key;
    cachedKeyFor = passphrase;
    return key;
  }

  // Otherwise derive via scrypt
  const key = scryptSync(passphrase, SCRYPT_SALT, KEY_LENGTH, {
    N: 1 << 15,
    r: 8,
    p: 1,
    maxmem: 128 * 1024 * 1024, // 128 MB scratch space
  });

  cachedKey = key;
  cachedKeyFor = passphrase;
  return key;
}

// ── Encoding helpers ────────────────────────────────────────────────────────

/**
 * Convert a Buffer to a base64url string (URL-safe: replaces +/ with -_).
 */
function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Convert a base64url string back to a Buffer.
 */
function fromBase64Url(str: string): Buffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Encrypt a credential object using AES-256-GCM.
 *
 * The input object is JSON-stringified, encrypted, and returned as a
 * base64url-encoded string containing: IV + ciphertext + GCM auth tag.
 *
 * @param data - A plain object containing credential key-value pairs.
 * @returns A base64url-encoded encrypted token.
 *
 * @example
 *   const token = encryptCredential({ apiKey: "sk-abc123", secret: "xyz" });
 *   // Store `token` in the database
 */
export function encryptCredential(data: Record<string, string>): string {
  const key = getDerivedKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);

  const plaintext = JSON.stringify(data);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Wire format: iv || ciphertext || tag
  const blob = Buffer.concat([iv, ciphertext, tag]);
  return toBase64Url(blob);
}

/**
 * Decrypt a base64url-encoded token produced by `encryptCredential()`.
 *
 * Verifies the GCM auth tag before returning the plaintext. If the tag
 * fails verification (wrong key or tampered data), an error is thrown.
 *
 * @typeParam T - The expected shape of the decrypted object.
 * @param token - The base64url-encoded encrypted token.
 * @returns The original credential object.
 * @throws Error if the token is malformed or decryption fails.
 *
 * @example
 *   const data = decryptCredential<{ apiKey: string }>(token);
 *   console.log(data.apiKey); // "sk-abc123"
 */
export function decryptCredential<T extends Record<string, string>>(token: string): T {
  const key = getDerivedKey();
  const blob = fromBase64Url(token);

  if (blob.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error(
      `Cannot decrypt: token too short (expected at least ${IV_LENGTH + TAG_LENGTH} bytes, got ${blob.length})`,
    );
  }

  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(blob.length - TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH, blob.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  let plaintext: Buffer;
  try {
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) {
    throw new Error(
      "Cannot decrypt credential (wrong SECRET_KEY or data tampered). " +
        `Original: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return JSON.parse(plaintext.toString("utf8")) as T;
}

/**
 * Mask an API key for safe display — shows the first 4 and last 4 characters
 * only, with "..." in between.
 *
 * Keys shorter than 8 characters show only "***" (not enough chars to safely
 * show both prefix and suffix).
 *
 * @param apiKey - The API key to mask.
 * @returns The masked representation.
 *
 * @example
 *   maskApiKey("sk-abc123def456ghi789");  // "sk-a...i789"
 *   maskApiKey("short");                   // "***"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return "***";
  }
  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  return `${prefix}...${suffix}`;
}
