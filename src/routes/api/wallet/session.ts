// ============================================================================
// VIXOR Wallet Session API Route
// ============================================================================
// GET  /api/wallet/session — List active sessions
// POST /api/wallet/session — Disconnect (deactivate) a session
// ============================================================================

import { createAPIFileRoute } from "@tanstack/react-start/api";
import { z } from "zod";

const DisconnectSchema = z.object({ sessionId: z.string().uuid() });

export const APIRoute = createAPIFileRoute({
  GET: async () => {
    try {
      const { getWalletSessions } = await import("@/domains/wallet/server");
      const userId = "00000000-0000-0000-0000-000000000001";
      const sessions = await getWalletSessions(userId);
      return Response.json({ sessions });
    } catch (err) {
      console.error("[Wallet Session GET]", err);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const parsed = DisconnectSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Invalid params" }, { status: 400 });
      }
      const { disconnectWallet } = await import("@/domains/wallet/server");
      const userId = "00000000-0000-0000-0000-000000000001";
      await disconnectWallet(parsed.data.sessionId, userId);
      return Response.json({ success: true });
    } catch (err) {
      console.error("[Wallet Session POST]", err);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  },
});
