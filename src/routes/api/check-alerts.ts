import { createAPIFileRoute } from "@tanstack/react-start/api";
import { checkAllAlerts } from "@/server/alert-checker.server";

export const APIRoute = createAPIFileRoute("/api/check-alerts")({
  POST: async ({ request }) => {
    try {
      // Simple auth: check for a cron secret or just allow it
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
  GET: async () => {
    // Allow GET for easy cron service invocation (e.g., UptimeRobot)
    try {
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
