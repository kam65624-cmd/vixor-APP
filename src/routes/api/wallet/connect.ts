// ============================================================================
// VIXOR Wallet Connect API Route
// ============================================================================
// GET  /api/wallet/connect?address=...&chain=... — Get challenge nonce
// POST /api/wallet/connect — Verify signature & create session
// ============================================================================

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { z } from "zod";

const GetChallengeSchema = z.object({
  address: z.string().min(1),
  chain: z.enum(["solana", "evm"]),
});

const VerifySignatureSchema = z.object({
  address: z.string().min(1),
  chain: z.enum(["solana", "evm"]),
  signature: z.string().min(1),
  message: z.string().min(1),
  nonce: z.string().min(16),
});

export const APIRoute = createAPIFileRoute({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get("address");
    const chain = url.searchParams.get("chain");

    if (!address || !chain) {
      return Response.json({ error: "Missing address or chain" }, { status: 400 });
    }

    const parsed = GetChallengeSchema.safeParse({ address, chain });
    if (!parsed.success) {
      return Response.json({ error: "Invalid params" }, { status: 400 });
    }

    try {
      const { generateChallengeMessage, generateNonce, isValidWalletAddress } =
        await import("@/domains/wallet/config");

      if (!isValidWalletAddress(parsed.data.address, parsed.data.chain)) {
        return Response.json({ error: "Invalid wallet address" }, { status: 400 });
      }

      const nonce = generateNonce();
      const message = generateChallengeMessage(nonce);

      const { cache } = await import("@/shared/cache");
      await cache.set(`wallet:nonce:${parsed.data.address}:${parsed.data.chain}`, nonce, 300_000);

      return Response.json({ nonce, message });
    } catch (err) {
      console.error("[Wallet Connect GET]", err);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const parsed = VerifySignatureSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Invalid params" }, { status: 400 });
      }

      const { address, chain, signature, message, nonce } = parsed.data;

      const { cache } = await import("@/shared/cache");
      const storedNonce = await cache.get<string>(`wallet:nonce:${address}:${chain}`);
      if (!storedNonce || storedNonce !== nonce) {
        return Response.json({ error: "Invalid or expired nonce" }, { status: 401 });
      }
      await cache.delete(`wallet:nonce:${address}:${chain}`);

      const { verifyWalletSignature, connectWallet } = await import("@/domains/wallet/server");
      const valid = await verifyWalletSignature(address, message, signature, chain);
      if (!valid) {
        return Response.json({ error: "Signature verification failed" }, { status: 401 });
      }

      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "127.0.0.1";
      const ua = request.headers.get("user-agent") || "unknown";

      const userId = "00000000-0000-0000-0000-000000000001";

      const result = await connectWallet(
        { address, chain, signature, message, nonce },
        userId, ip, ua,
      );

      if (!result.success) {
        return Response.json({ error: "Session creation failed" }, { status: 500 });
      }

      const response = Response.json({ success: true, session: result.session });
      if (result.token) {
        response.headers.append(
          "Set-Cookie",
          `vixor-wallet-token=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7*24*60*60}; Secure`,
        );
      }
      return response;
    } catch (err) {
      console.error("[Wallet Connect POST]", err);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
});
