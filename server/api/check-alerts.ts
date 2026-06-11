import { defineEventHandler, getMethod, getHeader, createError } from "h3";
import { checkAllAlerts } from "@/domains/trading/server/alert-checker";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Security: Verify this is a legitimate cron request
  // Accept 2 sources:
  //   1. Vercel Cron (sends x-vercel-cron: 1 header automatically)
  //   2. Manual trigger with CRON_SECRET via Authorization: Bearer <secret>
  const isVercelCron = getHeader(event, "x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (isVercelCron) {
    // Vercel Cron requests are automatically authenticated by Vercel's infrastructure
  } else if (cronSecret) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[CRON SECURITY] Request is not from Vercel Cron and CRON_SECRET is not set. Refusing.");
    throw createError({ statusCode: 500, statusMessage: "Cron not configured" });
  }

  try {
    const result = await checkAllAlerts();
    return result;
  } catch (error) {
    console.error("Alert check error:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
