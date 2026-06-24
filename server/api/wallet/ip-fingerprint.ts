// ============================================================================
// GET /api/wallet/ip-fingerprint
//
// Generates a client IP fingerprint for wallet session binding.
// Returns a hash of IP + User-Agent + random salt, stored in an httpOnly cookie.
// ============================================================================

import { createHash } from "crypto";
import { defineEventHandler, getHeader, getCookie, setCookie } from "h3";

export default defineEventHandler((event) => {
  // Reuse existing fingerprint from cookie if present
  let fingerprint = getCookie(event, "vixor-wallet-fp");

  if (!fingerprint) {
    // Generate from IP + user agent + random salt
    const ip =
      getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() ||
      getHeader(event, "x-real-ip") ||
      "unknown";
    const ua = getHeader(event, "user-agent") || "unknown";
    const salt = crypto.randomUUID();

    fingerprint = createHash("sha256")
      .update(`${ip}:${ua}:${salt}`)
      .digest("hex");

    setCookie(event, "vixor-wallet-fp", fingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches wallet session TTL)
      path: "/",
    });
  }

  return { hash: fingerprint };
});