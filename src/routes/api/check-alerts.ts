import { createAPIFileRoute } from "@tanstack/react-start/api";
import { checkAllAlerts } from "@/domains/trading/server/alert-checker";

export const APIRoute = createAPIFileRoute("/api/check-alerts")({
  POST: async ({ request }) => {
    try {
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
      }

      const result = await checkAllAlerts();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Alert check error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  GET: async ({ request }) => {
    try {
      // Vercel Cron sends GET requests with the CRON_SECRET in the
      // Authorization header, just like the POST handler.
      // When CRON_SECRET is set, validate it to prevent unauthorized access.
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret) {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
      }

      const result = await checkAllAlerts();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Alert check error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
