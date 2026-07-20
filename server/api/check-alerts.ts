import { defineEventHandler, getMethod, getHeader, createError, setResponseStatus } from "h3";
import { checkAllAlerts } from "@/domains/trading/server/alert-checker";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight, validateAdminKey } from "./_security";

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  const method = getMethod(event);

  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Security: Admin key (fast path) OR Vercel Cron OR Bearer CRON_SECRET
  if (validateAdminKey(event)) {
    // Authenticated via admin key — proceed
  } else {
    const isVercelCron = getHeader(event, "x-vercel-cron") === "1";
    const cronSecret = process.env.CRON_SECRET;

    if (isVercelCron) {
      // Vercel Cron requests are automatically authenticated by Vercel's infrastructure
    } else if (cronSecret) {
      const authHeader = getHeader(event, "authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        setResponseStatus(event, 401);
        return { error: "Unauthorized" };
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error(
        "[CRON SECURITY] Request is not from Vercel Cron and CRON_SECRET is not set. Refusing.",
      );
      setResponseStatus(event, 500);
      return { error: "Cron not configured" };
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

export default withRateLimit(handler, { maxRequests: 30, windowSec: 60 });
