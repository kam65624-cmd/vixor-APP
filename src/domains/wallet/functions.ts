// ============================================================================
// VIXOR Wallet Domain — Server Functions
// ============================================================================
//
// Server-side functions for wallet connection, session management, and
// signature verification. These run ONLY on the server (never in client bundles).
//
// Security model:
//   1. Client signs a challenge message with their wallet
//   2. Client sends { address, chain, signature, message, nonce } to server
//   3. Server verifies the signature (using @solana/web3.js or viem)
//   4. Server creates a wallet_sessions record in Supabase
//   5. Server issues a signed JWT (HS256, 7-day TTL)
//   6. Client stores JWT for subsequent wallet API calls
//   7. No private keys are ever stored or transmitted
// ============================================================================

import type {
  ConnectWalletRequest,
  ConnectWalletResponse,
  WalletChain,
  WalletJwtPayload,
  WalletSession,
} from "./types";
import {
  generateChallengeMessage,
  generateNonce,
  isValidWalletAddress,
  WALLET_SESSION_TTL_SECONDS,
  MAX_WALLET_SESSIONS_PER_USER,
} from "./config";
import { createClient } from "@supabase/supabase-js";

/**
 * Connect a wallet by verifying a signed challenge message.
 *
 * This is the core server function that:
 * 1. Validates the request
 * 2. Verifies the cryptographic signature
 * 3. Creates a session in Supabase
 * 4. Issues a JWT token
 *
 * @param request - The wallet connection request
 * @param userId - The authenticated user's ID (from Supabase Auth)
 * @param ipAddress - Client IP for fingerprinting
 * @param userAgent - Client user agent for fingerprinting
 * @returns ConnectWalletResponse with session and JWT
 * @throws Error if verification fails
 */
