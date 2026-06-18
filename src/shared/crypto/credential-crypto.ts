// ============================================================================
// VIXOR Credential Crypto — AES-256-GCM Encryption for User API Keys
// ============================================================================
//
// Port of QuantDinger's app/utils/credential_crypto.py (which used Fernet).
// VIXOR uses standard Node.js `crypto` AES-256-GCM with scrypt key derivation
// from the CREDENTIAL_ENCRYPTION_KEY env var.
//
// Wire format (base64-encoded):
//   [12-byte IV] [N-byte ciphertext] [16-byte GCM auth tag]
//
// All three components are required for decryption. The tag is appended
// (not prepended) to match the convention used by most GCM implementations.
//
// Usage:
//   import { encrypt, decrypt, rotateKey } from "@/shared/crypto/credential-crypto";
//
//   const blob = await encrypt(JSON.stringify({ apiKey: "sk-..." }));
//   // store `blob` in DB (text column)
//
//   const plaintext = await decrypt(blob); // → original JSON string
//
// Env var: CREDENTIAL_ENCRYPTION_KEY — a 32-byte hex string (64 hex chars)
//   Generate one with: openssl rand -hex 32
// ============================================================================

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// ── Constants ───────────────────────────────────────────────────────────────

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV is the GCM standard
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256-bit
const SALT = "vixor-credential-crypto-v1"; // fixed salt — key rotation requires determinism

// ── Key derivation ──────────────────────────────────────────────────────────

let cachedKey: Buffer | null = null;
let cachedKeyFor: string | null = null;

/**
 * Derive a 32-byte AES key from a passphrase via scrypt.
 * The same passphrase always yields the same key (deterministic), so key
 * rotation is possible by re-encrypting with a new passphrase.
 *
 * Uses scrypt with N=2^15 (cost), r=8, p=1 — appropriate for interactive
 * workloads (per OWASP 2023 guidance).
 */
function deriveKey(passphrase: string): Buffer {
  // Cache the most-recently-derived key to avoid recomputing scrypt on every
  // call. (scrypt is intentionally slow.)
  if (cachedKey && cachedKeyFor === passphrase) return cachedKey;

  if (!passphrase || passphrase.length === 0) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is not set; cannot encrypt or decrypt credentials. " +
        "Set it to a 32-byte hex string (e.g. `openssl rand -hex 32`).",
    );
  }

  // If the passphrase looks like a 64-char hex string, use it directly as the
  // key bytes (no need for slow scrypt). This is the recommended mode.
  if (/^[0-9a-fA-F]{64}$/.test(passphrase)) {
    const key = Buffer.from(passphrase, "hex");
    cachedKey = key;
    cachedKeyFor = passphrase;
    return key;
  }

  // Otherwise, derive via scrypt. Slower but more forgiving for users who
  // set a passphrase-style value.
  const key = scryptSync(passphrase, SALT, KEY_LENGTH, {
    N: 1 << 15,
    r: 8,
    p: 1,
    maxmem: 128 * 1024 * 1024, // 128 MB scrypt scratch
  });
  cachedKey = key;
  cachedKeyFor = passphrase;
  return key;
}

function getKey(): Buffer {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY ?? "";
  return deriveKey(raw);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string. Returns a base64-encoded blob containing
 * iv || ciphertext || auth tag.
 *
 * Empty/whitespace plaintext is allowed and returns an empty string for
 * convenience (matching the Python original's behavior).
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (plaintext == null) plaintext = "";
  const trimmed = String(plaintext);
  if (trimmed.length === 0) return "";

  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);

  const ciphertext = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes

  // Wire format: iv || ciphertext || tag (then base64)
  const blob = Buffer.concat([iv, ciphertext, tag]);
  return blob.toString("base64");
}

/**
 * Decrypt a base64-encoded blob produced by `encrypt()`.
 * Returns the original plaintext.
 *
 * @throws Error if the blob is malformed, the key is wrong, or the auth
 *         tag fails verification (tampered ciphertext).
 */
export async function decrypt(payload: string): Promise<string> {
  if (payload == null) return "";
  const s = String(payload).trim();
  if (s.length === 0) return "";

  const key = getKey();
  const blob = Buffer.from(s, "base64");

  if (blob.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error(
      "Cannot decrypt credential: blob is too short (expected at least " +
        `${IV_LENGTH + TAG_LENGTH} bytes, got ${blob.length}).`,
    );
  }

  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(blob.length - TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH, blob.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch (err) {
    throw new Error(
      "Cannot decrypt credential (wrong CREDENTIAL_ENCRYPTION_KEY or data " +
        "tampered). Original error: " +
        (err instanceof Error ? err.message : String(err)),
    );
  }
}

/**
 * Rotate the encryption key on a single payload.
 *
 * Decrypts with `oldKey`, re-encrypts with `newKey`. Both keys are passed
 * explicitly so the caller doesn't need to mutate the env var during rotation.
 *
 * @returns the re-encrypted blob under the new key.
 */
export async function rotateKey(oldKey: string, newKey: string, payload: string): Promise<string> {
  if (!payload || payload.trim().length === 0) return "";

  // Temporarily swap the cached key for decryption.
  const savedKey = cachedKey;
  const savedKeyFor = cachedKeyFor;
  cachedKey = null;
  cachedKeyFor = null;

  try {
    // Decrypt with old key.
    cachedKey = null;
    cachedKeyFor = oldKey;
    const oldKeyBuf = deriveKey(oldKey);
    cachedKey = oldKeyBuf;
    cachedKeyFor = oldKey;
    const plaintext = await decryptImplWithKey(oldKeyBuf, payload);

    // Encrypt with new key.
    cachedKey = null;
    cachedKeyFor = newKey;
    const newKeyBuf = deriveKey(newKey);
    cachedKey = newKeyBuf;
    cachedKeyFor = newKey;
    const reencrypted = await encryptImplWithKey(newKeyBuf, plaintext);

    return reencrypted;
  } finally {
    // Restore the cached key (or clear it so the next call derives from env).
    cachedKey = savedKey;
    cachedKeyFor = savedKeyFor;
  }
}

// ── Internal helpers (key-explicit versions for rotation) ───────────────────

async function encryptImplWithKey(key: Buffer, plaintext: string): Promise<string> {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

async function decryptImplWithKey(key: Buffer, payload: string): Promise<string> {
  const blob = Buffer.from(payload, "base64");
  if (blob.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Cannot decrypt: blob too short");
  }
  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(blob.length - TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH, blob.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}

// ── Synchronous variants (for cases where async is unnecessary) ─────────────

export function encryptSync(plaintext: string): string {
  if (plaintext == null) plaintext = "";
  const trimmed = String(plaintext);
  if (trimmed.length === 0) return "";
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

export function decryptSync(payload: string): string {
  if (payload == null) return "";
  const s = String(payload).trim();
  if (s.length === 0) return "";
  const key = getKey();
  const blob = Buffer.from(s, "base64");
  if (blob.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Cannot decrypt credential: blob too short");
  }
  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(blob.length - TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH, blob.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
