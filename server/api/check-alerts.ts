import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { checkAllAlerts } from "@/domains/trading/server/alert-checker";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Both GET and POST are supported so Vercel Cron and manual triggers work
  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Validate CRON_SECRET when set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  }

  try {
    const result = await checkAllAlerts();
    return result;
  } catch (error) {
    console.error("Alert check error:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
