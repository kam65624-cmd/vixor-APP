// VIXOR IP Fingerprint API Route
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute({
  GET: async ({ request }) => {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (process.env.WALLET_JWT_SECRET || "vixor"));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
    return Response.json({ fingerprint: ipHash, ...(process.env.NODE_ENV === "development" ? { ip } : {}) });
  },
});
