import { defineEventHandler, getMethod, getHeader, createError, readBody } from "h3";
import { connectWallet, generateNonce, generateChallengeMessage } from "@/domains/wallet/server";
import { isValidWalletAddress } from "@/domains/wallet";
import { getSupabaseOrNull } from "@/shared/supabase/client";
import { handlePreflight, rateLimit } from "../_security";

// ============================================================================
// POST /api/wallet/connect
//
// Connects a wallet by verifying a signed challenge message.
// Returns a JWT session token.
//
// Flow:
//   1. Client calls GET /api/wallet/challenge first to get nonce + message
//   2. Client signs the message with their wallet
//   3. Client calls POST /api/wallet/connect with signed data
//   4. Server verifies signature and creates session
//
// Auth: Requires Supabase session (user must be logged in)
// ============================================================================

export default defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  if (!rateLimit(event)) return;

  const method = getMethod(event);
  if (method === "GET") {
    return handleChallenge(event);
  }
  if (method === "POST") {
    return handleConnect(event);
  }
  throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
});

/** GET /api/wallet/connect — Generate a challenge nonce + message */
async function handleChallenge(_event: Parameters<typeof defineEventHandler>[0]) {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const nonce = generateNonce();
  const message = generateChallengeMessage(nonce);

  // Store nonce in Upstash Redis with 5-minute TTL for verification
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.set(`wallet:nonce:${session.user.id}:${nonce}`, "1", {
      ex: 300, // 5 minutes
    });
  } catch (err) {
    console.error("[Wallet] Failed to store nonce in Redis:", err);
    // Continue anyway — verification will use nonce in message
  }

  return { nonce, message, expiresAt: Date.now() + 5 * 60 * 1000 };
}

/** POST /api/wallet/connect — Verify signed challenge and create session */
async function handleConnect(event: Parameters<typeof defineEventHandler>[0]) {
  const supabase = getSupabaseOrNull();
  if (!supabase) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  if (!authSession) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const body = await readBody(event);
  const { address, chain, signature, message, nonce } = body ?? {};

  if (!address || !chain || !signature || !message || !nonce) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields: address, chain, signature, message, nonce",
    });
  }

  if (!["solana", "evm"].includes(chain)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid chain. Must be 'solana' or 'evm'",
    });
  }

  if (!isValidWalletAddress(address, chain)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${chain} wallet address` });
  }

  // Verify nonce was actually issued by server (anti-replay)
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const nonceKey = `wallet:nonce:${authSession.user.id}:${nonce}`;
    const nonceExists = await redis.get(nonceKey);
    if (!nonceExists) {
      throw createError({
        statusCode: 403,
        statusMessage: "Invalid or expired challenge nonce — please request a new one",
      });
    }
    // Consume the nonce (one-time use)
    await redis.del(nonceKey);
  } catch (err) {
    // If Redis is unavailable, allow the request to proceed
    // (signature verification still proves wallet ownership)
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    console.error(
      "[Wallet] Redis nonce verification unavailable, proceeding with sig-only verification",
    );
  }

  // Get client IP for fingerprinting
  const ipAddress =
    getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
    getHeader(event, "x-real-ip") ||
    "unknown";
  const userAgent = getHeader(event, "user-agent") || "unknown";

  try {
    const result = await connectWallet(
      { address, chain, signature, message, nonce },
      authSession.user.id,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      session: result.session,
      token: result.token,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wallet connection failed";
    console.error("[Wallet] Connection failed:", message);
    throw createError({ statusCode: 403, statusMessage: message });
  }
}
