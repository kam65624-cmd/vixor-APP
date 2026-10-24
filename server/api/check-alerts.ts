import { defineEventHandler, getMethod, getHeader, createError, setResponseStatus } from "h3";
import { checkAllAlerts } from "@/domains/trading/server/alert-checker";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight, isCronRequestAuthorized, validateAdminKey } from "./_security";

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  const method = getMethod(event);

  if (method !== "GET" && method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Admin key or configured CRON_SECRET bearer is required in production.
  if (validateAdminKey(event)) {
    // Authenticated via admin key — proceed
  } else {
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorizedCron = isCronRequestAuthorized(
      getHeader(event, "authorization"),
      cronSecret,
      process.env.NODE_ENV,
    );

    if (isAuthorizedCron) {
      // Authorized by CRON_SECRET or an explicit development/test environment.
    } else if (cronSecret) {
      const authHeader = getHeader(event, "authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        setResponseStatus(event, 401);
        return { error: "Unauthorized" };
      }
    } else {
      console.error("[CRON SECURITY] CRON_SECRET is unset outside development/test. Refusing.");
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