export async function connectWallet(
  request: ConnectWalletRequest,
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<ConnectWalletResponse> {
  const { address, chain, signature, message, nonce } = request;

  // ── Step 1: Validate inputs ──
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user ID");
  }
  if (!isValidWalletAddress(address, chain)) {
    throw new Error(`Invalid ${chain} wallet address: ${address}`);
  }
  if (!signature || typeof signature !== "string") {
    throw new Error("Invalid signature");
  }
  if (!message || typeof message !== "string") {
    throw new Error("Invalid challenge message");
  }
  if (!nonce || typeof nonce !== "string" || nonce.length < 16) {
    throw new Error("Invalid nonce");
  }

  // ── Step 2: Verify the challenge message contains the correct nonce ──
  if (!message.includes(nonce)) {
    throw new Error("Challenge message does not contain the expected nonce");
  }

  // ── Step 3: Verify the cryptographic signature ──
  const signatureValid = await verifyWalletSignature(address, message, signature, chain);
  if (!signatureValid) {
    throw new Error("Signature verification failed — the wallet owner could not be confirmed");
  }

  // ── Step 4: Create session in Supabase ──
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Deactivate old sessions for this user + wallet + chain (max sessions)
  await supabase
    .from("wallet_sessions")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("wallet_address", address)
    .eq("chain", chain)
    .eq("is_active", true);

  // Count active sessions across all wallets for this user
  const { count } = await supabase
    .from("wallet_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (count !== null && count >= MAX_WALLET_SESSIONS_PER_USER) {
    // Deactivate the oldest session
    const { data: oldest } = await supabase
      .from("wallet_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1);

    if (oldest && oldest.length > 0) {
      await supabase.from("wallet_sessions").update({ is_active: false }).eq("id", oldest[0].id);
    }
  }

  // Generate JWT
  const now = Math.floor(Date.now() / 1000);
  const sessionId = crypto.randomUUID();
  const jwtPayload: WalletJwtPayload = {
    sid: sessionId,
    uid: userId,
    wallet: address,
    chain,
    ip: ipAddress,
    iat: now,
    exp: now + WALLET_SESSION_TTL_SECONDS,
  };

  const token = await signWalletJwt(jwtPayload);
  const expiresAt = new Date(Date.now() + WALLET_SESSION_TTL_SECONDS * 1000).toISOString();

  // Insert new session
  const { data: session, error: insertError } = await supabase
    .from("wallet_sessions")
    .insert({
      id: sessionId,
      user_id: userId,
      wallet_address: address,
      chain,
      session_token: token,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true,
    })
    .select()
    .single();

  if (insertError || !session) {
    throw new Error(`Failed to create wallet session: ${insertError?.message ?? "unknown error"}`);
  }

  return {
    success: true,
    session: session as unknown as WalletSession,
    token,
  };
}

/**
 * Disconnect a wallet by deactivating its session.
 *
 * @param sessionId - The session ID to disconnect
 * @param userId - The authenticated user's ID
 * @throws Error if disconnection fails
 */
export async function disconnectWallet(sessionId: string, userId: string): Promise<void> {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("Invalid session ID");
  }
  if (!userId) {
    throw new Error("Invalid user ID");
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { error } = await supabase
    .from("wallet_sessions")
    .update({ is_active: false })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to disconnect wallet: ${error.message}`);
  }
}

/**
 * Get active wallet sessions for a user.
 *
 * @param userId - The authenticated user's ID
 * @returns Array of active wallet sessions
 */
export async function getWalletSessions(userId: string): Promise<WalletSession[]> {
  if (!userId) return [];

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabase
    .from("wallet_sessions")
    .select()
    .eq("user_id", userId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Wallet] Failed to fetch sessions:", error.message);
    return [];
  }

  return (data ?? []) as unknown as WalletSession[];
}

/**
 * Verify a wallet signature against a message.
 * Uses @solana/web3.js for Solana and viem's recoverMessageAddress for EVM.
 *
 * @param address - The signer's wallet address
 * @param message - The message that was signed
 * @param signature - The signature (base58 for Solana, hex for EVM)
 * @param chain - The blockchain network
 * @returns true if the signature is valid
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string,
  chain: WalletChain,
): Promise<boolean> {
  try {
    if (chain === "solana") {
      return await verifySolanaSignature(address, message, signature);
    }
    return await verifyEvmSignature(address, message, signature);
  } catch {
    return false;
  }
}

/**
 * Verify a Solana wallet signature using @solana/web3.js ed25519 verification.
 */
async function verifySolanaSignature(
  address: string,
  message: string,
  signature: string,
): Promise<boolean> {
  try {
    const { PublicKey } = await import("@solana/web3.js");
    const { verify } = await import("@noble/ed25519");

    // Decode base58 signature
    const bs58 = await import("bs58");
    const signatureBytes = bs58.default.decode(signature);
    const publicKeyBytes = new PublicKey(address).toBytes();
    const messageBytes = new TextEncoder().encode(message);

    return await verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Verify an EVM wallet signature using viem's recoverMessageAddress.
 * Uses a dynamic import to keep viem lazily loaded (same pattern as Solana verification).
 */
async function verifyEvmSignature(
  address: string,
  message: string,
  signature: string,
): Promise<boolean> {
  try {
    const { recoverMessageAddress } = await import("viem");

    // Ensure signature has 0x prefix — viem requires hex-prefixed values
    const normalizedSignature = signature.startsWith("0x") ? signature : `0x${signature}`;

    const recovered = await recoverMessageAddress({
      message,
      signature: normalizedSignature as `0x${string}`,
    });

    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Sign a wallet session JWT using HS256.
 * Uses the CREDENTIAL_ENCRYPTION_KEY as the signing secret.
 */
export async function signWalletJwt(payload: WalletJwtPayload): Promise<string> {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.WALLET_JWT_SECRET;
  if (!secret) {
    throw new Error("Wallet JWT secret not configured (CREDENTIAL_ENCRYPTION_KEY)");
  }

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const payloadStr = `${header}.${body}`;

  const signatureBuffer = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(payloadStr));

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureB64 = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return `${payloadStr}.${signatureB64}`;
}

/**
 * Verify and decode a wallet session JWT.
 * Returns the payload if valid, null if expired or invalid.
 */
export async function verifyWalletJwt(token: string): Promise<WalletJwtPayload | null> {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.WALLET_JWT_SECRET;
  if (!secret) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const payloadStr = `${parts[0]}.${parts[1]}`;
    const signatureHex = parts[2];

    // Convert hex signature back to Uint8Array
    const signatureBytes = new Uint8Array(
      signatureHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)),
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      secretKey,
      signatureBytes,
      encoder.encode(payloadStr),
    );

    if (!isValid) return null;

    const payload: WalletJwtPayload = JSON.parse(atob(parts[1]));

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
